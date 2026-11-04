import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { dayLabel } from "@/lib/constants";
import { getMyDay } from "@/lib/data";
import { parseDay } from "@/lib/validation";
import { DaySwitcher } from "@/components/day-switcher";
import { ExerciseBoard } from "@/components/exercise-board";

export const metadata: Metadata = { title: "Entreno" };

async function WorkoutView({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const params = await searchParams;
  await connection();
  const day = parseDay(params.dia);
  const { workout } = await getMyDay(day);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Entreno</p>
          <h1 className="page-title">{dayLabel(day)}</h1>
        </div>
      </header>
      <DaySwitcher basePath="/entreno" day={day} />
      <ExerciseBoard workout={workout} />
    </>
  );
}

export default function WorkoutPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  return (
    <Suspense fallback={<p className="muted">Cargando el entreno…</p>}>
      <WorkoutView searchParams={searchParams} />
    </Suspense>
  );
}
