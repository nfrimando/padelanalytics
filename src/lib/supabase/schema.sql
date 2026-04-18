-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  timestamp_seconds double precision NOT NULL,
  point_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  player_id integer NOT NULL,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT events_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(player_id)
);
CREATE TABLE public.players (
  player_id integer NOT NULL DEFAULT nextval('players_player_id_seq'::regclass),
  player_name text NOT NULL,
  email text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  nickname text,
  CONSTRAINT players_pkey PRIMARY KEY (player_id)
);
CREATE TABLE public.session_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id integer NOT NULL,
  position integer NOT NULL CHECK ("position" >= 1 AND "position" <= 4),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_players_pkey PRIMARY KEY (id),
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.players(player_id)
);
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  youtube_url text NOT NULL,
  youtube_video_id text NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'live'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (id)
);