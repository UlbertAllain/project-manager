import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/logs?projectId=xxx — returns logs for a specific project
// GET /api/logs (no projectId) — returns latest 20 logs across all projects
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    if (projectId) {
      // Project-specific logs
      const logs = await db.activityLog.findMany({
        where: { projectId },
        orderBy: { timestamp: "desc" },
      });
      return NextResponse.json({ data: logs });
    }

    // Global activity feed — latest 20 across all projects with project info
    const logs = await db.activityLog.findMany({
      take: 20,
      orderBy: { timestamp: "desc" },
      include: {
        project: { select: { projectName: true, id: true } },
      },
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
