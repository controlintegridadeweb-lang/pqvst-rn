import { describe, expect, it } from "vitest";
import { parseAdministratorAccount } from "@/domain/access/administrator";

describe("perfil do administrador estadual", () => {
  it("aceita nome, e-mail e senha conferida", () => {
    const parsed = parseAdministratorAccount({
      fullName: "  Controladoria Geral  ",
      email: "Admin@controladoria.rn.gov.br",
      password: "senha-segura",
      confirmation: "senha-segura",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.fullName).toBe("Controladoria Geral");
    expect(parsed.value.email).toBe("admin@controladoria.rn.gov.br");
  });

  it("recusa senha curta ou diferente da confirmação", () => {
    expect(
      parseAdministratorAccount({
        fullName: "Controladoria",
        email: "admin@controladoria.rn.gov.br",
        password: "curta",
        confirmation: "curta",
      }).ok,
    ).toBe(false);
    expect(
      parseAdministratorAccount({
        fullName: "Controladoria",
        email: "admin@controladoria.rn.gov.br",
        password: "senha-segura",
        confirmation: "outra-senha",
      }).ok,
    ).toBe(false);
  });
});
