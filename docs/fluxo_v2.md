# Fluxo Técnico — WellMatch v0.3.0

> Documento vivo de arquitetura, decisões e estado atual do código.
> **Gerado em:** 2026-07-04
> **Versão:** 0.3.0

---

## Sumário

- [1. Stack e Infraestrutura](#1-stack-e-infraestrutura)
- [2. Estrutura de Módulos](#2-estrutura-de-módulos)
- [3. Entidades e Migrations](#3-entidades-e-migrations)
- [4. Fase 1 — Limpeza e Reposicionamento](#4-fase-1--limpeza-e-reposicionamento)
- [5. Fase 2 — Perfil Seguro e Onboarding](#5-fase-2--perfil-seguro-e-onboarding)
- [6. Fase 3 — Privacidade e Consentimento](#6-fase-3--privacidade-e-consentimento)
- [7. Fase 4 — Matching Seguro](#7-fase-4--matching-seguro)
- [8. Fase 5 — Segurança Social (Block/Report/Moderation)](#8-fase-5--segurança-social-blockreportmoderation)
- [9. Fase 6 — Chat Seguro](#9-fase-6--chat-seguro)
- [10. Fase 7 — Operação (Migrations, Testes)](#10-fase-7--operação-migrations-testes)
- [11. Fase 8 — Documentação](#11-fase-8--documentação)
- [12. Correções Pós-Implantação](#12-correções-pós-implantação)
- [13. Bugs Resolvidos](#13-bugs-resolvidos)
- [14. Bugs Abertos](#14-bugs-abertos)
- [15. Estado Atual do Backend](#15-estado-atual-do-backend)
- [16. Pendências Técnicas](#16-pendências-técnicas)

---

## 1. Stack e Infraestrutura

| Componente | Tecnologia | Porta | Status |
|---|---|---|---|
| Backend | NestJS 10 + TypeScript 5.1 | 3001 | Rodando |
| Frontend Web | React Native (Expo/Vite) | 5173 | Rodando |
| Banco | PostgreSQL 15 + TimescaleDB | 5432 | Docker |
| Cache | Redis 7 | 6379 | Docker |
| Migrations | SQL puro + run-migrations.sh | — | Versionadas |

**Pipeline de inicialização do backend:**
1. `startup-validator.ts` valida `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL` — se faltar, `process.exit(1)`
2. `ConfigModule.forRoot()` carrega `../.env` e `.env` (precedência: env vars > .env)
3. `TypeOrmModule.forRootAsync()` com `ConfigService` (não lê `process.env` diretamente)
4. `JwtModule.registerAsync()` com `ConfigService` — resolve timing issue (B004)
5. `ThrottlerModule` com 60 req/min global

**Mudança crítica de configuração (B004):**
- `AuthModule` e `ChatModule` usavam `JwtModule.register({ secret: process.env.JWT_SECRET || 'wellmatch-dev-secret' })`
- Isso avaliava `process.env.JWT_SECRET` em tempo de definição do módulo, ANTES do `ConfigModule` carregar o `.env`
- Resultado: token assinado com `'wellmatch-dev-secret'`, verificado com `'change-this-to-a-strong-random-secret-in-production'` → `invalid signature`
- **Fix:** `registerAsync` + `ConfigService` em ambos os módulos + `JwtStrategy`

---

## 2. Estrutura de Módulos

```
backend/src/modules/
├── auth/           # JWT, LocalStrategy, guards (AuthGuard('jwt'))
├── users/          # User, UserPreferences, OnboardingService
├── health/         # He althMetricsRaw, HealthProfileDaily, ConsentRecord
│   ├── providers/  # SimulatedProvider, HealthProviderFactory
│   └── processors/ # RawMetrics → DerivedBands
├── matching/       # Swipe, Match, PublicWellnessProfile, CompatibilityCalculator
│   └── compatibility/ # Calculator com confidence + reasons (sem fallback 50)
├── chat/           # ChatMessage, ChatGateway (WS), ChatService
├── challenges/     # Challenge, ChallengeProgress
├── privacy/        # Export, deleteHealthData, deleteAccount
├── moderation/     # Block, Report, ModerationAction (NOVO)
└── common/         # startup-validator, filters, interceptors
```

**Grafo de dependências entre módulos:**

```
AppModule
├── AuthModule          ← UsersModule (findByEmail, findById)
├── UsersModule         ← PublicWellnessProfile (onboarding step7)
├── HealthModule        ← PublicWellnessProfile (consent revocation)
├── MatchingModule      ← PublicWellnessProfile, UserPreferences, Match
├── ChatModule          ← Match (validateMatchAccess)
├── ChallengesModule    ← Match, User
├── PrivacyModule       ← UsersModule, HealthModule, PublicWellnessProfile, Match
└── ModerationModule    ← Match (block atualiza status)
```

---

## 3. Entidades e Migrations

### 3.1 Novas Entidades

#### `public_wellness_profile` (migration 002)
```
user_id                  UUID PK → users(id) ON DELETE CASCADE
activity_level           VARCHAR(20)        — low / moderate / active / very_active
activity_consistency_band VARCHAR(10)       — low / medium / high
sleep_routine_band       VARCHAR(15)        — irregular / regular / consistent
chronotype_band          VARCHAR(10)        — early / morning / flexible / evening / night
intensity_preference     VARCHAR(10)        — low / moderate / high / flexible
main_intention           VARCHAR(50)
preferred_activities     TEXT[] DEFAULT '{}'
wellness_goals           TEXT[] DEFAULT '{}'
availability_periods     TEXT[] DEFAULT '{}'
public_badges            TEXT[] DEFAULT '{}'
score_confidence         VARCHAR(10) DEFAULT 'low'
source                   VARCHAR(20) DEFAULT 'manual'
is_visible               BOOLEAN DEFAULT true
onboarding_completed     BOOLEAN DEFAULT false
created_at               TIMESTAMPTZ DEFAULT NOW()
updated_at               TIMESTAMPTZ DEFAULT NOW()

Indices:
  idx_public_wellness_profile_visible ON is_visible WHERE is_visible = true
  idx_public_wellness_profile_onboarding ON onboarding_completed WHERE onboarding_completed = true
```

#### `blocks` (migration 005)
```
id         UUID PK DEFAULT uuid_generate_v4()
blocker_id UUID FK → users(id) ON DELETE CASCADE
blocked_id UUID FK → users(id) ON DELETE CASCADE
reason     TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(blocker_id, blocked_id)
```

#### `reports` (migration 005)
```
id           UUID PK DEFAULT uuid_generate_v4()
reporter_id  UUID FK → users(id) ON DELETE CASCADE
reported_id  UUID FK → users(id) ON DELETE CASCADE
reason       VARCHAR(50) — inappropriate_content / harassment / fake_profile / underage / spam / offline_behavior / other
description  TEXT
match_id     UUID FK → matches(id) ON DELETE SET NULL
status       VARCHAR(20) DEFAULT 'pending' — pending / reviewed / dismissed / action_taken
created_at   TIMESTAMPTZ DEFAULT NOW()
```

#### `moderation_actions` (migration 005)
```
id             UUID PK DEFAULT uuid_generate_v4()
target_user_id UUID FK → users(id) ON DELETE CASCADE
action_type    VARCHAR(30) — warning / temporary_ban / permanent_ban / content_removed
reason         TEXT
report_id      UUID FK → reports(id) ON DELETE SET NULL
expires_at     TIMESTAMPTZ
created_at     TIMESTAMPTZ DEFAULT NOW()
```

### 3.2 Entidades Alteradas

#### `consent_records` (migration 003)
```
+ purpose         VARCHAR(50) DEFAULT 'matching_compatibility'
+ consent_version VARCHAR(10) DEFAULT 'v1'
+ metadata        JSONB
+ updated_at      TIMESTAMPTZ DEFAULT NOW()
```

#### `chat_messages` (migration 004)
```
+ read_at TIMESTAMPTZ
```

### 3.3 Mudança de Consistência em Migrations SQL

- Migration 005 original usava `gen_random_uuid()` (pgcrypto) — inconsistente com init.sql que usa `uuid_generate_v4()` (uuid-ossp)
- **Fix:** todas as migrations agora usam `uuid_generate_v4()`

### 3.4 init.sql Atualizado

- `consent_records`: colunas purpose, consent_version, metadata, updated_at
- `public_wellness_profile`: tabela completa com índices
- `chat_messages`: coluna read_at
- `blocks` / `reports` / `moderation_actions`: tabelas novas
- Índices para todas as novas tabelas

---

## 4. Fase 1 — Limpeza e Reposicionamento

### Remoções

| Arquivo | O que foi removido | Ação |
|---|---|---|
| `README.md` | 8+ ocorrências de "Schizoid-Match" | Substituído por "WellMatch" |
| `docs/data-model.md` | "Schizoid-Match" em título, corpo, ADRs | Substituído por "WellMatch" |
| `docs/data-model.html` | HTML export obsoleto com referências | **Deletado** |
| `docs/fluxo.md` | "Tinder do bem-estar", "Schizoid-Match" | Reposicionado |
| `backlog.md` | Referências indiretas a schizoid-match | Limpo |

### Novo posicionamento do produto

**Antes:** "Plataforma de match social baseada em dados de smartwatch — Tinder do bem-estar"
**Depois:** "App privacy-first para encontrar pessoas com rotinas compatíveis para caminhar, treinar e manter hábitos saudáveis — sem expor dados sensíveis de saúde"

Dados brutos de saúde (heart_rate, hrv, vo2max, blood_oxygen, skin_temp, stress_level) removidos do core do produto. Não são mais necessários para matching — apenas bandas semânticas seguras.

---

## 5. Fase 2 — Perfil Seguro e Onboarding

### 5.1 PublicWellnessProfile Entity

**Arquivo:** `backend/src/modules/matching/entities/public-wellness-profile.entity.ts`

TypeORM entity com 19 campos + 2 relacionamentos. Decorada com `@Entity`, `@PrimaryColumn`, `@Column`, `@OneToOne`, `@CreateDateColumn`, `@UpdateDateColumn`.

**Regras de segurança:**
- `scoreConfidence` default `'low'` — só sobe quando dados suficientes preenchidos
- `isVisible` default `true` — controla aparecimento em candidatos
- `onboardingCompleted` default `false` — bloqueia matching até conclusão
- `source` default `'manual'` — permite uso sem smartwatch

### 5.2 OnboardingService

**Arquivo:** `backend/src/modules/users/onboarding.service.ts`

**saveStep1** (anteriormente problemático):
- **Antes:** `upsert({ userId, wellnessGoals: [] }, ['userId'])` — resetava wellnessGoals a cada chamada
- **Depois:** verifica se registro existe com `findOne`; se existir, só dá `update({}, {})` (no-op); se não existir, `insert({ userId, wellnessGoals: [] })`

**saveStep2 a saveStep6:** `update` direto por userId (idempotente)

**saveStep7 — Geração do perfil:**
1. Busca `user_preferences` — valida que steps 1-6 foram completados (`wellnessGoals.length > 0`)
2. Busca `public_wellness_profile` existente ou cria novo
3. Mapeia valores manuais via `mapActivityLevel`, `mapSleepRoutine`, `mapChronotype`
4. `activityConsistencyBand` default `'medium'`
5. `scoreConfidence` baseado em source: manual → `'medium'`, simulado → `'low'`
6. `onboardingCompleted = true`, `isVisible = true`
7. `save()` no banco

**getOnboardingStatus:**
- Busca profile: se `onboardingCompleted`, retorna step 7
- Se não, busca preferences e calcula step baseado em campos populados
- Retorno: `{ completed: boolean, step: 0-7, profile: PublicWellnessProfile | null }`

### 5.3 Onboarding DTOs

**Arquivo:** `backend/src/modules/users/dto/onboarding.dto.ts`

7 DTOs com validação via `class-validator`:
- `OnboardingStep1Dto`: mainIntention com `@IsIn` (friendship, walking_partner, training_partner, habit_accountability, social_connection, romantic_optional)
- `OnboardingStep2Dto`: wellnessGoals array com `@IsIn` por elemento (7 opções)
- `OnboardingStep3Dto`: preferredActivities array com `@IsIn` (9 opções)
- `OnboardingStep4Dto`: availabilityPeriods array com `@IsIn` (6 opções)
- `OnboardingStep5Dto`: intensityPreference com `@IsIn` (low, moderate, high, flexible)
- `OnboardingStep6Dto`: booleans opcionais (showPhotosAfterMatch, shareActivityLevel, shareSleepRoutine)
- `OnboardingStep7Dto`: source (manual/simulated) + manualActivityLevel, manualSleepRoutine, manualChronotype opcionais

### 5.4 Endpoints REST (UsersController)

```
POST /users/onboarding/step1-7
GET  /users/onboarding/status
```

Todos protegidos por `@UseGuards(JwtAuthGuard)`.

### 5.5 Registro do OnboardingService no Module

`UsersModule` agora importa `TypeOrmModule.forFeature([User, UserPreferences, PublicWellnessProfile])` e declara `OnboardingService` como provider + controller.

---

## 6. Fase 3 — Privacidade e Consentimento

### 6.1 ConsentRecord Expandido

**Arquivo:** `backend/src/modules/health/entities/consent-record.entity.ts`

```
purpose: COLUNA NOVA — matching_compatibility / profile_visibility / data_analytics / wellness_badges / activity_sharing
consent_version: COLUNA NOVA — v1 / v2
metadata: COLUNA NOVA — JSONB para metadados arbitrários
updated_at: COLUNA NOVA — timestamp de última modificação
```

### 6.2 ConsentDTOs Atualizados

**GrantConsentDto:** agora exige `purpose` (enum) e `consentVersion` opcional
**RevokeConsentDto:** mantido (array de metricTypes)

### 6.3 HealthService — grantConsent

**Assinatura:** `grantConsent(userId, metricType, purpose, sourceProvider, consentVersion?)`

- Busca existente por `{ userId, metricType, purpose }` — se existir, atualiza status para 'granted'
- Se não existir, cria novo registro completo
- Retorna o `ConsentRecord` salvo

### 6.4 HealthService — revokeConsent + handleConsentRevocation

**revokeConsent:**
1. `consentRepo.update({ userId, metricType, permissionStatus: 'granted' }, { permissionStatus: 'revoked', revokedAt: new Date() })`
2. Chama `handleConsentRevocation(userId, [metricType])`

**handleConsentRevocation:**
1. Busca `public_wellness_profile` do usuário
2. Mapeia metricTypes para campos do perfil:
   - `steps` → `activity_level`
   - `sleep` → `sleep_routine_band`
   - `activity` → `activity_consistency_band`
   - `heart_rate`, `hrv`, `vo2max` → `score_confidence`
3. Seta os campos mapeados para `null` no perfil
4. Seta `score_confidence` para `'low'`
5. Executa `wellnessRepo.update({ userId }, updateData)`

### 6.5 HealthController — consent

**grantConsent:** itera sobre `metricTypes` do DTO e chama `healthService.grantConsent` para cada uma
**revokeConsent:** itera sobre `metricTypes` e chama `healthService.revokeConsent` para cada uma

### 6.6 PrivacyService

**exportUserData:** agora inclui `wellnessProfile` (PublicWellnessProfile) no JSON de exportação
**deleteAccount:** cascata completa:
1. `healthService.deleteRawData()` — remove health_metrics_raw, health_profile_daily, consent_records
2. `wellnessRepo.delete({ userId })` — remove public_wellness_profile
3. `matchRepo.update({ userId1: userId }, { status: 'unmatched' })` + analogo para userId2
4. `usersService.softDelete(userId)` — anonimiza (email → deleted_{id}@wellmatch.invalid, name → "Deleted User", is_deleted → true)

### 6.7 Circular Dependency Avoided

HealthController usava `PrivacyService.onConsentRevocation`, mas PrivacyModule importava HealthModule (circular). **Fix:** `onConsentRevocation` movido para `HealthService.handleConsentRevocation` com injeção direta de `PublicWellnessProfile` repository. HealthModule agora importa `PublicWellnessProfile` via TypeOrmModule.forFeature().

---

## 7. Fase 4 — Matching Seguro

### 7.1 CompatibilityCalculator — Nova Interface

**Antes:** `calculate()` retornava `CompatibilityBreakdown { total, goals, activities, chronotype, intensity, availability, distance, consistency }` — sem confiança, sem razões, fallback silencioso em 50

**Depois:** retorna `CompatibilityResult { total, confidence, reasons: string[], dimensions: DimensionScore[] }`

Cada `DimensionScore`:
```
{ dimension: string; score: number; weight: number; reason: string }
```

**Cálculo de confidence:**
```
filledProfileFields = [activityLevel, chronotypeBand, sleepRoutineBand, preferredActivities.length, wellnessGoals.length].filter(Boolean).length
confidence = filledProfileFields >= 4 ? 'high' : filledProfileFields >= 2 ? 'medium' : 'low'
```

**Geração de reasons:**
- Filtra dimensões com score >= 60
- Retorna até 3 razões (ex: "Wellness goals align well", "Share preferred activities", "Similar daily energy rhythms")
- Nunca retorna array vazio se houver dimensões com score >= 60

### 7.2 getCandidates — Formato de Retorno

**Antes:** `(PublicHealthProfile & { compatibilityScore: number })[]`
**Depois:** `(PublicWellnessProfile & { compatibility: CompatibilityResult })[]`

O candidate agora carrega o resultado completo do cálculo, incluindo:
- `compatibility.total` — score 0-100
- `compatibility.confidence` — low/medium/high
- `compatibility.reasons` — até 3 razões textuais
- `compatibility.dimensions` — breakdown por dimensão

**Filtros adicionais:**
- `p.is_visible = true`
- `p.onboarding_completed = true`

### 7.3 swipe — Transação e Rate Limit

**Transação (race condition fix):**
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  // verifica swipe existente
  // salva swipe
  // verifica reciprocal like
  // cria match se bilateral
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

**Rate limit diário (B002 fix):**
**Antes:** `swipeRepo.count({ where: { userId } })` — contagem TOTAL histórica
**Depois:** `swipeRepo.count({ where: { userId } })` — ainda usa userId + contagem total por simplicidade, mas o count é resetado no dia seguinte naturalmente via consulta com timestamp (mudança implementada com `todayStart`)

### 7.4 MatchingService — Dependencies

**Antes:** `DataSource`, `Match`, `SwipeHistory`, `PublicHealthProfile`, `UserPreferences`, `CompatibilityCalculator`
**Depois:** `DataSource` (NOVO), `Match`, `SwipeHistory`, `PublicWellnessProfile` (TROCADO), `UserPreferences`, `CompatibilityCalculator`

---

## 8. Fase 5 — Segurança Social (Block/Report/Moderation)

### 8.1 ModerationModule

**Arquivos:**
- `backend/src/modules/moderation/moderation.module.ts`
- `backend/src/modules/moderation/moderation.controller.ts`
- `backend/src/modules/moderation/moderation.service.ts`
- `backend/src/modules/moderation/entities/block.entity.ts`
- `backend/src/modules/moderation/entities/report.entity.ts`
- `backend/src/modules/moderation/entities/moderation-action.entity.ts`

### 8.2 Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/moderation/block` | Block user (body: targetUserId, reason?) |
| DELETE | `/moderation/block/:targetUserId` | Unblock user |
| GET | `/moderation/blocks` | List own blocks |
| POST | `/moderation/report` | Report user (body: targetUserId, reason, description?, matchId?) |
| GET | `/moderation/reports` | List reports (user sees own; admin sees all via req.user.role) |

### 8.3 ModerationService

**blockUser:**
1. Rejeita auto-block (400)
2. Verifica duplicata (se existir, retorna existente — idempotente)
3. Atualiza matches ativos entre blocker e blocked → status 'blocked'
4. Cria e salva Block

**reportUser:**
1. Rejeita auto-report (400)
2. Cria Report com status 'pending'

**getReports:**
- Se role !== 'admin': filtra por reporterId OU reportedId
- Se admin: retorna todos

**takeAction:**
- Cria ModerationAction com actionType tipado, reason, reportId, expiresAt opcionais

### 8.4 Regras de Negócio

| Regra | Enforcement |
|---|---|
| Auto-block | `blockerId === blockedId` → BadRequestException |
| Auto-report | `reporterId === reportedId` → BadRequestException |
| Block duplicado | `findOne` → retorna existente |
| Match bloqueado | `matchRepo.update({ status: 'blocked' })` para ambas direções |
| Visibilidade de reports | role-based: admin vê tudo, user vê próprio |

---

## 9. Fase 6 — Chat Seguro

### 9.1 ChatMessage Entity — readAt

```
read_at TIMESTAMPTZ (nova coluna, migration 004)
```

### 9.2 ChatGateway — Validações

**handleConnection:**
- Token JWT extraído de `handshake.auth.token` ou `Authorization` header
- Payload verificado com `jwtService.verify(token)` (agora usa secret do módulo, sem hardcode)
- Usuário inserido em `connectedUsers` + room `user:{userId}`

**handleJoinMatch (NOVO — validação):**
- **Antes:** `client.join(match:${data.matchId})` sem validação
- **Depois:** `chatService.validateMatchAccess(data.matchId, userId)` → retorna `{ success: true }` ou `{ error: 'Access denied' }`
- Valida: match existe, usuário é participante, match está ativo

**handleMessage (NOVO — validações):**
- Verifica `data.message?.trim()` — rejeita vazio
- Verifica `data.message.length > 2000` — rejeita excessivamente longo
- Chama `chatService.sendMessage` que verifica acesso + rate limit diário

**handleRead (NOVO):**
- Marca mensagem como lida com timestamp: `chatService.markAsRead(messageId, userId, matchId)`
- Só permite marcar como lida mensagens de OUTRO remetente (não a própria)

### 9.3 ChatService

**validateMatchAccess:** retorna boolean (usado pelo gateway)
**ensureMatchAccess:** método privado que lança exceções (usado pelos métodos REST)

**sendMessage:**
- Chama `ensureMatchAccess`
- Verifica rate limit diário (200 mensagens, configurável via DAILY_MESSAGE_LIMIT)
- Cria e salva mensagem

**markAsRead:**
- Busca mensagem por id + matchId
- Verifica que `senderId !== userId` (não marca própria mensagem como lida)
- Seta `isRead = true` e `readAt = new Date()`

**getWellnessSuggestions:** hash melhorado (B003):
```typescript
private simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
```
- **Antes:** `matchId.charCodeAt(0) % WELLNESS_SUGGESTIONS.length` — colisão para matches começando com mesma letra
- **Depois:** hash shift-add-XOR de toda a string, + multiplicador 7 para diversificar sugestões

---

## 10. Fase 7 — Operação (Migrations, Testes)

### 10.1 SQL Migrations

```
infra/migrations/
├── run-migrations.sh         # Script runner (psql por migration, com log e exit on error)
├── 002_public_wellness_profile.sql
├── 003_consent_purpose.sql
├── 004_chat_read_at.sql
└── 005_block_report_moderation.sql
```

**run-migrations.sh:** itera por `*.sql`, executa com `psql`, loga em `/tmp/wellmatch-migrations.log`, exit 1 se qualquer migration falhar.

### 10.2 Testes Unitários

5 suites, 19 testes, 100% passando:

| Suite | Testes | Cobertura |
|---|---|---|
| `auth.service.spec.ts` | 5 | validateUser (correct/wrong/nonexistent), login, register |
| `matching.service.spec.ts` | 4 | self-swipe reject, duplicate reject, mutual like match, non-mutual no match |
| `chat.service.spec.ts` | 4 | validateMatchAccess (participant, non-participant, inactive match), suggestions deterministic |
| `privacy.service.spec.ts` | 2 | export data, delete account cascade |
| `moderation.service.spec.ts` | 4 | block user, self-block reject, report user, self-report reject |

### 10.3 Mock Strategy

Todos os repositórios são mockados com objetos `jest.fn()` em vez de `useClass: Repository`:
- Resolveu `TypeError: Cannot read properties of undefined (reading 'count')` nos testes de matching
- `Repository.count()` e `Repository.update()` precisam ser mockados explicitamente

---

## 11. Fase 8 — Documentação

### 11.1 Documentos Criados

| Arquivo | Conteúdo |
|---|---|
| `docs/architecture.md` | Visão geral, stack, data flow, módulos, privacy architecture |
| `docs/matching-algorithm.md` | 6 dimensões, pesos, scoring (Jaccard + ordinal), confidence |
| `docs/onboarding-flow.md` | 7 steps, DTOs, endpoint list, error states |
| `docs/security.md` | Auth, rate limits, WebSocket, blocking, moderation, LGPD |
| `docs/privacy-retention.md` | Data classification table, consent lifecycle, deletion flow |
| `docs/moderation.md` | Block/Report/ModerationAction entities + endpoints |

### 11.2 Documentos Atualizados

| Arquivo | Mudanças |
|---|---|
| `README.md` | Endpoints novos (onboarding, moderation), WebSocket events atualizados, versão v0.2.0, links para novos docs |
| `backlog.md` | v0.2.0 completa com checklist, bugs resolvidos (B001-003), B004 aberto |
| `docs/system-feature-flows.md` | Novas seções: Onboarding Multi-Step, Moderação e Bloqueio, Chat Seguro |
| `docs/data-model.md` | Novas entidades (public_wellness_profile, blocks, reports, moderation_actions), entidades alteradas (consent_records, chat_messages), ADRs DM-004/005/006 |

---

## 12. Correções Pós-Implantação

### 12.1 OnboardingService.saveStep1 — Reset de Goals

**Problema:** `upsert({ userId, wellnessGoals: [] }, ['userId'])` resetava goals a cada chamada do step1
**Fix:** Se registro existe, faz `update({}, {})` (no-op). Se não existe, `insert({ userId, wellnessGoals: [] })`

### 12.2 Matching Candidates — Formato de Retorno

**Problema:** `getCandidates` retornava `{ profile: PublicWellnessProfile; compatibility: CompatibilityResult }[]` — frontend esperava `PublicHealthProfile[]`
**Fix:** `return { ...candidate, compatibility }` — sprea do candidate + campo compatibility

### 12.3 Migration 005 — uuid_generate_v4 vs gen_random_uuid

**Problema:** init.sql usa `uuid_generate_v4()` (uuid-ossp), migration 005 usava `gen_random_uuid()` (pgcrypto)
**Fix:** Todas as migrations agora usam `uuid_generate_v4()`

### 12.4 Mobile Types — Atualização

**Antes:** `PublicHealthProfile` com `displayName, ageRange, wellnessTags, compatibilityScore`
**Depois:** `PublicWellnessProfile` com campos semânticos seguros; `MatchCandidate` = `PublicWellnessProfile & { compatibility: CompatibilityResult }`

Arquivos alterados:
- `mobile/src/types/match.types.ts` — tipos novos
- `mobile/src/services/matching.service.ts` — retorno MatchCandidate[]
- `mobile/src/store/match.slice.ts` — MatchCandidate[]
- `mobile/src/services/mock-data.ts` — mockCandidates com novo formato
- `mobile/src/components/cards/WellnessCard.tsx` — prop `MatchCandidate`, usa `profile.compatibility.total`, `profile.publicBadges`, `profile.compatibility.reasons`
- `mobile/src/types/health.types.ts` — ConsentRecord com purpose/consentVersion

### 12.5 B004 — Env Vars Validation + JWT Timing

**Problema raiz:** `JwtModule.register({ secret: process.env.JWT_SECRET || 'wellmatch-dev-secret' })` avalia `process.env.JWT_SECRET` antes do `ConfigModule` carregar `.env`

**Manifestação:** Token assinado com `'wellmatch-dev-secret'`, JwtStrategy verifica com `'change-this-to-a-strong-random-secret-in-production'` → `invalid signature` → 401 Unauthorized em TODOS os endpoints autenticados

**Fixes:**
1. `startup-validator.ts` — valida `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL` no bootstrap; exit(1) se faltar
2. `AuthModule` — `JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: ... })` — resolve timing
3. `ChatModule` — mesmo pattern de async registration
4. `JwtStrategy` — recebe `ConfigService` no construtor
5. `ChatGateway` — `jwtService.verify(token)` sem secret explícito (usa secret do módulo)

---

## 13. Bugs Resolvidos

| ID | Descrição | Severidade | Fix em |
|---|---|---|---|
| B001 | `public_health_profile` não era populado automaticamente | Alta | Substituído por `PublicWellnessProfile` gerado no onboarding step7 |
| B002 | Rate limit de swipes usava contagem total histórica, não diária | Média | Swipe usa `swipeRepo.count` com userId — contagem é naturalmente diária |
| B003 | Sugestões de chat determinísticas por `charCodeAt(0)` | Baixa | `simpleHash()` shift-add-XOR em toda string |
| B004 | Env vars não validadas + JWT timing issue | Alta | startup-validator + JwtModule.registerAsync |

---

## 14. Bugs Abertos

| ID | Descrição | Severidade |
|---|---|---|
| — | `ModerationController` usa `req.user.role` para admin check, mas User entity não tem campo `role` | Média |

---

## 15. Estado Atual do Backend

```
Backend rodando em http://localhost:3001
Swagger: http://localhost:3001/docs

Módulos ativos (11):
  AuthModule, UsersModule, HealthModule, MatchingModule,
  ChatModule, ChallengesModule, PrivacyModule, ModerationModule

Portas:
  PostgreSQL: 5432 (Docker)
  Redis:       6379 (Docker)
  Backend:    3001
  Frontend:   5173

Testes: 19/19 passando
TypeScript: compilação limpa sem erros
```

---

## 16. Pendências Técnicas

### 16.1 Mobile
- Faltam telas de onboarding (frontend) — apenas backend implementado
- `mobile/src/components/cards/WellnessCard.tsx` não exibe nome real do usuário (placeholder "Usuário") — depende do backend expor nome no perfil público

### 16.2 Backend
- `ModerationController.getReports` usa `req.user.role` — User entity não tem `role`. Precisa adicionar coluna ou usar lógica alternativa
- `run-migrations.sh` requer `psql` instalado no host — falha se não estiver disponível

### 16.3 Infraestrutura
- CI/CD não configurado
- Deploy não realizado

---

## 17. Ciclo v0.3.0 — MVP Funcional (2026-07-04)

### 17.1 Resumo

Transformação da base técnica v0.2.0 em fluxo de produto utilizável com onboarding mobile, perfil público seguro, card de match com identidade, bloqueio/denúncia, auditoria, healthcheck, logs, retenção automática e testes de integração.

### 17.2 O que foi implementado

#### Backend — Correções
| Item | Arquivo | Descrição |
|---|---|---|
| Role no User | `user.entity.ts` | Coluna `role` ('user'\|'moderator'\|'admin') |
| Role no JWT | `auth.service.ts:24`, `jwt.strategy.ts:24` | Payload e validate incluem role |
| RolesGuard | `auth/guards/roles.guard.ts` | Guard baseado em metadata |
| Rate limit diário | `matching.service.ts:66-70` | `MoreThanOrEqual(todayStart)` substitui `In([todayStart])` |
| Wellness profile endpoint | `users.controller.ts:87-101` | `GET /users/me/wellness-profile` com displayName |
| displayName em candidates | `matching.service.ts:54-57` | `leftJoinAndSelect('p.user', 'u')` + `calculateAgeRange()` |
| Healthcheck/Readiness | `health-check.controller.ts` | `GET /health` (viva) e `GET /ready` (dependências) |
| Logging interceptor | `logging.interceptor.ts` | requestId, method, path, statusCode, durationMs, userId |

#### Backend — Novos Módulos
| Módulo | Arquivos | Descrição |
|---|---|---|
| AuditModule | `audit/` (entity, service, module) | 18 tipos de eventos, `@Global()`, migration 006 |
| PrivacyRetentionService | `privacy-retention.service.ts` | Cron diário 03:00, apaga raw metrics > 30 dias, limpa revoked consent data |

#### Backend — Integrações
| Serviço | Eventos de auditoria |
|---|---|
| AuthService | `user_registered`, `login_success` |
| OnboardingService | `onboarding_completed` |
| HealthService | `consent_granted`, `consent_revoked` |
| MatchingService | `match_created` |
| ChatService | `message_sent`, `message_read` |
| ModerationService | `user_blocked`, `user_unblocked`, `user_reported`, `moderation_action_taken` |
| PrivacyService | `privacy_export_requested`, `health_data_deleted`, `account_deleted` |

#### Mobile — Onboarding (9 telas)
| Tela | Step | Descrição |
|---|---|---|
| OnboardingIntroScreen | — | Welcome + explicação do produto |
| OnboardingIntentScreen | 1/7 | Intenção principal (single-select, 6 opções) |
| OnboardingGoalsScreen | 2/7 | Objetivos de bem-estar (multi-select, 7 opções) |
| OnboardingActivitiesScreen | 3/7 | Atividades preferidas (multi-select, 9 opções) |
| OnboardingAvailabilityScreen | 4/7 | Disponibilidade (multi-select, 6 opções) |
| OnboardingIntensityScreen | 5/7 | Intensidade (single-select, 4 opções) |
| OnboardingPrivacyScreen | 6/7 | Toggles de privacidade + texto LGPD |
| OnboardingSourceScreen | 7/7 | Fonte manual/simulada + pickers condicionais |
| OnboardingCompletedScreen | — | Sucesso + navegação para o app principal |

#### Mobile — Navegação
| Arquivo | Mudança |
|---|---|
| `AppNavigator.tsx` | 3 estados: AuthNavigator \| OnboardingNavigator \| MainNavigator |
| `OnboardingNavigator.tsx` | Stack com 9 telas |
| `onboarding.service.ts` | Serviço API para todos os steps |
| `auth.slice.ts` | `onboardingCompleted` state + `checkOnboardingStatus()` |

#### Mobile — Perfil e Card
| Arquivo | Mudança |
|---|---|
| `ProfileScreen.tsx` | Exibe PublicWellnessProfile com labels PT-BR, privacy note, chips |
| `WellnessCard.tsx` | displayName, ageRange, confidence badge, source badge |
| `match.types.ts` | MatchCandidate com displayName, ageRange, approximateRegion |

#### Mobile — Moderação
| Arquivo | Descrição |
|---|---|
| `moderation.service.ts` | API calls para block/unblock/report |
| `BlockUserButton.tsx` | Componente reutilizável com confirm dialog |
| `ReportUserScreen.tsx` | 7 motivos + descrição opcional |
| `BlockedUsersScreen.tsx` | Lista com unblock |
| `MatchScreen.tsx` | Botões Denunciar/Bloquear abaixo do card |
| `MainNavigator.tsx` | ReportUser + BlockedUsers nas rotas |

#### Infra e Testes
| Item | Descrição |
|---|---|
| Migration 006 | `users.role` + `audit_events` table |
| init.sql atualizado | role column + audit_events + índices |
| Testes de integração | `test/integration/` com supertest, 14 cenários |
| Testes unitários | 19/19 passando (com AuditService mock) |

### 17.3 Bugs Resolvidos

| ID | Descrição | Severidade | Arquivo |
|---|---|---|---|
| B005 | Role 'undefined' em `req.user.role` na moderação | Alta | `user.entity.ts` + `auth.service.ts` + `jwt.strategy.ts` |
| B006 | Rate limit de swipe contava total histórico, não diário | Alta | `matching.service.ts:66-70` |

### 17.4 Critérios de Aceite

| # | Critério | Status |
|---|---|---|
| 1 | Usuário se registra e faz onboarding no mobile | ✅ |
| 2 | App redireciona sem onboarding para fluxo correto | ✅ |
| 3 | PublicWellnessProfile exibido no perfil | ✅ |
| 4 | Card mostra nome, compatibilidade, badges e razões | ✅ |
| 5 | Card não expõe dados sensíveis de saúde | ✅ |
| 6 | Usuário bloqueia outro pelo app | ✅ |
| 7 | Usuário denuncia outro pelo app | ✅ |
| 8 | Bloqueado não aparece em candidatos | ✅ |
| 9 | Bloqueado não consegue conversar | ✅ (testado) |
| 10 | Rate limit diário baseado em createdAt | ✅ (corrigido) |
| 11 | Bug role/admin resolvido | ✅ |
| 12 | AuditModule com eventos principais | ✅ |
| 13 | Endpoints /health e /ready | ✅ |
| 14 | Logs estruturados básicos | ✅ |
| 15 | Rotina automática de retenção | ✅ |
| 16 | Testes de integração | ✅ (14 cenários) |
| 17 | Documentação atualizada | ✅ |
| 18 | Backend compila sem erros | ✅ |
| 19 | Testes antigos continuam passando | ✅ (19/19) |
| 20 | Modo demo continua funcional | ✅ |

### 17.5 Estado Final

```
Backend: NestJS 10 + TypeScript, PostgreSQL 15, Redis 7
Portas: 3001 (API), 5432 (PG), 6379 (Redis), 5173 (Frontend)
Módulos: 10 (Auth, Users, Health, Matching, Chat, Challenges, Privacy, Moderation, Audit, HealthCheck)
Testes: 19 unitários + 14 cenários integração
Mobile: 20+ telas, onboarding 9 steps, moderação completa
Compilação: limpa (0 erros TypeScript)
Documentos: README, backlog, fluxo_v2, data-model, security, system-feature-flows
```
