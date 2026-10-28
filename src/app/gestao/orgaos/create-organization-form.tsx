"use client";

import { useActionState } from "react";
import { createOrganization, type FormState } from "@/app/gestao/coleta/actions";
import { deskButton, deskField } from "@/app/gestao/desk-ui";

const initial: FormState = { error: null, notice: null };
const field = deskField;

export function CreateOrganizationForm({ buttonClassName = deskButton }: { buttonClassName?: string }) {
  const [state, action, pending] = useActionState(createOrganization, initial);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm text-ink">
        Nome do órgão
        <input name="name" required minLength={3} maxLength={160} className={field} />
      </label>
      <label className="grid gap-2 text-sm text-ink">
        Sigla
        <input name="acronym" required minLength={2} maxLength={20} className={field} autoCapitalize="characters" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className={buttonClassName}
      >
        {pending ? "Gravando…" : "Cadastrar órgão"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-clay">
          {state.error}
        </p>
      ) : null}
      {state.notice ? <p className="text-sm text-ink">{state.notice}</p> : null}
    </form>
  );
}
