"use client";

import { useEffect, useMemo, useState } from "react";

type Character = {
  id?: string;
  name: string;
  role: string;
  personality: string;
  lookPrompt: string;
  voiceId: string;
};

type Product = {
  id?: string;
  name: string;
  lookPrompt: string;
  mustShowBeats: string[];
};

type Series = {
  id: string;
  name: string;
  niche: string;
  stylePrompt: string;
  aspectRatio: "9:16" | "16:9";
  voiceId: string;
  palette: string[];
  characters: Character[];
  products: Product[];
  episodeCount?: number;
};

type Episode = {
  id: string;
  number: number;
  command: string;
  status: string;
  productionJson?: string | null;
  outputRelPath?: string | null;
  captionsRelPath?: string | null;
  error?: string | null;
};

type Plan = {
  title: string;
  runtimeSec: number;
  scenes: Array<{
    id: string;
    type: string;
    durationSec: number;
    onScreenText: string;
    action: string;
    dialogue: Array<{ characterName: string; text: string }>;
  }>;
};

const emptyBible = {
  name: "",
  niche: "",
  stylePrompt: "",
  aspectRatio: "9:16" as const,
  characters: [
    {
      name: "",
      role: "lead",
      personality: "",
      lookPrompt: "",
      voiceId: "lead",
    },
  ],
  products: [
    {
      name: "",
      lookPrompt: "",
      mustShowBeats: ["hero packshot", "in-hand", "logo close-up"],
    },
  ],
};

export default function SeriesStudio() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bible, setBible] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [command, setCommand] = useState(
    "Episode 1: Leo hates his old mug. Maya shows the Ember Mug. Keep it 60 seconds, vertical."
  );
  const [creating, setCreating] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyBible);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  const loadSeries = async () => {
    try {
      const response = await fetch("/api/series");
      if (!response.ok) throw new Error("API unavailable");
      const data = await response.json();
      setSeriesList(data.series || []);
      setOffline(false);
      if (!activeId && data.series?.[0]) {
        setActiveId(data.series[0].id);
      }
    } catch {
      setOffline(true);
    }
  };

  const loadDetail = async (id: string) => {
    const response = await fetch(`/api/series/${id}`);
    if (!response.ok) return;
    const data = await response.json();
    setBible(data.series);
    setEpisodes(data.episodes || []);
    const latest = data.episodes?.[0];
    if (latest) {
      setActiveEpisode(latest);
      setPlan(latest.productionJson ? JSON.parse(latest.productionJson) : null);
    } else {
      setActiveEpisode(null);
      setPlan(null);
    }
  };

  useEffect(() => {
    void loadSeries();
  }, []);

  useEffect(() => {
    if (activeId) void loadDetail(activeId);
  }, [activeId]);

  const palette = useMemo(() => bible?.palette?.join(" · ") || "", [bible]);

  const createSeries = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          products: draft.products.map((product) => ({
            ...product,
            mustShowBeats: product.mustShowBeats,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create series");
      setShowCreate(false);
      setDraft(emptyBible);
      await loadSeries();
      setActiveId(data.series.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const renderEpisode = async () => {
    if (!activeId) return;
    setRendering(true);
    setError(null);
    try {
      const response = await fetch(`/api/series/${activeId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Render failed");
      setActiveEpisode(data.episode);
      setPlan(data.plan);
      await loadDetail(activeId);
      await loadSeries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed");
    } finally {
      setRendering(false);
    }
  };

  if (offline) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Series pipeline needs the Node server</h2>
        <p className="text-white/60 mb-8">
          Chat → production JSON → TTS + captions + FFmpeg only runs with <code className="text-brand-300">npm run dev</code>.
          The canvas executive studio still works on static hosting.
        </p>
        <a className="btn-primary" href="/executive">
          Open executive studio
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-surface-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-brand-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">AI Video Creator</h1>
              <p className="text-xs text-white/40">Series bible · command · 60s FFmpeg export</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a className="btn-secondary text-sm py-2" href="/executive">
              Executive canvas
            </a>
            <button className="btn-primary text-sm py-2" type="button" onClick={() => setShowCreate(true)}>
              New series
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-white/40">Series</p>
          {seriesList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className={`w-full text-left glass-panel p-4 ${
                item.id === activeId ? "ring-2 ring-brand-500/60" : ""
              }`}
            >
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-white/50 mt-1">{item.niche}</div>
            </button>
          ))}
        </aside>

        <section className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm whitespace-pre-wrap">
              {error}
            </div>
          )}

          {bible && (
            <>
              <div className="glass-panel p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold">{bible.name}</h2>
                    <p className="text-white/60 mt-1">{bible.niche}</p>
                  </div>
                  <div className="text-xs text-white/50">
                    {bible.aspectRatio} · {palette}
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-4">{bible.stylePrompt}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-white/40 mb-2">Characters</h3>
                    {bible.characters.map((character) => (
                      <div key={character.id || character.name} className="mb-3">
                        <div className="font-medium">
                          {character.name}{" "}
                          <span className="text-white/40 text-xs">{character.role}</span>
                        </div>
                        <p className="text-sm text-white/60">{character.personality}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-white/40 mb-2">Products</h3>
                    {bible.products.map((product) => (
                      <div key={product.id || product.name} className="mb-3">
                        <div className="font-medium">{product.name}</div>
                        <p className="text-sm text-white/60">{product.lookPrompt}</p>
                        <p className="text-xs text-amber-300/80 mt-1">
                          Must-show: {product.mustShowBeats.join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6">
                <label className="text-xs uppercase tracking-wide text-white/40">Command</label>
                <textarea
                  className="input-field mt-2 min-h-[110px]"
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  placeholder="Tell the showrunner what this episode is about"
                />
                <div className="mt-4 flex items-center gap-3">
                  <button className="btn-primary" type="button" disabled={rendering} onClick={() => void renderEpisode()}>
                    {rendering ? "Rendering 60s episode…" : "Plan + render episode"}
                  </button>
                  <span className="text-xs text-white/40">TTS · captions · FFmpeg MP4</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="glass-panel p-6">
                  <h3 className="font-display font-semibold mb-3">Episode</h3>
                  {activeEpisode?.outputRelPath ? (
                    <video
                      key={activeEpisode.outputRelPath}
                      className="w-full max-h-[640px] rounded-xl bg-black"
                      src={activeEpisode.outputRelPath}
                      controls
                      playsInline
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-white/40">
                      Render an episode to preview the MP4 here.
                    </div>
                  )}
                  {activeEpisode?.captionsRelPath && (
                    <a className="text-sm text-brand-300 mt-3 inline-block" href={activeEpisode.captionsRelPath}>
                      Download captions
                    </a>
                  )}
                  {activeEpisode?.error && (
                    <p className="text-sm text-red-300 mt-3">{activeEpisode.error}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="glass-panel p-6">
                    <h3 className="font-display font-semibold mb-3">Production JSON</h3>
                    {plan ? (
                      <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                        <p className="text-sm text-white/60">
                          {plan.title} · {plan.runtimeSec}s · {plan.scenes.length} scenes
                        </p>
                        {plan.scenes.map((scene) => (
                          <div key={scene.id} className="border-t border-white/5 pt-3">
                            <div className="text-xs text-amber-300/90">
                              {scene.type} · {scene.durationSec}s
                            </div>
                            <div className="font-medium">{scene.onScreenText}</div>
                            {scene.dialogue.map((line, index) => (
                              <p key={index} className="text-sm text-white/60">
                                <span className="text-white/80">{line.characterName}:</span> {line.text}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/40">No plan yet.</p>
                    )}
                  </div>

                  <div className="glass-panel p-6">
                    <h3 className="font-display font-semibold mb-3">Past episodes</h3>
                    {episodes.length === 0 && <p className="text-sm text-white/40">None yet.</p>}
                    {episodes.map((episode) => (
                      <button
                        key={episode.id}
                        type="button"
                        className="block w-full text-left py-2 border-t border-white/5 first:border-0"
                        onClick={() => {
                          setActiveEpisode(episode);
                          setPlan(episode.productionJson ? JSON.parse(episode.productionJson) : null);
                        }}
                      >
                        <span className="text-sm font-medium">Ep {episode.number}</span>
                        <span className="text-xs text-white/40 ml-2">{episode.status}</span>
                        <p className="text-xs text-white/50 truncate">{episode.command}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-xl w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="font-display text-xl font-bold mb-4">Lock a series bible</h3>
            <div className="space-y-3">
              <input
                className="input-field"
                placeholder="Series name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
              <input
                className="input-field"
                placeholder="Niche"
                value={draft.niche}
                onChange={(event) => setDraft({ ...draft, niche: event.target.value })}
              />
              <textarea
                className="input-field min-h-[80px]"
                placeholder="Locked style prompt"
                value={draft.stylePrompt}
                onChange={(event) => setDraft({ ...draft, stylePrompt: event.target.value })}
              />
              <input
                className="input-field"
                placeholder="Lead character name"
                value={draft.characters[0].name}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    characters: [{ ...draft.characters[0], name: event.target.value }],
                  })
                }
              />
              <input
                className="input-field"
                placeholder="Personality"
                value={draft.characters[0].personality}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    characters: [{ ...draft.characters[0], personality: event.target.value }],
                  })
                }
              />
              <input
                className="input-field"
                placeholder="Look prompt"
                value={draft.characters[0].lookPrompt}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    characters: [{ ...draft.characters[0], lookPrompt: event.target.value }],
                  })
                }
              />
              <input
                className="input-field"
                placeholder="Product name"
                value={draft.products[0].name}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    products: [{ ...draft.products[0], name: event.target.value }],
                  })
                }
              />
              <input
                className="input-field"
                placeholder="Product look prompt"
                value={draft.products[0].lookPrompt}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    products: [{ ...draft.products[0], lookPrompt: event.target.value }],
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn-primary" type="button" disabled={creating} onClick={() => void createSeries()}>
                {creating ? "Saving…" : "Save bible"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
