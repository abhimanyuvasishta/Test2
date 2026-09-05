"use client";

import type { Production } from "@/types";

interface BibleReviewProps {
  production: Production;
  onBack: () => void;
  onStudio: () => void;
  onSaveSeries: () => void;
}

export default function BibleReview({
  production,
  onBack,
  onStudio,
  onSaveSeries,
}: BibleReviewProps) {
  const { bible, episode, seasonPlan, source, estimatedCredits } = production;
  const seconds = Math.round(episode.totalDurationMs / 1000);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="glass-panel p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-display text-3xl font-bold">{bible.title}</h2>
              <span
                className={`text-xs px-3 py-1 rounded-full border ${
                  source === "ai"
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                }`}
              >
                {source === "ai" ? "AI director" : "On-device director"}
              </span>
            </div>
            <p className="text-white/60 max-w-2xl">{bible.logline}</p>
            <p className="text-sm text-white/40 mt-3">
              {bible.niche} · {bible.mood} · {bible.aspect} · {seconds}s · ~{estimatedCredits} credits
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={onBack} className="btn-secondary">
              Edit command
            </button>
            {bible.format === "series" && (
              <button onClick={onSaveSeries} className="btn-secondary">
                Save series
              </button>
            )}
            <button onClick={onStudio} className="btn-primary">
              Open studio
            </button>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="glass-panel p-6">
          <h3 className="font-display font-bold mb-4">Characters</h3>
          <div className="space-y-3">
            {bible.characters.map((character) => (
              <div key={character.id} className="flex gap-3 items-start">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900"
                  style={{ background: character.color }}
                >
                  {character.name.slice(0, 1)}
                </span>
                <div>
                  <p className="font-semibold">{character.name}</p>
                  <p className="text-xs text-white/45">
                    {character.role} · {character.voice}
                  </p>
                  <p className="text-xs text-white/35 mt-1">{character.look}</p>
                </div>
              </div>
            ))}
          </div>
          {bible.product && (
            <div className="mt-6 p-4 rounded-xl border border-white/10">
              <p className="text-xs text-white/40 mb-1">PRODUCT LOCK</p>
              <p className="font-semibold">{bible.product.name}</p>
              <p className="text-sm text-white/50">{bible.product.tagline}</p>
              <p className="text-xs text-white/40 mt-2">{bible.product.features.join(" · ")}</p>
            </div>
          )}
        </section>

        <section className="glass-panel p-6 lg:col-span-2">
          <h3 className="font-display font-bold mb-4">Shot list · {episode.title}</h3>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {episode.shots.map((shot, index) => (
              <div key={shot.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
                  <span>{index + 1}</span>
                  <span className="uppercase">{shot.type}</span>
                  <span className="ml-auto">{(shot.durationMs / 1000).toFixed(1)}s</span>
                </div>
                <p className="font-medium">{shot.onScreen}</p>
                <p className="text-sm text-white/50 mt-1">{shot.line}</p>
                <p className="text-xs text-white/35 mt-2">{shot.visual}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {seasonPlan.length > 1 && (
        <section className="glass-panel p-6">
          <h3 className="font-display font-bold mb-4">Season plan</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {seasonPlan.map((item) => (
              <div key={item.number} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-xs text-brand-300 mb-1">E{item.number}</p>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-white/50 mt-1">{item.logline}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
