import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { toBible } from "@/lib/series";
import { z } from "zod";

const createSeriesSchema = z.object({
  name: z.string().min(1).max(80),
  niche: z.string().min(1).max(120),
  stylePrompt: z.string().min(1).max(600),
  aspectRatio: z.enum(["9:16", "16:9"]).default("9:16"),
  palette: z.string().optional(),
  characters: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().default("cast"),
        personality: z.string().min(1),
        lookPrompt: z.string().min(1),
        voiceId: z.string().default("lead"),
      })
    )
    .min(1)
    .max(6),
  products: z
    .array(
      z.object({
        name: z.string().min(1),
        lookPrompt: z.string().min(1),
        mustShowBeats: z.array(z.string()).default([]),
      })
    )
    .min(1)
    .max(6),
});

export async function GET() {
  await ensureSeeded();
  const series = await prisma.series.findMany({
    include: { characters: true, products: true, episodes: { orderBy: { number: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    series: series.map((item) => ({
      ...toBible(item),
      episodeCount: item.episodes.length ? item.episodes[0].number : 0,
      latestEpisode: item.episodes[0] || null,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSeriesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid series bible", details: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.series.create({
    data: {
      name: parsed.data.name,
      niche: parsed.data.niche,
      stylePrompt: parsed.data.stylePrompt,
      aspectRatio: parsed.data.aspectRatio,
      palette: parsed.data.palette || "#f59e0b,#1a1208,#fff7ed",
      characters: {
        create: parsed.data.characters,
      },
      products: {
        create: parsed.data.products.map((product) => ({
          name: product.name,
          lookPrompt: product.lookPrompt,
          mustShowBeats: JSON.stringify(product.mustShowBeats),
        })),
      },
    },
    include: { characters: true, products: true },
  });

  return NextResponse.json({ series: toBible(created) }, { status: 201 });
}
