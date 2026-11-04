import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { dayLabel } from "@/lib/constants";
import { getMyDay } from "@/lib/data";
import { greeting, longDate, madridIsoWeekday } from "@/lib/format";
import { ExerciseBoard } from "@/components/exercise-board";
import { MealBoard } from "@/components/meal-board";

export const metadata: Metadata = { title: "Hoy" };

async function Today() {
  await connection();
  const day = madridIsoWeekday();
  const { profile, meals, workout } = await getMyDay(day);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">{longDate()}</p>
          <h1 className="page-title">{greeting(profile.fullName)}</h1>
        </div>
        <p className="muted">{dayLabel(day)}</p>
      </header>
      <div className="today-grid">
        <section>
          <div className="page-head">
            <h2>Dieta de hoy</h2>
            <Link href={`/dieta?dia=${day}`}>Ver la semana</Link>
          </div>
          {meals.length === 0 ? (
            <p className="empty-state">Nerea todavía no ha publicado las comidas de hoy.</p>
          ) : (
            <MealBoard meals={meals} />
          )}
        </section>
        <section>
          <div className="page-head">
            <h2>Entreno de hoy</h2>
            <Link href={`/entreno?dia=${day}`}>Ver la semana</Link>
          </div>
          <ExerciseBoard workout={workout} />
        </section>
      </div>
    </>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<p className="muted">Cargando el día…</p>}>
      <Today />
    </Suspense>
  );
}
