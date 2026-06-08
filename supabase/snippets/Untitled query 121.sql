update reminder_jobs
set scheduled_for = now() - interval '2 minutes'
where id in (
  select id
  from reminder_jobs
  where status = 'scheduled'
  order by created_at desc
  limit 2
);
