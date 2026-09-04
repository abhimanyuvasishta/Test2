export type AudienceType = "ceo" | "cto" | "marketing" | "mixed";

export type VideoTone = "executive" | "technical" | "visionary" | "bold";

export interface ProductHighlight {
  id: string;
  title: string;
  description: string;
  metric?: string;
}

export interface ClientBrief {
  clientName: string;
  productName: string;
  tagline: string;
  industry: string;
  targetAudience: AudienceType;
  tone: VideoTone;
  brandColor: string;
  highlights: ProductHighlight[];
  callToAction: string;
}

export interface VideoScene {
  id: string;
  type: "intro" | "highlight" | "stats" | "cta" | "outro";
  headline: string;
  subheadline?: string;
  body?: string;
  metric?: string;
  durationMs: number;
}

export interface VideoScript {
  title: string;
  scenes: VideoScene[];
  totalDurationMs: number;
  narratorNotes: string;
}

export interface GenerationResult {
  script: VideoScript;
  source: "ai" | "template";
}
