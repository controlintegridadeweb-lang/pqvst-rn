# PQVST — Rio Grande do Norte

Endereço público: https://pqvst-rn.vercel.app

Plataforma de diagnóstico e transparência do Programa Estadual de Qualidade de Vida e Saúde no Trabalho, no âmbito do PIC/RN.

O questionário oficial ainda não foi importado. A interface não apresenta números fictícios como se fossem resultados publicados.

## Executar

```bash
npm install
npm test
npm run dev
```

Copie `.env.example` para `.env.local` quando houver um projeto Supabase. Sem essas variáveis, as páginas públicas continuam no ar e informam que a base não está conectada.

## Estado

| Parte | Situação |
|---|---|
| Cálculo do IQVST, classificação provisória e testes do exemplo 3,77 | Implementado e testado |
| Supressão de grupo pequeno e omissão complementar | Implementado e testado |
| Motor de questionário, importação e envio único | Implementado e testado |
| Telas públicas, diagnóstico e gestão | Implementado, sem dados oficiais |
| Migrations e RLS | Escritas, não executadas em banco |
| Autenticação Supabase e persistência | Bloqueadas pela ausência do projeto |
| Perguntas oficiais | Bloqueadas até a importação validada |
| Homologação institucional das regras provisórias | Pendente |
| Jornada de ponta a ponta com Playwright | Não executada |

A especificação está em [docs/especificacao-tecnica.md](docs/especificacao-tecnica.md).
