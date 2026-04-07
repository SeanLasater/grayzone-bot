import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = path.resolve("grayzone-loot-data.json");
const outputPath = path.resolve("data/loot.normalized.json");

const raw = await readFile(inputPath, "utf8");
const parsed = JSON.parse(raw);

if (!Array.isArray(parsed)) {
  throw new Error("grayzone-loot-data.json must be an array");
}

const normalized = parsed.map((item) => ({
  id: slugify(String(item.name ?? "")),
  name: String(item.name ?? "Unknown").trim(),
  size: String(item.size ?? "Unknown").trim() || "Unknown",
  weight: String(item.weight ?? "Unknown").trim() || "Unknown",
  sellPrice: parseSellPrice(item.sell_price),
  category: item.category ? String(item.category).trim() : null,
}));

const ids = new Set();
for (const item of normalized) {
  if (!item.name || item.name === "Unknown") {
    throw new Error("Found loot item with missing name");
  }

  if (ids.has(item.id)) {
    throw new Error(`Duplicate loot id generated: ${item.id}`);
  }
  ids.add(item.id);
}

await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
console.log(`Wrote ${normalized.length} items to ${outputPath}`);

function parseSellPrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text || text.includes("?")) {
      return null;
    }

    const parsedNumber = Number.parseInt(text.replaceAll(",", ""), 10);
    return Number.isFinite(parsedNumber) ? parsedNumber : null;
  }

  return null;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
