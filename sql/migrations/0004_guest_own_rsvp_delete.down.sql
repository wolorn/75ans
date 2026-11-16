-- ============================================================
-- Migration 0004 (down) : retirer l'annulation de réservation par l'invité
-- ============================================================
-- Inverse exact de 0004_guest_own_rsvp_delete.up.sql : seuls les admins
-- peuvent à nouveau supprimer des réponses.
-- ============================================================

drop policy if exists "owner delete guests" on guests;
