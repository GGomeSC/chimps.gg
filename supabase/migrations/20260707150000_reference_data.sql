-- Reference data: maps, towers, heroes, game_modes.
-- RLS is enabled with zero policies (deny-all): all access goes through the
-- service-role client in server-only code. See CLAUDE.md.

-- Shared trigger to maintain updated_at.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Official BTD6 maps, synced from the Ninja Kiwi Open Data API.
-- Upsert key is nk_map_id (NK internal name, e.g. 'Cornfield'), never name.
create table public.maps (
  id bigint generated always as identity primary key,
  name text not null,
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  -- Our own hosted asset (future). The sync script must never write this.
  image_url text,
  nk_map_id text not null unique,
  -- Official art URL from NK (static-api.nkstatic.com).
  nk_image_url text,
  -- Only populated for community maps; NULL for official maps (the NK API does
  -- not expose these stats for official maps).
  plays bigint,
  wins bigint,
  upvotes bigint,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger maps_set_updated_at
  before update on public.maps
  for each row execute function public.set_updated_at();

alter table public.maps enable row level security;

create table public.towers (
  id bigint generated always as identity primary key,
  name text not null unique,
  category text not null check (category in ('Primary', 'Military', 'Magic', 'Support')),
  -- Base cost on Medium difficulty (community convention). CHIMPS uses Hard
  -- prices: Medium x 1.08 rounded to the nearest 5.
  base_cost integer check (base_cost >= 0)
);

alter table public.towers enable row level security;

create table public.heroes (
  id bigint generated always as identity primary key,
  name text not null unique
);

alter table public.heroes enable row level security;

create table public.game_modes (
  id bigint generated always as identity primary key,
  name text not null unique
);

alter table public.game_modes enable row level security;

insert into public.game_modes (name) values
  ('CHIMPS'),
  ('Easy Standard'),
  ('Primary Only'),
  ('Deflation'),
  ('Medium Standard'),
  ('Military Only'),
  ('Apopalypse'),
  ('Reverse'),
  ('Hard Standard'),
  ('Magic Only'),
  ('Double HP MOABs'),
  ('Half Cash'),
  ('Alternate Bloons Rounds'),
  ('Impoppable');

-- Static seed data (not available from the NK API). Costs are Medium prices;
-- review against the current game version before relying on them, and add any
-- towers/heroes released after mid-2025.
insert into public.towers (name, category, base_cost) values
  ('Dart Monkey', 'Primary', 200),
  ('Boomerang Monkey', 'Primary', 325),
  ('Bomb Shooter', 'Primary', 525),
  ('Tack Shooter', 'Primary', 280),
  ('Ice Monkey', 'Primary', 500),
  ('Glue Gunner', 'Primary', 225),
  ('Desperado', 'Primary', 395),
  ('Sniper Monkey', 'Military', 350),
  ('Monkey Sub', 'Military', 325),
  ('Monkey Buccaneer', 'Military', 500),
  ('Monkey Ace', 'Military', 800),
  ('Heli Pilot', 'Military', 1600),
  ('Mortar Monkey', 'Military', 750),
  ('Dartling Gunner', 'Military', 850),
  ('Wizard Monkey', 'Magic', 375),
  ('Super Monkey', 'Magic', 2500),
  ('Ninja Monkey', 'Magic', 500),
  ('Alchemist', 'Magic', 550),
  ('Druid', 'Magic', 425),
  ('Mermonkey', 'Magic', 500),
  ('Banana Farm', 'Support', 1250),
  ('Spike Factory', 'Support', 1000),
  ('Monkey Village', 'Support', 1200),
  ('Engineer Monkey', 'Support', 450);

insert into public.heroes (name) values
  ('Quincy'),
  ('Gwendolin'),
  ('Striker Jones'),
  ('Obyn Greenfoot'),
  ('Rosalia'),
  ('Captain Churchill'),
  ('Benjamin'),
  ('Pat Fusty'),
  ('Ezili'),
  ('Adora'),
  ('Admiral Brickell'),
  ('Etienne'),
  ('Sauda'),
  ('Psi'),
  ('Geraldo'),
  ('Corvus');
