import { NextRequest, NextResponse } from "next/server";
import { generateVideoScript } from "@/lib/ai";
import { clientBriefSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = clientBriefSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid brief", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await generateVideoScript(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Script generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate video script" },
      { status: 500 }
    );
  }
}
