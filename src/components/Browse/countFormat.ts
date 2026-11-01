const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompactCount(value: number): string {
  return compactFormatter.format(value);
}

export function initialsOf(name: string): string {
  const source = name.trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
