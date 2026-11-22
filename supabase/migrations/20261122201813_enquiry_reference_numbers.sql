alter table public.enquiries
  add column if not exists reference_number text;

create table if not exists public.enquiry_reference_counters (
  reference_year integer primary key check (reference_year between 2000 and 9999),
  last_value bigint not null check (last_value >= 0)
);

alter table public.enquiry_reference_counters enable row level security;
revoke all on table public.enquiry_reference_counters from anon, authenticated;
grant all on table public.enquiry_reference_counters to service_role;

create or replace function public.assign_enquiry_reference_number()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_year integer;
  v_next bigint;
begin
  v_year := extract(year from coalesce(new.created_at, now()))::integer;

  insert into public.enquiry_reference_counters (reference_year, last_value)
  values (v_year, 1)
  on conflict (reference_year)
  do update set last_value = public.enquiry_reference_counters.last_value + 1
  returning last_value into v_next;

  new.reference_number := 'CC-' || v_year::text || '-' || lpad(v_next::text, 6, '0');
  return new;
end;
$function$;

revoke all on function public.assign_enquiry_reference_number() from public, anon, authenticated;
grant execute on function public.assign_enquiry_reference_number() to service_role;

do $backfill$
declare
  v_row record;
  v_next bigint;
begin
  for v_row in
    select id, extract(year from coalesce(created_at, now()))::integer as reference_year
    from public.enquiries
    where reference_number is null
    order by created_at asc, id asc
  loop
    insert into public.enquiry_reference_counters (reference_year, last_value)
    values (v_row.reference_year, 1)
    on conflict (reference_year)
    do update set last_value = public.enquiry_reference_counters.last_value + 1
    returning last_value into v_next;

    update public.enquiries
    set reference_number = 'CC-' || v_row.reference_year::text || '-' || lpad(v_next::text, 6, '0')
    where id = v_row.id;
  end loop;
end;
$backfill$;

alter table public.enquiries
  alter column reference_number set not null;

create unique index if not exists enquiries_reference_number_uidx
  on public.enquiries(reference_number);

do $constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'enquiries_reference_number_format_check'
      and conrelid = 'public.enquiries'::regclass
  ) then
    alter table public.enquiries
      add constraint enquiries_reference_number_format_check
      check (reference_number ~ '^CC-[0-9]{4}-[0-9]{6}$');
  end if;
end;
$constraint$;

drop trigger if exists enquiries_assign_reference_number on public.enquiries;
create trigger enquiries_assign_reference_number
before insert on public.enquiries
for each row execute function public.assign_enquiry_reference_number();

comment on column public.enquiries.reference_number is
  'Human-readable, year-scoped reference shown to the person submitting an enquiry and in the admin workspace.';
