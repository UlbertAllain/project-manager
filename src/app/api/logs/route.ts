import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/logs?projectId=xxx
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId wajib diisi" },
        { status: 400 }
      );
    }

    const logs = await db.activityLog.findMany({
      where: { projectId },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
