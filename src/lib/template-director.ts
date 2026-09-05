import { estimateCredits } from "./formats";
import { estimateSpeechMs } from "./captions";
import type {
  Character,
  CommandInput,
  Episode,
  EpisodeOutline,
  Production,
  ProductionBible,
  ProductBible,
  Shot,
  ShotType,
  VisualMood,
  VoiceStyle,
} from "@/types";

const CHARACTER_COLORS = ["#f472b6", "#38bdf8", "#a78bfa", "#34d399", "#fb7185", "#fbbf24"];
const VOICES: VoiceStyle[] = ["warm", "sharp", "deep", "bright", "narrator"];

const NICHE_MOOD: Record<string, VisualMood> = {
  crime: "crime",
  "true crime": "crime",
  motivation: "neon",
  reddit: "warm",
  text: "playful",
  product: "clean",
  founder: "clean",
  scary: "dark",
  horror: "dark",
};

function slugId(prefix: string, value: string, index: number): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  return `${prefix}-${slug}-${index}`;
}

function moodFromNiche(niche: string, format: CommandInput["format"]): VisualMood {
  const hay = `${niche}`.toLowerCase();
  for (const [key, mood] of Object.entries(NICHE_MOOD)) {
    if (hay.includes(key)) return mood;
  }
  if (format === "faceless") return "dark";
  if (format === "product") return "clean";
  if (format === "conversation") return "warm";
  return "neon";
}

function extractNames(command: string): string[] {
  const matches = Array.from(command.matchAll(/\b([A-Z][a-z]{2,15})\b/g)).map((m) => m[1]);
  const skip = new Set([
    "Faceless",
    "Reddit",
    "True",
    "Crime",
    "Episode",
    "TikTok",
    "YouTube",
    "Shorts",
    "The",
    "This",
    "Make",
    "Create",
    "Build",
    "Show",
    "Keep",
    "Watch",
    "Animated",
    "Series",
    "Product",
    "Founder",
    "Conversation",
  ]);
  const unique: string[] = [];
  for (const name of matches) {
    if (skip.has(name) || unique.includes(name)) continue;
    unique.push(name);
    if (unique.length >= 4) break;
  }
  return unique;
}

function buildCharacters(input: CommandInput): Character[] {
  const drafts =
    input.characters.filter((c) => c.name.trim()).length > 0
      ? input.characters.filter((c) => c.name.trim())
      : extractNames(input.command).map((name, index) => ({
          name,
          role: index === 0 ? "Lead" : "Co-lead",
        }));

  const fallback =
    drafts.length > 0
      ? drafts
      : input.format === "conversation" || input.format === "series"
        ? [
            { name: "Maya", role: "Lead" },
            { name: "Leo", role: "Co-lead" },
          ]
        : [{ name: "Narrator", role: "Voiceover" }];

  if (!fallback.some((c) => c.name.toLowerCase() === "narrator") && input.format !== "conversation") {
    fallback.unshift({ name: "Narrator", role: "Voiceover" });
  }

  return fallback.slice(0, 5).map((draft, index) => ({
    id: slugId("char", draft.name, index),
    name: draft.name.trim(),
    role: draft.role.trim() || (index === 0 ? "Lead" : "Supporting"),
    look: `${draft.name} stays visually locked: same outfit, hair, and color accent in every shot.`,
    voice: VOICES[index % VOICES.length],
    color: CHARACTER_COLORS[index % CHARACTER_COLORS.length],
  }));
}

function buildProduct(input: CommandInput): ProductBible | undefined {
  const named =
    input.productName.trim() ||
    input.command.match(/\bfor\s+([A-Z][A-Za-z0-9]+)/)?.[1] ||
    "";
  if (!named && input.format !== "product") return undefined;
  const name = named || "Hero Product";
  const features = input.productFeatures
    .split(/,|\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    name,
    tagline: features[0] || "Designed to be remembered in one glance.",
    category: input.niche || "Consumer product",
    features: features.length > 0 ? features : ["Signature look", "One killer demo moment", "Clear CTA"],
    brandColor: input.brandColor,
  };
}

function shot(
  index: number,
  type: ShotType,
  line: string,
  visual: string,
  extra: Partial<Shot> = {}
): Shot {
  const onScreen = extra.onScreen || line.split(/[.!?]/)[0]?.trim() || line.slice(0, 42);
  return {
    id: `shot-${index}`,
    type,
    line,
    onScreen,
    visual,
    captionStyle: extra.captionStyle ?? (type === "title" ? "none" : "kinetic"),
    durationMs: extra.durationMs ?? estimateSpeechMs(line),
    speakerId: extra.speakerId,
  };
}

function findCharacter(characters: Character[], hint: string): Character {
  const lower = hint.toLowerCase();
  return (
    characters.find((c) => c.name.toLowerCase() === lower) ||
    characters.find((c) => c.role.toLowerCase().includes(lower)) ||
    characters.find((c) => c.name.toLowerCase() !== "narrator") ||
    characters[0]
  );
}

function facelessShots(
  input: CommandInput,
  bible: ProductionBible,
  episodeNumber: number
): Shot[] {
  const narrator = findCharacter(bible.characters, "narrator");
  const topic = input.command.replace(/\s+/g, " ").trim();
  const hook = topic.split(/[.!?]/)[0] || topic;
  const product = bible.product?.name;
  const beats = [
    shot(1, "title", bible.title, "Bold title card, grain, slow camera drift", {
      durationMs: 2200,
      captionStyle: "none",
    }),
    shot(2, "hook", `${hook}. You are not ready for what happens next.`, "Tight B-roll, hard cut on last word", {
      speakerId: narrator.id,
    }),
    shot(
      3,
      "narration",
      episodeNumber === 1
        ? `Here is the setup. ${topic}`
        : `Previously: the story got worse. Episode ${episodeNumber} starts where it hurt.`,
      "Abstract documentary B-roll, desaturated",
      { speakerId: narrator.id }
    ),
    shot(4, "broll", "Every detail looked normal. That was the trick.", "Slow push on an ordinary object", {
      speakerId: narrator.id,
    }),
    shot(
      5,
      input.command.toLowerCase().includes("text") ? "text_message" : "narration",
      input.command.toLowerCase().includes("text")
        ? "They typed: don't post this. Then they posted it anyway."
        : "Then the timeline broke. One choice. No going back.",
      input.command.toLowerCase().includes("text")
        ? "iMessage thread, typing dots, cliffhanger bubble"
        : "High-contrast B-roll, zoom punch",
      { speakerId: narrator.id }
    ),
    shot(
      6,
      product ? "product" : "narration",
      product
        ? `And yes, ${product} is in the frame on purpose. Watch the demo beat.`
        : "If you have seen this pattern before, you already know the ending. Stay anyway.",
      product ? `Locked product plate of ${product}` : "Montage of proof shots",
      { speakerId: narrator.id }
    ),
    shot(7, "cta", "Follow for the next one. The comments will fight about this.", "End card with series title", {
      speakerId: narrator.id,
      durationMs: 2800,
    }),
  ];
  return beats;
}

function productShots(input: CommandInput, bible: ProductionBible): Shot[] {
  const product = bible.product;
  const name = product?.name || "the product";
  const features = product?.features || [];
  const narrator = bible.characters[0];
  const talent = bible.characters.find((c) => c.name !== narrator.name) || narrator;
  const list: Shot[] = [
    shot(1, "title", name, `Hero still of ${name} on a locked set`, { durationMs: 2000, captionStyle: "none" }),
    shot(2, "hook", `${name}. One shot and you understand why it exists.`, `Macro product hero, brand color ${bible.product?.brandColor || input.brandColor}`, {
      speakerId: narrator.id,
    }),
    shot(3, "product", product?.tagline || `Built for people who actually use ${name}.`, "360 product plate, no logo drift", {
      speakerId: talent.id,
    }),
  ];
  features.slice(0, 3).forEach((feature, index) => {
    list.push(
      shot(
        4 + index,
        "product",
        feature,
        `Feature plate ${index + 1}: ${feature}. Keep the SKU identical.`,
        { speakerId: index % 2 === 0 ? narrator.id : talent.id }
      )
    );
  });
  list.push(
    shot(
      20,
      "cta",
      input.command.toLowerCase().includes("demo")
        ? `Book the demo. See ${name} in the room.`
        : `Get ${name}. Don't explain it — show it.`,
      "CTA card with product lockup",
      { speakerId: narrator.id, durationMs: 3000 }
    )
  );
  return list;
}

function conversationShots(bible: ProductionBible, episodeNumber: number): Shot[] {
  const people = bible.characters.filter((c) => c.name.toLowerCase() !== "narrator");
  const a = people[0] || bible.characters[0];
  const b = people[1] || people[0] || bible.characters[0];
  const product = bible.product?.name;
  const lines: Array<{ who: Character; type: ShotType; line: string; visual: string }> = [
    {
      who: a,
      type: "hook",
      line: episodeNumber === 1 ? "We cannot ship this. Not like this." : "You said last episode this was fixed.",
      visual: `${a.name} close-up, locked wardrobe`,
    },
    {
      who: b,
      type: "dialogue",
      line: product
        ? `${product} leaks if you look at it wrong. That is not a launch.`
        : "Then we keep talking and never put it in anyone's hands.",
      visual: `${b.name} medium shot, same set`,
    },
    {
      who: a,
      type: "dialogue",
      line: "Customers do not buy perfect. They buy a story they can finish.",
      visual: "Over-shoulder two-shot, product on the table",
    },
    {
      who: b,
      type: "product",
      line: product ? `Watch the lid. If this clip holds, we go.` : "Fine. One take. If it lands, we post tonight.",
      visual: product ? `Hands on ${product}, identity lock` : "Hands on the prototype",
    },
    {
      who: a,
      type: "dialogue",
      line: "If it fails on camera, that is the episode. We do not cut the truth.",
      visual: `${a.name} walks the frame, consistent lighting`,
    },
    {
      who: b,
      type: "cta",
      line: "Next time: we film the drop test. Don't skip it.",
      visual: "Title-safe end card with both characters",
    },
  ];
  return lines.map((item, index) =>
    shot(index + 1, item.type, item.line, item.visual, { speakerId: item.who.id })
  );
}

function seriesPlan(input: CommandInput, bible: ProductionBible): EpisodeOutline[] {
  const count = Math.max(input.format === "series" ? 3 : 1, Math.min(input.episodeCount, 12));
  const name = bible.product?.name || bible.title;
  const seeds = [
    { title: "The Prototype", logline: `The first public demo of ${name} goes wrong.`, hook: "It was supposed to be a victory lap." },
    { title: "The Comment", logline: "A single comment forces a redesign overnight.", hook: "Someone used it in a way they never tested." },
    { title: "The Drop", logline: "A live drop-test in front of strangers.", hook: "If it cracks, the company cracks." },
    { title: "The Copycat", logline: "A cheaper clone appears before they ship.", hook: "Someone stole the silhouette." },
    { title: "The Waitlist", logline: "Demand arrives before the factory does.", hook: "Ten thousand people. Zero inventory." },
    { title: "The Night Build", logline: "One all-nighter decides the season.", hook: "They had until sunrise." },
  ];
  return Array.from({ length: count }, (_, index) => {
    const seed = seeds[index % seeds.length];
    return {
      number: index + 1,
      title: seed.title,
      logline: seed.logline,
      hook: seed.hook,
    };
  });
}

export function buildBible(input: CommandInput): ProductionBible {
  const characters = buildCharacters(input);
  const product = buildProduct(input);
  const niche = input.niche || guessNiche(input.command, input.format);
  const title = product?.name
    ? `${product.name} ${input.format === "series" ? "Chronicles" : "Film"}`
    : titleFromCommand(input.command);
  return {
    title,
    logline: input.command.trim().slice(0, 220),
    format: input.format,
    niche,
    mood: moodFromNiche(`${niche} ${input.command}`, input.format),
    aspect: input.aspect,
    characters,
    product,
    captionTheme: input.format === "faceless" ? "kinetic-yellow" : "subtitle-clean",
    voiceoverStyle:
      input.format === "conversation" ? "Distinct character voices, no narrator wash" : "Single locked narrator, high retention",
  };
}

function guessNiche(command: string, format: CommandInput["format"]): string {
  const hay = command.toLowerCase();
  if (hay.includes("true crime") || hay.includes("disappear")) return "True crime";
  if (hay.includes("reddit")) return "Reddit stories";
  if (hay.includes("text")) return "Fake texts";
  if (hay.includes("motivat")) return "Motivation";
  if (format === "product") return "Product launch";
  if (format === "conversation") return "Founder dialogue";
  if (format === "series") return "Animated series";
  return "Faceless shorts";
}

function titleFromCommand(command: string): string {
  const first = command.split(/[.!?\n]/)[0]?.trim() || "Untitled Series";
  return first.length > 42 ? `${first.slice(0, 39)}…` : first;
}

export function buildEpisode(
  input: CommandInput,
  bible: ProductionBible,
  episodeNumber: number,
  outline?: EpisodeOutline
): Episode {
  let shots: Shot[];
  if (input.format === "product") {
    shots = productShots(input, bible);
  } else if (input.format === "conversation") {
    shots = conversationShots(bible, episodeNumber);
  } else if (input.format === "series" && episodeNumber > 1) {
    shots = conversationShots(bible, episodeNumber);
    const narrator = findCharacter(bible.characters, "narrator");
    shots = [
      shot(0, "title", outline?.title || `Episode ${episodeNumber}`, "Recap card", {
        durationMs: 2000,
        captionStyle: "none",
      }),
      shot(1, "narration", outline?.hook || `Previously on ${bible.title}.`, "Recap montage", {
        speakerId: narrator.id,
      }),
      ...shots.map((item, index) => ({ ...item, id: `shot-${index + 3}` })),
    ];
  } else if (input.format === "series") {
    shots = [...facelessShots(input, bible, episodeNumber).slice(0, 3), ...conversationShots(bible, episodeNumber).slice(1)];
    shots = shots.map((item, index) => ({ ...item, id: `shot-${index + 1}` }));
  } else {
    shots = facelessShots(input, bible, episodeNumber);
  }

  const totalDurationMs = shots.reduce((sum, item) => sum + item.durationMs, 0);
  return {
    number: episodeNumber,
    title: outline?.title || (episodeNumber === 1 ? bible.title : `${bible.title} · E${episodeNumber}`),
    recap: episodeNumber > 1 ? outline?.logline : undefined,
    shots,
    totalDurationMs,
  };
}

export function generateTemplateProduction(input: CommandInput, episodeNumber = 1): Production {
  const bible = buildBible(input);
  const seasonPlan = input.format === "series" ? seriesPlan(input, bible) : [
    {
      number: 1,
      title: bible.title,
      logline: bible.logline,
      hook: bible.logline,
    },
  ];
  const outline = seasonPlan.find((item) => item.number === episodeNumber) || seasonPlan[0];
  const episode = buildEpisode(input, bible, episodeNumber, outline);
  return {
    bible,
    episode,
    seasonPlan,
    source: "template",
    estimatedCredits: estimateCredits(episode.shots.length, input.format),
  };
}

export function generateNextEpisode(input: CommandInput, bible: ProductionBible, nextNumber: number, plan: EpisodeOutline[]): Production {
  const outline = plan.find((item) => item.number === nextNumber) || {
    number: nextNumber,
    title: `Episode ${nextNumber}`,
    logline: `The story continues.`,
    hook: `Previously on ${bible.title}.`,
  };
  const episode = buildEpisode(input, bible, nextNumber, outline);
  return {
    bible,
    episode,
    seasonPlan: plan,
    source: "template",
    estimatedCredits: estimateCredits(episode.shots.length, input.format),
  };
}
