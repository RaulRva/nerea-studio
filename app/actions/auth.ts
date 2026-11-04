"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasMeasurement, getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffEmail, isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { cleanText, formString, safePath } from "@/lib/validation";

async function requestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) return origin;
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function authError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "Ese correo ya tiene cuenta. Entra con tu contraseña.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirma el correo antes de entrar. Revisa la bandeja de entrada.";
  }
  if (normalized.includes("password")) return "La contraseña necesita al menos 8 caracteres.";
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Demasiados intentos. Espera un momento y vuelve a probar.";
  }
  return "No se ha podido completar. Revisa los datos e inténtalo de nuevo.";
}

async function promoteIfStaff(userId: string, email: string) {
  if (!isStaffEmail(email)) return false;
  const admin = createAdminClient();
  if (!admin) return false;
  const { data, error } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId)
    .select("id");
  return !error && Boolean(data?.length);
}

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase todavía no está conectado." };
  }

  const email = formString(formData.get("email")).trim().toLowerCase();
  const password = formString(formData.get("password"));
  if (!email || !password) return { error: "Escribe el correo y la contraseña." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: authError(error?.message ?? "") };

  await promoteIfStaff(data.user.id, data.user.email ?? email);
  const profile = await getProfile();
  const next = safePath(formData.get("next"));
  if (next) redirect(next);
  if (profile?.role === "admin") redirect("/estudio");
  if (profile && !(await hasMeasurement(profile.id))) redirect("/ficha");
  redirect("/hoy");
}

export async function register(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase todavía no está conectado." };
  }

  const name = cleanText(formData.get("name"), 80);
  const email = formString(formData.get("email")).trim().toLowerCase();
  const password = formString(formData.get("password"));
  const confirm = formString(formData.get("confirm"));

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (!email.includes("@")) return { error: "Escribe un correo válido." };
  if (password.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const admin = createAdminClient();

  let userId: string | null = null;
  if (admin) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error || !data.user) return { error: authError(error?.message ?? "") };
    userId = data.user.id;
  } else {
    const origin = await requestOrigin();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${origin}/auth/callback?next=/ficha`,
      },
    });
    if (error || !data.user) return { error: authError(error?.message ?? "") };
    userId = data.user.id;
    if (!data.session) {
      return {
        notice:
          "Cuenta creada. Revisa tu correo para confirmarla. Después entra y rellena la ficha corporal.",
      };
    }
  }

  const promoted = await promoteIfStaff(userId, email);
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: authError(signInError.message) };

  if (promoted) redirect("/estudio");
  redirect("/ficha");
}

export async function recover(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase todavía no está conectado." };
  }

  const email = formString(formData.get("email")).trim().toLowerCase();
  if (!email.includes("@")) return { error: "Escribe un correo válido." };

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/restablecer`,
  });
  if (error) return { error: authError(error.message) };

  return { notice: "Si ese correo está registrado, te llegará un enlace para cambiar la contraseña." };
}

export async function resetPassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase todavía no está conectado." };
  }

  const password = formString(formData.get("password"));
  const confirm = formString(formData.get("confirm"));
  if (password.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authError(error.message) };

  const profile = await getProfile();
  if (profile?.role === "admin") redirect("/estudio");
  if (profile && !(await hasMeasurement(profile.id))) redirect("/ficha");
  redirect("/hoy");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
