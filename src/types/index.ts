export type AspectRatio = "landscape" | "vertical" | "square";
export type VideoFormat = "faceless" | "product" | "conversation" | "series";
export type ShotType =
  | "title"
  | "hook"
  | "narration"
  | "dialogue"
  | "product"
  | "broll"
  | "text_message"
  | "cta";
export type VisualMood = "dark" | "neon" | "clean" | "warm" | "crime" | "playful";
export type VoiceStyle = "narrator" | "warm" | "sharp" | "deep" | "bright";

export interface Character {
  id: string;
  name: string;
  role: string;
  look: string;
  voice: VoiceStyle;
  color: string;
}

export interface ProductBible {
  name: string;
  tagline: string;
  category: string;
  features: string[];
  brandColor: string;
}

export interface Shot {
  id: string;
  type: ShotType;
  speakerId?: string;
  line: string;
  onScreen: string;
  visual: string;
  captionStyle: "kinetic" | "subtitle" | "none";
  durationMs: number;
}

export interface EpisodeOutline {
  number: number;
  title: string;
  logline: string;
  hook: string;
}

export interface ProductionBible {
  title: string;
  logline: string;
  format: VideoFormat;
  niche: string;
  mood: VisualMood;
  aspect: AspectRatio;
  characters: Character[];
  product?: ProductBible;
  captionTheme: string;
  voiceoverStyle: string;
}

export interface Episode {
  number: number;
  title: string;
  recap?: string;
  shots: Shot[];
  totalDurationMs: number;
}

export interface Production {
  bible: ProductionBible;
  episode: Episode;
  seasonPlan: EpisodeOutline[];
  source: "ai" | "template";
  estimatedCredits: number;
}

export interface CharacterDraft {
  name: string;
  role: string;
}

export interface CommandInput {
  command: string;
  format: VideoFormat;
  aspect: AspectRatio;
  niche: string;
  episodeCount: number;
  characters: CharacterDraft[];
  productName: string;
  productFeatures: string;
  brandColor: string;
}

export interface SavedSeries {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: CommandInput;
  bible: ProductionBible;
  seasonPlan: EpisodeOutline[];
  episodes: Episode[];
  source: "ai" | "template";
}
