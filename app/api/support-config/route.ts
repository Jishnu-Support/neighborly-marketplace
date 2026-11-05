import { NextResponse } from "next/server";
import { readSupportConfig } from "@/app/lib/support-config";

export async function GET() {
  try {
    const config = await readSupportConfig();
    return NextResponse.json({ config }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load support config" },
      { status: 500 }
    );
  }
}
