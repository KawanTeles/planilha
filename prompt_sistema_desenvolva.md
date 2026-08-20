# Prompt para Claude Code — Sistema de Gestão Administrativa/Financeira da Clínica Desenvolva

Cole o conteúdo abaixo como instrução inicial para o Claude Code. Ele foi escrito para ser executado **em etapas**, então siga a ordem sugerida na seção final e não pule módulos.

---

## 1. Contexto

Estou desenvolvendo um sistema de gestão administrativa e financeira para uma clínica infantil chamada **Desenvolva — Centro de Desenvolvimento Infantil**. Hoje a clínica não tem nenhum processo organizacional ou controle financeiro estruturado — tudo é feito de forma manual e desorganizada. A cliente final (dona da clínica) não é técnica: ela está acostumada a usar Excel/planilhas, então o sistema precisa ser **extremamente simples de usar e entender**, mesmo sendo um software completo.

A clínica atende por: **Unimed, Bradesco, particular** e também tem receita de **sublocação de salas**. Os profissionais que atendem são **prestadores de serviço (terapeutas)**, remunerados por repasse/produção (não são CLT). Além deles, a clínica tem **colaboradores** (funcionários fixos, ex: recepção, administrativo).

## 2. Objetivo

Construir um sistema (não uma planilha) — um painel/dashboard administrativo profissional — que substitua o controle manual da clínica, cobrindo: controle financeiro mensal e anual, cadastro de terapeutas, cadastro de colaboradores, cadastro de parcelas/empréstimos, folha de pagamento, repasse de terapeutas e produção detalhada por tipo de serviço.

**Não implemente nada além do que está descrito neste documento.** Se algo parecer útil mas não foi pedido, pergunte antes de adicionar.

## 3. Stack tecnológica recomendada

Escolha a stack mais adequada para um sistema local, de uso diário, por uma única clínica (não é um SaaS multi-tenant). Recomendação (pode ajustar se tiver justificativa técnica melhor, mas evite complexidade desnecessária):

- **Aplicação web local**, front-end em React (ou HTML/CSS/JS bem organizado, se preferir simplicidade) + back-end leve (Node/Express ou Python/FastAPI/Flask).
- **Banco de dados: SQLite** — é um sistema financeiro, os dados não podem se perder; evite depender só de localStorage do navegador.
- Deve rodar localmente com um comando simples (ex: `npm run dev` ou `python app.py`), sem exigir infraestrutura complexa (sem necessidade de nuvem, Docker opcional).
- Incluir um botão/rotina de **backup/exportação dos dados** (JSON ou Excel) como segurança extra, já que é dado financeiro sensível.

## 4. Identidade visual

Remover completamente o fundo preto da logomarca. Usar fundo **branco/claro** no sistema inteiro, com os elementos visuais (cabeçalho, botões, gráficos, cards) usando a paleta de cores da marca, em tons pastéis:

| Cor | Uso sugerido | Hex aproximado |
|---|---|---|
| Rosa pastel | destaques, botões secundários | `#F4A9C9` |
| Azul claro | destaques, gráficos | `#8FD1E0` |
| Verde pastel | indicadores positivos (ex: "recebido", "pago") | `#B5CC5C` |
| Lilás/roxo | cabeçalhos, elementos de navegação | `#C9A0DC` |
| Dourado/areia | textos de destaque, títulos ("Centro de Desenvolvimento Infantil") | `#D4B483` |
| Branco | fundo principal | `#FFFFFF` |

Peça ao usuário o arquivo da logo (ele tem a imagem) para extrair as cores exatas e usar a logo de fato no cabeçalho do sistema — os hex acima são só uma aproximação de referência caso a imagem não seja fornecida.

Renomear o sistema/aplicação para **"Desenvolva"**.

## 5. Modelo de dados (entidades principais)

- **Terapeuta** (prestador de serviço): nome, especialidade, status (ativo/inativo)
- **Colaborador**: nome, cargo, tipo de pagamento (fixo/variável), valor base, status (ativo/inativo)
- **Parcela/Empréstimo**: descrição, valor total, quantidade de parcelas, mês/ano de início, valor da parcela (calculado ou informado)
- **Lançamento de entrada** (mensal): categoria (Unimed, Bradesco, Particular, Sublocação de salas), descrição, valor, status (recebido / a receber), data de recebimento
- **Lançamento de saída** (mensal): tipo (fixa/variável), descrição, valor, status (pago/pendente), data de vencimento/pagamento
- **Repasse de terapeuta** (mensal): terapeuta (vínculo com cadastro), valor de repasse (manual), status (pago/pendente)
- **Folha de pagamento** (mensal): colaborador (vínculo com cadastro), valor, status (pago/pendente)
- **Produção de terapeuta**: tipo de serviço, data, terapeuta, valor do atendimento, percentual, valor terapeuta (calculado), valor clínica (calculado)

## 6. Módulos e funcionalidades

### 6.1 Cadastro de Prestadores de Serviço (Terapeutas)
CRUD completo (criar, editar, inativar). Campos: nome e especialidade.

Popular o cadastro inicial com os seguintes terapeutas (mantenha os campos de cadastro editáveis, pois esses nomes vieram de transcrição por voz e podem precisar de pequenos ajustes de grafia pelo usuário):

| Nome | Especialidade |
|---|---|
| Eduarda Michaeli | Terapeuta Ocupacional |
| Gabriele Souza | Terapeuta Ocupacional |
| Jeaniquel Félix | Terapeuta Ocupacional |
| Letícia Nascimento | Fonoaudióloga |
| Letícia Laurindo | Fonoaudióloga |
| Yasmin Alves | Psicóloga |
| Caroline Costa | Psicóloga |
| Victória Áreas | Psicóloga |
| Luísa Ferreira | Psicopedagoga |
| Cheyenne Monteiro | Psicopedagoga |

Deixe o cadastro aberto para adicionar novos profissionais a qualquer momento — todos os módulos que dependem da lista de terapeutas (repasse, produção) devem refletir automaticamente qualquer novo cadastro.

### 6.2 Cadastro de Colaboradores
CRUD completo. Campos: nome, cargo, tipo de pagamento (fixo/variável), valor base. Começa vazio (a cliente preenche depois).

### 6.3 Cadastro de Parcelas e Empréstimos
CRUD completo. Ao cadastrar uma parcela/empréstimo (descrição, valor total, quantidade de parcelas, mês/ano de início), o sistema deve **gerar automaticamente** o lançamento correspondente em cada um dos meses envolvidos (ex: 10 parcelas a partir de março aparecem de março a dezembro, uma por mês). Isso deve refletir automaticamente na tela do mês correspondente, dentro da seção de saídas/parcelas — sem necessidade de lançar manualmente mês a mês.

### 6.4 Controle Financeiro Mensal (Janeiro a Dezembro)
Uma tela por mês (navegação entre os 12 meses do ano). Em cada mês:

- **Entradas**: lançamentos por categoria — Unimed, Bradesco, Particular, Sublocação de salas. Cada entrada tem valor, status (recebido / a receber) e data de recebimento.
- **Saídas**: contas fixas e contas variáveis, exibidas lado a lado (uma coluna/bloco ao lado do outro, com um espaçamento entre elas, mas visualmente pareadas). Cada saída tem valor, status (pago/pendente) e data.
- **Parcelas/empréstimos do mês**: os lançamentos gerados automaticamente pelo módulo 6.3 aparecem aqui.
- **Resumo/Balanço do mês** (painel ao lado das entradas): total de entradas, total recebido, total a receber, total de parcelas do mês, total da folha do mês, total de repasses do mês, e **balanço geral** (saldo).
- **Folha de pagamento do mês** (ver 6.6) e **Repasse de terapeutas do mês** (ver 6.7) ficam dentro da tela do mês, abaixo das entradas/saídas.

### 6.5 Controle Financeiro Anual
Uma visão consolidada com os 12 meses lado a lado (ou em tabela), totais anuais de entradas, saídas, repasses e folha, e **gráficos** (evolução mensal de entradas x saídas, balanço mensal, composição das entradas por categoria).

### 6.6 Folha de Pagamento (dentro de cada mês)
Lista os colaboradores cadastrados (puxado automaticamente do cadastro 6.2). Duas colunas lado a lado: **pagamentos fixos** e **pagamentos variáveis**, com um pequeno espaçamento entre elas mas mantendo alinhamento visual (uma ao lado da outra). Cada linha: colaborador, valor, status (pago/pendente).

### 6.7 Repasse de Prestadores de Serviço (dentro de cada mês)
Lista os terapeutas cadastrados (puxado automaticamente do cadastro 6.1 — não precisa recadastrar nome todo mês). Para cada terapeuta, o usuário insere **manualmente** o valor do repasse daquele mês (varia mês a mês) e marca o status: **pago / pendente**.

### 6.8 Produção de Terapeutas (módulo detalhado, separado da tela mensal)
Uma seção por **tipo de serviço**:

- Integração Sensorial
- ABA / Prompt
- Atendimento Particular
- Bradesco
- Convencional
- Outros valores

Dentro de cada tipo de serviço, uma tabela de lançamentos com: data, terapeuta (selecionado do cadastro 6.1), valor do atendimento (ex: R$ 90,00), e **percentual** — este campo é preenchido manualmente pelo usuário a cada lançamento (ex: 60%). A partir do valor e do percentual, o sistema calcula automaticamente:
- **Valor da terapeuta** = valor do atendimento × percentual
- **Valor da clínica** = valor do atendimento × (100% − percentual)

Esse módulo serve como apoio de consulta/apuração para depois preencher o repasse mensal (6.7) — os dois módulos não precisam ser 100% integrados automaticamente, mas devem estar visualmente próximos/relacionados no sistema.

### 6.9 Dashboard / Painel inicial
Tela inicial com visão geral: mês atual selecionado, balanço do mês, atalhos para os módulos, um resumo anual rápido com gráfico.

## 7. Regras de negócio importantes

- Toda entrada e saída tem **status** (recebido/a receber ou pago/pendente) e isso deve refletir nos totais do resumo (ex: "total recebido" ≠ "total de entradas lançadas").
- Parcelas/empréstimos são cadastrados **uma única vez** e se propagam automaticamente pelos meses corretos.
- Repasse de terapeutas: a lista de terapeutas é automática (do cadastro), mas o **valor** é sempre manual, mês a mês.
- Produção de terapeutas: o **percentual** é sempre manual, mês a mês / lançamento a lançamento; o cálculo do valor final é automático via fórmula.
- Folha de pagamento: colaboradores fixos e variáveis devem ficar visualmente lado a lado, não empilhados.

## 8. Requisitos de usabilidade

- Navegação por menu lateral (sidebar) com os módulos bem separados e nomeados de forma clara (em português, na linguagem da clínica).
- Sistema deve parecer um painel profissional, não uma planilha nem um formulário solto.
- Poucos cliques para tarefas do dia a dia (lançar uma entrada, marcar um pagamento como feito, etc).
- Responsivo o suficiente para uso em notebook comum (não precisa ser mobile-first).

## 9. Fora de escopo (não fazer)

- Não criar múltiplos usuários/permissões, login multiempresa, ou qualquer funcionalidade de multi-tenant.
- Não criar integrações externas (ex: importação bancária, NFe, etc) — isso não foi pedido.
- Não adicionar módulos que não estão listados aqui sem antes perguntar.

## 10. Ordem sugerida de construção (etapas)

Construa e valide **uma etapa por vez**, sem pular para a próxima antes de confirmar que a anterior está funcionando:

1. Estrutura base do projeto (front-end + back-end + banco de dados SQLite) e identidade visual (cores, layout base, sidebar).
2. Cadastro de Prestadores de Serviço (Terapeutas) — com os dados iniciais da seção 6.1.
3. Cadastro de Colaboradores.
4. Cadastro de Parcelas e Empréstimos (com a lógica de propagação automática pelos meses).
5. Tela de Controle Financeiro Mensal (entradas, saídas fixas/variáveis, resumo/balanço) para um mês, depois replicar a navegação para os 12 meses.
6. Folha de Pagamento dentro do mês (puxando do cadastro de colaboradores).
7. Repasse de Prestadores de Serviço dentro do mês (puxando do cadastro de terapeutas).
8. Controle Financeiro Anual consolidado + gráficos.
9. Módulo de Produção de Terapeutas (uma seção por tipo de serviço, com fórmula de percentual).
10. Dashboard/painel inicial.
11. Revisão geral: conferir cálculos, status, cores da marca, e testar o fluxo completo de uso (cadastrar terapeuta → lançar produção → lançar repasse → conferir balanço do mês).

Ao final de cada etapa, mostre o resultado (ou rode a aplicação) antes de seguir para a próxima.
