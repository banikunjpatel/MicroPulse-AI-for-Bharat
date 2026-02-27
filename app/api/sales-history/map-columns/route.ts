import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, mapping } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", fields: { session_id: "required" } } },
        { status: 422 }
      );
    }

    if (!mapping) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", fields: { mapping: "required" } } },
        { status: 422 }
      );
    }

    const [existing] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.sessionId, session_id));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(uploadSessions)
      .set({
        columnMapping: JSON.stringify(mapping),
        status: "mapped",
      })
      .where(eq(uploadSessions.sessionId, session_id))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        session_id: updated.sessionId,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Error saving column mapping:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to save column mapping" } },
      { status: 500 }
    );
  }
}
