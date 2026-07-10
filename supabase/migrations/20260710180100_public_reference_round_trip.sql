-- Return unrelated strategy filter lookups in one REST round trip. The Runtime
-- Cache keeps this result for one hour, while Postgres builds it atomically.
create function public.get_public_references()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'maps', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'name', m.name,
            'difficulty', m.difficulty,
            'image_url', m.image_url,
            'nk_image_url', m.nk_image_url
          )
          order by m.name
        )
        from public.maps m
      ),
      '[]'::jsonb
    ),
    'modes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('id', gm.id, 'name', gm.name)
          order by gm.id
        )
        from public.game_modes gm
      ),
      '[]'::jsonb
    ),
    'heroes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'category', t.category,
            'icon_path', t.icon_path
          )
          order by t.name
        )
        from public.towers t
        where t.category = 'Hero'
      ),
      '[]'::jsonb
    )
  );
$$;

revoke execute on function public.get_public_references() from public, anon, authenticated;
grant execute on function public.get_public_references() to service_role;
