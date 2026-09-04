"use client";

import type { ClientBrief, GenerationResult, SceneType } from "@/types";
import { formatDuration } from "@/lib/director";

interface ScriptPreviewProps {
  brief: ClientBrief;
  generation: GenerationResult;
  onBack: () => void;
  onProceed: () => void;
}

const sceneTypeLabels: Record<SceneType, string> = {
  intro: "Opening",
  problem: "Stakes",
  highlight: "Callout",
  quote: "Voice in the room",
  stats: "Proof",
  cta: "Ask",
  outro: "Close",
};

const sceneTypeColors: Record<SceneType, string> = {
  intro: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  problem: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  highlight: "bg-brand-500/20 text-brand-200 border-brand-500/30",
  quote: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  stats: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  cta: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  outro: "bg-stone-500/20 text-stone-200 border-stone-500/30",
};

export default function ScriptPreview({
  brief,
  generation,
  onBack,
  onProceed,
}: ScriptPreviewProps) {
  const { script, source } = generation;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="font-display text-2xl font-bold">{script.title}</h2>
              <span
                className={`text-xs px-3 py-1 rounded-full border ${
                  source === "ai"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-brand-500/10 text-brand-200 border-brand-500/30"
                }`}
              >
                {source === "ai" ? "GPT-directed" : "Director engine"}
              </span>
            </div>
            <p className="text-white/55 max-w-2xl">{script.logline}</p>
            <p className="text-white/40 text-sm mt-2">
              {brief.clientName} · {formatDuration(script.totalDurationMs)} ·{" "}
              {script.scenes.length} scenes · {brief.targetAudience.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="btn-secondary">
              Edit brief
            </button>
            <button onClick={onProceed} className="btn-primary">
              Open film studio
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {source === "template" && (
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60">
            Directed on-device for this brief. Add <code className="text-brand-200">OPENAI_API_KEY</code> in
            .env.local when you want GPT to rewrite headlines and voiceover.
          </div>
        )}
      </div>

      <div className="glass-panel p-8">
        <h3 className="font-display text-lg font-bold mb-6">Scene timeline</h3>
        <div className="space-y-4">
          {script.scenes.map((scene, index) => (
            <div
              key={scene.id}
              className="flex gap-4 p-5 rounded-xl bg-surface-700/20 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-600 flex items-center justify-center text-sm font-bold text-white/60">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border ${sceneTypeColors[scene.type]}`}
                  >
                    {sceneTypeLabels[scene.type]}
                  </span>
                  {scene.kicker && (
                    <span className="text-xs tracking-widest text-white/35">{scene.kicker}</span>
                  )}
                  <span className="text-xs text-white/30 ml-auto">
                    {(scene.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <h4 className="font-semibold text-lg">{scene.headline}</h4>
                {scene.subheadline && (
                  <p className="text-white/50 text-sm mt-1">{scene.subheadline}</p>
                )}
                {scene.body && <p className="text-white/40 text-sm mt-2">{scene.body}</p>}
                {scene.metric && (
                  <span className="inline-block mt-2 text-xs px-3 py-1 rounded-lg bg-brand-500/20 text-brand-200">
                    {scene.metric}
                  </span>
                )}
                {scene.voiceover && (
                  <p className="text-white/35 text-sm mt-3 italic border-l border-white/10 pl-3">
                    VO: {scene.voiceover}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {script.narratorNotes && (
        <div className="glass-panel p-8">
          <h3 className="font-display text-lg font-bold mb-3">Director notes</h3>
          <p className="text-white/60 leading-relaxed">{script.narratorNotes}</p>
        </div>
      )}
    </div>
  );
}
