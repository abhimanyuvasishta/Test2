"use client";

import type { SavedSeries } from "@/types";

interface SeriesLibraryProps {
  items: SavedSeries[];
  onOpen: (series: SavedSeries, episodeNumber: number) => void;
  onNext: (series: SavedSeries) => void;
  onDelete: (id: string) => void;
}

export default function SeriesLibrary({ items, onOpen, onNext, onDelete }: SeriesLibraryProps) {
  if (items.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <h2 className="font-display text-2xl font-bold mb-2">No series yet</h2>
        <p className="text-white/50">Generate a series production and save it to keep episode lock across sessions.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {items.map((series) => {
        const nextNumber = (series.episodes.at(-1)?.number || 0) + 1;
        return (
          <article key={series.id} className="glass-panel p-6 space-y-4">
            <div>
              <p className="text-xs text-brand-300 uppercase">{series.bible.niche}</p>
              <h3 className="font-display text-xl font-bold mt-1">{series.bible.title}</h3>
              <p className="text-sm text-white/50 mt-2">{series.bible.logline}</p>
            </div>
            <p className="text-xs text-white/40">
              {series.episodes.length} rendered · {series.seasonPlan.length} planned · {series.bible.characters.map((c) => c.name).join(", ")}
            </p>
            <div className="flex flex-wrap gap-2">
              {series.episodes.map((episode) => (
                <button
                  key={episode.number}
                  className="btn-secondary text-xs px-3 py-2"
                  onClick={() => onOpen(series, episode.number)}
                >
                  Play E{episode.number}
                </button>
              ))}
              {nextNumber <= series.seasonPlan.length && (
                <button className="btn-primary text-xs px-3 py-2" onClick={() => onNext(series)}>
                  Generate E{nextNumber}
                </button>
              )}
              <button className="text-xs text-red-300 px-2" onClick={() => onDelete(series.id)}>
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
