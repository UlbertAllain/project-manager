import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/auth/profile — Update user profile name
export async function PATCH(req: NextRequest) {
  try {
    const { userId, name } = await req.json();
    if (!userId || !name) {
      return NextResponse.json(
        { error: "User ID dan nama wajib diisi" },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { name },
    });

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("PATCH /api/auth/profile error:", error);
    return NextResponse.json(
      { error: "Gagal update profil" },
      { status: 500 }
    );
  }
}
