# SentinelPC — Painel de Controlo Parental & Gestão de Tempo

Aplicação web e consola de controlo parental concebida para monitorizar, gerir e limitar os tempos de utilização do computador e das aplicações do filho, com ferramentas interativas de quotas diárias, agendamento de toques de recolher (curfew), bloqueio de domínios/programas e sincronização direta com o sistema de agentes PowerShell (`agente.ps1`, `vigia.ps1` e patch com blobs Base64 e validação SHA-256).

***

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões confirmadas pelo utilizador:**
> - **Objetivo:** Aplicação pessoal de controlo parental para o computador do filho.
> - **Foco Interativo:** Monitorização rigorosa dos tempos de uso do computador e tempo individual gasto em programas/jogos.
> - **Estética:** Consola moderna escura em estilo cibersegurança (dark slate/zinc, acentos funcionais esmeralda/âmbar/ciano, tipografia tabular monospaçada e ausência de ruído visual).
> - **Integração Técnica:** Alinhamento direto com o script de gestão (`painel_pc.py`, `agente.ps1`, `vigia.ps1`, `regras.json` e o gerador de blocos Base64 de 2000 carateres com hash SHA-256).

- **Decisão Aberta / Predefinida:** Dados de demonstração interativos e persistência local (`localStorage`) que permite testar o painel imediatamente no browser, combinados com um gerador e exportador de regras reais (`regras.json`) e scripts PowerShell prontos a enviar para o PC alvo.

***

### 1. Overview & Core Concept

- **O Que Faz:** Oferece aos pais um centro de comando visual para acompanhar o tempo total de ligação do PC, visualizar gráficos de atividade por hora e por categoria de software (Jogos, Estudo, Redes Sociais, Navegação), configurar limites diários com corte automático e pausar/retomar instantaneamente o acesso a programas específicos ou à internet.
- **Público-Alvo:** Pais que pretendem gerir de forma transparente, justa e segura o tempo de ecrã dos filhos em computadores Windows, sem depender de soluções comerciais invasivas ou pagas.
- **Valor Principal:** Visibilidade clara e sem ruído do tempo gasto, cumprimento das metas de estudo e descanso, com garantia técnica de integridade criptográfica dos agentes instalados na máquina monitorizada.

***

### 2. User Experience & Visual Design

- **Fluxos de Utilizador Principais:**
  1. **Dashboard de Resumo (Visão Geral de Hoje):**
     - Cartões de métricas chave com números tabulares: Tempo Total de Ecrã (ex: 2h 45m de 3h 30m permitidas), Tempo em Jogos (1h 15m), Tempo de Estudo (1h 30m) e Estado do Agente (`OK - SHA256 Validado`).
     - Barra de progresso da quota diária com alertas de aproximação do limite (âmbar a 80%, vermelho a 100%).
     - Linha de tempo cronológica de atividade ao longo do dia (gráfico de barras interativo hora-a-hora com divisão por categoria).
  2. **Monitor & Gestor de Aplicações:**
     - Tabela detalhada de programas detetados (`Roblox`, `Discord`, `Google Chrome`, `Visual Studio Code`, `Steam`, `Minecraft`, etc.).
     - Indicador de estado (Em execução agora, Fechado, Bloqueado).
     - Temporizador ao vivo de tempo consumido hoje e tempo limite configurado.
     - Ações imediatas: botão de bloqueio instantâneo, definição de limite diário em minutos e categorização.
  3. **Horários & Curfew (Matriz Semanal):**
     - Planeador visual de horas permitidas por dia da semana (Segunda a Domingo).
     - Janelas de bloqueio noturno (ex: bloqueio automático a partir das 21:30 em dias de escola).
     - Modo de Emergência / Botão de "Pausa Familiar" (bloqueio temporário imediato de ecrã ou internet).
  4. **Filtro Web & Ficheiro Hosts:**
     - Gestor da lista de domínios bloqueados (redes sociais, sites inapropriados, servidores de jogos).
     - Pré-visualização do bloco formatado para o ficheiro `hosts` do Windows gerado pelo script.
  5. **Consola Técnica do Agente & Patch (`painel_pc.py`):**
     - Inspeção do estado do agente (`processos=$n`, `tarefa=$est`, `hash=ok`).
     - Visualizador do gerador de blobs Base64 (`blob(var, texto, tam=2000)`) que resolve o problema de limite de stdin do PowerShell.
     - Verificador de Hash SHA-256 e exportador do ficheiro `regras.json` atualizado.

- **Identidade Visual & Tema:**
  - *Estética:* Consola moderna de cibersegurança e operações de sistema, com acabamentos mate, contraste deliberado e foco analítico.
  - *Paleta de Cores (60-30-10):*
    - Fundo base (60%): Cinzento carvão profundo (`#090D16` e `#0D1117`).
    - Superfícies e cartões (30%): Ardósia estrutural (`#161B22` com contornos subtis `rgba(255,255,255,0.08)`).
    - Acentos funcionais (10%): Ciano técnico (`#38BDF8`) para dados normais, Esmeralda (`#10B981`) para agente online e tempo seguro, Âmbar (`#F59E0B`) para aproximação do limite, e Carmesim (`#EF4444`) para bloqueio ou quota esgotada.
  - *Tipografia:* Família sem serifa limpa para títulos e navegação (`Plus Jakarta Sans`), aliada a fonte monoespaçada com algarismos tabulares (`font-mono tabular-nums`) em todos os temporizadores, percentagens e registos.
  - *Disciplina de Interface:* Sem falsos emblemas coloridos desnecessários, sem "pills" flutuantes estáticas; metadados limpos com separadores tipográficos (`·`).

***

### 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Visualização em Tempo Real com Simulação Interativa:**
  - *Abordagem:* O painel inclui um motor de simulação de telemetria ativo (com botão de avançar tempo, simular abertura de jogo ou alteração de estado) permitindo testar os avisos de limite, bloqueio de processos e alertas sem necessitar de ter o PC do filho ligado naquele momento.
  - *Porquê:* Permite ao utilizador validar as regras, limites e a experiência visual instantaneamente no browser.
- **Decisão 2: Editor e Exportador Fiel de `regras.json` e Blobs:**
  - *Abordagem:* Todas as alterações feitas na interface (novos limites de programas, horários permitidos e listas de domínios) atualizam em tempo real o formato JSON canónico de `regras.json` e geram os scripts PowerShell com a fragmentação em blocos de 2000 carateres (`def blob`) testada no patch.
  - *Porquê:* O pai pode copiar o script ou guardar o ficheiro diretamente para o servidor `/root/painel_pc.py` real.
- **Decisão 3: Controlo por Categorias e Ações Granulares:**
  - *Abordagem:* Em vez de apenas bloquear o PC por inteiro, o painel permite aplicar quotas específicas (ex: máximo 1h de Jogos, ilimitado para Ferramentas Escolares/VS Code/Word).

***

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                       SENTINELPC DASHBOARD                             │
├─────────────────┬──────────────────────────────────────────────────────┤
│  Top Navigation │  [SentinelPC] — [Resumo · Apps · Horários · Agente]  │
├─────────────────┼──────────────────────────────────────────────────────┤
│  Sidebar Status │  • Alvo: PC-Filho (Windows 11)                       │
│  & Controlo     │  • Quota Diária: 2h 45m / 3h 30m                     │
│  Rápido         │  • [Botão Pausa Familiar] / [Simular Atividade]      │
├─────────────────┴──────────────────────────────────────────────────────┤
│                             MAIN VIEWPORT                              │
│  ┌───────────────────────┬──────────────────────┬────────────────────┐ │
│  │ 01. Quota do Dia      │ 02. Jogos & Lazer    │ 03. Estudo/Escola  │ │
│  │ 2h 45m / 3h 30m (78%) │ 1h 15m / 1h 30m      │ 1h 30m (Sem Limite)│ │
│  └───────────────────────┴──────────────────────┴────────────────────┘ │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Linha Temporal de Utilização (Distribuição 08:00 - 22:00)         │ │
│  │ [Barras empilhadas hora a hora por categoria com valores tabulares]│ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Tabela de Aplicações Monitorizadas & Limites                      │ │
│  │ Nome | Categoria | Hoje | Limite | Estado | Ação Bloqueio/Editar  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Integração Técnica & Gerador de Scripts (agente.ps1 / SHA-256)    │ │
│  │ Validador de Hash · Gerador de Blobs (2000 chars) · JSON Config   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- **Modelo de Dados (TypeScript):**
  - `AppUsageRecord`: ID do processo, nome executável (ex: `RobloxPlayerBeta.exe`), nome amigável, categoria (`games`, `social`, `study`, `browsing`, `system`), minutos consumidos hoje, minutos limite diário, estado de execução (`running`, `idle`, `blocked`).
  - `DailyQuota`: minutos totais permitidos por dia, minutos utilizados, estado de alerta.
  - `CurfewSchedule`: intervalos de horas permitidas para cada dia da semana (ex: `16:00` às `21:00`).
  - `BlockedDomain`: domínio, categoria, data de adição, ativo (para sincronização com `HOSTS_SET`).
  - `AgentIntegrity`: versão instalada, hash SHA-256 verificado (`$hok`), contagem de processos em vigia, estado da tarefa agendada.

- **Componentes Chave a Implementar:**
  - `DashboardOverview`: cartões de métricas de tempo, indicador de quota geral e gráfico de linha temporal diária.
  - `AppUsageTable`: lista de programas com temporizadores ao vivo, filtros por categoria, pesquisa em tempo real e controlos de limite.
  - `CurfewPlanner`: grelha visual para definir horas de recolher e horários de descanso.
  - `WebFilterManager`: gestão de listas de bloqueio para o ficheiro `hosts`.
  - `AgentConsoleModal / Tab`: visualizador de integridade SHA-256 e gerador interativo de código PowerShell com fragmentação de blobs.
