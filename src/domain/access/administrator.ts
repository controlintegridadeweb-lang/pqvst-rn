import { fail, ok, type DomainResult } from "@/domain/shared/result";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AdministratorAccount {
  fullName: string;
  email: string;
  password: string;
}

export function parseAdministratorAccount(input: {
  fullName: string;
  email: string;
  password: string;
  confirmation: string;
}): DomainResult<AdministratorAccount> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 3 || fullName.length > 120) {
    return fail("invalid_administrator", "Informe o nome do administrador estadual.");
  }
  if (!EMAIL.test(email) || email.length > 160) {
    return fail("invalid_administrator", "Informe o e-mail institucional.");
  }
  if (input.password.length < 8 || input.password !== input.confirmation) {
    return fail("invalid_administrator", "A senha precisa ter ao menos 8 caracteres e ser igual nos dois campos.");
  }
  return ok({ fullName, email, password: input.password });
}
