-- Editorial summaries for public hero profiles. Heroes are towers with the
-- Hero category, so keeping this attribute on towers avoids a 1:1 table.
alter table public.towers add column description text;

alter table public.towers add constraint towers_description_nonblank
  check (description is null or nullif(btrim(description), '') is not null);

update public.towers as tower
set description = hero.description
from (values
  ('Quincy', 'A skilled archer whose arrows ricochet between Bloons and whose abilities deliver bursts of ranged damage.'),
  ('Gwendolin', 'A fire specialist who burns groups of Bloons and empowers nearby towers with heated attacks.'),
  ('Striker Jones', 'An artillery commander who strengthens explosive towers and controls Bloons with concussive attacks.'),
  ('Obyn Greenfoot', 'A guardian of nature who sends spirit wolves through obstacles and supports Druids and other magic towers.'),
  ('Captain Churchill', 'A heavily armored tank commander built for sustained firepower against Bloons and MOAB-class targets.'),
  ('Benjamin', 'A support hacker who generates income and manipulates rounds while boosting nearby towers.'),
  ('Ezili', 'A dark-arts specialist who curses Bloons, supports sacrifices, and becomes especially dangerous against MOAB-class targets.'),
  ('Pat Fusty', 'A powerful close-range hero who stuns and pushes Bloons while rallying nearby towers for extra damage.'),
  ('Adora', 'A long-range priestess who attacks with divine light and can sacrifice towers to accelerate her power.'),
  ('Admiral Brickell', 'A water-only naval commander who deploys mines and boosts nearby water-based towers.'),
  ('Etienne', 'A drone operator who attacks across obstacles and eventually grants Camo detection to every tower.'),
  ('Sauda', 'A fast melee swordmaster who excels against Bloons affected by damage-over-time and control effects.'),
  ('Psi', 'A global-range psychic who destroys Bloons from within and can disable large groups with mental attacks.'),
  ('Geraldo', 'A versatile shopkeeper whose evolving inventory provides towers, buffs, and specialized tools throughout a run.'),
  ('Corvus', 'A spellcasting spirit walker who harvests Mana and adapts to each round through an extensive spellbook.'),
  ('Rosalia', 'A mobile tinkerer who repositions with a jetpack and switches between lasers, grenades, and missiles.')
) as hero(name, description)
where tower.name = hero.name
  and tower.category = 'Hero';
