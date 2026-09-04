import type { ClientBrief, GenerationResult } from "@/types";
import { generateTemplateScript } from "./template-script";

/**
 * Prefer the server AI route when it is available (next dev / next start).
 * Fall back to the on-device template so GitHub Pages and static hosts still work.
 */
export async function generateScript(brief: ClientBrief): Promise<GenerationResult> {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief),
    });

    if (response.ok) {
      const result = (await response.json()) as GenerationResult;
      if (result?.script?.scenes?.length) {
        return result;
      }
    }
  } catch {
    // Offline, static hosting, or preview without the API route.
  }

  return {
    script: generateTemplateScript(brief),
    source: "template",
  };
}
