alter table public.towers add column icon_path text;

update public.towers
set icon_path = case name
  when 'Admiral Brickell' then 'admiral-brickell.webp'
  when 'Adora' then 'adora.webp'
  when 'Alchemist' then 'alchemist.webp'
  when 'Banana Farm' then 'banana-farm.webp'
  when 'Benjamin' then 'benjamin.webp'
  when 'Bomb Shooter' then 'bomb-shooter.webp'
  when 'Boomerang Monkey' then 'boomerang-monkey.webp'
  when 'Captain Churchill' then 'captain-churchill.webp'
  when 'Corvus' then 'corvus.webp'
  when 'Dart Monkey' then 'dart-monkey.webp'
  when 'Dartling Gunner' then 'dartling-gunner.webp'
  when 'Desperado' then 'desperado.webp'
  when 'Druid' then 'druid.webp'
  when 'Engineer Monkey' then 'engineer-monkey.webp'
  when 'Etienne' then 'etienne.webp'
  when 'Ezili' then 'ezili.webp'
  when 'Geraldo' then 'geraldo.webp'
  when 'Glue Gunner' then 'glue-gunner.webp'
  when 'Gwendolin' then 'gwendolin.webp'
  when 'Heli Pilot' then 'heli-pilot.webp'
  when 'Ice Monkey' then 'ice-monkey.webp'
  when 'Mermonkey' then 'mermonkey.webp'
  when 'Monkey Ace' then 'monkey-ace.webp'
  when 'Monkey Buccaneer' then 'monkey-buccaneer.webp'
  when 'Monkey Sub' then 'monkey-sub.webp'
  when 'Monkey Village' then 'monkey-village.webp'
  when 'Mortar Monkey' then 'mortar-monkey.webp'
  when 'Ninja Monkey' then 'ninja-monkey.webp'
  when 'Obyn Greenfoot' then 'obyn-greenfoot.webp'
  when 'Pat Fusty' then 'pat-fusty.webp'
  when 'Psi' then 'psi.webp'
  when 'Quincy' then 'quincy.webp'
  when 'Rosalia' then 'rosalia.webp'
  when 'Sauda' then 'sauda.webp'
  when 'Sniper Monkey' then 'sniper-monkey.webp'
  when 'Spike Factory' then 'spike-factory.webp'
  when 'Striker Jones' then 'striker-jones.webp'
  when 'Super Monkey' then 'super-monkey.webp'
  when 'Tack Shooter' then 'tack-shooter.webp'
  when 'Wizard Monkey' then 'wizard-monkey.webp'
end;

alter table public.towers alter column icon_path set not null;
alter table public.towers add constraint towers_icon_path_check
  check (icon_path ~ '^[a-z0-9][a-z0-9-]*\.(webp|png)$');
