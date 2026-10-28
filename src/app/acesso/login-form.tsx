"use client";

import { useActionState, useState, type ReactNode } from "react";
import { requestPasswordReset, signIn, type SignInState } from "@/app/acesso/actions";

const initialState: SignInState = { error: null, notice: null };

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [signInState, signInAction, signingIn] = useActionState(signIn, initialState);
  const [resetState, resetAction, resetting] = useActionState(requestPasswordReset, initialState);
  const state = mode === "login" ? signInState : resetState;
  const pending = mode === "login" ? signingIn : resetting;

  return (
    <div className="w-full">
      <h1 className="text-center text-xl font-semibold text-ink underline decoration-2 underline-offset-4">
        {mode === "login" ? "Entrar" : "Redefinir senha"}
      </h1>

      <form action={mode === "login" ? signInAction : resetAction} className="mt-8 grid gap-4" noValidate>
        <Field id="email" icon={<MailIcon />} label="E-mail institucional">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="E-mail institucional"
            className="w-full bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-[#9ca3af]"
          />
        </Field>

        {mode === "login" ? (
          <Field id="password" icon={<KeyIcon />} label="Senha">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="Senha"
              className="w-full bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-[#9ca3af]"
            />
          </Field>
        ) : null}

        {mode === "login" ? (
          <div className="mt-1 flex items-center justify-between gap-3 text-sm text-muted">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="remember"
                defaultChecked
                className="size-4 accent-pine"
              />
              Lembrar de mim
            </label>
            <button
              type="button"
              className="underline decoration-1 underline-offset-2"
              onClick={() => setMode("forgot")}
            >
              Esqueci a senha
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="justify-self-start text-sm text-muted underline decoration-1 underline-offset-2"
            onClick={() => setMode("login")}
          >
            Voltar ao login
          </button>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mx-auto mt-4 inline-flex items-center gap-2 rounded-md bg-pine px-6 py-2.5 text-sm font-semibold tracking-wide text-white uppercase disabled:opacity-60"
        >
          <LoginIcon />
          {pending ? "Aguarde…" : mode === "login" ? "Entrar" : "Enviar"}
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

function Field({
  id,
  icon,
  label,
  children,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-line bg-white">
      <label htmlFor={id} className="flex w-12 shrink-0 items-center justify-center border-r-2 border-pine text-pine">
        <span className="sr-only">{label}</span>
        {icon}
      </label>
      {children}
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11.5 12.5L20 4m0 0h-3.5M20 4v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
