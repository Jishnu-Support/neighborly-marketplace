import { NextResponse } from "next/server";
import {
  getCurrentSession,
  getCustomerByIdentity,
  updateCustomerProfile,
  getCompanyAdminByIdentity,
  updateCompanyAdmin,
  isSuperAdminIdentity,
  createSessionToken,
  AUTH_COOKIE,
  authCookieOptions,
} from "@/app/lib/auth";
import { getBusinessByIdentity, updateBusinessProfile } from "@/app/lib/businesses";
import { getAgentByIdentity, updateAgentProfile } from "@/app/lib/agents";

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.role === "Account") {
    const customer = await getCustomerByIdentity(session.identity);
    return NextResponse.json({ role: "Account", identity: session.identity, customer });
  }

  if (session.role === "Business") {
    const business = await getBusinessByIdentity(session.identity);
    return NextResponse.json({ role: "Business", identity: session.identity, business });
  }

  if (session.role === "Agent") {
    const agent = await getAgentByIdentity(session.identity);
    return NextResponse.json({ role: "Agent", identity: session.identity, agent });
  }

  if (session.role === "Company") {
    let admin = await getCompanyAdminByIdentity(session.identity);
    const isSuper = isSuperAdminIdentity(session.identity);
    if (!admin && isSuper) {
      admin = {
        id: "super-admin",
        name: "Super Admin",
        email: session.identity,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        emergencyPhone: "+91 94895 21482",
      };
    } else if (admin && !admin.emergencyPhone) {
      admin.emergencyPhone = "+91 94895 21482";
    }
    return NextResponse.json({
      role: "Company",
      identity: session.identity,
      adminProfile: admin,
      accessLevel: session.accessLevel || (isSuper ? "Super Admin" : "Admin"),
      isSuperAdmin: isSuper,
    });
  }

  return NextResponse.json({ role: session.role, identity: session.identity });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    if (session.role === "Account") {
      const updated = await updateCustomerProfile(session.identity, {
        name: typeof body.name === "string" ? body.name : typeof body.fullName === "string" ? body.fullName : undefined,
        phone: typeof body.phone === "string" ? body.phone : typeof body.mobile === "string" ? body.mobile : undefined,
        email: typeof body.email === "string" ? body.email : undefined,
        doorNo: typeof body.doorNo === "string" ? body.doorNo : undefined,
        street: typeof body.street === "string" ? body.street : undefined,
        locality: typeof body.locality === "string" ? body.locality : undefined,
        city: typeof body.city === "string" ? body.city : undefined,
        district: typeof body.district === "string" ? body.district : undefined,
        state: typeof body.state === "string" ? body.state : undefined,
        pincode: typeof body.pincode === "string" ? body.pincode : undefined,
        address: typeof body.address === "string" ? body.address : undefined,
        emergencyPhones: Array.isArray(body.emergencyPhones) && body.emergencyPhones.length >= 2 ? (body.emergencyPhones as [string, string]) : undefined,
        emergencyNames: Array.isArray(body.emergencyNames) && body.emergencyNames.length >= 2 ? (body.emergencyNames as [string, string]) : undefined,
        emergencyRelations: Array.isArray(body.emergencyRelations) && body.emergencyRelations.length >= 2 ? (body.emergencyRelations as [string, string]) : undefined,
      });

      return NextResponse.json({ success: true, customer: updated });
    }

    if (session.role === "Business") {
      const photosArray = Array.isArray(body.photos)
        ? (body.photos as string[])
        : Array.isArray(body.images)
        ? (body.images as string[])
        : undefined;

      const rawAddr = typeof body.address === "object" && body.address !== null ? (body.address as Record<string, unknown>) : undefined;
      const normalizedAddress = rawAddr
        ? {
            doorNumber: typeof rawAddr.doorNumber === "string" ? rawAddr.doorNumber : typeof rawAddr.doorNo === "string" ? rawAddr.doorNo : undefined,
            street: typeof rawAddr.street === "string" ? rawAddr.street : undefined,
            area: typeof rawAddr.area === "string" ? rawAddr.area : typeof rawAddr.locality === "string" ? rawAddr.locality : undefined,
            cityTown: typeof rawAddr.cityTown === "string" ? rawAddr.cityTown : typeof rawAddr.city === "string" ? rawAddr.city : undefined,
            taluka: typeof rawAddr.taluka === "string" ? rawAddr.taluka : undefined,
            district: typeof rawAddr.district === "string" ? rawAddr.district : undefined,
            state: typeof rawAddr.state === "string" ? rawAddr.state : undefined,
            pincode: typeof rawAddr.pincode === "string" ? rawAddr.pincode : undefined,
          }
        : undefined;

      const rawCoords = typeof body.coordinates === "object" && body.coordinates !== null ? (body.coordinates as Record<string, unknown>) : undefined;
      const normalizedCoords = rawCoords && typeof rawCoords.latitude === "number" && typeof rawCoords.longitude === "number"
        ? { latitude: rawCoords.latitude, longitude: rawCoords.longitude }
        : undefined;

      const emergencyPhone = typeof body.emergencyPhone === "string" && body.emergencyPhone.trim()
        ? body.emergencyPhone.trim()
        : Array.isArray(body.emergencyPhones) && typeof body.emergencyPhones[0] === "string" && body.emergencyPhones[0].trim()
        ? body.emergencyPhones[0].trim()
        : undefined;

      const updated = await updateBusinessProfile(session.identity, {
        name: typeof body.name === "string" ? body.name : undefined,
        ownerName: typeof body.ownerName === "string" ? body.ownerName : undefined,
        category: typeof body.category === "string" ? body.category : undefined,
        phone: typeof body.phone === "string" ? body.phone : undefined,
        emergencyPhone,
        email: typeof body.email === "string" ? body.email : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        website: typeof body.website === "string" ? body.website : undefined,
        gstin: typeof body.gstin === "string" ? body.gstin : undefined,
        address: normalizedAddress,
        coordinates: normalizedCoords,
        products: Array.isArray(body.products) ? (body.products as any) : undefined,
        photos: photosArray,
        images: photosArray,
        hours: typeof body.hours === "string" ? body.hours : undefined,
      });

      const response = NextResponse.json({ success: true, business: updated });
      if (updated && (updated.phone || updated.email)) {
        const newIdentity = updated.phone || updated.email;
        if (newIdentity && newIdentity !== session.identity) {
          const newToken = createSessionToken("Business", newIdentity);
          response.cookies.set(AUTH_COOKIE, newToken, authCookieOptions);
        }
      }
      return response;
    }

    if (session.role === "Agent") {
      const emergencyPhone = typeof body.emergencyPhone === "string" && body.emergencyPhone.trim()
        ? body.emergencyPhone.trim()
        : Array.isArray(body.emergencyPhones) && typeof body.emergencyPhones[0] === "string" && body.emergencyPhones[0].trim()
        ? body.emergencyPhones[0].trim()
        : undefined;

      const updated = await updateAgentProfile(session.identity, {
        name: typeof body.name === "string" ? body.name : undefined,
        phone: typeof body.phone === "string" ? body.phone : undefined,
        email: typeof body.email === "string" ? body.email : undefined,
        emergencyPhone,
      });

      return NextResponse.json({ success: true, agent: updated });
    }

    if (session.role === "Company") {
      const admin = await getCompanyAdminByIdentity(session.identity);
      const emergencyPhone = typeof body.emergencyPhone === "string" && body.emergencyPhone.trim()
        ? body.emergencyPhone.trim()
        : Array.isArray(body.emergencyPhones) && typeof body.emergencyPhones[0] === "string" && body.emergencyPhones[0].trim()
        ? body.emergencyPhones[0].trim()
        : undefined;

      if (admin) {
        const updated = await updateCompanyAdmin({
          id: admin.id,
          name: typeof body.name === "string" ? body.name : undefined,
          email: typeof body.email === "string" ? body.email : undefined,
          password: typeof body.password === "string" && body.password.trim() ? body.password : undefined,
          emergencyPhone,
        });
        return NextResponse.json({ success: true, adminProfile: updated });
      }
      return NextResponse.json({ success: true, message: "Super admin credentials update requested." });
    }

    return NextResponse.json({ error: "Unsupported role for profile update." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
