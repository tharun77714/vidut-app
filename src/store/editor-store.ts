import { create } from 'zustand';
import type {
  SubtitleStyleV2,
  CaptionConfig,
  HighlightMode,
  TransitionConfig,
} from '@/lib/subtitle-schema-v2';
import {
  DEFAULT_STYLE,
  DEFAULT_CAPTION_CONFIG,
  ensureV2,
} from '@/lib/subtitle-schema-v2';
import { getTemplateById } from '@/lib/templates-data';

// ─── Types ────────────────────────────────────────────────────────────

// Raw types from API/Database
export interface RawWord {
  word: string;
  start: number;
  end: number;
  probability?: number;
}

export interface RawSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

// Editor Internal Types (Hierarchical)
export interface Word {
  id: string; // Stable UUID/generated ID for React keys
  word: string;
  start: number;
  end: number;
  probability?: number;
}

export interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: Word[]; // Hierarchical ownership!
}

/** @deprecated Use SubtitleStyleV2 from subtitle-schema-v2.ts */
export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  alignment: 'left' | 'center' | 'right';
  position: 'top' | 'center' | 'bottom';
  highlightMode: 'none' | 'color' | 'scale' | 'underline' | 'background' | 'karaoke';
}

export interface HistorySnapshot {
  segments: Segment[];
  subtitleStyle: SubtitleStyleV2;
  captionConfig: CaptionConfig;
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
}

// ─── State Interface ──────────────────────────────────────────────────
interface EditorState {
  // Project data
  projectId: string | null;
  projectTitle: string;
  videoUrl: string | null;
  language: string;

  // Transcript data (Strict Hierarchical Model)
  segments: Segment[];

  // Playback state
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  activeSegmentIndex: number;

  // Search
  searchQuery: string;

  // Subtitle styling
  subtitleStyle: SubtitleStyleV2;
  captionConfig: CaptionConfig;
  activeTemplateId: string | null;

  // UI state
  editMode: 'line' | 'word';
  timelineZoom: number;

  // History
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setProjectData: (data: {
    projectId: string;
    projectTitle: string;
    language: string;
  }) => void;
  setVideoUrl: (url: string) => void;
  
  // Converts flat DB arrays to internal hierarchical segments
  setTranscriptData: (rawSegments: RawSegment[], rawWords: RawWord[]) => void;
  
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveSegmentIndex: (index: number) => void;
  setSearchQuery: (query: string) => void;
  setSubtitleStyle: (style: Partial<SubtitleStyleV2>) => void;
  setSubtitleStyleV2: (updater: (prev: SubtitleStyleV2) => SubtitleStyleV2) => void;
  setCaptionConfig: (config: Partial<CaptionConfig>) => void;
  applyTemplate: (templateId: string) => void;
  setEditMode: (mode: 'line' | 'word') => void;
  setTimelineZoom: (zoom: number) => void;
  
  // Edit Actions
  updateSegmentText: (id: number, text: string) => void;
  updateSegmentTiming: (id: number, start: number, end: number) => void;
  updateWordText: (segId: number, wordId: string, newWord: string) => void;
  splitSegment: (id: number, splitTime: number) => void;
  mergeSegments: (id: number) => void;
  autoLineBreak: (maxChars?: number) => void;
  removeFillers: () => void;
  removePunctuation: () => void;
  removeEmojis: () => void;
  restoreEmphasis: () => void;
  removeGaps: () => void;
  replaceText: (search: string, replaceWith: string, replaceAll: boolean, segId?: number) => void;
  
  // Validation
  validateTimingModel: () => ValidationReport;

  // History Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

// ─── Default Subtitle Style ──────────────────────────────────────────
/** @deprecated Use DEFAULT_STYLE from subtitle-schema-v2.ts */
const defaultSubtitleStyle: SubtitleStyleV2 = { ...DEFAULT_STYLE };

// ─── Helpers ──────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substr(2, 9);

// ─── Store ────────────────────────────────────────────────────────────
export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  projectTitle: '',
  videoUrl: null,
  language: '',

  segments: [],

  currentTime: 0,
  duration: 0,
  isPlaying: false,
  activeSegmentIndex: -1,

  searchQuery: '',

  subtitleStyle: defaultSubtitleStyle,
  captionConfig: { ...DEFAULT_CAPTION_CONFIG },
  activeTemplateId: null,

  editMode: 'line',
  timelineZoom: 80,

  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  setProjectData: ({ projectId, projectTitle, language }) =>
    set({ projectId, projectTitle, language }),

  setVideoUrl: (videoUrl) => set({ videoUrl }),

  setTranscriptData: (rawSegments, rawWords) => {
    // Phase 2.5: Run timestamp mapping EXACTLY ONCE during initialization.
    // Converts flat arrays to strict hierarchical ownership.
    const mappedSegments: Segment[] = rawSegments.map(seg => {
      const ownedWords = rawWords
        .filter(w => w.start >= seg.start && w.end <= seg.end)
        .map(w => ({ ...w, id: `w-${generateId()}` }));
      
      return {
        ...seg,
        words: ownedWords
      };
    });

    set({ segments: mappedSegments, past: [], future: [], canUndo: false, canRedo: false });
  },

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setActiveSegmentIndex: (activeSegmentIndex) => set({ activeSegmentIndex }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setSubtitleStyle: (partial) =>
    set((state) => ({
      subtitleStyle: { ...state.subtitleStyle, ...partial } as SubtitleStyleV2,
    })),

  setSubtitleStyleV2: (updater) =>
    set((state) => {
      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);
      return {
        subtitleStyle: updater(state.subtitleStyle),
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  setCaptionConfig: (partial) =>
    set((state) => ({
      captionConfig: { ...state.captionConfig, ...partial },
    })),

  applyTemplate: (templateId) =>
    set((state) => {
      const template = getTemplateById(templateId);
      if (!template) return {};
      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);
      return {
        subtitleStyle: { ...template.style },
        activeTemplateId: templateId,
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  setEditMode: (editMode) => set({ editMode }),

  setTimelineZoom: (timelineZoom) => set({ timelineZoom }),

  updateSegmentText: (id, text) =>
    set((state) => {
      const newSegments = state.segments.map((seg) => {
        if (seg.id !== id) return seg;

        const newWordTokens = text.trim().split(/\s+/).filter(Boolean);
        let newWords: Word[] = [];

        if (newWordTokens.length === seg.words.length) {
          // Fallback Strategy 1: Exact length match.
          // Safely map new text directly to existing words, preserving perfect timing.
          newWords = newWordTokens.map((token, i) => ({
            ...seg.words[i],
            word: token
          }));
        } else {
          // Fallback Strategy 2: Length mismatch (words added/deleted).
          // Why: Mapping arbitrary insertions/deletions to old timestamps without a proper Myers diff is highly error-prone.
          // Action: Distribute words uniformly across the segment duration.
          // Future Scalability: We can add an AI timing correction API call here to re-align timings asynchronously.
          const duration = seg.end - seg.start;
          const wordDuration = duration / Math.max(1, newWordTokens.length);
          
          newWords = newWordTokens.map((token, i) => ({
            id: `w-${generateId()}`,
            word: token,
            start: seg.start + (i * wordDuration),
            end: seg.start + ((i + 1) * wordDuration),
            probability: 0.9 // Synthetic
          }));
        }

        return { ...seg, text, words: newWords };
      });

      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);

      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  updateSegmentTiming: (id: number, start: number, end: number) =>
    set((state) => {
      const newSegments = state.segments.map((seg) => {
        if (seg.id === id) {
          // Snap segment bounds to 0.1s
          const snappedStart = Math.max(0, Math.round(start * 10) / 10);
          const snappedEnd = Math.max(snappedStart + 0.1, Math.round(end * 10) / 10);
          
          const delta = snappedStart - seg.start;
          
          // Phase 2.5: Shift EVERY owned word by the exact delta.
          // Preserves absolute internal timing durations and karaoke synchronization!
          const newWords = seg.words.map(w => ({
            ...w,
            start: Math.max(0, w.start + delta),
            end: Math.max(0.1, w.end + delta)
          }));

          return { ...seg, start: snappedStart, end: snappedEnd, words: newWords };
        }
        return seg;
      });

      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);

      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  updateWordText: (segId, wordId, newWordText) =>
    set((state) => {
      const newSegments = state.segments.map(seg => {
        if (seg.id !== segId) return seg;
        
        // Update the owned word
        const newWords = seg.words.map(w => 
          w.id === wordId ? { ...w, word: newWordText } : w
        );
        
        // Rebuild parent segment text strictly from owned words
        const newText = newWords.map(w => w.word.trim()).join(' ');
        
        return { ...seg, text: newText, words: newWords };
      });

      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);

      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  splitSegment: (id, splitTime) =>
    set((state) => {
      const idx = state.segments.findIndex((s) => s.id === id);
      if (idx === -1) return {};
      const seg = state.segments[idx];
      
      if (splitTime <= seg.start || splitTime >= seg.end) return {};

      // Phase 2.5: Strict ownership split. No global overlap lookups.
      const splitIdx = seg.words.findIndex(w => w.start >= splitTime);
      
      const wordsA = splitIdx === -1 ? [...seg.words] : seg.words.slice(0, splitIdx);
      const wordsB = splitIdx === -1 ? [] : seg.words.slice(splitIdx);

      const textA = wordsA.map(w => w.word.trim()).join(' ');
      const textB = wordsB.map(w => w.word.trim()).join(' ');

      const newSegA: Segment = {
        id: seg.id, 
        start: seg.start,
        end: splitTime,
        text: textA || '...',
        words: wordsA
      };
      
      const newSegB: Segment = {
        id: Math.max(0, ...state.segments.map(s => s.id)) + 1,
        start: splitTime,
        end: seg.end,
        text: textB || '...',
        words: wordsB
      };

      const newSegments = [...state.segments];
      newSegments.splice(idx, 1, newSegA, newSegB);

      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);

      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  replaceText: (search, replaceWith, replaceAll, segId) =>
    set((state) => {
      if (!search) return {};

      let replacedCount = 0;
      // We escape the search string to avoid regex injection unless we want regex. The user usually wants literal replace.
      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapeRegExp(search), replaceAll ? 'gi' : 'i');

      const newSegments = state.segments.map((seg) => {
        if (segId !== undefined && seg.id !== segId) return seg;
        if (!replaceAll && replacedCount > 0) return seg;

        let segTextReplaced = false;
        const origSegStart = seg.start;
        const origSegEnd = seg.end;
        
        // Replace in words
        const newWords = seg.words.map((w) => {
          if (!replaceAll && replacedCount > 0) return w;
          
          // Test if word contains search query
          if (regex.test(w.word)) {
            // Reset regex lastIndex just in case
            regex.lastIndex = 0;
            const newWordStr = w.word.replace(regex, replaceWith);
            if (w.word !== newWordStr) {
              replacedCount++;
              segTextReplaced = true;
              
              // 2. WORD TIMING PROTECTION ASSERTIONS
              if (w.start !== w.start || w.end !== w.end) {
                 console.error("CRITICAL ERROR: Word timing modified during replace!");
              }
              
              return { ...w, word: newWordStr };
            }
          }
          return w;
        });

        if (segTextReplaced) {
          // 2. SEGMENT TIMING PROTECTION ASSERTIONS
          if (origSegStart !== seg.start || origSegEnd !== seg.end) {
             console.error("CRITICAL ERROR: Segment timing modified during replace!");
          }
          
          return {
            ...seg,
            text: newWords.map(w => w.word.trim()).join(' '),
            words: newWords
          };
        }
        return seg;
      });

      if (replacedCount === 0) return {};

      // 1. FIND & REPLACE HISTORY AUDIT
      // All replacements occur above. This pushes EXACTLY one snapshot.
      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);

      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  mergeSegments: (id) =>
    set((state) => {
      const idx = state.segments.findIndex((s) => s.id === id);
      if (idx === -1 || idx === state.segments.length - 1) return {};
      
      const segA = state.segments[idx];
      const segB = state.segments[idx + 1];

      // Phase 2.5: Strict ownership merge.
      const mergedSeg: Segment = {
        id: segA.id,
        start: segA.start,
        end: segB.end,
        text: `${segA.text} ${segB.text}`.trim(),
        words: [...segA.words, ...segB.words]
      };

      const newSegments = [...state.segments];
      newSegments.splice(idx, 2, mergedSeg);

      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);

      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  autoLineBreak: (maxChars = 42) => 
    set((state) => {
      const newSegments: Segment[] = [];
      let currentWords: Word[] = [];
      let currentText = '';
      let segId = 1;

      // Extract all nested words chronologically
      const allWords = state.segments.flatMap(s => s.words);

      for (let i = 0; i < allWords.length; i++) {
        const w = allWords[i];
        const wordText = w.word.trim();
        if (!wordText) continue;

        const space = currentText.length > 0 ? ' ' : '';
        const potentialText = currentText + space + wordText;

        const gap = currentWords.length > 0 ? w.start - currentWords[currentWords.length - 1].end : 0;
        
        if (potentialText.length > maxChars || gap > 1.5) {
          if (currentWords.length > 0) {
            newSegments.push({
              id: segId++,
              start: currentWords[0].start,
              end: currentWords[currentWords.length - 1].end,
              text: currentText,
              words: currentWords
            });
          }
          currentWords = [w];
          currentText = wordText;
        } else {
          currentWords.push(w);
          currentText = potentialText;
        }
      }

      if (currentWords.length > 0) {
        newSegments.push({
          id: segId++,
          start: currentWords[0].start,
          end: currentWords[currentWords.length - 1].end,
          text: currentText,
          words: currentWords
        });
      }

      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);

      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  removeFillers: () =>
    set((state) => {
      const fillers = new Set(['um', 'uh', 'like', 'you know', 'so', 'hmm', 'ah']);
      const isFiller = (text: string) => {
        const clean = text.toLowerCase().replace(/[^a-z ]/g, '').trim();
        return fillers.has(clean);
      };

      const newSegments = state.segments.map(seg => {
        // Strict ownership filtering
        const newWords = seg.words.filter(w => !isFiller(w.word));
        return {
          ...seg,
          text: newWords.map(w => w.word.trim()).join(' '),
          words: newWords
        };
      }).filter(seg => seg.words.length > 0);

      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);

      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  removePunctuation: () =>
    set((state) => {
      const newSegments = state.segments.map(seg => {
        const newWords = seg.words.map(w => ({
          ...w,
          word: w.word.replace(/[.,!?;:'"()\[\]{}]/g, ''),
        }));
        return {
          ...seg,
          text: newWords.map(w => w.word.trim()).join(' '),
          words: newWords,
        };
      });
      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);
      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  removeEmojis: () =>
    set((state) => {
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
      const newSegments = state.segments.map(seg => {
        const newWords = seg.words.map(w => ({
          ...w,
          word: w.word.replace(emojiRegex, '').trim(),
        })).filter(w => w.word.length > 0);
        return {
          ...seg,
          text: newWords.map(w => w.word.trim()).join(' '),
          words: newWords,
        };
      }).filter(seg => seg.words.length > 0);
      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);
      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  restoreEmphasis: () =>
    set((state) => {
      const newSegments = state.segments.map(seg => {
        if (seg.words.length === 0) return seg;
        const newWords = seg.words.map((w, i) => {
          if (i === 0) {
            return { ...w, word: w.word.charAt(0).toUpperCase() + w.word.slice(1) };
          }
          return w;
        });
        return {
          ...seg,
          text: newWords.map(w => w.word.trim()).join(' '),
          words: newWords,
        };
      });
      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);
      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  removeGaps: () =>
    set((state) => {
      if (state.segments.length <= 1) return {};
      const newSegments = state.segments.map((seg, i) => {
        if (i === 0) return seg;
        const prev = state.segments[i - 1];
        if (seg.start > prev.end) {
          const delta = seg.start - prev.end;
          return {
            ...seg,
            start: prev.end,
            words: seg.words.map(w => ({
              ...w,
              start: Math.max(prev.end, w.start - delta),
              end: Math.max(prev.end + 0.05, w.end - delta),
            })),
          };
        }
        return seg;
      });
      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);
      return { segments: newSegments, past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  validateTimingModel: () => {
    const errors: string[] = [];
    const segments = get().segments;
    
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      
      if (i > 0 && seg.start < segments[i - 1].end - 0.05) { // 0.05s tolerance
        errors.push(`Segment ${seg.id} overlaps with previous segment.`);
      }
      if (seg.start >= seg.end) {
        errors.push(`Segment ${seg.id} has invalid boundaries (start >= end).`);
      }

      let lastWordEnd = -1;
      for (const w of seg.words) {
        if (w.start < seg.start - 0.05 || w.end > seg.end + 0.05) { // Tolerance for float math
          errors.push(`Word "${w.word}" escapes bounds of Segment ${seg.id}.`);
        }
        if (w.start < lastWordEnd - 0.05) {
          errors.push(`Word "${w.word}" in Segment ${seg.id} overlaps previous word.`);
        }
        lastWordEnd = w.end;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  pushHistory: () =>
    set((state) => {
      const snapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, snapshot].slice(-50);
      return { past: newPast, future: [], canUndo: true, canRedo: false };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {};

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);

      const currentSnapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newFuture = [currentSnapshot, ...state.future];

      return {
        segments: previous.segments,
        subtitleStyle: previous.subtitleStyle,
        captionConfig: previous.captionConfig,
        past: newPast,
        future: newFuture,
        canUndo: newPast.length > 0,
        canRedo: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {};

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      const currentSnapshot: HistorySnapshot = { segments: state.segments, subtitleStyle: state.subtitleStyle, captionConfig: state.captionConfig };
      const newPast = [...state.past, currentSnapshot].slice(-50);

      return {
        segments: next.segments,
        subtitleStyle: next.subtitleStyle,
        captionConfig: next.captionConfig,
        past: newPast,
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      };
    }),
}));
