"use client";

import { useActionState } from "react";
import { openCycle, type FormState } from "@/app/gestao/coleta/actions";
import { Mark, shellNote } from "@/app/gestao/desk-ui";

const initial: FormState = { error: null, notice: null };
const field =
  "w-full rounded-2xl border border-transparent bg-[#f7f6fd] px-4 py-2.5 text-sm font-normal text-[#2c2a4a] outline-none focus:border-[#d9d4f5]";
const labelClass = "grid gap-2 text-sm font-medium text-[#5c5b73]";
const submitButton =
  "on-pink w-full rounded-full bg-[#6d5efc] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-[0_8px_18px_rgba(109,94,252,0.28)] disabled:opacity-60";

export function OpenCycleForm({
  organizations,
}: {
  organizations: readonly { id: string; name: string; acronym: string }[];
}) {
  const [state, action, pending] = useActionState(openCycle, initial);

  return (
    <form action={action} className="grid gap-4">
      <label className={labelClass}>
        Nome do ciclo
        <input name="name" required minLength={3} maxLength={120} className={field} />
      </label>
      <label className={labelClass}>
        Período de referência
        <input name="referencePeriod" required minLength={3} maxLength={80} className={field} placeholder="2026" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Abertura
          <input name="opensOn" type="date" required lang="pt-BR" className={field} />
        </label>
        <label className={labelClass}>
          Encerramento
          <input name="closesOn" type="date" required lang="pt-BR" className={field} />
        </label>
      </div>
      <fieldset className="grid gap-2">
        <legend className={labelClass}>Órgãos participantes</legend>
        {organizations.map((organization, index) => (
          <label key={organization.id} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#f7f6fd] px-3 py-2.5">
            <input type="checkbox" name="organizationId" value={organization.id} className="size-4 shrink-0 accent-[#6d5efc]" />
            <Mark label={organization.acronym} index={index} />
            <span className="min-w-0">
              <span className="block text-sm leading-5 font-semibold text-[#2c2a4a]">{organization.acronym}</span>
              <span className="mt-0.5 block text-xs leading-5 text-[#8b8ca3]">{organization.name}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? "Abrindo…" : "Abrir a coleta"}
      </button>
      {state.error ? (
        <p role="alert" className={shellNote("error")}>
          {state.error}
        </p>
      ) : null}
      {state.notice ? <p className={shellNote("ok")}>{state.notice}</p> : null}
    </form>
  );
}
