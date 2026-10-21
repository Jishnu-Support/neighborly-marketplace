import LoginForm, { type PortalRole } from "./login-form";
import { redirect } from "next/navigation";

const portalRoles: PortalRole[] = ["Account", "Business", "Agent"];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPortal = Array.isArray(params.portal) ? params.portal[0] : params.portal;
  if (requestedPortal?.toLowerCase() === "company") redirect("/company-login");
  const portal = portalRoles.find((role) => role.toLowerCase() === requestedPortal?.toLowerCase()) ?? "Account";

  return <LoginForm portal={portal} />;
}
