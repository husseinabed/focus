alter table public.workflow_runs
  add column if not exists workflow_version_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workflow_runs_workflow_version_id_fkey'
      and conrelid = 'public.workflow_runs'::regclass
  ) then
    alter table public.workflow_runs
      add constraint workflow_runs_workflow_version_id_fkey
      foreign key (workflow_version_id)
      references public.workflow_versions (id)
      on delete cascade;
  end if;
end $$;

create index if not exists workflow_runs_workflow_version_id_idx
  on public.workflow_runs (workflow_version_id);
