# Fase eleitoral — especificação inicial

Este documento define a próxima fase do MANDATO depois da validação do núcleo de governo municipal. Ele é uma especificação de produto; não altera ainda o motor de simulação.

## Objetivo

Fazer a eleição parecer consequência dos quatro anos de governo, e não uma tela isolada de votação. O jogador deve reconhecer quais decisões, entregas, crises e grupos sociais construíram sua candidatura.

## Ciclo proposto

1. **Pré-campanha** — o mandato é encerrado com balanço de entregas, caixa, aprovação, confiança por grupo e reputação das secretarias. O jogador decide se será candidato à reeleição e escolhe até três bandeiras.
2. **Campanha** — cada semana oferece uma agenda limitada: reunião com grupos, visita a obra, entrevista, comunicação de crise ou promessa pública. Cada escolha consome recurso de campanha e altera alcance, credibilidade e mobilização.
3. **Debates** — candidatos de oposição apresentam críticas baseadas no histórico real da partida. O jogador escolhe respostas entre prestação de contas, ataque à oposição, proposta nova ou admissão de falha; cada resposta tem risco e efeito sobre grupos diferentes.
4. **Reta final** — pesquisas agregam intenção de voto, rejeição, comparecimento provável e indecisos. Eventos de última hora podem reabrir temas do mandato, mas não devem apagar consequências acumuladas.
5. **Resultado e transição** — vitória, derrota ou segundo turno encerram a eleição com explicação causal. A continuidade preserva promessas, projetos e situação fiscal para o próximo ciclo.

## Identidade política brasileira

- A oposição deve ter linhas ideológicas e estilos retóricos distintos, sem virar caricatura automática.
- Críticas devem citar fatos jogados: obra atrasada, pressão de secretaria, decisão impopular, melhora de serviço ou caixa preservado.
- Debates devem permitir pergunta e réplica, com respostas curtas e consequências legíveis.
- Grupos sociais devem reagir de forma diferente; não haverá uma única “aprovação nacional” suficiente para explicar o resultado.
- Promessas novas geram compromisso futuro e custo de credibilidade se forem incompatíveis com caixa, capacidade administrativa ou prioridades declaradas.

## Contrato mínimo da fase

O primeiro incremento implementável deverá conter apenas: estado eleitoral, dois candidatos de oposição, três semanas de campanha, um debate com pergunta/réplica, pesquisa resumida e resultado explicável. O mandato anterior será somente leitura durante a campanha.

## Gates antes da implementação

- O ciclo de governo deve continuar carregando decisões, projetos, finanças, grupos e memória sem corrupção.
- O resultado eleitoral deve ser determinístico para o mesmo estado e escolhas.
- O modo local deve funcionar antes da API; a persistência online será adicionada por contrato depois.
- Nenhuma tela eleitoral deve substituir o gabinete ou esconder o histórico que fundamenta a disputa.

## Estado atual da implementação

O primeiro incremento está implementado no modo local em `src/app/election-engine.ts`: pré-campanha, três semanas, debate, pesquisa por período, histórico de ações, redistribuição de apoio entre candidaturas e resultado determinístico. A interface apresenta candidatos, pesquisa atual, evolução das medições e trilha da campanha.

O estado também pode ser persistido no modo online por `POST /api/games/:id/election` e consultado por `GET /api/games/:id/election`. A API valida fase, semana, candidatos e formatos dos históricos antes de gravar. A próxima evolução é substituir o armazenamento de estado por eventos eleitorais estruturados, incluindo custo de campanha, comparecimento provável, perguntas e réplicas com efeitos por grupo.
