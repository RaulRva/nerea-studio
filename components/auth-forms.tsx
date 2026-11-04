"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, recover, register, resetPassword } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/lib/types";

function Feedback({ state }: { state: ActionState }) {
  return (
    <>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.notice ? (
        <p className="form-notice" role="status">
          {state.notice}
        </p>
      ) : null}
    </>
  );
}

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action] = useActionState(login, { error: initialError });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="stack">
      <Feedback state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="field">
        <span>Correo</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
      <p className="muted">
        <Link href="/recuperar">He olvidado la contraseña</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(register, {});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form action={action} className="stack">
      <Feedback state={state} />
      <label className="field">
        <span>Nombre</span>
        <input
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Correo</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Repetir contraseña</span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </label>
      <SubmitButton pendingLabel="Creando cuenta…">Crear cuenta</SubmitButton>
    </form>
  );
}

export function RecoverForm() {
  const [state, action] = useActionState(recover, {});
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="stack">
      <Feedback state={state} />
      <label className="field">
        <span>Correo</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <SubmitButton pendingLabel="Enviando…">Enviar enlace</SubmitButton>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(resetPassword, {});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form action={action} className="stack">
      <Feedback state={state} />
      <label className="field">
        <span>Contraseña nueva</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Repetir contraseña</span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </label>
      <SubmitButton pendingLabel="Guardando…">Guardar contraseña</SubmitButton>
    </form>
  );
}
