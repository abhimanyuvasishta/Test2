import { NextResponse } from "next/server";
import { sampleCommand } from "@/lib/seed";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ffmpeg: true,
    sampleCommand,
  });
}
