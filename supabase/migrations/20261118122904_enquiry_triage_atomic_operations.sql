create or replace function public.admin_update_enquiry(p_id uuid,p_actor_email text,p_status text default null,p_admin_notes text default null,p_owner_email text default null,p_follow_up_at timestamptz default null,p_set_status boolean default false,p_set_notes boolean default false,p_set_owner boolean default false,p_set_follow_up boolean default false) returns jsonb language plpgsql set search_path='' as $$
declare old_row public.enquiries%rowtype; new_row public.enquiries%rowtype;
begin
 if p_actor_email is null or length(trim(p_actor_email))=0 then raise exception 'actor_required'; end if;
 if p_set_status and p_status not in ('new','in_review','responded','closed','spam') then raise exception 'invalid_status'; end if;
 if p_set_notes and length(coalesce(p_admin_notes,''))>2000 then raise exception 'notes_too_long'; end if;
 select * into old_row from public.enquiries where id=p_id for update;
 if not found then return null; end if;
 update public.enquiries set status=case when p_set_status then p_status else status end,admin_notes=case when p_set_notes then coalesce(p_admin_notes,'') else admin_notes end,owner_email=case when p_set_owner then p_owner_email else owner_email end,assigned_by_email=case when p_set_owner then p_actor_email else assigned_by_email end,follow_up_at=case when p_set_follow_up then p_follow_up_at else follow_up_at end,updated_at=now() where id=p_id returning * into new_row;
 if p_set_status and old_row.status is distinct from new_row.status then insert into public.enquiry_activity(enquiry_id,actor_email,event_type,details) values(p_id,p_actor_email,'status_changed',jsonb_build_object('from',old_row.status,'to',new_row.status)); end if;
 if p_set_owner and old_row.owner_email is distinct from new_row.owner_email then insert into public.enquiry_activity(enquiry_id,actor_email,event_type,details) values(p_id,p_actor_email,'assigned',jsonb_build_object('from',old_row.owner_email,'to',new_row.owner_email)); end if;
 if p_set_follow_up and old_row.follow_up_at is distinct from new_row.follow_up_at then insert into public.enquiry_activity(enquiry_id,actor_email,event_type,details) values(p_id,p_actor_email,'follow_up_changed',jsonb_build_object('from',old_row.follow_up_at,'to',new_row.follow_up_at)); end if;
 if p_set_notes and old_row.admin_notes is distinct from new_row.admin_notes then insert into public.enquiry_activity(enquiry_id,actor_email,event_type,details) values(p_id,p_actor_email,'note_updated',jsonb_build_object('updated',true)); end if;
 return to_jsonb(new_row);
end; $$;
revoke all on function public.admin_update_enquiry(uuid,text,text,text,text,timestamptz,boolean,boolean,boolean,boolean) from public,anon,authenticated;
grant execute on function public.admin_update_enquiry(uuid,text,text,text,text,timestamptz,boolean,boolean,boolean,boolean) to service_role;
create or replace function public.admin_get_enquiry_activity(p_id uuid) returns jsonb language sql set search_path='' as $$ select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) from (select id,actor_email,event_type,details,created_at from public.enquiry_activity where enquiry_id=p_id order by created_at desc limit 100) a; $$;
revoke all on function public.admin_get_enquiry_activity(uuid) from public,anon,authenticated;
grant execute on function public.admin_get_enquiry_activity(uuid) to service_role;
