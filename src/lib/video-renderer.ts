import type { ClientBrief, VideoScene } from "@/types";

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
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 99, g: 102, b: 241 };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brandColor: string,
  progress: number
): void {
  const rgb = hexToRgb(brandColor);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0a0a0f");
  gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
  gradient.addColorStop(1, "#12121a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Animated accent orb
  const orbX = width * 0.7 + Math.sin(progress * Math.PI * 2) * 50;
  const orbY = height * 0.3 + Math.cos(progress * Math.PI * 2) * 30;
  const orbGradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 300);
  orbGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
  orbGradient.addColorStop(1, "transparent");
  ctx.fillStyle = orbGradient;
  ctx.fillRect(0, 0, width, height);

  // Grid overlay
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawAccentLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  brandColor: string,
  progress: number
): void {
  const lineWidth = width * easeOutCubic(Math.min(progress * 2, 1));
  ctx.fillStyle = brandColor;
  ctx.fillRect(x, y, lineWidth, 3);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
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

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  maxWidth: number,
  progress: number,
  align: CanvasTextAlign = "left"
): number {
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = color;

  const alpha = easeOutCubic(Math.min(progress * 1.5, 1));
  ctx.globalAlpha = alpha;

  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.3;
  let currentY = y;

  for (const line of lines) {
    const slideOffset = (1 - easeOutCubic(Math.min(progress * 1.5, 1))) * 30;
    ctx.fillText(line, x + (align === "center" ? 0 : slideOffset), currentY);
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
  const alpha = easeOutCubic(Math.max(0, (progress - 0.3) * 2));
  if (alpha <= 0) return;

  ctx.globalAlpha = alpha;
  ctx.font = "600 28px system-ui, -apple-system, sans-serif";
  const textWidth = ctx.measureText(metric).width;
  const padding = 24;
  const badgeWidth = textWidth + padding * 2;
  const badgeHeight = 52;

  ctx.fillStyle = brandColor;
  ctx.beginPath();
  ensureRoundRect(ctx);
  ctx.roundRect(x, y, badgeWidth, badgeHeight, 8);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(metric, x + padding, y + 36);
  ctx.globalAlpha = 1;
}

function renderIntroScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  const headlineProgress = easeOutCubic(Math.min(progress * 1.2, 1));
  const subProgress = easeOutCubic(Math.max(0, (progress - 0.25) * 1.5));

  drawAccentLine(ctx, 80, height * 0.38, 80, brandColor, headlineProgress);

  drawText(ctx, scene.headline, 80, height * 0.42, 72, "#ffffff", width - 160, headlineProgress);

  if (scene.subheadline) {
    ctx.font = "400 32px system-ui, -apple-system, sans-serif";
    drawText(
      ctx,
      scene.subheadline,
      80,
      height * 0.55,
      32,
      "rgba(255,255,255,0.7)",
      width - 160,
      subProgress
    );
  }

  // Bottom label
  ctx.globalAlpha = subProgress * 0.5;
  ctx.font = "500 18px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  ctx.fillText("EXECUTIVE PRODUCT DEMO", 80, height - 60);
  ctx.globalAlpha = 1;
}

function renderHighlightScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  const headlineProgress = easeOutCubic(Math.min(progress * 1.2, 1));
  const bodyProgress = easeOutCubic(Math.max(0, (progress - 0.2) * 1.3));

  // Scene number indicator
  ctx.globalAlpha = headlineProgress * 0.6;
  ctx.font = "600 16px system-ui, sans-serif";
  ctx.fillStyle = brandColor;
  ctx.textAlign = "left";
  ctx.fillText("KEY CAPABILITY", 80, 120);
  ctx.globalAlpha = 1;

  drawAccentLine(ctx, 80, 140, 60, brandColor, headlineProgress);
  drawText(ctx, scene.headline, 80, 180, 56, "#ffffff", width - 160, headlineProgress);

  if (scene.body) {
    ctx.font = "400 26px system-ui, sans-serif";
    drawText(
      ctx,
      scene.body,
      80,
      280,
      26,
      "rgba(255,255,255,0.75)",
      width - 160,
      bodyProgress
    );
  }

  if (scene.metric) {
    drawMetricBadge(ctx, scene.metric, 80, height - 160, brandColor, progress);
  }
}

function renderStatsScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  const headlineProgress = easeOutCubic(Math.min(progress * 1.2, 1));
  const subProgress = easeOutCubic(Math.max(0, (progress - 0.3) * 1.5));

  drawText(
    ctx,
    scene.headline,
    width / 2,
    height * 0.4,
    64,
    "#ffffff",
    width - 200,
    headlineProgress,
    "center"
  );

  if (scene.subheadline) {
    ctx.font = "500 36px system-ui, sans-serif";
    drawText(
      ctx,
      scene.subheadline,
      width / 2,
      height * 0.55,
      36,
      brandColor,
      width - 200,
      subProgress,
      "center"
    );
  }
}

function renderCtaScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  const headlineProgress = easeOutCubic(Math.min(progress * 1.2, 1));
  const subProgress = easeOutCubic(Math.max(0, (progress - 0.25) * 1.5));

  // CTA button visual
  const btnProgress = easeInOutCubic(Math.min(progress * 1.5, 1));
  const btnWidth = 400;
  const btnHeight = 64;
  const btnX = (width - btnWidth) / 2;
  const btnY = height * 0.55;

  ctx.globalAlpha = btnProgress;
  ctx.fillStyle = brandColor;
  ctx.beginPath();
  ensureRoundRect(ctx);
  ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 12);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawText(
    ctx,
    scene.headline,
    width / 2,
    height * 0.42,
    48,
    "#ffffff",
    width - 160,
    headlineProgress,
    "center"
  );

  if (scene.subheadline) {
    ctx.font = "400 24px system-ui, sans-serif";
    drawText(
      ctx,
      scene.subheadline,
      width / 2,
      btnY + btnHeight + 50,
      24,
      "rgba(255,255,255,0.6)",
      width - 200,
      subProgress,
      "center"
    );
  }
}

function renderOutroScene(rc: RenderContext, scene: VideoScene, progress: number): void {
  const { ctx, width, height, brandColor } = rc;
  drawGradientBackground(ctx, width, height, brandColor, progress);

  const progressEased = easeOutCubic(Math.min(progress * 1.2, 1));

  drawText(
    ctx,
    scene.headline,
    width / 2,
    height * 0.45,
    56,
    "#ffffff",
    width - 200,
    progressEased,
    "center"
  );

  if (scene.subheadline) {
    ctx.font = "400 28px system-ui, sans-serif";
    drawText(
      ctx,
      scene.subheadline,
      width / 2,
      height * 0.55,
      28,
      brandColor,
      width - 200,
      easeOutCubic(Math.max(0, (progress - 0.2) * 1.5)),
      "center"
    );
  }
}

export function renderScene(
  rc: RenderContext,
  scene: VideoScene,
  sceneProgress: number
): void {
  const { ctx, width, height } = rc;
  ctx.clearRect(0, 0, width, height);

  switch (scene.type) {
    case "intro":
      renderIntroScene(rc, scene, sceneProgress);
      break;
    case "highlight":
      renderHighlightScene(rc, scene, sceneProgress);
      break;
    case "stats":
      renderStatsScene(rc, scene, sceneProgress);
      break;
    case "cta":
      renderCtaScene(rc, scene, sceneProgress);
      break;
    case "outro":
      renderOutroScene(rc, scene, sceneProgress);
      break;
  }
}

export interface VideoExportOptions {
  canvas: HTMLCanvasElement;
  brief: ClientBrief;
  scenes: VideoScene[];
  onProgress?: (progress: number) => void;
  onSceneChange?: (sceneIndex: number) => void;
}

export async function exportVideo(options: VideoExportOptions): Promise<Blob> {
  const { canvas, brief, scenes, onProgress, onSceneChange } = options;
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

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "";
  if (!mimeType) {
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

  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  const rc: RenderContext = {
    canvas,
    ctx,
    width,
    height,
    brandColor: brief.brandColor,
    brief,
  };

  recorder.start(100);

  const fps = 30;
  let totalFrames = 0;
  let elapsedFrames = 0;

  for (const scene of scenes) {
    totalFrames += Math.ceil((scene.durationMs / 1000) * fps);
  }

  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
    const scene = scenes[sceneIndex];
    onSceneChange?.(sceneIndex);
    const frameCount = Math.ceil((scene.durationMs / 1000) * fps);

    for (let frame = 0; frame < frameCount; frame++) {
      const sceneProgress = frame / frameCount;
      renderScene(rc, scene, sceneProgress);
      elapsedFrames++;
      onProgress?.(elapsedFrames / totalFrames);
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
  }

  recorder.stop();
  return recordingDone;
}

export function previewScene(
  canvas: HTMLCanvasElement,
  brief: ClientBrief,
  scene: VideoScene,
  progress: number
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
    },
    scene,
    progress
  );
}
