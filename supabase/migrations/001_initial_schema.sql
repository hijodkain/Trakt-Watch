-- Trak Watch Database Schema
-- Initial migration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  locale TEXT DEFAULT 'es' CHECK (locale IN ('es', 'en')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('watchlist', 'watched', 'favorites', 'custom')) DEFAULT 'custom',
  is_public BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- List items table
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  tmdb_id INT NOT NULL,
  imdb_id TEXT,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')),
  status TEXT CHECK (status IN ('to_watch', 'watching', 'watched', 'dropped')) DEFAULT 'to_watch',
  rating INT CHECK (rating BETWEEN 1 AND 10),
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  watched_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  UNIQUE(list_id, tmdb_id, media_type)
);

-- TMDB cache table
CREATE TABLE tmdb_cache (
  id BIGINT PRIMARY KEY,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')),
  data_jsonb JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Stremio tokens table
CREATE TABLE stremio_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_name TEXT,
  last_sync TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync logs table
CREATE TABLE sync_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT CHECK (source IN ('app', 'stremio')),
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_type ON lists(type);
CREATE INDEX idx_lists_is_public ON lists(is_public) WHERE is_public = true;
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_list_items_tmdb_id ON list_items(tmdb_id);
CREATE INDEX idx_list_items_media_type ON list_items(media_type);
CREATE INDEX idx_list_items_status ON list_items(status);
CREATE INDEX idx_tmdb_cache_expires_at ON tmdb_cache(expires_at);
CREATE INDEX idx_stremio_tokens_user_id ON stremio_tokens(user_id);
CREATE INDEX idx_stremio_tokens_token_hash ON stremio_tokens(token_hash);
CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stremio_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);

-- Lists policies
CREATE POLICY "Users can manage own lists" ON lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public lists are viewable" ON lists FOR SELECT USING (is_public = true);

-- List items policies
CREATE POLICY "Users can manage own list items" ON list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );
CREATE POLICY "Public list items are viewable" ON list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.is_public = true
    )
  );

-- Stremio tokens policies
CREATE POLICY "Users can manage own stremio tokens" ON stremio_tokens FOR ALL USING (auth.uid() = user_id);

-- Sync logs policies
CREATE POLICY "Users can view own sync logs" ON sync_logs FOR SELECT USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url',
    'es'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create default lists for new users
CREATE OR REPLACE FUNCTION public.create_default_lists()
RETURNS TRIGGER AS $$
DECLARE
  watchlist_id UUID;
  watched_id UUID;
  favorites_id UUID;
BEGIN
  INSERT INTO public.lists (user_id, name, description, type, is_public, sort_order)
  VALUES
    (NEW.id, 'Por ver', 'Películas y series que quiero ver', 'watchlist', false, 1),
    (NEW.id, 'Vistas', 'Películas y series que ya he visto', 'watched', false, 2),
    (NEW.id, 'Favoritas', 'Mis películas y series favoritas', 'favorites', false, 3)
  RETURNING id INTO watchlist_id, watched_id, favorites_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_lists();