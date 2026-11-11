import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { resolveStorePath } from "@/app/lib/storage-paths";
import {
  readRegistrationVideoConfig,
  saveRegistrationVideoConfig,
} from "@/app/lib/registration-video";

export const dynamic = "force-dynamic";

const mediaDirectory = resolveStorePath("NEIGHBORLY_AD_MEDIA_STORE", ".neighborly-ad-media");

const allowedVideoTypes: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mp4",
  "video/x-msvideo": "mp4",
  "video/ogg": "webm",
};

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (
    session?.role !== "Company" ||
    (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")
  ) {
    return NextResponse.json(
      { error: "Super Admin or Company Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("video") || formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please choose a valid video file to upload." },
        { status: 400 }
      );
    }

    const mimeType = file.type.toLowerCase();
    const extension =
      allowedVideoTypes[mimeType] ||
      path.extname(file.name).replace(".", "").toLowerCase() ||
      "mp4";

    if (!mimeType.startsWith("video/") && !allowedVideoTypes[mimeType]) {
      return NextResponse.json(
        { error: "Only video files (MP4, WebM, MOV) are supported." },
        { status: 415 }
      );
    }

    const maxBytes = 200 * 1024 * 1024; // 200 MB
    if (file.size < 1 || file.size > maxBytes) {
      return NextResponse.json(
        { error: "Video file size must be between 1 KB and 200 MB." },
        { status: 413 }
      );
    }

    const id = `${randomUUID()}.${extension}`;
    await mkdir(mediaDirectory, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(mediaDirectory, id), buffer, {
      flag: "wx",
      mode: 0o600,
    });

    const videoUrl = `/api/ads/media/${id}`;

    // Update config with uploaded video
    const current = await readRegistrationVideoConfig();
    const updated = await saveRegistrationVideoConfig({
      ...current,
      enabled: true,
      type: "upload",
      videoUrl,
      fileName: file.name,
      fileSize: file.size,
    });

    return NextResponse.json(
      {
        url: videoUrl,
        fileName: file.name,
        fileSize: file.size,
        config: updated,
        message: "Registration guide video uploaded and activated successfully.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Video upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload video file. Please try again." },
      { status: 500 }
    );
  }
}
