import { formatNumber, formatPrescription } from "@/lib/format";
import type { WorkoutDay } from "@/lib/types";

export function ExerciseBoard({ workout }: { workout: WorkoutDay | null }) {
  const resting = workout && workout.exercises.length === 0 && /descanso/i.test(workout.title);
  if (!workout || (workout.exercises.length === 0 && !workout.title && !workout.notes)) {
    return <p className="empty-state">Todavía no hay hábitos.</p>;
  }

  return (
    <section className="panel-card">
      {workout.title ? (
        <h2 className="page-title" style={{ fontSize: "2rem" }}>
          {workout.title}
        </h2>
      ) : null}
      {workout.notes ? <p className="preline muted">{workout.notes}</p> : null}
      {resting ? <p>Hoy toca descansar.</p> : null}
      <div>
        {workout.exercises.map((exercise) => (
          <article key={exercise.id} className="exercise">
            <div>
              {exercise.photoUrl ? (
                <img className="plan-photo" src={exercise.photoUrl} alt={exercise.name} />
              ) : null}
              <h3>{exercise.name}</h3>
              {formatPrescription(exercise.sets, exercise.reps) ? (
                <small>{formatPrescription(exercise.sets, exercise.reps)}</small>
              ) : null}
              {exercise.restSeconds !== null ? <small>Descanso {exercise.restSeconds} s</small> : null}
              {exercise.notes ? <p className="preline">{exercise.notes}</p> : null}
            </div>
            {exercise.weightKg !== null ? (
              <p className="kg">
                {formatNumber(exercise.weightKg, 2)}
                <span>kg</span>
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
