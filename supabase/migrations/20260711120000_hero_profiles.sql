-- Optional editorial metadata for the public hero profile. Content remains
-- nullable so newly added heroes can render before their profile is complete.
alter table public.towers
  add column attack_style text,
  add column xp_ratio numeric(5, 3),
  add column technical_description text,
  add column profile_source_url text;

alter table public.towers
  add constraint towers_attack_style_nonblank
    check (attack_style is null or nullif(btrim(attack_style), '') is not null),
  add constraint towers_xp_ratio_positive
    check (xp_ratio is null or xp_ratio > 0),
  add constraint towers_technical_description_nonblank
    check (
      technical_description is null
      or nullif(btrim(technical_description), '') is not null
    ),
  add constraint towers_profile_source_url_http
    check (
      profile_source_url is null
      or profile_source_url ~* '^https?://[^[:space:]]+$'
    );

create table public.hero_synergies (
  hero_id bigint not null
    references public.towers(id) on delete cascade,
  tower_id bigint not null
    references public.towers(id) on delete cascade,
  primary key (hero_id, tower_id),
  constraint hero_synergies_distinct_towers check (hero_id <> tower_id)
);

-- The primary key covers hero_id lookups. The reverse FK needs its own index
-- for validation/cascades and for future tower-centric reads.
create index hero_synergies_tower_id_idx
  on public.hero_synergies (tower_id);

alter table public.hero_synergies enable row level security;

-- Studio saves the profile fields and the complete synergy selection as one
-- transaction. The function is service-role only and validates category
-- invariants that cannot be expressed with a cross-table CHECK constraint.
create function public.update_hero_profile(
  p_hero_id bigint,
  p_description text,
  p_base_cost integer,
  p_attack_style text,
  p_xp_ratio numeric,
  p_technical_description text,
  p_profile_source_url text,
  p_synergy_tower_ids bigint[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_description text := nullif(btrim(p_description), '');
  v_attack_style text := nullif(btrim(p_attack_style), '');
  v_technical_description text := nullif(btrim(p_technical_description), '');
  v_profile_source_url text := nullif(btrim(p_profile_source_url), '');
  v_synergy_tower_ids bigint[] := coalesce(p_synergy_tower_ids, array[]::bigint[]);
begin
  if not exists (
    select 1
    from public.towers
    where id = p_hero_id and category = 'Hero'
  ) then
    raise exception using
      errcode = '22023',
      message = 'hero_id must reference a Hero tower';
  end if;

  if p_base_cost is not null and p_base_cost < 0 then
    raise exception using errcode = '22023', message = 'base_cost must be non-negative';
  end if;

  if p_xp_ratio is not null and p_xp_ratio <= 0 then
    raise exception using errcode = '22023', message = 'xp_ratio must be positive';
  end if;

  if v_profile_source_url is not null
    and v_profile_source_url !~* '^https?://[^[:space:]]+$'
  then
    raise exception using
      errcode = '22023',
      message = 'profile_source_url must be an HTTP or HTTPS URL';
  end if;

  if exists (
    select 1
    from unnest(v_synergy_tower_ids) as synergy_id
    where synergy_id is null
  ) then
    raise exception using errcode = '22023', message = 'synergy tower IDs cannot be null';
  end if;

  if cardinality(v_synergy_tower_ids) <> (
    select count(distinct synergy_id)
    from unnest(v_synergy_tower_ids) as synergy_id
  ) then
    raise exception using errcode = '22023', message = 'synergy tower IDs must be unique';
  end if;

  if exists (
    select 1
    from unnest(v_synergy_tower_ids) as synergy_id
    left join public.towers as tower on tower.id = synergy_id
    where tower.id is null or tower.category = 'Hero'
  ) then
    raise exception using
      errcode = '22023',
      message = 'synergies must reference existing non-Hero towers';
  end if;

  update public.towers
  set
    description = v_description,
    base_cost = p_base_cost,
    attack_style = v_attack_style,
    xp_ratio = p_xp_ratio,
    technical_description = v_technical_description,
    profile_source_url = v_profile_source_url
  where id = p_hero_id;

  delete from public.hero_synergies where hero_id = p_hero_id;

  insert into public.hero_synergies (hero_id, tower_id)
  select p_hero_id, synergy_id
  from unnest(v_synergy_tower_ids) as synergy_id;
end;
$$;

revoke execute on function public.update_hero_profile(
  bigint, text, integer, text, numeric, text, text, bigint[]
) from public, anon, authenticated;

grant execute on function public.update_hero_profile(
  bigint, text, integer, text, numeric, text, text, bigint[]
) to service_role;

comment on column public.towers.base_cost is
  'Base placement cost on Medium difficulty; nullable when not curated.';
comment on table public.hero_synergies is
  'Editorial tower pairings for hero profile pages; not derived performance data.';
