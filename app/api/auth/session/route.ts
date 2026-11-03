import { NextResponse } from "next/server";
import { getCurrentSession, getCustomerByIdentity, getCompanyAdminByIdentity, type CustomerAccount, type CompanyAdmin } from "@/app/lib/auth";
import { getBusinessByIdentity, type PublicBusiness } from "@/app/lib/businesses";
import { getAgentByIdentity, type AgentPartner } from "@/app/lib/agents";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { session: null, customer: null, business: null, agent: null, adminProfile: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  let customer: CustomerAccount | null = null;
  let business: PublicBusiness | null = null;
  let agent: AgentPartner | null = null;
  let adminProfile: CompanyAdmin | null = null;

  if (session.role === "Account") {
    customer = await getCustomerByIdentity(session.identity);
  } else if (session.role === "Business") {
    business = await getBusinessByIdentity(session.identity);
  } else if (session.role === "Agent") {
    agent = await getAgentByIdentity(session.identity);
  } else if (session.role === "Company") {
    adminProfile = await getCompanyAdminByIdentity(session.identity);
  }

  return NextResponse.json(
    {
      session: { role: session.role, identity: session.identity, accessLevel: session.accessLevel },
      customer,
      business,
      agent,
      adminProfile,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
