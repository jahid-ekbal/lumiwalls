export type ColorBucket = {
  index: number;
  name: string;
  swatch: string;
};

export const COLOR_BUCKETS: ColorBucket[] = [
  { index: 0, name: "Red", swatch: "oklch(0.55 0.22 25)" },
  { index: 1, name: "Orange", swatch: "oklch(0.65 0.16 55)" },
  { index: 2, name: "Yellow", swatch: "oklch(0.8 0.16 85)" },
  { index: 3, name: "Lime", swatch: "oklch(0.72 0.19 110)" },
  { index: 4, name: "Green", swatch: "oklch(0.6 0.16 145)" },
  { index: 5, name: "Teal", swatch: "oklch(0.62 0.12 180)" },
  { index: 6, name: "Cyan", swatch: "oklch(0.68 0.12 205)" },
  { index: 7, name: "Blue", swatch: "oklch(0.55 0.18 255)" },
  { index: 8, name: "Indigo", swatch: "oklch(0.52 0.18 280)" },
  { index: 9, name: "Violet", swatch: "oklch(0.55 0.2 305)" },
  { index: 10, name: "Magenta", swatch: "oklch(0.55 0.22 330)" },
  { index: 11, name: "Rose", swatch: "oklch(0.6 0.2 5)" },
];

const hexPattern = /^#?([0-9a-f]{6})$/i;

export type HexHsl = {
  hue: number;
  saturation: number;
  lightness: number;
};

export function hexToHsl(hex: string): HexHsl | null {
  const match = hexPattern.exec(hex.trim());
  if (!match) {
    return null;
  }
  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }
  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let huePart: number;
  if (max === r) {
    huePart = (g - b) / delta;
  } else if (max === g) {
    huePart = (b - r) / delta + 2;
  } else {
    huePart = (r - g) / delta + 4;
  }
  const hue = Math.round(huePart * 60 + 360) % 360;
  return { hue, saturation, lightness };
}

export function colorBucketIndex(hex: string): number | null {
  const hsl = hexToHsl(hex);
  if (hsl === null) {
    return null;
  }
  if (hsl.saturation < 0.12) {
    return null;
  }
  return Math.floor(hsl.hue / 30) % 12;
}

export function bucketHexes(colors: string[]): Map<number, string[]> {
  const grouped = new Map<number, Set<string>>();
  for (const color of colors) {
    const index = colorBucketIndex(color);
    if (index === null) {
      continue;
    }
    let set = grouped.get(index);
    if (!set) {
      set = new Set();
      grouped.set(index, set);
    }
    set.add(color.toLowerCase());
  }
  const output = new Map<number, string[]>();
  for (const [index, set] of grouped) {
    output.set(index, [...set]);
  }
  return output;
}

export function hexesForBuckets(
  available: Map<number, string[]>,
  bucketIndexes: number[],
): string[] {
  const perBucketLimit = Math.floor(48 / Math.max(1, bucketIndexes.length));
  const hexes = new Set<string>();
  for (const index of bucketIndexes) {
    const list = available.get(index) ?? [];
    for (const hex of list.slice(0, perBucketLimit)) {
      hexes.add(hex);
    }
  }
  return [...hexes];
}
