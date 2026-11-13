import { formatDate, formatDelta, formatNumber } from "@/lib/format";
import { MEASURE_ROWS, measureValue } from "@/lib/measures";
import type { Measurement } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 168;

function chartGeometry(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const padX = 18;
  const padY = 22;
  const points = values.map((value, index) => {
    const x =
      values.length === 1 ? WIDTH / 2 : padX + (index / (values.length - 1)) * (WIDTH - padX * 2);
    const ratio = span === 0 ? 0.5 : (value - min) / span;
    const y = padY + (1 - ratio) * (HEIGHT - padY * 2);
    return { x, y };
  });

  let line = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const mid = (current.x + next.x) / 2;
    line += ` C ${mid} ${current.y}, ${mid} ${next.y}, ${next.x} ${next.y}`;
  }
  const area = `${line} L ${points[points.length - 1].x} ${HEIGHT - 8} L ${points[0].x} ${HEIGHT - 8} Z`;
  return { points, line, area };
}

function MeasureChart({
  label,
  unit,
  digits,
  values,
  dates,
  featured,
}: {
  label: string;
  unit: string;
  digits: number;
  values: number[];
  dates: string[];
  featured: boolean;
}) {
  const latest = values[values.length - 1];
  const first = values[0];
  const delta = values.length > 1 ? formatDelta(latest, first) : null;
  const { points, line, area } = chartGeometry(values);
  const summary = values
    .map((value, index) => `${formatNumber(value, digits)} ${unit} el ${formatDate(dates[index])}`)
    .join(", ");

  return (
    <article className={featured ? "featured" : undefined}>
      <div className="evolution-top">
        <div>
          <p className="muted">{label}</p>
          <strong>
            {formatNumber(latest, digits)} {unit}
          </strong>
        </div>
        {delta ? (
          <p className="delta">{delta === "sin cambio" ? "Igual que al principio" : `${delta} ${unit}`}</p>
        ) : null}
      </div>
      <svg className="evolution-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${label}: ${summary}`}>
        <path d={area} fill="currentColor" opacity="0.08" />
        {points.length > 1 ? (
          <path d={line} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        ) : null}
        {points.map((point, index) => {
          const last = index === points.length - 1;
          return (
            <circle
              key={`${dates[index]}-${index}`}
              cx={point.x}
              cy={point.y}
              r={last ? 7 : 4.5}
              fill={last ? "currentColor" : "var(--color-cream)"}
              stroke="currentColor"
              strokeWidth="2.5"
            />
          );
        })}
      </svg>
      <div className="evolution-dates">
        <span>{formatDate(dates[0])}</span>
        {dates.length > 1 ? <span>{formatDate(dates[dates.length - 1])}</span> : <span>Primera medición</span>}
      </div>
    </article>
  );
}

export function FichaEvolution({ measurements }: { measurements: Measurement[] }) {
  if (measurements.length === 0) return null;
  const history = [...measurements].reverse();
  const dates = history.map((item) => item.recordedAt);

  return (
    <section className="evolution" aria-labelledby="evolucion">
      <h2 id="evolucion">Desde la primera medición</h2>
      <p className="muted">
        {history.length > 1
          ? "Cada línea recorre todas las mediciones, de la primera a la última."
          : "La siguiente medición dibujará el cambio."}
      </p>
      <div className="evolution-grid">
        {MEASURE_ROWS.map((row) => (
          <MeasureChart
            key={row.key}
            label={row.label}
            unit={row.unit}
            digits={row.digits}
            values={history.map((item) => measureValue(item, row.key))}
            dates={dates}
            featured={row.key === "weightKg" || row.key === "waistCm"}
          />
        ))}
      </div>
    </section>
  );
}
