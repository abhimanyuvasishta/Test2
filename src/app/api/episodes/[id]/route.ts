import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const episode = await prisma.episode.findUnique({
    where: { id: params.id },
    include: { series: { include: { characters: true, products: true } } },
  });
  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }
  return NextResponse.json({
    episode,
    plan: episode.productionJson ? JSON.parse(episode.productionJson) : null,
  });
}
