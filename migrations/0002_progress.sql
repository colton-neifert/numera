create table if not exists player_progress (
  user_id        text primary key,
  grade          text not null default 'g23',
  xp             integer not null default 0,
  hp             integer not null default 40,
  worlds_cleared text not null default '[]',
  defeated       text not null default '{}',
  collected      text not null default '{}',
  updated_at     timestamptz not null default now()
);
