-- Heroes become towers with category 'Hero'; the heroes table is dropped.
-- In-game a hero is a special tower (same placement mechanics), so modeling
-- them as towers removes polymorphic placement logic from the editor.
-- Hero-specific rules are enforced in app code: strategies.hero_id must point
-- at a 'Hero' tower, max one hero placement per strategy, and final_path /
-- target_path stay NULL for heroes (they level up instead of crosspathing).
-- strategies is empty at this point, so no data migration is needed.

alter table public.towers drop constraint towers_category_check;
alter table public.towers add constraint towers_category_check
  check (category in ('Primary', 'Military', 'Magic', 'Support', 'Hero'));

insert into public.towers (name, category)
select name, 'Hero' from public.heroes;

alter table public.strategies drop constraint strategies_hero_id_fkey;
alter table public.strategies add constraint strategies_hero_id_fkey
  foreign key (hero_id) references public.towers (id) on delete restrict;

drop table public.heroes;
