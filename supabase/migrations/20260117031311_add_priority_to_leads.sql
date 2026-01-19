alter table public.leads
add column if not exists priority text not null default 'medium'
check (priority in ('low', 'medium', 'high'));
