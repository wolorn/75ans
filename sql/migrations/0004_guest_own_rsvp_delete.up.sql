-- ============================================================
-- Migration 0004 (up) : annuler sa propre réponse de présence
-- ============================================================
-- Complète la migration 0003 : en plus de la modifier, un invité ayant
-- validé son email par code à usage unique peut SUPPRIMER la ligne
-- guests correspondant à son email (annulation de réservation).
-- Les policies admin existantes restent inchangées.
--
-- Aucun changement à faire dans le dashboard Supabase pour cette
-- migration.
-- Pour revenir en arrière : exécuter 0004_guest_own_rsvp_delete.down.sql
-- ============================================================

drop policy if exists "owner delete guests" on guests;
create policy "owner delete guests" on guests
  for delete to public
  using (
    guests.email is not null
    and lower(guests.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
