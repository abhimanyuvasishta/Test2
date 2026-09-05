"use client";

import { useEffect, useState } from "react";
import CommandBoard from "@/components/CommandBoard";
import BibleReview from "@/components/BibleReview";
import VideoStudio from "@/components/VideoStudio";
import SeriesLibrary from "@/components/SeriesLibrary";
import StepIndicator from "@/components/StepIndicator";
import { generateProduction, localNextEpisode } from "@/lib/generate-production";
import {
  deleteSeries,
  listSeries,
  productionToSeries,
  saveSeries,
  upsertEpisode,
} from "@/lib/storage";
import type { CommandInput, Production, SavedSeries } from "@/types";

const STEPS = [
  { id: 1, label: "Command" },
  { id: 2, label: "Bible" },
  { id: 3, label: "Studio" },
];

type Tab = "create" | "series";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("create");
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<CommandInput | null>(null);
  const [production, setProduction] = useState<Production | null>(null);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [library, setLibrary] = useState<SavedSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLibrary = () => setLibrary(listSeries());

  useEffect(() => {
    refreshLibrary();
  }, []);

  const runDirector = async (command: CommandInput, episodeNumber = 1, existingId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateProduction(command, episodeNumber);
      setInput(command);
      setProduction(result);
      setSeriesId(existingId || null);
      setTab("create");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the production");
    } finally {
      setLoading(false);
    }
  };

  const persistSeries = () => {
    if (!production || !input) return;
    const saved = productionToSeries(production, input, seriesId || undefined);
    saveSeries(saved);
    setSeriesId(saved.id);
    refreshLibrary();
  };

  const openEpisode = (series: SavedSeries, episodeNumber: number) => {
    const episode = series.episodes.find((item) => item.number === episodeNumber);
    if (!episode) return;
    setInput(series.input);
    setSeriesId(series.id);
    setProduction({
      bible: series.bible,
      episode,
      seasonPlan: series.seasonPlan,
      source: series.source,
      estimatedCredits: 0,
    });
    setTab("create");
    setStep(3);
  };

  const generateNext = async (series: SavedSeries) => {
    const nextNumber = (series.episodes.at(-1)?.number || 0) + 1;
    setLoading(true);
    setError(null);
    try {
      let result: Production;
      try {
        result = await generateProduction(series.input, nextNumber);
        result = { ...result, bible: series.bible, seasonPlan: series.seasonPlan };
      } catch {
        result = localNextEpisode(series.input, series.bible, nextNumber, series.seasonPlan);
      }
      const updated = upsertEpisode(series, result.episode);
      setLibrary(listSeries());
      setInput(updated.input);
      setSeriesId(updated.id);
      setProduction({
        bible: updated.bible,
        episode: result.episode,
        seasonPlan: updated.seasonPlan,
        source: result.source,
        estimatedCredits: result.estimatedCredits,
      });
      setTab("create");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the next episode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-surface-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">Forge</h1>
              <p className="text-xs text-white/40">AI video creator</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setTab("create")}
              className={`px-3 py-1.5 rounded-lg text-sm ${tab === "create" ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              Create
            </button>
            <button
              onClick={() => {
                refreshLibrary();
                setTab("series");
              }}
              className={`px-3 py-1.5 rounded-lg text-sm ${tab === "series" ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              Series
            </button>
          </nav>
          {tab === "create" && <StepIndicator steps={STEPS} currentStep={step} />}
        </div>
      </header>

      {tab === "create" && step === 1 && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 via-transparent to-transparent" />
          <div className="max-w-7xl mx-auto px-6 py-14 text-center relative">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Command full videos
              <span className="block bg-gradient-to-r from-brand-400 to-fuchsia-400 bg-clip-text text-transparent">
                with products, characters, and series
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Faceless shorts, product films, conversations, and animated episode queues — directed from one prompt.
            </p>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-6 pb-20">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}
        {loading && tab === "series" && <p className="text-white/50 mb-4">Directing the next episode…</p>}

        {tab === "series" ? (
          <SeriesLibrary
            items={library}
            onOpen={openEpisode}
            onNext={generateNext}
            onDelete={(id) => {
              deleteSeries(id);
              refreshLibrary();
            }}
          />
        ) : (
          <>
            {step === 1 && <CommandBoard onSubmit={(command) => runDirector(command)} isLoading={loading} />}
            {step === 2 && production && (
              <BibleReview
                production={production}
                onBack={() => setStep(1)}
                onStudio={() => setStep(3)}
                onSaveSeries={persistSeries}
              />
            )}
            {step === 3 && production && (
              <VideoStudio production={production} onBack={() => setStep(2)} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
