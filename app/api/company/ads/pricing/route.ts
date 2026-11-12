import { NextResponse } from "next/server";
import { getCurrentSession, isSuperAdminIdentity } from "@/app/lib/auth";
import {
  readAdPricingRecords,
  saveAdPricingOption,
  deleteAdPricingOption,
} from "@/app/lib/ad-pricing";
import { AdFormatPricing } from "@/app/lib/ad-pricing.shared";

async function isSuperAdmin(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || session.role !== "Company") return false;
  return session.accessLevel === "Super Admin" || isSuperAdminIdentity(session.identity);
}

export async function GET() {
  try {
    const pricing = await readAdPricingRecords();
    return NextResponse.json({ pricing }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load ad pricing" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json(
      { error: "Only Super Administrators can add or edit ad pricing options." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as AdFormatPricing;
    if (!body.format || !body.name || !body.baseDailyRate) {
      return NextResponse.json(
        { error: "Missing required fields (format key, name, base daily rate)." },
        { status: 400 }
      );
    }

    const session = await getCurrentSession(request);
    const actorName = session?.identity ? `Super Admin (${session.identity})` : "Super Admin";
    const saved = await saveAdPricingOption(body, actorName);
    return NextResponse.json({ success: true, option: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save ad pricing option" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json(
      { error: "Only Super Administrators can remove ad pricing options." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    if (!format) {
      return NextResponse.json({ error: "Format key is required." }, { status: 400 });
    }

    const session = await getCurrentSession(request);
    const actorName = session?.identity ? `Super Admin (${session.identity})` : "Super Admin";
    const success = await deleteAdPricingOption(format, actorName);
    if (!success) {
      return NextResponse.json({ error: "Ad pricing option not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Removed ad pricing format ${format}.` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete ad pricing option" },
      { status: 500 }
    );
  }
}
