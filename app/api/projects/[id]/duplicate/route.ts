import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find original project with tasks
    const original = await db.project.findUnique({
      where: { id },
      include: { tasks: { orderBy: { order: "asc" } } },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Project tidak ditemukan" },
        { status: 404 }
      );
    }

    // Create duplicate
    const duplicate = await db.project.create({
      data: {
        projectName: `${original.projectName} (Copy)`,
        clientName: original.clientName,
        projectLead: original.projectLead,
        description: original.description,
        status: "NEW", // Reset status
        priority: original.priority,
        category: original.category,
        techStack: original.techStack, // Already a JSON string
        startDate: "", // Reset start date
        deadline: original.deadline,
        completedDate: null, // Reset completed date
        budget: original.budget,
        paidAmount: 0, // Reset payment
        totalExpense: 0, // Reset expense
        paymentStatus: "UNPAID", // Reset payment status
        progress: 0, // Reset progress
        notes: original.notes,
        tasks: {
          create: original.tasks.map((t, i) => ({
            title: t.title,
            isCompleted: false, // Reset completion
            order: i,
          })),
        },
      },
      include: {
        tasks: { orderBy: { order: "asc" } },
        attachments: true,
        transactions: true,
        comments: { orderBy: { createdAt: "desc" } },
        logs: { orderBy: { timestamp: "desc" } },
      },
    });

    // Create activity log for the duplicate
    await db.activityLog.create({
      data: {
        projectId: duplicate.id,
        action: "CREATED",
        message: `Project diduplikasi dari "${original.projectName}".`,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...duplicate,
          techStack: JSON.parse(duplicate.techStack || "[]"),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/[id]/duplicate error:", error);
    return NextResponse.json(
      { error: "Gagal menduplikasi project" },
      { status: 500 }
    );
  }
}
