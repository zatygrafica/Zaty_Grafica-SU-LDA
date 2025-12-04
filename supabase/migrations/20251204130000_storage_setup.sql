-- Bucket e políticas para armazenamento de arquivos
begin;

-- Cria buckets privados se não existir
insert into storage.buckets (id, name, public)
select 'app-files', 'app-files', false
where not exists (select 1 from storage.buckets where id = 'app-files');

insert into storage.buckets (id, name, public)
select 'profile_photos', 'profile_photos', false
where not exists (select 1 from storage.buckets where id = 'profile_photos');

insert into storage.buckets (id, name, public)
select 'employee_docs', 'employee_docs', false
where not exists (select 1 from storage.buckets where id = 'employee_docs');

-- Políticas de objetos do bucket app-files
drop policy if exists "app-files-select" on storage.objects;
drop policy if exists "app-files-insert" on storage.objects;
drop policy if exists "app-files-update" on storage.objects;
drop policy if exists "app-files-delete" on storage.objects;

create policy "app-files-select"
on storage.objects
for select
using (bucket_id = 'app-files' and auth.role() = 'authenticated');

create policy "app-files-insert"
on storage.objects
for insert
with check (bucket_id = 'app-files' and auth.role() = 'authenticated');

create policy "app-files-update"
on storage.objects
for update
using (bucket_id = 'app-files' and auth.role() = 'authenticated')
with check (bucket_id = 'app-files' and auth.role() = 'authenticated');

create policy "app-files-delete"
on storage.objects
for delete
using (bucket_id = 'app-files' and auth.role() = 'authenticated');

-- Políticas para bucket profile_photos
drop policy if exists "profile_photos-select" on storage.objects;
drop policy if exists "profile_photos-insert" on storage.objects;
drop policy if exists "profile_photos-update" on storage.objects;
drop policy if exists "profile_photos-delete" on storage.objects;

create policy "profile_photos-select"
on storage.objects
for select
using (bucket_id = 'profile_photos' and auth.role() = 'authenticated');

create policy "profile_photos-insert"
on storage.objects
for insert
with check (bucket_id = 'profile_photos' and auth.role() = 'authenticated');

create policy "profile_photos-update"
on storage.objects
for update
using (bucket_id = 'profile_photos' and auth.role() = 'authenticated')
with check (bucket_id = 'profile_photos' and auth.role() = 'authenticated');

create policy "profile_photos-delete"
on storage.objects
for delete
using (bucket_id = 'profile_photos' and auth.role() = 'authenticated');

-- Políticas para bucket employee_docs
drop policy if exists "employee_docs-select" on storage.objects;
drop policy if exists "employee_docs-insert" on storage.objects;
drop policy if exists "employee_docs-update" on storage.objects;
drop policy if exists "employee_docs-delete" on storage.objects;

create policy "employee_docs-select"
on storage.objects
for select
using (bucket_id = 'employee_docs' and auth.role() = 'authenticated');

create policy "employee_docs-insert"
on storage.objects
for insert
with check (bucket_id = 'employee_docs' and auth.role() = 'authenticated');

create policy "employee_docs-update"
on storage.objects
for update
using (bucket_id = 'employee_docs' and auth.role() = 'authenticated')
with check (bucket_id = 'employee_docs' and auth.role() = 'authenticated');

create policy "employee_docs-delete"
on storage.objects
for delete
using (bucket_id = 'employee_docs' and auth.role() = 'authenticated');

-- Tabela de anexos para vincular arquivos a recursos do sistema
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'app-files',
  path text not null,
  resource_type text not null,
  resource_id uuid,
  uploaded_by uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc', now())
);

alter table public.attachments enable row level security;

drop policy if exists attachments_rw on public.attachments;
create policy attachments_rw
on public.attachments
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

commit;
