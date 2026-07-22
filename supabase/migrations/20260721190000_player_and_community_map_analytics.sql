-- Public player profiles and share-code community-map analytics. These are
-- deliberately separate from public.maps, whose rows are official BTD6 maps
-- used by the curated strategy catalog.

create table public.nk_players (
  user_id text primary key,
  display_name text not null,
  rank integer not null check (rank >= 0),
  veteran_rank integer not null check (veteran_rank >= 0),
  achievements integer not null check (achievements >= 0),
  most_experienced_monkey text not null,
  highest_round integer not null check (highest_round >= 0),
  avatar_url text,
  banner_url text,
  followers bigint not null check (followers >= 0),
  bloons_popped bigint not null check (bloons_popped >= 0),
  game_count bigint not null check (game_count >= 0),
  games_won bigint not null check (games_won >= 0),
  profile_data jsonb not null default '{}'::jsonb,
  first_observed_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nk_players_user_id_nonempty check (btrim(user_id) <> ''),
  constraint nk_players_display_name_nonempty check (btrim(display_name) <> '')
);

create index nk_players_display_name_lower_idx
  on public.nk_players (lower(display_name) text_pattern_ops);

create table public.community_maps (
  map_code text primary key,
  name text not null,
  creator_user_id text references public.nk_players(user_id) on delete set null,
  created_at timestamptz not null,
  creation_version text not null,
  map_url text not null,
  plays bigint not null check (plays >= 0),
  wins bigint not null check (wins >= 0),
  losses bigint not null check (losses >= 0),
  plays_unique bigint not null check (plays_unique >= 0),
  wins_unique bigint not null check (wins_unique >= 0),
  losses_unique bigint not null check (losses_unique >= 0),
  first_observed_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_maps_code_format check (map_code ~ '^[A-Z0-9]{6,12}$'),
  constraint community_maps_creation_version_format check (creation_version ~ '^[0-9]+(\.[0-9]+)+$')
);

create index community_maps_creator_user_id_idx
  on public.community_maps (creator_user_id);

create table public.nk_version_observations (
  id bigint generated always as identity primary key,
  game_version text not null,
  source_url text not null,
  observed_at timestamptz not null unique,
  constraint nk_version_observations_version_format check (game_version ~ '^[0-9]+(\.[0-9]+)+$')
);

create index nk_version_observations_latest_idx
  on public.nk_version_observations (observed_at desc);

create table public.community_map_snapshots (
  id bigint generated always as identity primary key,
  map_code text not null references public.community_maps(map_code) on delete cascade,
  snapshot_date date not null,
  captured_at timestamptz not null,
  game_version text not null,
  version_source_url text not null,
  version_observed_at timestamptz not null,
  plays bigint not null check (plays >= 0),
  wins bigint not null check (wins >= 0),
  losses bigint not null check (losses >= 0),
  plays_unique bigint not null check (plays_unique >= 0),
  wins_unique bigint not null check (wins_unique >= 0),
  losses_unique bigint not null check (losses_unique >= 0),
  constraint community_map_snapshots_version_format check (game_version ~ '^[0-9]+(\.[0-9]+)+$'),
  constraint community_map_snapshots_daily_unique unique (map_code, snapshot_date)
);

create index community_map_snapshots_map_captured_idx
  on public.community_map_snapshots (map_code, captured_at);
create index community_map_snapshots_version_captured_idx
  on public.community_map_snapshots (game_version, captured_at desc);

create trigger nk_players_set_updated_at
  before update on public.nk_players
  for each row execute function public.set_updated_at();

create trigger community_maps_set_updated_at
  before update on public.community_maps
  for each row execute function public.set_updated_at();

alter table public.nk_players enable row level security;
alter table public.community_maps enable row level security;
alter table public.community_map_snapshots enable row level security;
alter table public.nk_version_observations enable row level security;

comment on table public.nk_players is
  'Public NK profiles indexed through transient OAK verification, explicit lookup, or observed map creators. OAK values are never stored.';
comment on table public.community_map_snapshots is
  'Append-only daily lifetime counters. Per-version activity is derived from consecutive deltas; first observations are partial baselines.';
