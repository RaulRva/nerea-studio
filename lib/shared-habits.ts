import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffEmail } from "@/lib/supabase/env";

const DAY = 1;

const STARTER = [
  { name: "Andar", notes: "10.000 pasos al día", sort_order: 0 },
  { name: "Agua", notes: "Beber 2 litros", sort_order: 1 },
  { name: "Cinta", notes: "Después de cada entreno, intervalos de inclinación", sort_order: 2 },
];

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

export async function sharedHabitDay() {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: marked } = await admin
    .from("workout_days")
    .select("id, notes, client_id")
    .eq("title", "compartido")
    .limit(1)
    .maybeSingle();

  if (marked) {
    return {
      admin,
      ownerId: marked.client_id as string,
      dayId: marked.id as string,
      notes: (marked.notes as string) ?? "",
    };
  }

  const { data: profiles } = await admin.from("profiles").select("id, email").order("email");
  const { data: taken } = await admin.from("workout_days").select("client_id").eq("day_of_week", DAY);
  const takenIds = new Set((taken ?? []).map((row) => row.client_id));
  const owner =
    (profiles ?? []).find((row) => isStaffEmail(row.email) && !takenIds.has(row.id)) ??
    (profiles ?? []).find((row) => !takenIds.has(row.id));
  if (!owner) return null;

  const { data: created, error } = await admin
    .from("workout_days")
    .insert({ client_id: owner.id, day_of_week: DAY, title: "compartido", notes: "" })
    .select("id")
    .single();
  if (error || !created) return null;

  const { error: seedError } = await admin.from("exercises").insert(
    STARTER.map((item) => ({
      workout_day_id: created.id,
      name: item.name,
      notes: item.notes,
      sort_order: item.sort_order,
      reps: "",
    })),
  );
  if (seedError) return null;

  return { admin, ownerId: owner.id as string, dayId: created.id as string, notes: "" };
}

export async function signSharedPhotos(admin: Admin, paths: string[]) {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return new Map<string, string>();
  const { data } = await admin.storage.from("plan-photos").createSignedUrls(unique, 60 * 60);
  return new Map((data ?? []).flatMap((item) => (item.signedUrl && item.path ? [[item.path, item.signedUrl] as const] : [])));
}
