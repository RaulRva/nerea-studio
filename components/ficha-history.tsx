import { deleteMeasurement } from "@/app/actions/plans";
import { ConfirmForm } from "@/components/confirm-form";
import { formatDate, formatDelta, formatNumber } from "@/lib/format";
import type { Measurement } from "@/lib/types";

const ROWS: { key: keyof Measurement; label: string; unit: string; digits: number }[] = [
  { key: "weightKg", label: "Peso", unit: "kg", digits: 2 },
  { key: "heightCm", label: "Altura", unit: "cm", digits: 1 },
  { key: "chestCm", label: "Pecho", unit: "cm", digits: 1 },
  { key: "armCm", label: "Brazo", unit: "cm", digits: 1 },
  { key: "waistCm", label: "Cintura", unit: "cm", digits: 1 },
  { key: "hipCm", label: "Cadera", unit: "cm", digits: 1 },
  { key: "thighCm", label: "Muslo", unit: "cm", digits: 1 },
];

export function FichaHistory({
  measurements,
  returnTo,
}: {
  measurements: Measurement[];
  returnTo: string;
}) {
  if (measurements.length === 0) return null;
  const previous = measurements[1];

  return (
    <div className="measure-list">
      {measurements.map((item, index) => (
        <article key={item.id} className="measure-card">
          <div className="measure-top">
            <div>
              <time dateTime={item.recordedAt}>{formatDate(item.recordedAt)}</time>
              {index === 0 && previous ? (
                <p className="delta">Peso {formatDelta(item.weightKg, previous.weightKg)} kg respecto a la anterior</p>
              ) : null}
            </div>
            <ConfirmForm action={deleteMeasurement} message="¿Borrar esta medición?">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button className="btn-quiet" type="submit">
                Borrar
              </button>
            </ConfirmForm>
          </div>
          <dl>
            {ROWS.map((row) => (
              <div key={row.key}>
                <dt className="muted">{row.label}</dt>
                <dd>
                  {formatNumber(item[row.key] as number, row.digits)} {row.unit}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
