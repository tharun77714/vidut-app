import React from 'react';
import { DragAndDrop } from '@/components/upload/drag-and-drop';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, Loader2, Video } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      <main className="container flex flex-col max-w-5xl px-6 py-16 mx-auto md:py-24">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
            Create your next project
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-lg">
            Upload your raw video. We&apos;ll automatically extract the audio and generate high-accuracy captions.
          </p>
          
          <div className="mt-10 w-full">
            <DragAndDrop />
          </div>
        </div>

        {/* Recent Projects Section */}
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Recent Projects</h2>
          </div>

          {!projects || projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-white/10 rounded-2xl bg-zinc-950/50">
              <Video className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">No projects yet. Upload a video to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  key={project.id}
                  className="group flex flex-col p-5 bg-zinc-900/50 border border-white/10 rounded-xl hover:bg-zinc-800/50 transition-all duration-300 hover:border-violet-500/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium truncate pr-4 group-hover:text-violet-400 transition-colors">
                      {project.title || 'Untitled Project'}
                    </h3>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }).format(new Date(project.created_at))}
                    </span>
                    {project.language && (
                      <span className="uppercase px-2 py-1 bg-zinc-800 rounded-md">
                        {project.language}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ready':
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 rounded-full">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ready
        </span>
      );
    case 'transcribing':
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium text-blue-400 bg-blue-400/10 rounded-full">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </span>
      );
    case 'queued':
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-400/10 rounded-full">
          <Clock className="w-3 h-3 mr-1" />
          Queued
        </span>
      );
    case 'failed':
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium text-red-400 bg-red-400/10 rounded-full">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    default:
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-400/10 rounded-full">
          {status}
        </span>
      );
  }
}
