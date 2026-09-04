import type {
  AudienceType,
  ClientBrief,
  ProductHighlight,
  VideoScene,
  VideoScript,
  VideoTone,
} from "@/types";

const AUDIENCE_KICKER: Record<AudienceType, string> = {
  ceo: "FOR THE OFFICE OF THE CEO",
  cto: "FOR THE OFFICE OF THE CTO",
  marketing: "FOR MARKETING LEADERSHIP",
  mixed: "FOR THE EXECUTIVE COMMITTEE",
};

const AUDIENCE_INTRO: Record<AudienceType, string> = {
  ceo: "A board-ready view of value, risk, and speed to outcome.",
  cto: "Architecture, reliability, and the path to production — without theatre.",
  marketing: "A category narrative your buyers will remember after the room goes dark.",
  mixed: "One film. Three lenses. CEO, CTO, and marketing — aligned.",
};

const TONE_CLOSE: Record<VideoTone, string> = {
  executive: "Measured. Decisive. Ready for the board.",
  technical: "Proven in production. Built to be inspected.",
  visionary: "The next operating chapter starts now.",
  bold: "The category does not wait. Neither should you.",
};

const KIND_KICKER: Record<string, string> = {
  capability: "CAPABILITY",
  outcome: "BUSINESS OUTCOME",
  proof: "PROOF",
};

function inferKind(highlight: ProductHighlight, index: number): string {
  if (highlight.kind) return highlight.kind;
  if (highlight.metric && /%|x |roi|sla|uptime/i.test(highlight.metric)) {
    return index === 0 ? "capability" : "proof";
  }
  return index % 3 === 1 ? "outcome" : "capability";
}

function punchyLine(text: string, maxWords = 9): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  if (words.length <= maxWords) {
    return cleaned.replace(/[.]+$/, "");
  }
  return `${words.slice(0, maxWords).join(" ").replace(/[,:;]+$/, "")}`;
}

function voiceForHighlight(
  brief: ClientBrief,
  highlight: ProductHighlight
): string {
  const metric = highlight.metric ? ` Proof: ${highlight.metric}.` : "";
  if (brief.targetAudience === "ceo") {
    return `${highlight.title}. ${punchyLine(highlight.description, 16)}.${metric}`;
  }
  if (brief.targetAudience === "cto") {
    return `${highlight.title} is production-ready. ${punchyLine(highlight.description, 18)}.${metric}`;
  }
  if (brief.targetAudience === "marketing") {
    return `Lead with ${highlight.title}. ${punchyLine(highlight.description, 16)}.${metric}`;
  }
  return `${highlight.title}. ${punchyLine(highlight.description, 18)}.${metric}`;
}

export function generateTemplateScript(brief: ClientBrief): VideoScript {
  const scenes: VideoScene[] = [];
  const kicker = AUDIENCE_KICKER[brief.targetAudience];

  scenes.push({
    id: "intro",
    type: "intro",
    kicker,
    headline: brief.productName,
    subheadline: brief.tagline,
    body: AUDIENCE_INTRO[brief.targetAudience],
    voiceover: `${brief.clientName} presents ${brief.productName}. ${brief.tagline}. ${AUDIENCE_INTRO[brief.targetAudience]}`,
    durationMs: 5200,
  });

  scenes.push({
    id: "problem",
    type: "problem",
    kicker: "THE STAKES",
    headline: "What leadership cannot afford to miss",
    body: brief.problemStatement,
    subheadline: brief.desiredOutcome,
    voiceover: `${brief.problemStatement} The outcome: ${brief.desiredOutcome}`,
    durationMs: 6200,
  });

  brief.highlights.forEach((highlight, index) => {
    const kind = inferKind(highlight, index);
    scenes.push({
      id: `highlight-${index}`,
      type: "highlight",
      kicker: `${String(index + 1).padStart(2, "0")}  ·  ${KIND_KICKER[kind] || "CALLOUT"}`,
      headline: highlight.title,
      body: highlight.description,
      metric: highlight.metric,
      voiceover: voiceForHighlight(brief, highlight),
      durationMs: highlight.metric ? 5600 : 5000,
    });
  });

  const quote = brief.customerQuote?.trim();
  if (quote) {
    scenes.push({
      id: "quote",
      type: "quote",
      kicker: "IN THE ROOM",
      headline: quote,
      subheadline: brief.quoteAttribution?.trim() || brief.clientName,
      voiceover: `${quote} ${brief.quoteAttribution || ""}`.trim(),
      durationMs: 5500,
    });
  }

  const metrics = brief.highlights.filter((h) => h.metric?.trim());
  if (metrics.length >= 2) {
    scenes.push({
      id: "stats",
      type: "stats",
      kicker: "PROOF IN NUMBERS",
      headline: "Impact the board can measure",
      subheadline: metrics.map((h) => h.metric).join("  ·  "),
      body: metrics.map((h) => `${h.title}: ${h.metric}`).join(" | "),
      voiceover: `Measured impact. ${metrics.map((h) => h.metric).join(". ")}.`,
      durationMs: 4800,
    });
  }

  scenes.push({
    id: "cta",
    type: "cta",
    kicker: brief.industry.toUpperCase(),
    headline: brief.callToAction,
    subheadline: TONE_CLOSE[brief.tone],
    voiceover: `${brief.callToAction}. ${TONE_CLOSE[brief.tone]}`,
    durationMs: 4800,
  });

  scenes.push({
    id: "outro",
    type: "outro",
    kicker: brief.clientName.toUpperCase(),
    headline: brief.productName,
    subheadline: brief.tagline,
    voiceover: `${brief.clientName}. ${brief.productName}.`,
    durationMs: 3600,
  });

  const totalDurationMs = scenes.reduce((sum, scene) => sum + scene.durationMs, 0);

  return {
    title: `${brief.productName} — Executive Film`,
    logline: `${brief.clientName} briefs the ${brief.targetAudience.toUpperCase()} on ${brief.productName}: ${brief.tagline}`,
    scenes,
    totalDurationMs,
    narratorNotes: [
      `Audience: ${brief.targetAudience.toUpperCase()}. Tone: ${brief.tone}.`,
      `Industry: ${brief.industry}. ${brief.highlights.length} product callouts.`,
      `Open on stakes, then feature each callout with on-screen proof, close on ${brief.callToAction}.`,
      `Keep titles large. Do not crowd. Treat metrics as board artifacts, not decoration.`,
    ].join(" "),
  };
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}:${String(rem).padStart(2, "0")}`;
}
