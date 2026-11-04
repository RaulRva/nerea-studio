import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dayLabel } from "@/lib/constants";
import { getClientStudio, getMealsFor, getWorkout } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { parseDay, parseSection, parseUuid } from "@/lib/validation";
import { DaySwitcher } from "@/components/day-switcher";
import { FichaForm } from "@/components/ficha-form";
import { FichaHistory } from "@/components/ficha-history";
import { Notice } from "@/components/notice";
import { MealEditor, WorkoutEditor } from "@/components/studio-editors";

export const metadata: Metadata = { title: "Cliente" };

async function ClientStudio({
  params,
  searchParams,
}: {
  params: Promise<{ clienteId: string }>;
  searchParams: Promise<{ dia?: string; seccion?: string; aviso?: string }>;
}) {
  const [{ clienteId }, query] = await Promise.all([params, searchParams]);
  await connection();
  const id = parseUuid(clienteId);
  if (!id) notFound();

  const client = await getClientStudio(id);
  if (!client) notFound();

  const day = parseDay(query.dia);
  const section = parseSection(query.seccion);
  const [meals, workout] = await Promise.all([
    section === "dieta" ? getMealsFor(client.id, day) : Promise.resolve([]),
    section === "entreno" ? getWorkout(client.id, day) : Promise.resolve(null),
  ]);
  const latest = client.measurements[0];
  const returnTo = `/estudio/${client.id}?seccion=ficha&dia=${day}`;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">
            <Link href="/estudio">Clientes</Link>
          </p>
          <h1 className="page-title">{client.fullName || "Sin nombre"}</h1>
          <p>{client.email}</p>
        </div>
      </header>
      <Notice code={query.aviso} />
      {latest ? (
        <dl className="stat-row">
          <div>
            <dt>Peso</dt>
            <dd>{formatNumber(latest.weightKg, 2)} kg</dd>
          </div>
          <div>
            <dt>Cintura</dt>
            <dd>{formatNumber(latest.waistCm)} cm</dd>
          </div>
          <div>
            <dt>Cadera</dt>
            <dd>{formatNumber(latest.hipCm)} cm</dd>
          </div>
          <div>
            <dt>Ficha</dt>
            <dd style={{ fontSize: "1.1rem" }}>{formatDate(latest.recordedAt)}</dd>
          </div>
        </dl>
      ) : (
        <p className="banner">Todavía no ha rellenado la ficha corporal.</p>
      )}
      <nav className="section-tabs" aria-label="Plan del cliente">
        {(
          [
            ["dieta", "Dieta"],
            ["entreno", "Entreno"],
            ["ficha", "Ficha"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={`/estudio/${client.id}?seccion=${value}&dia=${day}`}
            aria-current={section === value ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {section !== "ficha" ? <DaySwitcher basePath={`/estudio/${client.id}`} day={day} extra={{ seccion: section }} /> : null}
      {section === "dieta" ? (
        <>
          <h2 className="page-kicker">{dayLabel(day)}</h2>
          <MealEditor clientId={client.id} day={day} meals={meals} />
        </>
      ) : null}
      {section === "entreno" ? (
        <>
          <h2 className="page-kicker">{dayLabel(day)}</h2>
          <WorkoutEditor clientId={client.id} day={day} workout={workout} />
        </>
      ) : null}
      {section === "ficha" ? (
        <>
          <FichaHistory measurements={client.measurements} returnTo={returnTo} />
          <section className="measure-card">
            <h2>Nueva medición</h2>
            <p className="muted">Úsala cuando tomes las medidas en consulta.</p>
            <FichaForm clientId={client.id} returnTo={returnTo} submitLabel="Guardar medición" />
          </section>
        </>
      ) : null}
    </>
  );
}

export default function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ clienteId: string }>;
  searchParams: Promise<{ dia?: string; seccion?: string; aviso?: string }>;
}) {
  return (
    <Suspense fallback={<p className="muted">Abriendo el cliente…</p>}>
      <ClientStudio params={params} searchParams={searchParams} />
    </Suspense>
  );
}
