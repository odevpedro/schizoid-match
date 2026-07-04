# Backlog — WellMatch

> Registro vivo do progresso do projeto. Atualizado a cada mudanca de estado de uma funcionalidade.
> **Ultima atualizacao:** 2026-07-04

---

## Sobre o Projeto

Aplicativo privacy-first para conectar pessoas por compatibilidade de rotinas saudaveis, caminhadas, treinos e companhia — sem expor dados sensiveis de saude.

**Versao atual:** `0.3.0`
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

**Documentacao:**
- `[x]` README.md, backlog.md, data-model.md, security.md, system-feature-flows.md atualizados

---

## Pendentes

### Smartwatch Integration — P1

- `[ ]` HealthKit provider (iOS)
- `[ ]` Health Connect provider (Android)
- `[ ]` Garmin Connect API
- `[ ]` Fitbit API

### Perfil e Match — P1

- `[ ]` Upload de foto de perfil (revelada so apos match)
- `[ ]` Filtros de match (distancia real via geolocation)
- `[ ]` Desfazer match (unmatch)

### Desafios — P2

- `[ ]` Progresso automatico de desafio via metricas do dia
- `[ ]` Notificacoes de desafio concluido
- `[ ]` Historico de desafios completados

### Infraestrutura — P1

- `[x]` Testes de integracao (auth, match, health)
- `[x]` Observabilidade (logs estruturados com LoggingInterceptor)
- `[ ]` CI/CD com GitHub Actions
- `[ ]` Migracao TypeORM automatizada (rodar migrations na inicializacao)
- `[ ]` Deploy em producao (Railway, Render ou VPS)

### Machine Learning — P3

- `[ ]` Modelo de compatibilidade baseado em embeddings de perfil
- `[ ]` Recomendacao personalizada por comportamento de swipe

---

## Bugs Conhecidos

| ID | Descricao | Severidade | Status |
|----|-----------|------------|--------|
| B001 | public_health_profile nao populado (substituido por PublicWellnessProfile) | Resolvido | `[x]` |
| B002 | Rate limit de swipes usava contagem total, nao diaria | Resolvido | `[x]` |
| B003 | Sugestoes de chat deterministicas por charCodeAt(0) | Resolvido | `[x]` |
| B004 | Variaveis de ambiente nao validadas | Media | Aberto |

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
