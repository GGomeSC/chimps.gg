-- Public strategy discovery always reads ready content newest-first.
-- A ready strategy must carry explicit game-version provenance, while
-- exec_difficulty remains nullable so curators can honestly mark it unrated.
alter table public.strategies
  add constraint strategies_ready_verified_version_check
  check (
    status <> 'ready'
    or nullif(btrim(verified_version), '') is not null
  );

create index strategies_ready_discovery_idx
  on public.strategies (id desc)
  include (map_id, game_mode_id, hero_id, exec_difficulty, verified_version)
  where status = 'ready';
