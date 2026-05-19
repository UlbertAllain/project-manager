import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { projectIds } = await request.json();

    const where = projectIds?.length
      ? { where: { id: { in: projectIds } } }
      : {};
    const projects = await db.project.findMany({
      ...where,
      include: { tasks: true, transactions: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (projects.length === 0) {
      return Response.json({
        insights: 'Belum ada project untuk dianalisis.',
      });
    }

    const projectSummary = projects
      .map((p) => {
        const completedTasks = p.tasks.filter((t) => t.isCompleted).length;
        return `${p.projectName} (${p.clientName}): Status=${p.status}, Progress=${p.progress}%, Budget=${p.budget}, Paid=${p.paidAmount}, Expense=${p.totalExpense}, Tasks=${completedTasks}/${p.tasks.length}, Deadline=${p.deadline}, Payment=${p.paymentStatus}`;
      })
      .join('\n');

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'Kamu adalah analis project management AI untuk Nexty Labs. Berikan analisis dalam Bahasa Indonesia yang ringkas dan terstruktur menggunakan format berikut:\n\n📊 **Ringkasan Portfolio**\n[ringkasan singkat kondisi portfolio]\n\n⚠️ **Risiko & Perhatian**\n[analisis risiko, project yang perlu perhatian]\n\n💡 **Rekomendasi**\n[rekomendasi actionable untuk improve]\n\n📈 **Prediksi**\n[prediksi berdasarkan tren data]',
        },
        {
          role: 'user',
          content: `Analisis portfolio project berikut:\n\n${projectSummary}\n\nTotal projects: ${projects.length}\nActive: ${projects.filter((p) => !['COMPLETED', 'CANCELLED'].includes(p.status)).length}\nOverdue: ${projects.filter((p) => p.deadline && new Date(p.deadline) < new Date() && p.status !== 'COMPLETED').length}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    return Response.json({
      insights:
        completion.choices[0]?.message?.content ||
        'Tidak dapat menganalisis saat ini.',
    });
  } catch (error: unknown) {
    console.error('AI Insights error:', error);
    const message =
      error instanceof Error ? error.message : 'AI service error';
    return Response.json({ error: message }, { status: 500 });
  }
}
