-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
);

-- Users can update their own profile
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
);

-- Users can insert their own profile
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
);

-- =====================================================
-- STUDIOS POLICIES
-- =====================================================

-- Studio members can view studios they belong to
create policy "studios_select_members"
on public.studios
for select
to authenticated
using (
  exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = studios.id
      and sm.user_id = auth.uid()
  )
);

-- Studio owners can update their studio
create policy "studios_update_owner"
on public.studios
for update
to authenticated
using (
  owner_id = auth.uid()
);

-- Authenticated users can create studios
create policy "studios_insert_authenticated"
on public.studios
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

-- =====================================================
-- STUDIO MEMBERS POLICIES
-- =====================================================

-- Members can view memberships in their studios
create policy "studio_members_select_members"
on public.studio_members
for select
to authenticated
using (
  exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = studio_members.studio_id
      and sm.user_id = auth.uid()
  )
);

-- Studio owners can add members
create policy "studio_members_insert_owner"
on public.studio_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.studios s
    where s.id = studio_id
      and s.owner_id = auth.uid()
  )
);

-- Studio owners can remove members
create policy "studio_members_delete_owner"
on public.studio_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.studios s
    where s.id = studio_members.studio_id
      and s.owner_id = auth.uid()
  )
);

-- =====================================================
-- CLIENTS POLICIES
-- =====================================================

-- Studio members can view clients in their studio
create policy "clients_select_members"
on public.clients
for select
to authenticated
using (
  exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = clients.studio_id
      and sm.user_id = auth.uid()
  )
);

-- Owners and trainers can create clients
create policy "clients_insert_staff"
on public.clients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = clients.studio_id
      and sm.user_id = auth.uid()
      and sm.role in ('owner', 'trainer')
  )
);

-- Owners and trainers can update clients
create policy "clients_update_staff"
on public.clients
for update
to authenticated
using (
  exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = clients.studio_id
      and sm.user_id = auth.uid()
      and sm.role in ('owner', 'trainer')
  )
);

-- Owners can delete clients
create policy "clients_delete_owner"
on public.clients
for delete
to authenticated
using (
  exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = clients.studio_id
      and sm.user_id = auth.uid()
      and sm.role = 'owner'
  )
);