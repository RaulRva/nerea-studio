import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getProfile } from "@/lib/auth";
import { AuthScreen } from "@/components/auth-screen";
import { ResetForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Nueva contraseña" };

async function ResetGate() {
  await connection();
  const profile = await getProfile();
  return (
    <AuthScreen
      kicker="Contraseña"
      title="Elige una nueva."
      lead={profile ? "A partir de ahora entrarás con esta contraseña." : "Abre otra vez el enlace del correo."}
    >
      {profile ? <ResetForm /> : <p className="form-error">El enlace no es válido o ha caducado.</p>}
    </AuthScreen>
  );
}

export default function ResetPage() {
  return (
    <Suspense
      fallback={
        <AuthScreen kicker="Contraseña" title="Elige una nueva." lead="Cargando…">
          <p className="muted">Un momento.</p>
        </AuthScreen>
      }
    >
      <ResetGate />
    </Suspense>
  );
}
