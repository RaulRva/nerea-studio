"use client";

export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="empty-state">
      <h1 className="page-title">No se ha podido cargar</h1>
      <p>Prueba otra vez. Si sigue igual, revisa la conexión con Supabase.</p>
      <button className="btn btn-primary" type="button" onClick={() => reset()}>
        Reintentar
      </button>
    </div>
  );
}
