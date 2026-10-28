# Especificação técnica — PQVST

Plataforma de diagnóstico, acompanhamento e transparência do Programa Estadual de Qualidade de Vida e Saúde no Trabalho, vinculada aos órgãos do Programa de Integridade e Compliance do Rio Grande do Norte.

Referências a conferir em fonte oficial antes da produção: Guia de Implementação do PQVST (CONTROL/RN, janeiro de 2026), Decreto Estadual nº 32.623/2023, Decreto Estadual nº 32.624/2023 e Instrução Normativa nº 2/2025.

## 1. Visão funcional

O sistema transforma percepção dos servidores em IQVST, leitura dos seis eixos e plano de melhoria. Não avalia pessoa, não produz ranking depreciativo e não trata execução de ação como se fosse o indicador de percepção.

O IQVST é a média aritmética das seis médias de eixo. Cada eixo é a média das médias das suas perguntas pontuáveis. Pergunta sem resposta não vira zero. Eixo sem dado impede o indicador. O exemplo do guia produz 3,77 e a classificação Boa.

As faixas oficiais permanecem as do guia. A política de arredondamento para valores entre uma casa e outra está isolada em `CLASSIFICATION_POLICY` e marcada como pendente de homologação.

## 2. Fluxos

Administração estadual cadastra órgãos, membros, questionário, ciclos e publicação. A Comissão Executiva Local consulta o próprio órgão e registra ações. O servidor usa credencial de uso único, lê a privacidade, responde por etapas, revisa e confirma. O visitante vê somente agregado publicado.

Estados do ciclo: rascunho, programado, aberto, encerrado, processado e publicado. Despublicar exige justificativa.

## 3. Arquitetura

O domínio fica em `src/domain` e não depende de React. A interface fica em `src/app` e `src/components`. O acesso ao Supabase fica em `src/infrastructure` e a chave de serviço só existe no servidor.

Stack em uso: Next.js 16, React 19, TypeScript estrito, Tailwind CSS 4, Zod 4, React Hook Form 7, Recharts 3, Supabase JS 2 e Vitest 5.

## 4. Banco

As migrations em `supabase/migrations` separam gestão, credenciais, respostas, indicadores administrativos e fotografias públicas. `participation_credentials` não aponta para `survey_submissions`. As respostas não têm usuário, CPF, matrícula, e-mail nem IP. O painel público lê `aggregate_snapshots` de publicação vigente e não suprimida, por função que não depende de o visitante enxergar a tabela interna de publicação.

As migrations foram escritas e ainda não foram aplicadas a um PostgreSQL.

## 5. Páginas

Públicas: início, programa, metodologia, transparência, órgãos, ações, privacidade e relatório. Servidor: acesso, instruções e questionário. Gestão: painel, órgãos, membros, questionários, ciclos, planos, auditoria e acesso restrito.

## 6. Privacidade

Limite inicial de 10 respostas, sujeito a validação. Abaixo dele, o número não é exibido. Se a omissão de um único eixo permitir reconstituir a média pela fórmula do IQVST, outro eixo também é omitido. O consolidado estadual publicado usa somente órgãos que podem ser divulgados, para que a diferença entre o total e as partes não revele grupo pequeno. Rascunho não vai ao servidor. A recuperação local é explícita.

## 7. MVP implementado agora

Já há catálogo dos eixos, cálculo, classificação provisória, agregação estadual alternativa, supressão, validação de importação, motor do formulário, transições de ciclo e de ação, autorização por papel e telas que distinguem ausência de dado. A persistência, o login e a publicação real ficam para quando a base e o formulário oficial existirem.

## 8. Validação institucional ainda necessária

- Texto e endereço do formulário oficial.
- Regra de itens negativos.
- Fechamento das faixas entre 4,4 e 4,5 e das fronteiras equivalentes.
- Peso estadual por resposta ou por órgão.
- Limite de divulgação e o efeito de excluir órgãos pequenos do número publicado.
- Fonte do quantitativo de elegíveis.
- Retenção, descarte, incidente e base legal.
- Conferência da vigência das normas.

Nada disso deve ser preenchido por suposição no código de produção.
