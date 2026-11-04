import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/components/auth-screen";
import { RecoverForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPage() {
  return (
    <AuthScreen
      kicker="Contraseña"
      title="Te mandamos un enlace."
      lead="Escribe el correo de tu cuenta y elige una contraseña nueva desde el mensaje."
      alternate={
        <p>
          <Link href="/entrar">Volver a entrar</Link>
        </p>
      }
    >
      <RecoverForm />
    </AuthScreen>
  );
}
