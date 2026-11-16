-- ============================================================
-- Migration 0003 (up) : modifier sa propre réponse de présence
-- ============================================================
-- Un invité qui valide son email par code à usage unique obtient une
-- session authentifiée dont le JWT porte son email. Cette migration
-- lui permet de mettre à jour LA ligne guests dont l'email correspond
-- exactement à celui du token, sans avoir le moindre droit sur les
-- autres lignes ni sur la colonne email elle-même.
--
-- Deux ajustements :
--  1. Policy de mise à jour "propriétaire" (en PLUS des policies admin
--     existantes, qui restent inchangées : les policies Postgres
--     permissives s'additionnent en OU).
--  2. Resserrage de l'insertion : une ligne ne peut être créée que par
--     une session authentifiée dont l'email correspond à celui inséré.
--     Le site valide déjà l'email par code AVANT d'insérer, donc le
--     flux existant n'est pas affecté — mais l'API ne permet plus de
--     créer de fausses réponses au nom d'un email inconnu.
--
-- Aucun changement à faire dans le dashboard Supabase pour cette
-- migration.
-- Pour revenir en arrière : exécuter 0003_guest_own_rsvp_update.down.sql
-- ============================================================

-- 1. Mise à jour de sa propre ligne (comparaison insensible à la casse).
drop policy if exists "owner update guests" on guests;
create policy "owner update guests" on guests
  for update to public
  using (
    guests.email is not null
    and lower(guests.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    guests.email is not null
    and lower(guests.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- 2. L'email ne doit pas pouvoir être changé par une mise à jour via
--    l'API (sinon un invité pourrait déplacer "sa" ligne vers un autre
--    email). On restreint la mise à jour aux colonnes éditables.
--    L'admin conserve la full-sélection : seul update est touché.
revoke update on guests from anon, authenticated;
grant update (name, count, msg, sleep, days) on guests to authenticated;

-- 3. Insertion reserrée : email inséré = email de la session vérifiée.
--    (Anciennes lignes sans email : unaffected, elles restent en lecture.)
drop policy if exists "public insert" on guests;
create policy "owner insert guests" on guests
  for insert to authenticated
  with check (
    lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- 4. Fonction utilitaire (optionnelle, pour diagnostic dans le SQL Editor) :
--    retourne les réponses de l'utilisateur connecté, sans exposer la table.
create or replace function get_my_guest_responses()
returns setof guests
language sql
security definer
set search_path = public
stable
as $$
  select g.*
  from guests g
  where g.email is not null
    and lower(g.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by g.created_at desc;
$$;
grant execute on function get_my_guest_responses() to authenticated;
