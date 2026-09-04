import type { ClientBrief, ProductHighlight, VideoScene, VideoScript } from "@/types";

interface CastMember {
  name: string;
  role: string;
  look: string;
}

interface Cast {
  hero: CastMember;
  ally: CastMember;
  world: string;
  lighting: string;
  vehicle?: string;
}

function industryCast(brief: ClientBrief): Cast {
  const industry = brief.industry.toLowerCase();
  const brand = brief.clientName;

  if (/insur|motor|auto|car|ncb/.test(`${industry} ${brief.productName} ${brief.tagline}`)) {
    return {
      hero: {
        name: "Mira Sen",
        role: "Policyholder",
        look: "South Asian woman 34, shoulder-length black hair, charcoal wool coat, gold hoop earrings, photoreal",
      },
      ally: {
        name: `${brand} advisor`,
        role: "Advisor",
        look: "South Asian man 38, black suit, no tie, calm expression, photoreal, same commercial",
      },
      world: "rain-slick Bengaluru streets and a premium parking garage at night",
      lighting: "cinematic teal-and-warm practicals, anamorphic bokeh, luxury TV ad",
      vehicle: "glossy black hatchback",
    };
  }

  if (/industrial|plant|ops|manufact/.test(industry)) {
    return {
      hero: {
        name: "Elena Voss",
        role: "COO",
        look: "woman 48, silver-blonde hair tied back, navy work coat over a blouse, photoreal",
      },
      ally: {
        name: `${brand} lead`,
        role: "Systems lead",
        look: "man 42, rolled sleeves, headset, control-room lighting, photoreal",
      },
      world: "a vast industrial control room overlooking a night-shift plant",
      lighting: "cinematic cool monitors and warm practical lamps",
    };
  }

  return {
    hero: {
      name: "Alex Rahman",
      role: "Buyer",
      look: "person 36, tailored black jacket, short dark hair, photoreal",
    },
    ally: {
      name: `${brand} specialist`,
      role: "Specialist",
      look: "person 40, charcoal suit, approachable, photoreal",
    },
    world: `a premium ${brief.industry} workplace at dusk`,
    lighting: "cinematic luxury commercial lighting, shallow depth of field",
  };
}

function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

function platePrompt(brief: ClientBrief, cast: Cast, action: string): string {
  const vehicle = cast.vehicle ? `, ${cast.vehicle} in frame when relevant` : "";
  return [
    "photoreal cinematic TV commercial still, 35mm anamorphic, 16:9, ultra detailed",
    cast.lighting,
    action,
    `hero: ${cast.hero.look}`,
    `second character when present: ${cast.ally.look}`,
    `location: ${cast.world}${vehicle}`,
    `brand world of ${brief.clientName} ${brief.productName}, ${brief.tagline}`,
    "no captions, no logos, no watermark, no text overlay",
  ].join(". ");
}

function beatLine(highlight: ProductHighlight): string {
  if (highlight.metric) return `${highlight.title}. ${highlight.metric}.`;
  return highlight.title;
}

export function generateTemplateScript(brief: ClientBrief): VideoScript {
  const cast = industryCast(brief);
  const scenes: VideoScene[] = [];
  const baseSeed = seedFrom(brief.clientName + brief.productName);

  const push = (scene: VideoScene) => {
    scenes.push({
      ...scene,
      imageSeed: scene.imageSeed ?? baseSeed + scenes.length * 17,
    });
  };

  push({
    id: "open",
    type: "intro",
    kicker: "COLD OPEN",
    character: cast.hero.name,
    characterRole: cast.hero.role,
    location: cast.world,
    headline: brief.productName,
    subheadline: brief.tagline,
    dialogue: `Five years with ${brief.clientName}. I did everything right.`,
    voiceover: `${cast.hero.name} has been the perfect customer. Then the product has to prove it.`,
    body: brief.tagline,
    durationMs: 4800,
    imagePrompt: platePrompt(
      brief,
      cast,
      `${cast.hero.name} walks to her car at night, confident, city lights, medium-wide shot`
    ),
  });

  push({
    id: "incident",
    type: "problem",
    kicker: "THE MOMENT",
    character: cast.hero.name,
    characterRole: cast.hero.role,
    location: cast.world,
    headline: "One ordinary knock",
    subheadline: brief.problemStatement,
    dialogue: "It was only a scrape. Then I thought about the renewal.",
    voiceover: brief.problemStatement,
    body: brief.problemStatement,
    durationMs: 5600,
    imagePrompt: platePrompt(
      brief,
      cast,
      `${cast.hero.name} froze beside a lightly scuffed bumper, worried close-up, rain on metal`
    ),
  });

  push({
    id: "fear",
    type: "problem",
    kicker: "THE COST",
    character: cast.hero.name,
    characterRole: cast.hero.role,
    location: "kitchen, night, phone glow",
    headline: brief.tagline,
    dialogue: `They said one claim could wipe my ${brief.tagline}.`,
    voiceover: `Without ${brief.productName}, ${brief.problemStatement}`,
    body: brief.problemStatement,
    durationMs: 4800,
    imagePrompt: platePrompt(
      brief,
      cast,
      `${cast.hero.name} in a quiet kitchen at night staring at an insurance renewal on her phone, dread, intimate close-up`
    ),
  });

  const beats = brief.highlights.slice(0, 3);
  beats.forEach((highlight, index) => {
    const withAlly = index !== 1;
    push({
      id: `beat-${index}`,
      type: "highlight",
      kicker: "PRODUCT",
      character: withAlly ? cast.ally.name : cast.hero.name,
      characterRole: withAlly ? cast.ally.role : cast.hero.role,
      location: withAlly ? `${brief.clientName} studio` : cast.world,
      headline: highlight.title,
      subheadline: highlight.description,
      metric: highlight.metric,
      dialogue: withAlly
        ? `${brief.tagline} means ${highlight.title.toLowerCase()}. ${highlight.metric || "You keep what you earned."}`
        : `Show me. ${highlight.title}.`,
      voiceover: `${highlight.title}. ${highlight.description}${highlight.metric ? ` ${highlight.metric}.` : ""}`,
      body: highlight.description,
      durationMs: 5400,
      imagePrompt: platePrompt(
        brief,
        cast,
        withAlly
          ? `${cast.ally.name} explains ${highlight.title} to ${cast.hero.name} across a black desk, product brochure for ${brief.productName}, two-shot`
          : `${cast.hero.name} using a premium mobile app in the car, relief starting, ${highlight.title}`
      ),
    });
  });

  const quote = brief.customerQuote?.trim();
  if (quote) {
    push({
      id: "testimonial",
      type: "quote",
      kicker: "REAL VOICE",
      character: brief.quoteAttribution?.split(",")[0] || cast.hero.name,
      characterRole: "Customer",
      location: cast.world,
      headline: quote,
      subheadline: brief.quoteAttribution,
      dialogue: quote,
      voiceover: quote,
      durationMs: 5200,
      imagePrompt: platePrompt(
        brief,
        cast,
        `${cast.hero.name} smiling at renewal, golden hour through a car window, hopeful close-up`
      ),
    });
  }

  const metrics = brief.highlights.filter((h) => h.metric?.trim());
  if (metrics.length >= 2) {
    push({
      id: "proof",
      type: "stats",
      kicker: "ON SCREEN",
      character: cast.hero.name,
      characterRole: cast.hero.role,
      location: "renewal screen",
      headline: "The renewal did not punish her",
      subheadline: metrics.map((h) => h.metric).join("  ·  "),
      body: metrics.map((h) => `${h.title}: ${h.metric}`).join(" | "),
      dialogue: metrics.map((h) => h.metric).filter(Boolean).join(". ") + ".",
      voiceover: `Measured. ${metrics.map((h) => h.metric).join(". ")}.`,
      durationMs: 4600,
      imagePrompt: platePrompt(
        brief,
        cast,
        `${cast.hero.name} holds a phone showing a clean renewal, over-the-shoulder, shallow focus, night`
      ),
    });
  }

  push({
    id: "packshot",
    type: "cta",
    kicker: brief.industry.toUpperCase(),
    character: cast.ally.name,
    characterRole: cast.ally.role,
    location: "brand studio",
    headline: brief.callToAction,
    subheadline: `${brief.clientName}  ·  ${brief.tagline}`,
    dialogue: `${brief.productName}. ${brief.tagline}. ${brief.callToAction}.`,
    voiceover: `${brief.callToAction}. ${brief.productName} from ${brief.clientName}.`,
    durationMs: 5000,
    imagePrompt: platePrompt(
      brief,
      cast,
      `hero product packshot: ${cast.hero.name} and ${cast.ally.name} standing beside the black car, confident, night, cinematic wide`
    ),
  });

  push({
    id: "endcard",
    type: "outro",
    kicker: brief.clientName.toUpperCase(),
    character: brief.clientName,
    characterRole: "Brand",
    location: "end card",
    headline: brief.clientName,
    subheadline: `${brief.productName}  ·  ${brief.tagline}`,
    dialogue: brief.tagline,
    voiceover: `${brief.clientName}. ${brief.productName}. ${brief.tagline}.`,
    durationMs: 3600,
    imagePrompt: platePrompt(
      brief,
      cast,
      `empty night street, black car driving away, taillights bokeh, premium automotive insurance commercial, no people faces needed`
    ),
  });

  const totalDurationMs = scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  const beatList = beats.map(beatLine).join("; ");

  return {
    title: `${brief.clientName} — ${brief.productName} (TV commercial)`,
    logline: `${cast.hero.name} lives the problem, meets ${cast.ally.name}, and ${brief.productName} (${brief.tagline}) earns the renewal.`,
    scenes,
    totalDurationMs,
    narratorNotes: [
      `TV commercial, not a slide film. Recurring cast: ${cast.hero.name} (${cast.hero.role}) and ${cast.ally.name}.`,
      `World: ${cast.world}. Product beats: ${beatList}.`,
      `Shoot photoreal plates, Ken Burns in the cut, burnt-in dialogue like a broadcast spot.`,
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
