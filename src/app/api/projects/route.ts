import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// GET /api/projects — list all projects
export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tasks: { orderBy: { order: "asc" } },
        attachments: true,
        transactions: { orderBy: { date: "desc" } },
        comments: { orderBy: { createdAt: "desc" } },
        logs: { orderBy: { timestamp: "desc" } },
      },
    });

    // Parse techStack JSON string back to array, exclude coverImage for performance
    const result = projects.map(({ coverImage: _ci, ...p }) => ({
      ...p,
      techStack: JSON.parse(p.techStack || "[]"),
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data project" },
      { status: 500 }
    );
  }
}

// POST /api/projects — create project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        ...validated,
        techStack: JSON.stringify(validated.techStack),
        paidAmount: 0,
        totalExpense: 0,
        paymentStatus: "UNPAID",
        progress: 0,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        projectId: project.id,
        action: "CREATED",
        message: `Project "${validated.projectName}" berhasil dibuat.`,
      },
    });

    return NextResponse.json(
      { data: { ...project, techStack: validated.techStack } },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/projects error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Validasi gagal", issues: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat project" },
      { status: 500 }
    );
  }
}
