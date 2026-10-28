import { fail, ok, type DomainResult } from "@/domain/shared/result";

const CPF_DIGITS = /^\d{11}$/;
const CPF_MASK = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida o formato da credencial antes de qualquer consulta. Não confirma que ela exista. */
export function validateParticipationTokenFormat(token: string): DomainResult<string> {
  const normalized = token.trim();
  if (normalized.length < 20 || normalized.length > 128) {
    return fail(
      "invalid_token",
      "A credencial deve ter entre 20 e 128 caracteres. Ela não é senha nem documento de identificação.",
    );
  }
  if (CPF_DIGITS.test(normalized) || CPF_MASK.test(normalized)) {
    return fail("identifier_not_allowed", "CPF não pode ser usado como credencial de participação.");
  }
  if (EMAIL.test(normalized)) {
    return fail("identifier_not_allowed", "E-mail não pode ser usado como credencial de participação.");
  }
  if (!/^[\w.~-]+$/.test(normalized)) {
    return fail("invalid_token", "A credencial contém caracteres não permitidos.");
  }
  return ok(normalized);
}

export async function hashParticipationToken(token: string, pepper: string): Promise<string> {
  const format = validateParticipationTokenFormat(token);
  if (!format.ok) {
    throw new Error(format.error.message);
  }
  if (pepper.trim().length < 32) {
    throw new Error("O segredo de hash da credencial é insuficiente.");
  }
  const payload = new TextEncoder().encode(`${pepper}:${format.value}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const CREDENTIAL_STATUSES = ["issued", "consumed", "revoked", "expired"] as const;

export type CredentialStatus = (typeof CREDENTIAL_STATUSES)[number];

export function isCredentialStatus(value: unknown): value is CredentialStatus {
  return typeof value === "string" && CREDENTIAL_STATUSES.some((status) => status === value);
}

/** Registro de participação sem ligação com a resposta analítica. */
export interface ParticipationCredential {
  id: string;
  cycleId: string;
  organizationId: string;
  tokenHash: string;
  status: CredentialStatus;
  consumedAt: string | null;
}

export function consumeCredential(
  credential: ParticipationCredential,
  consumedAt: string,
): DomainResult<ParticipationCredential> {
  if (credential.status !== "issued") {
    return fail(
      "credential_unavailable",
      "Esta credencial já foi utilizada, revogada ou está vencida. O envio não foi registrado.",
    );
  }
  return ok({
    ...credential,
    status: "consumed",
    consumedAt,
  });
}
