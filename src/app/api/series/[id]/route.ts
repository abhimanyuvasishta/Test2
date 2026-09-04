import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toBible } from "@/lib/series";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const series = await prisma.series.findUnique({
    where: { id: params.id },
    include: {
      characters: true,
      products: true,
      episodes: { orderBy: { number: "desc" } },
    },
  });
  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }
  return NextResponse.json({
    series: toBible(series),
    episodes: series.episodes,
  });
}
