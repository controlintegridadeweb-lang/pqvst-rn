import type { AxisCode } from "@/domain/indicators/axes";

/**
 * Perguntas lidas dos títulos da planilha de respostas do formulário.
 * A planilha não traz as alternativas. Os itens de percepção usam a escala
 * de concordância de 1 a 5 já prevista na metodologia.
 * Carimbo, e-mail e a coluna de pontuação não são perguntas.
 */
const IDENTIFICACAO = "Órgão e setor";
const BEM_ESTAR = "Bem-estar geral e saúde mental";
const HABITOS = "Hábitos saudáveis";
const AMBIENCIA = "Ambiência e ergonomia";
const EPIS = "Equipamentos de Proteção Individual (EPIs)";
const DESENVOLVIMENTO = "Desenvolvimento Pessoal e Profissional";
const LAZER = "Lazer e Vida Social";
const GESTAO = "Práticas de Gestão do Trabalho";
const CULTURA = "Cultura Prevencionista";
const SUSTENTABILIDADE = "Preservação e Sustentabilidade";

function texto(order: number, prompt: string) {
  return {
    code: `Q${String(order).padStart(2, "0")}`,
    prompt,
    axisCode: null,
    order,
    required: true,
    scale: "open_text" as const,
    scoring: "not_scoreable" as const,
    section: IDENTIFICACAO,
  };
}

function item(order: number, axisCode: AxisCode, section: string, prompt: string) {
  return {
    code: `Q${String(order).padStart(2, "0")}`,
    prompt,
    axisCode,
    order,
    required: true,
    scale: "agreement" as const,
    scoring: "scoreable_positive" as const,
    section,
  };
}

export const OFFICIAL_FORM_SOURCE = {
  origin: "official_import" as const,
  versionLabel: "Formulário do programa",
  sourceDocument: "Cópia de Programa Estadual de Qualidade de Vida e Saúde no Trabalho (respostas).xlsx",
  sourceUrl: null,
  questions: [
    texto(1, "Informe qual órgão ou entidade você atua?"),
    texto(2, "Qual setor está lotado?"),
    item(3, "E1", BEM_ESTAR, "Você se sente bem fisicamente no ambiente de trabalho?"),
    item(4, "E1", BEM_ESTAR, "Você se sente bem mentalmente no ambiente de trabalho?"),
    item(5, "E1", BEM_ESTAR, "Você consegue fazer pausas e momentos de descanso adequados durante o expediente?"),
    item(6, "E1", BEM_ESTAR, "O ambiente de trabalho contribui positivamente para o seu equilíbrio emocional?"),
    item(7, "E1", HABITOS, "Você mantém hábitos saudáveis no dia a dia (alimentação, sono, atividade física)?"),
    item(8, "E1", HABITOS, "A instituição incentiva práticas voltadas à promoção da saúde e do bem-estar?"),
    item(9, "E1", HABITOS, "Você participa ou tem acesso a ações internas sobre saúde e qualidade de vida?"),
    item(10, "E1", AMBIENCIA, "O ambiente físico de trabalho é confortável e adequado às suas atividades?"),
    item(11, "E1", AMBIENCIA, "Os móveis e equipamentos disponíveis são ergonomicamente adequados?"),
    item(12, "E1", AMBIENCIA, "As condições de iluminação, ventilação e ruído são satisfatórias no seu local de trabalho?"),
    item(13, "E1", EPIS, "Você recebe os EPIs necessários para o desempenho das suas atividades?"),
    item(14, "E1", EPIS, "Os EPIs fornecidos são confortáveis e estão em boas condições de uso?"),
    item(15, "E1", EPIS, "Você recebeu orientações sobre o uso correto dos EPIs?"),
    item(16, "E2", DESENVOLVIMENTO, "Você sente que há oportunidades adequadas para o seu desenvolvimento pessoal?"),
    item(17, "E2", DESENVOLVIMENTO, "Você percebe que há oportunidades adequadas para o seu desenvolvimento profissional no órgão/entidade?"),
    item(18, "E2", DESENVOLVIMENTO, "As ações de capacitação e treinamento atendem às suas necessidades e interesses?"),
    item(19, "E2", DESENVOLVIMENTO, "Você considera que a diversidade é respeitada nas oportunidades de desenvolvimento?"),
    item(20, "E2", DESENVOLVIMENTO, "O desenvolvimento oferecido ajuda a alinhar suas competências aos objetivos da instituição?"),
    item(21, "E3", LAZER, "Há oportunidades adequadas de vivências culturais no ambiente de trabalho?"),
    item(22, "E3", LAZER, "Você participa de atividades lúdicas ou recreativas promovidas pela instituição?"),
    item(23, "E3", LAZER, "As atividades de lazer contribuem para o seu bem-estar no trabalho?"),
    item(24, "E3", LAZER, "Essas iniciativas fortalecem os vínculos interpessoais entre os colegas?"),
    item(25, "E3", LAZER, "Você considera que o ambiente de trabalho valoriza momentos de convivência social e lazer?"),
    item(26, "E4", GESTAO, "As rotinas adotadas pela instituição promovem o compartilhamento de responsabilidades entre seus integrantes?"),
    item(27, "E4", GESTAO, "Você se sente motivado(a) pelas práticas de gestão adotadas na instituição?"),
    item(28, "E4", GESTAO, "A gestão do trabalho valoriza a humanização nas relações profissionais?"),
    item(29, "E4", GESTAO, "As decisões institucionais são tomadas de forma participativa, envolvendo os integrantes?"),
    item(30, "E4", GESTAO, "Você sente que sua opinião é considerada nas práticas de gestão do trabalho?"),
    item(31, "E5", CULTURA, "As práticas de prevenção de riscos são incentivadas no ambiente de trabalho?"),
    item(32, "E5", CULTURA, "Há mecanismos para identificar e reduzir riscos no ambiente laboral?"),
    item(33, "E5", CULTURA, "A instituição promove regularmente ações ou treinamentos voltados à prevenção de riscos?"),
    item(34, "E6", SUSTENTABILIDADE, "As práticas de consumo consciente são incentivadas no ambiente de trabalho?"),
    item(35, "E6", SUSTENTABILIDADE, "Você aplica os 7 Rs (repensar, reduzir, reciclar, reutilizar, recuperar, reaproveitar e reintegrar) em suas atividades diárias?"),
    item(36, "E6", SUSTENTABILIDADE, "A instituição promove ações que minimizam os impactos ambientais das atividades laborais?"),
    item(37, "E6", SUSTENTABILIDADE, "Você considera que há conscientização adequada sobre sustentabilidade e preservação ambiental entre os colegas?"),
  ],
};
