# WellMatch — Prompt de Continuacao (Junho/2026)

> **Atualizacao pos-varredura — 2026-07-04:** este prompt nasceu na v0.4.0 e varios bugs abaixo ja foram resolvidos na v0.4.1. Estado atual validado: backend em `http://localhost:3001/`, web em `http://localhost:5173/`, Postgres/TimescaleDB e Redis via Docker Compose. O happy path foi validado por API local e pela UI web: criar conta -> onboarding com motion -> candidatos -> match -> conversa -> mensagem. Proximo foco real: repetir esse fluxo no Android Studio/emulador antes de testar smartwatch fisico.
> **Correcao Vite (2026-07-04):** `react-native-health` e `react-native-health-connect` — referenciados via `require()` em `native-health.ts` mas nao instalados — causavam `Pre-transform error` no Vite apos limpeza de cache, resultando em tela preta no onboarding. Corrigido com stubs vazios em `mobile/stubs/` e aliases no `vite.config.ts`. Fluxo completo registrado via Chrome headless sem erros.

## Contexto do Projeto

WellMatch e uma plataforma **privacy-first** de bem-estar social com matching semantico entre usuarios baseado em bandas de saude (nao dados brutos). O projeto esta na **v0.4.1** rodando em desenvolvimento:

- **Backend**: NestJS 10 + TypeORM + PostgreSQL (TimescaleDB) + Redis + Socket.IO
- **Mobile**: React Native (com react-native-web para dev via Vite na web)
- **Infra**: Docker Compose (postgres:15-alpine + redis:7-alpine)

O app roda no navegador em `http://localhost:5173/` e o backend em `http://localhost:3001/`.

---

## Problemas Conhecidos (BUGS ATIVOS)

1. **Resolvido na v0.4.1 — Swipe 400/race condition** — `MatchScreen` nao remove mais card antes do await, erros aparecem no frontend, `getCandidates` retorna `userId` valido e o happy path criou match por API/UI web.

2. **Bugs corrigidos recentemente** (nao devem voltar):
   - `TagsField` crashava com tags undefined/null (corrigido com fallback `?? []`)
   - `challenges` endpoint 500 por colunas `progress_value` e `completed_at` ausentes (adicionadas manualmente, migration precisa ser atualizada)
   - `migration 007` nao foi executada pelo TypeORM (colunas `latitude`/`longitude` adicionadas manualmente via SQL)
   - "Ir para o onboarding" navegava para rota inexistente (corrigido: usa `setOnboardingCompleted(false)` da auth store)

3. **Resolvido na v0.4.1 — dados mock vs reais** — HealthDashboardScreen consome `GET /health/dashboard`; sync mobile usa HealthService para ingestao e mantem simulacao apenas como provider/dev.

---

## O que Esta Implementado (9 modulos backend, 17+ telas mobile)

### Backend (9 modulos NestJS)
- `auth` — JWT (registerAsync), bcryptjs, passport-jwt/local, RolesGuard (user/moderator/admin)
- `users` — CRUD, onboarding 7 passos, preferencias, avatar (URL string apenas), soft delete
- `health` — Ingestao de metricas, consentimento granular (purpose), 5 providers (simulated, healthkit, health_connect, garmin, fitbit), processamento em bandas semanticas, healthcheck (`/health`, `/ready`)
- `matching` — Swipe (like/dislike/super_like), match bilateral, compatibilidade 6 dimensoes (Jaccard + distancia ordinal), recomendacao TF-IDF + collaborative filtering (em memoria - Map), geolocalizacao Haversine, unmatch, rate limit 50/dia
- `chat` — Mensagens REST + WebSocket (Socket.IO namespace `/chat`), read receipts, participacao validada, 10 sugestoes de bem-estar
- `challenges` — CRUD de desafios, progresso por usuario, conclusao, historico
- `privacy` — Exportar dados, deletar dados de saude, deletar conta (soft delete + anonimizar), cron de retencao (diario 3am)
- `moderation` — Bloquear/desbloquear, denunciar (6 motivos), banir (warning/temp/perm) com moderação-action
- `audit` — GlobalModule, 19 tipos de eventos auditados em 7+ servicos

### Mobile (17+ telas, 4+ componentes)
- **Auth**: LoginScreen, RegisterScreen
- **Onboarding**: 9 telas (Intro, Intent, Goals, Activities, Availability, Intensity, Privacy, DataSource, Permissions, WatchConnection, Completed)
- **Main**: ProfileScreen, MatchScreen (swipe com cards animados), MessagesScreen, ChatScreen, ChallengesScreen, PrivacyScreen, HealthDashboardScreen, WatchConnectionScreen, ReportUserScreen, BlockedUsersScreen
- **Servicos**: api (axios), auth, matching, chat, socket (Socket.IO), health, health-sync (auto-sync 2min), native-health (bridge stubs), moderation, onboarding, storage (adapter cross-platform)
- **Stores Zustand**: auth, match, chat
- **Componentes**: WellnessCard (pan responder + animacao), MessageBubble, BlockUserButton, Badge, Button, Input, WellnessBadges, CompatibilityBar

---

## O que Precisa Ser Feito (Priorizado)

### CRITICO — Bugs e Debitos

1. **Resolvido na v0.4.1 — swipe 400** — validar apenas regressao no Android/emulador.

2. **Resolvido na v0.4.1 — HealthDashboard real** — usa `GET /health/dashboard`.

3. **Resolvido na v0.4.1 — migration TypeORM** — `GeolocationAndChallengeProgress1720050000000` criada e executada localmente.

4. **Revisar getCandidates shape** — Verificar se o retorno de `getCandidates` no backend tem `userId` na raiz do objeto. O frontend acessa `candidates[0].userId`, mas o backend faz spread `{ ...candidate, displayName, ... }` onde `candidate` e um `PublicWellnessProfile` cujo campo de id e `userId`. Confirmar que nao retorna `user.id` aninhado.

5. **Adicionar logger de erro no frontend** — Criar um console.error ou toast para erros de API que hoje sao silenciosos (ex: catch vazio no handleSwipe).

### ALTA — Funcionalidades Incompletas

6. **Upload real de avatar** — Hoje `POST /users/me/avatar` aceita apenas URL string. Implementar multer + upload para disco local ou S3-compatible. O `.env` tem `STORAGE_BUCKET` e `STORAGE_ENDPOINT` vazios — configurar ou remover.

7. **Resolvido na v0.4.1 — Super like no frontend** — botao estrela chama `super_like`.

8. **Resolvido na v0.4.1 — notifyMatch()** — chamado apos criacao de match bilateral.

9. **Recomendacao persiste em memoria** — `RecommendationService` usa `Map` que e perdido no restart. Persistir interacoes no banco (tabela `swipe_history` ja existe). Ou popular o Map a partir do banco no startup.

10. **Envio de fotos no chat** — Chat so suporta texto (2000 chars). Adicionar upload de imagem no chat (multer + endpoint dedicado ou base64).

11. **Notificacoes push** — Nao ha qualquer sistema de notificacao. Planejar: Firebase Cloud Messaging (FCM) para Android, APNs para iOS.

### MEDIA — Melhorias e Features Novas

12. **CI/CD** — Nao existe `.github/`. Criar pipeline GitHub Actions com:
    - Lint + typecheck + build
    - Testes unitarios + integracao (PostgreSQL service container)
    - Docker build e push
    - Deploy (Render/Railway/VPS)

13. **Testes no mobile** — Zero testes. Adicionar Jest + React Native Testing Library. Testar stores Zustand, servicos, componentes principais (WellnessCard, MatchScreen).

14. **Provider smartwatch real** — `native-health.ts` tem stubs. Implementar bridge real para HealthKit (iOS Swift) e Health Connect (Android Kotlin). Requer builds nativas (expo dev client ou bare RN).

15. **Criptografia ponta-a-ponta** — Planejada em `docs/security.md`. Implementar criptografia no chat (ex: Signal Protocol ou libsignal) para mensagens.

16. **Admin dashboard** — Nao existe interface de administracao. Criar painel basico para moderadores/administradores: listar denuncias, banir usuarios, ver metricas.

17. **Historico de progresso de desafios** — `challenge-progress.entity` tem coluna `progress_history JSONB` mas endpoint de historico nao implementado. `GET /challenges/:id/progress` retorna progresso mas sem historico temporal.

### BAIXA — Refinamentos

18. **Seed com verificacao de duplicatas** — `seed.ts` roda com `ts-node` sem comando npm. Adicionar script em `package.json` (`npm run seed`) e verificar se dados ja existem antes de inserir.

19. **`.env` seguro** — `JWT_SECRET=change-this-to-a-strong-random-secret-in-production`. Gerar secret real e documentar rotação.

20. **Rate limit por usuario** — Hoje `@nestjs/throttler` e global (60 req/min). Migrar para rate limit por usuario autenticado usando Redis.

21. **Swagger com exemplos reais** — Alguns DTOs tem `@ApiProperty` sem exemplos. Completar documentacao Swagger.

22. **Mensagens de erro internacionalizadas** — Backend retorna mensagens em ingles, frontend em portugues. Criar i18n (i18next) ou padronizar.

23. **E2E com Playwright ou Detox** — Testar fluxo completo: registro -> onboarding -> swipe -> match -> chat.

24. **WebSocket reconexao com backoff** — `socket.service.ts` nao tem logica de reconexao. Adicionar reconnect com exponential backoff.

---

## Arquivos Chave para Comecar

### Backend
- `backend/src/main.ts` — Bootstrap com pipes, filters, interceptors, CORS
- `backend/src/app.module.ts` — Modulo raiz com todos os imports
- `backend/src/modules/matching/matching.service.ts` — swipe() com validacoes e transacao
- `backend/src/modules/matching/dto/swipe.dto.ts` — DTO com @IsUUID()
- `backend/src/modules/chat/chat.gateway.ts` — WebSocket com notifyMatch()
- `backend/src/modules/matching/recommendation.service.ts` — ML em memoria (Map)
- `backend/src/modules/matching/compatibility/compatibility.calculator.ts` — 6 dimensoes
- `backend/seed.ts` — 4 usuarios seed

### Mobile
- `mobile/src/screens/match/MatchScreen.tsx` — Swipe com race condition
- `mobile/src/services/matching.service.ts` — Chamada API
- `mobile/src/store/match.slice.ts` — Estado dos candidatos
- `mobile/src/screens/health/HealthDashboardScreen.tsx` — Dados mock (Math.random)
- `mobile/src/services/health-sync.service.ts` — Sync simulator
- `mobile/src/services/native-health.ts` — Bridges stubs
- `mobile/src/navigation/AppNavigator.tsx` — Navegacao condicional
- `mobile/vite.config.ts` — __DEV__ para base URL

### Infra
- `infra/docker-compose.yml` — PostgreSQL + Redis + Backend
- `infra/init.sql` — Schema completo (14 tabelas)
- `infra/migrations/` — 7 migrations SQL

---

## Dicas Importantes

- **NUNCA** commitar `.env` (esta no .gitignore)
- **NUNCA** usar `synchronize: true` no TypeORM (usar migrations versionadas)
- `__DEV__` no mobile e definido no `vite.config.ts` como `process.env.NODE_ENV !== 'production'`
- O backend precisa ser reiniciado apos mudancas (`kill $(lsof -t -i:3001) && node dist/src/main.js`)
- Para compilar backend: `npm run build` (ou `npx tsc`)
- Os testes rodam com `npm test` (5 unit + 1 integration = 45 endpoints)
- O repositorio tem 1 contribuidor (odevpedro) — sem "claude" em commits
- Nao existem branches alem de `main`
- Nao ha GitHub Actions configurado
- Nao ha cobertura de codigo (istanbul/nyc)
- Nao ha Dockerfile para producao (so docker-compose dev)
- Nao ha healthcheck de database/alembic-style migracoes

---

## Proximo Objetivo Imediato

1. Repetir o **happy path pela UI nativa no Android Studio/emulador**: criar conta -> onboarding motion -> match -> conversa -> mensagem.
2. Depois disso, testar **smartwatch/Health Connect real**: permissoes, sync, dashboard e efeito no matching.
3. Criar E2E automatizado Playwright/Detox para preservar o fluxo registro -> onboarding -> swipe -> match -> chat.
4. Fechar bootstrap de schema/migrations para CI sem depender de `init.sql` manual.

---

Boa sorte e mantenha a documentacao (`README.md`, `backlog.md`, `docs/`) sempre atualizada!
