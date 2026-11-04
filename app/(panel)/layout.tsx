import { Suspense } from "react";
import { connection } from "next/server";
import { hasMeasurement, getProfile } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { PanelNav } from "@/components/panel-nav";
import { Wordmark } from "@/components/wordmark";
import { isStaffEmail } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

async function PanelShell({ children }: { children: React.ReactNode }) {
  await connection();
  const profile = await getProfile();
  if (!profile) redirect("/entrar");
  const needsFicha = profile.role === "client" && !(await hasMeasurement(profile.id));
  const staffLocked = isStaffEmail(profile.email) && profile.role !== "admin";

  return (
    <div className="shell">
      <PanelNav role={profile.role} name={profile.fullName} needsFicha={needsFicha} />
      <div className="shell-main">
        <header className="topbar">
          <Wordmark href={profile.role === "admin" ? "/estudio" : "/hoy"} />
          <form action={signOut}>
            <button className="btn btn-ghost" type="submit">
              Cerrar sesión
            </button>
          </form>
        </header>
        <div className="shell-content">
          {staffLocked ? (
            <p className="banner banner-warn">
              Este correo está marcado como el de Nerea, pero el panel de clientes no se ha activado. Revisa
              SUPABASE_SECRET_KEY en el servidor y vuelve a entrar.
            </p>
          ) : null}
          {needsFicha ? (
            <p className="banner">Completa la ficha corporal para ver la dieta y los entrenos.</p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="shell-fallback">
          <div>
            <p className="kicker">Nerea Studio</p>
            <p>Abriendo tu panel…</p>
          </div>
        </div>
      }
    >
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}
