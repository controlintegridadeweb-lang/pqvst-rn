"use client";

import { useActionState } from "react";
import { createStateAdministrator, type SignInState } from "@/app/acesso/actions";

const initialState: SignInState = { error: null, notice: null };
const field = "w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none";

export function BootstrapAdminForm() {
  const [state, action, pending] = useActionState(createStateAdministrator, initialState);

  return (
    <div className="w-full">
      <h1 className="text-center text-xl font-semibold text-ink underline decoration-2 underline-offset-4">
        Administrador estadual
      </h1>
      <p className="mt-4 text-center text-sm leading-6 text-muted">
        Esta instalação ainda não tem administrador. A primeira conta recebe esse perfil e passa a abrir órgãos, ciclos e
        credenciais.
      </p>
      <form action={action} className="mt-8 grid gap-4" noValidate>
        <label className="grid gap-2 text-sm text-ink" htmlFor="fullName">
          Nome
          <input id="fullName" name="fullName" required minLength={3} maxLength={120} autoComplete="name" className={field} />
        </label>
        <label className="grid gap-2 text-sm text-ink" htmlFor="email">
          E-mail institucional
          <input id="email" name="email" type="email" required autoComplete="username" className={field} />
        </label>
        <label className="grid gap-2 text-sm text-ink" htmlFor="password">
          Senha
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
        </label>
        <label className="grid gap-2 text-sm text-ink" htmlFor="confirmation">
          Confirme a senha
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={field}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mx-auto mt-2 rounded-md bg-pine px-6 py-2.5 text-sm font-semibold tracking-wide text-white uppercase disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar administrador"}
        </button>
        {state.error ? (
          <p role="alert" className="text-center text-sm text-clay">
            {state.error}
          </p>
        ) : null}
        {state.notice ? <p className="text-center text-sm text-ink">{state.notice}</p> : null}
      </form>
    </div>
  );
}
