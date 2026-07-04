# RESUMO TÉCNICO — WellMatch

> Documento gerado para análise por IA de possíveis melhorias.
> Versão analisada: v0.1.1 (MVP)

---

## 1. VISÃO GERAL

Aplicativo privacy-first para conectar pessoas com rotinas compatíveis para caminhar, treinar, manter hábitos saudáveis e criar companhia de rotina. Usuários fazem swipe (like/dislike) em candidatos ranqueados por um score de compatibilidade 0-100 calculado em múltiplas dimensões de estilo de vida, sem expor dados sensíveis de saúde.

**Diferencial:** Dados brutos do smartwatch nunca saem do servidor — apenas bandas semânticas (ex: `"Alta Atividade"`, `"Sono Bom"`) e badges são expostos. Consentimento granular por métrica com audit trail LGPD.

---

## 2. STACK COMPLETA

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend | NestJS + TypeScript | 10.x + 5.1 |
| Mobile | React Native + TypeScript | 0.73 + 5.0 |
| ORM | TypeORM | 0.3.17 |
| Banco Principal | PostgreSQL + TimescaleDB | 15 |
| Cache | Redis | 7 |
| Auth | JWT (PassportJS) + bcryptjs | passport-jwt 4.0, bcryptjs 2.4 |
| WebSocket | Socket.IO | 4.7 (backend), 4.6 (client) |
| HTTP Client (mobile) | Axios | 1.6 |
| Estado (mobile) | Zustand + React Query (TanStack) | zustand 4.4, @tanstack/react-query 5.8 |
| Navegação (mobile) | React Navigation | 6.x (native-stack + bottom-tabs) |
| Documentação API | Swagger (@nestjs/swagger) | 7.1 |
| Rate Limiting | @nestjs/throttler | 5.0 |
| Validação | class-validator + class-transformer | 0.14 + 0.5 |
| Infra local | Docker Compose | 3.9 |

**Dependências backend (24 runtime + 19 devDeps):**
- Runtime: @nestjs/common, core, config, jwt, passport, swagger, throttler, typeorm, websockets, platform-socket.io, platform-express, bcryptjs, class-transformer, class-validator, ioredis, passport, passport-jwt, passport-local, pg, reflect-metadata, rxjs, socket.io, typeorm, uuid
- Dev: @nestjs/cli, schematics, testing, TypeScript, ESLint 8, ts-jest, ts-loader, ts-node, tsconfig-paths + type defs

**Dependências mobile (16 runtime + 10 devDeps):**
- Runtime: react-native 0.73, react 18.2, @react-navigation/*, @tanstack/react-query, axios, zustand, socket.io-client, react-native-reanimated, gesture-handler, safe-area-context, screens, vector-icons, async-storage, react-native-web 0.19
- Dev: @babel/core, preset-env, runtime, @react-native/babel-preset, eslint-config, metro-config, typescript-config, @vitejs/plugin-react, vite 5.4, @types/react, react-native

---

## 3. ARQUITETURA — CAMADAS

### 3.1 Backend (NestJS Modular)

```
HTTP Request
  └── Controller (valida DTOs com class-validator + Swagger decorators)
        └── Service (regras de negócio + orquestração)
              ├── Repository (TypeORM → PostgreSQL/TimescaleDB)
              └── Provider / Processor (HealthProvider, CompatibilityCalculator)
```

**Global:** TransformInterceptor (envolve resposta em `{ data, timestamp }`) + HttpExceptionFilter (formato padronizado de erro: `{ statusCode, error, message, timestamp, path }`).

### 3.2 Frontend Mobile (React Native + react-native-web)

```
App.tsx
  └── QueryClientProvider (React Query)
        └── AppNavigator
              ├── AuthNavigator (Login, Register) — NativeStack
              └── MainNavigator — BottomTabs (4 abas)
                    ├── Profile (ProfileMain, Privacy, WatchConnection)
                    ├── Match (swipe)
                    ├── Challenges
                    └── Messages (MessagesList, Chat)
```

**WebApp.tsx** — shell alternativo para web com navegação via estado (Pressable-based tabs). Usa `react-native-web` como polyfill.

---

## 4. MODULOS DO BACKEND — DETALHAMENTO COMPLETO

### 4.1 AuthModule

**Arquivos:** auth.module.ts, auth.controller.ts, auth.service.ts, jwt.strategy.ts, local.strategy.ts, jwt-auth.guard.ts, login.dto.ts

**Endpoints:**
| Método | Rota | Fluxo |
|--------|------|-------|
| POST | `/auth/register` | `CreateUserDto` → UsersService.create() → bcrypt hash (12 rounds) → cria User + UserPreferences default → gera JWT |
| POST | `/auth/login` | LocalStrategy.validade(email, password) → bcrypt.compare → JwtService.sign({ sub, email }) → retorna `{ access_token, token_type, expires_in, user }` |

**JWT Payload:** `{ sub: userId, email: string }` — assinado com `JWT_SECRET`, expira em `JWT_EXPIRES_IN` (default 7d).

**JwtStrategy:** Extrai token de `Authorization: Bearer <token>`, verifica `isDeleted = false`.

**Caminhos infelizes:**
- Email duplicado → 409 Conflict
- Credenciais inválidas → 401 Unauthorized
- Usuário deletado (soft delete) → 401 Unauthorized
- Token expirado → 401 Unauthorized

### 4.2 UsersModule

**Arquivos:** users.module.ts, users.controller.ts, users.service.ts, user.entity.ts, user-preferences.entity.ts, create-user.dto.ts, update-preferences.dto.ts

**Entidades:**
- **User** (12 campos): id (UUID PK), email (UNIQUE), passwordHash (select: false), name, birthdate, genderOptional, bio, locationRegion, avatarUrl, isDeleted (default false), deletedAt, createdAt, updatedAt. Relacionamento 1:1 com UserPreferences.
- **UserPreferences** (9 campos): userId (UUID PK/FK), wellnessGoals (TEXT[]), preferredActivities (TEXT[]), preferredIntensity (default 'moderate'), availabilityPeriods (TEXT[]), maxDistanceKm (default 50), chronotypePreference, showPhotosAfterMatch (default true), createdAt, updatedAt.

**Endpoints:**
| Método | Rota | Ação |
|--------|------|------|
| GET | `/users/me` | Retorna perfil do usuário logado (excluindo passwordHash, isDeleted, deletedAt) |
| GET | `/users/:id/public` | Perfil público de outro usuário |
| PATCH | `/users/me/preferences` | Atualiza preferências (merge parcial via Object.assign) |

**Caminhos infelizes:**
- Usuário não encontrado → 404 NotFound
- Preferences não encontradas → 404 NotFound

### 4.3 HealthModule

**Arquivos:** health.module.ts, health.controller.ts, health.service.ts
**Entities:** health-metrics-raw.entity.ts, health-profile-daily.entity.ts, consent-record.entity.ts
**DTOs:** ingest-metrics.dto.ts, consent.dto.ts
**Providers:** health-provider.interface.ts, simulated.provider.ts, health-provider.factory.ts
**Processor:** health-profile.processor.ts

**Endpoints:**
| Método | Rota | Fluxo |
|--------|------|-------|
| POST | `/health/consent/grant` | `GrantConsentDto { metricTypes[], sourceProvider }` → cria ConsentRecord[] com permissionStatus='granted', grantedAt=now |
| POST | `/health/consent/revoke` | `RevokeConsentDto { metricTypes[] }` → atualiza records para 'revoked', revokedAt=now |
| GET | `/health/consent` | Lista todos os consentimentos do usuário |
| POST | `/health/ingest` | `IngestMetricsDto { provider, fromDate?, toDate? }` → verifica consentimentos → provider.fetchMetrics() → salva em health_metrics_raw → HealthProfileProcessor.processMetrics() → upsert em health_profile_daily |
| GET | `/health/profile` | Retorna últimos 30 dias de health_profile_daily (bandas seguras) |

#### Entidade HealthMetricsRaw (INTERNAL ONLY) — 13 campos

Hypertable TimescaleDB (particionada por `timestamp`). Row Level Security habilitado. NUNCA exposta via API.

| Campo | Tipo | Sensível? |
|-------|------|-----------|
| heart_rate_bpm | INTEGER | Sim |
| hrv_ms | DECIMAL(6,2) | Sim |
| steps | INTEGER | Não |
| calories | INTEGER | Não |
| vo2max | DECIMAL(5,2) | Sim |
| sleep_minutes | INTEGER | Sim |
| sleep_score | DECIMAL(5,2) | Sim |
| stress_level | DECIMAL(5,2) | Sim |
| blood_oxygen | DECIMAL(5,2) | Sim |
| skin_temp | DECIMAL(5,2) | Sim |

#### Entidade HealthProfileDaily — 10 campos

Bandas derivadas seguras por dia. Unique(userId, date).

| Campo | Valores |
|-------|---------|
| activity_level | sedentary / lightly_active / moderately_active / active / very_active |
| avg_steps_band | very_low / low / moderate / high / very_high |
| sleep_quality_band | poor / fair / good / great / excellent |
| chronotype | early_bird / morning / intermediate / afternoon / night_owl |
| recovery_band | low / fair / good / excellent |
| stress_band | low / moderate / high / very_high |
| cardio_fitness_band | below_average / average / above_average / excellent / superior |
| consistency_score | 0-100 |

#### Entidade ConsentRecord — 8 campos

Log auditável LGPD. Check constraint: permission_status IN ('granted', 'revoked', 'pending').

| Campo | Descrição |
|-------|-----------|
| metric_type | steps, sleep, heart_rate, hrv, calories, vo2max, stress, blood_oxygen, skin_temp |
| permission_status | granted / revoked / pending |
| granted_at | Timestamp preciso do consentimento |
| revoked_at | Timestamp preciso da revogação |
| source_provider | simulated, healthkit, health_connect, garmin, fitbit |

#### HealthProvider Interface

```typescript
interface HealthProvider {
  readonly providerName: string;
  isAvailable(): Promise<boolean>;
  requestPermissions(metrics: string[]): Promise<Record<string, boolean>>;
  fetchMetrics(userId: string, from: Date, to: Date): Promise<RawHealthMetrics[]>;
}
```

#### SimulatedProvider

Gera dados deterministicos baseados em hash do userId + seed por dia. Cada dia produz steps (4k-14k), calories (1400-3200), heartRate (55-90 bpm), hrv (25-75ms), sleep (300-540min), sleepScore (45-92), stress (10-70), bloodOxygen (95-100%), skinTemp (35.5-37.2°C), vo2max (28-55).

**Factory:** `HealthProviderFactory.getProvider(name)` — apenas 'simulated' disponível no MVP; outros (healthkit, health_connect, garmin, fitbit) lançam Error.

#### HealthProfileProcessor

Pipeline: `RawHealthMetrics[]` → agrupa por data → calcula médias → classifica em bandas.

**Regras de classificação por steps:**
- < 3000 → very_low / sedentary
- 3000-6000 → low / lightly_active
- 6000-9000 → moderate / moderately_active
- 9000-12000 → high / active
- > 12000 → very_high / very_active

**ConsistencyScore:** `max(0, min(100, (1 - CV) * 100))` onde CV = coeficiente de variação dos passos diários.

**Inferência de chronotype:** Baseada no horário da primeira métrica do dia (early_bird < 8h, morning < 10h, intermediate < 14h, afternoon < 18h, night_owl >= 18h).

**Caminhos infelizes:**
- Nenhum consentimento concedido → 403 Forbidden
- Provider não implementado → Error (não tratado como HTTP exception elegante)
- Dados inconsistentes → upsert sobrescreve sem validação

### 4.4 MatchingModule

**Arquivos:** matching.module.ts, matching.controller.ts, matching.service.ts, compatibility.calculator.ts
**Entities:** match.entity.ts, swipe-history.entity.ts, public-health-profile.entity.ts
**DTOs:** swipe.dto.ts

**Endpoints:**
| Método | Rota | Fluxo |
|--------|------|-------|
| GET | `/matching/candidates` | Busca todos users com PublicHealthProfile, exclui já swipados, calcula score (default 50 se sem profile/prefs), ordena descendente, limita 20 |
| POST | `/matching/swipe` | Valida auto-swipe → rate limit → unicidade → salva SwipeHistory → se like/super_like, verifica match bilateral → se match, calcula score e cria Match |
| GET | `/matching/matches` | Todos os matches ativos do usuário (status='active') com relations user1/user2 |
| GET | `/matching/history` | Últimos 100 swipes |

#### Entidade Match — 5 campos

Unique(userId1, userId2), Check(userId1 != userId2). userId1/userId2 ordenados alfabeticamente.

| Campo | Valores |
|-------|---------|
| status | active / unmatched / blocked |
| score_compatibility | DECIMAL(5,2) — 0-100 |

#### Entidade SwipeHistory — 5 campos

Unique(userId, targetUserId). Check(direction IN ('like', 'dislike', 'super_like')).

#### Entidade PublicHealthProfile — 9 campos

Perfil exibido no match. Populado manualmente (bug B001 — pipeline automático pendente).

#### CompatibilityCalculator

Score 0-100 com pesos fixos:

| Dimensão | Peso | Algoritmo |
|----------|------|-----------|
| Goals (objetivos) | 25% | Índice de Jaccard: intersection(g1,g2) / union(g1,g2) × 100. Se vazio, 50. |
| Activities | 20% | Jaccard index. Se vazio, 50. |
| Chronotype | 15% | Distância em escala ordinal: [early_bird, morning, intermediate, afternoon, night_owl]. Score: [100, 80, 50, 20, 0]. |
| Intensity | 15% | Escala ordinal: [low, moderate, high, very_high]. Score: [100, 70, 30, 0]. |
| Availability | 10% | Jaccard index. Se vazio, 50. |
| Distance | 10% | `(1 - distanceKm / maxDistanceKm) × 100`. Se null, 70. Se > maxKm, 0. |
| Consistency | 5% | Escala ordinal activity_level. Score: [100, 75, 50, 25, 0]. |

**Match bilateral:** Detectado quando UserA dá like em UserB E UserB já deu like em UserA (ou super_like). Match cria entidade com score (se profiles/prefs disponíveis, senão 50).

#### Rate Limiting

`MAX_SWIPES_PER_DAY` (env, default 50). **BUG B002:** usa contagem total do `swipe_history` em vez de contagem diária (filtro `todayStart` declarado mas não usado na query).

**Caminhos infelizes:**
- Auto-swipe → 400 BadRequest
- Já swipou → 400 BadRequest (Already swiped on this user)
- Rate limit excedido → 400 BadRequest
- Sem PublicHealthProfile → score default 50 (candidato pode aparecer sem dados)
- `theirPrefs` no getCandidates é construído parcialmente (apenas goals e chronotype vêm do candidato; activities, intensity, availability são hardcoded como vazio/'moderate')

### 4.5 ChatModule

**Arquivos:** chat.module.ts, chat.controller.ts, chat.gateway.ts, chat.service.ts, send-message.dto.ts, chat-message.entity.ts

**Dual transport:** WebSocket (Socket.IO) + REST fallback.

#### WebSocket Gateway (namespace `/chat`)

| Evento | Direção | Payload |
|--------|---------|---------|
| `join:match` | C → S | `{ matchId }` |
| `message:send` | C → S | `{ matchId, message }` |
| `message:received` | S → C | `ChatMessage` |
| `match:new` | S → C | `{ matchId }` |

**Handshake:** JWT via `handshake.auth.token` ou `Authorization` header. Socket conecta à sala `user:{userId}`. JoinMatch adiciona à sala `match:{matchId}`.

#### REST Endpoints

| Método | Rota | Ação |
|--------|------|------|
| GET | `/chat/conversations` | Lista matches ativos com lastMessage, unreadCount, partner info. Ordenado por último timestamp descendente. |
| GET | `/chat/:matchId/messages` | Histórico paginado (limit/offset), marca como lidas, retorna reverse chronological. |
| POST | `/chat/send` | Fallback REST — valida match access, salva mensagem. |
| GET | `/chat/:matchId/suggestions` | 2 sugestões wellness determinísticas baseadas no charCodeAt(0) do matchId. BUG B003. |

#### ChatService.validateMatchAccess(matchId, userId)

Verifica 3 condições: match existe (404), usuário é participante (403), match está ativo (403).

**Caminhos infelizes:**
- Match não encontrado → 404
- Não é participante → 403 Forbidden
- Match não está ativo → 403 Forbidden
- Socket sem token → disconnect silencioso
- Token inválido → disconnect silencioso

### 4.6 ChallengesModule

**Arquivos:** challenges.module.ts, challenges.controller.ts, challenges.service.ts, challenge.entity.ts

**Endpoints:**
| Método | Rota | Ação |
|--------|------|------|
| GET | `/challenges` | Desafios ativos do usuário (via INNER JOIN com matches) |
| POST | `/challenges` | Cria desafio: valida participação no match, salva com creatorId |
| GET | `/challenges/match/:matchId` | Desafios de um match específico |

**Entidade Challenge (11 campos):** matchId, creatorId, title, description, challengeType (steps/sleep_streak/weekly_activity/wellness_checkin), targetValue, targetUnit, startDate, endDate, status (default 'active'), createdAt.

**Entidade ChallengeProgress (6 campos):** challengeId, userId, currentValue (default 0), completed (default false), updatedAt. Unique(challengeId, userId).

**Observação:** ChallengeProgress NÃO é implementado no módulo (entidade existe no SQL/TypeORM mas service só lida com Challenge). Não há progressão automática via métricas.

**Caminhos infelizes:**
- Match não encontrado ou usuário não participa → 403 Forbidden

### 4.7 PrivacyModule

**Arquivos:** privacy.module.ts, privacy.controller.ts, privacy.service.ts

**Endpoints:**
| Método | Rota | Ação |
|--------|------|------|
| GET | `/privacy/export` | Exporta userData + healthData (consents + derivedProfiles) como JSON |
| DELETE | `/privacy/health-data` | Remove health_metrics_raw + health_profile_daily (204 No Content) |
| DELETE | `/privacy/account` | Remove health data + soft delete user: email → `deleted_{id}@wellmatch.invalid`, name → 'Deleted User', bio/location/avatar → null, isDeleted → true |

**Caminhos infelizes:**
- Export ou delete em conta já deletada → NotFound (UsersService.findById)

---

## 5. FRONTEND MOBILE — DETALHAMENTO

### 5.1 Tema

- **colors.ts:** Dark theme com 22 tokens. Background `#0A0E1A`, primary `#00D4AA` (teal), secondary `#3B82F6` (blue), surface `#111827`, texto `#F9FAFB`.
- **typography.ts:** 8 estilos (h1, h2, h3, body, bodyMuted, caption, label, score).
- **spacing.ts:** 9 valores (xs=4, sm=8, md=16, lg=24, xl=32, xxl=48, card=20, screen=20).

### 5.2 Serviços (API Layer)

**api.ts:** Axios instance com BASE_URL = `__DEV__ ? 'http://localhost:3001' : 'https://api.wellmatch.app'`. Interceptor request: anexa Bearer token do AsyncStorage. Interceptor response: unwrap `data.data`, redireciona 401 para logout.

**auth.service.ts:** Login, Register, Logout, getStoredToken. Modo demo: `demo@wellmatch.app` + `demo123` → token `demo-token-local`, mockUser sem chamada de rede.

**health.service.ts:** Grant/revoke/getConsents, ingestMetrics, getDerivedProfile. Modo demo: retorna mockConsents + mockHealthProfile.

**matching.service.ts:** getCandidates, swipe, getMatches. Modo demo: retorna mockCandidates (5 perfis), swipe simula match com u3.

**chat.service.ts:** getConversations, getMessages, sendMessage, getSuggestions. Modo demo: mockConversations (2 conversas), mockMessages.

**socket.service.ts:** Singleton SocketService. Conecta via `io(BASE_URL + '/chat', { auth: { token } })`. Namespace `/chat`, transport `websocket`. Reconnection: 5 tentativas, 1s delay. Métodos: connect, disconnect, joinMatch, sendMessage, onMessage, onMatch, offMessage.

**mock-data.ts:** Tokens, mockUser, mockHealthProfile, mockCandidates (5 perfis), mockMatch, mockConversations, mockConsents (6 granted + 3 revoked), mockChallenges (4 ativos/completos), mockMessages.

### 5.3 Store (Zustand)

**auth.slice.ts:** user, token, isAuthenticated, isLoading. Ações: login, register, logout, restoreSession (recupera token do AsyncStorage, reconhece demo).

**match.slice.ts:** candidates[], matches[], currentIndex. Ações: setCandidates, setMatches, removeTopCandidate (remove o primeiro do array), addMatch.

**chat.slice.ts:** conversations[], messages[record<matchId, ChatMessage[]>]. Ações: setConversations, setMessages, addMessage (append ao array do matchId).

### 5.4 Telas

**LoginScreen:** Formulário email + senha, botão "Entrar" e "Criar conta". KeyboardAvoidingView.

**RegisterScreen:** Nome, email, senha (min 8), região. Botão "Criar conta".

**MatchScreen:** Carrega candidatos via matchingService.getCandidates(). Renderiza WellnessCard com swipe animado (PanResponder). Botões like/dislike. Modal de match ao acertar. Empty state com "Atualizar".

**ProfileScreen:** Avatar (iniciais), nome, email. Card com perfil de bem-estar (7 métricas + barra de consistência). Menu: Privacidade, Sair.

**MessagesScreen:** FlatList de conversas com avatar, nome, preview, hora, badge de não lido. Navega para ChatScreen.

**ChatScreen:** Histórico de mensagens (FlatList), sugestões wellness (horizontal ScrollView de chips), TextInput + botão enviar. Socket.IO para receber mensagens em tempo real.

**ChallengesScreen:** FlatList de desafios com ícone por tipo, título, descrição, meta, dias restantes. Empty state.

**PrivacyScreen:** Toggles de consentimento granular (6 métricas básicas + 6 sensíveis). Ações LGPD: exportar, deletar dados de saúde, deletar conta (com confirmação).

**WatchConnectionScreen:** Cards de provedores (simulado + 4 futuros). Toggles de métricas. Botão "Conectar e importar" → grantConsent + ingestMetrics.

### 5.5 Componentes

**WellnessCard:** Card animado com PanResponder para swipe. Mostra avatar, nome, faixa etária, cronotipo, CompatibilityBar, WellnessBadges, summary. Overlays "MATCH" (like) e "PASSA" (dislike) animados.

**CompatibilityBar:** Barra horizontal colorida (verde ≥80, azul ≥60, amarelo ≥40, vermelho <40) com percentual.

**WellnessBadges:** Container flex-wrap de Badge com labels mapeados (BADGE_LABELS). Máximo 4.

**MessageBubble:** Bolha de chat com alinhamento próprio (direita) / alheio (esquerda), cores distintas, timestamp.

**Button:** 5 variantes (primary/secondary/outline/ghost/danger). Loading state com ActivityIndicator.

**Input:** Campo com label, foco (borda primary), error state.

**Badge:** Pequeno chip com 4 variantes de cor (primary/secondary/success/warning).

---

## 6. BANCO DE DADOS

### 6.1 Estrutura (PostgreSQL 15 + TimescaleDB)

11 tabelas ativas no schema:

| Tabela | Tipo | Propósito |
|--------|------|-----------|
| users | Regular | Cadastro central |
| user_preferences | Regular | Preferências de onboarding |
| consent_records | Regular | Log LGPD |
| health_metrics_raw | Hypertable (TimescaleDB) | Dados brutos INTERNAL ONLY |
| health_profile_daily | Regular | Bandas derivadas |
| public_health_profile | Regular | Perfil público de match |
| matches | Regular | Match bilateral |
| swipe_history | Regular | Histórico de likes |
| chat_messages | Regular | Mensagens de chat |
| challenges | Regular | Desafios |
| challenge_progress | Regular | Progresso de desafios |

2 tabelas planejadas (Surak): exam_validation_results, exam_markers.

**Extensões:** uuid-ossp, pgcrypto, timescaledb.

**9 índices:** health_metrics_raw(user_id, timestamp), health_profile_daily(user_id, date), swipe_history(user_id), swipe_history(target_user_id), matches(user_id_1), matches(user_id_2), chat_messages(match_id, timestamp), consent_records(user_id, metric_type), users(email) WHERE is_deleted = FALSE.

**Row Level Security:** Habilitado em health_metrics_raw.

### 6.2 TimescaleDB

Hypertable `health_metrics_raw` particionada por `timestamp`. PK composta `(id, timestamp)`.

### 6.3 Configuração TypeORM

```typescript
{
  type: 'postgres',
  url: process.env.DATABASE_URL,  // postgresql://wellmatch:wellmatch_secret@localhost:5432/wellmatch
  entities: [User, UserPreferences, ConsentRecord, HealthMetricsRaw, HealthProfileDaily,
             PublicHealthProfile, Match, SwipeHistory, ChatMessage, Challenge],
  synchronize: false,  // migrations pendentes
  logging: development only,
  ssl: production only (rejectUnauthorized: false)
}
```

---

## 7. INFRAESTRUTURA

### 7.1 Docker Compose (3 serviços)

**postgres:** timescale/timescaledb:latest-pg15, porta 5432, volume persistente, init.sql no docker-entrypoint-initdb.d, healthcheck via pg_isready.

**redis:** redis:7-alpine, porta 6379, config customizada (maxmemory 256mb, allkeys-lru, notify-keyspace-events Ex, save config), volume persistente.

**backend:** build multi-stage (node:20-alpine, npm ci, dist only em produção), porta 3000, depende de postgres+redis health, volume bind de src/ para hot-reload dev.

Network: bridge interna.

### 7.2 Redis Config

- maxmemory 256mb, policy allkeys-lru
- notify-keyspace-events Ex (key expiry events para socket sessions)
- save: 900s/1key, 300s/10keys, 60s/10000keys

---

## 8. FLUXOS COMPLETOS

### 8.1 Fluxo Feliz — Registro + Onboarding + Match + Chat

```
1. POST /auth/register { email, password, name }
   → 201 { access_token, user }

2. POST /health/consent/grant { metricTypes: [steps, sleep, ...], sourceProvider: 'simulated' }
   → ConsentRecord[] (granted)

3. POST /health/ingest { provider: 'simulated' }
   → HealthProviderFactory → SimulatedProvider.fetchMetrics()
   → INSERT health_metrics_raw (várias linhas)
   → HealthProfileProcessor.processMetrics()
   → UPSERT health_profile_daily

4. [Manual] Populate public_health_profile (BUG B001 — não automático)

5. GET /matching/candidates
   → Query public_health_profile (exceto swipados)
   → Para cada: CompatibilityCalculator.calculate()
   → Retorna sorted por score descendente

6. POST /matching/swipe { targetUserId: 'u2', direction: 'like' }
   → INSERT swipe_history
   → Verifica se u2 já deu like de volta
   → Se sim: CompatibilityCalculator.calculate() → INSERT matches
   → Retorna { matched: true, matchId }

7. ChatGateway.notifyMatch() → Socket emite 'match:new'

8. GET /chat/conversations
   → Lista matches ativos com lastMessage, unreadCount, partner

9. WebSocket join:match → Socket join room match:{matchId}
   WebSocket message:send → INSERT chat_messages → broadcast message:received
   REST GET /chat/:matchId/messages → Histórico com paginação

10. POST /challenges { matchId, title: '10k steps', challengeType: 'steps', targetValue: 10000 }
    → INSERT challenges
```

### 8.2 Fluxo Infeliz — Login sem consentimento

```
POST /auth/login { email, password }
→ 200 { access_token }

POST /health/ingest { provider: 'simulated' }
→ 403 Forbidden: "No consent granted for this provider"
```

### 8.3 Fluxo Infeliz — Swipe sem perfil

```
User se registra, não popula public_health_profile (BUG B001)
GET /matching/candidates
→ candidates retornam com compatibilityScore = 50 (default)
→ Perfil sem dados aparece no match
```

### 8.4 Fluxo Infeliz — Chat com match inativo

```
POST /chat/send { matchId, message }
→ Match com status 'unmatched' ou 'blocked'
→ 403 Forbidden: "Match is no longer active"
```

### 8.5 Fluxo Infeliz — Rate limit

```
51º swipe no mesmo dia
→ checkRateLimit() conta TOTAL de swipes (BUG B002)
→ 400 BadRequest: "Daily swipe limit of 50 reached"
```

### 8.6 Fluxo Infeliz — Exclusão LGPD

```
DELETE /privacy/account
→ DELETE health_metrics_raw + health_profile_daily
→ UPDATE users SET is_deleted=true, email=deleted_{id}@..., name='Deleted User'
→ Usuário não consegue mais logar (JwtStrategy rejeita isDeleted)
```

---

## 9. PRIVACIDADE E LGPD

### 9.1 Classificação de Dados

| Classificação | Exemplos | Restrição |
|---------------|----------|-----------|
| Crítico | password_hash | Nunca sai do banco (select: false) |
| Pessoal | email, name, birthdate | Exigem consentimento, soft delete preserva anonimização |
| Sensível (LGPD art. 11) | heart_rate, hrv, sleep_score, stress, vo2max, blood_oxygen, skin_temp | Consentimento granular por métrica, RLS, nunca expostos |
| Público derivado | activity_level, chronotype | Bandas semânticas seguras, visíveis no match |
| Sensível derivado | exam_markers.band | Consentimento explícito, expira em 6 meses |

### 9.2 Pipeline de Privacidade

```
Smartwatch → HealthMetricsRaw (RLS, INTERNAL ONLY)
  → HealthProfileProcessor → HealthProfileDaily (bandas, sem valores brutos)
    → PublicHealthProfile (tags, badges, cronotype — sem valores numéricos)
      → CompatibilityCalculator → Score 0-100
        → Card de Match
```

---

## 10. BUGS CONHECIDOS

| ID | Descrição | Arquivo | Severidade | Causa Raiz |
|----|-----------|---------|------------|------------|
| B001 | `public_health_profile` não populado automaticamente após ingestão | matching/matching.service.ts:166-168 | Alta | `updatePublicProfile` existe mas nunca é chamado no pipeline de ingestão |
| B002 | Rate limit de swipes conta TOTAL em vez de diário | matching/matching.service.ts:152-159 | Média | `todayStart` declarado mas não usado no `where` da query |
| B003 | Sugestões de chat determinísticas (sem variação real) | chat/chat.service.ts:96-99 | Baixa | Usa `charCodeAt(0)` do matchId como seed, mesmas 2 sugestões sempre |
| B004 | Variáveis de ambiente e docker-compose não validados em setup real | — | Alta | Nenhum healthcheck ou validação de env ao iniciar |

---

## 11. GAPS E OPORTUNIDADES DE MELHORIA

### 11.1 Arquiteturais
- **Migration TypeORM:** `synchronize: false` já configurado mas migrations não implementadas
- **Testes:** Não há testes unitários nem e2e implementados (jest configurado mas sem specs)
- **CI/CD:** Nenhum pipeline GitHub Actions
- **Observabilidade:** Sem logs estruturados, sem healthcheck endpoint, sem métricas
- **Error Handling Provider Factory:** Providers não implementados lançam `Error` genérico em vez de HTTP exception

### 11.2 Funcionais
- **Onboarding multi-step:** Ausente (registro simples, sem wizard de objetivos/atividades/privacidade)
- **Upload de foto:** Avatar URL no modelo mas sem endpoint upload
- **Geolocalização real:** `locationRegion` é texto livre, `maxDistanceKm` existe mas sem geocoding
- **Desfazer match / bloquear:** Endpoints não implementados (status aceita 'unmatched'/'blocked' mas sem controllers)
- **Progresso automático de desafios:** ChallengeProgress existe no banco mas service não atualiza
- **Notificações:** Push notifications não implementadas

### 11.3 Privacidade
- **Sem política de retenção definida** para health_metrics_raw (LGPD exige prazo)
- **RLS do PostgreSQL** habilitado mas sem roles/usuários configurados
- **WebSocket** não verifica se usuário participa do match ao entrar na sala (apenas no REST)

### 11.4 Técnicos
- **`theirPrefs` no getCandidates** construído parcialmente (hardcoded), score pode ser impreciso
- **ConsistencyScore** usa steps apenas, ignora outras métricas
- **Não há tratamento de concorrência** em swipe (possível race condition em match bilateral)
- **Socket.IO** sem autenticação nas mensagens após handshake (qualquer user na sala pode ouvir)

---

## 12. BACKLOG

> Registro vivo do progresso do projeto. Atualizado a cada mudanca de estado de uma funcionalidade.
> **Ultima atualizacao:** 2026-05-08

### Legenda

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

### Em Andamento

> Nenhum item em andamento no momento.

### Concluidas

#### MVP — v0.1.0 (2026-05-07)

- `[x]` P0 / L — Estrutura do projeto (backend NestJS + mobile React Native)
- `[x]` P0 / M — Schema SQL com TimescaleDB (init.sql)
- `[x]` P0 / M — Docker Compose para ambiente local
- `[x]` P0 / L — Autenticacao JWT (registro, login, guards)
- `[x]` P0 / M — Entidades TypeORM (users, preferences, health, match, chat)
- `[x]` P0 / XL — Camada HealthProvider (interface + SimulatedProvider + Factory)
- `[x]` P0 / L — Ingestao de metricas com verificacao de consentimento
- `[x]` P0 / M — HealthProfileProcessor (metricas brutas → bandas derivadas)
- `[x]` P1 / L — CompatibilityCalculator (score ponderado 7 dimensoes)
- `[x]` P1 / L — Sistema de swipe (like/dislike/super_like + rate limiting)
- `[x]` P1 / M — Criacao automatica de match bilateral
- `[x]` P1 / L — Chat via WebSocket (Socket.IO Gateway)
- `[x]` P1 / M — Chat REST fallback + sugestoes wellness
- `[x]` P1 / L — Desafios em dupla (CRUD basico)
- `[x]` P1 / L — Privacidade e LGPD (export, delete health data, delete account)
- `[x]` P1 / L — Consentimento granular por metrica (grant/revoke)
- `[x]` P0 / XL — Telas mobile: Login, Register, Match (swipe), Mensagens, Chat
- `[x]` P0 / L — Telas mobile: Perfil, Privacidade, Conexao de Smartwatch
- `[x]` P1 / L — Componentes: WellnessCard (swipe animado), CompatibilityBar, WellnessBadges
- `[x]` P1 / M — Navegacao por 4 abas (Perfil, Match, Desafios, Mensagens)
- `[x]` P2 / M — Documentacao: README, backlog, architecture.md, system-feature-flows.md

#### Correcoes e Infraestrutura Web — v0.1.1 (2026-05-08)

- `[x]` P0 / XS — Fix: `#root` sem `display: flex` causava tela em branco no browser
- `[x]` P0 / XS — Fix: `__DEV__` indefinido no Vite (adicionado em `define` no vite.config.ts)
- `[x]` P1 / S  — Fix: aba Match nao responsiva — `Dimensions.get` estatico substituido por `useWindowDimensions`
- `[x]` P1 / M  — Feature: modo demo com login ficticio (`demo@wellmatch.app` / `demo123`) sem dependencia de backend
- `[x]` P1 / L  — Feature: camada de mock data cobrindo todas as telas (perfil, match, mensagens, desafios, privacidade)

### Pendentes

#### Integracao Real com Smartwatches — P0

- `[ ]` P0 / XL — HealthKit provider (iOS)
- `[ ]` P0 / XL — Health Connect provider (Android)
- `[ ]` P1 / XL — Garmin Connect API
- `[ ]` P1 / XL — Fitbit API
- `[ ]` P2 / L  — Samsung Health SDK

#### Onboarding Completo — P1

- `[ ]` P1 / M — Tela de onboarding multi-step (objetivos, atividades, privacidade)
- `[ ]` P1 / S — Logica de redirecionamento pos-registro para onboarding
- `[ ]` P2 / M — Calculo e publicacao de public_health_profile pos-ingestao

#### Perfil e Match — P1

- `[ ]` P1 / M — Upload de foto de perfil (revelada so apos match)
- `[ ]` P1 / L — Filtros de match (distancia real via geolocation, cronotype)
- `[ ]` P2 / M — Desfazer match (unmatch)
- `[ ]` P2 / S — Bloquear usuario

#### Desafios — P2

- `[ ]` P2 / L  — Progresso automatico de desafio via metricas do dia
- `[ ]` P2 / M  — Notificacoes de desafio concluido
- `[ ]` P3 / M  — Historico de desafios completados

#### Infraestrutura — P1

- `[ ]` P1 / M — Testes de integracao (auth, match, health)
- `[ ]` P1 / L — CI/CD com GitHub Actions
- `[ ]` P1 / M — Migracao TypeORM (substituir synchronize: true)
- `[ ]` P2 / M — Observabilidade (logs estruturados, health check endpoint)
- `[ ]` P2 / L — Deploy em ambiente de producao (Railway, Render ou VPS)

#### Machine Learning — P3

- `[ ]` P3 / XL — Modelo de compatibilidade baseado em embeddings de perfil
- `[ ]` P3 / XL — Recomendacao personalizada por comportamento de swipe

### Decisoes Tecnicas Pendentes

- Definir estrategia de geolocation: coordenadas aproximadas ou apenas regiao textual?
- Avaliar Supabase Auth como alternativa ao JWT proprio para facilitar OAuth social
- Definir politica de retencao de `health_metrics_raw` (LGPD exige prazo definido)
- Avaliar Expo vs React Native CLI para build mais facil no MVP

### Historico de Versoes

| Versao | Data | Principais entregas |
|--------|------|---------------------|
| `0.1.0` | 2026-05-07 | MVP completo: backend NestJS, mobile React Native, infra Docker, documentacao |
| `0.1.1` | 2026-05-08 | Correcoes web (tela branca, __DEV__, responsividade Match), modo demo com mock data |
