import { describe, expect, it } from "vitest";
import { filmAccent, onFilmAccent, relativeLuminance } from "./color";

describe("filmAccent", () => {
  it("lifts black brands to silver so callouts stay visible", () => {
    expect(relativeLuminance("#000000")).toBeLessThan(0.08);
    expect(filmAccent("#000000")).toBe("#e6e6e6");
    expect(onFilmAccent("#000000")).toBe("#0a0a0c");
  });

  it("keeps a mid brand color unchanged", () => {
    expect(filmAccent("#c4a574")).toBe("#c4a574");
  });
});
