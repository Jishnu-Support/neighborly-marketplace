import { NextResponse } from "next/server";
import { readRegistrationVideoConfig } from "@/app/lib/registration-video";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await readRegistrationVideoConfig();
  return NextResponse.json(
    { config },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
