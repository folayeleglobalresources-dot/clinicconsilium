const STATUSES=new Set(['pending_email','pending_review','approved','rejected','suspended']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLS='user_id,email,full_name,requested_account_type,status,verification_status,credential_type,credential_reference,review_notes,reviewed_by,reviewed_at,approved_access_role,created_at,updated_at';
function reply(res,status,payload){res.setHeader('Cache-Control','no-store, private');res.setHeader('Pragma','no-cache');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(payload);}
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
function headers(key,extra={}){return {apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...extra};}
async function requireAdmin(req){
 const match=String(req.headers.authorization||'').match(/^Bearer\s+(.+)$/i);if(!match)return{ok:false,status:401,error:'sign_in_required'};
 const url=clean(process.env.SUPABASE_URL,500).replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY,anon=process.env.SUPABASE_ANON_KEY;
 const allowed=String(process.env.CLINICCONSILIUM_ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
 if(!url||!key||!anon||!allowed.length)return{ok:false,status:503,error:'admin_access_not_configured'};
 try{const r=await fetch(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+match[1]}});if(!r.ok)return{ok:false,status:401,error:'invalid_or_expired_session'};const u=await r.json();const email=clean(u.email,254).toLowerCase();if(!u.email_confirmed_at)return{ok:false,status:403,error:'email_not_confirmed'};if(!allowed.includes(email))return{ok:false,status:403,error:'admin_access_denied'};return{ok:true,id:u.id,email,url,key};}
 catch(_){return{ok:false,status:503,error:'identity_service_unavailable'};}
}
async function authUser(admin,id){const r=await fetch(admin.url+'/auth/v1/admin/users/'+encodeURIComponent(id),{headers:headers(admin.key)});if(!r.ok)throw Error('auth_user_lookup_failed');return r.json();}
async function setAppAccess(admin,user,role,status){
 const app=user.app_metadata&&typeof user.app_metadata==='object'?user.app_metadata:{};
 const roles=Array.isArray(app.clinicconsilium_roles)?app.clinicconsilium_roles.filter(x=>x!=='patient'&&x!=='professional'):[];
 if(status==='approved'&&role)roles.push(role);
 const r=await fetch(admin.url+'/auth/v1/admin/users/'+encodeURIComponent(user.id),{method:'PUT',headers:headers(admin.key),body:JSON.stringify({app_metadata:{...app,clinicconsilium_roles:[...new Set(roles)],clinicconsilium_access_status:status}})});
 if(!r.ok)throw Error('auth_access_update_failed');
}
async function audit(admin,action,userId,registration){
 await fetch(admin.url+'/rest/v1/security_audit_events',{method:'POST',headers:headers(admin.key,{Prefer:'return=minimal'}),body:JSON.stringify({actor_user_id:admin.id,action,resource_type:'account_registration',resource_id:userId,metadata:{requested_account_type:registration.requested_account_type,verification_status:registration.verification_status}})});
}
module.exports=async(req,res)=>{
 if(!['GET','PATCH'].includes(req.method)){res.setHeader('Allow','GET, PATCH');return reply(res,405,{ok:false,error:'method_not_allowed'});}
 const admin=await requireAdmin(req);if(!admin.ok)return reply(res,admin.status,{ok:false,error:admin.error});
 const base=admin.url+'/rest/v1/account_registrations',h=headers(admin.key);
 if(req.method==='GET'){
  const status=clean(req.query&&req.query.status,30);
  if(status&&!STATUSES.has(status))return reply(res,400,{ok:false,error:'invalid_status'});
  let q=base+'?select='+encodeURIComponent(COLS)+'&order=created_at.desc&limit=300';
  if(status)q+='&status=eq.'+encodeURIComponent(status);
  try{const r=await fetch(q,{headers:h});if(!r.ok)return reply(res,503,{ok:false,error:'registration_queue_unavailable'});const rows=await r.json();return reply(res,200,{ok:true,registrations:rows,reviewer:admin.email});}
  catch(_){return reply(res,503,{ok:false,error:'registration_service_unavailable'});}
 }
 let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch(_){body=null}}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply(res,400,{ok:false,error:'invalid_json'});
 const id=clean(body.user_id,50),action=clean(body.action,30);
 if(!UUID.test(id))return reply(res,400,{ok:false,error:'invalid_user_id'});
 if(!['mark_verified','approve','reject','suspend'].includes(action))return reply(res,400,{ok:false,error:'invalid_action'});
 try{
  const read=await fetch(base+'?user_id=eq.'+encodeURIComponent(id)+'&select='+encodeURIComponent(COLS)+'&limit=1',{headers:h});
  if(!read.ok)return reply(res,503,{ok:false,error:'registration_lookup_failed'});
  const rows=await read.json();if(!rows.length)return reply(res,404,{ok:false,error:'registration_not_found'});
  const before=rows[0],user=await authUser(admin,id);
  if(!user.email_confirmed_at)return reply(res,409,{ok:false,error:'email_not_verified'});
  if(action==='mark_verified'&&before.requested_account_type!=='professional')return reply(res,400,{ok:false,error:'credential_review_not_required'});
  if(action==='mark_verified'&&before.status!=='pending_review')return reply(res,409,{ok:false,error:'registration_not_reviewable'});
  if(action==='approve'&&before.status!=='pending_review')return reply(res,409,{ok:false,error:'registration_not_reviewable'});
  if(action==='approve'&&before.requested_account_type==='professional'&&before.verification_status!=='verified')return reply(res,409,{ok:false,error:'professional_credentials_not_verified'});
  const patch={reviewed_by:admin.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  if(action==='mark_verified'){
   const credentialType=clean(body.credential_type,80),credentialReference=clean(body.credential_reference,120);
   if(!credentialType||!credentialReference)return reply(res,400,{ok:false,error:'credential_details_required'});
   patch.verification_status='verified';patch.credential_type=credentialType;patch.credential_reference=credentialReference;
   patch.review_notes=clean(body.review_notes,2000)||before.review_notes;
  }else if(action==='approve'){
   patch.status='approved';patch.approved_access_role=before.requested_account_type;
   patch.review_notes=clean(body.review_notes,2000)||before.review_notes;
  }else{
   patch.status=action==='reject'?'rejected':'suspended';patch.approved_access_role=null;
   patch.review_notes=clean(body.review_notes,2000)||before.review_notes;
  }
  const update=await fetch(base+'?user_id=eq.'+encodeURIComponent(id)+'&select='+encodeURIComponent(COLS),{method:'PATCH',headers:headers(admin.key,{Prefer:'return=representation'}),body:JSON.stringify(patch)});
  if(!update.ok)return reply(res,503,{ok:false,error:'registration_update_failed'});
  const changed=await update.json();if(!changed.length)return reply(res,404,{ok:false,error:'registration_not_found'});
  const after=changed[0];
  try{await setAppAccess(admin,user,after.approved_access_role,after.status);}
  catch(_){
   const rollback={status:before.status,approved_access_role:before.approved_access_role,verification_status:before.verification_status,credential_type:before.credential_type,credential_reference:before.credential_reference,review_notes:before.review_notes,reviewed_by:before.reviewed_by,reviewed_at:before.reviewed_at,updated_at:new Date().toISOString()};
   await fetch(base+'?user_id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:h,body:JSON.stringify(rollback)});
   return reply(res,503,{ok:false,error:'access_provisioning_failed'});
  }
  await audit(admin,'account_registration_'+action,id,after);
  return reply(res,200,{ok:true,registration:after});
 }catch(_){return reply(res,503,{ok:false,error:'registration_service_unavailable'});}
};
