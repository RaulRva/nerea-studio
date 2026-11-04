import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div>
            <p className="kicker">Nutrición y entrenamiento</p>
            <h1>
              El plan de cada día, <em>escrito para ti.</em>
            </h1>
            <p className="lede">
              Nerea prepara tu dieta por comidas y tus sesiones con los pesos. Tú abres el día y sabes qué toca.
            </p>
            <div className="hero-actions">
              <Link href="/registro" className="btn btn-primary">
                Crear mi cuenta
              </Link>
              <Link href="/entrar" className="btn btn-ghost">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
          <article className="preview" aria-label="Ejemplo de un plan">
            <header>
              <strong>Lunes</strong>
              <span>Ejemplo</span>
            </header>
            <ol>
              <li>
                <small>Desayuno</small>
                <strong>Yogur griego y avena</strong>
                <p className="muted">150 g · 40 g · arándanos</p>
              </li>
              <li>
                <small>Comida</small>
                <strong>Salmón, arroz y verdura</strong>
                <p className="muted">140 g · 70 g en crudo</p>
              </li>
            </ol>
            <div className="preview-set">
              <div>
                <small>Sentadilla</small>
                <strong>4 series · 8 reps</strong>
              </div>
              <b>60 kg</b>
            </div>
          </article>
        </section>
        <section className="steps-wrap" aria-labelledby="como">
          <div className="steps">
            <article>
              <strong>01</strong>
              <h2 id="como">Dejas tu ficha</h2>
              <p>Al registrarte anotas peso, altura, pecho, brazo, cintura, cadera y muslo.</p>
            </article>
            <article>
              <strong>02</strong>
              <h2>Nerea escribe el plan</h2>
              <p>Comidas por día, de desayuno a cena, y cada ejercicio con sus series y su peso.</p>
            </article>
            <article>
              <strong>03</strong>
              <h2>Tú solo lo sigues</h2>
              <p>El panel abre en el día de hoy. La semana entera está a un toque.</p>
            </article>
          </div>
        </section>
      </main>
      <footer className="site-footer">Fuerza · Equilibrio · Evolución</footer>
    </>
  );
}
