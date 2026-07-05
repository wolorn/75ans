-- ============================================================
-- Configuration Supabase pour le site "La fête — 10 au 17 juillet 2027"
-- ============================================================
-- Comment utiliser ce fichier :
-- 1. Crée un projet gratuit sur https://supabase.com
-- 2. Ouvre l'onglet "SQL Editor" du projet
-- 3. Colle le contenu de ce fichier et exécute-le
-- 4. Dans "Project Settings > API", récupère l'URL du projet et la clé
--    "anon public", et mets-les dans un fichier "supabase_access.txt"
--    placé à côté de index.html :
--    { "supabase_url": "https://xxxx.supabase.co", "supabase_anon_key": "xxxx", "invite_code": "xxxx" }
--    Le champ "invite_code" est un simple mot de passe partagé en famille
--    (pas une vraie sécurité) pour décourager le spam sur le formulaire.
--
-- Remarque : la page charge ce fichier via fetch(), il faut donc la servir
-- en http(s) (GitHub Pages, un serveur local, etc.) — l'ouvrir directement
-- depuis le disque (file://) ne fonctionnera pas.
-- ============================================================


-- ---------- Table des réponses de présence (RSVP) ----------
create table guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  count int not null default 1,
  msg text,
  sleep boolean default false,
  days int[] not null,
  created_at timestamptz default now()
);
alter table guests enable row level security;
create policy "public read" on guests for select using (true);
create policy "public insert" on guests for insert with check (true);


-- ---------- Table des logements ----------
create table lodgings (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('onplace','nearby')),
  icon text default '🏠',
  title text not null,
  meta text,
  description text not null,
  tag text,
  priority boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table lodgings enable row level security;
create policy "public read lodgings" on lodgings for select using (true);

-- Exemple de données pour démarrer (à adapter ou supprimer) :
insert into lodgings (category, icon, title, meta, description, tag, priority, sort_order) values
('onplace', '⛺', 'Camper sous tente', 'Sur place · Route de la Tuque Haute',
 'Possibilité de planter la tente directement sur place, au milieu de la fête. Amène ton matériel de camping.',
 null, true, 1),
('onplace', '🛌', '7 chambres sur place', 'Sur place · nombre limité',
 '7 chambres disponibles directement sur place. Priorité donnée aux familles et aux personnes qui restent pour la semaine complète. Places limitées — contacte-nous directement pour réserver.',
 'Réservation par contact direct', true, 2),
('nearby', '⛺', 'Camping du Lac', '≈ 10 min à pied · emplacements & mobil-homes',
 'Camping familial avec sanitaires, à distance de marche du lieu de fête. À réserver tôt en juillet.',
 null, false, 1),
('nearby', '🏡', 'Gîte des Tilleuls', '≈ 5 min en voiture · 6 personnes',
 'Gîte entier à louer pour un groupe, cuisine équipée. Idéal pour un groupe d''amis qui veut rester ensemble.',
 null, false, 2),
('nearby', '🛏️', 'Chambres d''hôtes Les Figuiers', '≈ 15 min en voiture · 3 chambres',
 'Chambres d''hôtes calmes avec petit-déjeuner inclus, bon rapport qualité-prix.',
 null, false, 3),
('nearby', '🏨', 'Hôtel du Centre', '≈ 20 min en voiture · option la plus simple',
 'Solution pratique si tu arrives tard ou repars tôt, sans réservation à l''avance nécessaire.',
 null, false, 4);


-- ============================================================
-- Droits d'écriture admin (via Supabase Auth)
-- ============================================================
-- Le rôle Postgres "authenticated" correspond à n'importe quel utilisateur
-- connecté via Supabase Auth. Comme les inscriptions publiques doivent être
-- désactivées (voir plus bas), "authenticated" = l'admin, en pratique.

-- Logements : l'admin peut ajouter, modifier, supprimer.
create policy "admin insert lodgings" on lodgings
  for insert to authenticated with check (true);
create policy "admin update lodgings" on lodgings
  for update to authenticated using (true) with check (true);
create policy "admin delete lodgings" on lodgings
  for delete to authenticated using (true);

-- Présence : tout le monde peut répondre (insert déjà créé plus haut),
-- mais seul l'admin peut corriger ou supprimer une réponse.
create policy "admin update guests" on guests
  for update to authenticated using (true) with check (true);
create policy "admin delete guests" on guests
  for delete to authenticated using (true);


-- ============================================================
-- Créer le compte admin
-- ============================================================
-- 1. Dans le dashboard Supabase, va dans "Authentication > Providers > Email"
--    et désactive "Allow new users to sign up". C'est important : sans ça,
--    n'importe qui pourrait créer un compte et obtenir les droits admin
--    puisque les policies ci-dessus se basent juste sur "authenticated".
-- 2. Va dans "Authentication > Users" et clique sur "Add user" (ou "Invite
--    user") pour créer le compte admin manuellement, avec l'email et le mot
--    de passe de ton choix. Coche "Auto Confirm User" si l'option existe,
--    pour ne pas avoir besoin de valider par email.
-- 3. Utilise cet email et ce mot de passe sur le bouton "Admin" du site.
-- Tu peux créer plusieurs comptes admin de cette façon si besoin.
