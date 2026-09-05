import { NextRequest, NextResponse } from "next/server";
import { generateDirectorProduction } from "@/lib/ai-director";
import { commandInputSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = commandInputSchema.safeParse(body.input ?? body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid command", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const episodeNumber = Number(body.episodeNumber || 1);
    const result = await generateDirectorProduction(parsed.data, episodeNumber);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Director error:", error);
    return NextResponse.json({ error: "Failed to direct the video" }, { status: 500 });
  }
}
