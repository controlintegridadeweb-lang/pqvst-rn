"use client";

import { useActionState } from "react";
import { OFFICIAL_AXES } from "@/domain/indicators/axes";
import { discloseAction, saveAction, type FormState } from "@/app/gestao/planos/actions";
import { shellButton, shellField, shellNote } from "@/app/gestao/desk-ui";

const labelClass = "grid gap-2 text-sm font-medium text-[#5c5b73]";

const initial: FormState = { error: null, notice: null };

export function ActionDraftForm({
  organizations,
  cycles,
}: {
  organizations: readonly { id: string; name: string; acronym: string }[];
  cycles: readonly { id: string; name: string; organizationIds: readonly string[] }[];
}) {
  const [state, action, pending] = useActionState(saveAction, initial);
  const links = cycles.flatMap((cycle) =>
    cycle.organizationIds.flatMap((organizationId) => {
      const organization = organizations.find((item) => item.id === organizationId);
      if (!organization) return [];
      return [{ value: `${cycle.id}|${organization.id}`, label: `${cycle.name} · ${organization.acronym}` }];
    }),
  );

  return (
    <form action={action} className="grid gap-4">
      <label className={labelClass}>
        Órgão no ciclo
        <select name="link" required className={shellField} defaultValue={links[0]?.value ?? ""}>
          {links.map((link) => (
            <option key={link.value} value={link.value}>
              {link.label}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Eixo
        <select name="axis" className={shellField} defaultValue="E1">
          {OFFICIAL_AXES.map((axis) => (
            <option key={axis.code} value={axis.code}>
              {axis.code} — {axis.name}
            </option>
          ))}
        </select>
      </label>
      {[
        ["problem", "Problema identificado"],
        ["objective", "Objetivo"],
        ["description", "Descrição da ação"],
        ["institutionalOwner", "Responsável institucional"],
        ["expectedResult", "Meta ou resultado esperado"],
        ["monitoringIndicator", "Indicador de execução, distinto do IQVST"],
      ].map(([name, label]) => (
        <label key={name} className={labelClass}>
          {label}
          <input name={name} required={name !== "monitoringIndicator"} minLength={name === "monitoringIndicator" ? undefined : 3} className={shellField} />
        </label>
      ))}
      <label className={labelClass}>
        Prazo
        <input name="dueDate" type="date" required className={shellField} />
      </label>
      <button type="submit" disabled={pending} className={shellButton}>
        {pending ? "Gravando…" : "Gravar ação"}
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

export function DiscloseButton({ id, disclosed }: { id: string; disclosed: boolean }) {
  const [state, action, pending] = useActionState(discloseAction, initial);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="actionItemId" value={id} />
      <input type="hidden" name="disclose" value={disclosed ? "0" : "1"} />
      <button type="submit" disabled={pending} className={`${shellButton} px-3 py-1.5 text-xs`}>
        {pending ? "Gravando…" : disclosed ? "Retirar da divulgação" : "Divulgar"}
      </button>
      {state.error ? <p className="text-xs text-[#9f1239]">{state.error}</p> : null}
    </form>
  );
}
