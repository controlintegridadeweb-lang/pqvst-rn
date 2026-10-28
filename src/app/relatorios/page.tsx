import { buildInstitutionalReport } from "@/domain/reports/institutional-report";
import { CLASSIFICATION_POLICY } from "@/domain/indicators/classification";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Relatório" };

export default function ReportPage() {
  const report = buildInstitutionalReport({
    organizationName: "Não publicado",
    cycleName: "Não publicado",
    methodologyId: CLASSIFICATION_POLICY.id,
    generatedAt: "não gerado",
    responseCount: null,
    computation: null,
    suppressed: false,
    comparison: null,
    actions: [],
  });

  return (
    <>
      <PageHeader
        kicker="Relatório institucional"
        title="A exportação acompanha a publicação."
        lede="O relatório reúne órgão, ciclo, metodologia, participantes, IQVST, eixos, limites de leitura e ações vinculadas. Sem publicação, ele não inventa análise."
      />
      <article className="mx-auto max-w-3xl rounded-3xl border border-line bg-raised px-6 py-6">
        <h2 className="text-2xl">Situação</h2>
        <p className="mt-3 text-sm leading-6">{report.reason}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          {report.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="no-print mt-6 text-sm">
          A planilha e a versão para impressão serão emitidas quando existir um agregado autorizado. Nenhum arquivo com
          zeros foi gerado.
        </p>
      </article>
    </>
  );
}
