import { describe, expect, it } from "vitest";
import { formatDuration, generateTemplateScript } from "./director";
import { sampleBrief, kiwiBrief, clientBriefSchema } from "./validation";
import type { ClientBrief } from "@/types";

function brief(overrides: Partial<ClientBrief> = {}): ClientBrief {
  return {
    ...sampleBrief,
    highlights: sampleBrief.highlights.map((h) => ({ ...h })),
    ...overrides,
  };
}

describe("generateTemplateScript", () => {
  it("writes a character-led TV commercial, not a slide deck", () => {
    const script = generateTemplateScript(brief());
    expect(script.title).toMatch(/TV commercial/);
    expect(script.scenes[0].type).toBe("intro");
    expect(script.scenes.at(-1)?.type).toBe("outro");
    expect(script.scenes.every((s) => s.character && s.dialogue && s.imagePrompt)).toBe(true);
    expect(script.scenes.some((s) => s.type === "highlight")).toBe(true);
    expect(script.totalDurationMs).toBe(
      script.scenes.reduce((sum, s) => sum + s.durationMs, 0)
    );
  });

  it("keeps product callouts in the commercial beats", () => {
    const script = generateTemplateScript(brief());
    const highlights = script.scenes.filter((s) => s.type === "highlight");
    expect(highlights.map((s) => s.headline)).toEqual(
      sampleBrief.highlights.slice(0, 3).map((h) => h.title)
    );
  });

  it("casts insurance heroes for a motor Super NCB brief", () => {
    const script = generateTemplateScript({
      ...kiwiBrief,
      highlights: kiwiBrief.highlights.map((h) => ({ ...h })),
    });
    expect(script.scenes[0].character).toBe("Mira Sen");
    expect(script.scenes.some((s) => s.dialogue?.includes("Super NCB") || s.headline.includes("Super NCB") || s.subheadline?.includes("Super NCB"))).toBe(true);
    expect(script.logline).toContain("Mira Sen");
  });

  it("omits quote when no customer quote is provided", () => {
    const script = generateTemplateScript(
      brief({
        customerQuote: "",
        quoteAttribution: "",
        highlights: [
          {
            id: "1",
            title: "Only Callout",
            description: "A single capability with no metric.",
          },
        ],
      })
    );
    expect(script.scenes.some((s) => s.type === "quote")).toBe(false);
    expect(script.scenes.filter((s) => s.type === "highlight")).toHaveLength(1);
  });
});

describe("formatDuration", () => {
  it("formats seconds and minutes", () => {
    expect(formatDuration(45000)).toBe("45s");
    expect(formatDuration(90000)).toBe("1:30");
  });
});

describe("clientBriefSchema", () => {
  it("accepts the KIWI brief", () => {
    expect(clientBriefSchema.safeParse(kiwiBrief).success).toBe(true);
  });

  it("requires at least one callout and a problem statement", () => {
    const parsed = clientBriefSchema.safeParse({
      ...sampleBrief,
      problemStatement: "",
      highlights: [],
    });
    expect(parsed.success).toBe(false);
  });
});
