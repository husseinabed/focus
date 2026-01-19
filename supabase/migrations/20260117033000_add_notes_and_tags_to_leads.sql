alter table public.leads
add column if not exists notes text,
add column if not exists tags text[] default '{}';
