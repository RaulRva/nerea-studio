import { formatNumber } from "@/lib/format";
import type { Meal } from "@/lib/types";

export type ShopLine = {
  name: string;
  amount: string;
  unit: string;
  group: "peso" | "volumen" | "unidades";
};

type Bucket = {
  label: string;
  grams: number;
  ml: number;
  units: number;
  unitName: string;
  taste: boolean;
};

const FILLERS =
  /\b(mediano|mediana|pequeño|pequeña|grande|rallad[oa]|enter[oa]|sin piel|al natural|en crudo|a la plancha|al horno|de temporada)\b/gi;
const SEASONINGS = new Set(["canela", "aceite", "sal", "pimienta", "orégano", "vinagre"]);
const IRREGULAR: Record<string, string> = {
  orejones: "orejón",
  nueces: "nuez",
};

function cleanName(raw: string) {
  return raw
    .replace(/0\s*%/g, " ")
    .replace(FILLERS, " ")
    .replace(/^(?:de|del|la|el|los|las)\s+/i, "")
    .replace(/[.,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stemWord(word: string) {
  const lower = word.toLowerCase();
  if (IRREGULAR[lower]) return IRREGULAR[lower];
  if (lower.length <= 3) return lower;
  if (lower.endsWith("ces")) return `${lower.slice(0, -3)}z`;
  if (/[aeiouáéíóú]s$/i.test(lower)) return lower.slice(0, -1);
  return lower;
}

function keyOf(name: string) {
  return name.split(" ").filter(Boolean).map(stemWord).join(" ");
}

function preferLabel(current: string, next: string) {
  const currentHead = current.split(" ")[0] ?? current;
  const nextHead = next.split(" ")[0] ?? next;
  if (nextHead === `${currentHead}s` || nextHead === `${currentHead}es`) return next;
  if (currentHead.endsWith("s") && (nextHead === currentHead.slice(0, -1) || nextHead === currentHead.slice(0, -2))) {
    return current;
  }
  return current.length >= next.length ? current : next;
}

function pluralWord(word: string) {
  if (word.endsWith("s")) return word;
  if (word.endsWith("z")) return `${word.slice(0, -1)}ces`;
  if (/[aeiouáéíóú]$/i.test(word)) return `${word}s`;
  return `${word}es`;
}

function pluralName(name: string) {
  const words = name.split(" ");
  if (words[0] && !words[0].endsWith("s")) words[0] = pluralWord(words[0]);
  return words.join(" ");
}

function label(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function segments(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/\([^)]*\)/g, " ")
    .split(/\n+/)
    .flatMap((line) =>
      line
        .replace(/^añadir\s+/i, "")
        .split(/\s*,\s*|\s+y\s+/i)
        .map((part) => part.replace(/^[.\s;:]+|[.\s;:]+$/g, "").trim())
        .filter(Boolean),
    );
}

function asAmount(amount: number, unit: string) {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (unit === "kg") return { amount: amount * 1000, unit: "g" as const };
  if (unit === "g") return { amount, unit: "g" as const };
  if (unit === "l") return { amount: amount * 1000, unit: "ml" as const };
  if (unit === "cl") return { amount: amount * 10, unit: "ml" as const };
  if (unit === "ml") return { amount, unit: "ml" as const };
  return null;
}

function add(buckets: Map<string, Bucket>, name: string, patch: Partial<Bucket>) {
  const cleaned = cleanName(name);
  const key = keyOf(cleaned);
  if (!key) return;
  const current = buckets.get(key);
  if (!current) {
    buckets.set(key, {
      label: cleaned,
      grams: patch.grams ?? 0,
      ml: patch.ml ?? 0,
      units: patch.units ?? 0,
      unitName: patch.unitName ?? "ud",
      taste: patch.taste ?? false,
    });
    return;
  }
  current.label = preferLabel(current.label, cleaned);
  current.grams += patch.grams ?? 0;
  current.ml += patch.ml ?? 0;
  if ((patch.units ?? 0) > 0) {
    if (current.units > 0 && patch.unitName && current.unitName !== patch.unitName) current.unitName = "ud";
    else if (patch.unitName) current.unitName = patch.unitName;
  }
  current.units += patch.units ?? 0;
  current.taste = current.taste || Boolean(patch.taste);
}

function parseSegment(raw: string, buckets: Map<string, Bucket>) {
  const text = raw.replace(/^aprox(?:imadamente)?\s+/i, "").trim();
  const weight = text.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b\s*(?:de\s+)?(.+)$/i);
  if (weight) {
    const scaled = asAmount(Number(weight[1].replace(",", ".")), weight[2].toLowerCase());
    if (!scaled) return;
    add(buckets, weight[3], scaled.unit === "g" ? { grams: scaled.amount } : { ml: scaled.amount });
    return;
  }

  const pack = text.match(/^(?:un|una|\d+(?:[.,]\d+)?)\s+(rebanadas?|latas?|piezas?)\s+(?:de\s+)?(.+)$/i);
  if (pack) {
    const count = /^(un|una)/i.test(pack[0]) ? 1 : Number(pack[0].match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(",", "."));
    const unitName = stemWord(pack[1].toLowerCase());
    add(buckets, pack[2], { units: count, unitName });
    return;
  }

  const seasoning = text.match(/^(?:un|una|\d+(?:[.,]\d+)?)\s+(?:pizcas?|chorritos?|cucharaditas?|cucharadas?)\s+(?:de\s+)?(.+)$/i);
  if (seasoning) {
    add(buckets, seasoning[1], { taste: true });
    return;
  }

  const handful = text.match(/^(?:un|una|(\d+(?:[.,]\d+)?))\s+puñados?\s+(?:de\s+)?(.+)$/i);
  if (handful) {
    const count = handful[1] ? Number(handful[1].replace(",", ".")) : 1;
    add(buckets, handful[2], { units: count, unitName: "ud" });
    return;
  }

  const count = text.match(/^(?:un|una|(\d+(?:[.,]\d+)?))\s+(.+)$/i);
  if (count) {
    const value = count[1] ? Number(count[1].replace(",", ".")) : 1;
    const name = cleanName(count[2]);
    if (SEASONINGS.has(keyOf(name))) add(buckets, name, { taste: true });
    else add(buckets, name, { units: value, unitName: "ud" });
    return;
  }

  const name = cleanName(text);
  if (!name) return;
  if (SEASONINGS.has(keyOf(name))) add(buckets, name, { taste: true });
  else add(buckets, name, { units: 1, unitName: "ud" });
}

function unitLabel(unitName: string, count: number) {
  if (unitName === "ud") return count === 1 ? "ud" : "uds";
  return count === 1 ? unitName : pluralWord(unitName);
}

function toLine(bucket: Bucket): ShopLine {
  const counted = bucket.units > 0 && bucket.unitName === "ud";
  const name = label(counted && bucket.units > 1 ? pluralName(bucket.label) : bucket.label);
  const parts: string[] = [];
  if (bucket.grams > 0) parts.push(`${formatNumber(bucket.grams)} g`);
  if (bucket.ml > 0) parts.push(`${formatNumber(bucket.ml)} ml`);
  if (bucket.units > 0) parts.push(`${formatNumber(bucket.units, 0)} ${unitLabel(bucket.unitName, bucket.units)}`);

  if (parts.length === 1 && bucket.grams > 0 && bucket.ml === 0 && bucket.units === 0) {
    return { name, amount: formatNumber(bucket.grams), unit: "g", group: "peso" };
  }
  if (parts.length === 1 && bucket.ml > 0 && bucket.grams === 0 && bucket.units === 0) {
    return { name, amount: formatNumber(bucket.ml), unit: "ml", group: "volumen" };
  }
  if (parts.length === 1 && bucket.units > 0 && bucket.grams === 0 && bucket.ml === 0) {
    return {
      name,
      amount: formatNumber(bucket.units, 0),
      unit: unitLabel(bucket.unitName, bucket.units),
      group: "unidades",
    };
  }
  if (parts.length > 1) {
    return {
      name,
      amount: parts.join(" + "),
      unit: "",
      group: bucket.ml > 0 && bucket.grams === 0 ? "volumen" : "peso",
    };
  }
  return { name, amount: "al gusto", unit: "", group: "unidades" };
}

export function shoppingList(meals: Meal[]): ShopLine[] {
  const buckets = new Map<string, Bucket>();

  for (const meal of meals) {
    const source = meal.detail.trim() ? meal.detail : meal.title;
    for (const part of segments(source)) parseSegment(part, buckets);
  }

  const lines = [...buckets.values()].map(toLine);
  lines.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return lines;
}
