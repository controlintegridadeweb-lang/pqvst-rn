"use client";

import { useActionState } from "react";
import { MEMBER_SEATS, MEMBER_SEAT_LABELS } from "@/domain/access/member";
import { createMember, type FormState } from "@/app/gestao/membros/actions";
import { deskField } from "@/app/gestao/desk-ui";

const submitButton =
  "on-pink w-full rounded-full bg-[#6d5efc] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-[0_8px_18px_rgba(109,94,252,0.28)] disabled:opacity-60";

const initial: FormState = { error: null, notice: null };

export function MemberForm({
  organizations,
}: {
  organizations: readonly { id: string; name: string; acronym: string }[];
}) {
  const [state, action, pending] = useActionState(createMember, initial);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-[#5c5b73]">
        Nome
        <input name="fullName" required minLength={3} maxLength={120} className={deskField} />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#5c5b73]">
        E-mail institucional
        <input name="email" type="email" required maxLength={160} autoComplete="off" className={deskField} />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#5c5b73]">
        Senha
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={deskField} />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#5c5b73]">
        Confirmar senha
        <input name="confirmation" type="password" required minLength={8} autoComplete="new-password" className={deskField} />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#5c5b73]">
        Órgão
        <select name="organizationId" required className={deskField} defaultValue="">
          <option value="" disabled>
            Escolha o órgão
          </option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.acronym} — {organization.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#5c5b73]">
        Vínculo
        <select name="seat" required className={deskField} defaultValue="titular">
          {MEMBER_SEATS.filter((seat) => seat !== "member").map((seat) => (
            <option key={seat} value={seat}>
              {MEMBER_SEAT_LABELS[seat]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? "Vinculando…" : "Vincular membro"}
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
