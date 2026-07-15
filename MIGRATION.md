# Migração do backend para Go

Este documento orienta a migração gradual do backend do `chimps.gg` de TypeScript/PostgREST para Go/SQL direto.

## Contrato da migração

A migração troca a implementação, não o produto.

Existe somente uma mudança funcional autorizada: **remover completamente a autenticação do Studio**. Todo comportamento não descrito na seção [Remoção do auth](#remoção-do-auth) deve permanecer equivalente ao atual.

Paridade significa preservar:

- rotas, métodos, status, redirects e mensagens;
- payloads, nomes de campos, nullability e ordenação;
- regras atuais de criação, edição e validação;
- comportamento concorrente existente;
- filtros, paginação e tolerância a dados inconsistentes;
- headers, TTLs e freshness dos caches atuais.

Antes de portar uma operação, seu comportamento atual deve estar coberto por testes de caracterização. Se uma proposta não passar nesses testes, ela não pertence a esta migração.

### Objetivos técnicos

- mover acesso ao banco e lógica server-side selecionada para Go;
- usar SQL explícito gerado por `sqlc`;
- gerar o cliente TypeScript server-only a partir de OpenAPI;
- reduzir drift entre SQL, Go e TypeScript;
- medir redução de runtime, round-trips e serialização;
- continuar na Vercel Hobby com uma única Go Function;
- usar Supavisor transaction mode com poucas conexões;
- permitir cutover e rollback por operação;
- manter uma estrutura de arquivos rasa.

### Decisões adiadas

Os itens abaixo podem ser bons trabalhos futuros, mas não fazem parte deste port:

- comando `publishStrategy` e novas regras de publicação;
- state machine, strategies ready imutáveis ou optimistic concurrency;
- correção da race de `heroPlacementError`;
- novas constraints, FKs, triggers ou colunas de auditoria;
- outbox, worker, Cron ou invalidação on-demand;
- mudanças de TTL, cache tags ou freshness;
- novas URLs, slugs, telas ou fluxos do Studio;
- service JWT, identidade de actor ou novo sistema de auth;
- mudança de mensagens, status ou códigos de erro.

## Arquitetura alvo

```text
Browser
  |
  v
SvelteKit
  |-- páginas públicas e cache atuais
  |-- páginas/actions do Studio sem auth
  |
  | INTERNAL_SERVICE_SECRET
  v
Uma Vercel Go Function
  |
  | Supavisor transaction mode
  v
PostgreSQL/Supabase
```

O SvelteKit permanece como superfície HTTP do produto. Forms, actions, loaders e endpoints existentes delegam internamente ao Go uma operação por vez, preservando seus contratos externos.

A URL técnica da Go Function exige `INTERNAL_SERVICE_SECRET`. Esse segredo é apenas service-to-service, nunca chega ao browser e não controla acesso ao Studio. Não usar JWT ou protocolo de identidade para essa comunicação.

## Estrutura planejada

Usar um único package Go de aplicação:

```text
api/
`-- chimps.go                 # único entrypoint Vercel
go/
|-- app.go                    # router, config e erros HTTP internos
|-- config.go                 # se necessário
|-- studio.go                 # operações atuais do Studio
|-- public.go                 # somente reads públicos que forem migrados
|-- postgres.go               # pgxpool e helper transacional
|-- generated/
|   |-- db/                   # saída do sqlc
|   `-- api/                  # saída do gerador OpenAPI
|-- openapi.yaml
|-- queries.sql
`-- sqlc.yaml
go.mod
go.sum
```

Regras:

- não criar camadas `domain`, `service`, `repository`, `commands`, `handlers` ou `usecases` para a primeira versão;
- `studio.go` e `public.go` podem usar queries sqlc diretamente em funções pequenas;
- `postgres.go` contém apenas conexão e transações;
- código gerado não recebe edição manual;
- começar com um único `queries.sql`;
- separar arquivos quando isso melhorar navegação;
- extrair package somente diante de múltiplos consumidores ou dependência cíclica real.

## Diretrizes para o código Go

### Versão e fontes de verdade

O código deve usar **Go 1.26** e o patch estável mais recente disponível no momento da implementação. Inicializar o `go.mod` explicitamente, pois `go mod init` pode escolher uma versão de linguagem anterior:

```go.mod
go 1.26.0
toolchain go1.26.5
```

O exemplo registra o patch estável atual na data deste plano. Antes de implementá-lo, atualizar `toolchain` para o patch estável mais recente da série 1.26, após verificar a compatibilidade com o runtime Go da Vercel. A Vercel usa essa diretiva quando ela existe; portanto, a mesma versão deve ser usada no desenvolvimento, CI e deploy.

O conhecimento prévio do agente não é fonte de verdade para versões, APIs ou recomendações atuais. Antes de escrever o primeiro código Go e ao avaliar uma API desconhecida, consultar nesta ordem:

1. release notes e histórico de releases em `go.dev/doc`;
2. documentação da versão instalada com `go doc` e `pkg.go.dev`;
3. documentação oficial da Vercel para o runtime Go;
4. documentação e changelog oficiais da dependência, quando houver.

Confirmar assinatura, versão de introdução, estabilidade e comportamento da API. Não reproduzir de memória uma solução antiga quando a biblioteca padrão ou uma dependência já oferecer uma alternativa atual melhor.

Usar recursos estáveis disponíveis até Go 1.26 quando tornarem o código mais simples, seguro ou eficiente. Exemplos relevantes incluem `new(valor)` para campos opcionais, APIs modernas de `net/http`, os packages `slices`, `maps`, `cmp` e `iter`, e `B.Loop` em benchmarks. Esses recursos são opções, não metas: não introduzir generics, iterators ou abstrações somente para demonstrar novidade.

Não habilitar `GOEXPERIMENT`, APIs experimentais ou release candidates. Uma exceção exige necessidade concreta, benchmark reproduzível e autorização explícita.

### Implementação idiomática e eficiente

- preferir código preciso a código defensivo: validar dados nas fronteiras e, depois disso, programar sobre invariantes explícitas em vez de espalhar checks redundantes, defaults arbitrários ou fallbacks silenciosos;
- quando uma invariante for violada, retornar um erro específico e observável; não mascarar estado impossível para manter a execução;
- preferir a biblioteca padrão e `pgx`/código sqlc já escolhidos antes de adicionar uma dependência;
- manter handlers pequenos, passar `context.Context` até o banco e respeitar cancelamento e deadlines;
- usar tipos concretos por padrão e declarar interfaces pequenas no consumidor somente quando houver mais de uma implementação ou necessidade real de teste;
- envolver erros com contexto usando `%w` e inspecioná-los com `errors.Is`/`errors.As`; não comparar texto de erro;
- pré-alocar slices e maps quando o tamanho for conhecido, sem introduzir pools, caches ou concorrência sem medição;
- não iniciar goroutines desvinculadas da request; toda concorrência deve ser limitada, cancelável e ter ganho demonstrável;
- evitar reflexão, `any`, conversões intermediárias e cópias de payload no caminho HTTP -> OpenAPI -> sqlc;
- manter SQL como responsável por filtro, ordenação, paginação e agregação quando isso reduzir dados e round-trips sem quebrar a paridade;
- escrever comentários para decisões e invariantes, não para narrar o código;
- aplicar `gofmt` e aceitar as simplificações seguras propostas por `go fix`; revisar o diff gerado antes de mantê-lo.

Performance deve ser comprovada no caminho relevante. Para uma otimização não óbvia, registrar benchmark antes/depois com alocações; não conservar complexidade que não produza ganho mensurável.

## Especificação de paridade

O código atual é a fonte de verdade. Esta seção destaca os pontos mais fáceis de mudar acidentalmente durante o port.

### Studio root

- `GET /studio` faz redirect server-side `302` para `/studio/strategies`.

### Strategy metadata

- title, map e game mode são obrigatórios;
- hero é opcional e, quando presente, aponta para uma tower `Hero`;
- execution difficulty é opcional e aceita 1 a 5;
- status aceita `draft`, `ready` e `archived`;
- `ready` exige `verified_version` não vazio;
- source URL opcional aceita somente HTTP/HTTPS;
- description é opcional;
- create e update podem definir diretamente qualquer status aceito;
- strategy ready continua editável;
- create bem-sucedido mantém o redirect `303` atual;
- responses e mensagens seguem `parseStrategyForm` e os actions atuais.

Não criar fluxo separado de publicação.

### Placements

- create exige `tower_id` inteiro positivo e coordenadas em `[0, 1]`;
- create retorna JSON com status `201`;
- patch mantém os campos e validações atuais;
- `final_path` aceita null ou o padrão atual;
- Hero não recebe `final_path`;
- delete retorna `204` e mantém o cascade atual para steps;
- a verificação atual de Hero conserva a mesma semântica, inclusive sua race conhecida.

### Steps

- round aceita 1 a 200;
- actions são `place`, `upgrade`, `sell`, `retarget` e `other`;
- placement e description continuam opcionais;
- placement informada pertence à mesma strategy;
- target path e Hero seguem as validações atuais;
- add calcula `order_index` como hoje;
- update e delete continuam limitados por strategy ID;
- move aceita `up` e `down`;
- reorder continua usando `reorder_steps`;
- movimento na borda continua sendo no-op bem-sucedido.

### Hero profiles e synergies

- manter `update_hero_profile` como fronteira transacional;
- preservar nullability, IDs e metadata das synergies retidas;
- preservar o modelo simétrico de `tower_synergies`.

### Público

- somente strategies `ready` são expostas;
- URLs continuam numéricas;
- filtros, cursor, sort e interpretação de query params permanecem iguais;
- `toStrategySummary` continua tolerando e omitindo rows ready inconsistentes;
- view models permanecem camelCase;
- placements e steps preservam relações e ordenação;
- EN/PT, canonicals, sitemap e robots permanecem iguais;
- dados ausentes continuam ausentes.

### Cache

- ISR permanece em 300 segundos no grupo público e 180 em `/strategies`;
- `isr.allowQuery` permanece igual;
- referências permanecem no Runtime Cache por 1 hora;
- metadata derivada permanece por 5 minutos;
- headers atuais permanecem iguais;
- não adicionar invalidação explícita.

## Remoção do auth

O Studio será deliberadamente público. Qualquer pessoa que conheça `/studio` poderá ler e alterar conteúdo; essa consequência é aceita neste momento.

### Alterações

1. Apagar:
   - `src/routes/studio/login/`;
   - `src/routes/studio/logout/`;
   - `src/routes/auth/confirm/`;
   - `src/lib/server/studio-auth.ts`.
2. Remover de `src/hooks.server.ts` toda a criação de client `@supabase/ssr`, claims, allowlist, bypass, redirects de login, respostas de auth, sign-out e cookies.
3. Remover de `src/app.d.ts` os locals `supabase` e `studioUser` sem consumidores.
4. Remover `src/routes/studio/+layout.server.ts` se ficar sem responsabilidade.
5. Remover email, sessão e form de logout do layout do Studio.
6. Remover `@supabase/ssr` e atualizar `pnpm-lock.yaml`.
7. Remover `STUDIO_ALLOWED_EMAILS` e `STUDIO_AUTH_BYPASS` dos ambientes e docs.
8. Remover do README e `CLAUDE.md` as instruções de magic link, allowlist, convite e
   bypass.
9. Remover `PUBLIC_SUPABASE_PUBLISHABLE_KEY` somente se ficar sem consumidores;
   preservar `PUBLIC_SUPABASE_URL`.

Preservar o redirect root:

```ts
import { redirect } from '@sveltejs/kit';

export function load() {
	redirect(302, '/studio/strategies');
}
```

Critérios de aceite:

- `/studio` redireciona diretamente para `/studio/strategies`;
- páginas e mutations do Studio funcionam sem cookie;
- `/studio/login`, `/studio/logout` e `/auth/confirm` retornam 404;
- não existem redirects para login nem respostas 401/403 de usuário;
- não há UI de sessão/logout;
- não restam referências funcionais a `@supabase/ssr`, `getClaims`, `studioUser`, `STUDIO_ALLOWED_EMAILS` ou `STUDIO_AUTH_BYPASS`.

## Banco e conexão

A primeira vertical slice usa o schema atual; nenhuma migration é necessária. As migrations existentes alimentam o sqlc.

Índices de performance só entram quando `EXPLAIN (ANALYZE, BUFFERS)` demonstrar o gargalo e o resultado permanecer idêntico.

Configuração inicial para Supavisor transaction mode:

```text
MinConns: 0
MaxConns: 2 por instância warm
Prepared statement cache: desabilitado
MaxConnLifetime: 10m com jitter
MaxConnIdleTime: 1m
Acquire timeout: 2s
Statement timeout: 3-5s
```

- inicializar o pool de forma lazy e concorrente em escopo de package;
- aproveitar warm invocations sem depender delas;
- não manter goroutine ou estado obrigatório em memória;
- manter transações curtas e sem HTTP;
- não aumentar o pool antes de medir acquire time e conexões totais.

## OpenAPI interno

OpenAPI descreve somente o protocolo técnico SvelteKit -> Go.

- toda operação exige `INTERNAL_SERVICE_SECRET`;
- o cliente TypeScript é server-only;
- o adapter SvelteKit preserva o contrato externo especificado acima;
- erros internos não vazam stack trace ou SQL;
- não expor a API Go como contrato público documentado.

## Execução

### 0. Caracterizar

Para cada rota afetada, registrar método, input, status, redirect, body, headers e efeito no banco. Criar fixtures com nulls e referências inconsistentes e medir latência, round-trips e payloads.

Nenhuma operação é portada sem teste que falhe diante de mudança do contrato atual.

### 1. Remover auth

Executar a seção [Remoção do auth](#remoção-do-auth) antes de introduzir Go. Validar com `pnpm run check`, `pnpm run build` e smoke test hospedado.

### 2. Preparar Go

1. Aplicar [Diretrizes para o código Go](#diretrizes-para-o-código-go) e adicionar `go.mod`, sqlc, OpenAPI e geração reproduzível.
2. Criar somente `api/chimps.go`.
3. Configurar pool Supavisor lazy.
4. Configurar `INTERNAL_SERVICE_SECRET` na Vercel.
5. Fazer CI falhar quando código gerado divergir.
6. Confirmar cold e warm invocations sem alterar rotas de produto.

### 3. Portar o Studio

Ordem sugerida:

1. reads de referência;
2. lista de strategies;
3. load do editor;
4. update metadata;
5. create strategy;
6. mutations de steps e reorder;
7. mutations de placements;
8. hero profiles/synergies apenas se houver ganho medido.

Para cada operação:

1. escrever a query sqlc equivalente;
2. implementar em `studio.go`;
3. comparar implementação antiga e Go sobre a mesma fixture;
4. integrar pelo cliente server-only;
5. executar caracterização e medir;
6. remover apenas o código TypeScript substituído;
7. avançar após paridade.

Não fazer dual-write. Shadow comparison é permitido apenas em reads.

### 4. Portar reads públicos

Migrar todos os reads públicos, registrando as métricas antes e depois. Comparar resultados
antigo/novo antes do cutover e preservar integralmente a especificação pública e de cache.

Uma agregação SQL para `getHomeMaps` é válida apenas se retornar os mesmos mapas,
contagens e ordem. Manter `public-content.ts` disponível para rollback até concluir a
paridade.

### 5. Limpar

- remover imports server-side e tipos manuais somente quando ficarem sem consumidores;
- manter SQL functions e `supabase-js` ainda utilizados;
- confirmar uma única writer ativa por operação;
- atualizar README, `CLAUDE.md` e variáveis de ambiente.

## Verificação

### Gates por operação

- status, redirect, body, mensagem e headers iguais;
- mesmos efeitos no banco em success e failure paths;
- queries sqlc testadas contra PostgreSQL real;
- nullability, FKs, cascades e RPCs existentes preservados;
- p50/p95/p99, round-trips e bytes comparados;
- cold/warm invocation e acquire do Supavisor observados;
- `pnpm run check`, `pnpm run build`, `go fix ./...` sem diff pendente, `go test -race ./...` e `go vet ./...` verdes;
- benchmarks com `B.Loop` e `-benchmem` para otimizações não triviais.

### Smoke hospedado

- critérios de auth removal;
- create/edit de strategy;
- placements, steps e reorder;
- hero profile/synergies se migrados;
- páginas ready-only EN/PT;
- discovery, details, heroes e home;
- sitemap, robots e cache headers.

## Deploy e rollback

```text
Vercel Hobby
  SvelteKit Functions
  uma Go Function protegida por INTERNAL_SERVICE_SECRET

Supabase
  PostgreSQL
  Supavisor transaction mode
```

Cutover por operação:

1. deploy do handler Go sem caller ativo;
2. smoke do endpoint interno;
3. deploy do adapter SvelteKit para uma operação;
4. verificar contrato e métricas hospedadas;
5. remover o caminho TypeScript substituído;
6. repetir.

Rollback significa restaurar somente o adapter/implementação TypeScript daquela operação. Não há rollback de schema porque esta migração não o altera. A remoção do auth permanece mesmo se o port para Go for revertido.

## Registro da implementação em 2026-07-15

As três primeiras fases foram promovidas por fast-forward para `main`:

- autenticação removida e comportamento sem cookies caracterizado;
- fundação Go, OpenAPI, sqlc, cliente TypeScript gerado, CI e health autenticado implantados;
- todos os reads e writes do Studio migrados, incluindo as fronteiras transacionais de
  reorder e hero profile/synergies;
- smoke hospedado do Studio executado com uma strategy descartável, removida ao final.

A fase pública foi implementada em `migration/04-public-cutover` e promovida por
fast-forward depois da aceitação explícita da exceção de cold start. Todos os reads usam
Go/SQL direto, aplicam `status = 'ready'`, preservam a omissão de rows inconsistentes e
mantêm os adapters, TTLs, ISR, headers, canonicals e URLs externos. O sitemap deriva seus
IDs do cache de referências de uma hora, evitando uma consulta adicional sem alterar sua
freshness.

Os gates locais passaram com geração reproduzível, `pnpm run check`, `pnpm run build`,
`go fix ./...`, `go test -race ./...` contra PostgreSQL real, `go vet ./...` e
`git diff --check`. O smoke da Preview final passou para EN/PT, home, discovery, detalhes,
heroes, sitemap, robots, Studio, redirects, 404s e autenticação da API técnica.

Comparação warm p95 com 20 requests intercalados na Preview protegida:

- home: 0,531 s no legado e 0,370 s no Go, melhora de 30,3%;
- discovery: 0,264 s no legado e 0,224 s no Go, melhora de 15,3%;
- heroes: 0,358 s no legado e 0,215 s no Go, melhora de 39,8%;
- sitemap: 0,088 s no legado e 0,092 s no Go, regressão de 5,3%.

O gate de primeira invocação excedeu o limite original. Em redeploys novos comparáveis, a
home legada respondeu em 1,795-1,849 s e a implementação Go em 2,344-2,635 s, uma
regressão de 30,5-42,5%. Os logs atribuem cerca de 685-702 ms de cada instância ao primeiro
acquire TLS no Supavisor; o ISR executa o loader duas vezes e cada loader faz os dois reads
da home. Uma operação Go combinada reduziu os acquires, mas as duas gerações ISR foram
serializadas e a resposta piorou para 3,057 s, por isso a tentativa foi revertida.

Essa exceção foi aceita explicitamente em 2026-07-15. A decisão preserva o pool
estritamente lazy e considera as melhorias warm p95, o cache ISR e a ausência de regressão
funcional suficientes para promover a fase pública.

## Conclusão

A migração termina quando o auth foi removido, as operações escolhidas usam Go/sqlc,
todos os testes de paridade passam, o ganho foi medido e cada operação possui rollback
isolado. Qualquer mudança além desse contrato deve ser planejada separadamente.
