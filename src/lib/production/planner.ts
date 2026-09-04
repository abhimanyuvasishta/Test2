import type { BibleCharacter, BibleProduct, ProductionPlan, SeriesBible } from "./schema";
import { productionPlanSchema, scalePlanToRuntime } from "./schema";

const TARGET_RUNTIME = 60;

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "episode";
}

function firstName(character: BibleCharacter | undefined, fallback: string): string {
  return character?.name.split(" ")[0] || fallback;
}

function parseRequestedRuntime(command: string): number {
  const match = command.match(/(\d+)\s*(s|sec|secs|second|seconds)\b/i);
  if (!match) return TARGET_RUNTIME;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return TARGET_RUNTIME;
  return Math.min(90, Math.max(15, value));
}

function pickProduct(bible: SeriesBible, command: string): BibleProduct | undefined {
  const lower = command.toLowerCase();
  return (
    bible.products.find((product) => lower.includes(product.name.toLowerCase())) ||
    bible.products[0]
  );
}

export function planEpisodeFromBible(bible: SeriesBible, command: string, episodeNumber: number): ProductionPlan {
  const runtime = parseRequestedRuntime(command);
  const product = pickProduct(bible, command);
  const lead = bible.characters[0];
  const support = bible.characters[1] || bible.characters[0];
  const leadName = firstName(lead, "Host");
  const supportName = firstName(support, "Guest");
  const productName = product?.name || "the product";
  const beats = product?.mustShowBeats?.length
    ? product.mustShowBeats
    : ["hero packshot", "in-hand", "logo close-up"];

  const title = `${bible.name} · Ep ${episodeNumber}`;
  const hookLine = command.replace(/\s+/g, " ").trim().slice(0, 90);

  const scenes: ProductionPlan["scenes"] = [
    {
      id: "hook",
      type: "hook",
      durationSec: 6,
      location: "cold open",
      onScreenText: hookLine.length > 8 ? hookLine : `${leadName} has a problem`,
      action: `Cold open in the locked ${bible.niche} world.`,
      characterId: lead?.id,
      dialogue: lead
        ? [
            {
              characterId: lead.id,
              characterName: lead.name,
              text: `${leadName} here. Today we settle this in sixty seconds.`,
            },
          ]
        : [],
    },
    {
      id: "problem",
      type: "talking",
      durationSec: 8,
      location: "series home set",
      onScreenText: "The old way is broken",
      action: `${supportName} pushes back. Keep wardrobe and lighting from the series bible.`,
      characterId: support?.id,
      dialogue: [
        support
          ? {
              characterId: support.id,
              characterName: support.name,
              text: `I am not buying another gimmick. Convince me ${productName} is different.`,
            }
          : {
              characterId: "narrator",
              characterName: "Narrator",
              text: `Most people still settle for the old version of ${productName}.`,
            },
      ],
    },
    {
      id: "product-hero",
      type: "product",
      durationSec: 8,
      location: "product table",
      onScreenText: productName,
      action: `Must-show beat: ${beats[0]}. Never invent a new shape or logo.`,
      productId: product?.id,
      dialogue: [
        {
          characterId: lead?.id || "narrator",
          characterName: lead?.name || "Narrator",
          text: `This is ${productName}. Same design every episode. Watch the details.`,
        },
      ],
    },
    {
      id: "conversation",
      type: "talking",
      durationSec: 12,
      location: "two-shot",
      onScreenText: `${leadName} vs ${supportName}`,
      action: "Dialogue scene. Cut on lines. Hold character sheets; low motion.",
      dialogue: [
        lead
          ? {
              characterId: lead.id,
              characterName: lead.name,
              text: `It is not a gimmick. It is the thing you actually use every day.`,
            }
          : {
              characterId: "narrator",
              characterName: "Narrator",
              text: `${productName} is built for daily use, not a one-time demo.`,
            },
        support && support.id !== lead?.id
          ? {
              characterId: support.id,
              characterName: support.name,
              text: `Okay. Show me the in-hand shot. If it feels cheap, I walk.`,
            }
          : {
              characterId: "narrator",
              characterName: "Narrator",
              text: "Next, the in-hand proof.",
            },
      ],
    },
    {
      id: "product-in-hand",
      type: "product",
      durationSec: 8,
      location: "in-hand insert",
      onScreenText: beats[1] || "In hand",
      action: `Must-show beat: ${beats[1] || "in-hand"}. Match the product sheet lighting.`,
      productId: product?.id,
      characterId: lead?.id,
      dialogue: [
        {
          characterId: lead?.id || "narrator",
          characterName: lead?.name || "Narrator",
          text: `In hand it feels solid. That is the shot we reuse for the whole series.`,
        },
      ],
    },
    {
      id: "broll",
      type: "broll",
      durationSec: 8,
      location: bible.niche,
      onScreenText: bible.niche,
      action: `B-roll in the locked world. Palette ${bible.palette.join(", ")}.`,
      dialogue: [
        {
          characterId: "narrator",
          characterName: "Narrator",
          text: `Command for this episode: ${command.slice(0, 140)}`,
        },
      ],
    },
    {
      id: "cta",
      type: "end_card",
      durationSec: 10,
      location: "end card",
      onScreenText: `Watch ${bible.name}`,
      action: `End card plus logo close-up (${beats[2] || "logo"}). Same type lockup every episode.`,
      productId: product?.id,
      dialogue: [
        {
          characterId: lead?.id || "narrator",
          characterName: lead?.name || "Narrator",
          text: `Follow ${bible.name} for the next episode. Same world. New argument.`,
        },
      ],
    },
  ];

  const draft: ProductionPlan = {
    version: 1,
    title,
    runtimeSec: scenes.reduce((sum, scene) => sum + scene.durationSec, 0),
    aspectRatio: bible.aspectRatio,
    stylePrompt: bible.stylePrompt,
    seriesId: bible.id,
    episodeNumber,
    command,
    characters: bible.characters,
    products: bible.products,
    scenes,
  };

  return productionPlanSchema.parse(scalePlanToRuntime(draft, runtime));
}

export function episodeSlug(plan: ProductionPlan): string {
  return `${slug(plan.title)}-${plan.episodeNumber}`;
}
