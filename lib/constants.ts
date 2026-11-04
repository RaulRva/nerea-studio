export const MEAL_SLOTS = [
  { id: "desayuno", label: "Desayuno", hint: "Primera comida" },
  { id: "almuerzo", label: "Almuerzo", hint: "Media mañana" },
  { id: "comida", label: "Comida", hint: "Mediodía" },
  { id: "merienda", label: "Merienda", hint: "Tarde" },
  { id: "cena", label: "Cena", hint: "Cierre del día" },
] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number]["id"];

export const DAYS = [
  { id: 1, short: "Lun", label: "Lunes" },
  { id: 2, short: "Mar", label: "Martes" },
  { id: 3, short: "Mié", label: "Miércoles" },
  { id: 4, short: "Jue", label: "Jueves" },
  { id: 5, short: "Vie", label: "Viernes" },
  { id: 6, short: "Sáb", label: "Sábado" },
  { id: 7, short: "Dom", label: "Domingo" },
] as const;

export function isMealSlot(value: string): value is MealSlot {
  return MEAL_SLOTS.some((slot) => slot.id === value);
}

export function dayLabel(day: number) {
  return DAYS.find((item) => item.id === day)?.label ?? "Día";
}
