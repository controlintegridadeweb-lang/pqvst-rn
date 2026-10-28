# Decisões arquiteturais

## D1 — Questionário oficial ausente

O motor aceita importação marcada como `official_import`, com documento de origem. `getOfficialQuestionnaire` retorna nulo. A interface não recebe perguntas substitutas.

## D2 — Arredondamento provisório

O valor é arredondado para duas casas, half away from zero, e então classificado. De 4,45 a 4,49 a classe provisória é Boa; 4,50 é Excelente. As faixas escritas no guia não foram reescritas. A política pode ser substituída sem alterar os rótulos oficiais.

## D3 — Média das perguntas

Cada pergunta pontuável gera sua média. O eixo é a média não ponderada dessas médias. O IQVST é a média dos seis eixos. Isso impede que um eixo com mais itens domine o indicador.

## D4 — Consolidação estadual

Há duas funções: respostas reunidas e média não ponderada entre órgãos. A publicação provisória usa as respostas reunidas apenas dos órgãos que atingem o limite. A escolha está pendente de homologação e é declarada na metodologia.

## D5 — Credencial separada da resposta

A credencial guarda hash e estado. O consumo não grava identificador de envio. O anonimato diante de um administrador do banco não é absoluto, por causa da proximidade temporal.

## D6 — Rascunho

Não há rascunho no servidor. O navegador só grava se a pessoa marcar a opção, e a recuperação é um comando explícito.

## D7 — Respostas brutas

Nenhum papel de aplicação recebe `read_raw_answers`. A leitura administrativa usa indicadores. A gravação das respostas fica reservada à chave de serviço, que não entra no frontend.

## D8 — Ausência não é zero

Cartões sem publicação mostram "Não disponível". Quantidade desconhecida permanece nula. Gráfico sem série comparável não sugere evolução.
