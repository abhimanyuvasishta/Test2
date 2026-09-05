import { z } from "zod";
import type { CommandInput } from "@/types";

export const characterDraftSchema = z.object({
  name: z.string().min(1).max(40),
  role: z.string().max(80).default(""),
});

export const commandInputSchema = z.object({
  command: z.string().min(8, "Describe the video you want").max(2000),
  format: z.enum(["faceless", "product", "conversation", "series"]),
  aspect: z.enum(["landscape", "vertical", "square"]),
  niche: z.string().max(80).default(""),
  episodeCount: z.number().int().min(1).max(12),
  characters: z.array(characterDraftSchema).max(6),
  productName: z.string().max(80).default(""),
  productFeatures: z.string().max(400).default(""),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type CommandInputParsed = z.infer<typeof commandInputSchema>;

export const defaultCommand: CommandInput = {
  command: "",
  format: "faceless",
  aspect: "vertical",
  niche: "",
  episodeCount: 5,
  characters: [],
  productName: "",
  productFeatures: "",
  brandColor: "#6366f1",
};

export const sampleCommand: CommandInput = {
  command:
    "Animated series: two founders, Maya and Leo, build FluxMug — a leak-proof travel mug. Episode 1 is the prototype disaster in a rideshare. Keep the product and characters locked. End on a cliffhanger.",
  format: "series",
  aspect: "vertical",
  niche: "Founder story",
  episodeCount: 6,
  characters: [
    { name: "Maya", role: "Designer / narrator" },
    { name: "Leo", role: "Engineer" },
  ],
  productName: "FluxMug",
  productFeatures: "Leak-proof lid, 12-hour heat, one-hand open",
  brandColor: "#f59e0b",
};
