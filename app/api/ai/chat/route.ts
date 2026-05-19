import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { message, projectId } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    let projectContext = '';
    if (projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { tasks: true, transactions: true },
      });
      if (project) {
        const completedTasks = project.tasks.filter((t) => t.isCompleted).length;
        projectContext = `\n\nKonteks project saat ini:\n- Nama: ${project.projectName}\n- Client: ${project.clientName}\n- Status: ${project.status}\n- Priority: ${project.priority}\n- Progress: ${project.progress}%\n- Budget: Rp ${project.budget.toLocaleString()}\n- Paid: Rp ${project.paidAmount.toLocaleString()}\n- Expense: Rp ${project.totalExpense.toLocaleString()}\n- Deadline: ${project.deadline}\n- Tasks: ${completedTasks}/${project.tasks.length} selesai\n- Tech Stack: ${JSON.parse(project.techStack).join(', ')}\n- Payment Status: ${project.paymentStatus}`;
      }
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `Kamu adalah asisten AI untuk Nexty Labs, sebuah project management app. Kamu membantu user menganalisis project, memberikan saran, dan menjawab pertanyaan tentang manajemen project. Jawab dalam Bahasa Indonesia yang natural dan profesional. Berikan jawaban yang ringkas dan actionable.${projectContext}`,
        },
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    });

    return Response.json({
      response:
        completion.choices[0]?.message?.content ||
        'Maaf, saya tidak bisa menjawab saat ini.',
    });
  } catch (error: unknown) {
    console.error('AI Chat error:', error);
    const message =
      error instanceof Error ? error.message : 'AI service error';
    return Response.json({ error: message }, { status: 500 });
  }
}
