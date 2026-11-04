import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell-fallback">
      <div>
        <p className="kicker">Nerea Studio</p>
        <h1 className="page-title">Esta página no está.</h1>
        <p>
          <Link href="/">Volver al inicio</Link>
        </p>
      </div>
    </main>
  );
}
