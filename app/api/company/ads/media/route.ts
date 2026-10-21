import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";

const mediaDirectory = process.env.NEIGHBORLY_AD_MEDIA_STORE || path.join(process.cwd(), ".neighborly-ad-media");
const allowedTypes: Record<string, { extension: string; maxBytes: number }> = {
  "image/jpeg": { extension: "jpg", maxBytes: 15 * 1024 * 1024 },
  "image/png": { extension: "png", maxBytes: 15 * 1024 * 1024 },
  "image/webp": { extension: "webp", maxBytes: 15 * 1024 * 1024 },
  "image/gif": { extension: "gif", maxBytes: 15 * 1024 * 1024 },
  "video/mp4": { extension: "mp4", maxBytes: 200 * 1024 * 1024 },
  "audio/mpeg": { extension: "mp3", maxBytes: 30 * 1024 * 1024 },
  "audio/mp2": { extension: "mp2", maxBytes: 30 * 1024 * 1024 },
  "audio/mp4": { extension: "m4a", maxBytes: 30 * 1024 * 1024 },
  "audio/wav": { extension: "wav", maxBytes: 30 * 1024 * 1024 },
  "audio/x-wav": { extension: "wav", maxBytes: 30 * 1024 * 1024 },
  "audio/ogg": { extension: "ogg", maxBytes: 30 * 1024 * 1024 },
};


function readMp4DurationSeconds(buffer: Buffer): number | null {
  const readBoxes = (start: number, end: number, wanted: string): { payload: number; boxEnd: number } | null => {
    let offset = start;
    while (offset + 8 <= end) {
      const size32 = buffer.readUInt32BE(offset);
      const type = buffer.toString("ascii", offset + 4, offset + 8);
      let headerSize = 8;
      let boxSize = size32;
      if (size32 === 1) {
        if (offset + 16 > end) return null;
        const large = buffer.readBigUInt64BE(offset + 8);
        if (large > BigInt(Number.MAX_SAFE_INTEGER)) return null;
        boxSize = Number(large);
        headerSize = 16;
      } else if (size32 === 0) boxSize = end - offset;
      if (boxSize < headerSize || offset + boxSize > end) return null;
      if (type === wanted) return { payload: offset + headerSize, boxEnd: offset + boxSize };
      if (offset + boxSize <= offset) return null;
      offset += boxSize;
    }
    return null;
  };
  const moov = readBoxes(0, buffer.length, "moov");
  if (!moov) return null;
  const mvhd = readBoxes(moov.payload, moov.boxEnd, "mvhd");
  if (!mvhd || mvhd.payload + 20 > mvhd.boxEnd) return null;
  const version = buffer[mvhd.payload];
  const timeScaleOffset = mvhd.payload + (version === 1 ? 20 : 12);
  const durationOffset = mvhd.payload + (version === 1 ? 24 : 16);
  if (version !== 0 && version !== 1) return null;
  if (durationOffset + (version === 1 ? 8 : 4) > mvhd.boxEnd) return null;
  const timeScale = buffer.readUInt32BE(timeScaleOffset);
  const duration = version === 1 ? Number(buffer.readBigUInt64BE(durationOffset)) : buffer.readUInt32BE(durationOffset);
  if (!timeScale || !Number.isFinite(duration)) return null;
  return duration / timeScale;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")) {
    return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = form.get("kind");
    if (!(file instanceof File) || !["image", "video", "audio"].includes(String(kind))) return NextResponse.json({ error: "Choose a media type and file to upload." }, { status: 400 });
    const namedMpegExtension = /\.(mpeg|mpga|mp2)$/i.exec(file.name)?.[1]?.toLowerCase();
    const mpegType = kind === "audio" && namedMpegExtension && ["", "application/octet-stream", "audio/mpeg", "audio/mp2", "audio/x-mpeg"].includes(file.type);
    const type = allowedTypes[file.type] || (mpegType ? { extension: namedMpegExtension, maxBytes: 30 * 1024 * 1024 } : undefined);
    if (!type || (kind === "image" && !file.type.startsWith("image/")) || (kind === "video" && !file.type.startsWith("video/")) || (kind === "audio" && !file.type.startsWith("audio/") && !mpegType)) {
      return NextResponse.json({ error: "Choose a supported image, video or audio file." }, { status: 415 });
    }
    if (file.size < 1 || file.size > type.maxBytes) return NextResponse.json({ error: kind === "video" ? "Video must be smaller than 200 MB." : "This file is empty or exceeds the allowed size for its media type." }, { status: 413 });
    const content = Buffer.from(await file.arrayBuffer());
    if (kind === "video") {
      const duration = readMp4DurationSeconds(content);
      if (duration === null) return NextResponse.json({ error: "Could not read this MP4 video's duration. Please export it as a standard MP4 and try again." }, { status: 415 });
      if (duration > 300) return NextResponse.json({ error: "Video ads can be up to 5 minutes long." }, { status: 413 });
    }
    const extension = mpegType ? namedMpegExtension : type.extension;
    const id = `${randomUUID()}.${extension}`;
    await mkdir(mediaDirectory, { recursive: true });
    await writeFile(path.join(mediaDirectory, id), content, { flag: "wx", mode: 0o600 });
    return NextResponse.json({ url: `/api/ads/media/${id}`, name: file.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not upload this media file." }, { status: 500 });
  }
}
