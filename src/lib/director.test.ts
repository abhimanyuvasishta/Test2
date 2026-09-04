import { describe, expect, it } from "vitest";
import { formatDuration, generateTemplateScript } from "./director";
import { sampleBrief, clientBriefSchema } from "./validation";
import type { ClientBrief } from "@/types";

function brief(overrides: Partial<ClientBrief> = {}): ClientBrief {
  return {
    ...sampleBrief,
    highlights: sampleBrief.highlights.map((h) => ({ ...h })),
    ...overrides,
  };
}

describe("generateTemplateScript", () => {
  it("builds a full executive arc from a multi-callout brief", () => {
    const script = generateTemplateScript(brief());
    const types = script.scenes.map((s) => s.type);

    expect(types[0]).toBe("intro");
    expect(types[1]).toBe("problem");
    expect(types.filter((t) => t === "highlight")).toHaveLength(4);
    expect(types).toContain("quote");
    expect(types).toContain("stats");
    expect(types.at(-2)).toBe("cta");
    expect(types.at(-1)).toBe("outro");
    expect(script.scenes.every((s) => s.voiceover && s.durationMs >= 3000)).toBe(true);
    expect(script.totalDurationMs).toBe(
      script.scenes.reduce((sum, s) => sum + s.durationMs, 0)
    );
    expect(script.title).toContain("Aether Control");
  });

  it("keeps callout order and metrics on highlight scenes", () => {
    const script = generateTemplateScript(brief());
    const highlights = script.scenes.filter((s) => s.type === "highlight");
    expect(highlights.map((s) => s.headline)).toEqual(
      sampleBrief.highlights.map((h) => h.title)
    );
    expect(highlights.map((s) => s.metric)).toEqual(
      sampleBrief.highlights.map((h) => h.metric)
    );
  });

  it("omits quote and stats when those inputs are absent", () => {
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
    expect(script.scenes.some((s) => s.type === "stats")).toBe(false);
    expect(script.scenes.filter((s) => s.type === "highlight")).toHaveLength(1);
  });

  it("tailors opening copy to CEO vs CTO", () => {
    const ceo = generateTemplateScript(brief({ targetAudience: "ceo" }));
    const cto = generateTemplateScript(brief({ targetAudience: "cto" }));
    expect(ceo.scenes[0].kicker).toContain("CEO");
    expect(cto.scenes[0].kicker).toContain("CTO");
    expect(ceo.scenes[0].body).not.toEqual(cto.scenes[0].body);
  });
});

describe("formatDuration", () => {
  it("formats seconds and minutes", () => {
    expect(formatDuration(45000)).toBe("45s");
    expect(formatDuration(90000)).toBe("1:30");
  });
});

describe("clientBriefSchema", () => {
  it("accepts the sample brief", () => {
    const parsed = clientBriefSchema.safeParse(sampleBrief);
    expect(parsed.success).toBe(true);
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
