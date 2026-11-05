const AVISOS: Record<string, string> = {
  titulo: "Escribe un nombre para poder guardarlo.",
  datos: "Revisa los datos. Hay algún valor que no encaja.",
  copia: "No se ha podido copiar el día.",
  mismo: "Elige un día distinto.",
  vacio: "Ese día todavía no tiene nada que copiar.",
  copiado: "Día copiado.",
  foto: "La foto tiene que ser JPG, PNG o WebP y pesar menos de 4 MB.",
  excel: "Sube un Excel .xlsx de menos de 2 MB, hecho con la plantilla.",
  cabecera: "La primera fila tiene que llevar Día, Comida y Título.",
  sinfilas: "La plantilla no tiene ninguna comida.",
  tope: "La plantilla admite como máximo 200 comidas.",
  importado: "Dieta de la semana cargada.",
};

export function Notice({ code }: { code?: string }) {
  const row = code?.startsWith("fila-") ? Number(code.slice(5)) : 0;
  const message = row
    ? `Revisa la fila ${row}. Día, comida y título tienen que estar rellenos.`
    : code
      ? AVISOS[code]
      : undefined;
  if (!message) return null;
  const ok = code === "copiado" || code === "importado";
  return (
    <p className={ok ? "form-notice" : "form-error"} role={ok ? "status" : "alert"}>
      {message}
    </p>
  );
}
