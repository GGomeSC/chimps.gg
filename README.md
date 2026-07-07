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

> **Status: Fase 1 — internal content-authoring foundation.**
> Schema, database types e um sync de maps da Ninja Kiwi. Ainda não há site público nem
> editor visual. O `/studio` não tem autenticação e **não é seguro para produção**
> (apenas uso local).

## Stack

SvelteKit · TypeScript · Supabase (PostgreSQL) · Sem ORM.

## Getting started

```sh
npm install
cp .env.example .env   # depois preencha suas chaves do Supabase
npm run dev            # studio em http://localhost:5173/studio/maps
```

## Database

As migrations em SQL puro ficam em [`supabase/migrations/`](supabase/migrations) e são
aplicadas com a Supabase CLI:

```sh
npx supabase link --project-ref <seu-ref>
npx supabase db push
```

## Maps sync

Os maps oficiais do BTD6 vêm da [Ninja Kiwi Open Data API](https://data.ninjakiwi.com/) (os nomes e as artes oficiais são extraídos dos metadados de challenges/races — não existe um endpoint de listagem de maps oficiais):

```sh
npm run discover:nk        # inspeciona o formato bruto das respostas da API
npm run sync:maps          # faz upsert dos maps (idempotente; -- --pages N para ampliar)
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run check` | Type / Svelte check |
| `npm run discover:nk` | Imprime respostas de exemplo da NK API |
| `npm run sync:maps` | Sincroniza os maps oficiais no banco |

## Notas do projeto

As principais decisões e convenções estão no [`CLAUDE.md`](CLAUDE.md).