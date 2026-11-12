import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { requirePlanAccess } from "@/lib/auth";
import { getHabits } from "@/lib/data";
import { ExerciseBoard } from "@/components/exercise-board";

export const metadata: Metadata = { title: "Hábitos saludables" };

async function WorkoutView() {
  await connection();
  await requirePlanAccess();
  const workout = await getHabits();

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Para todos</p>
          <h1 className="page-title">Hábitos saludables</h1>
        </div>
      </header>
      <ExerciseBoard workout={workout} />
    </>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<p className="muted">Cargando los hábitos…</p>}>
      <WorkoutView />
    </Suspense>
  );
}
