"use client";

import { useRouter } from "next/navigation";
import { submitSurvey } from "@/app/diagnostico/actions";
import { SurveyWizard } from "@/components/survey-wizard";
import { getOfficialQuestionnaire } from "@/domain/surveys/questionnaire";

export function OfficialSurvey() {
  const official = getOfficialQuestionnaire();
  const router = useRouter();
  if (!official) return null;

  return (
    <SurveyWizard
      questionnaire={{
        origin: "official_import",
        versionLabel: official.versionLabel,
        sourceDocument: official.sourceDocument,
        sourceUrl: official.sourceUrl,
        questions: [...official.questions],
      }}
      onSubmit={async (answers) => {
        const result = await submitSurvey(answers);
        if (result?.error) return result.error;
        router.push("/diagnostico/enviado");
        return null;
      }}
    />
  );
}
