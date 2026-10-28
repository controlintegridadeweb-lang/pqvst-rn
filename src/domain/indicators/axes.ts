export const AXIS_CODES = ["E1", "E2", "E3", "E4", "E5", "E6"] as const;

export type AxisCode = (typeof AXIS_CODES)[number];

export interface OfficialAxis {
  code: AxisCode;
  name: string;
  description: string;
  sortOrder: number;
}

/**
 * Catálogo fixo da metodologia.
 * As descrições reproduzem o recorte institucional informado; não são perguntas do diagnóstico.
 */
export const OFFICIAL_AXES: readonly OfficialAxis[] = [
  {
    code: "E1",
    sortOrder: 1,
    name: "Promoção da Saúde e Segurança no Trabalho",
    description:
      "Abrange questões relacionadas ao bem-estar físico, mental e social, condições de trabalho, ergonomia e segurança.",
  },
  {
    code: "E2",
    sortOrder: 2,
    name: "Desenvolvimento de Pessoas",
    description:
      "Abrange desenvolvimento profissional, capacitação, valorização, reconhecimento e oportunidades de crescimento.",
  },
  {
    code: "E3",
    sortOrder: 3,
    name: "Lazer e Vida Social",
    description:
      "Abrange convivência, integração, relações interpessoais, descanso e bem-estar social.",
  },
  {
    code: "E4",
    sortOrder: 4,
    name: "Práticas de Gestão do Trabalho",
    description:
      "Abrange gestão participativa, comunicação, humanização, organização do trabalho e relações institucionais.",
  },
  {
    code: "E5",
    sortOrder: 5,
    name: "Cultura Prevencionista",
    description:
      "Abrange prevenção de riscos, segurança, conscientização e práticas institucionais preventivas.",
  },
  {
    code: "E6",
    sortOrder: 6,
    name: "Preservação e Sustentabilidade",
    description:
      "Abrange consumo consciente, práticas sustentáveis e responsabilidade ambiental no ambiente institucional.",
  },
];

export function axisByCode(code: AxisCode): OfficialAxis {
  const axis = OFFICIAL_AXES.find((item) => item.code === code);
  if (!axis) {
    throw new Error(`Eixo oficial ausente: ${code}`);
  }
  return axis;
}

export function isAxisCode(value: string): value is AxisCode {
  return AXIS_CODES.some((code) => code === value);
}

export function axisRecord<T>(fill: () => T): Record<AxisCode, T> {
  return {
    E1: fill(),
    E2: fill(),
    E3: fill(),
    E4: fill(),
    E5: fill(),
    E6: fill(),
  };
}
