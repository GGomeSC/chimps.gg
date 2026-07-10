<div align="center">

# chimps.gg

Um site de referência da comunidade com estratégias de [Bloons TD 6](https://ninjakiwi.com/games/bloons-td-6).

Cada estratégia é feita para um mapa e modo de jogo específico e registra o layout final de torres, um hero opcional e a build order rodada a rodada.

[![GitHub stars](https://img.shields.io/github/stars/GGomeSC/chimps.gg?style=social)](https://github.com/GGomeSC/chimps.gg/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/GGomeSC/chimps.gg?style=social)](https://github.com/GGomeSC/chimps.gg/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/GGomeSC/chimps.gg?style=social)](https://github.com/GGomeSC/chimps.gg/watchers)

[![GitHub issues](https://img.shields.io/github/issues/GGomeSC/chimps.gg)](https://github.com/GGomeSC/chimps.gg/issues)
[![Last commit](https://img.shields.io/github/last-commit/GGomeSC/chimps.gg)](https://github.com/GGomeSC/chimps.gg/commits)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/docs/kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

> **Status: public MVP + internal authoring Studio.**
> O site público oferece descoberta de estratégias e heróis, layouts aproximados e build
> orders versionadas. O `/studio` continua separado e protegido por Supabase magic link e
> allowlist de emails.

## Stack

SvelteKit · TypeScript · Supabase (PostgreSQL) · Sem ORM.

## Getting started

```sh
pnpm install
cp .env.example .env   # depois preencha suas chaves do Supabase
pnpm run dev           # studio em http://localhost:5173/studio/maps
```

Rotas públicas principais:

- `/` — homepage e estratégias recentes;
- `/strategies` — descoberta com filtros de mapa, modo, herói, dificuldade e versão;
- `/strategies/[id]` — placements aproximados e build order;
- `/heroes` e `/heroes/[id]` — cobertura factual derivada de estratégias `ready`.

Somente estratégias com `status = 'ready'` são expostas. Defina `PUBLIC_SITE_URL` com a
origem canônica de produção (por padrão, `https://chimps.gg`) para metadata e sitemap.

Para acessar o Studio localmente sem solicitar magic link, defina apenas no `.env`
local:

```sh
STUDIO_AUTH_BYPASS=true
```

O bypass também exige que o SvelteKit esteja em modo de desenvolvimento; portanto,
ele é ignorado em builds de produção mesmo que a variável seja configurada por
engano.

## Studio auth

O `/studio` usa Supabase Auth com magic link e `STUDIO_ALLOWED_EMAILS`.
Para produção:

1. Crie manualmente os usuários permitidos no Supabase Auth. O link de convite/criação
   do dashboard não é o link de login do Studio; depois de criar o usuário, peça um novo
   magic link em `/studio/login`.
2. Desabilite "Allow new users to sign up" no dashboard do Supabase.
3. Configure `STUDIO_ALLOWED_EMAILS` na Vercel.
4. Em **Authentication > URL Configuration**, configure o Site URL como
   `https://chimpsgg.vercel.app`.
6. Adicione redirect URLs como `http://localhost:5173/auth/confirm**` e
   `https://chimpsgg.vercel.app/auth/confirm**` (além do domínio canônico, se houver).

Se um link terminar em `localhost:3000/#error=...`, ele não passou por
`/auth/confirm`: corrija o Site URL/redirect URLs e a template acima, descarte o link
antigo e solicite outro em `/studio/login`. Links OTP expirados ou já utilizados não
podem ser reaproveitados.

O SMTP padrão do Supabase é limitado e só envia para membros do projeto; use SMTP
customizado antes de depender de vários emails na allowlist.

## Database

As migrations em SQL puro ficam em [`supabase/migrations/`](supabase/migrations) e são
aplicadas com a Supabase CLI:

```sh
pnpm exec supabase link --project-ref <seu-ref>
pnpm exec supabase db push
```

A migration do MVP público exige `verified_version` em estratégias `ready` e adiciona um
índice parcial para discovery. `exec_difficulty` continua opcional; estratégias sem nota
aparecem como “Not rated”.

## Maps sync

Os maps oficiais do BTD6 vêm da [Ninja Kiwi Open Data API](https://data.ninjakiwi.com/) (os nomes e as artes oficiais são extraídos dos metadados de challenges/races — não existe um endpoint de listagem de maps oficiais):

```sh
pnpm run discover:nk       # inspeciona o formato bruto das respostas da API
pnpm run sync:maps         # faz upsert dos maps (idempotente; -- --pages N para ampliar)
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `pnpm run dev` | Servidor de desenvolvimento |
| `pnpm run check` | Type / Svelte check |
| `pnpm run discover:nk` | Imprime respostas de exemplo da NK API |
| `pnpm run sync:maps` | Sincroniza os maps oficiais no banco |

## Notas do projeto

As principais decisões e convenções estão no [`CLAUDE.md`](CLAUDE.md).

## Proveniência dos dados

- Map IDs e artes disponíveis vêm de metadata oficial da Ninja Kiwi.
- Estratégias, placements, dificuldade de execução e build orders são conteúdo curado no Studio.
- Contagens nas páginas de herói são derivadas apenas de estratégias `ready`.
- Win rates, matchups, popularidade e performance por mapa ainda não estão disponíveis; nenhum
  dado analítico mockado é salvo nas tabelas de produção.
