'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { getTemplatesByCategory, getTemplateCategories, getTemplateById } from '@/lib/templates-data';
import { TRANSITION_TYPES, sanitizeTransitionType } from '@/lib/subtitle-schema-v2';
import {
  Type,
  Wand2,
  Activity,
  Mic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpFromLine,
  Minus,
  ArrowDownFromLine,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'templates' | 'text' | 'transitions' | 'audio';

export function StylePanel() {
  const [activeTab, setActiveTab] = useState<Tab>('templates');

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-white/5 w-80">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/5 p-2 gap-1">
        <TabButton id="templates" label="Templates" icon={Wand2} current={activeTab} set={setActiveTab} />
        <TabButton id="text" label="Text" icon={Type} current={activeTab} set={setActiveTab} />
        <TabButton id="transitions" label="Transitions" icon={Activity} current={activeTab} set={setActiveTab} />
        <TabButton id="audio" label="AI Audio" icon={Mic} current={activeTab} set={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'transitions' && <TransitionsTab />}
        {activeTab === 'audio' && <AudioTab />}
      </div>
    </div>
  );
}

function TabButton({
  id,
  label,
  icon: Icon,
  current,
  set,
}: {
  id: Tab;
  label: string;
  icon: React.ElementType;
  current: Tab;
  set: (t: Tab) => void;
}) {
  const active = current === id;
  return (
    <button
      onClick={() => set(id)}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-md transition-colors",
        active ? "bg-zinc-800 text-violet-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

function ExportWarning({ message }: { message: string }) {
  return (
    <div className="mt-2 flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500/90 text-[10px] leading-tight">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATES TAB
// ═══════════════════════════════════════════════════════════════════════

function TemplatesTab() {
  const { applyTemplate, activeTemplateId } = useEditorStore();
  const categories = getTemplateCategories();

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const templates = getTemplatesByCategory(category);
        if (templates.length === 0) return null;
        
        return (
          <div key={category}>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(tmpl => {
                const isActive = activeTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => applyTemplate(tmpl.id)}
                    className={cn(
                      "relative aspect-[4/3] rounded-lg border bg-zinc-900 flex items-center justify-center p-2 transition-all group overflow-hidden",
                      isActive ? "border-violet-500 ring-1 ring-violet-500/50" : "border-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0" />
                    <span 
                      className="relative z-10 text-center font-bold text-[10px] leading-tight"
                      style={{
                        fontFamily: tmpl.style.font.family,
                        color: tmpl.style.textColor.solid,
                        textTransform: tmpl.style.font.textTransform === 'uppercase' ? 'uppercase' : 'none',
                        textShadow: tmpl.style.shadow.blur > 0 ? `0 2px ${tmpl.style.shadow.blur}px ${tmpl.style.shadow.color}` : 'none'
                      }}
                    >
                      {tmpl.name}
                    </span>
                    {tmpl.isNew && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded-sm z-20">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEXT TAB
// ═══════════════════════════════════════════════════════════════════════

function TextTab() {
  const { subtitleStyle, setSubtitleStyleV2 } = useEditorStore();

  return (
    <div className="space-y-6">
      
      {/* Font Family */}
      <StyleSection title="Font">
        <select
          value={subtitleStyle.font.family}
          onChange={(e) => setSubtitleStyleV2(s => ({ ...s, font: { ...s.font, family: e.target.value } }))}
          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50"
        >
          <option value="Inter">Inter</option>
          <option value="Montserrat">Montserrat</option>
          <option value="Poppins">Poppins</option>
          <option value="Outfit">Outfit</option>
          <option value="Playfair Display">Playfair Display</option>
          <option value="Oswald">Oswald</option>
          <option value="Bebas Neue">Bebas Neue</option>
          <option value="Space Mono">Space Mono</option>
          <option value="Roboto">Roboto</option>
        </select>
      </StyleSection>

      {/* Font Size & Weight */}
      <div className="grid grid-cols-2 gap-3">
        <StyleSection title="Size">
          <input
            type="number"
            value={subtitleStyle.fontSize}
            onChange={(e) => setSubtitleStyleV2(s => ({ ...s, fontSize: Number(e.target.value) }))}
            className="w-full px-3 py-1.5 bg-zinc-900 border border-white/10 rounded text-sm text-zinc-300"
          />
        </StyleSection>
        <StyleSection title="Weight">
          <select
            value={subtitleStyle.font.weight}
            onChange={(e) => setSubtitleStyleV2(s => ({ ...s, font: { ...s.font, weight: Number(e.target.value) } }))}
            className="w-full px-3 py-1.5 bg-zinc-900 border border-white/10 rounded text-sm text-zinc-300"
          >
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">SemiBold</option>
            <option value="700">Bold</option>
            <option value="800">ExtraBold</option>
            <option value="900">Black</option>
          </select>
        </StyleSection>
      </div>

      {/* Alignment & Position */}
      <div className="grid grid-cols-2 gap-3">
        <StyleSection title="Align">
          <div className="flex gap-1 p-0.5 bg-zinc-900 rounded border border-white/5">
            {([
              { value: 'left' as const, icon: AlignLeft },
              { value: 'center' as const, icon: AlignCenter },
              { value: 'right' as const, icon: AlignRight },
            ]).map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSubtitleStyleV2(s => ({ ...s, alignment: value }))}
                className={cn(
                  "flex-1 flex items-center justify-center py-1.5 rounded transition-all",
                  subtitleStyle.alignment === value ? 'bg-zinc-800 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </StyleSection>
        <StyleSection title="Position Y">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-50"
              max="50"
              value={subtitleStyle.positionY}
              onChange={(e) => setSubtitleStyleV2(s => ({ ...s, positionY: Number(e.target.value) }))}
              className="flex-1 h-1.5 accent-violet-500"
            />
            <span className="text-[10px] font-mono text-zinc-400 w-6 text-right">{subtitleStyle.positionY}</span>
          </div>
        </StyleSection>
      </div>

      {/* Colors */}
      <StyleSection title="Text Color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={subtitleStyle.textColor.solid}
            onChange={(e) => setSubtitleStyleV2(s => ({ ...s, textColor: { ...s.textColor, solid: e.target.value } }))}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10 p-0"
          />
          <span className="text-xs font-mono text-zinc-500">{subtitleStyle.textColor.solid}</span>
        </div>
      </StyleSection>
      
      <StyleSection title="Highlight (Active Word)">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={subtitleStyle.activeWordColor}
            onChange={(e) => setSubtitleStyleV2(s => ({ ...s, activeWordColor: e.target.value }))}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10 p-0"
          />
          <span className="text-xs font-mono text-zinc-500">{subtitleStyle.activeWordColor}</span>
        </div>
      </StyleSection>

      {/* Effects: Stroke */}
      <StyleSection title="Stroke">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Enable Stroke</span>
            <input 
              type="checkbox" 
              checked={subtitleStyle.stroke.enabled}
              onChange={e => setSubtitleStyleV2(s => ({ ...s, stroke: { ...s.stroke, enabled: e.target.checked } }))}
              className="accent-violet-500 w-4 h-4"
            />
          </div>
          {subtitleStyle.stroke.enabled && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={subtitleStyle.stroke.color}
                onChange={(e) => setSubtitleStyleV2(s => ({ ...s, stroke: { ...s.stroke, color: e.target.value } }))}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/10 p-0"
              />
              <input
                type="range"
                min="0" max="10" step="0.5"
                value={subtitleStyle.stroke.width}
                onChange={(e) => setSubtitleStyleV2(s => ({ ...s, stroke: { ...s.stroke, width: Number(e.target.value) } }))}
                className="flex-1 h-1.5 accent-violet-500"
              />
              <span className="text-[10px] font-mono text-zinc-400 w-6 text-right">{subtitleStyle.stroke.width}</span>
            </div>
          )}
        </div>
      </StyleSection>
      
      {/* Effects: Shadow */}
      <StyleSection title="Shadow Blur">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0" max="50"
            value={subtitleStyle.shadow.blur}
            onChange={(e) => setSubtitleStyleV2(s => ({ ...s, shadow: { ...s.shadow, blur: Number(e.target.value) } }))}
            className="flex-1 h-1.5 accent-violet-500"
          />
          <span className="text-[10px] font-mono text-zinc-400 w-6 text-right">{subtitleStyle.shadow.blur}</span>
        </div>
      </StyleSection>

      {/* Effects: Background */}
      <StyleSection title="Background Box">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Enable Background</span>
            <input 
              type="checkbox" 
              checked={subtitleStyle.background.enabled}
              onChange={e => setSubtitleStyleV2(s => ({ ...s, background: { ...s.background, enabled: e.target.checked } }))}
              className="accent-violet-500 w-4 h-4"
            />
          </div>
          {subtitleStyle.background.enabled && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={subtitleStyle.background.color}
                  onChange={(e) => setSubtitleStyleV2(s => ({ ...s, background: { ...s.background, color: e.target.value } }))}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/10 p-0"
                />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-12">Opacity</span>
                    <input
                      type="range"
                      min="0" max="1" step="0.1"
                      value={subtitleStyle.background.opacity}
                      onChange={(e) => setSubtitleStyleV2(s => ({ ...s, background: { ...s.background, opacity: Number(e.target.value) } }))}
                      className="flex-1 h-1.5 accent-violet-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-12">Radius</span>
                    <input
                      type="range"
                      min="0" max="24"
                      value={subtitleStyle.background.borderRadius}
                      onChange={(e) => setSubtitleStyleV2(s => ({ ...s, background: { ...s.background, borderRadius: Number(e.target.value) } }))}
                      className="flex-1 h-1.5 accent-violet-500"
                    />
                  </div>
                </div>
              </div>
              {subtitleStyle.background.borderRadius > 0 && (
                <ExportWarning message="Preview feature. Exported MP4 uses rectangular background without border radius." />
              )}
            </>
          )}
        </div>
      </StyleSection>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TRANSITIONS TAB
// ═══════════════════════════════════════════════════════════════════════

function TransitionsTab() {
  const { subtitleStyle, setSubtitleStyleV2 } = useEditorStore();

  return (
    <div className="space-y-6">
      
      <StyleSection title="Highlight Mode">
        <select
          value={subtitleStyle.highlightMode}
          onChange={(e) => setSubtitleStyleV2(s => ({ ...s, highlightMode: e.target.value as any }))}
          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50"
        >
          <option value="none">None</option>
          <option value="color">Color Text</option>
          <option value="scale">Scale Up</option>
          <option value="underline">Underline</option>
          <option value="background">Background Box</option>
          <option value="karaoke">Karaoke Glow</option>
        </select>
        <p className="text-[10px] text-zinc-500 mt-1">How the active word is emphasized during playback.</p>
      </StyleSection>

      <StyleSection title="Entry Animation">
        <select
          value={subtitleStyle.transition.type}
          onChange={(e) => setSubtitleStyleV2(s => ({ ...s, transition: { ...s.transition, type: sanitizeTransitionType(e.target.value) } }))}
          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50"
        >
          {TRANSITION_TYPES.map(t => (
            <option key={t} value={t}>{t.replace('-', ' ').toUpperCase()}</option>
          ))}
        </select>
        <p className="text-[10px] text-zinc-500 mt-1">How words enter the screen.</p>
        {subtitleStyle.transition.type === 'pop' && (
          <ExportWarning message="Preview feature. Exported MP4 falls back to smooth linear scale without the bounce effect." />
        )}
      </StyleSection>
      
      {subtitleStyle.transition.type !== 'none' && (
        <>
          <StyleSection title="Speed Mode">
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input 
                  type="radio" 
                  name="speedMode"
                  checked={subtitleStyle.transition.speedMode === 'dynamic'}
                  onChange={() => setSubtitleStyleV2(s => ({ ...s, transition: { ...s.transition, speedMode: 'dynamic' } }))}
                  className="accent-violet-500"
                />
                Dynamic (Sync with voice)
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input 
                  type="radio" 
                  name="speedMode"
                  checked={subtitleStyle.transition.speedMode === 'fixed'}
                  onChange={() => setSubtitleStyleV2(s => ({ ...s, transition: { ...s.transition, speedMode: 'fixed' } }))}
                  className="accent-violet-500"
                />
                Fixed
              </label>
            </div>
          </StyleSection>
          
          {subtitleStyle.transition.speedMode === 'fixed' && (
            <StyleSection title="Speed">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0" max="50"
                  value={subtitleStyle.transition.speed}
                  onChange={(e) => setSubtitleStyleV2(s => ({ ...s, transition: { ...s.transition, speed: Number(e.target.value) } }))}
                  className="flex-1 h-1.5 accent-violet-500"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-6 text-right">{subtitleStyle.transition.speed}</span>
              </div>
            </StyleSection>
          )}
        </>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AI AUDIO TAB
// ═══════════════════════════════════════════════════════════════════════

function AudioTab() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <Mic className="w-8 h-8 text-zinc-600 mb-3" />
      <h3 className="text-sm font-medium text-zinc-300 mb-1">AI Voiceover</h3>
      <p className="text-xs text-zinc-500">Coming soon in Phase 3. Add AI generated voice to your subtitles.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function StyleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
        {title}
      </label>
      {children}
    </div>
  );
}
