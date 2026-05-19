import { db } from "@/lib/db";
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

// POST /api/seed — reset + seed demo data
export async function POST() {
  try {
    // ===== STEP 1: RESET — hapus semua data dulu =====
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
      await deleteCollection(collections[name]);
    }

    // ===== STEP 2: SEED — bikin data baru =====

    // Create demo user
    const user = await db.user.create({
      data: {
        email: "admin@nextylab.com",
        name: "Admin Nexty Labs",
        password: "admin123",
        role: "ADMIN",
      },
    });

    // Helper to create ISO date string
    const isoDate = (dateStr: string) => new Date(dateStr).toISOString();

    // Create demo projects
    const projects: { id: string; projectName: string }[] = [];

    // Project 1: E-Commerce
    const p1 = await db.project.create({
      data: {
        projectName: "Website E-Commerce TokoBaju",
        clientName: "PT Fashion Indonesia",
        projectLead: "Andi Pratama",
        description:
          "Pengembangan website e-commerce lengkap dengan payment gateway dan manajemen inventory.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        category: "WEB",
        techStack: JSON.stringify(["Next.js", "TypeScript", "Firebase", "Tailwind CSS"]),
        startDate: isoDate("2025-01-15"),
        deadline: isoDate("2025-03-30"),
        budget: 25000000,
        paidAmount: 12500000,
        totalExpense: 5000000,
        paymentStatus: "PARTIAL",
        progress: 55,
        tasks: {
          create: [
            { title: "Setup project & database schema", isCompleted: true, order: 0 },
            { title: "UI/UX Landing Page", isCompleted: true, order: 1 },
            { title: "Product catalog & filter", isCompleted: true, order: 2 },
            { title: "Shopping cart & checkout", isCompleted: false, order: 3 },
            { title: "Payment gateway integration", isCompleted: false, order: 4 },
            { title: "Admin dashboard", isCompleted: false, order: 5 },
          ],
        },
        attachments: {
          create: [
            { title: "Desain UI Figma", url: "https://figma.com/demo", platform: "Figma" },
            { title: "Source Code", url: "https://github.com/demo/project", platform: "GitHub" },
          ],
        },
        transactions: {
          create: [
            { type: "INCOME", amount: 7500000, description: "DP Tahap 1", date: isoDate("2025-01-20") },
            { type: "INCOME", amount: 5000000, description: "DP Tahap 2", date: isoDate("2025-02-15") },
            { type: "EXPENSE", amount: 3000000, description: "Bayar freelancer frontend", date: isoDate("2025-02-01") },
            { type: "EXPENSE", amount: 2000000, description: "Server & domain", date: isoDate("2025-02-10") },
          ],
        },
        comments: {
          create: [
            { userEmail: "admin@nextylab.com", message: "Design sudah diapprove client. Lanjut development." },
            { userEmail: "admin@nextylab.com", message: "Deadline mepet, perlu speed up di bagian checkout." },
          ],
        },
      },
    });
    projects.push({ id: p1.id, projectName: p1.projectName });

    await db.activityLog.create({
      data: { projectId: p1.id, action: "CREATED", message: `Project "${p1.projectName}" berhasil dibuat.` },
    });

    // Project 2: Mobile App
    const p2 = await db.project.create({
      data: {
        projectName: "Aplikasi Mobile Kasir Kafe",
        clientName: "Kopi Nusantara",
        projectLead: "Siti Rahayu",
        description: "Aplikasi POS mobile untuk manajemen kasir kafe dengan integrasi printer thermal.",
        status: "NEW",
        priority: "MEDIUM",
        category: "MOBILE",
        techStack: JSON.stringify(["React Native", "Expo", "Node.js"]),
        startDate: isoDate("2025-02-01"),
        deadline: isoDate("2025-05-01"),
        budget: 15000000,
        paidAmount: 0,
        totalExpense: 0,
        paymentStatus: "UNPAID",
        progress: 0,
      },
    });
    projects.push({ id: p2.id, projectName: p2.projectName });

    await db.activityLog.create({
      data: { projectId: p2.id, action: "CREATED", message: `Project "${p2.projectName}" berhasil dibuat.` },
    });

    // Project 3: Redesign
    const p3 = await db.project.create({
      data: {
        projectName: "Redesign Landing Page Startup",
        clientName: "TechVenture ID",
        projectLead: "Budi Santoso",
        description: "Redesign landing page dengan approach modern dan conversion-focused.",
        status: "FINISHING",
        priority: "URGENT",
        category: "DESIGN",
        techStack: JSON.stringify(["Figma", "Framer Motion", "Next.js"]),
        startDate: isoDate("2025-01-10"),
        deadline: isoDate("2025-02-28"),
        budget: 8000000,
        paidAmount: 8000000,
        totalExpense: 3500000,
        paymentStatus: "PAID",
        progress: 85,
        tasks: {
          create: [
            { title: "Research & moodboard", isCompleted: true, order: 0 },
            { title: "Wireframe", isCompleted: true, order: 1 },
            { title: "Hi-fi design", isCompleted: true, order: 2 },
            { title: "Development", isCompleted: true, order: 3 },
            { title: "Animation & polish", isCompleted: false, order: 4 },
          ],
        },
      },
    });
    projects.push({ id: p3.id, projectName: p3.projectName });

    await db.activityLog.create({
      data: { projectId: p3.id, action: "CREATED", message: `Project "${p3.projectName}" berhasil dibuat.` },
    });

    // Project 4: Joki Skripsi
    const p4 = await db.project.create({
      data: {
        projectName: "Skripsi Sistem Informasi Akademik",
        clientName: "Mahasiswa UNS",
        projectLead: "Andi Pratama",
        description: "Pembuatan sistem informasi akademik berbasis web untuk skripsi.",
        status: "REVIEW",
        priority: "HIGH",
        category: "JOKI SKRIPSI",
        techStack: JSON.stringify(["Laravel", "MySQL", "Bootstrap"]),
        startDate: isoDate("2024-11-01"),
        deadline: isoDate("2025-02-15"),
        budget: 5000000,
        paidAmount: 3000000,
        totalExpense: 500000,
        paymentStatus: "PARTIAL",
        progress: 90,
      },
    });
    projects.push({ id: p4.id, projectName: p4.projectName });

    await db.activityLog.create({
      data: { projectId: p4.id, action: "STATUS_CHANGED", message: `Status diubah dari IN_PROGRESS menjadi REVIEW.` },
    });

    // Project 5: Maintenance
    const p5 = await db.project.create({
      data: {
        projectName: "Maintenance Server & Website",
        clientName: "CV Maju Bersama",
        projectLead: "Siti Rahayu",
        description: "Bulanan maintenance server dan update konten website.",
        status: "IN_PROGRESS",
        priority: "LOW",
        category: "MAINTENANCE",
        techStack: JSON.stringify(["Linux", "Nginx", "WordPress"]),
        startDate: isoDate("2025-01-01"),
        deadline: isoDate("2025-12-31"),
        budget: 12000000,
        paidAmount: 2000000,
        totalExpense: 0,
        paymentStatus: "PARTIAL",
        progress: 15,
        transactions: {
          create: [
            { type: "INCOME", amount: 2000000, description: "Fee Januari", date: isoDate("2025-01-31") },
          ],
        },
      },
    });
    projects.push({ id: p5.id, projectName: p5.projectName });

    // Project 6: Consulting (Completed)
    const p6 = await db.project.create({
      data: {
        projectName: "Konsultasi Digital Transformation",
        clientName: "PT Tradisional Jaya",
        projectLead: "Budi Santoso",
        description: "Konsultasi strategi digitalisasi proses bisnis.",
        status: "COMPLETED",
        priority: "MEDIUM",
        category: "CONSULTING",
        techStack: JSON.stringify([]),
        startDate: isoDate("2024-12-01"),
        deadline: isoDate("2025-01-31"),
        completedDate: isoDate("2025-01-28"),
        budget: 10000000,
        paidAmount: 10000000,
        totalExpense: 0,
        paymentStatus: "PAID",
        progress: 100,
        transactions: {
          create: [
            { type: "INCOME", amount: 10000000, description: "Full payment konsultasi", date: isoDate("2025-01-28") },
          ],
        },
      },
    });
    projects.push({ id: p6.id, projectName: p6.projectName });

    return NextResponse.json({
      message: "Reset & seed berhasil! Semua data lama dihapus, data baru dibuat.",
      user: { email: user.email, name: user.name },
      projectsCreated: projects.length,
    });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Seed gagal", detail: message }, { status: 500 });
  }
}
