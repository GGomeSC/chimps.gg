-- Core content: strategies, placements, steps.
--
-- placements = the final board state, rendered on the visual map.
-- steps      = the ordered round-by-round build guide.
-- These are intentionally separate concepts; never merge them.

create table public.strategies (
  id bigint generated always as identity primary key,
  map_id bigint not null references public.maps (id) on delete restrict,
  game_mode_id bigint not null references public.game_modes (id) on delete restrict,
  title text not null,
  description text,
  hero_id bigint references public.heroes (id) on delete restrict,
  source_url text,
  -- Game version the strategy was last verified on, e.g. '49.0'.
  verified_version text,
  -- Execution difficulty, 1 (relaxed) to 5 (frame-perfect micro).
  exec_difficulty smallint check (exec_difficulty between 1 and 5),
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  -- Internal quality/priority score for curation; semantics TBD.
  score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index strategies_map_mode_idx on public.strategies (map_id, game_mode_id);
-- Postgres does not auto-index FK columns; these keep restrict-checks and
-- cascades off sequential scans.
create index strategies_game_mode_idx on public.strategies (game_mode_id);
create index strategies_hero_idx on public.strategies (hero_id);

create trigger strategies_set_updated_at
  before update on public.strategies
  for each row execute function public.set_updated_at();

alter table public.strategies enable row level security;

create table public.placements (
  id bigint generated always as identity primary key,
  strategy_id bigint not null references public.strategies (id) on delete cascade,
  tower_id bigint not null references public.towers (id) on delete restrict,
  -- Normalized map coordinates (fraction of map width/height), never pixels.
  pos_x double precision not null check (pos_x between 0 and 1),
  pos_y double precision not null check (pos_y between 0 and 1),
  -- Final crosspath, e.g. '2-0-5'.
  final_path text check (final_path ~ '^[0-5]-[0-5]-[0-5]$'),
  label text,
  notes text
);

create index placements_strategy_idx on public.placements (strategy_id);
create index placements_tower_idx on public.placements (tower_id);

alter table public.placements enable row level security;

create table public.steps (
  id bigint generated always as identity primary key,
  strategy_id bigint not null references public.strategies (id) on delete cascade,
  -- Optional link to the placement this step concerns. Steps about a removed
  -- placement are meaningless, so they go with it.
  placement_id bigint references public.placements (id) on delete cascade,
  round_number smallint not null check (round_number between 1 and 200),
  action text not null check (action in ('place', 'upgrade', 'sell', 'retarget', 'other')),
  -- Path state after this step, e.g. '2-0-3'.
  target_path text check (target_path ~ '^[0-5]-[0-5]-[0-5]$'),
  description text,
  order_index integer not null,
  -- Stable ordering per strategy; deferrable so bulk reorders can swap indexes
  -- inside a transaction.
  constraint steps_strategy_order_key unique (strategy_id, order_index)
    deferrable initially deferred
);

create index steps_strategy_round_idx on public.steps (strategy_id, round_number);
-- Placement deletes cascade into steps; without this every delete scans steps.
create index steps_placement_idx on public.steps (placement_id);

alter table public.steps enable row level security;
