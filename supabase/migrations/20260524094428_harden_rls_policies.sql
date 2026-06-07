-- =====================================================
-- FitStudio Pro - Harden RLS Policies
-- Fixes self-referencing policies and adds wider MVP coverage
-- =====================================================

-- =====================================================
-- RLS HELPER FUNCTIONS
-- These functions avoid recursive RLS policies.
-- They run as security definer and return only booleans.
-- =====================================================

create or replace function public.is_studio_member(
  p_studio_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = p_studio_id
      and sm.user_id = p_user_id
  );
$$;

create or replace function public.is_studio_staff(
  p_studio_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = p_studio_id
      and sm.user_id = p_user_id
      and sm.role in ('owner', 'trainer')
  );
$$;

create or replace function public.is_studio_owner(
  p_studio_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.studio_members sm
    where sm.studio_id = p_studio_id
      and sm.user_id = p_user_id
      and sm.role = 'owner'
  );
$$;

create or replace function public.shares_studio_with_user(
  p_profile_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_profile_id = p_user_id
    or exists (
      select 1
      from public.studio_members current_user_member
      join public.studio_members target_user_member
        on target_user_member.studio_id = current_user_member.studio_id
      where current_user_member.user_id = p_user_id
        and target_user_member.user_id = p_profile_id
    );
$$;

create or replace function public.is_client_user(
  p_client_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and c.user_id = p_user_id
  );
$$;

create or replace function public.can_access_client(
  p_client_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and (
        c.user_id = p_user_id
        or public.is_studio_member(c.studio_id, p_user_id)
      )
  );
$$;

create or replace function public.can_manage_client(
  p_client_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and public.is_studio_staff(c.studio_id, p_user_id)
  );
$$;

create or replace function public.can_own_client(
  p_client_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and public.is_studio_owner(c.studio_id, p_user_id)
  );
$$;

create or replace function public.can_access_workout_plan(
  p_workout_plan_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_plans wp
    where wp.id = p_workout_plan_id
      and (
        public.is_studio_member(wp.studio_id, p_user_id)
        or public.can_access_client(wp.client_id, p_user_id)
      )
  );
$$;

create or replace function public.can_manage_workout_plan(
  p_workout_plan_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_plans wp
    where wp.id = p_workout_plan_id
      and public.is_studio_staff(wp.studio_id, p_user_id)
  );
$$;

create or replace function public.can_access_workout_day(
  p_workout_day_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_days wd
    where wd.id = p_workout_day_id
      and public.can_access_workout_plan(wd.workout_plan_id, p_user_id)
  );
$$;

create or replace function public.can_manage_workout_day(
  p_workout_day_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_days wd
    where wd.id = p_workout_day_id
      and public.can_manage_workout_plan(wd.workout_plan_id, p_user_id)
  );
$$;

create or replace function public.can_access_workout_item(
  p_workout_item_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_items wi
    where wi.id = p_workout_item_id
      and public.can_access_workout_day(wi.workout_day_id, p_user_id)
  );
$$;

create or replace function public.can_manage_workout_item(
  p_workout_item_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_items wi
    where wi.id = p_workout_item_id
      and public.can_manage_workout_day(wi.workout_day_id, p_user_id)
  );
$$;

create or replace function public.workout_day_belongs_to_client(
  p_client_id uuid,
  p_workout_day_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_days wd
    join public.workout_plans wp
      on wp.id = wd.workout_plan_id
    where wd.id = p_workout_day_id
      and wp.client_id = p_client_id
  );
$$;

-- Restrict direct RPC execution to authenticated/service users.
revoke all on function public.is_studio_member(uuid, uuid) from public;
revoke all on function public.is_studio_staff(uuid, uuid) from public;
revoke all on function public.is_studio_owner(uuid, uuid) from public;
revoke all on function public.shares_studio_with_user(uuid, uuid) from public;
revoke all on function public.is_client_user(uuid, uuid) from public;
revoke all on function public.can_access_client(uuid, uuid) from public;
revoke all on function public.can_manage_client(uuid, uuid) from public;
revoke all on function public.can_own_client(uuid, uuid) from public;
revoke all on function public.can_access_workout_plan(uuid, uuid) from public;
revoke all on function public.can_manage_workout_plan(uuid, uuid) from public;
revoke all on function public.can_access_workout_day(uuid, uuid) from public;
revoke all on function public.can_manage_workout_day(uuid, uuid) from public;
revoke all on function public.can_access_workout_item(uuid, uuid) from public;
revoke all on function public.can_manage_workout_item(uuid, uuid) from public;
revoke all on function public.workout_day_belongs_to_client(uuid, uuid) from public;

grant execute on function public.is_studio_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_studio_staff(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_studio_owner(uuid, uuid) to authenticated, service_role;
grant execute on function public.shares_studio_with_user(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_client_user(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_access_client(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_manage_client(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_own_client(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_access_workout_plan(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_manage_workout_plan(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_access_workout_day(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_manage_workout_day(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_access_workout_item(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_manage_workout_item(uuid, uuid) to authenticated, service_role;
grant execute on function public.workout_day_belongs_to_client(uuid, uuid) to authenticated, service_role;

-- =====================================================
-- DROP OLD / DUPLICATE POLICIES
-- =====================================================

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_select_visible" on public.profiles;

drop policy if exists "studios_select_members" on public.studios;
drop policy if exists "studios_update_owner" on public.studios;
drop policy if exists "studios_insert_authenticated" on public.studios;
drop policy if exists "studios_delete_owner" on public.studios;

drop policy if exists "studio_members_select_members" on public.studio_members;
drop policy if exists "studio_members_insert_owner" on public.studio_members;
drop policy if exists "studio_members_update_owner" on public.studio_members;
drop policy if exists "studio_members_delete_owner" on public.studio_members;

drop policy if exists "clients_select_members" on public.clients;
drop policy if exists "clients_select_access" on public.clients;
drop policy if exists "clients_insert_staff" on public.clients;
drop policy if exists "clients_update_staff" on public.clients;
drop policy if exists "clients_delete_owner" on public.clients;

drop policy if exists "exercises_select_authenticated" on public.exercises;

drop policy if exists "workout_plans_select_access" on public.workout_plans;
drop policy if exists "workout_plans_insert_staff" on public.workout_plans;
drop policy if exists "workout_plans_update_staff" on public.workout_plans;
drop policy if exists "workout_plans_delete_staff" on public.workout_plans;

drop policy if exists "workout_days_select_access" on public.workout_days;
drop policy if exists "workout_days_insert_staff" on public.workout_days;
drop policy if exists "workout_days_update_staff" on public.workout_days;
drop policy if exists "workout_days_delete_staff" on public.workout_days;

drop policy if exists "workout_items_select_access" on public.workout_items;
drop policy if exists "workout_items_insert_staff" on public.workout_items;
drop policy if exists "workout_items_update_staff" on public.workout_items;
drop policy if exists "workout_items_delete_staff" on public.workout_items;

drop policy if exists "workout_logs_select_access" on public.workout_logs;
drop policy if exists "workout_logs_insert_allowed" on public.workout_logs;
drop policy if exists "workout_logs_update_allowed" on public.workout_logs;
drop policy if exists "workout_logs_delete_allowed" on public.workout_logs;

drop policy if exists "check_ins_select_access" on public.check_ins;
drop policy if exists "check_ins_insert_allowed" on public.check_ins;
drop policy if exists "check_ins_update_allowed" on public.check_ins;
drop policy if exists "check_ins_delete_allowed" on public.check_ins;

drop policy if exists "measurements_select_access" on public.measurements;
drop policy if exists "measurements_insert_allowed" on public.measurements;
drop policy if exists "measurements_update_allowed" on public.measurements;
drop policy if exists "measurements_delete_allowed" on public.measurements;

drop policy if exists "trainer_availability_select_members" on public.trainer_availability;
drop policy if exists "trainer_availability_insert_owner_or_self" on public.trainer_availability;
drop policy if exists "trainer_availability_update_owner_or_self" on public.trainer_availability;
drop policy if exists "trainer_availability_delete_owner_or_self" on public.trainer_availability;

drop policy if exists "sessions_select_access" on public.sessions;
drop policy if exists "sessions_insert_staff" on public.sessions;
drop policy if exists "sessions_update_staff" on public.sessions;
drop policy if exists "sessions_delete_owner" on public.sessions;

drop policy if exists "subscription_plans_select_members" on public.subscription_plans;
drop policy if exists "subscription_plans_insert_owner" on public.subscription_plans;
drop policy if exists "subscription_plans_update_owner" on public.subscription_plans;
drop policy if exists "subscription_plans_delete_owner" on public.subscription_plans;

drop policy if exists "client_subscriptions_select_access" on public.client_subscriptions;
drop policy if exists "client_subscriptions_insert_staff" on public.client_subscriptions;
drop policy if exists "client_subscriptions_update_staff" on public.client_subscriptions;
drop policy if exists "client_subscriptions_delete_owner" on public.client_subscriptions;

drop policy if exists "payments_select_access" on public.payments;
drop policy if exists "payments_insert_owner" on public.payments;
drop policy if exists "payments_update_owner" on public.payments;
drop policy if exists "payments_delete_owner" on public.payments;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;

drop policy if exists "reminder_jobs_select_own" on public.reminder_jobs;

drop policy if exists "ai_summaries_select_access" on public.ai_summaries;
drop policy if exists "ai_summaries_insert_staff" on public.ai_summaries;
drop policy if exists "ai_summaries_update_staff" on public.ai_summaries;
drop policy if exists "ai_summaries_delete_staff" on public.ai_summaries;

drop policy if exists "audit_logs_select_owner_or_actor" on public.audit_logs;

-- =====================================================
-- PROFILES
-- =====================================================

create policy "profiles_select_visible"
on public.profiles
for select
to authenticated
using (
  public.shares_studio_with_user(profiles.id, auth.uid())
);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and global_role = 'user'
);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
  and global_role = 'user'
);

-- =====================================================
-- STUDIOS
-- =====================================================

create policy "studios_select_members"
on public.studios
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_studio_member(studios.id, auth.uid())
);

create policy "studios_insert_authenticated"
on public.studios
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

create policy "studios_update_owner"
on public.studios
for update
to authenticated
using (
  owner_id = auth.uid()
  or public.is_studio_owner(studios.id, auth.uid())
)
with check (
  owner_id = auth.uid()
);

create policy "studios_delete_owner"
on public.studios
for delete
to authenticated
using (
  owner_id = auth.uid()
  or public.is_studio_owner(studios.id, auth.uid())
);

-- =====================================================
-- STUDIO MEMBERS
-- =====================================================

create policy "studio_members_select_members"
on public.studio_members
for select
to authenticated
using (
  public.is_studio_member(studio_members.studio_id, auth.uid())
);

create policy "studio_members_insert_owner"
on public.studio_members
for insert
to authenticated
with check (
  public.is_studio_owner(studio_id, auth.uid())
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.studios s
      where s.id = studio_id
        and s.owner_id = auth.uid()
    )
  )
);

create policy "studio_members_update_owner"
on public.studio_members
for update
to authenticated
using (
  public.is_studio_owner(studio_members.studio_id, auth.uid())
)
with check (
  public.is_studio_owner(studio_id, auth.uid())
);

create policy "studio_members_delete_owner"
on public.studio_members
for delete
to authenticated
using (
  public.is_studio_owner(studio_members.studio_id, auth.uid())
);

-- =====================================================
-- CLIENTS
-- =====================================================

create policy "clients_select_access"
on public.clients
for select
to authenticated
using (
  clients.user_id = auth.uid()
  or public.is_studio_member(clients.studio_id, auth.uid())
);

create policy "clients_insert_staff"
on public.clients
for insert
to authenticated
with check (
  public.is_studio_staff(studio_id, auth.uid())
);

create policy "clients_update_staff"
on public.clients
for update
to authenticated
using (
  public.is_studio_staff(clients.studio_id, auth.uid())
)
with check (
  public.is_studio_staff(studio_id, auth.uid())
);

create policy "clients_delete_owner"
on public.clients
for delete
to authenticated
using (
  public.is_studio_owner(clients.studio_id, auth.uid())
);

-- =====================================================
-- EXERCISES
-- Global exercise library.
-- Direct authenticated users can read.
-- Writes should go through backend service role.
-- =====================================================

create policy "exercises_select_authenticated"
on public.exercises
for select
to authenticated
using (true);

-- =====================================================
-- WORKOUT PLANS
-- =====================================================

create policy "workout_plans_select_access"
on public.workout_plans
for select
to authenticated
using (
  public.can_access_workout_plan(workout_plans.id, auth.uid())
);

create policy "workout_plans_insert_staff"
on public.workout_plans
for insert
to authenticated
with check (
  public.is_studio_staff(studio_id, auth.uid())
  and public.can_access_client(client_id, auth.uid())
);

create policy "workout_plans_update_staff"
on public.workout_plans
for update
to authenticated
using (
  public.is_studio_staff(workout_plans.studio_id, auth.uid())
)
with check (
  public.is_studio_staff(studio_id, auth.uid())
);

create policy "workout_plans_delete_staff"
on public.workout_plans
for delete
to authenticated
using (
  public.is_studio_staff(workout_plans.studio_id, auth.uid())
);

-- =====================================================
-- WORKOUT DAYS
-- =====================================================

create policy "workout_days_select_access"
on public.workout_days
for select
to authenticated
using (
  public.can_access_workout_day(workout_days.id, auth.uid())
);

create policy "workout_days_insert_staff"
on public.workout_days
for insert
to authenticated
with check (
  public.can_manage_workout_plan(workout_plan_id, auth.uid())
);

create policy "workout_days_update_staff"
on public.workout_days
for update
to authenticated
using (
  public.can_manage_workout_day(workout_days.id, auth.uid())
)
with check (
  public.can_manage_workout_plan(workout_plan_id, auth.uid())
);

create policy "workout_days_delete_staff"
on public.workout_days
for delete
to authenticated
using (
  public.can_manage_workout_day(workout_days.id, auth.uid())
);

-- =====================================================
-- WORKOUT ITEMS
-- =====================================================

create policy "workout_items_select_access"
on public.workout_items
for select
to authenticated
using (
  public.can_access_workout_item(workout_items.id, auth.uid())
);

create policy "workout_items_insert_staff"
on public.workout_items
for insert
to authenticated
with check (
  public.can_manage_workout_day(workout_day_id, auth.uid())
);

create policy "workout_items_update_staff"
on public.workout_items
for update
to authenticated
using (
  public.can_manage_workout_item(workout_items.id, auth.uid())
)
with check (
  public.can_manage_workout_day(workout_day_id, auth.uid())
);

create policy "workout_items_delete_staff"
on public.workout_items
for delete
to authenticated
using (
  public.can_manage_workout_item(workout_items.id, auth.uid())
);

-- =====================================================
-- WORKOUT LOGS
-- =====================================================

create policy "workout_logs_select_access"
on public.workout_logs
for select
to authenticated
using (
  public.can_access_client(workout_logs.client_id, auth.uid())
);

create policy "workout_logs_insert_allowed"
on public.workout_logs
for insert
to authenticated
with check (
  (
    public.is_client_user(client_id, auth.uid())
    or public.can_manage_client(client_id, auth.uid())
  )
  and public.workout_day_belongs_to_client(client_id, workout_day_id)
);

create policy "workout_logs_update_allowed"
on public.workout_logs
for update
to authenticated
using (
  public.is_client_user(workout_logs.client_id, auth.uid())
  or public.can_manage_client(workout_logs.client_id, auth.uid())
)
with check (
  (
    public.is_client_user(client_id, auth.uid())
    or public.can_manage_client(client_id, auth.uid())
  )
  and public.workout_day_belongs_to_client(client_id, workout_day_id)
);

create policy "workout_logs_delete_allowed"
on public.workout_logs
for delete
to authenticated
using (
  public.is_client_user(workout_logs.client_id, auth.uid())
  or public.can_manage_client(workout_logs.client_id, auth.uid())
);

-- =====================================================
-- CHECK INS
-- =====================================================

create policy "check_ins_select_access"
on public.check_ins
for select
to authenticated
using (
  public.can_access_client(check_ins.client_id, auth.uid())
);

create policy "check_ins_insert_allowed"
on public.check_ins
for insert
to authenticated
with check (
  public.is_client_user(client_id, auth.uid())
  or public.can_manage_client(client_id, auth.uid())
);

create policy "check_ins_update_allowed"
on public.check_ins
for update
to authenticated
using (
  public.is_client_user(check_ins.client_id, auth.uid())
  or public.can_manage_client(check_ins.client_id, auth.uid())
)
with check (
  public.is_client_user(client_id, auth.uid())
  or public.can_manage_client(client_id, auth.uid())
);

create policy "check_ins_delete_allowed"
on public.check_ins
for delete
to authenticated
using (
  public.is_client_user(check_ins.client_id, auth.uid())
  or public.can_manage_client(check_ins.client_id, auth.uid())
);

-- =====================================================
-- MEASUREMENTS
-- =====================================================

create policy "measurements_select_access"
on public.measurements
for select
to authenticated
using (
  public.can_access_client(measurements.client_id, auth.uid())
);

create policy "measurements_insert_allowed"
on public.measurements
for insert
to authenticated
with check (
  public.is_client_user(client_id, auth.uid())
  or public.can_manage_client(client_id, auth.uid())
);

create policy "measurements_update_allowed"
on public.measurements
for update
to authenticated
using (
  public.is_client_user(measurements.client_id, auth.uid())
  or public.can_manage_client(measurements.client_id, auth.uid())
)
with check (
  public.is_client_user(client_id, auth.uid())
  or public.can_manage_client(client_id, auth.uid())
);

create policy "measurements_delete_allowed"
on public.measurements
for delete
to authenticated
using (
  public.is_client_user(measurements.client_id, auth.uid())
  or public.can_manage_client(measurements.client_id, auth.uid())
);

-- =====================================================
-- TRAINER AVAILABILITY
-- =====================================================

create policy "trainer_availability_select_members"
on public.trainer_availability
for select
to authenticated
using (
  public.is_studio_member(trainer_availability.studio_id, auth.uid())
);

create policy "trainer_availability_insert_owner_or_self"
on public.trainer_availability
for insert
to authenticated
with check (
  public.is_studio_owner(studio_id, auth.uid())
  or (
    trainer_id = auth.uid()
    and public.is_studio_staff(studio_id, auth.uid())
  )
);

create policy "trainer_availability_update_owner_or_self"
on public.trainer_availability
for update
to authenticated
using (
  public.is_studio_owner(trainer_availability.studio_id, auth.uid())
  or (
    trainer_availability.trainer_id = auth.uid()
    and public.is_studio_staff(trainer_availability.studio_id, auth.uid())
  )
)
with check (
  public.is_studio_owner(studio_id, auth.uid())
  or (
    trainer_id = auth.uid()
    and public.is_studio_staff(studio_id, auth.uid())
  )
);

create policy "trainer_availability_delete_owner_or_self"
on public.trainer_availability
for delete
to authenticated
using (
  public.is_studio_owner(trainer_availability.studio_id, auth.uid())
  or (
    trainer_availability.trainer_id = auth.uid()
    and public.is_studio_staff(trainer_availability.studio_id, auth.uid())
  )
);

-- =====================================================
-- SESSIONS
-- =====================================================

create policy "sessions_select_access"
on public.sessions
for select
to authenticated
using (
  public.is_studio_member(sessions.studio_id, auth.uid())
  or public.is_client_user(sessions.client_id, auth.uid())
);

create policy "sessions_insert_staff"
on public.sessions
for insert
to authenticated
with check (
  public.is_studio_staff(studio_id, auth.uid())
  and public.can_access_client(client_id, auth.uid())
);

create policy "sessions_update_staff"
on public.sessions
for update
to authenticated
using (
  public.is_studio_staff(sessions.studio_id, auth.uid())
)
with check (
  public.is_studio_staff(studio_id, auth.uid())
);

create policy "sessions_delete_owner"
on public.sessions
for delete
to authenticated
using (
  public.is_studio_owner(sessions.studio_id, auth.uid())
);

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================

create policy "subscription_plans_select_members"
on public.subscription_plans
for select
to authenticated
using (
  public.is_studio_member(subscription_plans.studio_id, auth.uid())
);

create policy "subscription_plans_insert_owner"
on public.subscription_plans
for insert
to authenticated
with check (
  public.is_studio_owner(studio_id, auth.uid())
);

create policy "subscription_plans_update_owner"
on public.subscription_plans
for update
to authenticated
using (
  public.is_studio_owner(subscription_plans.studio_id, auth.uid())
)
with check (
  public.is_studio_owner(studio_id, auth.uid())
);

create policy "subscription_plans_delete_owner"
on public.subscription_plans
for delete
to authenticated
using (
  public.is_studio_owner(subscription_plans.studio_id, auth.uid())
);

-- =====================================================
-- CLIENT SUBSCRIPTIONS
-- =====================================================

create policy "client_subscriptions_select_access"
on public.client_subscriptions
for select
to authenticated
using (
  public.can_access_client(client_subscriptions.client_id, auth.uid())
);

create policy "client_subscriptions_insert_staff"
on public.client_subscriptions
for insert
to authenticated
with check (
  public.can_manage_client(client_id, auth.uid())
);

create policy "client_subscriptions_update_staff"
on public.client_subscriptions
for update
to authenticated
using (
  public.can_manage_client(client_subscriptions.client_id, auth.uid())
)
with check (
  public.can_manage_client(client_id, auth.uid())
);

create policy "client_subscriptions_delete_owner"
on public.client_subscriptions
for delete
to authenticated
using (
  public.can_own_client(client_subscriptions.client_id, auth.uid())
);

-- =====================================================
-- PAYMENTS
-- =====================================================

create policy "payments_select_access"
on public.payments
for select
to authenticated
using (
  public.can_access_client(payments.client_id, auth.uid())
);

create policy "payments_insert_owner"
on public.payments
for insert
to authenticated
with check (
  public.can_own_client(client_id, auth.uid())
);

create policy "payments_update_owner"
on public.payments
for update
to authenticated
using (
  public.can_own_client(payments.client_id, auth.uid())
)
with check (
  public.can_own_client(client_id, auth.uid())
);

create policy "payments_delete_owner"
on public.payments
for delete
to authenticated
using (
  public.can_own_client(payments.client_id, auth.uid())
);

-- =====================================================
-- NOTIFICATIONS
-- Users can read and update their own notifications.
-- Backend service role should create notifications.
-- =====================================================

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (
  notifications.user_id = auth.uid()
);

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (
  notifications.user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- =====================================================
-- REMINDER JOBS
-- Users can read own reminder jobs.
-- Backend/worker service role should insert/update.
-- =====================================================

create policy "reminder_jobs_select_own"
on public.reminder_jobs
for select
to authenticated
using (
  reminder_jobs.user_id = auth.uid()
);

-- =====================================================
-- AI SUMMARIES
-- =====================================================

create policy "ai_summaries_select_access"
on public.ai_summaries
for select
to authenticated
using (
  public.can_access_client(ai_summaries.client_id, auth.uid())
);

create policy "ai_summaries_insert_staff"
on public.ai_summaries
for insert
to authenticated
with check (
  public.can_manage_client(client_id, auth.uid())
);

create policy "ai_summaries_update_staff"
on public.ai_summaries
for update
to authenticated
using (
  public.can_manage_client(ai_summaries.client_id, auth.uid())
)
with check (
  public.can_manage_client(client_id, auth.uid())
);

create policy "ai_summaries_delete_staff"
on public.ai_summaries
for delete
to authenticated
using (
  public.can_manage_client(ai_summaries.client_id, auth.uid())
);

-- =====================================================
-- AUDIT LOGS
-- Backend service role should insert audit logs.
-- Studio owners can read studio audit logs.
-- Actors can read logs where they are the actor.
-- =====================================================

create policy "audit_logs_select_owner_or_actor"
on public.audit_logs
for select
to authenticated
using (
  audit_logs.actor_id = auth.uid()
  or (
    audit_logs.studio_id is not null
    and public.is_studio_owner(audit_logs.studio_id, auth.uid())
  )
);