-- Correctif : "function crypt(text, text) does not exist"
-- Cause : pgcrypto est installée dans le schéma "extensions" chez Supabase,
-- pas dans "public". La fonction cherchait crypt() dans le mauvais schéma.

-- S'assure que pgcrypto est bien installée (ne fait rien si déjà présente).
create extension if not exists pgcrypto schema extensions;

-- Recrée la fonction en référençant explicitement extensions.crypt(),
-- ce qui fonctionne quel que soit le search_path.
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
  return stored_hash = extensions.crypt(lower(trim(code)), stored_hash);
end;
$$;

grant execute on function check_invite_code(text) to anon;

-- Ré-enregistre le code (même valeur qu'avant si tu ne veux rien changer),
-- en utilisant aussi extensions.crypt()/extensions.gen_salt() cette fois.
-- Remplace 'TON_CODE_ICI' par ton vrai code.
insert into app_secrets (id, invite_code_hash)
values (1, extensions.crypt(lower(trim('TON_CODE_ICI')), extensions.gen_salt('bf')))
on conflict (id) do update set invite_code_hash = excluded.invite_code_hash;
