import { MEAL_SLOTS } from "@/lib/constants";
import type { Meal } from "@/lib/types";

export function MealBoard({ meals }: { meals: Meal[] }) {
  return (
    <div className="meal-grid">
      {MEAL_SLOTS.map((slot) => {
        const items = meals.filter((meal) => meal.slot === slot.id);
        return (
          <section key={slot.id} className="meal-card" aria-labelledby={`slot-${slot.id}`}>
            <header>
              <h3 id={`slot-${slot.id}`}>{slot.label}</h3>
              <p>{slot.hint}</p>
            </header>
            {items.length === 0 ? (
              <p className="muted">Sin indicar</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    {item.photoUrl ? (
                      <img className="plan-photo" src={item.photoUrl} alt={item.title} />
                    ) : null}
                    <strong>{item.title}</strong>
                    {item.detail ? <p className="preline">{item.detail}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
