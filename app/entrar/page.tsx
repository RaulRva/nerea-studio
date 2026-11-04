import { Suspense } from "react";
import Link from "next/link";
import { AuthScreen } from "@/components/auth-screen";
import { LoginForm } from "@/components/auth-forms";
import { safePath } from "@/lib/validation";

async function LoginScreen({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safePath(params.next);
  const initialError = params.error === "enlace" ? "El enlace ha caducado o no es válido." : undefined;

  return (
    <AuthScreen
      kicker="Entrar"
      title="Tu plan te espera."
      lead="Entra para ver la dieta del día y los pesos de cada ejercicio."
      alternate={
        <p>
          ¿Aún no tienes cuenta? <Link href="/registro">Regístrate</Link>
        </p>
      }
    >
      <LoginForm next={next || undefined} initialError={initialError} />
    </AuthScreen>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <AuthScreen kicker="Entrar" title="Tu plan te espera." lead="Cargando…">
          <p className="muted">Un momento.</p>
        </AuthScreen>
      }
    >
      <LoginScreen searchParams={searchParams} />
    </Suspense>
  );
}
