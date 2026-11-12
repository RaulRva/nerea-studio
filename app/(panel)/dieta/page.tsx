import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { dayLabel } from "@/lib/constants";
import { getMealsWeek, getMyDay } from "@/lib/data";
import { parseDay } from "@/lib/validation";
import { DaySwitcher } from "@/components/day-switcher";
import { DietSheet } from "@/components/diet-sheet";
import { MealBoard } from "@/components/meal-board";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Dieta" };

async function DietView({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const params = await searchParams;
  await connection();
  const day = parseDay(params.dia);
  const { profile, meals } = await getMyDay(day);
  const week = await getMealsWeek(profile.id);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Dieta</p>
          <h1 className="page-title">{dayLabel(day)}</h1>
        </div>
        <PrintButton />
      </header>
      <div className="diet-screen">
        <DaySwitcher basePath="/dieta" day={day} />
        {meals.length === 0 ? (
          <p className="empty-state">Este día todavía no tiene comidas.</p>
        ) : (
          <MealBoard meals={meals} />
        )}
      </div>
      <DietSheet title={`Dieta de ${profile.fullName || "la semana"}`} meals={week} />
    </>
  );
}

export default function DietPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  return (
    <Suspense fallback={<p className="muted">Cargando la dieta…</p>}>
      <DietView searchParams={searchParams} />
    </Suspense>
  );
}
