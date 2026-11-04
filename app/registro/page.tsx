import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/components/auth-screen";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <AuthScreen
      kicker="Registro"
      title="Empieza por tu ficha."
      lead="Creas la cuenta y, en el siguiente paso, dejas peso, altura y perímetros. Nerea los usa para montar el plan."
      alternate={
        <p>
          ¿Ya estás dentro? <Link href="/entrar">Entra</Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthScreen>
  );
}
