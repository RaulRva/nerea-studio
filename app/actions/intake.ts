"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";
import { cleanBlock, cleanText, formString } from "@/lib/validation";

const RECIPIENTS = ["nerea.rva1@gmail.com", "raulriveranava10@gmail.com"];

const SEXO = ["Mujer", "Hombre", "Otro / Prefiero no indicarlo"];
const OBJETIVOS = [
  "Pérdida de grasa",
  "Aumento de masa muscular",
  "Recomposición corporal",
  "Mantenimiento",
  "Mejorar rendimiento deportivo",
  "Mejorar hábitos alimentarios",
];
const ACTIVIDAD = ["Sedentaria", "Ligera", "Moderada", "Alta", "Muy alta"];
const TRABAJO = ["Sentado", "De pie", "Caminando", "Trabajo físico intenso", "Variado"];
const FRECUENCIA = ["1-2 días", "3-4 días", "5-6 días", "7 días", "No entreno"];
const COMIDAS = ["2 comidas", "3 comidas", "4 comidas", "5 comidas", "6 comidas"];
const ALCOHOL = ["No", "Ocasionalmente", "Fines de semana", "Frecuentemente"];
const DIGESTIONES = [
  "Buenas, sin molestias",
  "Hinchazón abdominal",
  "Estreñimiento",
  "Digestiones pesadas",
  "Otros problemas",
];

function oneOf(value: string, options: string[]) {
  if (!value) return "";
  return options.includes(value) ? value : null;
}

function numberIn(value: string, min: number, max: number, digits: number) {
  if (!value) return { ok: true as const, value: null };
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return { ok: false as const };
  const factor = 10 ** digits;
  return { ok: true as const, value: Math.round(parsed * factor) / factor };
}

function line(label: string, value: string | number | null) {
  const text = value === null || value === "" ? "Sin indicar" : String(value);
  return `${label}: ${text}`;
}

async function deliver(subject: string, text: string, replyTo: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.INTAKE_FROM;
  if (!key || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: RECIPIENTS,
      reply_to: replyTo,
      subject,
      text,
    }),
  });

  return response.ok;
}

export async function submitIntake(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formString(formData.get("company")).trim()) {
    return { notice: "Hemos recibido tu cuestionario. Nerea lo revisará para preparar tu plan." };
  }

  const nombre = cleanText(formData.get("nombre"), 80);
  const correo = formString(formData.get("correo")).trim().toLowerCase();
  const edad = numberIn(formString(formData.get("edad")), 14, 100, 0);
  const altura = numberIn(formString(formData.get("altura")), 100, 250, 1);
  const peso = numberIn(formString(formData.get("peso")), 25, 300, 2);
  const pesoObjetivo = numberIn(formString(formData.get("pesoObjetivo")), 25, 300, 2);
  const sexo = oneOf(cleanText(formData.get("sexo"), 40), SEXO);
  const objetivo = oneOf(cleanText(formData.get("objetivo"), 80), OBJETIVOS);
  const actividad = oneOf(cleanText(formData.get("actividad"), 40), ACTIVIDAD);
  const trabajo = oneOf(cleanText(formData.get("trabajo"), 40), TRABAJO);
  const frecuencia = oneOf(cleanText(formData.get("frecuencia"), 20), FRECUENCIA);
  const comidas = oneOf(cleanText(formData.get("comidas"), 20), COMIDAS);
  const alcohol = oneOf(cleanText(formData.get("alcohol"), 30), ALCOHOL);
  const digestiones = oneOf(cleanText(formData.get("digestiones"), 40), DIGESTIONES);

  if (nombre.length < 2) return { error: "Escribe tu nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { error: "Escribe un correo válido." };
  if (!edad.ok || !altura.ok || !peso.ok || !pesoObjetivo.ok) {
    return { error: "Revisa edad, altura y peso. Algún número no encaja." };
  }
  if ([sexo, objetivo, actividad, trabajo, frecuencia, comidas, alcohol, digestiones].includes(null)) {
    return { error: "Hay una opción que no es válida. Vuelve a elegirla." };
  }

  const answers = {
    nombre,
    correo,
    edad: edad.value,
    sexo: sexo ?? "",
    altura_cm: altura.value,
    peso_kg: peso.value,
    peso_objetivo_kg: pesoObjetivo.value,
    objetivo: objetivo ?? "",
    actividad: actividad ?? "",
    trabajo: trabajo ?? "",
    entrenamiento: cleanBlock(formData.get("entrenamiento"), 2000),
    frecuencia: frecuencia ?? "",
    horario: cleanText(formData.get("horario"), 120),
    patologias: cleanBlock(formData.get("patologias"), 2000),
    medicacion: cleanBlock(formData.get("medicacion"), 2000),
    alergias: cleanBlock(formData.get("alergias"), 2000),
    suplementos: cleanBlock(formData.get("suplementos"), 2000),
    comidas: comidas ?? "",
    horarios: cleanBlock(formData.get("horarios"), 2000),
    alimentos_gustan: cleanBlock(formData.get("alimentosGustan"), 2000),
    alimentos_no: cleanBlock(formData.get("alimentosNo"), 2000),
    restricciones: cleanBlock(formData.get("restricciones"), 2000),
    agua: cleanText(formData.get("agua"), 80),
    alcohol: alcohol ?? "",
    sueno: cleanText(formData.get("sueno"), 80),
    digestiones: digestiones ?? "",
    observaciones: cleanBlock(formData.get("observaciones"), 2000),
  };

  const text = [
    "Cuestionario inicial de Nerea Studio",
    "",
    line("Nombre", answers.nombre),
    line("Correo", answers.correo),
    line("Edad", answers.edad),
    line("Sexo", answers.sexo),
    line("Altura (cm)", answers.altura_cm),
    line("Peso actual (kg)", answers.peso_kg),
    line("Peso objetivo (kg)", answers.peso_objetivo_kg),
    line("Objetivo", answers.objetivo),
    line("Actividad diaria", answers.actividad),
    line("Tipo de trabajo", answers.trabajo),
    line("Entrenamiento", answers.entrenamiento),
    line("Días de entreno", answers.frecuencia),
    line("Horario de entreno", answers.horario),
    line("Patologías", answers.patologias),
    line("Medicación", answers.medicacion),
    line("Alergias o intolerancias", answers.alergias),
    line("Suplementos", answers.suplementos),
    line("Comidas al día", answers.comidas),
    line("Horarios de comidas", answers.horarios),
    line("Alimentos que le gustan", answers.alimentos_gustan),
    line("Alimentos que no quiere", answers.alimentos_no),
    line("Tipo de alimentación", answers.restricciones),
    line("Agua", answers.agua),
    line("Alcohol", answers.alcohol),
    line("Sueño", answers.sueno),
    line("Digestiones", answers.digestiones),
    line("Observaciones", answers.observaciones),
  ].join("\n");

  const admin = createAdminClient();
  let stored = false;
  if (admin) {
    const { error } = await admin.from("nutrition_questionnaires").insert(answers);
    stored = !error;
  }

  const sent = await deliver(`Cuestionario de ${nombre}`, text, correo);
  if (!sent && !stored) {
    return { error: "No se ha podido enviar el cuestionario. Inténtalo de nuevo en unos minutos." };
  }

  return { notice: "Hemos recibido tu cuestionario. Nerea lo revisará para preparar tu plan." };
}
