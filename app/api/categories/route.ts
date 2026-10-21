import { NextResponse } from "next/server";
import { readCategoryConfig } from "@/app/lib/category-config";

export async function GET() {
  return NextResponse.json({ config: await readCategoryConfig() }, { headers: { "Cache-Control": "no-store" } });
}
