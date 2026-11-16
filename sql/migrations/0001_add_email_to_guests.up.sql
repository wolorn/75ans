-- ============================================================
-- Migration 0001 (up) : champ email pour les invités
-- ============================================================
-- Ajoute une colonne "email" à la table "guests". L'email servira :
--  - à envoyer un code à usage unique (OTP Supabase Auth) pour valider
--    l'adresse au moment de la réservation ;
--  - plus tard, à permettre à un invité de s'authentifier par email
--    pour mettre à jour sa réponse de présence.
--
-- À exécuter dans le "SQL Editor" de Supabase.
-- Pour revenir en arrière : exécuter 0001_add_email_to_guests.down.sql
-- ============================================================

-- 1. Colonne email (optionnelle : les anciennes réponses n'ont pas d'email).
alter table guests add column email text;

-- 2. Format minimal sans être trop strict (compte emails non standards).
alter table guests
  add constraint guests_email_format
  check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- 3. Index de recherche par email (utile pour la mise à jour RSVP par email,
--    et pour retrouver les doublons).
create index guests_email_lower_idx on guests (lower(email));

-- 4. Confidentialité : ne pas exposer publiquement les emails des invités.
--    La RLS ne sait pas filtrer colonne par colonne : on retire donc le
--    "select" global du rôle anon et on ne lui rend QUE les colonnes
--    affichées sur la page. Les emails restent lisibles par l'admin
--    (rôle authenticated, via session).
revoke select on guests from anon;
grant select (id, name, count, msg, sleep, days, created_at) on guests to anon;
