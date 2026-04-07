import rawLoot from "../../grayzone-loot-data.json";

type RawLootItem = {
  name: string;
  size: string;
  weight: string;
  sell_price: number | string | null;
  category?: string;
};

export type LootItem = {
  id: string;
  name: string;
  size: string;
  weight: string;
  sellPrice: number | null;
  category: string | null;
};

const normalizedLoot: LootItem[] = (rawLoot as RawLootItem[]).map((item) => ({
  id: slugify(item.name),
  name: item.name,
  size: cleanText(item.size),
  weight: cleanText(item.weight),
  sellPrice: parseSellPrice(item.sell_price),
  category: item.category ? cleanText(item.category) : null,
}));

const lootByName = new Map(normalizedLoot.map((item) => [item.name.toLowerCase(), item]));

export function getLootItemByName(name: string): LootItem | null {
  return lootByName.get(name.trim().toLowerCase()) ?? null;
}

export function searchLootItems(query: string, limit = 25): LootItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return normalizedLoot.slice(0, limit);
  }

  const startsWith: LootItem[] = [];
  const contains: LootItem[] = [];

  for (const item of normalizedLoot) {
    const name = item.name.toLowerCase();
    if (name.startsWith(q)) {
      startsWith.push(item);
      continue;
    }
    if (name.includes(q)) {
      contains.push(item);
    }
  }

  return [...startsWith, ...contains].slice(0, limit);
}

export function getAllLootItems(): LootItem[] {
  return normalizedLoot;
}

function parseSellPrice(value: RawLootItem["sell_price"]): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed.includes("?")) {
      return null;
    }

    const parsed = Number.parseInt(trimmed.replaceAll(",", ""), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function cleanText(value: string): string {
  const trimmed = value.trim();
  return trimmed || "Unknown";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
