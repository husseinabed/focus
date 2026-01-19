-- ============================================================
-- FIX: infinite recursion in workspace_members RLS
-- ============================================================

alter table public.workspace_members enable row level security;

-- Drop ALL existing policies on public.workspace_members
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_members'
  loop
    execute format('drop policy if exists %I on public.workspace_members', p.policyname);
  end loop;
end $$;

-- Allow each user to read ONLY their own memberships
create policy "read my memberships"
on public.workspace_members
for select
using (user_id = auth.uid());

-- IMPORTANT:
-- Do NOT create "manage members" policies that query workspace_members again,
-- because that triggers recursion. Manage via RPC (SECURITY DEFINER).


-- Helper: role check (bypasses RLS safely)
create or replace function public.is_workspace_role_sd(wid uuid, roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.workspace_members wm
    where wm.workspace_id = wid
      and wm.user_id = auth.uid()
      and wm.role = any(roles)
  );
$$;

-- Add/Upsert member
create or replace function public.workspace_add_member(wid uuid, target_user uuid, target_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_workspace_role_sd(wid, array['owner','admin']) then
    raise exception 'not allowed';
  end if;

  if target_role not in ('owner','admin','agent','viewer') then
    raise exception 'invalid role';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (wid, target_user, target_role)
  on conflict (workspace_id, user_id)
  do update set role = excluded.role;
end;
$$;

-- Update member role
create or replace function public.workspace_update_member_role(wid uuid, target_user uuid, target_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_workspace_role_sd(wid, array['owner','admin']) then
    raise exception 'not allowed';
  end if;

  if target_role not in ('owner','admin','agent','viewer') then
    raise exception 'invalid role';
  end if;

  update public.workspace_members
  set role = target_role
  where workspace_id = wid
    and user_id = target_user;
end;
$$;

-- Remove member
create or replace function public.workspace_remove_member(wid uuid, target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_workspace_role_sd(wid, array['owner','admin']) then
    raise exception 'not allowed';
  end if;

  delete from public.workspace_members
  where workspace_id = wid
    and user_id = target_user;
end;
$$;



grant execute on function public.is_workspace_role_sd(uuid, text[]) to authenticated;
grant execute on function public.workspace_add_member(uuid, uuid, text) to authenticated;
grant execute on function public.workspace_update_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.workspace_remove_member(uuid, uuid) to authenticated;
