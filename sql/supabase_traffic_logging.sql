-- Table de "traffic logging" : sert uniquement à générer de l'activité
-- régulière sur le projet Supabase gratuit, pour éviter sa mise en pause
-- automatique pour inactivité. Le contenu n'a pas de valeur analytique.

create table traffic_logging (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  client_id text not null
);

alter table traffic_logging enable row level security;

-- Écriture ouverte à tous (nécessaire : c'est un visiteur anonyme qui insère
-- la ligne au chargement de la page). Pas de policy de lecture : la table
-- n'a pas besoin d'être consultable depuis le site.
create policy "public insert" on traffic_logging
  for insert
  with check (true);
