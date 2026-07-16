-- name: Health :one
select 1::integer as ok;

-- name: ListStudioMaps :many
select
  id, name, difficulty, image_url, nk_map_id, nk_image_url,
  plays, wins, upvotes, last_synced_at, created_at, updated_at
from public.maps
order by difficulty asc nulls last, name asc;

-- name: ListStudioReferenceMaps :many
select id, name, difficulty
from public.maps
order by name asc;

-- name: ListGameModes :many
select id, name
from public.game_modes
order by id asc;

-- name: ListStudioHeroReferences :many
select id, name
from public.towers
where category = 'Hero'
order by name asc;

-- name: ListStudioStrategies :many
select
  strategy.id,
  strategy.map_id,
  strategy.game_mode_id,
  strategy.title,
  strategy.description,
  strategy.hero_id,
  strategy.source_url,
  strategy.verified_version,
  strategy.exec_difficulty,
  strategy.status,
  strategy.score,
  strategy.created_at,
  strategy.updated_at,
  map.name as map_name,
  mode.name as mode_name,
  hero.name as hero_name,
  count(placement.id)::integer as placement_count
from public.strategies as strategy
join public.maps as map on map.id = strategy.map_id
join public.game_modes as mode on mode.id = strategy.game_mode_id
left join public.towers as hero on hero.id = strategy.hero_id
left join public.placements as placement on placement.strategy_id = strategy.id
group by strategy.id, map.name, mode.name, hero.name
order by strategy.updated_at desc;

-- name: GetStudioStrategy :one
select
  id, map_id, game_mode_id, title, description, hero_id, source_url,
  verified_version, exec_difficulty, status, score, created_at, updated_at
from public.strategies
where id = sqlc.arg(strategy_id);

-- name: ListStudioEditorMaps :many
select id, name, difficulty, image_url, nk_image_url
from public.maps
order by name asc;

-- name: ListStudioTowers :many
select
  id, name, category, base_cost, icon_path, description, attack_style,
  xp_ratio, technical_description, profile_source_url
from public.towers
order by name asc;

-- name: ListStrategyPlacements :many
select id, strategy_id, tower_id, pos_x, pos_y, final_path, label, notes
from public.placements
where strategy_id = sqlc.arg(strategy_id)
order by id asc;

-- name: ListStrategySteps :many
select
  id, strategy_id, placement_id, round_number, action, target_path,
  description, order_index
from public.steps
where strategy_id = sqlc.arg(strategy_id)
order by order_index asc;

-- name: GetTowerCategory :one
select category
from public.towers
where id = sqlc.arg(tower_id);

-- name: GetPlacementTowerForStrategy :one
select tower_id
from public.placements
where id = sqlc.arg(placement_id)
  and strategy_id = sqlc.arg(strategy_id);

-- name: CreateStudioStrategy :one
insert into public.strategies (
  map_id, game_mode_id, title, description, hero_id, source_url,
  verified_version, exec_difficulty, status
) values (
  sqlc.arg(map_id),
  sqlc.arg(game_mode_id),
  sqlc.arg(title),
  sqlc.narg(description),
  sqlc.narg(hero_id),
  sqlc.narg(source_url),
  sqlc.narg(verified_version),
  sqlc.narg(exec_difficulty),
  sqlc.arg(status)
)
returning id;

-- name: UpdateStudioStrategy :exec
update public.strategies
set
  map_id = sqlc.arg(map_id),
  game_mode_id = sqlc.arg(game_mode_id),
  title = sqlc.arg(title),
  description = sqlc.narg(description),
  hero_id = sqlc.narg(hero_id),
  source_url = sqlc.narg(source_url),
  verified_version = sqlc.narg(verified_version),
  exec_difficulty = sqlc.narg(exec_difficulty),
  status = sqlc.arg(status)
where id = sqlc.arg(strategy_id);

-- name: DeleteStudioStrategy :exec
delete from public.strategies
where id = sqlc.arg(strategy_id);

-- name: NextStrategyStepOrder :one
select (coalesce(max(order_index), 0) + 1)::integer
from public.steps
where strategy_id = sqlc.arg(strategy_id);

-- name: CreateStudioStep :exec
insert into public.steps (
  strategy_id, placement_id, round_number, action, target_path, description, order_index
) values (
  sqlc.arg(strategy_id),
  sqlc.narg(placement_id),
  sqlc.arg(round_number),
  sqlc.arg(action),
  sqlc.narg(target_path),
  sqlc.narg(description),
  sqlc.arg(order_index)
);

-- name: UpdateStudioStep :exec
update public.steps
set
  placement_id = sqlc.narg(placement_id),
  round_number = sqlc.arg(round_number),
  action = sqlc.arg(action),
  target_path = sqlc.narg(target_path),
  description = sqlc.narg(description)
where id = sqlc.arg(step_id)
  and strategy_id = sqlc.arg(strategy_id);

-- name: DeleteStudioStep :exec
delete from public.steps
where id = sqlc.arg(step_id)
  and strategy_id = sqlc.arg(strategy_id);

-- name: ListStrategyStepIds :many
select id
from public.steps
where strategy_id = sqlc.arg(strategy_id)
order by order_index asc;

-- name: ReorderStudioSteps :exec
select public.reorder_steps(sqlc.arg(strategy_id), sqlc.arg(step_ids)::bigint[]);

-- name: StrategyHasHeroPlacement :one
select exists (
  select 1
  from public.placements as placement
  join public.towers as tower on tower.id = placement.tower_id
  where placement.strategy_id = sqlc.arg(strategy_id)
    and tower.category = 'Hero'
    and (sqlc.narg(excluded_placement_id)::bigint is null
      or placement.id <> sqlc.narg(excluded_placement_id))
);

-- name: GetStudioPlacement :one
select id, strategy_id, tower_id, pos_x, pos_y, final_path, label, notes
from public.placements
where id = sqlc.arg(placement_id)
  and strategy_id = sqlc.arg(strategy_id);

-- name: CreateStudioPlacement :one
insert into public.placements (strategy_id, tower_id, pos_x, pos_y)
values (sqlc.arg(strategy_id), sqlc.arg(tower_id), sqlc.arg(pos_x), sqlc.arg(pos_y))
returning id, strategy_id, tower_id, pos_x, pos_y, final_path, label, notes;

-- name: UpdateStudioPlacement :one
update public.placements
set
  pos_x = sqlc.arg(pos_x),
  pos_y = sqlc.arg(pos_y),
  final_path = sqlc.narg(final_path),
  label = sqlc.narg(label),
  notes = sqlc.narg(notes)
where id = sqlc.arg(placement_id)
returning id, strategy_id, tower_id, pos_x, pos_y, final_path, label, notes;

-- name: DeleteStudioPlacement :exec
delete from public.placements
where id = sqlc.arg(placement_id);

-- name: ListStudioHeroes :many
select
  hero.id,
  hero.name,
  hero.icon_path,
  num_nonnulls(
    hero.description,
    hero.base_cost,
    hero.attack_style,
    hero.xp_ratio,
    hero.technical_description,
    hero.profile_source_url
  )::integer as completed_fields,
  count(synergy.id)::integer as synergy_count
from public.towers as hero
left join public.tower_synergies as synergy
  on synergy.tower_a_id = hero.id or synergy.tower_b_id = hero.id
where hero.category = 'Hero'
group by hero.id
order by hero.name asc;

-- name: GetStudioHero :one
select
  id, name, icon_path, description, base_cost, attack_style,
  xp_ratio, technical_description, profile_source_url
from public.towers
where id = sqlc.arg(hero_id)
  and category = 'Hero';

-- name: ListStudioNonHeroTowers :many
select id, name, category
from public.towers
where category <> 'Hero'
order by name asc;

-- name: ListStudioHeroSynergies :many
select
  case
    when tower_a_id = sqlc.arg(hero_id) then tower_b_id
    else tower_a_id
  end::bigint as tower_id,
  description
from public.tower_synergies
where tower_a_id = sqlc.arg(hero_id)
   or tower_b_id = sqlc.arg(hero_id)
order by tower_id asc;

-- name: UpdateStudioHeroProfile :exec
select public.update_hero_profile(
  sqlc.arg(hero_id),
  sqlc.narg(description),
  sqlc.narg(base_cost),
  sqlc.narg(attack_style),
  sqlc.narg(xp_ratio)::double precision::numeric,
  sqlc.narg(technical_description),
  sqlc.narg(profile_source_url),
  sqlc.arg(synergy_tower_ids)::bigint[],
  sqlc.arg(synergy_descriptions)::text[]
);

-- name: GetPublicReferences :one
select jsonb_build_object(
  'maps', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', map.id,
      'name', map.name,
      'difficulty', map.difficulty,
      'image_url', map.image_url,
      'nk_image_url', map.nk_image_url
    ) order by map.name)
    from public.maps as map
  ), '[]'::jsonb),
  'modes', coalesce((
    select jsonb_agg(jsonb_build_object('id', mode.id, 'name', mode.name) order by mode.id)
    from public.game_modes as mode
  ), '[]'::jsonb),
  'heroes', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', hero.id,
      'name', hero.name,
      'icon_path', hero.icon_path
    ) order by hero.name)
    from public.towers as hero
    where hero.category = 'Hero'
  ), '[]'::jsonb),
  'strategyIds', coalesce((
    select jsonb_agg(strategy.id order by strategy.id)
    from public.strategies as strategy
    where strategy.status = 'ready'
  ), '[]'::jsonb)
) as references;

-- name: ListPublicVersions :many
select distinct verified_version
from public.strategies
where status = 'ready'
  and verified_version is not null;

-- name: ListPublicStrategySummaries :many
select
  strategy.id,
  strategy.title,
  strategy.description,
  strategy.hero_id,
  strategy.verified_version,
  strategy.exec_difficulty,
  map.id as map_id,
  map.name as map_name,
  map.difficulty as map_difficulty,
  map.image_url as map_image_url,
  map.nk_image_url as map_nk_image_url,
  mode.id as mode_id,
  mode.name as mode_name,
  hero.id as hero_reference_id,
  hero.name as hero_name,
  hero.icon_path as hero_icon_path,
  (coalesce(
    jsonb_agg(jsonb_build_object(
      'id', placement.id,
      'tower_id', placement.tower_id,
      'pos_x', placement.pos_x,
      'pos_y', placement.pos_y
    ) order by placement.id) filter (where placement.id is not null),
    '[]'::jsonb
  ))::json as placements
from public.strategies as strategy
join public.maps as map on map.id = strategy.map_id
join public.game_modes as mode on mode.id = strategy.game_mode_id
left join public.towers as hero
  on hero.id = strategy.hero_id and hero.category = 'Hero'
left join public.placements as placement on placement.strategy_id = strategy.id
where strategy.status = 'ready'
  and (sqlc.narg(map_id)::bigint is null or strategy.map_id = sqlc.narg(map_id))
  and (sqlc.narg(mode_id)::bigint is null or strategy.game_mode_id = sqlc.narg(mode_id))
  and (sqlc.narg(hero_id)::bigint is null or strategy.hero_id = sqlc.narg(hero_id))
  and (sqlc.narg(exec_difficulty)::smallint is null or strategy.exec_difficulty = sqlc.narg(exec_difficulty))
  and (sqlc.narg(map_difficulty)::text is null or map.difficulty = sqlc.narg(map_difficulty))
  and (sqlc.narg(verified_version)::text is null or strategy.verified_version = sqlc.narg(verified_version))
  and (sqlc.narg(cursor)::bigint is null or strategy.id < sqlc.narg(cursor))
group by strategy.id, map.id, mode.id, hero.id
order by strategy.id desc
limit sqlc.arg(page_limit);

-- name: ListPublicHomeMaps :many
select
  map.id,
  map.name,
  map.difficulty,
  map.image_url,
  map.nk_image_url,
  count(strategy.id)::integer as guide_count
from public.maps as map
left join public.strategies as strategy
  on strategy.map_id = map.id and strategy.status = 'ready'
where map.difficulty is not null
group by map.id
order by map.difficulty asc, map.name asc;

-- name: GetPublicStrategyDetail :one
select jsonb_build_object(
  'id', strategy.id,
  'title', strategy.title,
  'description', strategy.description,
  'hero_id', strategy.hero_id,
  'verified_version', strategy.verified_version,
  'exec_difficulty', strategy.exec_difficulty,
  'source_url', strategy.source_url,
  'map', jsonb_build_object(
    'id', map.id,
    'name', map.name,
    'difficulty', map.difficulty,
    'image_url', map.image_url,
    'nk_image_url', map.nk_image_url
  ),
  'mode', jsonb_build_object('id', mode.id, 'name', mode.name),
  'hero', case when hero.id is null then null else jsonb_build_object(
    'id', hero.id,
    'name', hero.name,
    'icon_path', hero.icon_path
  ) end,
  'placements', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', placement.id,
      'tower_id', placement.tower_id,
      'pos_x', placement.pos_x,
      'pos_y', placement.pos_y,
      'final_path', placement.final_path,
      'label', placement.label,
      'tower', jsonb_build_object(
        'id', tower.id,
        'name', tower.name,
        'category', tower.category,
        'icon_path', tower.icon_path
      )
    ) order by placement.id)
    from public.placements as placement
    join public.towers as tower on tower.id = placement.tower_id
    where placement.strategy_id = strategy.id
  ), '[]'::jsonb),
  'steps', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', step.id,
      'placement_id', step.placement_id,
      'round_number', step.round_number,
      'action', step.action,
      'target_path', step.target_path,
      'description', step.description,
      'order_index', step.order_index
    ) order by step.order_index)
    from public.steps as step
    where step.strategy_id = strategy.id
  ), '[]'::jsonb)
) as strategy
from public.strategies as strategy
join public.maps as map on map.id = strategy.map_id
join public.game_modes as mode on mode.id = strategy.game_mode_id
left join public.towers as hero
  on hero.id = strategy.hero_id and hero.category = 'Hero'
where strategy.id = sqlc.arg(strategy_id)
  and strategy.status = 'ready';

-- name: ListPublicHeroes :many
select
  hero.id,
  hero.name,
  hero.icon_path,
  count(strategy.id)::integer as guide_count
from public.towers as hero
left join public.strategies as strategy
  on strategy.hero_id = hero.id and strategy.status = 'ready'
where hero.category = 'Hero'
group by hero.id
order by hero.name asc;

-- name: GetPublicHeroDetail :one
select jsonb_build_object(
  'id', hero.id,
  'name', hero.name,
  'icon_path', hero.icon_path,
  'description', hero.description,
  'base_cost', hero.base_cost,
  'attack_style', hero.attack_style,
  'xp_ratio', hero.xp_ratio,
  'technical_description', hero.technical_description,
  'profile_source_url', hero.profile_source_url,
  'synergies', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', other.id,
      'name', other.name,
      'description', synergy.description
    ) order by other.name)
    from public.tower_synergies as synergy
    join public.towers as other on other.id = case
      when synergy.tower_a_id = hero.id then synergy.tower_b_id
      else synergy.tower_a_id
    end
    where synergy.tower_a_id = hero.id or synergy.tower_b_id = hero.id
  ), '[]'::jsonb),
  'strategies', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', strategy.id,
      'title', strategy.title,
      'description', strategy.description,
      'hero_id', strategy.hero_id,
      'verified_version', strategy.verified_version,
      'exec_difficulty', strategy.exec_difficulty,
      'map', jsonb_build_object(
        'id', map.id,
        'name', map.name,
        'difficulty', map.difficulty,
        'image_url', map.image_url,
        'nk_image_url', map.nk_image_url
      ),
      'mode', jsonb_build_object('id', mode.id, 'name', mode.name),
      'placements', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', placement.id,
          'tower_id', placement.tower_id,
          'pos_x', placement.pos_x,
          'pos_y', placement.pos_y
        ) order by placement.id)
        from public.placements as placement
        where placement.strategy_id = strategy.id
      ), '[]'::jsonb)
    ) order by strategy.id desc)
    from public.strategies as strategy
    join public.maps as map on map.id = strategy.map_id
    join public.game_modes as mode on mode.id = strategy.game_mode_id
    where strategy.hero_id = hero.id
      and strategy.status = 'ready'
  ), '[]'::jsonb)
) as hero
from public.towers as hero
where hero.id = sqlc.arg(hero_id)
  and hero.category = 'Hero';
