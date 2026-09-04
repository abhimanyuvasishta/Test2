export function shotProxyUrl(prompt: string, seed: number): string {
  return `/api/shot?seed=${seed}&prompt=${encodeURIComponent(prompt)}`;
}

export function shotRemoteUrl(prompt: string, seed: number): string {
  const q = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${q}?width=1280&height=720&nologo=true&seed=${seed}`;
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image decode failed"));
    image.src = url;
  });
  return image;
}

export async function loadShotPlate(prompt: string, seed: number): Promise<HTMLImageElement | null> {
  const urls = [shotProxyUrl(prompt, seed), shotRemoteUrl(prompt, seed)];
  for (const url of urls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(40000) });
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.size < 1000) continue;
      return await blobToImage(blob);
    } catch {
      // try the next source
    }
  }
  return null;
}

export type ShotPlateMap = Record<string, CanvasImageSource>;

export async function loadScriptPlates(
  scenes: { id: string; imagePrompt?: string; imageSeed?: number }[],
  onEach?: (done: number, total: number, map: ShotPlateMap) => void
): Promise<ShotPlateMap> {
  const withPrompts = scenes.filter((s) => s.imagePrompt);
  const map: ShotPlateMap = {};
  let done = 0;
  const concurrency = 3;
  let cursor = 0;

  async function worker() {
    while (cursor < withPrompts.length) {
      const index = cursor;
      cursor += 1;
      const scene = withPrompts[index];
      const plate = await loadShotPlate(scene.imagePrompt as string, scene.imageSeed ?? 1);
      if (plate) map[scene.id] = plate;
      done += 1;
      onEach?.(done, withPrompts.length, { ...map });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, withPrompts.length) }, () => worker()));
  return map;
}
