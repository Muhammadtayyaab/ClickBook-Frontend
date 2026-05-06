/**
 * Build the CSS-variable overrides that recolor `bg-gradient-hero` and
 * primary-tinted utilities for a given theme color. Applied as inline
 * `style` on a wrapper element so it cascades to every section renderer
 * underneath without touching global styles.
 */
export function themeStyleVars(color: string | null | undefined): React.CSSProperties {
  if (!color) return {};
  const c = color.trim();
  // A lightly-shifted gradient: the picked color → the same color rotated to
  // the warm side. Falls back to a flat fill if we can't parse hex.
  const accent = shiftHue(c, 30) ?? c;
  return {
    "--gradient-hero": `linear-gradient(135deg, ${c} 0%, ${accent} 100%)`,
    "--primary": c,
    "--ring": c,
  } as React.CSSProperties;
}

function shiftHue(hex: string, deg: number): string | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const [h, s, l] = rgbToHsl(r, g, b);
  const [r2, g2, b2] = hslToRgb((h + deg / 360) % 1, s, l);
  return `#${[r2, g2, b2].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0; let s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}
