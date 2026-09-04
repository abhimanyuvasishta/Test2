export type AudienceType = "ceo" | "cto" | "marketing" | "mixed";

export type VideoTone = "executive" | "technical" | "visionary" | "bold";

export type HighlightKind = "capability" | "outcome" | "proof";

export interface ProductHighlight {
  id: string;
  title: string;
  description: string;
  metric?: string;
  kind?: HighlightKind;
}

export interface ClientBrief {
  clientName: string;
  productName: string;
  tagline: string;
  industry: string;
  problemStatement: string;
  desiredOutcome: string;
  customerQuote?: string;
  quoteAttribution?: string;
  targetAudience: AudienceType;
  tone: VideoTone;
  brandColor: string;
  highlights: ProductHighlight[];
  callToAction: string;
}

export type SceneType =
  | "intro"
  | "problem"
  | "highlight"
  | "quote"
  | "stats"
  | "cta"
  | "outro";

export interface VideoScene {
  id: string;
  type: SceneType;
  kicker?: string;
  headline: string;
  subheadline?: string;
  body?: string;
  metric?: string;
  voiceover?: string;
  durationMs: number;
  character?: string;
  characterRole?: string;
  dialogue?: string;
  location?: string;
  imagePrompt?: string;
  imageSeed?: number;
}

export interface VideoScript {
  title: string;
  logline: string;
  scenes: VideoScene[];
  totalDurationMs: number;
  narratorNotes: string;
}

export interface GenerationResult {
  script: VideoScript;
  source: "ai" | "template";
}
