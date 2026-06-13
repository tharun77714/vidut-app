import { Loader2 } from 'lucide-react';

export default function EditorLoading() {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Loading editor...</p>
      </div>
    </div>
  );
}
