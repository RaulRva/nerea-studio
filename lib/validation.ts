import { madridIsoWeekday } from "@/lib/format";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RANGES = {
  weightKg: [25, 300, "El peso"],
  heightCm: [100, 250, "La altura"],
  chestCm: [20, 200, "El pecho"],
  armCm: [10, 80, "El brazo"],
  waistCm: [30, 200, "La cintura"],
  hipCm: [30, 200, "La cadera"],
  thighCm: [15, 120, "El muslo"],
} as const;

export type MeasurementValues = {
  weightKg: number;
  heightCm: number;
  chestCm: number;
  armCm: number;
  waistCm: number;
  hipCm: number;
  thighCm: number;
};

export function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function cleanBlock(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

export function parseUuid(value: unknown) {
  if (typeof value !== "string" || !UUID_RE.test(value)) return null;
  return value;
}

export function safePath(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return fallback;
  }
  return value;
}

export function parseDay(value: string | undefined, fallback = madridIsoWeekday()) {
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > 7) return fallback;
  return day;
}

export function parseSection(value: string | undefined): "dieta" | "entreno" | "ficha" {
  if (value === "entreno" || value === "ficha") return value;
  return "dieta";
}

function round(value: number, digits: number) {
  const power = 10 ** digits;
  return Math.round(value * power) / power;
}

function readNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseMeasurement(
  formData: FormData,
): { error: string } | { values: MeasurementValues } {
  const raw = {
    weightKg: readNumber(formData.get("weight_kg")),
    heightCm: readNumber(formData.get("height_cm")),
    chestCm: readNumber(formData.get("chest_cm")),
    armCm: readNumber(formData.get("arm_cm")),
    waistCm: readNumber(formData.get("waist_cm")),
    hipCm: readNumber(formData.get("hip_cm")),
    thighCm: readNumber(formData.get("thigh_cm")),
  };

  for (const key of Object.keys(RANGES) as (keyof typeof RANGES)[]) {
    const value = raw[key];
    const [min, max, label] = RANGES[key];
    if (value === null) return { error: `${label} es obligatorio.` };
    if (value < min || value > max) {
      return { error: `${label} tiene que estar entre ${min} y ${max}.` };
    }
  }

  return {
    values: {
      weightKg: round(raw.weightKg!, 2),
      heightCm: round(raw.heightCm!, 1),
      chestCm: round(raw.chestCm!, 1),
      armCm: round(raw.armCm!, 1),
      waistCm: round(raw.waistCm!, 1),
      hipCm: round(raw.hipCm!, 1),
      thighCm: round(raw.thighCm!, 1),
    },
  };
}

export function parseExerciseFields(formData: FormData) {
  const name = cleanText(formData.get("name"), 120);
  if (name.length < 2) return { error: "Escribe el nombre del ejercicio." as const };

  const setsRaw = formString(formData.get("sets")).trim();
  let sets: number | null = null;
  if (setsRaw) {
    const parsed = Number(setsRaw.replace(",", "."));
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
      return { error: "Las series tienen que ser un número del 1 al 30." as const };
    }
    sets = parsed;
  }

  const reps = cleanText(formData.get("reps"), 40);
  const weightRaw = formString(formData.get("weight_kg")).trim();
  let weightKg: number | null = null;
  if (weightRaw) {
    const parsed = Number(weightRaw.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 500) {
      return { error: "El peso tiene que estar entre 0 y 500 kg." as const };
    }
    weightKg = round(parsed, 2);
  }

  const restRaw = formString(formData.get("rest_seconds")).trim();
  let restSeconds: number | null = null;
  if (restRaw) {
    const parsed = Number(restRaw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 900) {
      return { error: "El descanso tiene que estar entre 0 y 900 segundos." as const };
    }
    restSeconds = parsed;
  }

  return {
    values: {
      name,
      sets,
      reps,
      weightKg,
      restSeconds,
      notes: cleanBlock(formData.get("notes"), 500),
    },
  };
}
