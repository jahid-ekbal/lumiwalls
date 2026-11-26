export const DHASH_DUPLICATE_THRESHOLD = 5;

const POPCOUNT_NIBBLE = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/**
 * Compute bit-level Hamming distance between two equal-length hex digests.
 */
export function hammingDistanceHex(a: string, b: string): number {
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();
  if (!normA || normA.length !== normB.length) {
    return Number.POSITIVE_INFINITY;
  }

  let distance = 0;
  for (let i = 0; i < normA.length; i += 1) {
    const n1 = parseInt(normA[i]!, 16);
    const n2 = parseInt(normB[i]!, 16);
    if (Number.isNaN(n1) || Number.isNaN(n2)) {
      return Number.POSITIVE_INFINITY;
    }
    distance += POPCOUNT_NIBBLE[n1 ^ n2] ?? 0;
  }
  return distance;
}
