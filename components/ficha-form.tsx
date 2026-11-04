"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { saveMeasurement } from "@/app/actions/plans";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/lib/types";

const FIELDS = [
  { name: "weight_kg", label: "Peso", unit: "kg" },
  { name: "height_cm", label: "Altura", unit: "cm" },
  { name: "chest_cm", label: "Pecho", unit: "cm" },
  { name: "arm_cm", label: "Brazo", unit: "cm" },
  { name: "waist_cm", label: "Cintura", unit: "cm" },
  { name: "hip_cm", label: "Cadera", unit: "cm" },
  { name: "thigh_cm", label: "Muslo", unit: "cm" },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];

export function FichaForm({
  clientId,
  returnTo,
  submitLabel,
}: {
  clientId?: string;
  returnTo: string;
  submitLabel: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveMeasurement, {});
  const [photoLabel, setPhotoLabel] = useState("Ninguna foto seleccionada");
  const [values, setValues] = useState<Record<FieldName, string>>({
    weight_kg: "",
    height_cm: "",
    chest_cm: "",
    arm_cm: "",
    waist_cm: "",
    hip_cm: "",
    thigh_cm: "",
  });

  return (
    <form action={action}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="measure-grid">
        {FIELDS.map((field) => (
          <label className="field" key={field.name}>
            <span>{field.label}</span>
            <span className="unit">
              <input
                name={field.name}
                inputMode="decimal"
                autoComplete="off"
                required
                step="0.1"
                aria-label={`${field.label} en ${field.unit}`}
                value={values[field.name]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.name]: event.target.value }))
                }
              />
              <em>{field.unit}</em>
            </span>
          </label>
        ))}
      </div>
      <label className="field">
        <span>Fotos</span>
        <input
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const input = event.currentTarget;
            const selected = [...(input.files ?? [])];
            const kept = selected.slice(0, 3);
            if (selected.length > 3) {
              const transfer = new DataTransfer();
              kept.forEach((file) => transfer.items.add(file));
              input.files = transfer.files;
            }
            setPhotoLabel(
              kept.length === 0
                ? "Ninguna foto seleccionada"
                : selected.length > 3
                  ? `${kept.map((file) => file.name).join(", ")}. Solo se guardan las 3 primeras.`
                  : kept.map((file) => file.name).join(", "),
            );
          }}
        />
        <span className="muted">{photoLabel}. Hasta 3 fotos JPG, PNG o WebP, de menos de 4 MB.</span>
      </label>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
