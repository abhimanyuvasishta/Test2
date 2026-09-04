import { afterEach, describe, expect, it, vi } from "vitest";
import { generateScript } from "./generate-script";
import { sampleBrief } from "./validation";
import type { ClientBrief } from "@/types";

const brief = sampleBrief as ClientBrief;

describe("generateScript", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns an API script when /api/generate succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          source: "ai",
          script: {
            title: "API Film",
            logline: "From the server",
            scenes: [
              {
                id: "intro",
                type: "intro",
                headline: "API",
                durationMs: 4000,
              },
            ],
            totalDurationMs: 4000,
            narratorNotes: "ok",
          },
        }),
      })
    );

    const result = await generateScript(brief);
    expect(result.source).toBe("ai");
    expect(result.script.title).toBe("API Film");
  });

  it("falls back to the director engine when the API is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await generateScript(brief);
    expect(result.source).toBe("template");
    expect(result.script.scenes[0].type).toBe("intro");
    expect(result.script.scenes.some((s) => s.type === "highlight")).toBe(true);
  });
});
