import { deleteMeasurement } from "@/app/actions/plans";
import { ConfirmForm } from "@/components/confirm-form";
import { formatDate, formatDelta, formatNumber } from "@/lib/format";
import { MEASURE_ROWS, measureValue } from "@/lib/measures";
import type { Measurement } from "@/lib/types";

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
          {item.photoUrls.length > 0 ? (
            <div className="measure-photos">
              {item.photoUrls.map((url, photoIndex) => (
                <img
                  key={url}
                  className="plan-photo"
                  src={url}
                  alt={`Foto ${photoIndex + 1} de la medición del ${formatDate(item.recordedAt)}`}
                />
              ))}
            </div>
          ) : null}
          <dl>
            {MEASURE_ROWS.map((row) => (
              <div key={row.key}>
                <dt className="muted">{row.label}</dt>
                <dd>
                  {formatNumber(measureValue(item, row.key), row.digits)} {row.unit}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
