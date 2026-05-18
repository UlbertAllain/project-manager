import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/transactions/[id] — update transaction
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { type, amount, description, date } = body;

    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(description !== undefined && { description }),
        ...(date && { date }),
      },
    });

    // Recalculate project finance
    const projectId = existing.projectId;
    const allTransactions = await db.transaction.findMany({
      where: { projectId },
    });
    const totalIncome = allTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = allTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);

    const project = await db.project.findUnique({ where: { id: projectId } });
    let paymentStatus: string = "UNPAID";
    if (project && totalIncome >= project.budget) paymentStatus = "PAID";
    else if (totalIncome > 0) paymentStatus = "PARTIAL";

    await db.project.update({
      where: { id: projectId },
      data: { paidAmount: totalIncome, totalExpense, paymentStatus },
    });

    return NextResponse.json({ data: transaction });
  } catch (error) {
    console.error("PATCH /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal update transaksi" },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] — delete transaction
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    await db.transaction.delete({ where: { id } });

    // Recalculate project finance
    const projectId = existing.projectId;
    const allTransactions = await db.transaction.findMany({
      where: { projectId },
    });
    const totalIncome = allTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = allTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);

    const project = await db.project.findUnique({ where: { id: projectId } });
    let paymentStatus: string = "UNPAID";
    if (project && totalIncome >= project.budget) paymentStatus = "PAID";
    else if (totalIncome > 0) paymentStatus = "PARTIAL";

    await db.project.update({
      where: { id: projectId },
      data: { paidAmount: totalIncome, totalExpense, paymentStatus },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus transaksi" },
      { status: 500 }
    );
  }
}
