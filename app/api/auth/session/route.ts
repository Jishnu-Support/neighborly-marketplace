import { NextResponse } from "next/server";
import { getCurrentSession, getCustomerByIdentity, getCompanyAdminByIdentity, type CustomerAccount, type CompanyAdmin } from "@/app/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ session: null, customer: null, adminProfile: null }, { headers: { "Cache-Control": "no-store" } });
  }

  let customer: CustomerAccount | null = null;
  let adminProfile: CompanyAdmin | null = null;
  if (session.role === "Account") {
    customer = await getCustomerByIdentity(session.identity);
  } else if (session.role === "Company") {
    adminProfile = await getCompanyAdminByIdentity(session.identity);
  }

  return NextResponse.json(
    {
      session: { role: session.role, identity: session.identity, accessLevel: session.accessLevel },
      customer,
      adminProfile,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
