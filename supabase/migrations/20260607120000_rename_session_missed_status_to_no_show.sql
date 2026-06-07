-- =====================================================
-- Align sessions.status with application code
-- The app (sessions.schema.ts / sessions.service.ts) reads and writes
-- 'no_show' for clients who didn't attend a scheduled session, but the
-- original check constraint only allowed 'missed'. Rename the value and
-- update the constraint so status updates to 'no_show' succeed.
-- =====================================================

update public.sessions
set status = 'no_show'
where status = 'missed';

alter table public.sessions
  drop constraint sessions_status_check;

alter table public.sessions
  add constraint sessions_status_check
  check (status in ('scheduled', 'completed', 'cancelled', 'no_show'));
