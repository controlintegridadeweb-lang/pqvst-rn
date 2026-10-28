import { CYCLE_STATES, type CycleState } from "@/domain/cycles/cycle";
import {
  isCredentialStatus,
  validateParticipationTokenFormat,
  type CredentialStatus,
} from "@/domain/privacy/participation";
import type { AnswerValue } from "@/domain/surveys/response";
import { fail, ok, type DomainResult } from "@/domain/shared/result";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export function todayInRioGrandeDoNorte(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(now);
}

export function assertCollectionWindow(opensOn: string, closesOn: string): DomainResult<true> {
  if (!ISO_DATE.test(opensOn) || !ISO_DATE.test(closesOn)) {
    return fail("invalid_period", "Informe a abertura e o encerramento no formato AAAA-MM-DD.");
  }
  if (closesOn < opensOn) {
    return fail("invalid_period", "O encerramento precisa ser no mesmo dia ou depois da abertura.");
  }
  return ok(true);
}

export function collectionIsOpen(input: {
  cycleStatus: CycleState;
  opensOn: string;
  closesOn: string;
  today: string;
}): boolean {
  return input.cycleStatus === "open" && input.today >= input.opensOn && input.today <= input.closesOn;
}

export function parseOrganization(name: string, acronym: string): DomainResult<{ name: string; acronym: string }> {
  const cleanName = name.trim();
  const cleanAcronym = acronym.trim();
  if (cleanName.length < 3 || cleanName.length > 160) {
    return fail("invalid_organization", "Informe o nome do órgão, com pelo menos 3 caracteres.");
  }
  if (!/^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9./-]{1,19}$/.test(cleanAcronym)) {
    return fail("invalid_organization", "A sigla precisa ter de 2 a 20 caracteres, sem espaço.");
  }
  return ok({ name: cleanName, acronym: cleanAcronym });
}

export function parseCycleIdentity(
  name: string,
  referencePeriod: string,
): DomainResult<{ name: string; referencePeriod: string }> {
  const cleanName = name.trim();
  const period = referencePeriod.trim();
  if (cleanName.length < 3 || cleanName.length > 120) {
    return fail("invalid_cycle", "Informe o nome do ciclo.");
  }
  if (period.length < 3 || period.length > 80) {
    return fail("invalid_cycle", "Informe o período de referência.");
  }
  return ok({ name: cleanName, referencePeriod: period });
}

export function parseSourceNote(note: string): DomainResult<string> {
  const clean = note.trim();
  if (clean.length < 5 || clean.length > 300) {
    return fail("invalid_headcount", "Descreva a fonte do quantitativo, com pelo menos 5 caracteres.");
  }
  return ok(clean);
}

export function planHeadcount(headcount: number, alreadyIssued: number): DomainResult<number> {
  if (!Number.isInteger(headcount) || headcount < 1 || headcount > 100_000) {
    return fail("invalid_headcount", "O quantitativo de servidores elegíveis precisa ser um inteiro maior que zero.");
  }
  if (alreadyIssued > headcount) {
    return fail("headcount_exceeded", "O quantitativo não pode ficar abaixo das credenciais já emitidas.");
  }
  return ok(headcount);
}

export function planCredentialBatch(input: {
  headcount: number;
  alreadyIssued: number;
  requested: number;
}): DomainResult<number> {
  if (!Number.isInteger(input.headcount) || input.headcount < 1) {
    return fail("headcount_missing", "Registre o quantitativo de servidores elegíveis antes de emitir credenciais.");
  }
  if (!Number.isInteger(input.requested) || input.requested < 1 || input.requested > 500) {
    return fail("invalid_batch", "Informe uma quantidade entre 1 e 500.");
  }
  const remaining = input.headcount - input.alreadyIssued;
  if (input.requested > remaining) {
    return fail(
      "headcount_exceeded",
      remaining > 0
        ? `Ainda cabem ${remaining} credenciais neste órgão.`
        : "Todas as credenciais deste quantitativo já foram emitidas.",
    );
  }
  return ok(input.requested);
}

export function admitParticipation(input: {
  credentialStatus: CredentialStatus;
  cycleStatus: CycleState;
  opensOn: string;
  closesOn: string;
  today: string;
}): DomainResult<true> {
  if (input.credentialStatus !== "issued") {
    return fail(
      "credential_unavailable",
      "Esta credencial já foi utilizada, revogada ou está vencida. O envio não foi registrado.",
    );
  }
  if (!collectionIsOpen(input)) {
    return fail("cycle_closed", "O ciclo desta credencial não está aberto para resposta.");
  }
  return ok(true);
}

export function isCycleState(value: unknown): value is CycleState {
  return typeof value === "string" && CYCLE_STATES.some((state) => state === value);
}

export function createParticipationToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const token = btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const format = validateParticipationTokenFormat(token);
  if (!format.ok) {
    throw new Error(format.error.message);
  }
  return format.value;
}

/** Copia só os códigos do formulário. A credencial não entra neste objeto. */
export function answersForStorage(
  codes: readonly string[],
  answers: Record<string, AnswerValue>,
): Record<string, number | string> {
  const stored: Record<string, number | string> = {};
  for (const code of codes) {
    const value = answers[code];
    if (typeof value === "number") stored[code] = value;
    else if (typeof value === "string" && value.trim() !== "") stored[code] = value.trim();
  }
  return stored;
}

export function readCredentialStatus(value: unknown): CredentialStatus | null {
  return isCredentialStatus(value) ? value : null;
}
