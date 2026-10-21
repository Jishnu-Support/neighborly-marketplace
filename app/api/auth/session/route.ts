import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  return NextResponse.json({ session: session ? { role: session.role, identity: session.identity, accessLevel: session.accessLevel } : null }, { headers: { "Cache-Control": "no-store" } });
}