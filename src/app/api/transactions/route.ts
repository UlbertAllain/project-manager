import { db } from "@/lib/db";
import { createTransactionSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// GET /api/transactions — all transactions (global finance)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      const dateFilter: Record<string, string> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      where.date = dateFilter;
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { project: { select: { projectName: true } } },
    });

    return NextResponse.json({ data: transactions });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/transactions — create transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createTransactionSchema.parse(body);
    const { projectId, ...data } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId wajib diisi" },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json(
        { error: "Project tidak ditemukan" },
        { status: 404 }
      );
    }

    const transaction = await db.transaction.create({
      data: {
        ...validated,
        date: validated.date,
        projectId,
      },
    });

    // Recalculate project finance
    const allTransactions = await db.transaction.findMany({
      where: { projectId },
    });
    const totalIncome = allTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = allTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);

    let paymentStatus: string = "UNPAID";
    if (totalIncome >= project.budget) paymentStatus = "PAID";
    else if (totalIncome > 0) paymentStatus = "PARTIAL";

    await db.project.update({
      where: { id: projectId },
      data: { paidAmount: totalIncome, totalExpense, paymentStatus },
    });

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/transactions error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Validasi gagal", issues: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat transaksi" },
      { status: 500 }
    );
  }
}
