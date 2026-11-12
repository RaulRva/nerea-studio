import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getHabits } from "@/lib/data";
import { Notice } from "@/components/notice";
import { WorkoutEditor } from "@/components/studio-editors";

export const metadata: Metadata = { title: "Hábitos saludables" };

async function HabitsStudio({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const params = await searchParams;
  await connection();
  await requireAdmin();
  const workout = await getHabits();

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Estudio</p>
          <h1 className="page-title">Hábitos saludables</h1>
          <p>Los ven todos los clientes.</p>
        </div>
      </header>
      <Notice code={params.aviso} />
      <WorkoutEditor workout={workout} />
    </>
  );
}

export default function HabitsPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  return (
    <Suspense fallback={<p className="muted">Cargando los hábitos…</p>}>
      <HabitsStudio searchParams={searchParams} />
    </Suspense>
  );
}
