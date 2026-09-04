import type { ClientBrief, SceneType, VideoScene } from "@/types";
import { createCinematicScore } from "./score";

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

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  brandColor: string;
  brief: ClientBrief;
  sceneIndex: number;
  sceneCount: number;
  filmProgress: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 196, g: 165, b: 116 };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function displayFont(): string {
  return `"Space Grotesk", "Inter", system-ui, sans-serif`;
}

function bodyFont(): string {
  return `"Inter", system-ui, sans-serif`;
}

function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const g = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.2,
    width / 2,
    height / 2,
    height * 0.75
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

function drawGrain(ctx: CanvasRenderingContext2D, width: number, height: number, seed: number): void {
  ctx.save();
  ctx.globalAlpha = 0.035;
  for (let i = 0; i < 180; i++) {
    const x = ((seed * 127.1 + i * 311.7) % 1) * width;
    const y = ((seed * 269.5 + i * 183.3) % 1) * height;
    ctx.fillStyle = i % 2 === 0 ? "#fff" : "#000";
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

function drawLetterbox(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const bar = Math.round(height * 0.055);
  ctx.fillStyle = "#050508";
  ctx.fillRect(0, 0, width, bar);
  ctx.fillRect(0, height - bar, width, bar);
}

function drawChrome(
  rc: RenderContext,
  progress: number
): void {
  const { ctx, width, height, brandColor, brief, sceneIndex, sceneCount, filmProgress } = rc;
  const rgb = hexToRgb(brandColor);

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  ctx.fillRect(0, 0, 6, height);
  ctx.globalAlpha = 1;

  ctx.font = `500 16px ${bodyFont()}`;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "left";
  ctx.fillText(brief.clientName.toUpperCase(), 56, height - 36);

  ctx.textAlign = "right";
  ctx.fillText(
    `${String(sceneIndex + 1).padStart(2, "0")} / ${String(sceneCount).padStart(2, "0")}`,
    width - 56,
    height - 36
  );

  const trackW = width - 112;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(56, height - 22, trackW, 2);
  ctx.fillStyle = brandColor;
  ctx.fillRect(56, height - 22, trackW * filmProgress, 2);

  ctx.globalAlpha = easeOutCubic(Math.min(progress * 2, 1));
  ctx.textAlign = "left";
}

function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brandColor: string,
  progress: number
): void {
  const rgb = hexToRgb(brandColor);
  ctx.fillStyle = "#07070b";
  ctx.fillRect(0, 0, width, height);

  const drift = progress * Math.PI * 2;
  const orbX = width * 0.72 + Math.sin(drift) * 80;
  const orbY = height * 0.28 + Math.cos(drift * 0.7) * 40;
  const orb = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 420);
  orb.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`);
  orb.addColorStop(1, "transparent");
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, width, height);

  const orb2 = ctx.createRadialGradient(width * 0.18, height * 0.78, 0, width * 0.18, height * 0.78, 320);
  orb2.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
  orb2.addColorStop(1, "transparent");
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  drawVignette(ctx, width, height);
  drawGrain(ctx, width, height, (progress * 17) % 1);
  drawLetterbox(ctx, width, height);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawKicker(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  brandColor: string,
  progress: number
): void {
  const alpha = easeOutCubic(Math.min(progress * 2, 1));
  ctx.globalAlpha = alpha;
  ctx.font = `600 15px ${bodyFont()}`;
  ctx.fillStyle = brandColor;
  ctx.textAlign = "left";
  ctx.fillText(text.split("").join(" "), x, y);
  ctx.globalAlpha = 1;
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  maxWidth: number,
  progress: number,
  align: CanvasTextAlign,
  lineHeight: number
): number {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  const alpha = easeOutCubic(Math.min(progress * 1.4, 1));
  ctx.globalAlpha = alpha;
  const lines = wrapText(ctx, text, maxWidth);
  const slide = (1 - easeOutCubic(Math.min(progress * 1.4, 1))) * 28;
  let currentY = y;
  for (const line of lines) {
    ctx.fillText(line, x + (align === "center" ? 0 : slide), currentY);
    currentY += lineHeight;
  }
  ctx.globalAlpha = 1;
  return currentY;
}

function drawMetricBadge(
  ctx: CanvasRenderingContext2D,
  metric: string,
  x: number,
  y: number,
  brandColor: string,
  progress: number
): void {
  const alpha = easeOutCubic(Math.max(0, (progress - 0.28) * 2));
  if (alpha <= 0) return;

  ctx.globalAlpha = alpha;
  ctx.font = `600 26px ${displayFont()}`;
  const textWidth = ctx.measureText(metric).width;
  const padding = 28;
  const badgeWidth = textWidth + padding * 2;
  const badgeHeight = 58;

  ctx.fillStyle = brandColor;
  ctx.beginPath();
  ensureRoundRect(ctx);
  ctx.roundRect(x, y, badgeWidth, badgeHeight, 4);
  ctx.fill();

  ctx.fillStyle = "#0a0a0c";
  ctx.textAlign = "left";
  ctx.fillText(metric, x + padding, y + 38);
  ctx.globalAlpha = 1;
}

function drawCaptions(rc: RenderContext, scene: VideoScene, progress: number): void {
  if (!scene.voiceover) return;
  const { ctx, width, height } = rc;
  const alpha = easeOutCubic(Math.max(0, (progress - 0.12) * 2));
  ctx.globalAlpha = alpha * 0.92;
  ctx.font = `400 18px ${bodyFont()}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.textAlign = "center";
  const lines = wrapText(ctx, scene.voiceover, width - 280);
  let y = height - 88 - (lines.length - 1) * 24;
  for (const line of lines.slice(0, 2)) {
    ctx.fillText(line, width / 2, y);
    y += 24;
  }
  ctx.globalAlpha = 1;
}

function renderIntroScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  if (scene.kicker) {
    drawKicker(ctx, scene.kicker, 80, height * 0.32, brandColor, progress);
  }

  const lineW = 72 * easeOutCubic(Math.min(progress * 1.6, 1));
  ctx.fillStyle = brandColor;
  ctx.fillRect(80, height * 0.35, lineW, 3);

  drawLines(
    ctx,
    scene.headline,
    80,
    height * 0.44,
    `700 86px ${displayFont()}`,
    "#f7f4ee",
    width - 220,
    progress,
    "left",
    94
  );

  if (scene.subheadline) {
    drawLines(
      ctx,
      scene.subheadline,
      80,
      height * 0.58,
      `400 32px ${bodyFont()}`,
      "rgba(247,244,238,0.72)",
      width - 280,
      Math.max(0, progress - 0.18),
      "left",
      42
    );
  }

  if (scene.body) {
    drawLines(
      ctx,
      scene.body,
      80,
      height * 0.7,
      `400 22px ${bodyFont()}`,
      "rgba(247,244,238,0.5)",
      width - 400,
      Math.max(0, progress - 0.32),
      "left",
      32
    );
  }
}

function renderProblemScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  if (scene.kicker) {
    drawKicker(ctx, scene.kicker, 80, 140, brandColor, progress);
  }

  drawLines(
    ctx,
    scene.headline,
    80,
    200,
    `700 52px ${displayFont()}`,
    "#f7f4ee",
    width * 0.55,
    progress,
    "left",
    62
  );

  if (scene.body) {
    drawLines(
      ctx,
      scene.body,
      80,
      360,
      `400 28px ${bodyFont()}`,
      "rgba(247,244,238,0.78)",
      width * 0.52,
      Math.max(0, progress - 0.15),
      "left",
      40
    );
  }

  if (scene.subheadline) {
    const cardX = width * 0.62;
    const cardY = 220;
    const cardW = width * 0.3;
    const cardH = 280;
    const alpha = easeOutCubic(Math.max(0, (progress - 0.25) * 1.6));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.strokeStyle = `${brandColor}66`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ensureRoundRect(ctx);
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.font = `600 14px ${bodyFont()}`;
    ctx.fillStyle = brandColor;
    ctx.textAlign = "left";
    ctx.fillText("THE OUTCOME", cardX + 28, cardY + 48);
    ctx.globalAlpha = 1;
    drawLines(
      ctx,
      scene.subheadline,
      cardX + 28,
      cardY + 100,
      `500 26px ${displayFont()}`,
      "#f7f4ee",
      cardW - 56,
      Math.max(0, progress - 0.25),
      "left",
      36
    );
  }
}

function renderHighlightScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  if (scene.kicker) {
    drawKicker(ctx, scene.kicker, 80, 130, brandColor, progress);
  }

  const lineW = 56 * easeOutCubic(Math.min(progress * 1.6, 1));
  ctx.fillStyle = brandColor;
  ctx.fillRect(80, 150, lineW, 3);

  drawLines(
    ctx,
    scene.headline,
    80,
    230,
    `700 64px ${displayFont()}`,
    "#f7f4ee",
    width - 200,
    progress,
    "left",
    76
  );

  if (scene.body) {
    drawLines(
      ctx,
      scene.body,
      80,
      360,
      `400 28px ${bodyFont()}`,
      "rgba(247,244,238,0.75)",
      width * 0.7,
      Math.max(0, progress - 0.16),
      "left",
      40
    );
  }

  if (scene.metric) {
    drawMetricBadge(ctx, scene.metric, 80, height - 200, brandColor, progress);
  }
}

function renderQuoteScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  if (scene.kicker) {
    drawKicker(ctx, scene.kicker, width / 2 - 80, height * 0.28, brandColor, progress);
    ctx.textAlign = "center";
    ctx.font = `600 15px ${bodyFont()}`;
    ctx.fillStyle = brandColor;
    ctx.globalAlpha = easeOutCubic(Math.min(progress * 2, 1));
    ctx.fillText(scene.kicker, width / 2, height * 0.28);
    ctx.globalAlpha = 1;
  }

  ctx.font = `700 120px ${displayFont()}`;
  ctx.fillStyle = brandColor;
  ctx.globalAlpha = 0.35 * easeOutCubic(progress);
  ctx.textAlign = "left";
  ctx.fillText("“", 140, height * 0.48);
  ctx.globalAlpha = 1;

  drawLines(
    ctx,
    scene.headline,
    width / 2,
    height * 0.42,
    `500 40px ${displayFont()}`,
    "#f7f4ee",
    width - 360,
    progress,
    "center",
    54
  );

  if (scene.subheadline) {
    drawLines(
      ctx,
      scene.subheadline,
      width / 2,
      height * 0.68,
      `400 20px ${bodyFont()}`,
      "rgba(247,244,238,0.55)",
      width - 400,
      Math.max(0, progress - 0.22),
      "center",
      28
    );
  }
}

function renderStatsScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  if (scene.kicker) {
    drawKicker(ctx, scene.kicker, 80, 140, brandColor, progress);
  }

  drawLines(
    ctx,
    scene.headline,
    80,
    210,
    `700 48px ${displayFont()}`,
    "#f7f4ee",
    width - 200,
    progress,
    "left",
    58
  );

  const parts = (scene.body || scene.subheadline || "")
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4);

  const cardW = (width - 160 - (parts.length - 1) * 28) / Math.max(parts.length, 1);
  parts.forEach((part, i) => {
    const [label, metric] = part.includes(":")
      ? [part.split(":")[0].trim(), part.split(":").slice(1).join(":").trim()]
      : ["", part];
    const x = 80 + i * (cardW + 28);
    const y = 340;
    const appear = easeOutCubic(Math.max(0, progress - 0.15 - i * 0.08) * 1.8);
    ctx.globalAlpha = appear;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ensureRoundRect(ctx);
    ctx.roundRect(x, y, cardW, 220, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = brandColor;
    ctx.fillRect(x, y, cardW * appear, 3);
    ctx.globalAlpha = 1;
    drawLines(
      ctx,
      metric || part,
      x + 24,
      y + 90,
      `700 32px ${displayFont()}`,
      brandColor,
      cardW - 48,
      Math.max(0, progress - 0.15 - i * 0.08),
      "left",
      40
    );
    if (label) {
      drawLines(
        ctx,
        label,
        x + 24,
        y + 150,
        `400 18px ${bodyFont()}`,
        "rgba(247,244,238,0.6)",
        cardW - 48,
        Math.max(0, progress - 0.22 - i * 0.08),
        "left",
        26
      );
    }
  });
}

function renderCtaScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  if (scene.kicker) {
    drawKicker(ctx, scene.kicker, width / 2 - 40, height * 0.32, brandColor, progress);
    ctx.globalAlpha = easeOutCubic(Math.min(progress * 2, 1));
    ctx.font = `600 15px ${bodyFont()}`;
    ctx.fillStyle = brandColor;
    ctx.textAlign = "center";
    ctx.fillText(scene.kicker, width / 2, height * 0.32);
    ctx.globalAlpha = 1;
  }

  drawLines(
    ctx,
    scene.headline,
    width / 2,
    height * 0.42,
    `700 52px ${displayFont()}`,
    "#f7f4ee",
    width - 240,
    progress,
    "center",
    64
  );

  const btnProgress = easeInOutCubic(Math.min(progress * 1.4, 1));
  const btnWidth = 520;
  const btnHeight = 70;
  const btnX = (width - btnWidth) / 2;
  const btnY = height * 0.58;
  ctx.globalAlpha = btnProgress;
  ctx.fillStyle = brandColor;
  ctx.beginPath();
  ensureRoundRect(ctx);
  ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 6);
  ctx.fill();
  ctx.font = `600 22px ${displayFont()}`;
  ctx.fillStyle = "#0a0a0c";
  ctx.textAlign = "center";
  ctx.fillText("CONTINUE THE BRIEFING", width / 2, btnY + 44);
  ctx.globalAlpha = 1;

  if (scene.subheadline) {
    drawLines(
      ctx,
      scene.subheadline,
      width / 2,
      btnY + btnHeight + 56,
      `400 22px ${bodyFont()}`,
      "rgba(247,244,238,0.55)",
      width - 280,
      Math.max(0, progress - 0.25),
      "center",
      30
    );
  }
}

function renderOutroScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  if (scene.kicker) {
    ctx.globalAlpha = easeOutCubic(Math.min(progress * 2, 1));
    ctx.font = `600 16px ${bodyFont()}`;
    ctx.fillStyle = "rgba(247,244,238,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(scene.kicker, width / 2, height * 0.38);
    ctx.globalAlpha = 1;
  }

  drawLines(
    ctx,
    scene.headline,
    width / 2,
    height * 0.48,
    `700 64px ${displayFont()}`,
    "#f7f4ee",
    width - 240,
    progress,
    "center",
    76
  );

  if (scene.subheadline) {
    drawLines(
      ctx,
      scene.subheadline,
      width / 2,
      height * 0.6,
      `400 26px ${bodyFont()}`,
      brandColor,
      width - 280,
      Math.max(0, progress - 0.18),
      "center",
      36
    );
  }
}

const SCENE_RENDERERS: Record<
  SceneType,
  (rc: RenderContext, scene: VideoScene, progress: number) => void
> = {
  intro: renderIntroScene,
  problem: renderProblemScene,
  highlight: renderHighlightScene,
  quote: renderQuoteScene,
  stats: renderStatsScene,
  cta: renderCtaScene,
  outro: renderOutroScene,
};

export function renderScene(
  rc: RenderContext,
  scene: VideoScene,
  sceneProgress: number
): void {
  const { ctx, width, height } = rc;
  ctx.clearRect(0, 0, width, height);
  const renderer = SCENE_RENDERERS[scene.type] || renderHighlightScene;
  renderer(rc, scene, sceneProgress);
  drawCaptions(rc, scene, sceneProgress);
  drawChrome(rc, sceneProgress);
}

export interface VideoExportOptions {
  canvas: HTMLCanvasElement;
  brief: ClientBrief;
  scenes: VideoScene[];
  withScore?: boolean;
  onProgress?: (progress: number) => void;
  onSceneChange?: (sceneIndex: number) => void;
}

export async function exportVideo(options: VideoExportOptions): Promise<Blob> {
  const { canvas, brief, scenes, onProgress, onSceneChange, withScore = true } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  const width = 1920;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;

  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot record video. Use Chrome or Edge.");
  }
  if (typeof canvas.captureStream !== "function") {
    throw new Error("This browser cannot capture canvas video. Use Chrome or Edge.");
  }

  const canvasStream = canvas.captureStream(30);
  let audioCtx: AudioContext | null = null;
  let score: ReturnType<typeof createCinematicScore> | null = null;
  let stream: MediaStream = canvasStream;

  if (withScore && typeof AudioContext !== "undefined") {
    audioCtx = new AudioContext();
    await audioCtx.resume();
    score = createCinematicScore(audioCtx);
    score.start();
    stream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...score.destination.stream.getAudioTracks(),
    ]);
  }

  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "";
  if (!mimeType) {
    score?.stop();
    await audioCtx?.close();
    throw new Error("WebM recording is not supported in this browser. Use Chrome or Edge.");
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingDone = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error("Recording failed"));
  });

  recorder.start(100);

  const totalMs = scenes.reduce((sum, s) => sum + s.durationMs, 0);
  const startedAt = performance.now();
  let sceneIndex = 0;
  let sceneStartedAt = startedAt;

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      if (sceneIndex >= scenes.length) {
        resolve();
        return;
      }
      const scene = scenes[sceneIndex];
      const elapsedInScene = now - sceneStartedAt;
      if (elapsedInScene >= scene.durationMs) {
        sceneIndex += 1;
        sceneStartedAt = now;
        if (sceneIndex >= scenes.length) {
          resolve();
          return;
        }
        onSceneChange?.(sceneIndex);
      }
      const current = scenes[Math.min(sceneIndex, scenes.length - 1)];
      const localElapsed = now - sceneStartedAt;
      const sceneProgress = Math.min(localElapsed / current.durationMs, 0.999);
      const filmProgress = Math.min((now - startedAt) / totalMs, 1);
      renderScene(
        {
          canvas,
          ctx,
          width,
          height,
          brandColor: brief.brandColor,
          brief,
          sceneIndex: Math.min(sceneIndex, scenes.length - 1),
          sceneCount: scenes.length,
          filmProgress,
        },
        current,
        sceneProgress
      );
      onProgress?.(filmProgress);
      requestAnimationFrame(tick);
    };
    onSceneChange?.(0);
    requestAnimationFrame(tick);
  });

  recorder.stop();
  const blob = await recordingDone;
  score?.stop();
  await audioCtx?.close();
  return blob;
}

export function previewScene(
  canvas: HTMLCanvasElement,
  brief: ClientBrief,
  scene: VideoScene,
  progress: number,
  sceneIndex = 0,
  sceneCount = 1,
  filmProgress = progress
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = 1920;
  canvas.height = 1080;

  renderScene(
    {
      canvas,
      ctx,
      width: 1920,
      height: 1080,
      brandColor: brief.brandColor,
      brief,
      sceneIndex,
      sceneCount,
      filmProgress,
    },
    scene,
    progress
  );
}
