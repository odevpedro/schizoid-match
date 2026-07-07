# Backlog — WellMatch

> Registro vivo do progresso do projeto. Atualizado a cada mudanca de estado de uma funcionalidade.
> **Ultima atualizacao:** 2026-07-05

---

## Sobre o Projeto

Aplicativo privacy-first para conectar pessoas por compatibilidade de rotinas saudaveis, caminhadas, treinos e companhia — sem expor dados sensiveis de saude.

**Versao atual:** `0.5.0`
**Stack principal:** React Native + NestJS + PostgreSQL + TimescaleDB + Redis

---

## Legenda

| Simbolo | Significado |
|---------|-------------|
| `[ ]`   | Pendente |
| `[~]`   | Em andamento |
| `[x]`   | Concluido |
| `P0`    | Critico — bloqueia outras features |
| `P1`    | Alta prioridade |
| `P2`    | Media prioridade |
| `P3`    | Melhoria / nice-to-have |
| `XS` `S` `M` `L` `XL` | Estimativa de complexidade |

---

## Concluidas

### MVP — v0.1.0 (2026-05-07)

- `[x]` Estrutura do projeto (backend NestJS + mobile React Native)
- `[x]` Schema SQL com TimescaleDB (init.sql)
- `[x]` Docker Compose para ambiente local
- `[x]` Autenticacao JWT (registro, login, guards)
- `[x]` Entidades TypeORM (users, preferences, health, match, chat)
- `[x]` Camada HealthProvider (interface + SimulatedProvider + Factory)
- `[x]` Ingestao de metricas com verificacao de consentimento
- `[x]` HealthProfileProcessor (metricas brutas → bandas derivadas)
- `[x]` CompatibilityCalculator (score ponderado)
- `[x]` Sistema de swipe (like/dislike/super_like + rate limiting)
- `[x]` Criacao automatica de match bilateral
- `[x]` Chat via WebSocket (Socket.IO Gateway)
- `[x]` Chat REST fallback + sugestoes wellness
- `[x]` Desafios em dupla (CRUD basico)
- `[x]` Privacidade e LGPD (export, delete health data, delete account)
- `[x]` Consentimento granular por metrica (grant/revoke)
- `[x]` Telas mobile: Login, Register, Match, Mensagens, Chat, Perfil, Privacidade
- `[x]` Componentes: WellnessCard, CompatibilityBar, WellnessBadges

### v0.1.1 (2026-05-08)

- `[x]` Fix: `#root` sem `display: flex` causava tela em branco
- `[x]` Fix: `__DEV__` indefinido no Vite
- `[x]` Fix: aba Match nao responsiva
- `[x]` Feature: modo demo com login ficticio
- `[x]` Feature: camada de mock data

### v0.2.0 — Reposicionamento, Onboarding, Moderacao, Seguranca (2026-07-04)

**Limpeza e reposicionamento:**
- `[x]` Remover toda referencia a "Schizoid-Match" do codigo e docs
- `[x]` Remover "Tinder do bem-estar" do posicionamento do produto
**Novo modelo de perfil seguro (PublicWellnessProfile):**
- `[x]` Entidade PublicWellnessProfile com campos semanticos seguros
- `[x]` DTOs de onboarding multi-step (7 passos)
- `[x]` OnboardingService com validacao de ordem e estado
- `[x]` Endpoints REST para cada step + status
**Privacidade e consentimento expandido:**
- `[x]` ConsentRecord com purpose, consent_version, metadata
- `[x]` Revogacao de consentimento remove campos publicos (score_confidence → low)
- `[x]` HealthService.handleConsentRevocation — efeito real no perfil
- `[x]` PrivacyService.deleteAccount — cascata completa

**Matching seguro:**
- `[x]` Calculator retorna Confidence + Reasons (sem fallback 50)
- `[x]` Rate limit de swipe diario (corrigido B002)
- `[x]` Swipe com transacao no banco (corrigido race condition)
- `[x]` MatchingService usa PublicWellnessProfile

**Seguranca social:**
- `[x]` Block entity (bloqueio com desfazimento)
- `[x]` Report entity (denuncia com motivo e status)
- `[x]` ModerationAction entity (advertencia, ban, remocao)
- `[x]` Bloqueio desativa matches ativos
**Chat seguro:**
- `[x]` ChatMessage.readAt com timestamp
- `[x]` WebSocket validateMatchAccess em join:match e message:send
- `[x]` Limite de mensagens diarias (200)
- `[x]` Sugestoes com hash melhorado (corrigido B003)

**Operacao:**
- `[x]` SQL migrations versionadas (002-005)
- `[x]` Migration runner script (run-migrations.sh)
- `[x]` Testes unitarios: auth, matching, chat, privacy, moderation (19 testes)
- `[x]` init.sql atualizado com novas tabelas e colunas

**Telas de onboarding mobile:**
- `[x]` Telas de onboarding mobile (Intro, Intent, Goals, Activities, Availability) — scrollable, progress indicator, dark theme, loading/error states

**Telas de perfil e match:**
- `[x]` ProfileScreen refatorada: exibe `PublicWellnessProfile` com campos semanticos, labels em portugues, tags/chips para arrays, estados loading/error/empty, navegacao para privacidade/smartwatch/exportar dados/excluir conta
- `[x]` MatchScreen: botoes de denuncia (navega para ReportUser) e bloqueio (BlockUserButton inline) abaixo do card stack, estilo ghost/secondary compacto

### v0.3.0 — Audit, Roles, Onboarding Mobile Completo, Integracao (2026-07-04)

**Role-based access control:**
- `[x]` User entity com campo `role` ('user' | 'moderator' | 'admin')
- `[x]` JWT payload inclui `role`
- `[x]` RolesGuard (`src/modules/auth/guards/roles.guard.ts`)
- `[x]` Roles decorator (`src/common/decorators/roles.decorator.ts`)
- `[x]` Migration 006 com coluna `role` e tabela `audit_events`

**AuditModule:**
- `[x]` AuditEvent entity com auditoria completa
- `[x]` AuditService para registro de eventos
- `[x]` Integracao com: AuthService, OnboardingService, HealthService, MatchingService, ChatService, ModerationService, PrivacyService
- `[x]` LoggingInterceptor para logs estruturados request/response

**Saude operacional:**
- `[x]` HealthCheckController com `GET /health` e `GET /ready`
- `[x]` LoggingInterceptor para logs estruturados
- `[x]` PrivacyRetentionService com cron diario (03:00) para limpeza
- `[x]` `@nestjs/schedule` adicionado

**Rate limit corrigido:**
- `[x]` Correcao B002 definitiva: swipe conta `createdAt >= todayStart` com `MoreThanOrEqual`

**Perfil e matching:**
- `[x]` Endpoint `GET /users/me/wellness-profile`
- `[x]` Candidatos incluem `displayName`, `ageRange`, `approximateRegion`
- `[x]` WellnessCard atualizado com displayName, ageRange, confidence badge, source badge

**Onboarding mobile completo (9 telas):**
- `[x]` OnboardingNavigator com todas as 9 telas
- `[x]` AppNavigator exibe onboarding apos login se nao completado
- `[x]` auth.store.ts com `onboardingCompleted` state e `checkOnboardingStatus()`
- `[x]` Telas: IntroScreen, IntentScreen, GoalsScreen, ActivitiesScreen, AvailabilityScreen, IntensityScreen, PrivacyScreen, SourceScreen, CompletedScreen
- `[x]` onboarding.service.ts para chamadas de API mobile

**Moderacao mobile:**
- `[x]` BlockUserButton component (confirmacao Alert)
- `[x]` ReportUserScreen (selecao de motivo + descricao)
- `[x]` BlockedUsersScreen (lista com desbloqueio)
- `[x]` moderation.service.ts para chamadas de API mobile
- `[x]` MainNavigator inclui ReportUser e BlockedUsers no ProfileStack

**Infra:**
- `[x]` Migration 006: `user_role_and_audit.sql`
- `[x]` init.sql atualizado com `role` e `audit_events`
- `[x]` Testes de integracao com banco real (`test/integration/wellmatch.integration.spec.ts`)

**Providers de smartwatch:**
- `[x]` HealthKit provider (iOS) — healthkit.provider.ts
- `[x]` Health Connect provider (Android) — health-connect.provider.ts
- `[x]` Garmin Connect API — garmin.provider.ts (via env vars)
- `[x]` Fitbit Web API — fitbit.provider.ts (via env vars)
- `[x]` Factory registra todos os 5 provedores

**Documentacao:**
- `[x]` README.md, backlog.md, data-model.md, security.md, system-feature-flows.md atualizados

### v0.4.0 — Geolocation, ML, Desafios CI/CD, Health Dashboard (2026-07-04)

**Geolocation e matching:**
- `[x]` User entity com latitude/longitude
- `[x]` Migration 007: `007_geolocation_and_unmatch.sql`
- `[x]` Haversine distance filter em `getCandidates()`
- `[x]` `distanceKm` retornado nos candidatos
- `[x]` Unmatch endpoint: `DELETE /matching/unmatch/:matchId`

**Desafios com progresso:**
- `[x]` ChallengeProgress entity
- `[x]` ChallengeProgressService com updateProgress, getProgress, completeChallenge, getHistory
- `[x]` `GET /challenges/history`, `POST /challenges/:id/progress`, `GET /challenges/:id/progress`

**ML e recomendacao:**
- `[x]` RecommendationService com TF-IDF embeddings sobre wellness profile
- `[x]` Reordenacao por similaridade com likes passados
- `[x]` Collaborative filtering em memoria

**Upload de foto:**
- `[x]` `POST /users/me/avatar` com AvatarDto
- `[x]` Avatar nao exposto para candidatos sem match

**Infra:**
- `[x]` CI/CD com GitHub Actions (.github/workflows/ci.yml)
- `[x]` Testes de integracao com PostgreSQL service container

**Provider sync mobile:**
- `[x]` health-sync.service.ts — geracao realista de dados biometricos (steps, sleep, heart_rate, hrv, etc.)
- `[x]` Auto-sync a cada 2 minutos com subscribe de status
- `[x]` native-health.ts — bridges nativas HealthKit (iOS) e Health Connect (Android)

**WatchConnectionScreen:**
- `[x]` Todos os 5 providers selecionaveis (simulated, healthkit, health_connect, garmin, fitbit)
- `[x]` Provider availability check para bridges nativas
- `[x]` Fluxo conexao → permissoes → sincronia com status em tempo real

**Health Dashboard:**
- `[x]` HealthDashboardScreen com metricas do dia e resumo semanal
- `[x]` METRIC_UNITS, METRIC_LABELS, HealthDashboardData types
- `[x]` Navegacao do ProfileScreen para HealthDashboard
- `[x]` Ingestao de metricas via REST aceita MetricSample array com mapeamento para colunas

**Correcoes:**
- `[x]` B004 resolvido: startup-validator.ts com defaults para PORT, NODE_ENV, CORS_ORIGIN
- `[x]` AsyncStorage → storage adapter para compatibilidade web
- `[x]` CORS multi-origin via split(',')
- `[x]` Consent no frontend envia purpose obrigatorio

### v0.5.0 — Admin Dashboard para Moderacao (2026-07-05)

- `[x]` AdminGuard para moderadores e administradores
- `[x]` AdminModule com AdminService e AdminController
- `[x]` Endpoints: GET /admin/dashboard, GET /admin/reports, GET /admin/reports/:id, POST /admin/reports/:id/resolve, GET /admin/audit
- `[x]` AdminDashboardScreen com cards de estatisticas e navegacao
- `[x]` AdminReportsScreen com FlatList de denuncias e pull-to-refresh
- `[x]` AdminReportDetailScreen com acoes de warn/ban/dismiss
- `[x]` AdminAuditScreen com paginacao e icones por tipo de evento
- `[x]` Registro de telas no ProfileStack do MainNavigator
- `[x]` Documentacao atualizada: README, backlog, system-feature-flows, data-model

### v0.4.1 — Estabilizacao Pos-Varredura (2026-07-04)

**Swipe e matching:**
- `[x]` MatchScreen nao remove mais o card antes do `POST /matching/swipe` concluir
- `[x]` Erros de swipe agora aparecem no frontend com `Alert` e `console.error`
- `[x]` Super like exposto no frontend e suportado no modo demo
- `[x]` MatchingService exclui candidatos ja bloqueados e matches ativos
- `[x]` `ChatGateway.notifyMatch()` chamado apos criacao de match bilateral
- `[x]` RecommendationService integrado ao fluxo de candidatos e registro de interacoes

**Registro e onboarding:**
- `[x]` AuthService retorna campos publicos basicos do usuario apos login/registro
- `[x]` Auth store aguarda `checkOnboardingStatus()` apos login/registro
- `[x]` LoginScreen e RegisterScreen exibem erros inline no web/app em vez de depender de `Alert.alert`
- `[x]` Onboarding step 1 persiste `mainIntention` no PublicWellnessProfile
- `[x]` Onboarding principal recebeu motion design real no app: entrada fade/slide, progresso segmentado, cards/chips animados, painel informativo e conclusao animada
- `[x]` OnboardingCompletedScreen troca para o app via `setOnboardingCompleted(true)`, sem rota inexistente `Main`
- `[x]` WatchConnectionScreen remove navegacao para rota inexistente `Main`
- `[x]` ProfileScreen remove navegacao para rota inexistente `DeleteAccount`
- `[x]` WebApp agora respeita `onboardingCompleted` e mostra onboarding animado apos cadastro/login
- `[x]` WebApp ganhou rota basica de Chat para abrir conversas pela interface web

**Health dashboard e sync:**
- `[x]` `GET /health/dashboard` retorna metricas agregadas do usuario autenticado
- `[x]` HealthDashboardScreen consome dados reais do backend e remove `Math.random()`
- `[x]` Ingestao direta de amostras atualiza `health_profile_daily` usando HealthProfileProcessor
- `[x]` health-sync mobile centraliza ingestao no healthService e nao chama API no modo demo

**Infra e qualidade:**
- `[x]` `ChallengeProgress` adicionado ao TypeORM root config
- `[x]` DataSource CLI e migration TypeORM para geolocation/challenge progress criados
- `[x]` Migration TypeORM `GeolocationAndChallengeProgress1720050000000` executada no banco local
- `[x]` `infra/init.sql` e `infra/migrations/007` alinhados com entities atuais
- `[x]` CI passa a chamar `npm run test:integration` com `DATABASE_URL`
- `[x]` `backend/package.json` corrige `start:prod` para `dist/src/main.js`
- `[x]` Typecheck mobile ajustado para web/RN e build Vite validado

**Chat e validacao ponta a ponta:**
- `[x]` ChatService marca como lidas as mensagens do outro participante, nao as do proprio usuario
- `[x]` Docker local validado: Postgres/TimescaleDB e Redis saudaveis via Docker Compose
- `[x]` API local validada em `http://localhost:3001/health` com versao `0.4.1`
- `[x]` Happy path funcional validado via API local: registro de 2 usuarios -> onboarding 7 passos -> candidatos -> mutual like -> match -> envio/leitura de mensagem
- `[x]` Happy path validado pela UI web em Chrome headless: criar conta -> onboarding com motion -> match -> abrir conversa -> enviar mensagem

---

## Pendentes

### Lista Consolidada Pos-Varredura — Prioridade Real

- `[ ]` P0 / M — Validar o mesmo happy path no Android Studio/emulador: criar conta, onboarding animado, match, abrir conversa e enviar mensagem pela UI nativa. Requer dispositivo Android ou emulador.
- `[x]` P0 / M — Bootstrap de schema confiavel para CI: CI usa `timescale/timescaledb:latest-pg16`, aplica `init.sql` + `migration:run` automaticamente; `main.ts` executa `ds.runMigrations()` na inicializacao.
- `[ ]` P1 / M — Preparar checklist de teste em smartwatch real depois do happy path Android: permissoes, Health Connect/HealthKit, ingestao, dashboard e matching apos sync.
- `[x]` P1 / M — Upload real de avatar com arquivo (`multer` diskStorage, `process.cwd()/uploads/avatars/`, 5MB, jpeg/png/gif/webp) + frontend com `avatar.service.ts` e file picker no perfil.
- `[x]` P1 / M — RecommendationService persiste interacoes via `SwipeHistory` (metodo `recordInteraction()` salva no banco + mantem cache em memoria).
- `[x]` P1 / M — Notificacoes de match/mensagem/desafio via canal in-app: `NotificationService` com `InAppNotification` em memoria, polling 30s no frontend, integrado com MatchingService e ChatService.
- `[x]` P1 / M — Testes mobile com Jest + RNTL: 4 suites, 16 testes passando (auth slice, onboarding service, avatar service, ProfileScreen).
- `[ ]` P2 / L — Bridges nativas reais HealthKit/Health Connect; `native-health.ts` ainda e camada stub para web/dev. Requer build nativo Android/iOS.
- `[x]` P2 / M — Admin dashboard para moderacao: AdminGuard, 5 endpoints, 4 telas mobile (Dashboard, Reports, ReportDetail, Audit), admin.service.ts.
- `[x]` P2 / M — Envio de imagens no chat: `POST /chat/upload-image` (multer 10MB), `ChatMessage.imageUrl`, `MessageBubble` renderiza imagem, `chat.service.ts`.
- `[x]` P2 / M — Historico temporal detalhado de progresso dos desafios: `GET /challenges/history/detailed` com paginacao, totalDaysActive, currentStreak.
- `[x]` P2 / L — E2E Playwright: `e2e/` com config + happy path completo (registro, onboarding, swipe, match, chat).
- `[x]` P3 / S — i18n padronizado: `error-messages.ts` (backend), `errors.ts` + `labels.ts` (mobile) em portugues.

### Smartwatch Integration — P1

- `[x]` HealthKit provider (iOS)
- `[x]` Health Connect provider (Android)
- `[x]` Garmin Connect API
- `[x]` Fitbit API

### Perfil e Match — P1

- `[x]` Upload de foto de perfil (revelada so apos match)
- `[x]` Filtros de match (distancia real via geolocation)
- `[x]` Desfazer match (unmatch)

### Desafios — P2

- `[x]` Progresso automatico de desafio via metricas do dia
- `[ ]` Notificacoes de desafio concluido
- `[x]` Historico de desafios completados

### Infraestrutura — P1

- `[x]` Testes de integracao (auth, match, health)
- `[x]` Observabilidade (logs estruturados com LoggingInterceptor)
- `[x]` CI/CD com GitHub Actions
- `[ ]` Migracao TypeORM automatizada (rodar migrations na inicializacao)
- `[ ]` Deploy em producao (Railway, Render ou VPS)

### Machine Learning — P3

- `[x]` Modelo de compatibilidade baseado em embeddings de perfil
- `[x]` Recomendacao personalizada por comportamento de swipe

---

## Bugs Conhecidos

| ID | Descricao | Severidade | Status |
|----|-----------|------------|--------|
| B001 | public_health_profile nao populado (substituido por PublicWellnessProfile) | Resolvido | `[x]` |
| B002 | Rate limit de swipes usava contagem total, nao diaria | Resolvido | `[x]` |
| B003 | Sugestoes de chat deterministicas por charCodeAt(0) | Resolvido | `[x]` |
| B004 | Variaveis de ambiente nao validadas | Media | `[x]` |
| B005 | Swipe removia card antes da resposta e escondia 400 do backend | Critica | `[x]` |
| B006 | HealthDashboard usava dados aleatorios em vez de metricas reais | Alta | `[x]` |
| B007 | OnboardingCompleted/WatchConnection navegavam para rota inexistente Main | Alta | `[x]` |
| B008 | ProfileScreen navegava para rota inexistente DeleteAccount | Media | `[x]` |
| B009 | `mainIntention` do onboarding era descartada no backend | Media | `[x]` |
| B010 | Typecheck mobile quebrava por tipos Jest herdados sem dependencia instalada | Media | `[x]` |
| B011 | WebApp ignorava onboarding e ia direto para o app apos criar conta | Critica | `[x]` |
| B012 | WebApp nao conseguia abrir Chat a partir da lista de mensagens | Alta | `[x]` |
| B013 | ChatService marcava como lidas mensagens enviadas pelo proprio usuario | Media | `[x]` |
| B014 | `npm run start:prod` apontava para `dist/main`, mas build gera `dist/src/main.js` | Media | `[x]` |
| B015 | Vite pre-transform crash: `react-native-health` e `react-native-health-connect` nao instalados mas referenciados via `require()` em try/catch — Vite tentava resolve-los durante `optimizeDeps` mesmo nunca sendo usados no web | Critica | `[x]` |

---

## Decisoes Tecnicas

- Geolocation: regiao textual no MVP, coordenadas postergado para v0.3.0
- Auth: JWT proprio (sem Supabase Auth) para controle total
- Retencao health_metrics_raw: 90 dias apos ultima coleta
- Expo: mantido para facilidade de build no MVP
- Dados brutos de saude removidos do core do produto (apenas bandas semanticas)
- Usuario pode usar o app sem smartwatch (questionario manual)

---

## Historico de Versoes

| Versao | Data | Principais entregas |
|--------|------|---------------------|
| `0.1.0` | 2026-05-07 | MVP completo: backend NestJS, mobile React Native, infra Docker |
| `0.1.1` | 2026-05-08 | Correcoes web, modo demo, mock data |
| `0.2.0` | 2026-07-04 | Onboarding, moderacao, perfil seguro, matching transactional, docs |
| `0.3.0` | 2026-07-04 | Audit, roles, healthcheck, logs estruturados, retencao, onboarding mobile completo, testes de integracao |
| `0.4.0` | 2026-07-04 | Geolocation, ML, desafios progresso, CI/CD, photo upload, health dashboard, provider sync mobile, correcoes |
| `0.4.1` | 2026-07-04 | Estabilizacao: swipe, onboarding motion, dashboard real, migrations TypeORM/SQL, CI integration command, typecheck mobile, happy path API/UI web |
| `0.5.1` | 2026-07-05 | Historico detalhado de desafios, E2E Playwright, i18n padronizado |
