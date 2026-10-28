"use client";

import { useActionState } from "react";
import { acceptCredential, type CredentialState } from "@/app/diagnostico/actions";

const initialState: CredentialState = { error: null };

export function TokenCheck() {
  const [state, action, pending] = useActionState(acceptCredential, initialState);

  return (
    <form action={action} className="mt-8 grid gap-4" noValidate>
      <div className="flex overflow-hidden rounded-md border border-line bg-white">
        <label htmlFor="token" className="flex w-12 shrink-0 items-center justify-center border-r-2 border-pine text-pine">
          <span className="sr-only">Credencial de participação</span>
          <KeyIcon />
        </label>
        <input
          id="token"
          name="token"
          placeholder="Credencial de participação"
          autoComplete="off"
          spellCheck={false}
          required
          className="w-full bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-[#9ca3af]"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mx-auto mt-4 inline-flex items-center gap-2 rounded-md bg-pine px-6 py-2.5 text-sm font-semibold tracking-wide text-white uppercase disabled:opacity-60"
      >
        <ArrowIcon />
        {pending ? "Aguarde…" : "Continuar"}
      </button>
      {state.error ? (
        <p role="alert" className="text-center text-sm text-clay">
          {state.error}
        </p>
      ) : null}
    </form>
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

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h12m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
