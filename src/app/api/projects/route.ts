import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { title, s3Key, durationMs } = await request.json();

    if (!title || !s3Key) {
      return NextResponse.json({ error: 'Missing title or s3Key' }, { status: 400 });
    }

    // In a real app, auth.uid() would populate user_id automatically via RLS.
    // For Feature 001 testing without a login page, we will use the Service Role Key
    // to bypass RLS and insert a dummy user_id if needed, or if Auth is required,
    // you must be logged in. 
    
    // We'll attempt a standard insert first. If RLS blocks it (because you aren't logged in),
    // we'll need to disable RLS temporarily or handle auth.
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title,
        media_url: s3Key,
        duration_ms: durationMs || 0,
        status: 'queued', // Once uploaded, it's queued for transcription
        user_id: '00000000-0000-0000-0000-000000000000' // Mock ID if bypassing RLS, otherwise omit for Auth
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger Modal Worker asynchronously if webhook URL is configured
    const modalWebhookUrl = process.env.MODAL_WEBHOOK_URL;
    if (modalWebhookUrl) {
      fetch(modalWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, s3_key: s3Key })
      }).catch(err => console.error('Failed to trigger Modal worker:', err));
    }

    return NextResponse.json({ projectId: project.id });
  } catch (error: unknown) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
