'use client';

import React, { useEffect, useState } from 'react';
import { Download, Loader2, Video, AlertCircle } from 'lucide-react';
import type { ExportStatus } from '@/components/editor/editor-client';

interface ExportStatusTrackerProps {
  projectId: string;
  initialStatus: ExportStatus;
}

export function ExportStatusTracker({ projectId, initialStatus }: ExportStatusTrackerProps) {
  const [exportStatus, setExportStatus] = useState<ExportStatus>(initialStatus);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (exportStatus === 'exporting') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/projects/${projectId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.export_status === 'completed' || data.export_status === 'failed') {
              setExportStatus(data.export_status);
              clearInterval(interval);
            }
          }
        } catch {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [exportStatus, projectId]);

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/download`);
      if (res.ok) {
        const { url } = await res.json();
        const a = document.createElement('a');
        a.href = url;
        a.download = `vidyut_export_${projectId}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("Download link not ready or expired.");
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (exportStatus === 'none') return null;

  return (
    <div className="mt-6 p-4 border border-white/10 bg-zinc-900/50 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        {exportStatus === 'exporting' ? (
          <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
        ) : exportStatus === 'completed' ? (
          <Video className="w-5 h-5 text-emerald-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-500" />
        )}
        <div>
          <h3 className="text-sm font-medium text-white">Video Export</h3>
          <p className="text-xs text-zinc-400">
            {exportStatus === 'exporting' ? 'Rendering subtitles into video...' :
             exportStatus === 'completed' ? 'Export finished successfully.' :
             'Export failed. Please try again from the editor.'}
          </p>
        </div>
      </div>

      {exportStatus === 'completed' && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Final Video
        </button>
      )}
    </div>
  );
}
