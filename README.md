# Schizoid-Match

> Plataforma de match social baseada em dados de saude e habitos de smartwatch — conecta pessoas por objetivos de bem-estar, rotina e estilo de vida, sem expor dados medicos sensiveis.

[![Build Status](https://img.shields.io/github/actions/workflow/status/odevpedro/schizoid-match/ci.yml?branch=main&style=flat-square)](https://github.com/odevpedro/schizoid-match/actions)
[![Coverage](https://img.shields.io/codecov/c/github/odevpedro/schizoid-match?style=flat-square)](https://codecov.io/gh/odevpedro/schizoid-match)
[![License](https://img.shields.io/github/license/odevpedro/schizoid-match?style=flat-square)](./LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/odevpedro/schizoid-match?style=flat-square)](https://github.com/odevpedro/schizoid-match/commits/main)

---

## Sobre o Projeto

Schizoid-Match e uma aplicacao mobile que usa dados derivados de smartwatches (passos, sono, nivel de atividade, cronotype) para calcular compatibilidade entre usuarios. O foco e privacidade: dados brutos nunca sao exibidos a outros usuarios — apenas badges, faixas e scores agregados sao usados.

O sistema funciona como um app de swipe (like/dislike), mas a compatibilidade e baseada em habitos, objetivos de bem-estar e disponibilidade, nao em aparencia fisica.

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
│   │   │   ├── auth/          # JWT, LocalStrategy, guards
│   │   │   ├── users/         # User, UserPreferences
│   │   │   ├── health/        # Metricas, perfil derivado, consentimento
│   │   │   │   ├── providers/ # HealthProvider interface + SimulatedProvider
│   │   │   │   └── processors/# RawMetrics → DerivedBands
│   │   │   ├── matching/      # Swipe, Match, CompatibilityCalculator
│   │   │   ├── chat/          # ChatService, ChatGateway (WebSocket)
│   │   │   ├── challenges/    # Desafios em dupla
│   │   │   └── privacy/       # LGPD: export, delete
│   │   ├── common/            # Filtros, interceptors, decorators
│   │   └── config/            # Database, Redis config
│   ├── Dockerfile
│   └── package.json
├── mobile/                    # React Native App
│   ├── src/
│   │   ├── navigation/        # AppNavigator, AuthNavigator, MainNavigator
│   │   ├── screens/           # auth, match, chat, profile, challenges, privacy
│   │   ├── components/        # WellnessCard, CompatibilityBar, badges, chat
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
git clone https://github.com/odevpedro/schizoid-match.git && cd schizoid-match

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
| GET | `/privacy/export` | Exportar todos os dados (LGPD) | Sim |
| DELETE | `/privacy/health-data` | Excluir dados de saude | Sim |
| DELETE | `/privacy/account` | Excluir conta permanentemente | Sim |

---

## WebSocket — Eventos

| Evento | Direcao | Payload |
|--------|---------|---------|
| `join:match` | Client → Server | `{ matchId: string }` |
| `message:send` | Client → Server | `{ matchId: string, message: string }` |
| `message:received` | Server → Client | `ChatMessage` |
| `match:new` | Server → Client | `{ matchId: string }` |

Autenticacao via `handshake.auth.token` (JWT).

---

## Variaveis de Ambiente

Veja `.env.example` para a lista completa. Variaveis obrigatorias:

| Variavel | Descricao |
|----------|-----------|
| `DATABASE_URL` | URL PostgreSQL |
| `REDIS_URL` | URL Redis |
| `JWT_SECRET` | Segredo para assinar tokens |
| `JWT_EXPIRES_IN` | Expiracao do token (ex: `7d`) |
| `BCRYPT_ROUNDS` | Rounds para hash de senha (recomendado: 12) |

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
| [Arquitetura](./docs/architecture.md) | Visao geral, diagramas, privacidade, compatibilidade |
| [Fluxos de Features](./docs/system-feature-flows.md) | Fluxo interno de cada funcionalidade |
| [Modelo de Dados](./docs/data-model.md) | Entidades, relacionamentos, enums, privacidade por campo |
| [Backlog](./backlog.md) | Status de desenvolvimento, bugs, roadmap |

---

## Status do Projeto

```
[x] v0.1.0 MVP — core implementado (backend + mobile + infra + docs)
[ ] v0.2.0 — integracao real com HealthKit / Health Connect
[ ] v0.3.0 — geolocation, filtros avancados, testes de integracao
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
