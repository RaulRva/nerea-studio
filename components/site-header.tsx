import { Suspense } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { getProfile } from "@/lib/auth";
import { Wordmark } from "@/components/wordmark";

function GuestLinks() {
  return (
    <>
      <Link href="/entrar" className="btn btn-ghost">
        Entrar
      </Link>
      <Link href="/registro" className="btn btn-primary">
        Crear cuenta
      </Link>
    </>
  );
}

async function AccountLinks() {
  const profile = await getProfile();
  if (!profile) return <GuestLinks />;
  return (
    <>
      <form action={signOut}>
        <button className="btn btn-ghost" type="submit">
          Cerrar sesión
        </button>
      </form>
      <Link href={profile.role === "admin" ? "/estudio" : "/hoy"} className="btn btn-primary">
        Mi panel
      </Link>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <Wordmark variant="full" />
      <div className="header-actions">
        <Suspense fallback={<GuestLinks />}>
          <AccountLinks />
        </Suspense>
      </div>
    </header>
  );
}
