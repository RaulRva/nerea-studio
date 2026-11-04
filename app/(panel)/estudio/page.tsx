import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listClients } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { formString } from "@/lib/validation";
import { Notice } from "@/components/notice";

export const metadata: Metadata = { title: "Clientes" };

async function Directory({ searchParams }: { searchParams: Promise<{ q?: string; aviso?: string }> }) {
  const params = await searchParams;
  const q = formString(params.q ?? null).trim();
  const clients = await listClients(q);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Estudio</p>
          <h1 className="page-title">Clientes</h1>
        </div>
        <p className="muted">{clients.length === 1 ? "1 persona" : `${clients.length} personas`}</p>
      </header>
      <Notice code={params.aviso} />
      <form className="search" action="/estudio">
        <label className="field">
          <span>Buscar</span>
          <input name="q" defaultValue={q} placeholder="Nombre o correo" />
        </label>
        <button className="btn btn-ghost" type="submit">
          Buscar
        </button>
      </form>
      {clients.length === 0 ? (
        <p className="empty-state">
          {q ? "Nadie coincide con esa búsqueda." : "Cuando alguien se registre, aparecerá aquí."}
        </p>
      ) : (
        <div className="client-list">
          {clients.map((client) => (
            <Link key={client.id} href={`/estudio/${client.id}`} className="client-card">
              <div>
                <h2>{client.fullName || "Sin nombre"}</h2>
                <p>{client.email}</p>
              </div>
              <div>
                <p className="muted">Peso</p>
                <strong>{client.latest ? `${formatNumber(client.latest.weightKg, 2)} kg` : "Sin ficha"}</strong>
              </div>
              <small>
                {client.latest
                  ? `Ficha ${formatDate(client.latest.recordedAt)}`
                  : `Alta ${formatDate(client.createdAt)}`}
              </small>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; aviso?: string }>;
}) {
  return (
    <Suspense fallback={<p className="muted">Cargando clientes…</p>}>
      <Directory searchParams={searchParams} />
    </Suspense>
  );
}
