-- ============================================================
-- Migration 0001 (down) : retirer le champ email des invités
-- ============================================================
-- Inverse exact de 0001_add_email_to_guests.up.sql.
-- Attention : la colonne "email" et son contenu sont SUPPRIMÉS
-- définitivement.
-- ============================================================

-- 1. Restaurer la lecture publique complète de la table (état initial).
revoke select (id, name, count, msg, sleep, days, created_at) on guests from anon;
grant select on guests to anon;

-- 2. Supprimer l'index et la contrainte de format.
drop index if exists guests_email_lower_idx;
alter table guests drop constraint if exists guests_email_format;

-- 3. Supprimer la colonne.
alter table guests drop column if exists email;
