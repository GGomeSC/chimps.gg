-- A hero is a tower with category = 'Hero'. Synergy is therefore a generic,
-- symmetric tower-to-tower relation stored once in canonical ID order.
begin;

-- A failed non-transactional first attempt may have created this empty target
-- before reaching the source-table lock. No deployed code writes this table
-- until this migration is recorded.
drop table if exists public.tower_synergies;

create table public.tower_synergies (
  id bigint generated always as identity primary key,
  tower_a_id bigint not null references public.towers(id) on delete cascade,
  tower_b_id bigint not null references public.towers(id) on delete cascade,
  description text,
  created_at timestamptz not null default now(),
  constraint tower_synergies_description_nonblank
    check (description is null or nullif(btrim(description), '') is not null),
  constraint tower_synergies_distinct check (tower_a_id <> tower_b_id),
  constraint tower_synergies_canonical check (tower_a_id < tower_b_id),
  constraint tower_synergies_pair_key unique (tower_a_id, tower_b_id)
);

-- The pair key already supports lookups by tower_a_id. PostgreSQL does not
-- index the other FK automatically, so only the reverse endpoint needs this.
create index tower_synergies_b_idx on public.tower_synergies (tower_b_id);

alter table public.tower_synergies enable row level security;

-- Preserve any relationships created through the first hero-specific model.
-- Block the old RPC/service-role writes until this transaction copies and
-- drops the source table, preventing a pair from landing between those steps.
lock table public.hero_synergies in share row exclusive mode;

insert into public.tower_synergies (tower_a_id, tower_b_id)
select least(hero_id, tower_id), greatest(hero_id, tower_id)
from public.hero_synergies
on conflict (tower_a_id, tower_b_id) do nothing;

drop function public.update_hero_profile(
  bigint, text, integer, text, numeric, text, text, bigint[]
);

drop table public.hero_synergies;

-- The current Studio workflow edits a Hero profile, but writes generic tower
-- pairs. Retained pairs are updated in place so their stable ID/created_at are
-- preserved; deselected pairs are removed and new pairs are inserted.
create function public.update_hero_profile(
  p_hero_id bigint,
  p_description text,
  p_base_cost integer,
  p_attack_style text,
  p_xp_ratio numeric,
  p_technical_description text,
  p_profile_source_url text,
  p_synergy_tower_ids bigint[],
  p_synergy_descriptions text[]
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
  v_synergy_descriptions text[] := coalesce(p_synergy_descriptions, array[]::text[]);
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

  if cardinality(v_synergy_tower_ids) <> cardinality(v_synergy_descriptions) then
    raise exception using
      errcode = '22023',
      message = 'each synergy tower ID must have one matching description';
  end if;

  if exists (
    select 1
    from unnest(v_synergy_tower_ids) as synergy_id
    where synergy_id is null or synergy_id = p_hero_id
  ) then
    raise exception using
      errcode = '22023',
      message = 'synergy tower IDs cannot be null or reference the edited tower';
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
    where tower.id is null
  ) then
    raise exception using
      errcode = '22023',
      message = 'synergies must reference existing towers';
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

  delete from public.tower_synergies as synergy
  where (synergy.tower_a_id = p_hero_id or synergy.tower_b_id = p_hero_id)
    and not exists (
      select 1
      from unnest(v_synergy_tower_ids) as selected_id
      where synergy.tower_a_id = least(p_hero_id, selected_id)
        and synergy.tower_b_id = greatest(p_hero_id, selected_id)
    );

  insert into public.tower_synergies (tower_a_id, tower_b_id, description)
  select
    least(p_hero_id, selected.id),
    greatest(p_hero_id, selected.id),
    nullif(btrim(selected.description), '')
  from unnest(v_synergy_tower_ids, v_synergy_descriptions)
    as selected(id, description)
  on conflict (tower_a_id, tower_b_id) do update
  set description = excluded.description;
end;
$$;

revoke execute on function public.update_hero_profile(
  bigint, text, integer, text, numeric, text, text, bigint[], text[]
) from public, anon, authenticated;

grant execute on function public.update_hero_profile(
  bigint, text, integer, text, numeric, text, text, bigint[], text[]
) to service_role;

comment on table public.tower_synergies is
  'Symmetric editorial tower pairings stored once in canonical tower ID order.';

commit;
