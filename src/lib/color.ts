export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 196, g: 165, b: 116 };
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Black and near-black brands stay cinematic: silver highlights on a dark frame. */
export function filmAccent(brand: string): string {
  return relativeLuminance(brand) < 0.08 ? "#e6e6e6" : brand;
}

export function onFilmAccent(brand: string): string {
  return relativeLuminance(filmAccent(brand)) < 0.35 ? "#f7f4ee" : "#0a0a0c";
}
