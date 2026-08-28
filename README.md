# MandatoAppGenerated

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.1.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Estado do protótipo MANDATO

O protótipo é uma simulação local, persistida em `localStorage`, com um ciclo inicial de governo. O motor separado em `src/app/simulation-engine.ts` controla passagem de dias, caixa, indicadores, secretarias, projetos, grupos de opinião e notícias.

## Modo API experimental

O adaptador REST em `src/app/api-game-repository.ts` pode ser ativado sem alterar o save local: no console do navegador, execute `localStorage.setItem('mandato-api-mode', 'API')` e recarregue a aplicação com a API NestJS disponível em `http://localhost:3000`. Nesse modo, criação, carregamento, decisões e avanço diário usam o backend; o identificador é mantido em `mandato-api-game-id`. Sem essa chave, o jogo permanece local. O modo online é experimental e ainda não substitui a persistência local.

No primeiro ciclo, novas decisões são liberadas progressivamente: drenagem do acesso ao hospital, merenda escolar, manutenção de transporte e iluminação pública. Cada escolha pode afetar grupos diferentes da população; obras têm duração e podem melhorar indicadores quando concluídas.

Antes de adicionar API online, autenticação, multiplayer ou sistemas eleitorais, a prioridade é validar este núcleo jogável por pelo menos 7 a 14 dias e ampliar os testes das consequências.

O primeiro capítulo termina no dia 14 com uma avaliação automática baseada em metas concluídas e aprovação. O botão de avanço é encerrado após a avaliação para preservar o resultado do ciclo.

Decisões também podem abrir consequências condicionais. Por exemplo, negar a contratação do hospital pode liberar uma crise de atendimento alguns dias depois; autorizar a contratação libera um acompanhamento de estabilização. Esses caminhos são determinísticos e cobertos por testes.

Transporte e educação seguem o mesmo modelo: a política de ônibus pode terminar em normalização ou paralisação, e a decisão sobre merenda pode gerar melhora de frequência ou falta de alimentos. Isso forma narrativas paralelas dentro do primeiro ciclo.

O motor também acompanha risco fiscal e administrativo: caixa abaixo de uma semana gera atenção, caixa negativo gera crise fiscal e secretarias com pressão elevada perdem eficiência e geram alertas para o gabinete.

Partidas antigas são migradas no carregamento: campos novos como grupos, orçamento, projetos, alertas e metas recebem defaults sem substituir data, caixa, decisões ou histórico já existentes.

Essa migração também inicializa `causalLinks` quando o save ainda não possui vínculos causais, preservando a partida e preparando-a para registrar efeitos nas próximas decisões.

O gabinete exibe a quantidade de decisões pendentes, enquanto decisões resolvidas permanecem acessíveis como memória do processo decisório.

O painel “Atenção imediata” consolida decisões pendentes, risco fiscal, alertas administrativos, projetos em execução e indicadores em queda para orientar a prioridade do jogador.

O gabinete também exibe uma fila de prioridades operacional, ordenando decisões pendentes, projetos atrasados, secretarias pressionadas e risco fiscal. Cada item possui uma ação de navegação que leva o foco ao cartão correspondente sem resolver nada automaticamente.

A memória apresenta uma cadeia de efeitos baseada nos snapshots persistidos, associando decisões resolvidas às variações de serviços e aprovação. O mesmo vínculo pode acumular observações datadas em avanços posteriores, sem duplicar um dia já processado. As dez decisões resolvidas mais recentes também são analisadas para identificar padrões de investimento ou adiamento; escolhas neutras, desconhecidas ou isoladas não criam uma classificação.

As observações causais identificam a área afetada e mostram o valor e a variação diária do indicador, permitindo distinguir manutenção, melhora e deterioração do serviço.

As operações online usam identificadores idempotentes: repetir uma resolução após uma falha de rede retorna o mesmo resultado e não duplica a decisão nem o vínculo causal.

O saldo mensal projetado usa a soma real do orçamento diário das secretarias multiplicada por 30, e a situação fiscal exibida no painel acompanha esse cálculo.

O livro-caixa registra despesas operacionais diárias, custos de decisões e receitas mensais. Partidas antigas recebem um livro vazio na migração e passam a registrar lançamentos a partir do próximo avanço.

O painel de evolução financeira resume entradas, despesas e variação líquida acumuladas do livro-caixa, permitindo acompanhar o desempenho fiscal do ciclo.

O livro-caixa também pode ser filtrado por entradas ou saídas e apresenta barras proporcionais para facilitar a leitura dos lançamentos mais relevantes.

A visão “Caixa por dia” agrupa os lançamentos por data e exibe a variação líquida diária, permitindo identificar a trajetória financeira do ciclo.

O painel também mostra a variação do caixa desde o início da partida e permite comparar o desempenho acumulado com o orçamento real das secretarias.

O orçamento pode ser ajustado durante a partida em incrementos de R$ 500 por dia por secretaria. O limite inferior é zero, e a alteração afeta imediatamente a despesa e o saldo mensal projetado.

O orçamento também influencia a gestão: cortes aumentam gradualmente a pressão e reduzem a eficiência da secretaria afetada; reforços aliviam a pressão e recuperam eficiência.

Projetos associados a secretarias com eficiência abaixo de 55% passam a ser marcados como atrasados, avançam em ritmo reduzido e geram alerta administrativo persistente.

O livro-caixa possui agregação por categoria para separar operação, decisões, projetos e receitas. Essa estrutura prepara o próximo passo de custos progressivos de execução sem perder a rastreabilidade do orçamento.

Projetos com `dailyExecutionCost` geram despesas recorrentes durante a execução; se estiverem atrasados, recebem um sobrecusto de 25% e o lançamento é categorizado como projeto.

Projetos concluídos podem ter `maintenanceCost`, gerando uma despesa diária de conservação sem continuar consumindo o custo de execução.

Projetos concluídos também podem aplicar `dailyIndicatorEffects` e `dailyGroupEffects`, entregando benefícios graduais aos indicadores e aos grupos da população enquanto são mantidos.

Quando a partida possui população, o motor calcula uma variação diária proporcional à aprovação: governos acima de 50% crescem gradualmente e governos abaixo desse nível podem perder habitantes. O valor e a tendência são persistidos.

A variação também considera a qualidade média dos indicadores: bons serviços ampliam o crescimento, enquanto serviços muito baixos podem transformar uma aprovação nominalmente positiva em retração populacional.

Grupos sociais aceitam `populationWeight` configurável; a aprovação geral é uma média ponderada, permitindo representar a influência demográfica de cada grupo sem perder suas satisfações individuais.

O painel “Movimento da cidade” apresenta a população atual e a tendência diária de crescimento, redução ou estabilidade.

## Backup e compatibilidade

As partidas são salvas automaticamente em `localStorage` e também podem ser exportadas como JSON pelo botão “Exportar backup”. A importação aceita somente arquivos com cidade, data, indicadores e decisões válidos; arquivos incompatíveis não substituem a partida atual. O campo `saveVersion` identifica a versão do formato: saves legados são migrados durante o carregamento e regravados na versão atual.

Decisões emergenciais são geradas quando um indicador fica abaixo de 40. Elas afetam o grupo social relacionado, aumentam a pressão e reduzem a eficiência da secretaria responsável. Respostas executadas recuperam parte da capacidade e registram o custo no livro-caixa; decisões mantidas pendentes por três dias escalam a crise uma única vez.

Efeitos temporários podem ser associados a políticas específicas por meio de `activeEffects`. Eles são aplicados no avanço do dia e sofrem decaimento gradual (75% do valor anterior), permitindo representar medidas emergenciais e campanhas públicas sem transformar um bônus pontual em uma alteração permanente do município. O mecanismo aceita indicadores existentes ou futuros e aprovação.

O “Registro do gabinete” exibe decisões pendentes e resolvidas, incluindo a alternativa escolhida. O estado adicional das decisões (`createdDate`, `applied`, `recovered` e `escalationApplied`) é compatível com saves anteriores graças à migração defensiva do carregamento.

No fechamento do dia 14, objetivos ainda em andamento são marcados como `FAILED`, permitindo que a avaliação diferencie metas cumpridas e não cumpridas.

## Reputação social

Cada grupo social possui satisfação diária e reputação acumulada. A satisfação responde rapidamente a decisões, orçamento e eventos; a reputação se aproxima dela lentamente, funcionando como memória política. A aprovação geral combina 70% da satisfação atual e 30% da reputação. Pressões públicas também usam a reputação para calibrar a intensidade da cobrança: grupos historicamente desconfiados reagem mais fortemente a uma nova queda.

## Estado atual do núcleo

O portfólio de projetos diferencia prazo contratual de prazo operacional. A estimativa operacional considera eficiência e pressão da secretaria responsável, risco de atraso e prioridade; essa estimativa também alimenta a projeção de custo dos próximos 30 dias e aparece na comparação de frentes.

As secretarias possuem demandas operacionais específicas, cooldown individual, recuperação gradual após reforço e registro narrativo do retorno à rotina. O estado da recuperação é preservado no modo local e no contrato REST assíncrono.

O gate de PostgreSQL real permanece pendente de execução no ambiente de desenvolvimento: o adapter e os testes mockados estão prontos, mas o Docker Desktop e o serviço PostgreSQL local não puderam ser iniciados pelo ambiente atual.

Baseline atual de validação: o frontend possui 122 testes aprovados no Chrome e build sem warnings; a API possui 103 testes aprovados e verificação TypeScript concluída sem erros.

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
