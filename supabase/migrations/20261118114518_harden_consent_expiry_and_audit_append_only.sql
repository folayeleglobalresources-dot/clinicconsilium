-- Keep revoked/expired consent from being visible to recipients.
drop policy "named_recipients_read_active_consents" on public.patient_data_consents;
create policy "named_recipients_read_active_consents"
  on public.patient_data_consents for select to authenticated
  using (
    status = 'active'
    and (expires_at is null or expires_at > now())
    and (
      recipient_user_id = (select auth.uid())
      or (
        recipient_organisation_id is not null
        and exists (
          select 1 from public.organisation_memberships m
          where m.organisation_id = patient_data_consents.recipient_organisation_id
            and m.user_id = (select auth.uid())
            and m.status = 'active'
        )
      )
    )
  );

-- Audit events can be appended by the trusted server role but never edited or deleted.
create or replace function public.prevent_security_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Security audit events are append-only';
end;
$$;

revoke all on function public.prevent_security_audit_event_mutation() from public, anon, authenticated;
create trigger security_audit_events_append_only
  before update or delete on public.security_audit_events
  for each row execute function public.prevent_security_audit_event_mutation();
