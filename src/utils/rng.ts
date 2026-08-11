/** Small seedable RNG (mulberry32) so activity generation can be deterministic in tests. */
export function createRng(seed = Date.now()): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function sample<T>(items: T[], count: number, rng: () => number = Math.random): T[] {
  return shuffle(items, rng).slice(0, Math.min(count, items.length));
}

export function pick<T>(items: T[], rng: () => number = Math.random): T {
  return items[Math.floor(rng() * items.length)];
}

/** Weighted sample without replacement. `weightFn` must return a positive number. */
export function weightedSample<T>(
  items: T[],
  count: number,
  weightFn: (item: T) => number,
  rng: () => number = Math.random,
): T[] {
  const pool = items.map((item) => ({ item, weight: Math.max(weightFn(item), 0.01) }));
  const result: T[] = [];
  while (result.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let r = rng() * totalWeight;
    let index = 0;
    for (; index < pool.length; index++) {
      r -= pool[index].weight;
      if (r <= 0) break;
    }
    const chosen = pool.splice(Math.min(index, pool.length - 1), 1)[0];
    result.push(chosen.item);
  }
  return result;
}
