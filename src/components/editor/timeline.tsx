'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { ZoomIn, ZoomOut, Type, Clock } from 'lucide-react';

export function Timeline() {
  const {
    segments,
    currentTime,
    duration,
    isPlaying,
    timelineZoom,
    editMode,
    setTimelineZoom,
    setEditMode,
    setCurrentTime,
    updateSegmentTiming,
  } = useEditorStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll timeline to keep playhead centered during playback
  useEffect(() => {
    if (scrollContainerRef.current && isPlaying) {
      const container = scrollContainerRef.current;
      const playheadX = currentTime * timelineZoom;
      const containerWidth = container.clientWidth;
      container.scrollLeft = playheadX - containerWidth / 2;
    }
  }, [currentTime, timelineZoom, isPlaying]);

  // Handle timeline click to seek video
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current || duration === 0) return;
    
    // Ignore clicks on segment/word buttons to avoid double seeking
    if ((e.target as HTMLElement).closest('button')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft;
    const clickedTime = clickX / timelineZoom;
    
    // Bounded between 0 and duration
    const boundedTime = Math.max(0, Math.min(clickedTime, duration));
    setCurrentTime(boundedTime);
  };

  // Generate tick marks for the timeline ruler
  const ticks = useMemo(() => {
    if (duration === 0) return [];
    const tickList = [];
    const interval = timelineZoom < 60 ? 5 : 2; // Ticks every 2 or 5 seconds depending on zoom
    
    for (let i = 0; i <= duration; i += interval) {
      tickList.push(i);
    }
    return tickList;
  }, [duration, timelineZoom]);

  const timelineWidth = duration * timelineZoom;

  return (
    <div className="flex flex-col h-40 bg-zinc-950 border-t border-white/5 shrink-0 select-none">
      {/* Timeline Controls Toolbar */}
      <div className="flex items-center justify-between px-4 h-9 bg-zinc-900/50 border-b border-white/5 shrink-0">
        {/* Toggle Mode */}
        <div className="flex p-0.5 bg-zinc-950 rounded-lg border border-white/5">
          <button
            onClick={() => setEditMode('line')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
              editMode === 'line'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Type className="w-3 h-3" />
            LINE MODE
          </button>
          <button
            onClick={() => setEditMode('word')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
              editMode === 'word'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Clock className="w-3 h-3" />
            WORD MODE
          </button>
        </div>

        {/* Playback Time Indicator */}
        <div className="text-[11px] font-mono text-zinc-400">
          <span className="text-white">{formatTime(currentTime)}</span>
          <span className="text-zinc-600"> / </span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimelineZoom(Math.max(40, timelineZoom - 15))}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="40"
            max="200"
            value={timelineZoom}
            onChange={(e) => setTimelineZoom(parseInt(e.target.value))}
            className="w-24 h-1 accent-violet-500 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
          <button
            onClick={() => setTimelineZoom(Math.min(200, timelineZoom + 15))}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div className="flex-1 flex min-h-0">
        {/* Track Label Sidebar */}
        <div className="w-24 border-r border-white/5 bg-zinc-950 flex flex-col justify-end pb-3 pl-3 shrink-0">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            {editMode === 'line' ? 'Captions' : 'Words'}
          </span>
        </div>

        {/* Scrollable Tracks */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative scrollbar-none"
          onClick={handleTimelineClick}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="h-full relative bg-zinc-900/10"
            style={{ width: `${timelineWidth}px` }}
          >
            {/* 1. Time Ruler Header */}
            <div className="h-6 border-b border-white/5 relative">
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute bottom-0 flex flex-col items-center"
                  style={{ left: `${t * timelineZoom}px`, transform: 'translateX(-50%)' }}
                >
                  <span className="text-[9px] font-mono text-zinc-500 mb-1">
                    {formatTimeShort(t)}
                  </span>
                  <div className="w-px h-1.5 bg-zinc-700" />
                </div>
              ))}
            </div>

            {/* 2. Audio Peak Visualization Track (Simulated) */}
            <div className="absolute inset-x-0 top-6 bottom-0 flex items-center opacity-15 pointer-events-none">
              <svg className="w-full h-12" xmlns="http://www.w3.org/2000/svg">
                <path
                  d={generateWaveformPath(segments, timelineZoom, duration)}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            {/* 3. Subtitle Block Tracks */}
            <div className="h-16 relative mt-3 px-1">
              {editMode === 'line' ? (
                // Line Mode blocks
                segments.map((seg) => (
                  <DraggableSegment
                    key={seg.id}
                    seg={seg}
                    isActive={currentTime >= seg.start && currentTime <= seg.end}
                    timelineZoom={timelineZoom}
                    setCurrentTime={setCurrentTime}
                    updateSegmentTiming={updateSegmentTiming}
                  />
                ))
              ) : (
                // Word Mode blocks
                segments.flatMap(s => s.words).map((w) => {
                  const isActive = currentTime >= w.start && currentTime <= w.end;
                  const left = w.start * timelineZoom;
                  const width = (w.end - w.start) * timelineZoom;

                  return (
                    <button
                      key={w.id}
                      onClick={() => setCurrentTime(w.start)}
                      className={`absolute h-8 rounded text-center px-1 flex items-center justify-center transition-all border ${
                        isActive
                          ? 'bg-violet-500/30 border-violet-400 text-white z-10'
                          : 'bg-zinc-900/50 border-white/5 hover:border-white/15 text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                        top: '8px',
                      }}
                      title={`${w.word} (${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s)`}
                    >
                      <span className="text-[9px] font-medium truncate w-full">
                        {w.word}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* 4. Playhead Vertical Tracker Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
              style={{ left: `${currentTime * timelineZoom}px` }}
            >
              {/* Playhead flag handle */}
              <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -translate-x-[4px] -translate-y-[2px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interactive Draggable Segment ────────────────────────────────────────

function DraggableSegment({
  seg,
  isActive,
  timelineZoom,
  setCurrentTime,
  updateSegmentTiming,
}: {
  seg: { id: number; start: number; end: number; text: string };
  isActive: boolean;
  timelineZoom: number;
  setCurrentTime: (t: number) => void;
  updateSegmentTiming: (id: number, start: number, end: number) => void;
}) {
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle left click, and don't interfere with standard clicks
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const initialStart = seg.start;
    const initialEnd = seg.end;
    let currentDelta = 0;

    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      currentDelta = deltaX / timelineZoom;
      setDragOffset(currentDelta);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      setDragOffset(0);
      
      if (Math.abs(currentDelta) > 0.05) {
        updateSegmentTiming(seg.id, initialStart + currentDelta, initialEnd + currentDelta);
      } else {
        // If it was just a tiny movement or click, treat as seek
        setCurrentTime(seg.start);
      }
      
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const currentStart = seg.start + dragOffset;
  const currentEnd = seg.end + dragOffset;
  const left = currentStart * timelineZoom;
  const width = (currentEnd - currentStart) * timelineZoom;

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`absolute h-9 rounded-md text-left px-2 py-1 flex flex-col justify-center transition-colors border select-none ${
        isActive || isDragging
          ? 'bg-violet-500/20 border-violet-500 text-white shadow-lg shadow-violet-500/10 z-20'
          : 'bg-zinc-800/40 border-white/5 hover:border-white/20 text-zinc-400 hover:text-zinc-200 z-10'
      }`}
      style={{
        left: `${Math.max(0, left)}px`,
        width: `${width}px`,
        top: '4px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      <span className="text-[10px] font-medium truncate w-full pointer-events-none">
        {seg.text}
      </span>
    </div>
  );
}

// ─── Timeline Helper Functions ──────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function formatTimeShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Generates a simulated SVG path representing speech activity waveforms
function generateWaveformPath(
  segments: { start: number; end: number }[],
  zoom: number,
  duration: number
): string {
  if (duration === 0) return '';
  
  let path = '';
  const step = 0.5; // Draw a wave peak every 0.5s
  
  for (let t = 0; t <= duration; t += step) {
    const isSpoken = segments.some(seg => t >= seg.start && t <= seg.end);
    // Generate height: spoken areas are higher (12px to 24px), silent areas are small noise (2px)
    const baseHeight = isSpoken ? 16 : 2;
    const randomModifier = Math.sin(t * 10) * 4;
    const height = Math.max(2, baseHeight + randomModifier);
    const x = t * zoom;
    
    if (t === 0) {
      path += `M ${x} 24 `;
    }
    
    // Draw double lines to look like sound wave
    path += `L ${x} ${24 - height} L ${x} ${24 + height} L ${x} 24 `;
  }
  return path;
}
