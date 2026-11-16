-- ============================================================
-- Migration 0002 (up) : séparer les droits admin du rôle "authenticated"
-- ============================================================
-- Pourquoi : la validation d'email par code à usage unique passe par
-- Supabase Auth. Un invité qui valide son code obtient une session
-- "authenticated". Or les policies actuelles accordent admin = tout
-- utilisateur "authenticated" : sans migration, chaque invité vérifié
-- pourrait modifier et supprimer des données.
--
-- La migration crée :
--  - une table "app_admins" listant les emails admin (non lisible via l'API) ;
--  - une fonction "is_admin()" que les policies utilisent à la place du rôle.
--
-- Actions manuelles dans le dashboard Supabase (une seule fois) :
--  1. "Authentication > Providers > Email" : réactiver
--     "Allow new users to sign up" (nécessaire pour que les invités
--     puissent recevoir un code pour un email jamais vu avant ;
--     les droits admin ne reposent PLUS sur "authenticated" donc
--     c'est à nouveau sûr).
--  2. "Authentication > Emails > Templates > Log In / Magic Link" :
--     remplacer le contenu du mail par une version contenant
--     "{{ .Token }}" (le code à 6 chiffres) — c'est ce code que
--     l'invité saisit dans le formulaire.
--  3. Exécuter l'insert d'exemple ci-dessous avec le ou les VRAIS
--     emails admin.
--
-- Pour revenir en arrière : exécuter 0002_admin_rights_separation.down.sql
-- ============================================================

-- 1. Table des admins. RLS activée sans aucune policy : aucune clé
--    publique ne peut la lire ni la modifier via l'API.
create table app_admins (
  email text primary key,
  created_at timestamptz default now()
);
alter table app_admins enable row level security;

-- 2. Liste (hachée inutile ici : cette table n'est pas lisible via l'API).
--    REMPLACE par ton vrai email admin, puis exécute :
insert into app_admins (email) values ('ton-email@exemple.com')
on conflict (email) do nothing;

-- 3. Fonction de test "est-ce que l'utilisateur connecté est admin ?".
--    "security definer" pour lire app_admins malgré la RLS.
--    stable : même email dans toute la requête, inutile de réévaluer.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from app_admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function is_admin() to anon, authenticated;

-- 4. Remplacer les policies basées sur le rôle "authenticated" par des
--    policies basées sur la fonction is_admin(). "to public" = s'applique
--    à tout rôle (anon OU authenticated), la fonction fait le filtrage.
drop policy if exists "admin update guests" on guests;
drop policy if exists "admin delete guests" on guests;
create policy "admin update guests" on guests
  for update to public using (is_admin()) with check (is_admin());
create policy "admin delete guests" on guests
  for delete to public using (is_admin());

drop policy if exists "admin insert lodgings" on lodgings;
drop policy if exists "admin update lodgings" on lodgings;
drop policy if exists "admin delete lodgings" on lodgings;
create policy "admin insert lodgings" on lodgings
  for insert to public with check (is_admin());
create policy "admin update lodgings" on lodgings
  for update to public using (is_admin()) with check (is_admin());
create policy "admin delete lodgings" on lodgings
  for delete to public using (is_admin());

drop policy if exists "admin insert articles" on articles;
drop policy if exists "admin update articles" on articles;
drop policy if exists "admin delete articles" on articles;
create policy "admin insert articles" on articles
  for insert to public with check (is_admin());
create policy "admin update articles" on articles
  for update to public using (is_admin()) with check (is_admin());
create policy "admin delete articles" on articles
  for delete to public using (is_admin());
