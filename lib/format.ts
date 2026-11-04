const WEEKDAYS: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export function madridIsoWeekday(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    weekday: "short",
  }).format(date);
  return WEEKDAYS[weekday] ?? 1;
}

export function madridHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
}

export function greeting(name: string, date = new Date()) {
  const hour = madridHour(date);
  const hello =
    hour < 7 ? "Hola" : hour < 14 ? "Buenos días" : hour < 21 ? "Buenas tardes" : "Buenas noches";
  const first = name.trim().split(/\s+/)[0];
  return first ? `${hello}, ${first}` : hello;
}

export function longDate(date = new Date()) {
  const label = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function formatDelta(current: number, previous: number | undefined) {
  if (previous === undefined) return null;
  const diff = Math.round((current - previous) * 10) / 10;
  if (Math.abs(diff) < 0.05) return "sin cambio";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${formatNumber(diff)}`;
}

export function formatPrescription(sets: number | null, reps: string) {
  const parts: string[] = [];
  if (sets) parts.push(`${sets} ${sets === 1 ? "serie" : "series"}`);
  if (reps) parts.push(`${reps} reps`);
  return parts.join(" · ");
}
