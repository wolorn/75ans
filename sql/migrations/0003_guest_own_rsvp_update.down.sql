-- ============================================================
-- Migration 0003 (down) : retirer la modification de réponse par l'invité
-- ============================================================
-- Inverse exact de 0003_guest_own_rsvp_update.up.sql :
--  - supprime la policy de mise à jour "propriétaire" ;
--  - restaure la policy d'insertion publique d'origine ;
--  - restaure les droits de mise à jour partagés d'origine ;
--  - supprime la fonction utilitaire.
-- Les réponses déjà modifiées par leur propriétaire ne sont pas
-- annulées (pas d'historique).
-- ============================================================

-- 1. Policy d'insertion : retour à l'état d'origine (insertion publique).
drop policy if exists "owner insert guests" on guests;
create policy "public insert" on guests
  for insert with check (true);

-- 2. Policy de mise à jour propriétaire : supprimée.
drop policy if exists "owner update guests" on guests;

-- 3. Droits de mise à jour : retour à l'état d'origine (table entière).
revoke update (name, count, msg, sleep, days) on guests from authenticated;
grant update on guests to authenticated;
grant update on guests to anon;

-- 4. Fonction utilitaire : supprimée.
drop function if exists get_my_guest_responses();
