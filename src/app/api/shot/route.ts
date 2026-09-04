import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const prompt = request.nextUrl.searchParams.get("prompt");
  const seed = request.nextUrl.searchParams.get("seed") || "1";
  if (!prompt) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const upstream = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=1280&height=720&nologo=true&seed=${encodeURIComponent(seed)}`;

  const response = await fetch(upstream, {
    headers: { Accept: "image/*" },
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "Shot generation failed" }, { status: 502 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
