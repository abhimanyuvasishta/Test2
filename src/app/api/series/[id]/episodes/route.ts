import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { planAndRenderEpisode } from "@/lib/production/run-episode";
import { toBible } from "@/lib/series";

const bodySchema = z.object({
  command: z.string().min(8).max(800),
});

function storageRoot(): string {
  return path.join(process.cwd(), "storage", "episodes");
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Command is required" }, { status: 400 });
  }

  const series = await prisma.series.findUnique({
    where: { id: params.id },
    include: { characters: true, products: true, episodes: true },
  });
  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const nextNumber = (series.episodes.reduce((max, episode) => Math.max(max, episode.number), 0) || 0) + 1;
  const episode = await prisma.episode.create({
    data: {
      seriesId: series.id,
      number: nextNumber,
      command: parsed.data.command,
      status: "rendering",
    },
  });

  const workDir = path.join(storageRoot(), episode.id);
  await mkdir(workDir, { recursive: true });

  try {
    const result = await planAndRenderEpisode({
      bible: toBible(series),
      command: parsed.data.command,
      episodeNumber: nextNumber,
      workDir,
    });

    const publicDir = path.join(process.cwd(), "public", "renders", episode.id);
    await mkdir(publicDir, { recursive: true });
    const publicVideo = path.join(publicDir, "episode.mp4");
    const publicSrt = path.join(publicDir, "captions.srt");
    await copyFile(result.outputPath, publicVideo);
    await copyFile(result.captionsPath, publicSrt);

    const updated = await prisma.episode.update({
      where: { id: episode.id },
      data: {
        status: "ready",
        productionJson: JSON.stringify(result.plan),
        outputRelPath: `/renders/${episode.id}/episode.mp4`,
        captionsRelPath: `/renders/${episode.id}/captions.srt`,
        audioRelPath: result.audioPath,
      },
    });

    return NextResponse.json({
      episode: updated,
      plan: result.plan,
      ttsEngine: result.ttsEngine,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    await prisma.episode.update({
      where: { id: episode.id },
      data: { status: "failed", error: message.slice(0, 1500) },
    });
    return NextResponse.json({ error: message, episodeId: episode.id }, { status: 500 });
  }
}
