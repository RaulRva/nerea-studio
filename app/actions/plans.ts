"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import {
  cleanBlock,
  cleanText,
  formString,
  parseDay,
  parseExerciseFields,
  parseMeasurement,
  parseSection,
  parseUuid,
  safePath,
} from "@/lib/validation";

function refresh(clientId?: string) {
  revalidatePath("/hoy");
  revalidatePath("/dieta");
  revalidatePath("/entreno");
  revalidatePath("/ficha");
  revalidatePath("/estudio");
  if (clientId) revalidatePath(`/estudio/${clientId}`);
}

type Db = Awaited<ReturnType<typeof createClient>>;

const PHOTO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function readPhoto(formData: FormData) {
  const value = formData.get("photo");
  if (!(value instanceof File) || value.size === 0) return null;
  const ext = PHOTO_EXT[value.type];
  if (!ext || value.size > 4 * 1024 * 1024) return "invalid" as const;
  return { file: value, ext };
}

function readPhotos(formData: FormData) {
  const files = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 3) return "invalid" as const;
  const photos: { file: File; ext: string }[] = [];
  for (const file of files) {
    const ext = PHOTO_EXT[file.type];
    if (!ext || file.size > 4 * 1024 * 1024) return "invalid" as const;
    photos.push({ file, ext });
  }
  return photos;
}

async function dropPhotoIfUnused(supabase: Db, path: string | null) {
  if (!path) return;
  const [{ count: meals }, { count: exercises }] = await Promise.all([
    supabase.from("meals").select("id", { count: "exact", head: true }).eq("photo_path", path),
    supabase.from("exercises").select("id", { count: "exact", head: true }).eq("photo_path", path),
  ]);
  if ((meals ?? 0) + (exercises ?? 0) === 0) {
    await supabase.storage.from("plan-photos").remove([path]);
  }
}

async function savePhoto(
  supabase: Db,
  clientId: string,
  kind: "meals" | "exercises",
  id: string,
  formData: FormData,
) {
  const photo = readPhoto(formData);
  const remove = formData.get("removePhoto") === "on";
  if (photo === "invalid") return "invalid" as const;
  if (!photo && !remove) return "ok" as const;

  const { data: current } = await supabase.from(kind).select("photo_path").eq("id", id).maybeSingle();
  const currentPath = current?.photo_path ?? null;

  if (photo) {
    const path = `${clientId}/${kind}/${id}.${photo.ext}`;
    const { error } = await supabase.storage.from("plan-photos").upload(path, photo.file, {
      contentType: photo.file.type,
      upsert: true,
    });
    if (error) return "failed" as const;
    const { error: updateError } = await supabase.from(kind).update({ photo_path: path }).eq("id", id);
    if (updateError) return "failed" as const;
    if (currentPath && currentPath !== path) await supabase.storage.from("plan-photos").remove([currentPath]);
    return "ok" as const;
  }

  if (currentPath) {
    const { error } = await supabase.from(kind).update({ photo_path: null }).eq("id", id);
    if (error) return "failed" as const;
    await dropPhotoIfUnused(supabase, currentPath);
  }
  return "ok" as const;
}

function photoAviso(result: "ok" | "invalid" | "failed") {
  if (result === "ok") return undefined;
  return "foto";
}

function studioPath(clientId: string, day: number, section: string, aviso?: string) {
  const params = new URLSearchParams({ dia: String(day), seccion: section });
  if (aviso) params.set("aviso", aviso);
  return `/estudio/${clientId}?${params.toString()}`;
}

async function studioContext(formData: FormData) {
  await requireAdmin();
  const clientId = parseUuid(formData.get("clientId"));
  const day = parseDay(formString(formData.get("day")) || undefined, 1);
  const section = parseSection(formString(formData.get("section")) || undefined);
  if (!clientId) redirect("/estudio?aviso=datos");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", clientId)
    .maybeSingle();

  if (!client || client.role !== "client") redirect("/estudio?aviso=datos");
  return { supabase, clientId, day, section };
}

async function nextMealSort(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  day: number,
) {
  const { data } = await supabase
    .from("meals")
    .select("sort_order")
    .eq("client_id", clientId)
    .eq("day_of_week", day)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

async function nextExerciseSort(supabase: Awaited<ReturnType<typeof createClient>>, dayId: string) {
  const { data } = await supabase
    .from("exercises")
    .select("sort_order")
    .eq("workout_day_id", dayId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

export async function saveMeasurement(_state: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireUser();
  const requested = parseUuid(formData.get("clientId"));
  const clientId = profile.role === "admin" ? requested : profile.id;
  if (!clientId) return { error: "No encuentro a ese cliente." };

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("role").eq("id", clientId).maybeSingle();
  if (!target || (profile.role === "admin" && target.role !== "client")) {
    return { error: "No encuentro a ese cliente." };
  }

  const parsed = parseMeasurement(formData);
  if ("error" in parsed) return parsed;

  const photos = readPhotos(formData);
  if (photos === "invalid") {
    return { error: "Puedes añadir hasta 3 fotos JPG, PNG o WebP, de menos de 4 MB cada una." };
  }

  const id = crypto.randomUUID();
  const photoPaths: string[] = [];
  for (const [index, photo] of photos.entries()) {
    const path = `${clientId}/measurements/${id}/${index + 1}.${photo.ext}`;
    const { error: uploadError } = await supabase.storage.from("plan-photos").upload(path, photo.file, {
      contentType: photo.file.type,
      upsert: false,
    });
    if (uploadError) {
      if (photoPaths.length > 0) await supabase.storage.from("plan-photos").remove(photoPaths);
      return { error: "No se han podido guardar las fotos. Inténtalo otra vez." };
    }
    photoPaths.push(path);
  }

  const { error } = await supabase.from("body_measurements").insert({
    id,
    client_id: clientId,
    weight_kg: parsed.values.weightKg,
    height_cm: parsed.values.heightCm,
    chest_cm: parsed.values.chestCm,
    arm_cm: parsed.values.armCm,
    waist_cm: parsed.values.waistCm,
    hip_cm: parsed.values.hipCm,
    thigh_cm: parsed.values.thighCm,
    photo_paths: photoPaths,
  });

  if (error) {
    if (photoPaths.length > 0) await supabase.storage.from("plan-photos").remove(photoPaths);
    return { error: "No se ha podido guardar la ficha. Revisa las medidas." };
  }

  refresh(clientId);
  const fallback = profile.role === "admin" ? `/estudio/${clientId}?seccion=ficha` : "/hoy";
  redirect(safePath(formData.get("returnTo"), fallback));
}

export async function deleteMeasurement(formData: FormData) {
  const profile = await requireUser();
  const id = parseUuid(formData.get("id"));
  const returnTo = safePath(formData.get("returnTo"), profile.role === "admin" ? "/estudio" : "/ficha");
  if (!id) redirect(returnTo);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("body_measurements")
    .delete()
    .eq("id", id)
    .select("client_id, photo_paths");
  if (error || !data?.length) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}aviso=datos`);
  const photoPaths = data[0].photo_paths ?? [];
  if (photoPaths.length > 0) await supabase.storage.from("plan-photos").remove(photoPaths);

  refresh(data[0].client_id);
  redirect(returnTo);
}

export async function addMeal(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const slot = formString(formData.get("slot"));
  const title = cleanText(formData.get("title"), 120);
  const detail = cleanBlock(formData.get("detail"), 2000);
  if (!["desayuno", "almuerzo", "comida", "merienda", "cena"].includes(slot) || title.length < 2) {
    redirect(studioPath(clientId, day, section, "titulo"));
  }

  if (readPhoto(formData) === "invalid") redirect(studioPath(clientId, day, section, "foto"));

  const sortOrder = await nextMealSort(supabase, clientId, day);
  const { data: created, error } = await supabase
    .from("meals")
    .insert({
      client_id: clientId,
      day_of_week: day,
      slot,
      title,
      detail,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  const photo = !error && created ? await savePhoto(supabase, clientId, "meals", created.id, formData) : "ok";
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error || !created ? "datos" : photoAviso(photo)));
}

export async function updateMeal(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const id = parseUuid(formData.get("id"));
  const title = cleanText(formData.get("title"), 120);
  const detail = cleanBlock(formData.get("detail"), 2000);
  if (!id || title.length < 2) redirect(studioPath(clientId, day, section, "titulo"));

  const { error } = await supabase.from("meals").update({ title, detail }).eq("id", id).eq("client_id", clientId);
  const photo = error ? "ok" : await savePhoto(supabase, clientId, "meals", id, formData);
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error ? "datos" : photoAviso(photo)));
}

export async function deleteMeal(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const id = parseUuid(formData.get("id"));
  if (!id) redirect(studioPath(clientId, day, section, "datos"));
  const { data, error } = await supabase
    .from("meals")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId)
    .select("photo_path")
    .maybeSingle();
  if (!error) await dropPhotoIfUnused(supabase, data?.photo_path ?? null);
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error ? "datos" : undefined));
}

export async function copyMealDay(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const target = parseDay(formString(formData.get("targetDay")) || undefined, 0);
  if (target < 1 || target === day) redirect(studioPath(clientId, day, section, "mismo"));

  const { count } = await supabase
    .from("meals")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("day_of_week", day);
  if (!count) redirect(studioPath(clientId, day, section, "vacio"));

  const { error } = await supabase.rpc("copy_meal_day", {
    p_client: clientId,
    p_from: day,
    p_to: target,
  });
  refresh(clientId);
  redirect(studioPath(clientId, target, section, error ? "copia" : "copiado"));
}

export async function clearMealDay(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const { data, error } = await supabase
    .from("meals")
    .delete()
    .eq("client_id", clientId)
    .eq("day_of_week", day)
    .select("photo_path");
  if (!error) {
    for (const path of new Set((data ?? []).map((row) => row.photo_path).filter(Boolean))) {
      await dropPhotoIfUnused(supabase, path);
    }
  }
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error ? "datos" : undefined));
}

async function ensureWorkoutDay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  day: number,
) {
  const { data: existing } = await supabase
    .from("workout_days")
    .select("id")
    .eq("client_id", clientId)
    .eq("day_of_week", day)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("workout_days")
    .insert({ client_id: clientId, day_of_week: day, title: "", notes: "" })
    .select("id")
    .single();
  if (error || !created) return null;
  return created.id as string;
}

export async function saveWorkoutDay(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const title = cleanText(formData.get("title"), 120);
  const notes = cleanBlock(formData.get("notes"), 2000);
  const { error } = await supabase.from("workout_days").upsert(
    { client_id: clientId, day_of_week: day, title, notes },
    { onConflict: "client_id,day_of_week" },
  );
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error ? "datos" : undefined));
}

export async function addExercise(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const parsed = parseExerciseFields(formData);
  if ("error" in parsed) redirect(studioPath(clientId, day, section, "titulo"));

  const dayId = await ensureWorkoutDay(supabase, clientId, day);
  if (!dayId) redirect(studioPath(clientId, day, section, "datos"));

  if (readPhoto(formData) === "invalid") redirect(studioPath(clientId, day, section, "foto"));

  const sortOrder = await nextExerciseSort(supabase, dayId);
  const { data: created, error } = await supabase
    .from("exercises")
    .insert({
      workout_day_id: dayId,
      name: parsed.values.name,
      sets: parsed.values.sets,
      reps: parsed.values.reps,
      weight_kg: parsed.values.weightKg,
      rest_seconds: parsed.values.restSeconds,
      notes: parsed.values.notes,
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  const photo = !error && created ? await savePhoto(supabase, clientId, "exercises", created.id, formData) : "ok";
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error || !created ? "datos" : photoAviso(photo)));
}

export async function updateExercise(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const id = parseUuid(formData.get("id"));
  const parsed = parseExerciseFields(formData);
  if (!id || "error" in parsed) redirect(studioPath(clientId, day, section, "titulo"));

  const { error } = await supabase
    .from("exercises")
    .update({
      name: parsed.values.name,
      sets: parsed.values.sets,
      reps: parsed.values.reps,
      weight_kg: parsed.values.weightKg,
      rest_seconds: parsed.values.restSeconds,
      notes: parsed.values.notes,
    })
    .eq("id", id);
  const photo = error ? "ok" : await savePhoto(supabase, clientId, "exercises", id, formData);
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error ? "datos" : photoAviso(photo)));
}

export async function deleteExercise(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const id = parseUuid(formData.get("id"));
  if (!id) redirect(studioPath(clientId, day, section, "datos"));
  const { data, error } = await supabase.from("exercises").delete().eq("id", id).select("photo_path").maybeSingle();
  if (!error) await dropPhotoIfUnused(supabase, data?.photo_path ?? null);
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error ? "datos" : undefined));
}

export async function copyWorkoutDay(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const target = parseDay(formString(formData.get("targetDay")) || undefined, 0);
  if (target < 1 || target === day) redirect(studioPath(clientId, day, section, "mismo"));

  const { data: source } = await supabase
    .from("workout_days")
    .select("id")
    .eq("client_id", clientId)
    .eq("day_of_week", day)
    .maybeSingle();
  if (!source) redirect(studioPath(clientId, day, section, "vacio"));

  const { error } = await supabase.rpc("copy_workout_day", {
    p_client: clientId,
    p_from: day,
    p_to: target,
  });
  refresh(clientId);
  redirect(studioPath(clientId, target, section, error ? "copia" : "copiado"));
}

export async function clearWorkoutDay(formData: FormData) {
  const { supabase, clientId, day, section } = await studioContext(formData);
  const { data: dayRow } = await supabase
    .from("workout_days")
    .select("id")
    .eq("client_id", clientId)
    .eq("day_of_week", day)
    .maybeSingle();
  const { data: photos } = dayRow
    ? await supabase.from("exercises").select("photo_path").eq("workout_day_id", dayRow.id)
    : { data: [] };
  const { error } = await supabase.from("workout_days").delete().eq("client_id", clientId).eq("day_of_week", day);
  if (!error) {
    for (const path of new Set((photos ?? []).map((row) => row.photo_path).filter(Boolean))) {
      await dropPhotoIfUnused(supabase, path);
    }
  }
  refresh(clientId);
  redirect(studioPath(clientId, day, section, error ? "datos" : undefined));
}
