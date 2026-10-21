import { NextResponse } from "next/server";
import { readRegistrationFormConfig } from "@/app/lib/registration-form-config";

// Form labels and choices are public metadata; submitted records remain private.
export async function GET() {
  return NextResponse.json({ config: await readRegistrationFormConfig() }, { headers: { "Cache-Control": "no-store" } });
}
