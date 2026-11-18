-- Pin the trigger function search path to prevent object-shadowing attacks.
alter function public.prevent_security_audit_event_mutation() set search_path = '';