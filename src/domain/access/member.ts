import { fail, ok, type DomainResult } from "@/domain/shared/result";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MEMBER_SEATS = ["titular", "suplente", "member"] as const;
export type MemberSeat = (typeof MEMBER_SEATS)[number];

export const MEMBER_SEAT_LABELS: Record<MemberSeat, string> = {
  titular: "Titular",
  suplente: "Suplente",
  member: "Responsável",
};

export interface MemberAccount {
  fullName: string;
  email: string;
  password: string;
  organizationId: string;
  seat: MemberSeat;
}

export function parseMemberAccount(input: {
  fullName: string;
  email: string;
  password: string;
  confirmation: string;
  organizationId: string;
  seat: string;
}): DomainResult<MemberAccount> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 3 || fullName.length > 120) {
    return fail("invalid_member", "Informe o nome de quem vai acessar a gestão do órgão.");
  }
  if (!EMAIL.test(email) || email.length > 160) {
    return fail("invalid_member", "Informe o e-mail institucional.");
  }
  if (input.password.length < 8 || input.password !== input.confirmation) {
    return fail("invalid_member", "A senha precisa ter ao menos 8 caracteres e ser igual nos dois campos.");
  }
  if (!UUID.test(input.organizationId)) {
    return fail("invalid_member", "Escolha o órgão do vínculo.");
  }
  if (!MEMBER_SEATS.includes(input.seat as MemberSeat)) {
    return fail("invalid_member", "Escolha titular, suplente ou responsável.");
  }
  return ok({
    fullName,
    email,
    password: input.password,
    organizationId: input.organizationId,
    seat: input.seat as MemberSeat,
  });
}
