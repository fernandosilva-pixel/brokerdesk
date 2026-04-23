-- ============================================================
-- BrokerDesk — Schema Supabase
-- Execute no SQL Editor do Supabase (Database → SQL Editor)
-- ============================================================

-- 1. PROFILES (estende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text not null default 'operator' check (role in ('admin', 'operator')),
  last_seen_notifications_at timestamptz default '2000-01-01 00:00:00+00',
  created_at timestamptz default now()
);

-- Auto-cria profile quando usuário se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. BROKERS
create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  responsavel text not null,
  dominio text not null,
  email text not null,
  telefone text not null,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- 3. TICKETS
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid references public.brokers(id) on delete cascade,
  broker_nome text not null,
  title text not null,
  description text default '',
  status text not null default 'Pendente'
    check (status in ('Pendente', 'Em Andamento', 'Resolvido', 'Fechado', 'Aberto')),
  priority text not null default 'Média'
    check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')),
  assigned_to text default '',
  created_by text not null,
  is_dev boolean default false,
  date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null default 'info'
    check (type in ('info', 'warning', 'error', 'success')),
  target_role text default 'all'
    check (target_role in ('all', 'operator', 'admin')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 5. FUNÇÃO HELPER PARA VERIFICAR ADMIN
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid() limit 1),
    false
  );
$$ language sql security definer stable;

-- 6. HABILITAR RLS
alter table public.profiles enable row level security;
alter table public.brokers enable row level security;
alter table public.tickets enable row level security;
alter table public.notifications enable row level security;

-- 7. POLÍTICAS RLS

-- profiles
drop policy if exists "Authenticated can view profiles" on public.profiles;
create policy "Authenticated can view profiles"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- brokers
drop policy if exists "Authenticated can view brokers" on public.brokers;
create policy "Authenticated can view brokers"
  on public.brokers for select to authenticated using (true);

drop policy if exists "Admins can insert brokers" on public.brokers;
create policy "Admins can insert brokers"
  on public.brokers for insert with check (public.is_admin());

drop policy if exists "Admins can update brokers" on public.brokers;
create policy "Admins can update brokers"
  on public.brokers for update using (public.is_admin());

drop policy if exists "Admins can delete brokers" on public.brokers;
create policy "Admins can delete brokers"
  on public.brokers for delete using (public.is_admin());

-- tickets
drop policy if exists "Authenticated can view tickets" on public.tickets;
create policy "Authenticated can view tickets"
  on public.tickets for select to authenticated using (true);

drop policy if exists "Authenticated can insert tickets" on public.tickets;
create policy "Authenticated can insert tickets"
  on public.tickets for insert to authenticated with check (true);

drop policy if exists "Authenticated can update tickets" on public.tickets;
create policy "Authenticated can update tickets"
  on public.tickets for update to authenticated using (true);

-- notifications
drop policy if exists "Authenticated can view notifications" on public.notifications;
create policy "Authenticated can view notifications"
  on public.notifications for select to authenticated using (true);

drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications"
  on public.notifications for insert with check (public.is_admin());

drop policy if exists "Admins can delete notifications" on public.notifications;
create policy "Admins can delete notifications"
  on public.notifications for delete using (public.is_admin());

-- 8. APP_SETTINGS (configurações globais centralizadas)
create table if not exists public.app_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz default now()
);

-- Seed com a chave do webhook
insert into public.app_settings (key, value)
values ('n8n_webhook_url', '')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Authenticated can read settings" on public.app_settings;
create policy "Authenticated can read settings"
  on public.app_settings for select to authenticated using (true);

drop policy if exists "Admins can update settings" on public.app_settings;
create policy "Admins can update settings"
  on public.app_settings for update using (public.is_admin());

drop policy if exists "Admins can insert settings" on public.app_settings;
create policy "Admins can insert settings"
  on public.app_settings for insert with check (public.is_admin());

-- ============================================================
-- APÓS EXECUTAR:
-- 1. Crie sua conta no app
-- 2. Vá em Table Editor → profiles
-- 3. Encontre seu usuário e mude role para 'admin'
-- ============================================================
