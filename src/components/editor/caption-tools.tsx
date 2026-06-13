import React from 'react';
import { Wand2, Sparkles, X, Minimize2, Type, Eraser } from 'lucide-react';
import { useEditorStore } from '@/store/editor-store';

export function CaptionTools() {
  const {
    autoLineBreak,
    removeFillers,
    removePunctuation,
    removeEmojis,
    restoreEmphasis,
    removeGaps,
  } = useEditorStore();

  return (
    <div className="flex flex-wrap gap-1 bg-zinc-900 p-1 rounded-lg">
      <button
        onClick={() => autoLineBreak(42)}
        className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition-colors"
        title="Auto Line Break (42 chars)"
      >
        <Wand2 className="w-4 h-4" />
      </button>
      <button
        onClick={removeFillers}
        className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition-colors"
        title="Remove Fillers (um, uh, like...)"
      >
        <Sparkles className="w-4 h-4" />
      </button>
      <button
        onClick={removePunctuation}
        className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition-colors"
        title="Remove Punctuation"
      >
        <Eraser className="w-4 h-4" />
      </button>
      <button
        onClick={removeEmojis}
        className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition-colors"
        title="Remove Emojis"
      >
        <X className="w-4 h-4" />
      </button>
      <button
        onClick={restoreEmphasis}
        className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition-colors"
        title="Restore Emphasis"
      >
        <Type className="w-4 h-4" />
      </button>
      <button
        onClick={removeGaps}
        className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition-colors"
        title="Remove Silence/Gaps"
      >
        <Minimize2 className="w-4 h-4" />
      </button>
    </div>
  );
}
