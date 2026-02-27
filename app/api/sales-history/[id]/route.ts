import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.sessionId, id));

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: toSnakeCase(session),
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch session" } },
      { status: 500 }
    );
  }
}
