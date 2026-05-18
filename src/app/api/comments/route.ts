import { db } from "@/lib/db";
import { commentSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// GET /api/comments?projectId=xxx
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

    const comments = await db.comment.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/comments — add comment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = commentSchema.parse(body);
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId wajib diisi" },
        { status: 400 }
      );
    }

    const comment = await db.comment.create({
      data: {
        userEmail: validated.userEmail,
        message: validated.message,
        projectId,
      },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/comments error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Validasi gagal", issues: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menambah komentar" },
      { status: 500 }
    );
  }
}
