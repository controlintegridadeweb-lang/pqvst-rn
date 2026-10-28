"use server";

import { redirect } from "next/navigation";
import { answersForStorage, admitParticipation, todayInRioGrandeDoNorte } from "@/domain/privacy/issuance";
import { hashParticipationToken, validateParticipationTokenFormat } from "@/domain/privacy/participation";
import { getOfficialQuestionnaire } from "@/domain/surveys/questionnaire";
import { validateAnswers } from "@/domain/surveys/response";
import { findCredentialByHash, findCredentialById, submitAnonymousResponse } from "@/infrastructure/participation/collection";
import { readValidParticipation } from "@/infrastructure/participation/gate";
import {
  clearParticipationPass,
  readPassCredentialId,
  writeParticipationPass,
  writeSubmissionReceipt,
} from "@/infrastructure/participation/pass";
import { isAdminEntryOpen } from "@/infrastructure/publication-status";

export interface CredentialState {
  error: string | null;
}

function pepper(): string | null {
  const value = process.env.PARTICIPATION_TOKEN_PEPPER?.trim() ?? "";
  return value.length >= 32 ? value : null;
}

export async function acceptCredential(_previous: CredentialState, formData: FormData): Promise<CredentialState> {
  if (!isAdminEntryOpen()) {
    return { error: "A coleta ainda não está aberta nesta instalação." };
  }
  const secret = pepper();
  if (!secret) {
    return { error: "A coleta ainda não está aberta nesta instalação." };
  }

  const format = validateParticipationTokenFormat(String(formData.get("token") ?? ""));
  if (!format.ok) return { error: format.error.message };

  const stored = await findCredentialByHash(await hashParticipationToken(format.value, secret));
  if (!stored) {
    return { error: "Esta credencial não foi encontrada. Confira o texto recebido do seu órgão." };
  }
  const admitted = admitParticipation({
    credentialStatus: stored.status,
    cycleStatus: stored.cycleStatus,
    opensOn: stored.opensOn,
    closesOn: stored.closesOn,
    today: todayInRioGrandeDoNorte(),
  });
  if (!admitted.ok) return { error: admitted.error.message };

  await writeParticipationPass(stored.id);
  redirect("/diagnostico/instrucoes");
}

export async function clearCredential() {
  await clearParticipationPass();
  redirect("/diagnostico");
}

export async function submitSurvey(answers: unknown): Promise<{ error: string | null }> {
  if (!isAdminEntryOpen()) {
    return { error: "A coleta ainda não está aberta nesta instalação." };
  }
  const credentialId = await readPassCredentialId();
  const participation = credentialId ? await readValidParticipation() : null;
  if (!participation || !credentialId) {
    return { error: "A credencial não está mais válida. Volte ao início e informe outra." };
  }

  const official = getOfficialQuestionnaire();
  if (!official) return { error: "O formulário oficial não está disponível." };
  const validated = validateAnswers(
    {
      origin: "official_import",
      versionLabel: official.versionLabel,
      sourceDocument: official.sourceDocument,
      sourceUrl: official.sourceUrl,
      questions: [...official.questions],
    },
    answers,
  );
  if (!validated.ok) return { error: validated.error.message || "Revise as respostas obrigatórias." };

  const stored = await findCredentialById(credentialId);
  if (!stored) return { error: "A credencial não está mais válida. Volte ao início e informe outra." };
  const admitted = admitParticipation({
    credentialStatus: stored.status,
    cycleStatus: stored.cycleStatus,
    opensOn: stored.opensOn,
    closesOn: stored.closesOn,
    today: todayInRioGrandeDoNorte(),
  });
  if (!admitted.ok) return { error: admitted.error.message };

  const saved = await submitAnonymousResponse(
    credentialId,
    answersForStorage(
      official.questions.map((question) => question.code),
      validated.value,
    ),
  );
  if (!saved.ok) return { error: saved.error.message };

  await clearParticipationPass();
  await writeSubmissionReceipt();
  return { error: null };
}
