"use client";

import type { ClientBrief, GenerationResult } from "@/types";

interface ScriptPreviewProps {
  brief: ClientBrief;
  generation: GenerationResult;
  onBack: () => void;
  onProceed: () => void;
}

const sceneTypeLabels: Record<string, string> = {
  intro: "Opening",
  highlight: "Feature",
  stats: "Proof Points",
  cta: "Call to Action",
  outro: "Closing",
};

const sceneTypeColors: Record<string, string> = {
  intro: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  highlight: "bg-brand-500/20 text-brand-300 border-brand-500/30",
  stats: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cta: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  outro: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

export default function ScriptPreview({
  brief,
  generation,
  onBack,
  onProceed,
}: ScriptPreviewProps) {
  const { script, source } = generation;
  const durationSec = Math.round(script.totalDurationMs / 1000);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary header */}
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-display text-2xl font-bold">{script.title}</h2>
              <span
                className={`text-xs px-3 py-1 rounded-full border ${
                  source === "ai"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {source === "ai" ? "AI Generated" : "Smart Template"}
              </span>
            </div>
            <p className="text-white/50">
              {brief.clientName} · {brief.productName} · {durationSec}s ·{" "}
              {script.scenes.length} scenes · Tailored for{" "}
              {brief.targetAudience.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="btn-secondary">
              Edit Brief
            </button>
            <button onClick={onProceed} className="btn-primary">
              Open Video Studio
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {source === "template" && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-amber-200/80">
            Running in template mode. Add your <code className="text-amber-300">OPENAI_API_KEY</code>{" "}
            to unlock GPT-powered script generation tailored to each audience.
          </div>
        )}
      </div>

      {/* Scene timeline */}
      <div className="glass-panel p-8">
        <h3 className="font-display text-lg font-bold mb-6">Scene Timeline</h3>
        <div className="space-y-4">
          {script.scenes.map((scene, index) => (
            <div
              key={scene.id}
              className="flex gap-4 p-5 rounded-xl bg-surface-700/20 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-600 flex items-center justify-center text-sm font-bold text-white/60">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border ${sceneTypeColors[scene.type]}`}
                  >
                    {sceneTypeLabels[scene.type]}
                  </span>
                  <span className="text-xs text-white/30">
                    {(scene.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <h4 className="font-semibold text-lg">{scene.headline}</h4>
                {scene.subheadline && (
                  <p className="text-white/50 text-sm mt-1">{scene.subheadline}</p>
                )}
                {scene.body && (
                  <p className="text-white/40 text-sm mt-2">{scene.body}</p>
                )}
                {scene.metric && (
                  <span className="inline-block mt-2 text-xs px-3 py-1 rounded-lg bg-brand-500/20 text-brand-300">
                    {scene.metric}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production notes */}
      {script.narratorNotes && (
        <div className="glass-panel p-8">
          <h3 className="font-display text-lg font-bold mb-3">Production Notes</h3>
          <p className="text-white/60 leading-relaxed">{script.narratorNotes}</p>
        </div>
      )}
    </div>
  );
}
