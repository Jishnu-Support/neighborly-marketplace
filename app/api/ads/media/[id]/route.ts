import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const mediaDirectory = process.env.NEIGHBORLY_AD_MEDIA_STORE || path.join(process.cwd(), ".neighborly-ad-media");
const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", mpeg: "audio/mpeg", mpga: "audio/mpeg", mp2: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}\.(?:jpe?g|png|webp|gif|mp4|webm|mp3|mpeg|mpga|mp2|m4a|wav|ogg)$/i.test(id)) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }
  const extension = id.split(".").pop()!.toLowerCase();
  try {
    const content = await readFile(path.join(mediaDirectory, id));
    const baseHeaders = {
      "Content-Type": mimeTypes[extension],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Accept-Ranges": "bytes",
    };
    const range = request.headers.get("range");
    if (range && /^(video|audio)\//.test(mimeTypes[extension])) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new NextResponse(null, { status: 416, headers: { ...baseHeaders, "Content-Range": `bytes */${content.byteLength}` } });
      const suffixLength = match[1] ? 0 : Number(match[2]);
      const start = match[1] ? Number(match[1]) : Math.max(0, content.byteLength - suffixLength);
      const end = match[2] && match[1] ? Math.min(Number(match[2]), content.byteLength - 1) : content.byteLength - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= content.byteLength || end < start) {
        return new NextResponse(null, { status: 416, headers: { ...baseHeaders, "Content-Range": `bytes */${content.byteLength}` } });
      }
      const chunk = content.subarray(start, end + 1);
      return new NextResponse(chunk, { status: 206, headers: { ...baseHeaders, "Content-Length": String(chunk.byteLength), "Content-Range": `bytes ${start}-${end}/${content.byteLength}` } });
    }
    return new NextResponse(content, { headers: { ...baseHeaders, "Content-Length": String(content.byteLength) } });
  } catch {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }
}
