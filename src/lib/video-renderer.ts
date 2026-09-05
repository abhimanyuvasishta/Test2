import { CANVAS_SIZE } from "./formats";
import { captionWindow, splitCaptionWords } from "./captions";
import type {
  AspectRatio,
  Character,
  ProductionBible,
  Shot,
  VisualMood,
} from "@/types";

function ensureRoundRect(ctx: CanvasRenderingContext2D): void {
  if (typeof ctx.roundRect === "function") return;
  ctx.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radii: number | DOMPointInit | (number | DOMPointInit)[] = 0
  ) {
    const r = typeof radii === "number" ? radii : 8;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 99, g: 102, b: 241 };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const MOOD: Record<VisualMood, { a: string; b: string; fog: string }> = {
  dark: { a: "#07070c", b: "#16161f", fog: "#6366f1" },
  neon: { a: "#090614", b: "#1a0b2e", fog: "#a855f7" },
  clean: { a: "#0c1018", b: "#182033", fog: "#38bdf8" },
  warm: { a: "#140c08", b: "#2a160e", fog: "#f59e0b" },
  crime: { a: "#0c0606", b: "#1c0b0b", fog: "#ef4444" },
  playful: { a: "#120814", b: "#24102a", fog: "#f472b6" },
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mood: VisualMood,
  accent: string,
  progress: number
): void {
  const palette = MOOD[mood];
  const rgb = hexToRgb(accent || palette.fog);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette.a);
  gradient.addColorStop(1, palette.b);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const orbX = width * 0.7 + Math.sin(progress * Math.PI * 2) * 40;
  const orbY = height * 0.28 + Math.cos(progress * Math.PI * 2) * 30;
  const orb = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, Math.max(width, height) * 0.35);
  orb.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.28)`);
  orb.addColorStop(1, "transparent");
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  const gap = width < height ? 48 : 60;
  for (let x = 0; x < width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

function drawCaptions(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shot: Shot,
  progress: number,
  kinetic: boolean
): void {
  if (shot.captionStyle === "none") return;
  const words = splitCaptionWords(shot.line || shot.onScreen);
  const windowed = captionWindow(words, progress, kinetic ? 3 : 6);
  if (windowed.words.length === 0) return;

  const y = height * 0.82;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = width < height ? 54 : 44;
  ctx.font = `800 ${fontSize}px system-ui, sans-serif`;

  const display = windowed.words.join(" ");
  const padX = 28;
  const boxW = Math.min(width * 0.86, ctx.measureText(display).width + padX * 2);
  const boxH = fontSize * 1.6;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ensureRoundRect(ctx);
  ctx.beginPath();
  ctx.roundRect((width - boxW) / 2, y - boxH / 2, boxW, boxH, 16);
  ctx.fill();

  let x = width / 2 - ctx.measureText(display).width / 2;
  windowed.words.forEach((word, index) => {
    ctx.fillStyle = index === windowed.activeIndex ? "#fde047" : "#ffffff";
    ctx.fillText(word, x + ctx.measureText(word).width / 2, y);
    x += ctx.measureText(`${word} `).width;
  });
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  character: Character,
  x: number,
  y: number,
  size: number,
  progress: number
): void {
  const alpha = easeOutCubic(Math.min(progress * 1.4, 1));
  ctx.globalAlpha = alpha;
  ctx.fillStyle = character.color;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a0f";
  ctx.font = `800 ${size * 0.38}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(character.name.slice(0, 1).toUpperCase(), x, y + 2);
  ctx.globalAlpha = 1;
}

function drawProductCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bible: ProductionBible,
  progress: number
): void {
  const product = bible.product;
  if (!product) return;
  const alpha = easeOutCubic(Math.min(progress * 1.3, 1));
  const w = Math.min(width * 0.72, 640);
  const h = 220;
  const x = (width - w) / 2;
  const y = height * 0.38;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ensureRoundRect(ctx);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.fill();
  ctx.strokeStyle = product.brandColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = product.brandColor;
  ctx.beginPath();
  ctx.roundRect(x + 28, y + 36, 72, 72, 16);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 42px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(product.name, x + 120, y + 70);
  ctx.font = "500 22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(product.tagline, x + 120, y + 112);
  ctx.globalAlpha = 1;
}

function drawMessages(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shot: Shot,
  progress: number
): void {
  const phrases = (shot.line || "").split(/(?<=[.!?])/).map((p) => p.trim()).filter(Boolean).slice(0, 3);
  const bubbles = phrases.length > 0 ? phrases : [shot.onScreen];
  bubbles.forEach((text, index) => {
    const appear = easeOutCubic(Math.max(0, progress * 1.4 - index * 0.25));
    if (appear <= 0) return;
    const mine = index % 2 === 1;
    const maxW = width * 0.7;
    ctx.font = "600 28px system-ui, sans-serif";
    const lines = wrapText(ctx, text, maxW - 48);
    const bw = Math.min(maxW, Math.max(...lines.map((line) => ctx.measureText(line).width)) + 48);
    const bh = lines.length * 36 + 32;
    const x = mine ? width - bw - 48 : 48;
    const y = height * 0.28 + index * 130;
    ctx.globalAlpha = appear;
    ctx.fillStyle = mine ? "#6366f1" : "#1f2937";
    ensureRoundRect(ctx);
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, 22);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, x + 24, y + 44 + lineIndex * 36);
    });
    ctx.globalAlpha = 1;
  });
}

export function renderShot(
  canvas: HTMLCanvasElement,
  bible: ProductionBible,
  shot: Shot,
  progress: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = CANVAS_SIZE[bible.aspect];
  canvas.width = width;
  canvas.height = height;
  ensureRoundRect(ctx);
  ctx.clearRect(0, 0, width, height);

  const accent = bible.product?.brandColor || bible.characters[0]?.color || "#6366f1";
  drawBackground(ctx, width, height, bible.mood, accent, progress);
  const fade = easeOutCubic(Math.min(progress * 1.4, 1));

  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${bible.niche.toUpperCase()} · EP ${String(bible.format).toUpperCase()}`, 48, 56);
  ctx.globalAlpha = 1;

  const speaker = bible.characters.find((c) => c.id === shot.speakerId);

  if (shot.type === "title") {
    ctx.globalAlpha = fade;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `800 ${width < height ? 64 : 72}px system-ui, sans-serif`;
    wrapText(ctx, shot.onScreen || bible.title, width * 0.8).forEach((line, index) => {
      ctx.fillText(line, width / 2, height * 0.42 + index * 78);
    });
    ctx.font = "500 28px system-ui, sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText(bible.logline.slice(0, 64), width / 2, height * 0.58);
    ctx.globalAlpha = 1;
    return;
  }

  if (shot.type === "text_message") {
    drawMessages(ctx, width, height, shot, progress);
    drawCaptions(ctx, width, height, shot, progress, true);
    return;
  }

  if (shot.type === "product") {
    drawProductCard(ctx, width, height, bible, progress);
  }

  if (shot.type === "dialogue" && speaker) {
    const isLeft = bible.characters.findIndex((c) => c.id === speaker.id) % 2 === 0;
    drawAvatar(ctx, speaker, isLeft ? 90 : width - 90, 140, 88, progress);
    ctx.globalAlpha = fade;
    ctx.fillStyle = speaker.color;
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.textAlign = isLeft ? "left" : "right";
    ctx.fillText(speaker.name.toUpperCase(), isLeft ? 150 : width - 150, 120);
    ctx.globalAlpha = 1;
  } else if (speaker && shot.type !== "product") {
    drawAvatar(ctx, speaker, 90, 130, 76, progress);
    ctx.fillStyle = speaker.color;
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(speaker.name.toUpperCase(), 140, 118);
  }

  ctx.globalAlpha = fade;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  const headlineSize = width < height ? 48 : 52;
  ctx.font = `800 ${headlineSize}px system-ui, sans-serif`;
  const lines = wrapText(ctx, shot.onScreen, width - 120);
  lines.slice(0, 4).forEach((line, index) => {
    ctx.fillText(line, 56, height * (shot.type === "product" ? 0.28 : 0.34) + index * (headlineSize + 14));
  });
  ctx.globalAlpha = 1;

  if (shot.type === "cta") {
    const bw = Math.min(520, width * 0.7);
    const bh = 72;
    const bx = (width - bw) / 2;
    const by = height * 0.62;
    ctx.globalAlpha = fade;
    ctx.fillStyle = accent;
    ensureRoundRect(ctx);
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 16);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "800 28px system-ui, sans-serif";
    ctx.fillText(shot.onScreen.slice(0, 32), width / 2, by + 40);
    ctx.globalAlpha = 1;
  }

  drawCaptions(ctx, width, height, shot, progress, shot.captionStyle === "kinetic");
}

export async function exportEpisode(options: {
  canvas: HTMLCanvasElement;
  bible: ProductionBible;
  shots: Shot[];
  onProgress?: (progress: number) => void;
  onShotChange?: (index: number) => void;
}): Promise<Blob> {
  const { canvas, bible, shots, onProgress, onShotChange } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
    throw new Error("This browser cannot record video. Use Chrome or Edge.");
  }

  const size = CANVAS_SIZE[bible.aspect];
  canvas.width = size.width;
  canvas.height = size.height;
  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "";
  if (!mimeType) throw new Error("WebM recording is not supported in this browser.");

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });
  recorder.start(100);

  const fps = 30;
  const totalFrames = shots.reduce((sum, shot) => sum + Math.ceil((shot.durationMs / 1000) * fps), 0);
  let elapsed = 0;

  for (let index = 0; index < shots.length; index++) {
    const shot = shots[index];
    onShotChange?.(index);
    const frames = Math.ceil((shot.durationMs / 1000) * fps);
    for (let frame = 0; frame < frames; frame++) {
      renderShot(canvas, bible, shot, frame / frames);
      elapsed += 1;
      onProgress?.(elapsed / totalFrames);
      await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
    }
  }

  recorder.stop();
  return done;
}

export function aspectCss(aspect: AspectRatio): string {
  if (aspect === "vertical") return "aspect-[9/16] max-h-[720px] mx-auto";
  if (aspect === "square") return "aspect-square max-h-[640px] mx-auto";
  return "aspect-video";
}
