import { GRADIENT_HEX, type Slide } from "@/lib/year-in-food-slides";

const WIDTH = 1080;
const HEIGHT = 1920; // 9:16 — Stories/Reels/TikTok aspect ratio
const SECONDS_PER_SLIDE = 2.5;
const FPS = 30;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawSlide(ctx: CanvasRenderingContext2D, slide: Slide) {
  const [from, to] = GRADIENT_HEX[slide.gradientIndex % GRADIENT_HEX.length];
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = "white";

  const centerX = WIDTH / 2;
  let y = HEIGHT * 0.42;

  ctx.font = "180px sans-serif";
  ctx.fillText(slide.emoji, centerX, y);
  y += 130;

  ctx.font = "600 34px system-ui, sans-serif";
  ctx.globalAlpha = 0.85;
  ctx.fillText(slide.eyebrow.toUpperCase(), centerX, y);
  ctx.globalAlpha = 1;
  y += 90;

  ctx.font = "bold 76px Georgia, serif";
  const valueLines = wrapText(ctx, slide.value, WIDTH - 160);
  for (const line of valueLines) {
    ctx.fillText(line, centerX, y);
    y += 88;
  }

  if (slide.subtitle) {
    y += 20;
    ctx.font = "42px system-ui, sans-serif";
    ctx.globalAlpha = 0.92;
    const subtitleLines = wrapText(ctx, slide.subtitle, WIDTH - 200);
    for (const line of subtitleLines) {
      ctx.fillText(line, centerX, y);
      y += 54;
    }
    ctx.globalAlpha = 1;
  }
}

export interface RenderProgress {
  slideIndex: number;
  total: number;
}

/**
 * Renders each slide to an offscreen canvas and records it via MediaRecorder
 * (canvas.captureStream), producing a downloadable WebM "flipbook" video
 * (spec section 39). No ffmpeg/server-side encoding involved — everything
 * runs in the browser. WebM plays natively in browsers but isn't accepted by
 * every social platform's uploader; a server-side transcode to MP4 would be
 * the next step if that's needed.
 */
export async function renderYearInFoodVideo(slides: Slide[], onProgress?: (p: RenderProgress) => void): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const stream = canvas.captureStream(FPS);
  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) =>
    typeof MediaRecorder !== "undefined" ? MediaRecorder.isTypeSupported(t) : false
  );
  if (!mimeType) throw new Error("Video recording isn't supported in this browser");

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  for (let i = 0; i < slides.length; i++) {
    drawSlide(ctx, slides[i]);
    onProgress?.({ slideIndex: i, total: slides.length });
    await new Promise((r) => setTimeout(r, SECONDS_PER_SLIDE * 1000));
  }

  recorder.stop();
  await stopped;

  return new Blob(chunks, { type: "video/webm" });
}
