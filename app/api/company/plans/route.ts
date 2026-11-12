import { NextResponse } from "next/server";
import { getCurrentSession, isSuperAdminIdentity } from "@/app/lib/auth";
import {
  readSubscriptionPlans,
  saveSubscriptionPlan,
  deleteSubscriptionPlan,
} from "@/app/lib/plans-config";
import { SubscriptionPlan } from "@/app/lib/plans-config.shared";

async function isSuperAdmin(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || session.role !== "Company") return false;
  return session.accessLevel === "Super Admin" || isSuperAdminIdentity(session.identity);
}

export async function GET() {
  try {
    const plans = await readSubscriptionPlans();
    return NextResponse.json({ plans }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load subscription plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json(
      { error: "Only Super Administrators can add or edit subscription plans." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as SubscriptionPlan;
    if (!body.name || typeof body.monthlyPrice !== "number") {
      return NextResponse.json(
        { error: "Plan name and monthly price are required." },
        { status: 400 }
      );
    }

    const session = await getCurrentSession(request);
    const actorName = session?.identity ? `Super Admin (${session.identity})` : "Super Admin";
    const saved = await saveSubscriptionPlan(body, actorName);
    return NextResponse.json({ success: true, plan: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save subscription plan" },
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
      { error: "Only Super Administrators can remove subscription plans." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Plan ID is required." }, { status: 400 });
    }

    const session = await getCurrentSession(request);
    const actorName = session?.identity ? `Super Admin (${session.identity})` : "Super Admin";
    const success = await deleteSubscriptionPlan(id, actorName);
    if (!success) {
      return NextResponse.json({ error: "Subscription plan not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Removed plan ${id}.` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete plan" },
      { status: 500 }
    );
  }
}
