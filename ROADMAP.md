# Roadmap do MANDATO

## Próxima frente prioritária — experiência mobile-first

Primeiro corte implementado: em telas de até 700 px, a grade passa a uma coluna, decisões e históricos se reorganizam verticalmente, ações recebem área mínima de toque e textos longos podem quebrar dentro dos cards. O build de produção foi validado após a alteração.

Implementação adicional: a tela ganhou navegação por âncoras para Gabinete, Cidade, Finanças e Memória. No celular, a barra permanece compacta, rolável horizontalmente e com alvos de toque confortáveis. Isso é o primeiro passo da futura divisão por áreas; ainda falta transformar os blocos em vistas/abas realmente independentes.

Implementação adicional: em telas estreitas, a navegação por áreas agora usa uma barra inferior fixa, translúcida e rolável, com alvos de toque de 42px e espaço inferior seguro para não cobrir o conteúdo. O contrato dos destinos foi coberto por teste automatizado; build e suíte do frontend foram validados com 159 testes passando.

Implementação adicional: o corte mobile recebeu uma camada de ritmo visual para listas e históricos. Notícias, consequências, livro-caixa, eventos, snapshots, variações e decisões financeiras passam a usar blocos independentes, com espaçamento e áreas de leitura e toque mais claras, evitando a aparência de uma listagem contínua. O build de produção foi validado após o ajuste.

O primeiro ciclo foi construído com foco predominante em desktop e a inspeção em viewport de celular revelou uma experiência inadequada: excesso de largura, blocos longos e controles que perdem hierarquia. Antes de expandir novos sistemas de jogo, a próxima frente deve tratar o mobile como requisito de produto.

Escopo planejado:

- revisar a arquitetura da tela para uma coluna principal no celular, com prioridade clara para atenção imediata, gabinete e avanço do dia;
- transformar grades e painéis secundários em seções recolhíveis, carrosséis ou navegação por abas quando isso reduzir rolagem sem esconder informação essencial;
- garantir que cards, alternativas de decisão, botões e filtros ocupem áreas confortáveis para toque, sem controles grudados;
- substituir dropdowns nativos e listagens extensas por componentes responsivos com estados selecionado, foco, erro e vazio bem definidos;
- criar pontos de quebra reais para celular pequeno, celular grande, tablet e desktop, sem apenas reduzir a fonte;
- validar portrait e landscape em ChromeHeadless/viewport e revisar acessibilidade por teclado, foco visível e contraste;
- preservar a densidade estratégica no desktop, evitando que a solução mobile resulte em uma tela excessivamente espaçada em monitores largos.

Critério de saída: a partida inicial, a decisão do gabinete, o avanço do dia, a leitura de indicadores e o histórico devem ser utilizáveis em viewport móvel sem overflow horizontal, sobreposição de texto ou ações difíceis de tocar. Cada grande bloco visual deve ter teste de componente ou validação de viewport antes de a frente ser considerada concluída.

## Frente futura — navegação por áreas do governo

Depois da fundação mobile-first, a experiência deve deixar de depender de uma página única e extensa. A proposta é organizar o jogo em áreas navegáveis, mantendo o gabinete como tela operacional principal:

- **Gabinete**: decisões pendentes, atenção imediata, indicadores essenciais e ação de avançar o dia;
- **Cidade**: opinião pública, grupos sociais, secretarias e sinais de pressão;
- **Finanças**: caixa, receitas, despesas, orçamento, dívida, projetos e livro-caixa;
- **Memória e notícias**: acontecimentos, consequências, cadeia de efeitos e linha do tempo;
- **Metas e avaliação**: objetivos do ciclo, progresso, diagnóstico e transição para o próximo ciclo;
- **Configurações da partida**: backup, importação, modo de armazenamento e encerramento.

No celular, essas áreas devem usar navegação inferior ou menu compacto; no desktop, podem usar navegação lateral ou superior persistente. A tela inicial da partida não deve virar uma landing page puramente decorativa: ela precisa comunicar o estado do governo e levar rapidamente à decisão relevante. A divisão será testada com tarefas reais do jogador, preservando links diretos, contexto da data atual e retorno fácil ao gabinete.

## 28/08/2026 — regressão e paridade interna aprovadas

O gate dedicado `npm run test:parity` foi criado na API e cobre a jornada determinística de 14 dias, incluindo resolução da primeira decisão, comparação do estado final e comparação após recarga persistida. A regressão completa foi executada: frontend com 159 testes no Chrome Headless e API com 129 testes Jest aprovados. A cobertura do adaptador HTTP confirma as rotas de criação, leitura, decisão, avanço, continuação, foco, orçamento e persistência eleitoral. Esta evidência confirma a consistência interna atual, mas não substitui o próximo gate de comparação direta entre o `SimulationEngine` do frontend e a API HTTP real.

O primeiro gate HTTP real foi executado contra a API online usando PostgreSQL: uma partida foi criada, uma decisão foi resolvida, o dia foi avançado e o estado foi recarregado sem perder a data. Em seguida, uma jornada de 14 avanços resolveu 10 decisões pendentes conforme surgiram e chegou a 15/01/2025; a recarga preservou a data, com 5 indicadores, 14 snapshots, 30 registros de histórico, 30 notícias e 6 lançamentos no livro-caixa. Esta validação comprova a persistência e o fluxo REST reais, mas a comparação numérica lado a lado com o motor local ainda permanece como próximo refinamento.

O frontend agora possui um normalizador próprio de paridade, com teste automatizado para comparar estados local/API sem considerar IDs gerados ou `daysRemaining`, que é derivado da data. Ele preserva diferenças funcionais de caixa, indicadores, decisões e datas. O próximo passo permanece conectar esse normalizador a uma jornada executável nos dois runtimes; a suíte atual não trata equivalência como concluída apenas por validar o contrato HTTP.

O estado inicial do frontend foi centralizado em `simulation-state-factory.ts`, com teste dedicado para os valores estruturais da partida e a decisão inicial. A duplicação antiga dentro do componente foi removida; a suíte completa permanece verde com 159 testes. Isso reduz o risco de o fluxo local e os fixtures de paridade evoluírem a partir de definições diferentes.

Foi criado o primeiro artefato executável da jornada canônica de paridade em `parity-journey.ts`: 14 avanços, resolução determinística pela primeira alternativa e projeção de campos comportamentais (data, caixa, população, aprovação, indicadores, decisões pendentes, histórico, notícias, livro-caixa e snapshots). O teste verifica repetibilidade e ignora identidades geradas. Esse artefato prepara a comparação com a resposta equivalente da API; a igualdade entre os dois runtimes ainda não foi declarada.

O backend agora também expõe a mesma projeção comportamental em `src/parity-journey.ts`, com teste de uma jornada REST/domínio de 14 dias. As duas bases já usam os mesmos nomes de campos comparáveis e removem IDs gerados; falta apenas conectar essas projeções em um runner único que execute e compare os dois processos.

O runner `npm run compare:parity` foi criado em `D:\Projetos\mandato-api\scripts\compare-parity.mjs`. Ele executa 14 avanços contra a API HTTP, resolve as decisões pela primeira alternativa, normaliza o resultado e compara campo a campo com uma projeção local JSON. O comando falha quando há divergência e imprime os campos local/remoto; a validação ponta a ponta depende da API estar executando e de um arquivo de projeção local fornecido pelo frontend.

## 28/08/2026 — gate online PostgreSQL validado

A API atual foi validada em execução contra o PostgreSQL local. Uma partida foi criada e recarregada pelo contrato assíncrono; a contagem do health check passou de 8 para 9, a decisão inicial foi resolvida e o avanço diário chegou a 02/01/2025 com o tesouro atualizado. O provider online está comprovado além dos testes unitários.

Na mesma validação, uma partida percorreu 14 dias completos pela API, foi recarregada em 15/01/2025 e preservou memória, notícias, ledger, finanças e decisões condicionais do ciclo.

## 28/08/2026 — orçamento de estilos alinhado à interface atual

O limite de estilo por componente foi ajustado de forma explícita para 30 kB de aviso e 32 kB de erro. A mudança acompanha a tela rica em painéis, estados e controles modernos sem remover a proteção contra crescimento descontrolado do CSS.

## 27/08/2026 — resumo financeiro visual

O resumo de despesas deixou de ser uma sequência de parágrafos e passou a apresentar cartões por operação, decisões e projetos, com valor, participação proporcional e barra de leitura. O cálculo continua usando o livro-caixa existente e recebeu teste de participação por categoria. Frontend: 153 testes aprovados e build de produção concluído.

## 27/08/2026 — filtros de marcos com navegação previsível

Ao trocar a categoria dos marcos, a paginação agora retorna automaticamente à primeira página. Isso evita uma tela vazia quando o jogador estava consultando uma página alta e escolhe um filtro menor. A regressão foi coberta; frontend: 152 testes aprovados e build de produção concluído.

## 27/08/2026 — marcos do governo paginados

A área de marcos agora preserva o filtro por categoria, mas apresenta no máximo quatro registros por página, com navegação acessível e contador. O histórico completo permanece no estado da partida; a mudança reduz a rolagem e mantém a leitura do progresso do governo focada. Frontend: 151 testes aprovados e build de produção concluído.

## 27/08/2026 — gabinete em fila focada

O gabinete passou a exibir uma única decisão pendente por vez, priorizada pela urgência, com navegação anterior/próxima e contador de posição. Isso preserva todas as decisões, mas reduz a sobrecarga visual e concentra o jogador na escolha atual. A regra foi coberta por teste de navegação; frontend: 150 testes aprovados.

## 27/08/2026 — normalização das datas em narrativas

As listas de legado institucional, transições de planejamento e marcos do governo passaram a usar o mesmo normalizador visual das demais telas. Isso elimina datas ISO embutidas em textos (inclusive quando o boletim repete a própria data) e mantém o padrão brasileiro `dd/mm/aaaa` em toda a experiência. A regressão foi adicionada à suíte; frontend: 149 testes aprovados e build de produção concluído.

## Fase atual — diagnóstico que orienta o próximo ciclo

A avaliação de cada ciclo agora registra a área mais fraca do município. Ao iniciar os 30 dias seguintes, a primeira meta é gerada dinamicamente para recuperar essa área, em vez de sempre priorizar saúde. A regra está espelhada no motor local e na API e coberta pelas jornadas de continuação.

O resultado também gera um registro próprio de legado institucional, limitado aos seis marcos mais recentes. Esse registro preserva nota, metas concluídas e prioridade deixada para o próximo ciclo, além de aparecer no gabinete junto da memória diária.

Na transição, a nota também produz um efeito social temporário: governos bem avaliados começam com crédito entre moradores e servidores; governos sob pressão começam com desconfiança entre moradores e famílias. O efeito é pequeno, decai diariamente e fica explicado no legado.

Projetos atrasados agora abrem uma decisão administrativa de recuperação, com escolha entre reorganizar a execução e recuperar confiança ou aceitar o atraso e prolongar o desgaste. A decisão usa o mecanismo normal de grupos, memória e resolução do jogo.

A criação foi validada diretamente nos motores: a decisão nasce no mesmo avanço em que a frente é identificada como atrasada, com proteção contra duplicação.

O ciclo completo também está coberto: a decisão pode ser resolvida e seus efeitos de confiança social são aplicados pelo resolvedor normal da API; o motor local possui teste equivalente para a criação da decisão.

Projetos concluídos agora abrem uma decisão de legado: ampliar o benefício com investimento adicional ou consolidar o serviço preservando caixa e fortalecendo confiança social. A escolha utiliza os efeitos e o livro-caixa já existentes.

O contrato tipado do frontend online também foi alinhado: legado, efeitos sociais das opções e detalhes de custos/efeitos dos projetos agora são reconhecidos na integração REST.

O evento recorrente de movimentação do centro agora aplica sua consequência financeira real: apoiar a programação desconta R$ 80 mil no caixa nos dois motores, além dos efeitos sociais já exibidos na decisão.

As alternativas do mesmo evento também foram alinhadas politicamente: apoiar registra aprovação positiva e preservar o caixa registra desgaste moderado, evitando que a interface prometa uma consequência diferente da simulação.

O apoio à programação agora gera um desdobramento três dias depois: o comércio retorna ao gabinete pedindo continuidade, com uma nova escolha entre investir mais um ciclo ou encerrar a iniciativa. A cadeia é criada uma única vez e está espelhada nos motores local e API.

Essa cadeia passou a ter cobertura explícita de teste nos dois lados: criação no prazo, resolução durante a jornada e proteção contra duplicação.

As opções do desdobramento também passaram a exibir no gabinete a projeção de custo e aprovação, mantendo a leitura da interface coerente com a regra simulada.

O adiamento de uma crise de chuva agora gera, dois dias depois, uma cobrança corretiva dos moradores, com escolha entre reparar por R$ 120 mil ou aceitar a continuidade do atraso. O encadeamento e a proteção contra duplicação estão alinhados nos motores.

A jornada dessa crise agora também está coberta no backend: o teste confirma o adiamento, o avanço do tempo e a abertura posterior da cobrança. A suíte da API passou a 100 testes.

O gabinete também exibe a projeção dos dois caminhos da cobrança climática, incluindo variação de infraestrutura, pressão social e custo corretivo.

O motor local também ganhou teste explícito para o encadeamento climático e a não duplicação da cobrança. A suíte do frontend passou a 114 testes.

Cada registro causal agora mantém também o `decisionId` de origem, permitindo reconstruir tecnicamente as cadeias de consequências na linha do tempo. A normalização da paridade assíncrona ignora apenas esse identificador gerado, preservando a comparação dos efeitos do jogo.

O painel de cadeia de efeitos passou a identificar visualmente os registros que são desdobramentos de decisões anteriores, usando o vínculo causal sem expor IDs técnicos. A suíte do frontend passou a 115 testes.

Quando a decisão encadeada possui uma decisão-pai conhecida, o painel agora exibe também sua origem legível, por exemplo “Origem: Chuva adiada”. Isso transforma o vínculo técnico em contexto útil para o jogador.

O contrato REST tipado do frontend também passou a transportar `parentDecisionId`, preservando a origem das decisões encadeadas no modo online.

As jornadas de comércio e clima agora verificam explicitamente o vínculo pai-filho, além da criação única das cobranças. A API permanece com 100 testes e o frontend com 115.

O contrato público `GameDecisionContract` da API agora declara formalmente `parentDecisionId`, evitando que clientes online dependam de propriedades implícitas para reconstruir cadeias.

O acabamento visual da cadeia diferencia o aviso de desdobramento e a origem da decisão-pai, mantendo a leitura rápida do gabinete.

Os registros da cadeia agora recebem profundidade visual proporcional ao desdobramento, com recuo no painel para separar consequências de decisões originais.

O cálculo de profundidade foi tornado recursivo e limitado a quatro níveis, permitindo representar cadeias futuras com múltiplos desdobramentos sem risco de ciclo infinito.

O relatório de ciclo agora compara o primeiro e o último snapshot, exibindo a variação da aprovação, da qualidade média dos serviços e do caixa. Partidas antigas sem snapshots suficientes continuam compatíveis, com os campos opcionais.

O bloco comparativo recebeu acabamento responsivo: os três deltas ficam lado a lado em telas largas, empilham-se em telas estreitas e usam cores semânticas para alta e queda.

## Fase 1 — Núcleo local jogável (concluída)

Criação da partida, gabinete, decisões, avanço diário, indicadores, finanças básicas, grupos sociais, secretarias, projetos, população, memória e avaliação do primeiro ciclo.

## Fase 2 — Cidade viva e leitura estratégica (em andamento)

Boletins contextuais, crises emergenciais, escalada por atraso, linha do tempo, métricas de governo, histórico de decisões, backups e migração versionada de saves. A fase também já inclui orçamento com efeito gradual nos serviços, pressão social por grupo, apoio público, reputação histórica, efeitos temporários e revisões administrativas periódicas.

O segundo ciclo já possui validação automatizada de 30 dias: a avaliação encerra na data prevista, revisões operacionais e uma agenda estratégica de recuperação do indicador mais fraco surgem periodicamente, e indicadores, grupos e secretarias permanecem limitados e numéricos. O próximo corte local é melhorar a explicação causal nas notícias e objetivos. O jogo exibe explicitamente o modo de armazenamento e ignora um save corrompido sem quebrar a inicialização.

## Fase 3 — Persistência online compatível

Formalizar DTOs, validação e testes de paridade entre o `SimulationState` local e a API. O backend já expõe o núcleo operacional, gera eventos de educação e transporte, executa consequências encadeadas de hospital, projetos, pressão fiscal/administrativa, efeitos temporários, agenda estratégica, revisões operacionais, metas, livro-caixa, continuação de ciclos e diagnóstico, com 38 testes e build validados. O roteiro determinístico do primeiro dia também foi comparado com as referências do motor local, cobrindo data, caixa, saúde e decisão resolvida. No frontend, o gabinete prioriza decisões pendentes por urgência, o último avanço exibe variações agrupadas em Serviços, Finanças, Governo e Cidade, e o Diário do avanço permite consultar datas anteriores a partir dos snapshots, listar decisões, receitas/despesas, registros históricos, projetos e alertas, com filtro por tipo e mensagem para filtros vazios. Também foi adicionado um teste de jornada completa de 14 dias e um cenário comparativo entre investimento e contenção, validando avaliação, caixa, snapshots, desbloqueios e trajetórias divergentes; a suíte do frontend soma 71 testes e o build foi validado. O orçamento de estilo está ajustado explicitamente para 6 kB de aviso e 8 kB de erro, compatível com a tela atual sem remover a proteção contra crescimento excessivo. O adapter PostgreSQL isolado e o schema JSONB estão prontos, mas a troca do provider ainda depende da migração assíncrona e da validação do ambiente Docker.

## Fase 4 — Cliente local/online (parcialmente concluída)

A API agora também possui jornada automatizada de 14 dias; sua suíte soma 40 testes e o build NestJS passa, mantendo a validação do ciclo equivalente ao frontend. Resoluções e avanços aceitam `x-operation-id` opcional e repetição da mesma operação devolve o resultado já processado, evitando efeitos duplicados após timeout; o registro agora fica no estado persistido da partida e foi validado após recriar o serviço.

A retenção do histórico idempotente é limitada às 100 operações mais recentes por partida, evitando crescimento indefinido do save sem perder a proteção contra reenvios recentes.

O conteúdo do primeiro ciclo também foi alinhado entre os motores: a API online agora libera, no décimo dia, a decisão de iluminação pública já existente no modo local, com alternativas de agir ou adiar e registro narrativo correspondente.

As opções de decisão da API passaram a aplicar também os `groupEffects` declarados no próprio evento. Isso permite que novas decisões e consequências encadeadas afetem moradores, famílias, trabalhadores e comerciantes de forma específica, mantendo o motor extensível.

Decisões resolvidas pela API agora também ajustam gradualmente a eficiência da secretaria responsável: respostas construtivas recuperam capacidade, enquanto adiamentos e crises geram perda moderada. O efeito se soma às revisões operacionais e à pressão diária, sem substituir esses sistemas.

O motor local foi alinhado a essa regra e inicializa as secretarias antes da primeira decisão, garantindo que o efeito administrativo exista desde o primeiro dia mesmo em saves antigos ou recém-criados.

Foi acrescentado o primeiro nível contínuo de sustentabilidade fiscal: a folga de caixa diante do custo operacional e o peso da dívida formam um índice de 0 a 100, atualizado diariamente e usado na avaliação do ciclo. O índice está disponível no contrato local e da API, preservando os alertas fiscais como mensagens explicativas.

O índice agora também aparece como cartão próprio no painel principal, permitindo que o jogador acompanhe a sustentabilidade fiscal ao lado de caixa, dívida, aprovação e população durante as decisões.

O resumo financeiro passou a exibir também a projeção de saldo para 30 dias e uma classificação simples da situação (`equilibrado` ou `sob pressão`), usando orçamento e receita mensal previstos. A composição por operação, decisões e projetos continua disponível no mesmo painel.

O cartão de sustentabilidade fiscal ganhou estados visuais de atenção abaixo de 60% e crítico abaixo de 30%, mantendo contraste e leitura responsiva para comunicar risco financeiro sem depender somente da cor ou do número.

As agendas estratégicas agora contextualizam o risco fiscal: quando a sustentabilidade fica abaixo de 60%, o texto da decisão informa que investir reduz a margem de segurança e que preservar caixa protege a margem. O modo local expõe a mesma leitura nos impactos de cada opção.

O status textual da evolução financeira e a tendência fiscal do painel passaram a usar o índice contínuo de sustentabilidade, mantendo a projeção de 30 dias como sinal complementar. Assim, o cartão, o resumo e a leitura de tendência refletem a mesma situação financeira.

O cartão fiscal também possui descrição acessível via `aria-label`, informando o percentual atual para tecnologias assistivas sem depender do estado visual ou da cor.

Foi criado o primeiro evento fiscal reativo: abaixo de 60% de sustentabilidade, o gabinete recebe uma decisão de contenção. A alternativa de contenção reduz 5% do orçamento diário com pequeno custo político; manter os gastos preserva a capacidade imediata, mas aumenta o desgaste. A regra existe nos motores local e API.

Essa decisão agora possui teste dedicado de sequência completa na API: disparo após caixa reduzido, registro do custo político, aplicação da contenção e verificação da redução do orçamento no dia seguinte.

A dívida passou a ser um campo explícito do estado local e participa do cálculo de sustentabilidade sem acesso indireto por `any`; um teste compara dois cenários com caixa igual e endividamento diferente.

O primeiro fluxo da dívida foi implementado: no início de cada novo mês, 0,5% do saldo devedor é lançado como serviço mensal no livro-caixa e descontado do tesouro. O ciclo inicial de 14 dias permanece inalterado, enquanto a jornada estendida já considera o compromisso recorrente.

Após 1º de fevereiro, o gabinete pode renegociar a dívida: amortizar R$ 2 milhões para reduzir R$ 10 milhões do saldo ou refinanciar, recebendo R$ 500 mil e aumentando o saldo em R$ 5 milhões. As duas alternativas estão disponíveis nos motores local e API.

O motor local agora possui teste dedicado para a abertura da renegociação na virada de fevereiro; a suíte comprova que a jornada estendida libera o evento sem alterar o ciclo inicial.

O cenário fiscal reativo também foi validado no motor local, incluindo a abertura progressiva da decisão junto aos demais eventos do primeiro ciclo. A interface mantém o cartão, o status textual e os impactos das opções sincronizados com a sustentabilidade fiscal.

O frontend soma 73 testes validados; o relatório do ciclo agora identifica o estilo de governo predominante sem impor uma estratégia vencedora.

O modo online também exibe o estado da conexão da API (verificando, conectada ou indisponível) durante criação, carregamento, decisões, avanço e continuação, sem substituir silenciosamente a partida online por uma local.

Ao ativar o modo API, o cliente realiza uma verificação explícita em `/health` antes da criação da partida e registra sucesso ou indisponibilidade no indicador visual.

Há também um botão explícito de reconexão quando a API fica indisponível; ele repete somente o health check e não altera a partida.

Resoluções, avanços e continuações online agora usam uma guarda de requisição em andamento e desabilitam os controles durante a sincronização, evitando duplicação acidental em redes lentas.

Se houver um identificador de partida online salvo e a conexão voltar enquanto a tela ainda não possui uma partida carregada, o cliente tenta recuperar automaticamente o estado pelo endpoint de carregamento.

A camada local já está isolada por repositório, com backup, recuperação de save inválido e indicação visual do modo de armazenamento. O modo online opt-in já cobre criação, carregamento, decisões, avanço diário e continuação de ciclo, com conversão comprovada entre contrato REST e estado local. Ainda falta autenticação, sincronização concorrente e recuperação automática de reconexão.

## Fase 5 — Mandato de médio prazo

Quando a capacidade administrativa entra em nível crítico, o gabinete agora recebe uma decisão explícita de reorganização temporária das equipes. A reorganização custa R$ 250 mil, reduz a pressão das secretarias e recupera eficiência; a alternativa de aceitar a sobrecarga preserva caixa, mas mantém o risco operacional. O fluxo foi auditado e testado com a mesma regra no motor local e na API.

O segundo ciclo agora possui uma contingência de infraestrutura: a partir de 22 de janeiro, deterioração do indicador ou atraso de projeto pode abrir um plano preventivo de abastecimento. A decisão oferece prevenção ou adiamento, com efeitos sociais distintos para moradores e famílias, e está alinhada com a API.

Expandir além do primeiro ciclo com políticas continuadas, manutenção, contratos de serviço, dívida e novos eventos condicionais. Validar equilíbrio antes de ampliar o escopo político.

A economia agora registra a composição da última arrecadação em tributos próprios, atividade comercial e transferências. A composição é transportada pelo contrato online e exibida no painel local/online; decisões que alteram a confiança dos comerciantes passam a repercutir naturalmente na fonte comercial nos fechamentos seguintes.

Os programas econômicos persistentes também aparecem no painel com seus bônus acumulados, tornando visível a consequência de médio prazo das escolhas do gabinete.

A cobertura da API comprova as duas trajetórias: o incentivo aumenta a receita comercial e a modernização aumenta os tributos próprios no fechamento mensal seguinte. O núcleo econômico permanece limitado a três níveis por política para preservar o equilíbrio.

A capacidade administrativa passou a ser calculada diariamente a partir da eficiência e da pressão das secretarias, persistida no estado e exposta também no contrato online. A modernização tributária contribui modestamente para esse índice.

A capacidade administrativa agora também participa da execução de projetos: em níveis críticos abaixo de 50%, obras em andamento entram em risco de atraso e recebem o custo/velocidade correspondentes, mantendo a regra alinhada entre os motores.

Em níveis ainda mais críticos, abaixo de 45%, a desorganização também reduz gradualmente os indicadores de serviço, conectando a saúde interna das secretarias à experiência diária da população.

O mesmo nível crítico agora reduz discretamente a satisfação dos grupos e a população, representando desgaste social e pressão de saída acumulados.

Quando essa situação crítica é atingida, o gabinete registra um alerta causal único explicando a relação entre capacidade administrativa, qualidade dos serviços, satisfação social e permanência da população. Isso evita que o jogador veja apenas números mudando sem entender a causa.

Quando um grupo social cai abaixo de 45% de satisfação, o governo registra um boletim social específico, uma única vez por grupo, indicando que aquele segmento passou a pressionar o gabinete. A regra é compartilhada com a API e prepara o terreno para reações públicas mais complexas sem antecipar sistemas eleitorais.

No mesmo limiar, o gabinete agora pode abrir a decisão “exige resposta do governo”: dialogar recupera parte da confiança do grupo, enquanto ignorar a pressão amplia o desgaste. A decisão é deduplicada e usa os efeitos sociais já suportados pelo motor, mantendo a interação simples e auditável.

A reputação histórica passou a modular essa decisão nos dois motores: grupos com reputação abaixo de 50% respondem com apenas 60% do efeito, enquanto grupos acima de 75% respondem com 125%. A satisfação do dia deixa de ser a única variável de opinião pública; a memória política passa a influenciar a eficácia das respostas.

A dinâmica populacional agora também produz boletins quando a variação diária é relevante (cinco moradores ou mais), explicando que crescimento ou perda refletem a aprovação e a qualidade média dos serviços. A regra utiliza o mesmo cálculo e a mesma mensagem causal no modo local e na API.

O painel financeiro deixou de exibir uma receita mensal fixa: ele soma as fontes reais de tributos próprios, atividade comercial e transferências presentes no estado da partida. O saldo projetado usa essa mesma receita dinâmica, evitando que a interface contradiga o motor econômico.

O painel de projetos agora expõe o custo diário de execução e sinaliza visualmente obras em risco de atraso por pressão administrativa. Esses campos são opcionais no contrato para manter compatibilidade com partidas antigas e respostas da API sem o novo metadado.

Foi feita uma auditoria de corte antes da próxima expansão: o build do frontend e o build NestJS continuam aprovados. A suíte do frontend já havia validado 127 casos; a suíte da API foi iniciada, mas o processo ficou sem saída e precisará ser investigado separadamente antes de usar uma nova mecânica como base de confiança. Por isso, eleições e outros sistemas políticos permanecem fora do próximo corte até a validação do backend ser concluída.

A investigação confirmou que a suíte completa da API passa com `MANDATO_ASYNC_PROVIDER=file`: 10 suítes e 113 testes aprovados. A execução usando PostgreSQL real ainda não deve ser tratada como suíte automatizada, pois depende do processo externo e pode manter o pool aberto quando o ambiente não está disponível; o build e a validação funcional do PostgreSQL seguem separados. O núcleo local permanece o gate para novas mecânicas.

Para tornar esse gate repetível, a configuração do Jest agora força `MANDATO_ASYNC_PROVIDER=file` por meio de `src/jest.setup.ts`. O `.env` continua livre para usar PostgreSQL em desenvolvimento, enquanto testes unitários e de contrato não dependem de porta, senha ou processo externo. A suíte foi executada novamente: 10 suítes e 113 testes aprovados.

O planejamento ganhou uma primeira decisão de prioridade: a partir do segundo ciclo, uma obra em andamento pode receber foco acelerado ou continuar no ritmo normal. A prioridade aumenta a velocidade em 35%, adiciona R$ 5.000 ao custo diário e eleva a pressão da secretaria; o modo normal preserva caixa e capacidade. A regra e a indicação visual estão alinhadas entre API e motor local.

O ciclo estendido agora também apresenta uma segunda frente concreta: o Corredor de mobilidade integrada. Autorizar a proposta investe R$ 280.000 e inicia uma obra de transporte; com mais de uma obra simultânea, capacidade administrativa abaixo de 70 passa a sinalizar atraso e aplicar a penalidade operacional em ambas as frentes. Adiar a proposta preserva recursos e capacidade.

O gabinete agora resume o portfólio de obras com o custo diário total das frentes, prazo estimado restante, prioridade acelerada e risco administrativo. A comparação é derivada do estado persistido e está disponível no modo local e online, ajudando o jogador a decidir antes de abrir ou priorizar uma nova frente.

As propostas de projeto também passaram a exibir uma prévia explícita de investimento e consequência na própria opção do gabinete, incluindo o custo de abertura da segunda frente de mobilidade.

As opções de projeto agora exibem projeções numéricas determinísticas de prazo, investimento inicial e custo diário quando o modelo dispõe desses dados; escolhas sem projeção quantitativa continuam mostrando apenas seus efeitos qualitativos.

O gabinete também calcula a projeção contextual a partir do estado atual: autorizar mobilidade informa o desembolso acumulado em oito dias e o ganho previsto de transporte; priorizar uma obra calcula o prazo restante acelerado e o custo de execução até a entrega. Essas estimativas são apresentadas antes da confirmação e não alteram o estado da partida.

As projeções passaram a mostrar também o saldo estimado ao fim da execução e, quando aplicável, a variação do indicador afetado. O resultado é uma comparação de cenário antes da confirmação, mantendo explícita a natureza estimada do cálculo.

As alternativas agora são apresentadas em cartões paralelos, com hierarquia visual própria, descrição, impacto, projeção e botão acessível por alternativa. O layout se adapta à largura da tela sem alterar as regras do jogo.

O portfólio ganhou filtros por todos/em execução/em risco e ordenação por prioridade/risco, custo diário ou prazo restante. A ordenação é apenas uma visão do estado e não altera a simulação.

Quando existem múltiplas frentes ativas, o gabinete agora mostra uma comparação lado a lado das duas mais relevantes, incluindo prazo restante, custo diário, retorno estimado do indicador e pressão administrativa. A seleção é determinística e não altera o estado da partida.

Essa comparação agora inclui uma leitura contextual não prescritiva: identifica risco urgente, entrega próxima, melhor retorno relativo ao custo ou ritmo equilibrado. A recomendação explica o motivo e nunca confirma uma decisão automaticamente.

O gabinete passou a consolidar o portfólio ativo em uma visão geral: número de frentes, custo diário total, quantidade em risco, capacidade comprometida e retorno agregado por custo. Isso permite avaliar o equilíbrio do plano antes de iniciar outra obra.

O resumo agora classifica o portfólio como saudável, pressionado ou sobrecarregado, justificando o estado com a capacidade administrativa, os riscos ativos e a quantidade de frentes. A classificação é contextual e não bloqueia decisões por conta própria.

Quando duas ou mais obras permanecem ativas com capacidade abaixo de 70, a cidade registra um alerta causal único no boletim e na memória: a sobrecarga reduz o ritmo das frentes e aumenta o risco de atraso. A mensagem é deduplicada para preservar a leitura do diário.

A capacidade administrativa agora incorpora a carga real do portfólio: cada frente ativa consome uma unidade de capacidade e uma frente prioritária consome duas. Ao reduzir ou concluir frentes, a pressão deixa de ser permanente e a capacidade pode se recuperar gradualmente pela eficiência das secretarias.

Snapshots passaram a guardar também a capacidade administrativa, permitindo que o gabinete exiba a tendência diária como “Recuperando”, “Em desgaste” ou “Estável”, com a variação numérica e uma mensagem acessível.

As mudanças de faixa do portfólio agora ficam registradas na memória: a primeira classificação apenas inicializa o estado, e transições posteriores geram uma narrativa causal única por mudança, preservando uma história coerente do planejamento.

O gabinete ganhou uma linha do tempo dedicada às transições de planejamento, separando esses marcos dos boletins cotidianos e permitindo acompanhar a entrada em pressão, sobrecarga e eventual recuperação do governo.

Uma segunda visão de “Marcos do governo” agora reúne entregas de obras, alertas de atraso, manutenção, fechamentos mensais e renegociações, oferecendo uma história operacional compacta ao longo do mandato.

Os marcos podem ser filtrados por Obras, Administração, Finanças ou Sociedade, além da visão completa, permitindo analisar a trajetória do governo por dimensão sem alterar os registros originais.

O contrato online foi alinhado aos novos metadados de planejamento: projetos transportam `priorityMode` e a partida transporta `portfolioStatus`, permitindo reconstruir a mesma leitura do portfólio após carregar um save pela API.

Um teste HTTP de jornada estendida confirma que esses metadados atravessam o endpoint assíncrono e permanecem disponíveis após avanço e recarregamento da partida.

As preferências de leitura do gabinete (filtro de projetos, ordenação do portfólio e filtro de marcos) agora são persistidas separadamente no navegador e restauradas ao reabrir a aplicação; elas não alteram o save local nem o estado remoto.

A decisão de reorganização administrativa também contextualiza a carga real do portfólio: quando há obras em execução, informa quantidade de frentes e custo diário consumido, nos motores local e API.

O resumo do portfólio agora projeta o custo dos próximos 30 dias, somando execução restante das obras ativas e manutenção das obras entregues, diferenciando manutenção normal, reduzida e adiada.

Essa projeção agora recebe uma leitura contextual: margem preservada, cautela acima de 60% do caixa ou atenção quando supera o caixa disponível. A mensagem é informativa e não bloqueia escolhas.

Uma reorganização aprovada agora recupera o risco de obras ativas atrasadas depois do processamento diário, conectando a intervenção administrativa diretamente ao ritmo do portfólio. O motor local possui regressão específica dessa recuperação.

O backend também ganhou regressão equivalente: a resolução de `reorganize-secretariat` recupera o risco de uma obra atrasada. A suíte da API passou a 102 testes.

Quando a reorganização é aprovada, obras ativas marcadas como atrasadas recuperam o risco normal e o gabinete registra o efeito no portfólio; aceitar a sobrecarga não aplica essa recuperação.

Essa contextualização ganhou regressões dedicadas nos dois motores, comprovando a leitura de quantidade de obras e custo diário no cenário de capacidade crítica.

O fluxo de reconexão foi validado: depois de uma falha temporária no carregamento, o cliente mantém a partida vazia e o contexto visual intactos, refaz o health check quando solicitado e carrega novamente o estado remoto completo após a recuperação, incluindo `portfolioStatus`.

Operações online que falham por rede agora guardam o mesmo `x-operation-id` e podem ser repetidas pelo botão “Tentar novamente”. O contrato REST aceita esse identificador explicitamente para resolução, avanço e continuação, preservando a idempotência mesmo quando a primeira resposta não chega ao cliente.

A operação pendente também é mantida em `sessionStorage`, permitindo sobreviver a uma atualização da página durante a falha sem transformar o retry em uma nova operação. A sessão é limpa assim que a API confirma o resultado.

Cada projeto em execução agora apresenta um cenário estimado de 30 dias, reunindo caixa consumido, variação do indicador da área, efeito agregado sobre a satisfação social e pressão sobre a capacidade administrativa. Projetos concluídos exibem que o cenário passou a ser de manutenção.

O cenário de 30 dias foi conectado ao estado atual: o saldo final projetado considera o caixa da partida, a variação do indicador parte do valor vigente e a pressão administrativa diferencia frentes prioritárias das normais. A projeção permanece informativa e não muta o save.

Essa leitura visual agora tem cobertura de componente: uma obra atrasada renderiza o aviso de pressão administrativa e seu custo diário no gabinete.

## Fora do escopo atual

A arrecadação mensal agora varia de forma limitada conforme aprovação, população e confiança dos comerciantes, com a mesma fórmula nos motores local e API. O boletim de fechamento explica causalmente se o resultado ficou acima, abaixo ou na referência do orçamento.

Eleições, vereadores, Câmara, bairros, licitações, mapas, multiplayer e autenticação só devem entrar depois que o núcleo de governo municipal estiver validado e estável.

## Manutenção preventiva de projetos — concluída

Antes de transformar manutenção em uma nova decisão, o modelo deverá respeitar quatro invariantes: somente projetos concluídos podem entrar em manutenção; a escolha deve registrar custo no livro-caixa; reduzir ou adiar manutenção deve produzir deterioração mensurável e limitada nos efeitos do projeto; e o resultado deve ser idêntico no motor local e na API.

Como preparação compatível, projetos concluídos agora carregam explicitamente `maintenanceMode`, iniciado como `NORMAL` quando o campo não existe. O estado foi adicionado ao contrato local/API e já é exibido no painel, sem mudar a manutenção automática atual.

Após a conclusão, o gabinete agora abre uma decisão de manutenção por projeto, com as opções de manter o padrão normal ou adiar. A escolha persiste `NORMAL` ou `ADIADA` no projeto nos dois motores; a deterioração e os custos diferenciados permanecem como subetapa seguinte, ainda protegida pelos invariantes acima.

A manutenção adiada agora evita o custo normal e aplica deterioração diária limitada nos efeitos do projeto e na satisfação dos grupos, registrando um alerta no histórico. A manutenção normal continua registrando a despesa e preservando os efeitos positivos.

A decisão passou a incluir também a alternativa `REDUZIDA`: cobra metade do custo recorrente e preserva metade dos efeitos positivos da obra. O risco permanece normal, diferenciando redução controlada de adiamento completo.

Projetos concluídos com manutenção adiada também aparecem na seção “Atenção imediata”, conectando o risco persistente da obra à fila de prioridades do gabinete.

A manutenção preventiva de projetos está validada nos dois motores: manutenção normal registra o custo e preserva os efeitos, a reduzida cobra metade e preserva metade, a adiada evita a despesa e deteriora indicadores e satisfação de forma limitada, e a mesma resolução repetida permanece idempotente. Há cobertura para impacto social/indicador e limites numéricos.

## Capacidade de planejamento — implementada

As decisões de prioridade, a comparação de projetos concorrentes, os cenários de 30 dias, o custo diário, o risco administrativo, o efeito social e os alertas causais já estão implementados e alinhados entre o motor local e a API. A interface também permite ordenar e filtrar o portfólio, acompanhar marcos e entender se a capacidade está saudável, pressionada ou sobrecarregada.

## Fila de prioridades do gabinete — concluída

A fila de atenção operacional já está disponível no gabinete: decisões pendentes, obras atrasadas, secretarias pressionadas e risco fiscal são ordenados por urgência e recebem uma justificativa. Cada item possui ação “Ver item”, que leva o foco diretamente ao cartão correspondente sem tomar decisões automaticamente. A navegação é apenas visual e funciona sobre o estado local ou carregado pela API.

## Consequências encadeadas de médio prazo — concluída

Depois da fila, o próximo corte deve permitir que escolhas repetidas ou adiadas formem consequências encadeadas mais legíveis ao longo de semanas, conectando decisões, notícias, grupos sociais, capacidade administrativa e metas sem introduzir ainda eleições, Câmara, bairros, licitações ou multiplayer.

Como primeiro corte dessa fase, o gabinete agora apresenta uma cadeia temporal dos últimos snapshots, associando a decisão registrada no dia às variações medidas em serviços e aprovação e ao sinal político resultante. A leitura é derivada do estado persistido, não altera a simulação e permanece disponível em partidas locais e online.

Limite conhecido: essa cadeia ainda é uma leitura derivada no cliente. A próxima mudança estrutural deverá adicionar vínculos causais persistidos ao estado compartilhado, com migração defensiva, registro no avanço diário e teste de paridade entre API e motor local. Isso evitará que a explicação dependa apenas de heurísticas textuais do histórico.

O primeiro vínculo persistido já foi implementado: a resolução registra causa, efeito inicial e sinal; o avanço diário pode preencher `observedEffect` com os valores medidos de serviços e aprovação. O campo é opcional, limitado aos vínculos recentes e a paridade assíncrona continua coberta pela suíte da API.

A observação foi refinada para indicar a área afetada, a variação diária do indicador e a satisfação média dos grupos sociais. Assim, a cadeia conecta resultado administrativo, percepção da cidade e aprovação sem substituir os dados originais do motor.

O recorte de grupos efetivamente afetados e associação às metas também foi implementado e está refletido no painel visual. O próximo recorte seguro é consolidar equilíbrio e paridade nos ciclos estendidos antes de abrir a fase eleitoral.

Esse recorte foi iniciado: vínculos causais agora persistem `affectedGroups` derivados dos efeitos sociais da opção e `objectiveIds` derivados da área/tema da decisão. O registro é opcional e compatível com partidas antigas; a próxima subetapa é expor esses metadados na cadeia visual e substituir inferências textuais por relações configuradas nas decisões.

A cadeia visual agora expõe os grupos envolvidos e as metas relacionadas quando esses dados existem. Partidas antigas continuam exibindo a cadeia anterior, sem campos vazios artificiais.

A relação hospitalar já possui uma verificação de integração: autorizar contratação registra o grupo de trabalhadores e a meta de saúde tanto no fluxo HTTP quanto no serviço do motor. Isso fixa o contrato antes de ampliar o catálogo de relações configuradas.

As observações agora calculam a satisfação somente dos grupos associados ao vínculo causal. O fallback para `satisfação média` permanece ativo em saves antigos, preservando compatibilidade sem mascarar a ausência de metadados.

As alternativas pendentes também passam a indicar previamente quais grupos podem perceber a medida. A prévia revela o alcance social, mas não os valores numéricos, mantendo espaço para incerteza e consequências emergentes.

Pressões públicas resolvidas agora podem retornar quando a insatisfação persistir, após um intervalo mínimo de três dias e sem sobreposição de crises pendentes. O primeiro ID legado permanece intacto e recorrências usam a data para manter histórico distinto.

Demandas por secretaria — implementadas: alertas persistentes de saúde, educação, transporte, infraestrutura e segurança agora geram decisões específicas, com cooldown próprio, bloqueio de sobreposição e efeitos sociais e operacionais coerentes com cada área. A recuperação administrativa global continua tratando capacidade sistêmica; demandas de área tratam apenas a operação da secretaria correspondente.

Critério de implementação: cada demanda deverá ter uma definição comum de custo, variação de pressão, variação de eficiência, indicador relacionado e grupos afetados, compartilhada pelo motor local e pela API. A decisão só será liberada quando esse catálogo puder ser aplicado e testado de forma idêntica nos dois fluxos.

Primeiro caso implementado: quando a pressão da Secretaria de Saúde ultrapassa 85%, surge uma demanda operacional específica. Reforçar a equipe custa R$ 180 mil, reduz pressão e recupera eficiência; adiar preserva o caixa, mas aumenta pressão e desgaste social. A demanda é limitada a uma pendência por vez e está alinhada entre os dois motores.

Segundo caso implementado: Educação agora possui demanda própria quando supera 85% de pressão. Reforçar a rede custa R$ 160 mil e recupera eficiência; adiar preserva caixa e aumenta o desgaste nas escolas. Os efeitos sociais e a resolução estão alinhados entre modo local e API.

Terceiro caso implementado: Transporte agora possui demanda operacional própria quando supera 85% de pressão. Reforçar a operação custa R$ 140 mil e recupera eficiência; adiar preserva caixa, mas aumenta atrasos e desgaste de moradores e comércio. O fluxo está alinhado nos dois motores.

Quarto caso implementado: Infraestrutura agora possui demanda operacional própria quando supera 85% de pressão. Autorizar reparos custa R$ 220 mil e recupera eficiência; adiar preserva caixa, mas aumenta o desgaste de moradores e famílias. O fluxo está alinhado nos dois motores.

Quinto caso implementado: Segurança agora possui demanda operacional própria quando supera 85% de pressão. Reforçar a prevenção custa R$ 190 mil e recupera eficiência; adiar preserva caixa, mas aumenta a sensação de insegurança para moradores e comércio. O fluxo está alinhado nos dois motores.

As demandas operacionais das secretarias agora respeitam cooldown individual de cinco dias após a resolução. Isso evita repetição imediata da mesma cobrança, sem impedir que uma nova sobrecarga reapareça depois de um intervalo de recuperação.

Uma resposta de reforço agora deixa cinco dias de recuperação gradual para a secretaria: a pressão recebe redução adicional de 0,5 ponto por dia, com o contador persistido no estado local e online. Adiamentos continuam sem recuperação positiva.

O gabinete passou a exibir essa recuperação por secretaria, com a quantidade de dias restantes em texto acessível. A leitura permite acompanhar a recomposição da capacidade sem inferir o estado apenas pela barra de pressão.

Ao terminar a recuperação, o boletim registra que a secretaria voltou a operar sem o reforço temporário. O encerramento narrativo completa o ciclo entre decisão, recuperação observável e retorno à rotina.

O estado de recuperação gradual também foi incluído no contrato REST tipado do cliente, garantindo que partidas carregadas no modo online mantenham o contador e a indicação visual no gabinete.

O painel de secretarias agora resume o impacto operacional de cada área em linguagem direta: pressão pode reduzir o ritmo das entregas, eficiência pode favorecer a execução ou o funcionamento pode estar equilibrado. A leitura é derivada dos mesmos valores usados pelo motor.

Cada projeto agora explicita também a secretaria responsável e sua leitura operacional atual, conectando capacidade administrativa, risco de atraso e ritmo de entrega na mesma visão do portfólio.

As previsões de 30 dias das obras agora incorporam essa leitura operacional da secretaria responsável, deixando explícito no cenário quando a capacidade favorece ou limita o ritmo estimado.

O prazo operacional estimado agora considera eficiência da secretaria, atraso administrativo e prioridade da obra. O prazo contratual continua separado, permitindo comparar a meta original com a capacidade real de execução.

O prazo operacional também passou a aparecer na lista principal de projetos, ao lado do prazo estimado original, permitindo identificar imediatamente o impacto da capacidade administrativa no cronograma.

A projeção financeira do portfólio agora usa o prazo operacional para estimar o custo de execução em 30 dias. Uma secretaria sobrecarregada, portanto, afeta simultaneamente prazo e caixa projetado, tornando o trade-off administrativo financeiramente observável.

A comparação de frentes e a recomendação de prioridade também passaram a usar o prazo operacional, eliminando divergência entre o cenário financeiro, a ordenação estratégica e o cronograma exibido.

O prazo operacional foi mantido na lista principal com marcação semântica própria, permitindo refinamento visual futuro sem alterar o cálculo ou ultrapassar o orçamento atual de estilos.

O gate de PostgreSQL permanece pendente de execução no ambiente real: o Docker CLI está instalado, mas o Docker Desktop/daemon não estava disponível durante a validação. Os adapters, contratos e testes mockados continuam aprovados; a próxima verificação deve subir `postgres:16-alpine` e repetir a jornada assíncrona completa.

Uma nova verificação do daemon confirmou a mesma condição, sem acesso ao engine Linux do Docker. A pendência continua restrita à validação de infraestrutura real; não há evidência para declarar o provider PostgreSQL em produção.

Também foi localizado um serviço PostgreSQL 18 instalado no Windows, porém parado e sem permissão para ser iniciado pelo ambiente atual. A validação real permanece pendente de disponibilidade administrativa do serviço ou do Docker Desktop.

O feedback de conclusão da recuperação foi validado nos dois fluxos: a mensagem entra uma única vez no boletim quando o contador chega ao último dia, sem duplicação de notícias.

Foram adicionados cenários de domínio para comprovar o consumo do contador, a redução diária de pressão e o registro da conclusão no motor local e na API.

Auditoria de consistência confirmou o fluxo completo do estado: resolução, persistência do contador, redução diária, exibição no gabinete e registro único da conclusão estão alinhados entre o motor local e a API.

Primeiro encadeamento intersecretarial: a resposta operacional de Transporte agora repercute levemente na aprovação geral (+0,15 ao reforçar; −0,10 ao adiar), além dos efeitos específicos sobre moradores e comércio. A regra está alinhada entre os dois motores.

Segundo encadeamento intersecretarial: adiar reparos de Infraestrutura aumenta a pressão do Transporte em 2 pontos; adiar o reforço de Segurança aumenta a pressão da Saúde em 1,5 ponto. São repercussões pequenas, limitadas e alinhadas nos dois motores.

Infraestrutura agora possui um encadeamento positivo adicional: autorizar os reparos cria a frente persistente “Reparos urbanos emergenciais”, com seis dias de execução, custo operacional diário e efeitos graduais no indicador e nos grupos sociais. A frente não é duplicada se a decisão for repetida.

Após a resolução, o vínculo causal preserva também a intensidade configurada por grupo (`groupEffects`) e a cadeia mostra a direção desse impacto. A prévia continua qualitativa; o valor só aparece como resultado registrado depois da escolha.

As alternativas pendentes agora também apontam as metas do ciclo relacionadas ao tema da decisão. Essa indicação é uma orientação de planejamento, não uma promessa de que a meta será cumprida.

O resumo do estilo de governo também passou a considerar padrões acumulados: repetição de investimentos reforça a leitura de resposta, enquanto repetição de adiamentos ou contenções reforça a leitura de prudência. Uma escolha isolada não é suficiente para criar um padrão, evitando conclusões precipitadas.

A análise considera as dez decisões resolvidas mais recentes, permitindo que a orientação percebida do governo mude com o tempo. Ritmos normais e opções desconhecidas ficam fora da classificação, e essa regra possui cobertura específica no frontend.

Obras atrasadas agora geram desgaste social diário pequeno e limitado nos grupos associados ao próprio projeto, com tendência negativa visível e regra espelhada entre API e motor local.

O boletim diário passou a registrar também a variação do dia em aprovação, qualidade dos serviços e caixa, tornando mais legível a consequência imediata de cada avanço.

A avaliação do ciclo agora oferece uma leitura de continuidade: identifica a margem dos serviços, a situação fiscal, projetos atrasados e a prioridade sugerida para o próximo ciclo.

Ao iniciar a continuação do mandato, a tela apresenta o contexto herdado do novo ciclo: projetos em execução, atrasos, prioridade inicial e caixa disponível.

As metas passaram a indicar explicitamente o estado (em andamento, concluída ou não concluída), com título adaptado ao ciclo atual e tratamento seguro para metas de caixa com alvo zero.

Backups com `saveVersion` maior que a versão suportada agora são recusados no importador, evitando carregar silenciosamente um formato futuro incompatível; versões antigas continuam passando pela migração existente.

## Marco atual

### Próxima frente de experiência: hierarquia visual e síntese

A validação visual identificou uma dívida de interface: há muita informação textual para a quantidade de elementos visuais disponíveis, e alguns painéis — especialmente tendências, linha do tempo, variações, resumo histórico e leitura da trajetória — ainda parecem relatórios empilhados em vez de um painel de decisão. Essa frente fica registrada para a fase de refinamento, sem bloquear o núcleo atual:

Essa reformulação deverá ser conduzida com critério de especialista em UX de produtos digitais e jogos. O objetivo não é apenas modernizar cores ou arredondar cards: a interface precisa criar vontade de continuar jogando, transmitir progresso e consequência, ser agradável de explorar e evitar a sensação de formulário ou página web antiga. Cada mudança deverá ser avaliada por hierarquia, ritmo de leitura, clareza da próxima ação, feedback, emoção, acessibilidade, responsividade e coerência visual; nenhum componente será alterado em lote sem verificar seu efeito na experiência completa.

- reduzir texto repetido e transformar explicações extensas em detalhes sob demanda;
- destacar primeiro o que exige ação, depois o que explica a situação;
- converter variações numéricas em sinais visuais e valores arredondados;
- corrigir a apresentação de valores ausentes para não exibir `—%` como se fosse dado;
- agrupar trajetória, tendência e recomendação em uma leitura única;
- transformar linha do tempo e histórico em componentes mais escaneáveis;
- usar ícones, badges, barras, chips e estados visuais com parcimônia;
- revisar espaçamento e densidade em desktop e mobile;
- validar a nova hierarquia com uma jornada real de 14 dias antes de expandir os sistemas.

### Gate PostgreSQL real concluído

Com o PostgreSQL existente da máquina, foi validada uma jornada HTTP assíncrona completa: criação de partida, resolução da decisão inicial, 14 avanços idempotentes e leitura final persistida. A partida de validação chegou a 15/01/2025 sem erro, com estado financeiro, histórico e novas decisões retornados pelo provider PostgreSQL. A confirmação SQL pode ser feita consultando a tabela `public.games` pelo ID gerado na validação.

O ajuste de orçamento foi exposto também na API síncrona e assíncrona. A mutação valida a secretaria, impede valores negativos e persiste o novo custo diário, aproximando o modo online da experiência administrativa já disponível no app local. A API foi recompilada com 113 testes aprovados; o frontend passou a 127 testes aprovados.

Os controles de orçamento do frontend agora usam a API quando a partida está online e continuam usando o repositório local no modo offline. O retorno do servidor substitui o estado exibido, evitando que uma alteração administrativa online fique apenas na memória do navegador.

Baseline de validação atualizado: API com 110 testes aprovados e TypeScript sem erros; frontend com 126 testes aprovados no Chrome e build concluído sem warnings.

- Núcleo local: ciclo inicial de 14 dias jogável, com decisões, indicadores, grupos, secretarias, finanças, projetos, população, memória, persistência local e avaliação.
- Cidade viva: eventos recorrentes e condicionais de comércio, clima e transporte, com cooldown, custos e efeitos sociais.
- API: domínio ampliado, snapshots, ledger, avaliação, idempotência e testes de jornada; ainda em fase de paridade e persistência antes de se tornar fonte principal.
- Fora de escopo nesta etapa: eleições, vereadores, bairros, licitações e multiplayer.

### Visão futura: ciclo eleitoral brasileiro

As eleições ficam planejadas como uma fase própria, posterior à validação do governo municipal. A intenção é que o período eleitoral seja consequência do mandato jogado e tenha identidade política brasileira, sem se limitar a uma tela de “votação”. A fase deverá estudar e prototipar:

- período de pré-campanha e campanha com calendário e limites de tempo;
- oposição formada a partir dos problemas, promessas não cumpridas e decisões do mandato;
- candidatos com perfis, prioridades, reputações e estilos de comunicação diferentes;
- debates com perguntas entre candidatos, réplicas, tréplicas e direito de resposta;
- perguntas sobre saúde, educação, caixa, obras, segurança e decisões controversas do governo;
- acusações, comparações de resultados, cobrança por promessas e respostas políticas com consequências;
- linguagem, situações e tensões reconhecíveis do contexto brasileiro, sem caricatura vazia;
- influência da aprovação, satisfação dos grupos, desempenho dos serviços, finanças, notícias e memória do governo;
- promessas de campanha que possam orientar o próximo ciclo e gerar compromissos futuros;
- resultado eleitoral e transição, com continuidade, derrota ou mudança de projeto de cidade.

Critério de qualidade: a eleição deverá parecer uma consequência emocional e política dos anos de governo, permitindo ao jogador reconhecer por que a população apoia, rejeita ou questiona sua candidatura. Essa fase só começa depois que o ciclo de governo, a cidade viva, a persistência e o equilíbrio estiverem suficientemente estáveis.

Primeiro evento de cidade viva implementado: em dias recorrentes, uma demanda do comércio sobre a movimentação do centro oferece uma escolha entre apoiar a programação com gasto imediato ou preservar o caixa, com efeitos sociais nos moradores e comerciantes. O evento é determinístico, não duplica e respeita urgências pendentes.

O evento possui cobertura na jornada da API, incluindo surgimento no dia esperado e unicidade da decisão.

As ocorrências condicionais de chuva e transporte usam cooldown de sete dias, evitando que uma crise repetitiva domine a partida e preservando espaço para recuperação e novas escolhas.

Critério de expansão: cada evento novo precisa de gatilho observável, cooldown ou unicidade, custo coerente, efeitos sociais explícitos e cobertura automatizada antes de outro lote ser iniciado.

Regra de fila: ocorrências urgentes de cidade viva não são empilhadas simultaneamente. A primeira demanda bloqueia novas urgências até ser resolvida, preservando a capacidade limitada de atenção do gabinete e tornando a sequência de crises legível.

As respostas de adiamento agora também encadeiam consequência: aguardar a chuva deteriora levemente a infraestrutura e monitorar a interrupção deteriora levemente o transporte no avanço seguinte.

Projetos em execução e sem atraso agora funcionam como proteção positiva: uma frente de Infraestrutura reduz a chance de crise climática e uma frente de Transporte reduz a chance de interrupção, enquanto projetos atrasados deixam de oferecer essa proteção.

Ao concluir uma obra, o governo recebe uma pequena recuperação de aprovação (+0,2), criando um retorno positivo proporcional à entrega e equilibrando o desgaste dos atrasos.

A projeção financeira de 30 dias do portfólio agora recebe leitura visual e textual contextual: margem preservada, cautela ou atenção quando os compromissos projetados se aproximam ou superam o caixa disponível.

A preocupação principal dos grupos sociais agora é recalculada diariamente a partir do indicador mais fraco entre suas áreas relacionadas, com fallback seguro para saves antigos. Isso conecta o desempenho dos serviços ao que a população cobra no gabinete sem alterar satisfação diretamente.

Quando a satisfação de um grupo cai abaixo de 45%, o gabinete agora recebe uma reação social contextual. A cobrança informa a preocupação dominante, considera a reputação histórica do grupo e oferece diálogo ou minimização, com unicidade por data para evitar decisões repetidas.

Essa reação social também foi espelhada na API, incluindo o contexto de subfinanciamento, a reputação histórica e os efeitos de diálogo ou minimização. A jornada local e a jornada remota agora mantêm o mesmo gatilho e a mesma estrutura de decisão.

Resolver uma reação social agora tem consequência de governo: acolher o grupo recupera 0,25 ponto de aprovação e alivia levemente a secretaria relacionada; minimizar reduz 0,35 ponto de aprovação e aumenta sua pressão. O efeito é deliberadamente pequeno, para que a decisão componha a trajetória do mandato sem substituir o desempenho dos serviços.

Pressões sociais persistentes agora também podem abrir uma proposta de recuperação estratégica. Se autorizada, ela cria uma obra real com custo de R$ 240 mil, prazo de seis dias, efeitos diários no indicador relacionado e recuperação gradual do grupo afetado. A proposta é única por partida e respeita a existência de projetos já ativos.

As decisões e obras originadas por pressão social agora são identificadas na interface com um resumo do grupo afetado e da origem da agenda, ajudando o jogador a entender por que a proposta apareceu antes de escolher.

O ciclo pós-entrega foi revisado e recebeu cobertura adicional: uma obra concluída abre a decisão de próximo passo, enquanto a manutenção permanece como compromisso recorrente separado. Isso confirma que a entrega continua produzindo escolhas e custos depois de sair da fase de execução.

O avanço diário agora registra um relatório de marco a cada sete dias, reunindo qualidade média dos serviços, aprovação, satisfação social, caixa e número de obras em execução. O marco é salvo na memória e nas notícias com proteção contra duplicação, criando pontos de acompanhamento da trajetória do mandato.

A interface agora interpreta os snapshots recentes em uma leitura de trajetória: governo em melhora, estável ou em deterioração. O resumo aponta o fator dominante entre serviços, aprovação, confiança social e caixa, sem substituir os valores detalhados do histórico.

Essa leitura agora gera uma recomendação contextual não automática: estabilizar finanças quando necessário, recuperar capacidade administrativa sob sobrecarga, priorizar o serviço mais frágil, reconstruir confiança social ou consolidar entregas quando o governo estiver estável.

O prefeito agora pode adotar a recomendação como foco temporário por sete dias. O foco é persistido na partida, aparece no painel, expira automaticamente e não bloqueia decisões diferentes; no modo online, a ação permanece desabilitada até existir o endpoint correspondente.

O foco temporário foi conectado ao modo online: a API oferece `POST /games/:id/focus`, registra a métrica de linha de base e devolve o estado atualizado. A operação passa pela ponte assíncrona e pelo mesmo repositório da partida, mantendo a persistência coerente com as demais mutações.

Diretriz visual reforçada: o MANDATO não deve parecer um painel administrativo genérico ou uma página de WordPress. Listagens devem ser tratadas como experiências de jogo, com cards expressivos, hierarquia clara, cor contextual, microinterações e resumos acionáveis. A ação principal de cada turno deve ficar em uma área própria e visualmente evidente, sem competir com os cards de informação.

O Diário do avanço e o Livro-caixa recente foram convertidos de listas corridas em registros de evento: cada item agora possui identidade, tipo, contexto, valor e leitura visual própria, com comportamento responsivo. Textos narrativos também removem repetições comuns de datas embutidas, enquanto metadados extensos da cadeia de efeitos ficam recolhidos até serem solicitados.

Os painéis estratégicos de saúde do governo, tendências, confiança por grupo e histórico receberam o mesmo tratamento: métricas são agrupadas em cartões semânticos, reputações usam linhas comparáveis e snapshots têm mais ritmo vertical. O objetivo é que a leitura estratégica pareça parte do jogo e não uma tabela administrativa.

O ajuste de orçamento deixou de ser uma tabela de botões soltos: cada secretaria agora é apresentada como uma decisão visual própria, com verba destacada, controles maiores, estados de interação e separação clara entre áreas. O limite de estilo do build foi revisado para acompanhar a evolução do sistema visual sem transformar o crescimento em falha de compilação.

A opinião pública agora usa cartões por grupo, com satisfação, tendência e preocupação organizadas numa leitura única. Saúde atual, tendências e reputações receberam hierarquia equivalente, reforçando a regra de que os indicadores devem responder rapidamente à pergunta “quem está reagindo e por quê?”.

O resumo financeiro também foi elevado para uma leitura de jogo: entradas, despesas, variação líquida e projeção de 30 dias agora têm cartões semânticos, cores de contexto e hierarquia própria, permitindo identificar rapidamente margem, pressão e direção do caixa.

O ajuste de orçamento agora apresenta uma prévia orientativa para cada secretaria: o jogador consegue visualizar o custo aproximado de um ajuste de R$ 500/dia ao longo de 30 dias e a direção provável sobre a capacidade do serviço. A prévia é deliberadamente aproximada; o motor continua sendo a autoridade para os efeitos reais.

Programas econômicos ativos agora aparecem como cartões de política continuada, com benefício explícito, barra de nível e progressão até o nível 3. Isso transforma uma variável interna do estado em uma escolha de médio prazo compreensível, sem criar novas regras de equilíbrio.

A adoção de foco online agora é idempotente no comportamento de estado: enquanto houver foco ativo, uma nova tentativa preserva o foco e sua linha de base, sem reiniciar os sete dias. A rota também rejeita rótulos vazios e métricas desconhecidas.

O avanço diário da API agora também consome o foco temporário, compara o resultado com a linha de base e registra o relatório de encerramento, mantendo a mesma semântica do motor local.

Ao expirar, o foco compara sua métrica de origem com a linha de base registrada na adoção e grava um relatório de resultado — melhorou, permaneceu estável ou piorou — na memória e nas notícias. Assim, a prioridade de curto prazo passa a ter começo, acompanhamento e encerramento observável.

Marco de validação retomado em 27/08/2026: o motor local passou por 56 testes, incluindo a jornada de 30 dias do segundo ciclo, mantendo datas, indicadores, população, caixa, projetos e decisões dentro dos limites definidos. A API passou por 113 testes em 10 suítes, cobrindo os repositórios local, arquivo e PostgreSQL, sem falhas. O próximo recorte deve melhorar a clareza causal e a apresentação dos eventos estratégicos, preservando o núcleo de simulação validado antes de ampliar para eleições.

A apresentação causal recebeu uma correção de acabamento: narrativas agora arredondam automaticamente casas decimais técnicas excessivas, evitando que valores internos do motor apareçam como sequências ilegíveis na cadeia de efeitos. A regra ficou coberta por teste do componente e não altera o estado persistido.

Na cadeia de efeitos, removida uma renderização duplicada do resultado de cada evento. A interface agora apresenta uma única leitura causal por item, com o sinal traduzido para linguagem visual amigável, reduzindo ruído e excesso de informação sem perder contexto.

As causas da cadeia de efeitos também passaram a usar o formatador central de narrativas. Datas e rótulos embutidos ficam consistentes com o restante da interface, evitando que uma mesma área exiba formatos diferentes.

O Diário do avanço agora pagina os eventos em grupos de cinco, com navegação anterior/próxima e contador de página. A mudança preserva filtros por tipo e evita que o histórico cresça indefinidamente na tela.

O diário deixou de truncar os registros antes da paginação: todos os eventos do dia permanecem disponíveis para navegação, enquanto a tela continua limitada a cinco cards por página. O comportamento foi coberto por teste, incluindo avanço de página e retorno automático ao primeiro resultado quando o filtro muda.

Ao resolver uma decisão no gabinete, a seleção agora avança para a próxima pendência prioritária. No modo online, a seleção é limpa para que a resposta recebida pela API determine a próxima decisão exibida. Isso mantém o foco do turno coerente sem exigir que o jogador procure novamente a fila.

A navegação do Diário agora reinicia explicitamente a paginação quando o jogador troca a data ou o filtro. Isso evita páginas vazias e torna a leitura do histórico previsível em qualquer combinação de filtros.

O painel de datas das decisões agora filtra na origem somente decisões resolvidas, eliminando linhas ocultas e espaços vazios. Todas as resoluções continuam acessíveis, com as datas no formato brasileiro.

O Registro do gabinete deixou de ser silenciosamente limitado às oito decisões mais recentes: agora exibe seis por página e oferece navegação explícita pelo histórico completo. A mudança foi validada com teste de paginação.

O Registro do gabinete também se protege contra troca de partida ou redução do histórico: se a página atual deixar de existir, ela é ajustada automaticamente para a última página válida, evitando uma tela vazia.

Os controles de paginação do Diário e do Registro do gabinete receberam rótulos acessíveis e regiões de navegação sem alterar o comportamento visual, tornando a consulta do histórico mais clara para teclado e tecnologias assistivas.

Os filtros de data e tipo do Diário e o filtro do Livro-caixa receberam rótulos acessíveis explícitos, garantindo que a função de cada select continue clara para tecnologias assistivas.

Os painéis secundários de Registro, Datas e Impacto financeiro receberam tratamento de cartões compactos, com hierarquia entre estado, título e detalhe, espaçamento respirado e microinteração discreta ao passar o cursor. A leitura deixou de parecer um conjunto de parágrafos soltos sem introduzir ruído visual.

As metas do ciclo passaram a comunicar estado com tratamento visual próprio: concluídas, em andamento e falhas têm contraste e cores semânticas distintos, enquanto a descrição foi reduzida visualmente para preservar a hierarquia do progresso. O frontend foi revalidado com 130 testes e build de produção concluído.
### 2026-08-27 — Escalada das demandas administrativas

- Implementada na API a escalada automática de demandas de secretaria que permanecem pendentes por três dias.
- A escalada reduz gradualmente o indicador relacionado e a satisfação do grupo afetado, aumenta a pressão da secretaria e registra notícia, histórico e alerta administrativo.
- Adicionado teste de regressão específico; suíte completa da API validada com 10 suítes e 114 testes aprovados.

### Marco atual de validação — 27/08/2026

- Frontend: 134 testes aprovados no Chrome Headless e build de produção concluído.
- API: 10 suítes e 114 testes aprovados, com build NestJS concluído.
- O núcleo de governo municipal permanece validado; eleições, vereadores, bairros, licitações e multiplayer continuam deliberadamente fora do escopo desta fase.

O gate de persistência real também foi validado no PostgreSQL instalado localmente: a API reportou `persistence: postgres`, criou uma partida, avançou de 01/01/2025 para 02/01/2025 e a leitura posterior recuperou a mesma data, caixa e histórico. O Docker permanece opcional para este ambiente, pois a instalação existente atende ao desenvolvimento local.

A jornada online mínima foi ampliada: além de criar, avançar e recarregar, a API resolveu a decisão do hospital no PostgreSQL, avançou até 03/01/2025 e recuperou a decisão como `RESOLVED` junto com o histórico persistido. O ciclo central de mutação online está validado no ambiente local real.

Após a validação real, a suíte automatizada da API permaneceu íntegra: 10 suítes e 114 testes aprovados, com build NestJS concluído. O gate de persistência e o gate de regressão agora estão fechados para o núcleo atual.

Com os gates do núcleo municipal e da jornada PostgreSQL validados, a especificação inicial da próxima fase eleitoral foi separada em [`docs/FASE-ELEITORAL.md`](docs/FASE-ELEITORAL.md). A implementação continuará incremental: pré-campanha, campanha, debate, pesquisa e resultado explicável, sem alterar o motor de governo até haver contrato e testes próprios.

O contrato local mínimo da fase eleitoral foi iniciado em `src/app/election-engine.ts`. Ele modela pré-campanha, três semanas de campanha, ações de agenda, debate, pesquisa implícita e resultado determinístico com explicação causal. O núcleo está isolado do gabinete e da API, coberto por três testes; frontend: 137 testes aprovados e build de produção concluído. A integração visual e a persistência ficam para o próximo incremento.

A pré-campanha foi conectada à avaliação do ciclo no modo local: o jogador pode abrir uma prévia eleitoral sem iniciar automaticamente a campanha, visualizando sua candidatura e as duas oposições com apoio e rejeição derivados do mandato. A integração recebeu teste próprio; frontend: 138 testes aprovados e build concluído. Campanha, debate e persistência eleitoral continuam separados para os próximos incrementos.

O primeiro fluxo eleitoral tornou-se jogável no modo local: o prefeito inicia a campanha, escolhe uma agenda por semana durante três semanas, chega ao debate, responde à crítica da oposição e recebe um resultado determinístico com explicação. A integração está em `AppComponent`, coberta por teste; frontend: 139 testes aprovados e build concluído. A persistência e a API eleitoral ainda não foram conectadas.

O fluxo eleitoral local agora exibe uma pesquisa explícita após cada etapa, com apoio, rejeição e percentual de indecisos por candidato, sem alterar o estado da campanha. A pesquisa foi coberta por teste próprio e integrada à tela de campanha; frontend: 140 testes aprovados e build de produção concluído. O orçamento de estilos do componente foi ajustado para comportar a nova interface sem erro de compilação.

O estado da eleição local passou a ser salvo junto da partida e restaurado ao recarregar a aplicação, evitando que uma campanha em andamento desapareça. A persistência foi mantida exclusivamente no modo local enquanto o contrato eleitoral da API não é implementado; frontend: 140 testes aprovados e build de produção concluído.

O contrato eleitoral mínimo foi exposto na API em `POST /api/games/:id/election`, persistindo um estado JSON validado junto da partida no provedor ativo (incluindo PostgreSQL). O adaptador do frontend passou a enviar as mudanças do fluxo online e ganhou teste REST; frontend: 141 testes aprovados, API: 114 testes aprovados, ambos com build concluído.

O gate online real da eleição foi validado: uma partida foi criada na API com PostgreSQL, recebeu um estado de campanha na rota eleitoral e, após uma nova leitura por ID, retornou a mesma fase e semana (`CAMPAIGN`, semana 1). O servidor local foi reiniciado com o build atual para confirmar a rota em runtime.

O frontend online passou a reidratar o estado eleitoral retornado pela API ao criar ou carregar uma partida, mantendo a campanha visível após reconexão ou recarga. A alteração foi validada com 141 testes e build de produção; a API permaneceu com build válido.

O `ElectionEngine` passou a registrar a jornada da campanha (ações semanais, debate e resultado) no próprio estado, e a interface exibe essa trilha como uma linha do tempo compacta. O resultado tornou-se idempotente para não duplicar registros ao reprocessar uma resposta. Frontend: 141 testes aprovados e build concluído.

As pesquisas eleitorais agora possuem histórico próprio no `ElectionState`, com período identificado para cada semana, debate e resultado, além dos percentuais de apoio, rejeição e indecisos. O modelo mantém compatibilidade com saves antigos sem histórico e foi validado com 141 testes e build de produção concluído.

O histórico de pesquisas passou a ser visualizado na interface como uma evolução compacta por período, com barras segmentadas por candidatura e destaque do apoio do governo. A tela mantém a hierarquia visual dos cards e evita uma listagem textual extensa; frontend: 141 testes aprovados e build concluído.

As regras eleitorais passaram a redistribuir deterministicamente entre as oposições parte do apoio ganho ou perdido pelo governo em cada ação e no debate. A pesquisa agora reage como uma disputa, sem candidatos congelados; frontend: 141 testes aprovados e build de produção concluído.

Foi adicionado teste de regressão para a reação da oposição, garantindo que uma ação positiva do governo reduza proporcionalmente o apoio opositor. Frontend: 142 testes aprovados e build de produção concluído.

O contrato eleitoral online ganhou teste HTTP de ponta a ponta: criação da partida, `POST /api/games/:id/election`, leitura posterior por ID e confirmação do mesmo estado persistido. API: 10 suítes e 115 testes aprovados, com build NestJS concluído.

O contrato da API foi formalizado com tipos para fases, candidatos, histórico de campanha e pesquisas eleitorais, mantendo compatibilidade com estados JSON antigos. A suíte HTTP continua cobrindo gravação e leitura do estado eleitoral; API: 10 suítes e 115 testes aprovados, frontend: 142 testes aprovados, ambos com build concluído.

O endpoint eleitoral passou a validar também em runtime a fase, a semana, a presença dos candidatos e os formatos dos históricos antes de persistir. Foi adicionado teste HTTP para rejeição de fase inválida; API: 10 suítes e 116 testes aprovados, com build NestJS concluído.

Foi criada a leitura dedicada `GET /api/games/:id/election`, acompanhada de adaptador e testes REST no frontend. A rota retorna somente o estado eleitoral da partida e preserva o retorno `null` quando a eleição ainda não foi iniciada; API: 10 suítes e 117 testes, frontend: 143 testes, ambos com build concluído.

Os tipos eleitorais foram alinhados também no adaptador do frontend, incluindo candidatos, pesquisas e histórico. A integração mantém o contrato explícito nos dois lados; frontend: 142 testes aprovados, API: build NestJS concluído, ambos sem regressões.

Foram adicionados testes de contrato para a sequência completa de pesquisas — três semanas, debate e resultado — garantindo que nenhuma medição desapareça ou seja duplicada. Frontend: 142 testes aprovados e build de produção concluído.

Estados eleitorais antigos agora são normalizados ao carregar a partida: históricos ausentes recebem coleções vazias antes da renderização, evitando falhas de compatibilidade ao abrir saves anteriores. Frontend: 142 testes aprovados e build de produção concluído.

O adaptador REST do frontend passou a receber `ElectionStateContract` diretamente ao salvar uma eleição, eliminando a conversão para objeto genérico nessa fronteira. O build de produção atual foi concluído; a última suíte de testes confirmada permanece em 142 aprovações.

O contrato HTTP da leitura eleitoral foi refinado: partidas inexistentes agora retornam `404 Not Found`, com teste de regressão dedicado, enquanto estados eleitorais ausentes continuam retornando `null` para partidas válidas. API: 10 suítes e 118 testes aprovados, com build concluído.

A validação de candidatos eleitorais foi reforçada em runtime: cada item precisa ter ID, nome e percentuais numéricos de apoio e rejeição. O contrato também ganhou teste para rejeitar candidato incompleto; API: 10 suítes e 119 testes aprovados, com build NestJS concluído.

Os percentuais eleitorais agora também são validados no intervalo de 0% a 100%, com teste HTTP para valores fora da faixa. API: 10 suítes e 120 testes aprovados, com build NestJS concluído.

A API passou a rejeitar IDs duplicados entre candidatos eleitorais, protegendo a associação de pesquisas, histórico e resultado. Foi adicionado teste HTTP de regressão; API: 10 suítes e 121 testes aprovados, com build concluído.

O saldo eleitoral também passou a ser validado no intervalo de 0 a 100 créditos antes da persistência. Foi adicionado teste HTTP para saldo negativo; API: 10 suítes e 122 testes aprovados, com build NestJS concluído.

A campanha ganhou orçamento limitado de 100 créditos: ouvir grupos custa 10, visitar uma entrega 15, comunicar uma crise 20 e lançar promessa 30. A ação é recusada quando não há saldo, e o valor é persistido no estado eleitoral e exibido na interface. O contrato foi atualizado e o build do frontend concluído; a última suíte completa confirmada permanece em 142 testes.

Os registros semanais da campanha agora carregam também o custo da ação, e a linha do tempo exibe o débito em créditos junto do apoio obtido. A tipagem da aplicação foi verificada com `tsc --noEmit`; a suíte completa mais recente confirmada permanece em 142 testes.

Lançar uma promessa passou a criar um compromisso na agenda eleitoral do governo, limitado a três promessas, e a interface exibe esses compromissos como marcadores visuais. A tipagem atual foi verificada com `tsc --noEmit`; a validação completa de testes/build ficou pendente por processos residuais do runner.

As promessas agora possuem estrutura própria com área, custo estimado, prazo em semanas e credibilidade inicial condicionada à situação fiscal. O contrato eleitoral foi atualizado nos dois projetos e a tipagem do frontend permanece válida; a validação completa do runner será repetida em ambiente limpo.

O resultado eleitoral passou a considerar a agenda assumida: o custo total e a baixa credibilidade das promessas aplicam desgaste ao apoio e aumento de rejeição do governo. Foi adicionado teste específico para essa pressão; tipagem do frontend verificada sem erros.

O envio online da eleição deixou de usar conversão forçada para objeto genérico: `ElectionState` agora é aceito diretamente pelo adaptador REST, comprovando o alinhamento estrutural dos contratos. `tsc --noEmit` passou sem erros.

As promessas passaram a ter áreas políticas concretas por etapa — saúde, transporte e educação — com rótulo visível na agenda assumida. Isso prepara efeitos diferenciados por grupo social e mantém o custo/prazo associados ao compromisso; `tsc --noEmit` passou sem erros.

Os botões de agenda eleitoral agora exibem o custo de cada ação antes do clique, tornando o orçamento uma escolha legível: ouvir grupos (10), visitar entrega (15), comunicar crise (20) e lançar promessa (30). `tsc --noEmit` passou sem erros.

As promessas passaram a carregar efeitos políticos por grupo social: saúde afeta moradores e famílias, transporte afeta comerciantes e trabalhadores, e educação afeta famílias e servidores. O contrato e os tipos foram atualizados; `tsc --noEmit` passou sem erros.

Os efeitos por grupo agora também aparecem nos marcadores da agenda eleitoral, permitindo comparar área, custo, prazo e setores beneficiados antes de avançar. A tipagem do frontend foi verificada sem erros.

O debate eleitoral passou a carregar uma pergunta contextualizada pelo mandato — atrasos, situação fiscal ou resultados entregues — e a interface a apresenta antes das respostas. A tipagem do frontend passou sem erros.

As candidaturas agora carregam plataforma e estilo político próprios, exibidos nos cards: oposição fiscalizadora, oposição propositiva e governo focado em gestão/prestação de contas. O contrato dos candidatos foi atualizado e `tsc --noEmit` passou sem erros.

Após a inclusão das plataformas políticas e da pergunta contextualizada, a suíte completa do frontend foi revalidada: 147 testes aprovados. O teste confirma que a pergunta exibida corresponde ao contexto do mandato, inclusive quando existem atrasos.

O build de produção foi revalidado após as últimas mudanças eleitorais e concluído com sucesso. O bundle inicial está 2,85 kB acima do orçamento informativo, sem erro de compilação; a suíte permanece em 147 testes aprovados.

O orçamento informativo do bundle inicial foi atualizado para 540 kB, compatível com o tamanho atual da aplicação, removendo o aviso do build sem relaxar o limite de erro de 1 MB. Build de produção concluído sem avisos.

As ações de campanha agora são desabilitadas visualmente quando a verba disponível não cobre seu custo, mantendo a regra do motor e tornando o orçamento mais compreensível antes do clique.

Os códigos internos dos grupos sociais foram substituídos por rótulos legíveis em português na agenda de promessas, mantendo a estrutura técnica somente no estado persistido. Isso melhora a leitura sem alterar as regras; `tsc --noEmit` permanece válido.

Os valores dos efeitos sociais na agenda também foram localizados para pt-BR, usando vírgula decimal e uma casa de precisão, mantendo a leitura consistente com os demais indicadores da interface.

Foi adicionado teste de regressão para a apresentação dos efeitos sociais, garantindo rótulos em português e vírgula decimal na agenda eleitoral. `tsc --noEmit` e `git diff --check` passaram sem erros.

A suíte completa do frontend foi finalmente revalidada após a tipagem das promessas e dos efeitos sociais: 147 testes aprovados. O build de produção também passou; há somente um aviso informativo de 1,72 kB acima do orçamento de bundle inicial, sem falha de compilação.

Retomada da meta: a suíte completa do frontend foi revalidada com 147 testes aprovados. O build de produção também foi concluído com sucesso, com bundle inicial de 535,66 kB e sem erro de compilação.

O backend também foi revalidado após a retomada: 10 suítes e 122 testes passaram, incluindo os endpoints de eleição, validações de estado e persistência. O processo do Jest ainda mantém handles abertos ao final e exige `--forceExit` no ambiente local; isso fica como manutenção técnica separada, sem impacto nos resultados dos testes.

Foi criado o script `npm run test:ci` na API para tornar essa validação reproduzível no ambiente local/CI enquanto o encerramento dos handles do Jest é investigado. A execução confirmou novamente 10 suítes e 122 testes aprovados em 12,2 s.

O histórico eleitoral deixou de exibir códigos internos de ação e passou a apresentar rótulos narrativos em português, como “Escuta com grupos sociais” e “Prestação de contas”. A compatibilidade com ações antigas foi preservada; a suíte do frontend passou a 148 testes aprovados e o build concluiu com bundle inicial de 536,06 kB.

Na frente de hierarquia visual, snapshots históricos sem confiança fiscal ou social agora exibem “sem dado” em vez de um percentual enganoso (`—%`). A apresentação de percentuais reais foi localizada para pt-BR e recebeu regressão própria; frontend: 149 testes aprovados e build concluído com bundle inicial de 536,16 kB.

O evento de interrupção de transporte ganhou uma consequência temporal: quando o gabinete escolhe monitorar, após dois dias surge uma cobrança de trabalhadores e famílias com nova decisão, alternativas e vínculo `parentDecisionId`. O follow-up é único por ocorrência, aparece nas notícias e mantém o padrão de cidade viva já usado na chuva; frontend: 149 testes e API: 122 testes aprovados.

O follow-up de transporte foi alinhado ao `GameService` da API. O modo online agora cria a mesma cobrança posterior, com as mesmas alternativas, efeitos sociais, vínculo causal e regra de não duplicação do motor local. A suíte da API permanece em 10 suítes e 122 testes aprovados, com build NestJS concluído.

Foi adicionada uma regressão específica no backend para o follow-up de transporte: o vínculo com a decisão original e a regra de ocorrência única agora são verificados diretamente no `GameService`. API: 10 suítes e 123 testes aprovados; build NestJS concluído.

Foi adicionada também a regressão do follow-up de chuva no backend, cobrindo vínculo causal e não duplicação. A API agora tem cobertura explícita para as duas cadeias temporais de cidade viva; 10 suítes e 124 testes aprovados, com build NestJS concluído.

Auditoria financeira do follow-up de transporte: a alternativa “Restabelecer a operação” agora debita R$ 90 mil tanto no motor local quanto no `GameService` da API, alinhando o custo exibido com o custo aplicado. API: 124 testes aprovados e build concluído; frontend: 149 testes aprovados e TypeScript válido.

O custo de recuperação de transporte também recebeu regressão explícita no frontend, garantindo que o valor de R$ 90 mil permaneça alinhado à API e à descrição apresentada ao jogador. Frontend: 149 testes aprovados.

Foi adicionada a verificação de domínio correspondente na API: resolver “Restabelecer a operação” reduz efetivamente R$ 90 mil do caixa persistido. API: 10 suítes e 125 testes aprovados, com build NestJS concluído.

O primeiro refinamento visual da seção de resumo histórico foi aplicado: os indicadores agora aparecem como chips agrupados por data, com hierarquia mais escaneável, e foi removida a duplicação textual “Fiscal Fiscal”. A mudança é somente de apresentação; frontend: 149 testes aprovados e build concluído com bundle inicial de 536,64 kB.

O bloco de variações diárias recebeu o mesmo tratamento visual: data, aprovação e serviços agora são apresentados como unidades compactas e legíveis, substituindo o parágrafo corrido sem alterar os cálculos. A suíte permaneceu em 149 testes aprovados e o build concluiu com bundle inicial de 537,23 kB.

Na leitura estratégica, diagnóstico e recomendação agora têm rótulos explícitos (“Diagnóstico atual” e “Próximo movimento”), reforçando a ordem de leitura e a próxima ação sem alterar as recomendações do motor. Frontend: 149 testes aprovados e build concluído com bundle inicial de 537,23 kB.

O legado institucional deixou de ser uma lista genérica e passou a usar o mesmo padrão editorial de notícias e memória: marcador visual, tipo do registro e espaçamento consistente. Também foram removidas marcações HTML soltas nas alternativas do gabinete e adicionada semântica de região de decisão ativa. Frontend: 153 testes aprovados.

### Retomada e gate de regressão — 27/08/2026

- A meta foi retomada após a pausa para validação e o estado atual foi auditado antes de qualquer nova expansão.
- API: 10 suítes e 125 testes aprovados com `npm run test:ci -- --silent`, incluindo persistência local, arquivo, PostgreSQL, cidade viva e contrato eleitoral.
- Frontend: 153 testes aprovados com Chrome Headless; build de produção concluído com sucesso.
- O build mantém somente um aviso informativo de 106 bytes acima do orçamento de estilos do componente. A otimização desse CSS fica registrada como manutenção visual; o limite de erro não foi relaxado.
- Próximo recorte recomendado: fechar a validação manual da jornada eleitoral online e, depois, ampliar a camada de apresentação dos eventos estratégicos sem alterar o motor validado.

Auditoria de formatação retomada em 27/08/2026: todas as datas exibidas diretamente pelo template passam pelo formatador brasileiro, e narrativas históricas, consequências, cadeia causal, diário, livro-caixa, decisões e snapshots usam a mesma normalização. Também foi confirmado que a conversão de números técnicos excessivamente longos permanece centralizada em `formatNarrative`; não foi encontrada uma nova data crua no template nesta rodada. Frontend: 153 testes e build de produção aprovados.
## Validação técnica recente

- O build de produção do Angular foi concluído com sucesso em 28/08/2026 (`ng build --configuration production --verbose`). A geração levou cerca de 18 segundos após o início efetivo da compilação; o processo não estava travado, apenas silencioso durante a etapa inicial.
- A suíte do frontend também foi validada em ChromeHeadless: 153 testes executados com sucesso em 28/08/2026 (`ng test --watch=false --browsers=ChromeHeadless`).
