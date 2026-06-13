'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-md p-8 bg-zinc-950 border border-red-500/20 rounded-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Something went wrong!</h2>
        <p className="text-zinc-400 mb-8">
          {error.message || "We couldn't load the project data. Please try again."}
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
