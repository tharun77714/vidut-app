import React from 'react';
import { useState } from 'react';
import { Video, FileText, Layers, X, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
}

export interface ExportOptions {
  type: 'video' | 'srt' | 'alpha';
  resolution: '1080p' | '4k';
  quality: 'standard' | 'high';
}

export function ExportModal({ isOpen, onClose, onExport, isExporting }: ExportModalProps) {
  const [exportType, setExportType] = useState<'video' | 'srt' | 'alpha'>('video');
  const [resolution, setResolution] = useState<'1080p' | '4k'>('1080p');
  const [quality, setQuality] = useState<'standard' | 'high'>('high');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={isExporting ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="text-xl font-semibold text-white">
            Export Options
          </h3>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-6 overflow-y-auto scrollbar-thin shrink">
          {/* Export Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400">Format</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setExportType('video')}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  exportType === 'video'
                    ? 'bg-violet-500/10 border-violet-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Video className="w-5 h-5" />
                <div>
                  <div className="font-medium">Video (MP4)</div>
                  <div className="text-xs opacity-70">Burn subtitles into video</div>
                </div>
              </button>
              <button
                onClick={() => setExportType('srt')}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  exportType === 'srt'
                    ? 'bg-violet-500/10 border-violet-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                <div>
                  <div className="font-medium">Subtitles (.srt)</div>
                  <div className="text-xs opacity-70">Text-only subtitle file</div>
                </div>
              </button>
              <button
                onClick={() => setExportType('alpha')}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  exportType === 'alpha'
                    ? 'bg-violet-500/10 border-violet-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Layers className="w-5 h-5" />
                <div>
                  <div className="font-medium">Alpha Channel (MOV)</div>
                  <div className="text-xs opacity-70">Transparent background for Premiere/Resolve</div>
                </div>
              </button>
            </div>
          </div>

          {/* Settings */}
          {exportType !== 'srt' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="1080p">1080p</option>
                  <option value="4k">4K (2160p)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Quality</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 shrink-0">
          <button
            onClick={() => onExport({ type: exportType, resolution, quality })}
            disabled={isExporting}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              isExporting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
            }`}
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
