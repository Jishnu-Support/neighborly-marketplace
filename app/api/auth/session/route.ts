import { NextResponse } from "next/server";
import { getCurrentSession, getCustomerByIdentity, type CustomerAccount } from "@/app/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ session: null, customer: null }, { headers: { "Cache-Control": "no-store" } });
  }

  let customer: CustomerAccount | null = null;
  if (session.role === "Account") {
    customer = await getCustomerByIdentity(session.identity);
  }

  return NextResponse.json(
    {
      session: { role: session.role, identity: session.identity, accessLevel: session.accessLevel },
      customer,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
