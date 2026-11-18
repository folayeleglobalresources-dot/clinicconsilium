create or replace function public.create_pending_account_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_type text;
  display_name text;
  initial_verification text;
begin
  requested_type := case
    when new.raw_user_meta_data ->> 'account_intent' = 'professional' then 'professional'
    else 'patient'
  end;
  display_name := nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), '');
  if display_name is null then
    display_name := left(coalesce(split_part(new.email, '@', 1), 'ClinicConsilium user'), 120);
  end if;
  initial_verification := case when requested_type = 'professional' then 'pending' else 'not_required' end;

  -- Always begin in pending_email. The authenticated status endpoint checks
  -- the authoritative email_confirmed_at value and advances the state.
  insert into public.account_registrations (
    user_id, email, full_name, requested_account_type, status, verification_status
  ) values (
    new.id, lower(new.email), display_name, requested_type, 'pending_email', initial_verification
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
