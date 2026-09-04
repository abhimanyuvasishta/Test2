import { describe, expect, it } from "vitest";
import { buildCaptionCues, buildSrt, formatSrtTime } from "./captions";
import { planEpisodeFromBible } from "./planner";
import { productionPlanSchema, type SeriesBible } from "./schema";

const bible: SeriesBible = {
  id: "s1",
  name: "Midnight Pour",
  niche: "coffee",
  stylePrompt: "2.5D cafe",
  aspectRatio: "9:16",
  voiceId: "narrator",
  palette: ["#f59e0b"],
  characters: [
    {
      id: "maya",
      name: "Maya",
      role: "barista",
      personality: "warm",
      lookPrompt: "apron",
      voiceId: "lead",
    },
    {
      id: "leo",
      name: "Leo",
      role: "regular",
      personality: "dry",
      lookPrompt: "hoodie",
      voiceId: "support",
    },
  ],
  products: [
    {
      id: "ember",
      name: "Ember Mug",
      lookPrompt: "charcoal mug",
      mustShowBeats: ["hero packshot", "in-hand", "logo close-up"],
    },
  ],
};

describe("production planner", () => {
  it("locks characters, product beats, and ~60s runtime from a command", () => {
    const plan = planEpisodeFromBible(
      bible,
      "Leo hates his old mug. Maya shows the Ember Mug. 60 seconds vertical.",
      1
    );
    expect(productionPlanSchema.parse(plan).version).toBe(1);
    expect(plan.runtimeSec).toBeGreaterThanOrEqual(50);
    expect(plan.runtimeSec).toBeLessThanOrEqual(70);
    expect(plan.aspectRatio).toBe("9:16");
    expect(plan.scenes.some((scene) => scene.productId === "ember")).toBe(true);
    expect(plan.scenes.some((scene) => scene.dialogue.some((line) => line.characterName === "Maya"))).toBe(
      true
    );
    expect(plan.scenes.some((scene) => scene.dialogue.some((line) => line.characterName === "Leo"))).toBe(
      true
    );
    expect(plan.scenes.filter((scene) => scene.type === "product").length).toBeGreaterThanOrEqual(2);
  });

  it("honors a shorter requested runtime", () => {
    const plan = planEpisodeFromBible(bible, "Make a 20 second teaser about the Ember Mug", 2);
    expect(plan.runtimeSec).toBeGreaterThanOrEqual(15);
    expect(plan.runtimeSec).toBeLessThanOrEqual(28);
  });
});

describe("captions", () => {
  it("formats SRT timestamps", () => {
    expect(formatSrtTime(0)).toBe("00:00:00,000");
    expect(formatSrtTime(61.5)).toBe("00:01:01,500");
  });

  it("covers the full audio window", () => {
    const plan = planEpisodeFromBible(bible, "60 seconds Ember Mug argument", 1);
    const cues = buildCaptionCues(plan, 60);
    expect(cues.length).toBeGreaterThan(3);
    expect(cues[0].startSec).toBe(0);
    expect(cues[cues.length - 1].endSec).toBeGreaterThanOrEqual(59);
    expect(buildSrt(plan, 60)).toContain("Maya:");
  });
});
