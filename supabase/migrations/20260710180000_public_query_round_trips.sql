-- Keep public strategy metadata aggregation inside Postgres so public loaders
-- transfer only the rows they render. Both functions remain security-invoker
-- and explicitly enforce ready-only visibility.
create function public.get_public_heroes()
returns table (
  id bigint,
  name text,
  icon_path text,
  guide_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    t.id,
    t.name,
    t.icon_path,
    count(s.id)::bigint as guide_count
  from public.towers t
  left join public.strategies s
    on s.hero_id = t.id
   and s.status = 'ready'
  where t.category = 'Hero'
  group by t.id, t.name, t.icon_path
  order by t.name;
$$;

create function public.get_public_strategy_versions()
returns table (verified_version text)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct s.verified_version
  from public.strategies s
  where s.status = 'ready'
    and nullif(btrim(s.verified_version), '') is not null;
$$;

revoke execute on function public.get_public_heroes() from public, anon, authenticated;
revoke execute on function public.get_public_strategy_versions() from public, anon, authenticated;
grant execute on function public.get_public_heroes() to service_role;
grant execute on function public.get_public_strategy_versions() to service_role;
