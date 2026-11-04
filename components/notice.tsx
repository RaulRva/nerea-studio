const AVISOS: Record<string, string> = {
  titulo: "Escribe un nombre para poder guardarlo.",
  datos: "Revisa los datos. Hay algún valor que no encaja.",
  copia: "No se ha podido copiar el día.",
  mismo: "Elige un día distinto.",
  vacio: "Ese día todavía no tiene nada que copiar.",
  copiado: "Día copiado.",
  foto: "La foto tiene que ser JPG, PNG o WebP y pesar menos de 4 MB.",
};

export function Notice({ code }: { code?: string }) {
  const message = code ? AVISOS[code] : undefined;
  if (!message) return null;
  const ok = code === "copiado";
  return (
    <p className={ok ? "form-notice" : "form-error"} role={ok ? "status" : "alert"}>
      {message}
    </p>
  );
}
