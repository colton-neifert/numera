alter table player_progress add column if not exists loadout text not null default '{}';
