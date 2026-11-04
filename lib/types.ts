import type { MealSlot } from "@/lib/constants";

export type Role = "admin" | "client";

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

export type ActionState = {
  error?: string;
  notice?: string;
};

export type Meal = {
  id: string;
  day: number;
  slot: MealSlot;
  title: string;
  detail: string;
  sortOrder: number;
  photoUrl: string | null;
};

export type Exercise = {
  id: string;
  name: string;
  sets: number | null;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
  notes: string;
  sortOrder: number;
  photoUrl: string | null;
};

export type WorkoutDay = {
  id: string;
  day: number;
  title: string;
  notes: string;
  exercises: Exercise[];
};

export type Measurement = {
  id: string;
  weightKg: number;
  heightCm: number;
  chestCm: number;
  armCm: number;
  waistCm: number;
  hipCm: number;
  thighCm: number;
  recordedAt: string;
};

export type ClientSummary = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  latest: {
    weightKg: number;
    waistCm: number;
    recordedAt: string;
  } | null;
};
