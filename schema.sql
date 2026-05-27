-- StreamForge Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'client' check (role in ('admin', 'client')),
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  email text,
  discord text,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  client_since date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Platform links table
create table public.platform_links (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null check (platform in ('twitch', 'youtube', 'tiktok', 'instagram', 'twitter', 'other')),
  url text not null,
  followers_count bigint,
  created_at timestamptz not null default now()
);

-- Events table
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text not null default 'other' check (type in ('stream', 'video', 'collab', 'meeting', 'other')),
  scheduled_at timestamptz not null,
  duration_minutes integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Candidates table
create table public.candidates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  platform text not null check (platform in ('twitch', 'youtube', 'tiktok', 'instagram', 'twitter', 'other')),
  audience_size bigint,
  notes text,
  negotiation_status text not null default 'pending' check (negotiation_status in ('pending', 'in_progress', 'completed', 'rejected')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin notes table
create table public.admin_notes (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger events_updated_at before update on public.events
  for each row execute function public.handle_updated_at();

create trigger candidates_updated_at before update on public.candidates
  for each row execute function public.handle_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.platform_links enable row level security;
alter table public.events enable row level security;
alter table public.candidates enable row level security;
alter table public.admin_notes enable row level security;

-- Security definer function avoids infinite recursion when policies on
-- profiles would otherwise re-evaluate themselves.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select role = 'admin' from public.profiles where id = auth.uid();
$$;

-- Profiles RLS
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Clients can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

create policy "Clients can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Platform links RLS
create policy "Admins can manage all platform links"
  on public.platform_links for all
  using (public.is_admin());

create policy "Clients can manage own platform links"
  on public.platform_links for all
  using (auth.uid() = profile_id);

-- Events RLS
create policy "Admins can manage all events"
  on public.events for all
  using (public.is_admin());

create policy "Clients can manage own events"
  on public.events for all
  using (auth.uid() = profile_id);

-- Candidates RLS (admin only)
create policy "Admins can manage candidates"
  on public.candidates for all
  using (public.is_admin());

-- Admin notes RLS (admin only)
create policy "Admins can manage admin notes"
  on public.admin_notes for all
  using (public.is_admin());
