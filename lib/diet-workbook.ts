import ExcelJS from "exceljs";
import { cleanBlock, cleanText } from "@/lib/validation";
import type { MealSlot } from "@/lib/constants";

export type DietRow = {
  day: number;
  slot: MealSlot;
  title: string;
  detail: string;
  sortOrder: number;
};

const DAYS: Record<string, number> = {
  lunes: 1,
  l: 1,
  "1": 1,
  martes: 2,
  m: 2,
  "2": 2,
  miercoles: 3,
  mie: 3,
  x: 3,
  "3": 3,
  jueves: 4,
  j: 4,
  "4": 4,
  viernes: 5,
  v: 5,
  "5": 5,
  sabado: 6,
  s: 6,
  "6": 6,
  domingo: 7,
  d: 7,
  "7": 7,
};

const SLOTS: Record<string, MealSlot> = {
  desayuno: "desayuno",
  almuerzo: "almuerzo",
  comida: "comida",
  merienda: "merienda",
  cena: "cena",
};

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return "";
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && value.text != null) return String(value.text);
    if ("result" in value && value.result != null && typeof value.result !== "object") return String(value.result);
  }
  return "";
}

export async function parseDietWorkbook(
  bytes: Buffer,
): Promise<{ rows: DietRow[] } | { error: "excel" | "cabecera" | "sinfilas" | "tope" | `fila-${number}` }> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    return { error: "excel" };
  }

  const sheet = workbook.getWorksheet("Dieta") ?? workbook.worksheets[0];
  if (!sheet) return { error: "excel" };

  const header = sheet.getRow(1);
  const columns = { day: 0, slot: 0, title: 0, detail: 0 };
  header.eachCell((cell, index) => {
    const name = fold(cellText(cell.value));
    if (name === "dia") columns.day = index;
    if (name === "comida") columns.slot = index;
    if (name === "titulo") columns.title = index;
    if (name === "detalle" || name === "cantidades") columns.detail = index;
  });
  if (!columns.day || !columns.slot || !columns.title) {
    return { error: "cabecera" };
  }

  const rows: DietRow[] = [];
  const order = new Map<number, number>();
  for (let number = 2; number <= sheet.rowCount; number += 1) {
    const row = sheet.getRow(number);
    const dayText = cellText(row.getCell(columns.day).value).trim();
    const slotText = cellText(row.getCell(columns.slot).value).trim();
    const title = cleanText(cellText(row.getCell(columns.title).value), 120);
    const detail = cleanBlock(columns.detail ? cellText(row.getCell(columns.detail).value) : "", 2000);
    if (!dayText && !slotText && !title && !detail) continue;
    const day = DAYS[fold(dayText)];
    const slot = SLOTS[fold(slotText)];
    if (!day || !slot || title.length < 2) {
      return { error: `fila-${number}` };
    }
    const sortOrder = (order.get(day) ?? 0) + 1;
    order.set(day, sortOrder);
    rows.push({ day, slot, title, detail, sortOrder });
    if (rows.length > 200) return { error: "tope" };
  }

  if (rows.length === 0) return { error: "sinfilas" };
  return { rows };
}
