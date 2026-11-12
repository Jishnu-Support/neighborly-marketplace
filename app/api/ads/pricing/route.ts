import { NextResponse } from "next/server";
import { readAdPricingRecords } from "@/app/lib/ad-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pricing = await readAdPricingRecords();
    return NextResponse.json({ pricing }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load ad pricing" },
      { status: 500 }
    );
  }
}
