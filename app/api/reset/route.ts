import { collections, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// Helper to delete all documents in a collection
async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>) {
  const batchSize = 500;
  let deleted = 0;

  while (true) {
    const snap = await collectionRef.limit(batchSize).get();
    if (snap.empty) break;

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.size;

    if (snap.size < batchSize) break;
  }

  return deleted;
}

// DELETE /api/reset — hapus semua data di Firestore
export async function DELETE() {
  try {
    const results: Record<string, number> = {};

    // Delete all collections in order (child first, then parent)
    const collectionNames = [
      "activityLogs",
      "comments",
      "transactions",
      "attachments",
      "tasks",
      "projects",
      "users",
    ] as const;

    for (const name of collectionNames) {
      const count = await deleteCollection(collections[name]);
      results[name] = count;
    }

    return NextResponse.json({
      message: "Semua data berhasil dihapus",
      deleted: results,
    });
  } catch (error: unknown) {
    console.error("Reset error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Reset gagal", detail: message }, { status: 500 });
  }
}
