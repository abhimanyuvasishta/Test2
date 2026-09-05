import type { AspectRatio, VideoFormat, VisualMood } from "@/types";

export const FORMAT_OPTIONS: {
  id: VideoFormat;
  title: string;
  blurb: string;
}[] = [
  {
    id: "faceless",
    title: "Faceless Short",
    blurb: "Narration, kinetic captions, and B-roll. The Faceless.so volume loop.",
  },
  {
    id: "product",
    title: "Product Film",
    blurb: "Locked product plates, proof points, and a cinematic CTA.",
  },
  {
    id: "conversation",
    title: "Conversation",
    blurb: "Multi-character dialogue with distinct voices and split scenes.",
  },
  {
    id: "series",
    title: "Animated Series",
    blurb: "Show bible, episode outlines, and a queue that can keep going.",
  },
];

export const ASPECT_OPTIONS: {
  id: AspectRatio;
  label: string;
  hint: string;
}[] = [
  { id: "vertical", label: "9:16", hint: "TikTok / Shorts / Reels" },
  { id: "landscape", label: "16:9", hint: "YouTube long-form" },
  { id: "square", label: "1:1", hint: "Feed posts" },
];

export const NICHE_PRESETS: {
  id: string;
  label: string;
  format: VideoFormat;
  command: string;
  mood: VisualMood;
}[] = [
  {
    id: "reddit",
    label: "Reddit Stories",
    format: "faceless",
    mood: "warm",
    command:
      "Faceless Reddit-style story: a neighbor keeps borrowing my lawn tools and returns them broken. Build tension, a twist, and a comment-bait ending.",
  },
  {
    id: "texts",
    label: "Fake Texts",
    format: "faceless",
    mood: "playful",
    command:
      "Fake iMessage drama: two coworkers text about a secret product launch. Cliffhangers every 4 seconds, last text is a twist.",
  },
  {
    id: "crime",
    label: "True Crime",
    format: "series",
    mood: "crime",
    command:
      "True-crime faceless series about a locked-room disappearance in a coastal town. 5 episodes, cold open hooks, recap each episode.",
  },
  {
    id: "motivation",
    label: "Motivation",
    format: "faceless",
    mood: "neon",
    command:
      "High-retention motivation short: stop waiting for permission to ship. Punchy lines, proof, and a hard CTA to start today.",
  },
  {
    id: "product",
    label: "Product Launch",
    format: "product",
    mood: "clean",
    command:
      "Product film for FluxMug, a leak-proof travel mug. Show the lid, heat retention, and a founder pouring coffee in a car. End on a demo CTA.",
  },
  {
    id: "debate",
    label: "Founder Debate",
    format: "conversation",
    mood: "clean",
    command:
      "Conversation between Maya (designer) and Leo (engineer) arguing whether to launch their coffee gadget now or wait for one more feature.",
  },
  {
    id: "series",
    label: "Animated Series",
    format: "series",
    mood: "neon",
    command:
      "Animated series: two founders build a household gadget company. Episode 1 is the leaky prototype disaster. Keep characters consistent across 6 episodes.",
  },
];

export const CANVAS_SIZE: Record<AspectRatio, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

export function estimateCredits(shotCount: number, format: VideoFormat): number {
  const base = 4;
  const perShot = format === "faceless" ? 6 : 10;
  return base + shotCount * perShot;
}
