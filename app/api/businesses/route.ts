import { NextResponse } from "next/server";
import { listRegisteredBusinesses } from "@/app/lib/businesses";

export async function GET() {
  const businesses = await listRegisteredBusinesses();
  return NextResponse.json({ businesses }, { headers: { "Cache-Control": "no-store" } });
}
