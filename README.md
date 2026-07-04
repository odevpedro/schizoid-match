# WellMatch

> Um aplicativo privacy-first para encontrar pessoas com rotinas compatíveis para caminhar, treinar, manter hábitos saudáveis e criar companhia de rotina — sem expor dados sensíveis de saúde.

---

## Sobre o Projeto

WellMatch conecta pessoas por hábitos, objetivos de bem-estar e disponibilidade de rotina, não por aparência física ou dados médicos. O foco é privacidade radical: nenhum dado bruto de saúde é armazenado ou exposto — apenas preferências declaradas e bandas semânticas seguras são usadas para calcular compatibilidade entre perfis.

---

## Stack & Arquitetura

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native 0.73 + TypeScript |
| Estado | Zustand + React Query |
| Backend | NestJS 10 + TypeScript |
| Banco principal | PostgreSQL 15 + TypeORM |
| Series temporais | TimescaleDB (health_metrics_raw) |
| Cache | Redis 7 |
| Autenticacao | JWT (PassportJS) |
| WebSocket | Socket.IO |
| Infra local | Docker Compose |

> Padrao arquitetural: Modular (NestJS Modules) com separacao por dominio. Camada `HealthProvider` abstrai todas as fontes de dados de saude.

---

## Estrutura de Pastas

```
health/
├── backend/                   # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # JWT, LocalStrategy, guards, RolesGuard
│   │   │   ├── users/         # User, UserPreferences
│   │   │   ├── health/        # Metricas, perfil derivado, consentimento
│   │   │   │   ├── providers/ # HealthProvider interface + 5 provedores (simulated, healthkit, health_connect, garmin, fitbit)
│   │   │   │   └── processors/# RawMetrics → DerivedBands
│   │   │   ├── matching/      # Swipe, Match, CompatibilityCalculator
│   │   │   ├── chat/          # ChatService, ChatGateway (WebSocket)
│   │   │   ├── challenges/    # Desafios em dupla
│   │   │   ├── privacy/       # LGPD: export, delete
│   │   │   ├── audit/         # AuditEvent, AuditService
│   │   │   └── health-check/  # HealthCheckController
│   │   ├── common/            # Filtros, interceptors, decorators, Roles decorator
│   │   └── config/            # Database, Redis config
│   ├── Dockerfile
│   └── package.json
├── mobile/                    # React Native App
│   ├── src/
│   │   ├── navigation/        # AppNavigator, AuthNavigator, MainNavigator
│   │   ├── screens/           # auth, match, chat, profile, challenges, privacy, moderation
│   │   │   ├── onboarding/    # Intro, Intent, Goals, Activities, Availability, Intensity, Privacy, Source
│   │   │   └── moderation/    # BlockedUsers, ReportUser
│   │   ├── components/        # WellnessCard, CompatibilityBar, badges, chat, moderation
│   │   ├── services/          # api.ts, auth, matching, chat, health, socket
│   │   ├── store/             # Zustand: auth, match, chat
│   │   ├── theme/             # colors, typography, spacing
│   │   └── types/             # user, health, match, chat types
│   └── package.json
├── infra/
│   ├── docker-compose.yml
│   ├── init.sql               # Schema completo com TimescaleDB
│   └── redis.conf
├── docs/
│   ├── architecture.md        # Arquitetura, diagramas, privacidade
│   └── system-feature-flows.md
├── backlog.md
├── .env.example
└── README.md
```

---

## Como Rodar Localmente

### Pre-requisitos

- Docker + Docker Compose
- Node.js 20+
- npm 9+

### Setup

```bash
# 1. Clone o repositorio
git clone <url-do-repositorio> && cd health

# 2. Configure as variaveis de ambiente
cp .env.example .env

# 3. Suba o banco e o Redis
cd infra && docker compose up postgres redis -d

# 4. Instale dependencias e rode o backend
cd ../backend && npm install && npm run start:dev

# 5. Em outro terminal — rode o app mobile
cd ../mobile && npm install && npm run android
# ou: npm run ios
```

A API estara disponivel em `http://localhost:3000`.
Swagger UI: `http://localhost:3000/docs`

### Rodar tudo com Docker (backend incluido)

```bash
cd infra && docker compose up -d
```

---

## API — Endpoints Principais

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | `/auth/register` | Criar conta | Nao |
| POST | `/auth/login` | Login e token JWT | Nao |
| GET | `/users/me` | Perfil do usuario atual | Sim |
| PATCH | `/users/me/preferences` | Atualizar preferencias | Sim |
| POST | `/health/consent/grant` | Conceder consentimento por metrica | Sim |
| POST | `/health/consent/revoke` | Revogar consentimento | Sim |
| POST | `/health/ingest` | Importar dados do smartwatch | Sim |
| GET | `/health/profile` | Perfil derivado (bandas seguras) | Sim |
| GET | `/matching/candidates` | Lista de candidatos ranqueados | Sim |
| POST | `/matching/swipe` | Like ou dislike em um candidato | Sim |
| GET | `/matching/matches` | Todos os matches ativos | Sim |
| GET | `/chat/conversations` | Lista de conversas | Sim |
| GET | `/chat/:matchId/messages` | Mensagens de um match | Sim |
| POST | `/chat/send` | Enviar mensagem (REST fallback) | Sim |
| GET | `/challenges` | Desafios ativos do usuario | Sim |
| POST | `/challenges` | Criar desafio com parceiro | Sim |
| GET | `/users/me/wellness-profile` | Perfil publico de bem-estar do usuario | Sim |
| GET | `/users/onboarding/status` | Status do onboarding | Sim |
| POST | `/users/onboarding/step1-7` | Multi-step onboarding | Sim |
| POST | `/health/consent/grant` | Conceder consentimento (com purpose e version) | Sim |
| POST | `/health/consent/revoke` | Revogar (remove campos publicos) | Sim |
| POST | `/health/ingest` | Importar dados do smartwatch | Sim |
| GET | `/health/profile` | Perfil derivado (bandas seguras) | Sim |
| GET | `/matching/candidates` | Lista de candidatos ranqueados | Sim |
| POST | `/matching/swipe` | Like ou dislike (transactional) | Sim |
| GET | `/matching/matches` | Todos os matches ativos | Sim |
| GET | `/chat/conversations` | Lista de conversas | Sim |
| GET | `/chat/:matchId/messages` | Mensagens de um match | Sim |
| POST | `/chat/send` | Enviar mensagem (REST fallback) | Sim |
| POST | `/moderation/block` | Bloquear usuario | Sim |
| DELETE | `/moderation/block/:id` | Desbloquear | Sim |
| GET | `/moderation/blocks` | Listar bloqueios | Sim |
| POST | `/moderation/report` | Denunciar usuario | Sim |
| GET | `/moderation/reports` | Ver denuncias | Sim |
| DELETE | `/matching/unmatch/:matchId` | Desfazer match | Sim |
| — | `BlockedUsers` (mobile) | Tela de bloqueios com desbloqueio | — |
| — | `ReportUser` (mobile) | Tela de denuncia com motivo e descricao | — |
| — | `BlockUserButton` (mobile) | Botao reutilizavel com confirmacao | — |
| GET | `/challenges` | Desafios ativos | Sim |
| POST | `/challenges` | Criar desafio | Sim |
| GET | `/health` | Healthcheck basico | Nao |
| GET | `/ready` | Readiness probe (banco, redis) | Nao |
| GET | `/privacy/export` | Exportar dados (LGPD) | Sim |
| DELETE | `/privacy/health-data` | Excluir dados de saude | Sim |
| DELETE | `/privacy/account` | Excluir conta | Sim |

---

## WebSocket — Eventos

| Evento | Direcao | Payload | Seguranca |
|--------|---------|---------|-----------|
| `join:match` | Client → Server | `{ matchId: string }` | Validacao de participacao |
| `message:send` | Client → Server | `{ matchId: string, message: string }` | Validacao de acesso server-side |
| `message:received` | Server → Client | `ChatMessage` | — |
| `match:new` | Server → Client | `{ matchId: string }` | — |
| `message:read` | Client → Server | `{ matchId: string, messageId: string }` | Marcar como lida com timestamp |

Autenticacao via `handshake.auth.token` (JWT). Acesso a match validado em todos os eventos.

---

## Variaveis de Ambiente

Veja `.env.example` para a lista completa. Variaveis obrigatorias:

| Variavel | Descricao |
|----------|-----------|
| `DATABASE_URL` | URL PostgreSQL |
| `REDIS_URL` | URL Redis |
| `JWT_SECRET` | Segredo para assinar tokens |
| `JWT_EXPIRES_IN` | Expiracao do token (ex: `7d`) — default `7d` |
| `BCRYPT_ROUNDS` | Rounds para hash de senha (recomendado: 12) — default `12` |
| `PORT` | Porta do servidor — default `3001` |
| `NODE_ENV` | Ambiente — default `development` |
| `CORS_ORIGIN` | Origem CORS — default `*` |
| `GARMIN_CLIENT_ID` | Client ID do Garmin Connect API (opcional) |
| `GARMIN_CLIENT_SECRET` | Client Secret do Garmin Connect API (opcional) |
| `FITBIT_CLIENT_ID` | Client ID do Fitbit Web API (opcional) |
| `FITBIT_CLIENT_SECRET` | Client Secret do Fitbit Web API (opcional) |

---

## Principios de Privacidade

- Dados brutos (`health_metrics_raw`) nunca sao retornados via API publica
- O match usa apenas dados derivados: faixas, badges, cronotype, objetivos
- Consentimento granular por tipo de metrica, com log completo (LGPD)
- Usuario pode exportar, excluir dados de saude ou excluir conta a qualquer momento
- Senhas armazenadas apenas como hash bcrypt

---

## Testes

```bash
cd backend
npm run test          # unit tests
npm run test:cov      # com cobertura
npm run test:e2e      # end-to-end (requer banco rodando)
```

---

## Documentacao Tecnica

| Documento | Descricao |
|-----------|-----------|
| [Arquitetura](./docs/architecture.md) | Visao geral, diagramas, modulos, privacidade |
| [Fluxos de Features](./docs/system-feature-flows.md) | Fluxo interno de cada funcionalidade |
| [Modelo de Dados](./docs/data-model.md) | Entidades, relacionamentos, enums, privacidade por campo |
| [Algoritmo de Matching](./docs/matching-algorithm.md) | Dimensoes, pesos, escore, confianca |
| [Fluxo de Onboarding](./docs/onboarding-flow.md) | 7 passos, validacoes, estados de erro |
| [Seguranca](./docs/security.md) | Auth, rate limits, WebSocket, bloqueio, moderacao |
| [Privacidade](./docs/privacy-retention.md) | Classificacao de dados, retencao, consentimento, exclusao |
| [Moderacao](./docs/moderation.md) | Block, report, moderation action |
| [Backlog](./backlog.md) | Status de desenvolvimento, bugs, roadmap |

---

## Status do Projeto

```
[x] v0.1.0 MVP — core implementado (backend + mobile + infra + docs)
[x] v0.2.0 — onboarding multi-step, moderacao, perfil seguro
[x] v0.3.0 — audit, roles, healthcheck, logs estruturados, retencao, onboarding mobile completo, testes de integracao
[~] v0.4.0 — geolocation, filtros avancados, notificacoes
[ ] v1.0.0 — producao, CI/CD, modelo ML de compatibilidade
```

---

## Contribuindo

1. Fork o repositorio
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: adiciona minha feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

> Siga o padrao [Conventional Commits](https://www.conventionalcommits.org/pt-br/).

---

## Licenca

MIT

---

<p align="center">
  Feito com foco em qualidade por <a href="https://github.com/odevpedro">@odevpedro</a>
</p>
