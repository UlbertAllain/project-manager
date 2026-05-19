import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { projects } = await request.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json({ error: 'Projects array is required' }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors: { index: number; errors: string[] }[] = [];

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];

      // Validate
      const validationErrors: string[] = [];
      if (!p.projectName?.trim()) validationErrors.push('Nama project wajib diisi');
      if (!p.clientName?.trim()) validationErrors.push('Nama client wajib diisi');

      if (validationErrors.length > 0) {
        failed++;
        errors.push({ index: i, errors: validationErrors });
        continue;
      }

      try {
        await db.project.create({
          data: {
            projectName: p.projectName,
            clientName: p.clientName,
            projectLead: p.projectLead || '',
            description: p.description || '',
            status: p.status || 'NEW',
            priority: p.priority || 'MEDIUM',
            category: p.category || 'WEB',
            budget: p.budget || 0,
            deadline: p.deadline || '',
            notes: p.notes || '',
            techStack: '[]',
          },
        });
        success++;
      } catch {
        failed++;
        errors.push({ index: i, errors: ['Gagal membuat project'] });
      }
    }

    return NextResponse.json({ success, failed, errors });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
