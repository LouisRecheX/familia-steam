-- FAMÍLIA STEAM · banco de dados e regras de acesso
-- Cole tudo no Supabase: SQL Editor > New query > Run

create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  name text unique not null,
  role text not null default 'member' check (role in ('admin','member')),
  monthly_budget numeric check (monthly_budget is null or monthly_budget >= 0));

create table public.games(
  id bigint primary key, name text not null,
  total numeric not null check (total > 0),
  parcelas int not null check (parcelas between 1 and 48),
  start_date date, year int, img text,
  created_at timestamptz not null default now());

create table public.participants(
  game_id bigint not null references public.games(id) on delete cascade,
  member text not null, paid int not null default 0 check (paid >= 0),
  primary key (game_id, member));

create table public.wishlist(
  id bigint generated always as identity primary key, name text not null,
  price numeric check (price is null or price >= 0), img text,
  by_name text not null, created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now());

create table public.proposals(
  id bigint generated always as identity primary key, name text not null,
  price numeric not null check (price > 0),
  parcelas int not null default 1 check (parcelas between 1 and 48), img text,
  by_name text not null, created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now());

create table public.votes(
  proposal_id bigint not null references public.proposals(id) on delete cascade,
  member text not null, accept boolean not null,
  primary key (proposal_id, member));

-- funções auxiliares
create function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create function public.my_name() returns text language sql stable security definer set search_path = public as
$$ select name from public.profiles where id = auth.uid() $$;

-- ao criar um usuário (e-mail luiz@familiasteam.app), cria o perfil; o "luiz" vira administrador
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as
$$ begin
  insert into public.profiles(id, name, role)
  values (new.id, initcap(split_part(new.email,'@',1)),
          case when lower(split_part(new.email,'@',1)) = 'luiz' then 'admin' else 'member' end);
  return new; end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- regras de acesso (RLS)
alter table public.profiles     enable row level security;
alter table public.games        enable row level security;
alter table public.participants enable row level security;
alter table public.wishlist     enable row level security;
alter table public.proposals    enable row level security;
alter table public.votes        enable row level security;

create policy "ver" on public.profiles     for select to authenticated using (true);
create policy "ver" on public.games        for select to authenticated using (true);
create policy "ver" on public.participants for select to authenticated using (true);
create policy "ver" on public.wishlist     for select to authenticated using (true);
create policy "ver" on public.proposals    for select to authenticated using (true);
create policy "ver" on public.votes        for select to authenticated using (true);

-- cada um altera só o próprio orçamento (e nada mais no perfil)
create policy "orcamento proprio" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (monthly_budget) on public.profiles to authenticated;

-- só o administrador mexe em jogos, pagamentos e fotos
create policy "admin jogos" on public.games for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin pagamentos" on public.participants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- wishlist e propostas: qualquer membro cria (com o próprio nome); apaga o seu (admin apaga qualquer)
create policy "criar" on public.wishlist for insert to authenticated
  with check (created_by = auth.uid() and by_name = public.my_name());
create policy "apagar" on public.wishlist for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());
create policy "criar" on public.proposals for insert to authenticated
  with check (created_by = auth.uid() and by_name = public.my_name());
create policy "apagar" on public.proposals for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- votos: cada um vota só por si
create policy "votar" on public.votes for insert to authenticated with check (member = public.my_name());
create policy "mudar voto" on public.votes for update to authenticated
  using (member = public.my_name()) with check (member = public.my_name());

revoke all on all tables in schema public from anon;
