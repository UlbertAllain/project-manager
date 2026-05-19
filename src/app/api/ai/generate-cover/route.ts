import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { projectId, prompt } = await request.json();

    if (!projectId) {
      return Response.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const techStack = JSON.parse(project.techStack || '[]');
    const autoPrompt = prompt || `Professional abstract cover image for a ${project.category} project called "${project.projectName}", using ${techStack.join(', ')} technology, modern minimalist design, dark theme, geometric shapes, no text, digital art style, high quality`;

    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt: autoPrompt,
      size: '1344x768',
    });

    const base64Image = response.data[0].base64;

    // Save to database
    await db.project.update({
      where: { id: projectId },
      data: { coverImage: base64Image },
    });

    return Response.json({ coverImage: base64Image });
  } catch (error: unknown) {
    console.error('Cover generation error:', error);
    const message =
      error instanceof Error ? error.message : 'Image generation failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
