-- ============================================================
-- Migration 0002 (down) : revenir à "authenticated" = admin
-- ============================================================
-- Inverse exact de 0002_admin_rights_separation.up.sql.
-- Remet les policies admin d'origine (rôle "authenticated"), puis
-- supprime la fonction is_admin() et la table app_admins (les emails
-- admin qui y étaient enregistrés sont perdus ; les recréera au besoin).
--
-- Après ce script, réactiver au besoin la désactivation des inscriptions
-- publiques ("Allow new users to sign up") dans le dashboard Supabase :
-- "authenticated" redevient équivalent à admin (voir
-- supabase_initial_setup.sql).
-- ============================================================

-- 1. Supprimer les policies is_admin() et recréer les policies d'origine.
drop policy if exists "admin update guests" on guests;
drop policy if exists "admin delete guests" on guests;
create policy "admin update guests" on guests
  for update to authenticated using (true) with check (true);
create policy "admin delete guests" on guests
  for delete to authenticated using (true);

drop policy if exists "admin insert lodgings" on lodgings;
drop policy if exists "admin update lodgings" on lodgings;
drop policy if exists "admin delete lodgings" on lodgings;
create policy "admin insert lodgings" on lodgings
  for insert to authenticated with check (true);
create policy "admin update lodgings" on lodgings
  for update to authenticated using (true) with check (true);
create policy "admin delete lodgings" on lodgings
  for delete to authenticated using (true);

drop policy if exists "admin insert articles" on articles;
drop policy if exists "admin update articles" on articles;
drop policy if exists "admin delete articles" on articles;
create policy "admin insert articles" on articles
  for insert to authenticated with check (true);
create policy "admin update articles" on articles
  for update to authenticated using (true) with check (true);
create policy "admin delete articles" on articles
  for delete to authenticated using (true);

-- 2. Supprimer la fonction et la table.
drop function if exists is_admin();
drop table if exists app_admins;
