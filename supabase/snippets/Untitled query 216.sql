select
  studio_id,
  lower(email) as email,
  count(*)
from public.clients
where email is not null
group by studio_id, lower(email)
having count(*) > 1;