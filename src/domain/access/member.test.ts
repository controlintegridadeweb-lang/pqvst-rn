import { describe, expect, it } from "vitest";
import { parseMemberAccount } from "@/domain/access/member";

const organizationId = "00000000-0000-4000-8000-000000000010";

describe("vínculo de membro do órgão", () => {
  it("aceita titular com e-mail e senha conferida", () => {
    const parsed = parseMemberAccount({
      fullName: "  Maria da Comissão  ",
      email: "Maria@orgao.rn.gov.br",
      password: "senha-segura",
      confirmation: "senha-segura",
      organizationId,
      seat: "titular",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.fullName).toBe("Maria da Comissão");
    expect(parsed.value.email).toBe("maria@orgao.rn.gov.br");
    expect(parsed.value.seat).toBe("titular");
  });

  it("recusa órgão ausente, vínculo livre e senha diferente", () => {
    expect(
      parseMemberAccount({
        fullName: "Maria",
        email: "maria@orgao.rn.gov.br",
        password: "senha-segura",
        confirmation: "senha-segura",
        organizationId: "orgao-escolhido-no-navegador",
        seat: "titular",
      }).ok,
    ).toBe(false);
    expect(
      parseMemberAccount({
        fullName: "Maria",
        email: "maria@orgao.rn.gov.br",
        password: "senha-segura",
        confirmation: "outra-senha",
        organizationId,
        seat: "visitante",
      }).ok,
    ).toBe(false);
  });
});
