import { NextResponse } from "next/server";
import { readAdConfig } from "@/app/lib/ad-config";

export async function GET() {
  return NextResponse.json({ config: await readAdConfig() }, { headers: { "Cache-Control": "no-store" } });
}
