-- Ajuste de RLS para garantir leitura e escrita na tabela existente "settings"
alter table if exists public.settings enable row level security;

drop policy if exists settings_select_auth on public.settings;
drop policy if exists settings_insert_auth on public.settings;
drop policy if exists settings_update_auth on public.settings;

create policy settings_select_auth on public.settings
  for select
  using (auth.role() = 'authenticated');

create policy settings_insert_auth on public.settings
  for insert
  with check (auth.role() = 'authenticated');

create policy settings_update_auth on public.settings
  for update
  using (auth.role() = 'authenticated');
