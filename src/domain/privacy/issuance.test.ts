import { describe, expect, it } from "vitest";
import {
  admitParticipation,
  answersForStorage,
  assertCollectionWindow,
  createParticipationToken,
  planCredentialBatch,
  planHeadcount,
} from "@/domain/privacy/issuance";
import { validateParticipationTokenFormat } from "@/domain/privacy/participation";

describe("emissão e admissão da credencial", () => {
  it("limita o lote ao quantitativo ainda não emitido", () => {
    expect(planCredentialBatch({ headcount: 10, alreadyIssued: 8, requested: 2 }).ok).toBe(true);
    const exceeded = planCredentialBatch({ headcount: 10, alreadyIssued: 8, requested: 3 });
    expect(exceeded.ok).toBe(false);
    if (!exceeded.ok) expect(exceeded.error.message).toContain("2");
    expect(planCredentialBatch({ headcount: 0, alreadyIssued: 0, requested: 1 }).ok).toBe(false);
    expect(planHeadcount(4, 5).ok).toBe(false);
    expect(planHeadcount(5, 5).ok).toBe(true);
  });

  it("aceita credencial emitida somente dentro do ciclo aberto", () => {
    expect(
      admitParticipation({
        credentialStatus: "issued",
        cycleStatus: "open",
        opensOn: "2026-10-01",
        closesOn: "2026-10-31",
        today: "2026-10-27",
      }).ok,
    ).toBe(true);
    expect(
      admitParticipation({
        credentialStatus: "consumed",
        cycleStatus: "open",
        opensOn: "2026-10-01",
        closesOn: "2026-10-31",
        today: "2026-10-27",
      }).ok,
    ).toBe(false);
    expect(
      admitParticipation({
        credentialStatus: "issued",
        cycleStatus: "closed",
        opensOn: "2026-10-01",
        closesOn: "2026-10-31",
        today: "2026-10-27",
      }).ok,
    ).toBe(false);
    expect(
      admitParticipation({
        credentialStatus: "issued",
        cycleStatus: "open",
        opensOn: "2026-11-01",
        closesOn: "2026-11-30",
        today: "2026-10-27",
      }).ok,
    ).toBe(false);
    expect(assertCollectionWindow("2026-10-31", "2026-10-01").ok).toBe(false);
  });

  it("gera credencial opaca e guarda só as respostas do formulário", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => createParticipationToken()));
    expect(tokens.size).toBe(20);
    for (const token of tokens) {
      expect(validateParticipationTokenFormat(token).ok).toBe(true);
    }

    const stored = answersForStorage(["Q01", "Q03"], {
      Q01: "Controladoria",
      Q03: 4,
      credentialId: "não-entra",
    });
    expect(stored).toEqual({ Q01: "Controladoria", Q03: 4 });
    expect(stored).not.toHaveProperty("credentialId");
  });
});