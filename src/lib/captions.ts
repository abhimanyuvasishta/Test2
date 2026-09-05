export function splitCaptionWords(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

export function captionWindow(
  words: string[],
  progress: number,
  windowSize = 4
): { words: string[]; activeIndex: number } {
  if (words.length === 0) {
    return { words: [], activeIndex: 0 };
  }

  const clamped = Math.min(Math.max(progress, 0), 0.999);
  const spoken = Math.floor(clamped * words.length);
  const start = Math.max(0, Math.floor(spoken / windowSize) * windowSize);
  const slice = words.slice(start, start + windowSize);
  return {
    words: slice,
    activeIndex: spoken - start,
  };
}

export function estimateSpeechMs(text: string): number {
  const words = splitCaptionWords(text);
  const ms = Math.round((words.length / 2.6) * 1000);
  return Math.min(8000, Math.max(2200, ms + 400));
}
