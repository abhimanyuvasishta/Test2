import { describe, expect, it } from "vitest";
import { captionWindow, estimateSpeechMs, splitCaptionWords } from "./captions";
import { generateTemplateProduction, generateNextEpisode } from "./template-director";
import { estimateCredits } from "./formats";
import { sampleCommand } from "./validation";
import { commandInputSchema } from "./validation";

describe("captions", () => {
  it("splits words and windows the active caption", () => {
    const words = splitCaptionWords("  We cannot ship this.  ");
    expect(words).toEqual(["We", "cannot", "ship", "this."]);
    const windowed = captionWindow(words, 0.5, 3);
    expect(windowed.words.length).toBeGreaterThan(0);
    expect(windowed.activeIndex).toBeGreaterThanOrEqual(0);
  });

  it("estimates speech duration in a usable range", () => {
    const ms = estimateSpeechMs("We cannot ship this product tonight.");
    expect(ms).toBeGreaterThanOrEqual(2200);
    expect(ms).toBeLessThanOrEqual(8000);
  });
});

describe("template director", () => {
  it("builds a series bible with locked characters, product, and a season plan", () => {
    const production = generateTemplateProduction(sampleCommand);
    expect(production.bible.characters.some((c) => c.name === "Maya")).toBe(true);
    expect(production.bible.characters.some((c) => c.name === "Leo")).toBe(true);
    expect(production.bible.product?.name).toBe("FluxMug");
    expect(production.episode.shots.length).toBeGreaterThan(5);
    expect(production.seasonPlan.length).toBe(6);
    expect(production.episode.totalDurationMs).toBe(
      production.episode.shots.reduce((sum, shot) => sum + shot.durationMs, 0)
    );
    expect(production.estimatedCredits).toBe(
      estimateCredits(production.episode.shots.length, "series")
    );
  });

  it("generates a later episode with recap shots", () => {
    const first = generateTemplateProduction(sampleCommand, 1);
    const next = generateNextEpisode(sampleCommand, first.bible, 2, first.seasonPlan);
    expect(next.episode.number).toBe(2);
    expect(next.episode.shots[0].type).toBe("title");
    expect(next.bible.product?.name).toBe("FluxMug");
  });

  it("builds a faceless short from a command", () => {
    const production = generateTemplateProduction({
      command: "Faceless Reddit story about a neighbor who returns broken tools.",
      format: "faceless",
      aspect: "vertical",
      niche: "Reddit Stories",
      episodeCount: 1,
      characters: [],
      productName: "",
      productFeatures: "",
      brandColor: "#6366f1",
    });
    expect(production.bible.format).toBe("faceless");
    expect(production.episode.shots.some((shot) => shot.type === "hook")).toBe(true);
    expect(production.episode.shots.some((shot) => shot.captionStyle === "kinetic")).toBe(true);
  });

  it("validates command input", () => {
    const parsed = commandInputSchema.safeParse(sampleCommand);
    expect(parsed.success).toBe(true);
    const bad = commandInputSchema.safeParse({ ...sampleCommand, command: "no" });
    expect(bad.success).toBe(false);
  });
});
