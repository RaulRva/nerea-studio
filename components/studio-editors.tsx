import {
  addExercise,
  addMeal,
  importDiet,
  clearMealDay,
  clearWorkoutDay,
  copyMealDay,
  copyWorkoutDay,
  deleteExercise,
  deleteMeal,
  saveWorkoutDay,
  updateExercise,
  updateMeal,
} from "@/app/actions/plans";
import { ConfirmForm } from "@/components/confirm-form";
import { SubmitButton } from "@/components/submit-button";
import { DAYS, MEAL_SLOTS } from "@/lib/constants";
import type { Meal, WorkoutDay } from "@/lib/types";

function HiddenPlan({
  clientId,
  day,
  section,
}: {
  clientId: string;
  day: number;
  section: string;
}) {
  return (
    <>
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="section" value={section} />
    </>
  );
}

function CopyDay({
  clientId,
  day,
  section,
  action,
  label,
}: {
  clientId: string;
  day: number;
  section: string;
  action: (formData: FormData) => void | Promise<void>;
  label: string;
}) {
  const fallback = day === 1 ? 2 : 1;
  return (
    <ConfirmForm
      action={action}
      className="copy-row"
      message="Se sustituye lo que ya hubiera en el día de destino."
    >
      <HiddenPlan clientId={clientId} day={day} section={section} />
      <label className="field">
        <span>{label}</span>
        <select name="targetDay" defaultValue={fallback}>
          {DAYS.filter((item) => item.id !== day).map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton pendingLabel="Copiando…" variant="ghost">
        Copiar
      </SubmitButton>
    </ConfirmForm>
  );
}

export function MealEditor({
  clientId,
  day,
  meals,
}: {
  clientId: string;
  day: number;
  meals: Meal[];
}) {
  return (
    <div>
      <section className="panel-card stack diet-import">
        <h3>Subir la semana en Excel</h3>
        <p className="muted">
          Una fila por comida. Al subirla se sustituye la dieta de los siete días de este cliente.
        </p>
        <a href="/plantilla-dieta.xlsx" download>
          Descargar plantilla
        </a>
        <ConfirmForm action={importDiet} message="Se sustituye la dieta de toda la semana de este cliente.">
          <HiddenPlan clientId={clientId} day={day} section="dieta" />
          <label className="field">
            <span>Archivo .xlsx</span>
            <input
              name="dieta"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
            />
          </label>
          <SubmitButton pendingLabel="Subiendo…">Subir Excel</SubmitButton>
        </ConfirmForm>
      </section>
      <CopyDay clientId={clientId} day={day} section="dieta" action={copyMealDay} label="Copiar este día a" />
      <ConfirmForm action={clearMealDay} message="¿Quitar todas las comidas de este día?">
        <HiddenPlan clientId={clientId} day={day} section="dieta" />
        <button className="btn-quiet" type="submit">
          Vaciar día
        </button>
      </ConfirmForm>
      <div className="meal-grid">
        {MEAL_SLOTS.map((slot) => {
          const items = meals.filter((meal) => meal.slot === slot.id);
          return (
            <section key={slot.id} className="meal-card">
              <header>
                <h3>{slot.label}</h3>
                <p>{slot.hint}</p>
              </header>
              <ul className="editor-list">
                {items.map((item) => (
                  <li key={item.id}>
                    {item.photoUrl ? <img className="plan-photo" src={item.photoUrl} alt="" /> : null}
                    <strong>{item.title}</strong>
                    {item.detail ? <p className="preline">{item.detail}</p> : null}
                    <div className="row-actions">
                      <details>
                        <summary>Editar</summary>
                        <form action={updateMeal} className="stack">
                          <HiddenPlan clientId={clientId} day={day} section="dieta" />
                          <input type="hidden" name="id" value={item.id} />
                          <label className="field">
                            <span>Nombre</span>
                            <input name="title" defaultValue={item.title} required />
                          </label>
                          <label className="field">
                            <span>Cantidades</span>
                            <textarea name="detail" defaultValue={item.detail} />
                          </label>
                          <PhotoField hasPhoto={Boolean(item.photoUrl)} />
                          <SubmitButton>Guardar</SubmitButton>
                        </form>
                      </details>
                      <ConfirmForm action={deleteMeal} message="¿Quitar esta comida?">
                        <HiddenPlan clientId={clientId} day={day} section="dieta" />
                        <input type="hidden" name="id" value={item.id} />
                        <button className="btn-quiet" type="submit">
                          Quitar
                        </button>
                      </ConfirmForm>
                    </div>
                  </li>
                ))}
              </ul>
              {items.length === 0 ? (
                <form action={addMeal} className="stack">
                  <HiddenPlan clientId={clientId} day={day} section="dieta" />
                  <input type="hidden" name="slot" value={slot.id} />
                  <label className="field">
                    <span>Añadir</span>
                    <input name="title" placeholder="Avena con frutos" required />
                  </label>
                  <label className="field">
                    <span>Cantidades</span>
                    <textarea name="detail" placeholder="40 g de avena, 200 ml de leche" />
                  </label>
                  <PhotoField />
                  <SubmitButton pendingLabel="Añadiendo…">Añadir</SubmitButton>
                </form>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function WorkoutEditor({
  clientId,
  day,
  workout,
}: {
  clientId: string;
  day: number;
  workout: WorkoutDay | null;
}) {
  return (
    <div className="stack">
      <form action={saveWorkoutDay} className="panel-card stack">
        <HiddenPlan clientId={clientId} day={day} section="entreno" />
        <label className="field">
          <span>Nombre de la sesión</span>
          <input name="title" defaultValue={workout?.title ?? ""} placeholder="Tren inferior o Descanso" />
        </label>
        <label className="field">
          <span>Nota para el cliente</span>
          <textarea name="notes" defaultValue={workout?.notes ?? ""} placeholder="Calienta 5 minutos antes de empezar." />
        </label>
        <SubmitButton>Guardar sesión</SubmitButton>
      </form>

      <CopyDay
        clientId={clientId}
        day={day}
        section="entreno"
        action={copyWorkoutDay}
        label="Copiar este entreno a"
      />
      <ConfirmForm action={clearWorkoutDay} message="¿Quitar el entreno de este día?">
        <HiddenPlan clientId={clientId} day={day} section="entreno" />
        <button className="btn-quiet" type="submit">
          Vaciar día
        </button>
      </ConfirmForm>

      <div className="panel-card">
        {(workout?.exercises ?? []).map((exercise) => (
          <article key={exercise.id} className="exercise">
            <div>
              {exercise.photoUrl ? <img className="plan-photo" src={exercise.photoUrl} alt="" /> : null}
              <h3>{exercise.name}</h3>
              <p className="muted">
                {[
                  exercise.sets ? `${exercise.sets} series` : null,
                  exercise.reps ? `${exercise.reps} reps` : null,
                  exercise.weightKg !== null ? `${exercise.weightKg} kg` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Sin detalle"}
              </p>
              <details>
                <summary>Editar</summary>
                <form action={updateExercise} className="stack">
                  <HiddenPlan clientId={clientId} day={day} section="entreno" />
                  <input type="hidden" name="id" value={exercise.id} />
                  <ExerciseFields
                    values={{
                      name: exercise.name,
                      sets: exercise.sets?.toString() ?? "",
                      reps: exercise.reps,
                      weight: exercise.weightKg?.toString() ?? "",
                      rest: exercise.restSeconds?.toString() ?? "",
                      notes: exercise.notes,
                    }}
                  />
                  <PhotoField hasPhoto={Boolean(exercise.photoUrl)} />
                  <SubmitButton>Guardar</SubmitButton>
                </form>
              </details>
            </div>
            <ConfirmForm action={deleteExercise} message="¿Quitar este ejercicio?">
              <HiddenPlan clientId={clientId} day={day} section="entreno" />
              <input type="hidden" name="id" value={exercise.id} />
              <button className="btn-quiet" type="submit">
                Quitar
              </button>
            </ConfirmForm>
          </article>
        ))}
        <form action={addExercise} className="stack" style={{ marginTop: 16 }}>
          <HiddenPlan clientId={clientId} day={day} section="entreno" />
          <h3>Nuevo ejercicio</h3>
          <ExerciseFields />
          <PhotoField />
          <SubmitButton pendingLabel="Añadiendo…">Añadir ejercicio</SubmitButton>
        </form>
      </div>
    </div>
  );
}

function PhotoField({ hasPhoto = false }: { hasPhoto?: boolean }) {
  return (
    <>
      <label className="field">
        <span>Foto</span>
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      {hasPhoto ? (
        <label className="field">
          <span>
            <input name="removePhoto" type="checkbox" /> Quitar la foto
          </span>
        </label>
      ) : null}
    </>
  );
}

function ExerciseFields({
  values,
}: {
  values?: { name: string; sets: string; reps: string; weight: string; rest: string; notes: string };
}) {
  return (
    <>
      <label className="field">
        <span>Ejercicio</span>
        <input name="name" defaultValue={values?.name} placeholder="Sentadilla" required />
      </label>
      <div className="measure-grid">
        <label className="field">
          <span>Series</span>
          <input name="sets" inputMode="numeric" defaultValue={values?.sets} placeholder="4" />
        </label>
        <label className="field">
          <span>Repeticiones</span>
          <input name="reps" defaultValue={values?.reps} placeholder="8-12" />
        </label>
        <label className="field">
          <span>Peso</span>
          <span className="unit">
            <input name="weight_kg" inputMode="decimal" defaultValue={values?.weight} placeholder="60" />
            <em>kg</em>
          </span>
        </label>
        <label className="field">
          <span>Descanso</span>
          <span className="unit">
            <input name="rest_seconds" inputMode="numeric" defaultValue={values?.rest} placeholder="90" />
            <em>s</em>
          </span>
        </label>
      </div>
      <label className="field">
        <span>Nota</span>
        <textarea name="notes" defaultValue={values?.notes} placeholder="Baja controlado." />
      </label>
    </>
  );
}
