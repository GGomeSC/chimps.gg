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

> **Status: public MVP + authoring Studio.**
> O site público oferece descoberta de estratégias e heróis, layouts aproximados e build
> orders versionadas. O `/studio` continua separado e, durante a migração do backend, não
> possui autenticação.

## Stack

SvelteKit · TypeScript · Go · Supabase (PostgreSQL) · Sem ORM.

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

O backend Go é gerado a partir de `go/openapi.yaml` e usa SQL tipado pelo sqlc. Configure
`DATABASE_URL` com a conexão Supavisor em transaction mode (porta 6543 e SSL) e
`INTERNAL_SERVICE_SECRET` com um valor aleatório de pelo menos 32 bytes nos ambientes
Preview e Production da Vercel. O protocolo `/api/chimps/*` é interno ao SvelteKit.

Na Vercel, as Functions executam em São Paulo (`gru1`), próximas ao Supabase em
`sa-east-1`. As rotas públicas usam ISR por 5 minutos (3 minutos em `/strategies`) e
Runtime Cache para referências por 1 hora e metadados derivados por 5 minutos. Por isso,
uma estratégia publicada pode levar até 5 minutos para aparecer; contagens/opções
derivadas podem atravessar mais um ciclo de cache, e alterações em mapas ou heróis podem
levar pouco mais de 1 hora. O `/studio` não usa ISR.

Os loaders públicos usam relações aninhadas do PostgREST para buscar estratégia, mapa,
modo, herói, placements, torres e steps em uma única chamada. Contagens por herói e
versões distintas são agregadas por funções SQL `ready`-only; os lookups dos filtros
também são retornados juntos por `get_public_references`, evitando transferir linhas ou
abrir round-trips apenas para agregá-las na Function.

> **Aviso:** qualquer pessoa que conheça `/studio` pode ler e alterar conteúdo. Essa é
> uma decisão temporária e explícita do contrato de migração em [`MIGRATION.md`](MIGRATION.md).

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
| `pnpm run generate` | Regenera servidor Go, queries sqlc e cliente TypeScript |
| `pnpm run check` | Type / Svelte check |
| `pnpm run build` | Build de produção do SvelteKit |
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
