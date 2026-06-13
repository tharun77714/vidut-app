import { Loader2 } from 'lucide-react';

export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <h2 className="text-xl font-medium text-zinc-300">Loading project...</h2>
        <p className="text-zinc-500 text-sm">Fetching transcription data</p>
      </div>
    </div>
  );
}
