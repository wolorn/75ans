-- Sécurisation du code d'invitation : il n'est plus stocké en clair dans
-- config.json (visible publiquement sur GitHub), mais haché en base, dans
-- une table qu'aucune clé publique ne peut lire directement.

create extension if not exists pgcrypto;

create table app_secrets (
  id int primary key default 1,
  invite_code_hash text not null,
  constraint app_secrets_single_row check (id = 1)
);

-- RLS activée SANS AUCUNE policy : personne (même avec la clé anon) ne peut
-- lire, insérer ou modifier cette table directement via l'API Supabase.
alter table app_secrets enable row level security;

-- Fonction serveur : reçoit un code en clair, répond juste true/false.
-- "security definer" lui permet de lire app_secrets malgré la RLS,
-- alors que les visiteurs, eux, ne le peuvent toujours pas.
create or replace function check_invite_code(code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_hash text;
begin
  select invite_code_hash into stored_hash from app_secrets where id = 1;
  if stored_hash is null then
    return false;
  end if;
  return stored_hash = crypt(lower(trim(code)), stored_hash);
end;
$$;

-- Seule cette fonction (pas la table) est exécutable par les visiteurs anonymes.
grant execute on function check_invite_code(text) to anon;

-- Enregistre le code (haché) une première fois. Remplace 'TON_CODE_ICI'
-- par le vrai code, puis exécute cette requête une fois dans le SQL Editor.
-- Pour le changer plus tard, ré-exécute simplement cette même requête avec
-- le nouveau code : elle écrase l'ancien (grâce à "on conflict").
insert into app_secrets (id, invite_code_hash)
values (1, crypt(lower(trim('TON_CODE_ICI')), gen_salt('bf')))
on conflict (id) do update set invite_code_hash = excluded.invite_code_hash;
