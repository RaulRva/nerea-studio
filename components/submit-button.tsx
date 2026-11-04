"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <button className={variant === "ghost" ? "btn btn-ghost" : "btn btn-primary"} type="submit" disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
