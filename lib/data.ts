import "server-only";

import { asNumber } from "@/lib/format";
import { isMealSlot } from "@/lib/constants";
import { requireAdmin, requirePlanAccess } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ClientSummary, Exercise, Meal, Measurement, WorkoutDay } from "@/lib/types";

function mapMeal(row: {
  id: string;
  day_of_week: number;
  slot: string;
  title: string;
  detail: string;
  sort_order: number;
  photo_path: string | null;
}): Meal | null {
  if (!isMealSlot(row.slot)) return null;
  return {
    id: row.id,
    day: row.day_of_week,
    slot: row.slot,
    title: row.title,
    detail: row.detail,
    sortOrder: row.sort_order,
    photoUrl: row.photo_path,
  };
}

function mapExercise(row: {
  id: string;
  name: string;
  sets: number | null;
  reps: string;
  weight_kg: number | string | null;
  rest_seconds: number | null;
  notes: string;
  sort_order: number;
  photo_path: string | null;
}): Exercise {
  return {
    id: row.id,
    name: row.name,
    sets: row.sets,
    reps: row.reps,
    weightKg: asNumber(row.weight_kg),
    restSeconds: row.rest_seconds,
    notes: row.notes,
    sortOrder: row.sort_order,
    photoUrl: row.photo_path,
  };
}

async function withSignedPhotos<T extends { photoUrl: string | null }>(items: T[]) {
  const paths = [...new Set(items.flatMap((item) => (item.photoUrl ? [item.photoUrl] : [])))];
  if (paths.length === 0) return items;

  const supabase = await createClient();
  const { data } = await supabase.storage.from("plan-photos").createSignedUrls(paths, 60 * 60);
  const urls = new Map((data ?? []).map((item) => [item.path, item.signedUrl]));

  return items.map((item) => ({
    ...item,
    photoUrl: item.photoUrl ? (urls.get(item.photoUrl) ?? null) : null,
  }));
}

function mapMeasurement(row: {
  id: string;
  weight_kg: number | string;
  height_cm: number | string;
  chest_cm: number | string;
  arm_cm: number | string;
  waist_cm: number | string;
  hip_cm: number | string;
  thigh_cm: number | string;
  recorded_at: string;
}): Measurement {
  return {
    id: row.id,
    weightKg: asNumber(row.weight_kg) ?? 0,
    heightCm: asNumber(row.height_cm) ?? 0,
    chestCm: asNumber(row.chest_cm) ?? 0,
    armCm: asNumber(row.arm_cm) ?? 0,
    waistCm: asNumber(row.waist_cm) ?? 0,
    hipCm: asNumber(row.hip_cm) ?? 0,
    thighCm: asNumber(row.thigh_cm) ?? 0,
    recordedAt: row.recorded_at,
  };
}

export async function getMealsFor(clientId: string, day: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select("id, day_of_week, slot, title, detail, sort_order, photo_path")
    .eq("client_id", clientId)
    .eq("day_of_week", day)
    .order("sort_order", { ascending: true });

  if (error) throw new Error("No se ha podido cargar la dieta.");
  const meals = (data ?? []).flatMap((row) => {
    const meal = mapMeal(row);
    return meal ? [meal] : [];
  });
  return withSignedPhotos(meals);
}

export async function getWorkout(clientId: string, day: number): Promise<WorkoutDay | null> {
  const supabase = await createClient();
  const { data: dayRow, error } = await supabase
    .from("workout_days")
    .select("id, day_of_week, title, notes")
    .eq("client_id", clientId)
    .eq("day_of_week", day)
    .maybeSingle();

  if (error) throw new Error("No se ha podido cargar el entreno.");
  if (!dayRow) return null;

  const { data: exercises, error: exerciseError } = await supabase
    .from("exercises")
    .select("id, name, sets, reps, weight_kg, rest_seconds, notes, sort_order, photo_path")
    .eq("workout_day_id", dayRow.id)
    .order("sort_order", { ascending: true });

  if (exerciseError) throw new Error("No se ha podido cargar el entreno.");

  return {
    id: dayRow.id,
    day: dayRow.day_of_week,
    title: dayRow.title,
    notes: dayRow.notes,
    exercises: await withSignedPhotos((exercises ?? []).map(mapExercise)),
  };
}

export async function getMyDay(day: number) {
  const profile = await requirePlanAccess();
  const [meals, workout] = await Promise.all([
    getMealsFor(profile.id, day),
    getWorkout(profile.id, day),
  ]);
  return { profile, meals, workout };
}

export async function getMeasurements(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("body_measurements")
    .select(
      "id, weight_kg, height_cm, chest_cm, arm_cm, waist_cm, hip_cm, thigh_cm, recorded_at",
    )
    .eq("client_id", clientId)
    .order("recorded_at", { ascending: false });

  if (error) throw new Error("No se ha podido cargar la ficha.");
  return (data ?? []).map(mapMeasurement);
}

export async function listClients(search: string): Promise<ClientSummary[]> {
  await requireAdmin();
  const supabase = await createClient();
  const clean = search.replace(/[^\p{L}\p{N}\s@.+-]/gu, "").trim();

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "client")
    .order("full_name", { ascending: true })
    .limit(200);

  if (clean) {
    query = query.or(`full_name.ilike.%${clean}%,email.ilike.%${clean}%`);
  }

  const { data: clients, error } = await query;
  if (error) throw new Error("No se ha podido cargar la lista de clientes.");
  if (!clients?.length) return [];

  const ids = clients.map((client) => client.id);
  const { data: measures, error: measureError } = await supabase
    .from("body_measurements")
    .select("client_id, weight_kg, waist_cm, recorded_at")
    .in("client_id", ids)
    .order("recorded_at", { ascending: false });

  if (measureError) throw new Error("No se ha podido cargar la lista de clientes.");

  const latest = new Map<string, ClientSummary["latest"]>();
  for (const row of measures ?? []) {
    if (latest.has(row.client_id)) continue;
    latest.set(row.client_id, {
      weightKg: asNumber(row.weight_kg) ?? 0,
      waistCm: asNumber(row.waist_cm) ?? 0,
      recordedAt: row.recorded_at,
    });
  }

  return clients.map((client) => ({
    id: client.id,
    fullName: client.full_name,
    email: client.email,
    createdAt: client.created_at,
    latest: latest.get(client.id) ?? null,
  }));
}

export async function getClientStudio(clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", clientId)
    .maybeSingle();

  if (error) throw new Error("No se ha podido abrir la ficha del cliente.");
  if (!profile || profile.role !== "client") return null;

  const measurements = await getMeasurements(clientId);
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    createdAt: profile.created_at as string,
    measurements,
  };
}
