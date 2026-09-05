import type { Character, CommandInput, Episode, Production, SavedSeries } from "@/types";

const KEY = "forge-series-v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function listSeries(): SavedSeries[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedSeries[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSeries(series: SavedSeries): void {
  if (!canUseStorage()) return;
  const all = listSeries().filter((item) => item.id !== series.id);
  all.unshift(series);
  window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 24)));
}

export function getSeries(id: string): SavedSeries | undefined {
  return listSeries().find((item) => item.id === id);
}

export function deleteSeries(id: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    KEY,
    JSON.stringify(listSeries().filter((item) => item.id !== id))
  );
}

export function upsertEpisode(series: SavedSeries, episode: Episode): SavedSeries {
  const episodes = series.episodes.filter((item) => item.number !== episode.number);
  episodes.push(episode);
  episodes.sort((a, b) => a.number - b.number);
  const next: SavedSeries = {
    ...series,
    episodes,
    updatedAt: new Date().toISOString(),
  };
  saveSeries(next);
  return next;
}

export function productionToSeries(
  production: Production,
  input: CommandInput,
  id?: string
): SavedSeries {
  const now = new Date().toISOString();
  return {
    id: id || crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    input,
    bible: production.bible,
    seasonPlan: production.seasonPlan,
    episodes: [production.episode],
    source: production.source,
  };
}

export function characterVoiceURI(character: Character, voices: SpeechSynthesisVoice[]): string | undefined {
  if (voices.length === 0) return undefined;
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const pool = english.length > 0 ? english : voices;
  const hash = character.name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return pool[hash % pool.length]?.voiceURI;
}
