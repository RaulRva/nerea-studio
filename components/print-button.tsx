"use client";

export function PrintButton({
  label = "Imprimir",
  mode = "dieta",
}: {
  label?: string;
  mode?: "dieta" | "lista";
}) {
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => {
        document.body.dataset.print = mode;
        const clear = () => {
          delete document.body.dataset.print;
          window.removeEventListener("afterprint", clear);
        };
        window.addEventListener("afterprint", clear);
        window.print();
      }}
    >
      {label}
    </button>
  );
}
