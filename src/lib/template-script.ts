import type { ClientBrief, VideoScene, VideoScript } from "@/types";

const audienceHeadlines: Record<string, string> = {
  ceo: "Built for Leaders Who Move Markets",
  cto: "Engineered for Scale. Designed for Trust.",
  marketing: "The Story Your Brand Deserves",
  mixed: "Where Strategy Meets Innovation",
};

export function generateTemplateScript(brief: ClientBrief): VideoScript {
  const scenes: VideoScene[] = [];

  scenes.push({
    id: "intro",
    type: "intro",
    headline: brief.productName,
    subheadline: brief.tagline,
    durationMs: 4500,
  });

  brief.highlights.forEach((highlight, index) => {
    scenes.push({
      id: `highlight-${index}`,
      type: "highlight",
      headline: highlight.title,
      body: highlight.description,
      metric: highlight.metric,
      durationMs: 5000,
    });
  });

  const metricsWithValues = brief.highlights.filter((h) => h.metric);
  if (metricsWithValues.length >= 2) {
    scenes.push({
      id: "stats",
      type: "stats",
      headline: "Proven Impact",
      subheadline: metricsWithValues.map((h) => h.metric).join("  ·  "),
      durationMs: 4000,
    });
  }

  scenes.push({
    id: "cta",
    type: "cta",
    headline: brief.callToAction,
    subheadline: audienceHeadlines[brief.targetAudience],
    durationMs: 4500,
  });

  scenes.push({
    id: "outro",
    type: "outro",
    headline: brief.clientName,
    subheadline: brief.productName,
    durationMs: 3500,
  });

  const totalDurationMs = scenes.reduce((sum, s) => sum + s.durationMs, 0);

  return {
    title: `${brief.productName} — Executive Demo`,
    scenes,
    totalDurationMs,
    narratorNotes: `Executive demo tailored for ${brief.targetAudience} audience. ${brief.industry} sector. Tone: ${brief.tone}.`,
  };
}
