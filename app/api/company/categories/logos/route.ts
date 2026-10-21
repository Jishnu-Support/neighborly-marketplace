import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";

const mediaDirectory = process.env.NEIGHBORLY_AD_MEDIA_STORE || path.join(process.cwd(), ".neighborly-ad-media");
const allowedImages: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")) {
    return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a brand logo image to upload." }, { status: 400 });
    const extension = allowedImages[file.type];
    if (!extension) return NextResponse.json({ error: "Choose a PNG, JPEG, or WebP logo image." }, { status: 415 });
    if (file.size < 1 || file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Brand logos must be smaller than 2 MB." }, { status: 413 });
    const id = `${randomUUID()}.${extension}`;
    await mkdir(mediaDirectory, { recursive: true });
    await writeFile(path.join(mediaDirectory, id), Buffer.from(await file.arrayBuffer()), { flag: "wx", mode: 0o600 });
    return NextResponse.json({ url: `/api/ads/media/${id}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not upload this brand logo." }, { status: 500 });
  }
}
