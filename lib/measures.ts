import type { Measurement } from "@/lib/types";

export const MEASURE_ROWS: {
  key: "weightKg" | "heightCm" | "chestCm" | "armCm" | "waistCm" | "hipCm" | "thighCm";
  label: string;
  unit: string;
  digits: number;
}[] = [
  { key: "weightKg", label: "Peso", unit: "kg", digits: 2 },
  { key: "heightCm", label: "Altura", unit: "cm", digits: 1 },
  { key: "chestCm", label: "Pecho", unit: "cm", digits: 1 },
  { key: "armCm", label: "Brazo", unit: "cm", digits: 1 },
  { key: "waistCm", label: "Cintura", unit: "cm", digits: 1 },
  { key: "hipCm", label: "Cadera", unit: "cm", digits: 1 },
  { key: "thighCm", label: "Muslo", unit: "cm", digits: 1 },
];

export function measureValue(item: Measurement, key: (typeof MEASURE_ROWS)[number]["key"]) {
  return item[key];
}
