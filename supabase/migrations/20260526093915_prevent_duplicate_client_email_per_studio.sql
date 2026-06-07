create unique index if not exists clients_studio_email_unique_idx
on public.clients (studio_id, lower(email))
where email is not null;