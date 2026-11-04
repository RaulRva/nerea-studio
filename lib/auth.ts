import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile, Role } from "@/lib/types";

function asRole(value: unknown): Role {
  return value === "admin" ? "admin" : "client";
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (error || !userId) return null;

  const { data: row } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: asRole(row.role),
  };
});

export const hasMeasurement = cache(async (clientId: string) => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("body_measurements")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);
  return (count ?? 0) > 0;
});

export async function requireUser() {
  const profile = await getProfile();
  if (!profile) redirect("/entrar");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireUser();
  if (profile.role !== "admin") redirect("/hoy");
  return profile;
}

export async function requirePlanAccess() {
  const profile = await requireUser();
  if (profile.role === "admin") redirect("/estudio");
  if (!(await hasMeasurement(profile.id))) redirect("/ficha");
  return profile;
}
