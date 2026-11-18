-- Preserve immutable audit references when source accounts or organisations are removed.
-- Audit identifiers are retained as historical references; they are not live profile links.
alter table public.security_audit_events
  drop constraint if exists security_audit_events_actor_user_id_fkey,
  drop constraint if exists security_audit_events_patient_user_id_fkey,
  drop constraint if exists security_audit_events_organisation_id_fkey;