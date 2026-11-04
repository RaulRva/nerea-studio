import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getMeasurements } from "@/lib/data";
import { FichaForm } from "@/components/ficha-form";
import { FichaHistory } from "@/components/ficha-history";
import { Notice } from "@/components/notice";

export const metadata: Metadata = { title: "Ficha corporal" };

async function FichaView({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  await connection();
  const profile = await requireUser();
  if (profile.role === "admin") redirect("/estudio");
  const params = await searchParams;
  const measurements = await getMeasurements(profile.id);
  const first = measurements.length === 0;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Ficha corporal</p>
          <h1 className="page-title">{first ? "Cuéntale a Nerea cómo estás." : "Tus medidas"}</h1>
        </div>
      </header>
      <Notice code={params.aviso} />
      {first ? (
        <p className="lede">Peso, altura y perímetros. Con esto puede ajustar la dieta y el entreno.</p>
      ) : null}
      <FichaHistory measurements={measurements} returnTo="/ficha" />
      <section className="measure-card">
        <h2>{first ? "Tu ficha" : "Nueva medición"}</h2>
        <FichaForm returnTo="/hoy" submitLabel={first ? "Guardar ficha" : "Registrar medición"} />
      </section>
    </>
  );
}

export default function FichaPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  return (
    <Suspense fallback={<p className="muted">Cargando la ficha…</p>}>
      <FichaView searchParams={searchParams} />
    </Suspense>
  );
}
