"use client";

import { useActionState } from "react";
import { submitIntake } from "@/app/actions/intake";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/lib/types";

function Choice({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue="">
        <option value="">Sin indicar</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Area({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea name={name} placeholder={placeholder} rows={3} />
    </label>
  );
}

export function IntakeForm() {
  const [state, action] = useActionState<ActionState, FormData>(submitIntake, {});

  if (state.notice) {
    return (
      <section className="panel-card stack">
        <h2>Cuestionario enviado</h2>
        <p className="form-notice" role="status">
          {state.notice}
        </p>
      </section>
    );
  }

  return (
    <form action={action} className="stack">
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="hp" aria-hidden="true">
        <span>Empresa</span>
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>

      <section className="panel-card stack">
        <h2>1. Datos personales</h2>
        <label className="field">
          <span>Nombre completo</span>
          <input name="nombre" autoComplete="name" required placeholder="Nombre y apellidos" />
        </label>
        <label className="field">
          <span>Correo</span>
          <input name="correo" type="email" autoComplete="email" required placeholder="Para que Nerea pueda escribirte" />
        </label>
        <div className="measure-grid">
          <label className="field">
            <span>Edad</span>
            <input name="edad" inputMode="numeric" placeholder="Años" />
          </label>
          <Choice label="Sexo" name="sexo" options={["Mujer", "Hombre", "Otro / Prefiero no indicarlo"]} />
          <label className="field">
            <span>Altura (cm)</span>
            <input name="altura" inputMode="decimal" placeholder="Ej. 165" />
          </label>
          <label className="field">
            <span>Peso actual (kg)</span>
            <input name="peso" inputMode="decimal" placeholder="Ej. 65" />
          </label>
        </div>
        <label className="field">
          <span>Peso objetivo (kg)</span>
          <input name="pesoObjetivo" inputMode="decimal" placeholder="Opcional" />
        </label>
      </section>

      <section className="panel-card stack">
        <h2>2. Objetivo nutricional</h2>
        <Choice
          label="Qué quieres conseguir"
          name="objetivo"
          options={[
            "Pérdida de grasa",
            "Aumento de masa muscular",
            "Recomposición corporal",
            "Mantenimiento",
            "Mejorar rendimiento deportivo",
            "Mejorar hábitos alimentarios",
          ]}
        />
      </section>

      <section className="panel-card stack">
        <h2>3. Actividad física y trabajo</h2>
        <Choice label="Actividad diaria" name="actividad" options={["Sedentaria", "Ligera", "Moderada", "Alta", "Muy alta"]} />
        <Choice
          label="Tipo de trabajo"
          name="trabajo"
          options={["Sentado", "De pie", "Caminando", "Trabajo físico intenso", "Variado"]}
        />
        <Area label="¿Qué tipo de entrenamiento realizas?" name="entrenamiento" placeholder="Musculación, cardio, CrossFit, pilates..." />
        <Choice
          label="¿Cuántos días entrenas a la semana?"
          name="frecuencia"
          options={["1-2 días", "3-4 días", "5-6 días", "7 días", "No entreno"]}
        />
        <label className="field">
          <span>Horario habitual de entrenamiento</span>
          <input name="horario" placeholder="Ej. 18:00 - 19:30" />
        </label>
      </section>

      <section className="panel-card stack">
        <h2>4. Salud y antecedentes</h2>
        <Area label="¿Tienes alguna patología o condición médica?" name="patologias" placeholder="Indica cuál, o ninguna" />
        <Area label="¿Tomas medicación?" name="medicacion" placeholder="Indica cuál, o ninguna" />
        <Area label="¿Tienes alergias o intolerancias alimentarias?" name="alergias" placeholder="Indica cuáles, o ninguna" />
        <Area label="¿Tomas suplementos?" name="suplementos" placeholder="Creatina, proteína, vitaminas..." />
      </section>

      <section className="panel-card stack">
        <h2>5. Hábitos alimentarios</h2>
        <Choice
          label="¿Cuántas comidas realizas al día?"
          name="comidas"
          options={["2 comidas", "3 comidas", "4 comidas", "5 comidas", "6 comidas"]}
        />
        <Area label="Horarios habituales de comidas" name="horarios" placeholder="Desayuno, comida, merienda y cena..." />
        <Area label="¿Qué alimentos te gustan?" name="alimentosGustan" placeholder="Tus alimentos favoritos..." />
        <Area label="¿Qué alimentos no te gustan?" name="alimentosNo" placeholder="Alimentos que no quieres incluir..." />
        <Area label="¿Sigues algún tipo de alimentación?" name="restricciones" placeholder="Vegetariana, vegana, sin gluten..." />
      </section>

      <section className="panel-card stack">
        <h2>6. Hábitos y bienestar</h2>
        <label className="field">
          <span>¿Cuánta agua bebes al día?</span>
          <input name="agua" placeholder="Ej. 2 litros" />
        </label>
        <Choice label="¿Consumes alcohol?" name="alcohol" options={["No", "Ocasionalmente", "Fines de semana", "Frecuentemente"]} />
        <label className="field">
          <span>¿Cuántas horas duermes?</span>
          <input name="sueno" placeholder="Ej. 7-8 horas" />
        </label>
        <Choice
          label="¿Cómo son tus digestiones?"
          name="digestiones"
          options={["Buenas, sin molestias", "Hinchazón abdominal", "Estreñimiento", "Digestiones pesadas", "Otros problemas"]}
        />
        <Area label="Observaciones adicionales" name="observaciones" placeholder="Cualquier información que consideres importante..." />
        <SubmitButton pendingLabel="Enviando…">Enviar cuestionario</SubmitButton>
      </section>
    </form>
  );
}
