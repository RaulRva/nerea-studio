import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { dayLabel } from "@/lib/constants";
import { getClientStudio, getMealsFor, getMealsWeek } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { parseDay, parseSection, parseUuid } from "@/lib/validation";
import { DaySwitcher } from "@/components/day-switcher";
import { FichaForm } from "@/components/ficha-form";
import { FichaHistory } from "@/components/ficha-history";
import { Notice } from "@/components/notice";
import { DietSheet } from "@/components/diet-sheet";
import { FichaEvolution } from "@/components/ficha-evolution";
import { PrintButton } from "@/components/print-button";
import { ShoppingList } from "@/components/shopping-list";
import { MealEditor } from "@/components/studio-editors";

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
  if (section === "entreno") redirect("/estudio/habitos");
  const meals = section === "dieta" ? await getMealsFor(client.id, day) : [];
  const week = section === "dieta" || section === "compra" ? await getMealsWeek(client.id) : [];
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
            ["compra", "Compra"],
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
      {section === "dieta" ? (
        <div className="diet-screen">
          <div className="page-head">
            <h2 className="page-kicker">{dayLabel(day)}</h2>
            <PrintButton />
          </div>
          <DaySwitcher basePath={`/estudio/${client.id}`} day={day} extra={{ seccion: section }} />
          <MealEditor clientId={client.id} day={day} meals={meals} />
        </div>
      ) : null}
      {section === "dieta" ? <DietSheet title={`Dieta de ${client.fullName || "cliente"}`} meals={week} /> : null}
      {section === "compra" ? (
        <ShoppingList title={`Lista de la compra de ${client.fullName || "cliente"}`} meals={week} />
      ) : null}
      {section === "ficha" ? (
        <>
          <FichaEvolution measurements={client.measurements} />
          <FichaHistory measurements={client.measurements} returnTo={returnTo} />
          <section className="measure-card">
            <h2>Nueva medición</h2>
            <p className="muted">Se añade al historial. Las mediciones anteriores se quedan.</p>
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
