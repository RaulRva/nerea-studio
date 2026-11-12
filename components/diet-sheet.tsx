import { DAYS, MEAL_SLOTS } from "@/lib/constants";
import type { Meal } from "@/lib/types";

export function DietSheet({ title, meals }: { title: string; meals: Meal[] }) {
  return (
    <section className="diet-sheet" aria-hidden="true">
      <h1>{title}</h1>
      <table>
        <thead>
          <tr>
            <th>Comida</th>
            {DAYS.map((day) => (
              <th key={day.id}>{day.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MEAL_SLOTS.map((slot) => (
            <tr key={slot.id}>
              <th>{slot.label}</th>
              {DAYS.map((day) => {
                const items = meals.filter((meal) => meal.day === day.id && meal.slot === slot.id);
                return (
                  <td key={day.id}>
                    {items.length === 0
                      ? ""
                      : items.map((item) => (
                          <p key={item.id}>
                            <strong>{item.title}</strong>
                            {item.detail ? <span className="preline">{item.detail}</span> : null}
                          </p>
                        ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
