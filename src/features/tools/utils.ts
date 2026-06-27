export const withAll = (items: string[]) => ["ALL", ...items.filter(Boolean)];

type SortableToolItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  sortOrder?: number;
};

export function isLatestCategory(value: string) {
  return value.trim().toLowerCase() === "terbaru";
}

export function orderToolItemsForCategory<T extends SortableToolItem>(items: T[], category: string, shuffleSeed: number) {
  if (isLatestCategory(category)) return sortToolItemsNewest(items);
  if (category === "ALL") return items;
  return shuffleToolItems(items, `${category}:${shuffleSeed}`);
}

export function sortToolItemsNewest<T extends SortableToolItem>(items: T[]) {
  return [...items].sort((a, b) => {
    const bTime = itemTime(b);
    const aTime = itemTime(a);
    if (bTime !== aTime) return bTime - aTime;
    return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
  });
}

export function shuffleToolItems<T>(items: T[], seed: string | number) {
  const result = [...items];
  let state = hashSeed(String(seed));
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = nextSeed(state);
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function itemTime(item: SortableToolItem) {
  const value = item.createdAt ?? item.updatedAt;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextSeed(seed: number) {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "buatcuan-video";
}
