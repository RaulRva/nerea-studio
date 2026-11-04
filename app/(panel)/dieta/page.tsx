import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { dayLabel } from "@/lib/constants";
import { getMyDay } from "@/lib/data";
import { parseDay } from "@/lib/validation";
import { DaySwitcher } from "@/components/day-switcher";
import { MealBoard } from "@/components/meal-board";

export const metadata: Metadata = { title: "Dieta" };

async function DietView({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const params = await searchParams;
  await connection();
  const day = parseDay(params.dia);
  const { meals } = await getMyDay(day);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Dieta</p>
          <h1 className="page-title">{dayLabel(day)}</h1>
        </div>
      </header>
      <DaySwitcher basePath="/dieta" day={day} />
      {meals.length === 0 ? (
        <p className="empty-state">Este día todavía no tiene comidas.</p>
      ) : (
        <MealBoard meals={meals} />
      )}
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
