import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const mediaDirectory =
  process.env.NEIGHBORLY_AD_MEDIA_STORE ||
  path.join(process.cwd(), ".neighborly-ad-media");

const allowedTypes: Record<string, { extension: string; maxBytes: number }> = {
  "image/jpeg": { extension: "jpg", maxBytes: 15 * 1024 * 1024 },
  "image/png": { extension: "png", maxBytes: 15 * 1024 * 1024 },
  "image/webp": { extension: "webp", maxBytes: 15 * 1024 * 1024 },
  "image/gif": { extension: "gif", maxBytes: 15 * 1024 * 1024 },
  "video/mp4": { extension: "mp4", maxBytes: 150 * 1024 * 1024 },
};

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file selected." }, { status: 400 });
    }

    const typeConfig = allowedTypes[file.type];
    if (!typeConfig) {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload JPG, PNG, WebP or MP4." },
        { status: 415 }
      );
    }

    if (file.size < 1 || file.size > typeConfig.maxBytes) {
      return NextResponse.json(
        { error: `File size exceeds allowed maximum (${Math.round(typeConfig.maxBytes / (1024 * 1024))} MB).` },
        { status: 413 }
      );
    }

    const content = Buffer.from(await file.arrayBuffer());
    const id = `${randomUUID()}.${typeConfig.extension}`;

    await mkdir(mediaDirectory, { recursive: true });
    await writeFile(path.join(mediaDirectory, id), content, { flag: "wx", mode: 0o600 });

    return NextResponse.json(
      {
        url: `/api/ads/media/${id}`,
        name: file.name,
        size: file.size,
        kind,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload ad media file." },
      { status: 500 }
    );
  }
}
