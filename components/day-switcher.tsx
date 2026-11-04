import Link from "next/link";
import { DAYS } from "@/lib/constants";

export function DaySwitcher({
  basePath,
  day,
  extra,
}: {
  basePath: string;
  day: number;
  extra?: Record<string, string>;
}) {
  return (
    <nav className="day-switch" aria-label="Día de la semana">
      {DAYS.map((item) => {
        const params = new URLSearchParams({ dia: String(item.id), ...extra });
        const active = item.id === day;
        return (
          <Link
            key={item.id}
            href={`${basePath}?${params.toString()}`}
            prefetch
            scroll={false}
            className={active ? "day-chip is-active" : "day-chip"}
            aria-current={active ? "page" : undefined}
          >
            <span className="day-short">{item.short}</span>
            <span className="day-long">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
