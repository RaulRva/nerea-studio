import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { IntakeForm } from "@/components/intake-form";

export const metadata: Metadata = { title: "Cuestionario" };

export default function CuestionarioPage() {
  return (
    <>
      <SiteHeader />
      <main className="intake">
        <p className="kicker">Cuestionario inicial</p>
        <h1>Cuéntale a Nerea cómo comes y cómo entrenas.</h1>
        <p className="lede">
          No hace falta crear una cuenta. Las respuestas se usan solo para preparar tu plan.
        </p>
        <IntakeForm />
      </main>
      <footer className="site-footer">Fuerza · Equilibrio · Evolución</footer>
    </>
  );
}
