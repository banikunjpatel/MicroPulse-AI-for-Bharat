import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getPresignedUploadUrl, isUsingS3 } from "@/lib/storage";
import { randomUUID } from "crypto";

function toSnakeCase(session: typeof uploadSessions.$inferSelect) {
  return {
    session_id: session.sessionId,
    s3_key: session.s3Key,
    original_filename: session.originalFilename,
    row_count: session.rowCount,
    detected_columns: session.detectedColumns,
    column_mapping: session.columnMapping ? JSON.parse(session.columnMapping) : null,
    status: session.status,
    is_synthetic: session.isSynthetic,
    error_message: session.errorMessage,
    created_at: session.createdAt.toISOString(),
    updated_at: session.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const sessions = await db
      .select()
      .from(uploadSessions)
      .orderBy(desc(uploadSessions.createdAt));

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.map(toSnakeCase),
        total: sessions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch sessions" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, file_size_bytes, detected_columns } = body;

    if (!filename) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", fields: { filename: "required" } } },
        { status: 422 }
      );
    }

    const sessionId = randomUUID();
    
    let presignedUrl: string;
    let s3Key: string | undefined;
    
    if (isUsingS3()) {
      const result = await getPresignedUploadUrl(sessionId, filename);
      presignedUrl = result.url;
      s3Key = result.key;
    } else {
      const result = await getPresignedUploadUrl(sessionId, filename);
      presignedUrl = result.url;
      s3Key = result.key;
    }

    const [session] = await db
      .insert(uploadSessions)
      .values({
        sessionId,
        s3Key,
        originalFilename: filename,
        rowCount: 0,
        detectedColumns: detected_columns || [],
        status: "uploaded",
        isSynthetic: false,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: {
          session_id: sessionId,
          presigned_url: presignedUrl,
          is_s3: isUsingS3(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating upload session:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create upload session" } },
      { status: 500 }
    );
  }
}
