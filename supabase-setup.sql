-- Voer dit eenmalig uit in Supabase > SQL Editor.
create table if not exists public.site_content (
  id bigint primary key,
  content jsonb not null
);
alter table public.site_content enable row level security;

-- Iedereen mag de website-inhoud lezen.
drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content for select to anon, authenticated using (true);

-- Alleen ingelogde beheerders mogen de inhoud wijzigen.
drop policy if exists "Authenticated admins can insert site content" on public.site_content;
create policy "Authenticated admins can insert site content"
on public.site_content for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can update site content" on public.site_content;
create policy "Authenticated admins can update site content"
on public.site_content for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

insert into public.site_content (id, content)
values (1, '{}'::jsonb)
on conflict (id) do nothing;
