import { db } from "@/lib/db";
import { updateProjectSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// GET /api/projects/[id] — single project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { order: "asc" } },
        attachments: true,
        transactions: { orderBy: { date: "desc" } },
        comments: { orderBy: { createdAt: "desc" } },
        logs: { orderBy: { timestamp: "desc" } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { ...project, techStack: JSON.parse(project.techStack || "[]") },
    });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/projects/[id] — update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = updateProjectSchema.parse(body);

    // Get old project for activity logging
    const oldProject = await db.project.findUnique({ where: { id } });
    if (!oldProject) {
      return NextResponse.json(
        { error: "Project tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.techStack) {
      updateData.techStack = JSON.stringify(validated.techStack);
    }

    const project = await db.project.update({
      where: { id },
      data: updateData,
    });

    // Log status changes
    if (validated.status && validated.status !== oldProject.status) {
      await db.activityLog.create({
        data: {
          projectId: id,
          action: "STATUS_CHANGED",
          message: `Status diubah dari ${oldProject.status} menjadi ${validated.status}.`,
        },
      });
    }

    // Log payment status changes
    if (
      validated.paymentStatus &&
      validated.paymentStatus !== oldProject.paymentStatus
    ) {
      await db.activityLog.create({
        data: {
          projectId: id,
          action: "PAYMENT_CHANGED",
          message: `Status pembayaran diubah dari ${oldProject.paymentStatus} menjadi ${validated.paymentStatus}.`,
        },
      });
    }

    // Log paid amount changes
    if (
      validated.paidAmount !== undefined &&
      validated.paidAmount !== oldProject.paidAmount
    ) {
      await db.activityLog.create({
        data: {
          projectId: id,
          action: "PAYMENT_CHANGED",
          message: `Jumlah dibayar diubah dari Rp ${oldProject.paidAmount.toLocaleString("id-ID")} menjadi Rp ${validated.paidAmount.toLocaleString("id-ID")}.`,
        },
      });
    }

    return NextResponse.json({
      data: { ...project, techStack: JSON.parse(project.techStack || "[]") },
    });
  } catch (error: unknown) {
    console.error("PATCH /api/projects/[id] error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Validasi gagal", issues: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] — delete project
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { error: "Project tidak ditemukan" },
        { status: 404 }
      );
    }

    // Log before delete
    await db.activityLog.create({
      data: {
        projectId: id,
        action: "DELETED",
        message: `Project "${project.projectName}" telah dihapus.`,
      },
    });

    await db.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus project" },
      { status: 500 }
    );
  }
}
