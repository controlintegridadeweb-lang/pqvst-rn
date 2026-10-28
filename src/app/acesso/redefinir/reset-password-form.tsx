"use client";

import { useActionState } from "react";
import { updatePassword, type SignInState } from "@/app/acesso/actions";

const initialState: SignInState = { error: null, notice: null };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="grid w-full gap-4" noValidate>
      <h1 className="text-center text-xl font-semibold text-ink underline decoration-2 underline-offset-4">
        Nova senha
      </h1>
      <label className="grid gap-2 text-sm text-muted">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-md border border-line px-3 py-3 text-sm text-ink outline-none"
        />
      </label>
      <label className="grid gap-2 text-sm text-muted">
        Confirmar senha
        <input
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-md border border-line px-3 py-3 text-sm text-ink outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mx-auto mt-2 rounded-md bg-pine px-6 py-2.5 text-sm font-semibold tracking-wide text-white uppercase disabled:opacity-60"
      >
        {pending ? "Aguarde…" : "Salvar"}
      </button>
      {state.error ? (
        <p role="alert" className="text-center text-sm text-clay">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
