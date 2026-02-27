import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveFile, isUsingS3 } from "@/lib/storage";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("session_id") as string;
    const file = formData.get("file") as File;

    if (!sessionId || !file) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "session_id and file are required" } },
        { status: 422 }
      );
    }

    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.sessionId, sessionId));

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    if (isUsingS3()) {
      return NextResponse.json(
        { success: false, error: { code: "S3_MODE", message: "Please upload to S3 using presigned URL" } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = process.env.UPLOAD_DIR || "./uploads/sales";
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localPath = path.join(uploadDir, `${sessionId}_${file.name}`);
    fs.writeFileSync(localPath, buffer);

    await db
      .update(uploadSessions)
      .set({
        status: "uploaded",
      })
      .where(eq(uploadSessions.sessionId, sessionId));

    return NextResponse.json({
      success: true,
      data: {
        session_id: sessionId,
        filename: file.name,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to upload file" } },
      { status: 500 }
    );
  }
}
