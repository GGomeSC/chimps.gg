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
