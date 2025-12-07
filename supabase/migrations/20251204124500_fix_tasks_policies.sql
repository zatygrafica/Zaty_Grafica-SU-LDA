-- Relação: public.tasks
-- Objetivo: permitir CRUD para usuários autenticados sem depender de owner_org/assigned_to,
-- evitando bloqueios de lembretes/tarefas.

begin;

alter table if exists public.tasks enable row level security;

-- Remover políticas antigas
drop policy if exists tasks_access on public.tasks;
drop policy if exists tasks_read_write on public.tasks;

-- Política simples para qualquer usuário autenticado
create policy tasks_read_write
on public.tasks
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

commit;
