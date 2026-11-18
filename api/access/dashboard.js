const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POLICIES={patient:{kind:'registration',role:'patient'},professional:{kind:'registration',role:'professional'},hospital:{kind:'organisation',types:['hospital','clinic'],roles:['facility_admin','clinician','nurse','records_officer']},pharmacy:{kind:'organisation',types:['pharmacy'],roles:['facility_admin','pharmacist']},laboratory:{kind:'organisation',types:['laboratory'],roles:['facility_admin','lab_staff']},coordination:{kind:'platform',roles:['care_coordinator','super_admin','platform_admin']}};
function reply(res,status,payload){res.setHeader('Cache-Control','no-store, private');res.setHeader('Pragma','no-cache');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(payload);}
const headers=(key)=>({apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'});
async function read(url,opts){const r=await fetch(url,opts);if(!r.ok)throw Error('upstream');return r.json();}
module.exports=async(req,res)=>{
 if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(res,405,{ok:false,error:'method_not_allowed'});}
 let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch(_){body=null}}
 const workspace=body&&typeof body.workspace==='string'?body.workspace:'',policy=POLICIES[workspace];
 if(!policy)return reply(res,400,{ok:false,error:'invalid_workspace'});
 const match=String(req.headers.authorization||'').match(/^Bearer\s+(.+)$/i);if(!match)return reply(res,401,{ok:false,error:'sign_in_required'});
 const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,''),anon=process.env.SUPABASE_ANON_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!key)return reply(res,503,{ok:false,error:'access_service_not_configured'});
 let user;try{user=await read(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+match[1]}})}catch(_){return reply(res,401,{ok:false,error:'invalid_or_expired_session'});}
 if(!user||!UUID.test(user.id||''))return reply(res,401,{ok:false,error:'invalid_identity'});
 if(!user.email_confirmed_at)return reply(res,403,{ok:false,error:'email_not_verified',message:'Confirm your email address before opening a workspace.'});
 const base=url+'/rest/v1/',h=headers(key);
 try{
  if(policy.kind==='registration'){
   const rows=await read(base+'account_registrations?user_id=eq.'+encodeURIComponent(user.id)+'&select=status,requested_account_type,verification_status,approved_access_role&limit=1',{headers:h}),r=Array.isArray(rows)?rows[0]:null;
   if(!r)return reply(res,403,{ok:false,error:'registration_not_found',message:'No approved registration was found. Please return to account registration.'});
   const messages={pending_email:'Confirm your email address before opening a workspace.',pending_review:'Your registration is awaiting administrator review.',rejected:'This registration was not approved.',suspended:'This account access is suspended. Contact ClinicConsilium.'};
   if(messages[r.status])return reply(res,403,{ok:false,error:r.status==='pending_review'?'registration_pending_review':r.status==='pending_email'?'email_verification_pending':r.status==='rejected'?'registration_rejected':'account_suspended',message:messages[r.status]});
   if(r.status!=='approved'||r.approved_access_role!==policy.role||r.requested_account_type!==policy.role)return reply(res,403,{ok:false,error:'workspace_not_authorised',message:'This account is not approved for the requested workspace.'});
   if(policy.role==='professional'&&r.verification_status!=='verified')return reply(res,403,{ok:false,error:'professional_verification_required',message:'Professional credentials must be verified before workspace access.'});
   return reply(res,200,{ok:true,workspace,access:'granted'});
  }
  if(policy.kind==='organisation'){
   const memberships=await read(base+'organisation_memberships?user_id=eq.'+encodeURIComponent(user.id)+'&status=eq.active&select=organisation_id,role',{headers:h});
   const eligible=(Array.isArray(memberships)?memberships:[]).filter(m=>policy.roles.includes(m.role)&&UUID.test(m.organisation_id||''));
   if(!eligible.length)return reply(res,403,{ok:false,error:'active_membership_required',message:'This workspace requires an active invitation and membership from an approved organisation.'});
   const ids=[...new Set(eligible.map(m=>m.organisation_id))],orgs=await read(base+'organisations?id=in.('+ids.join(',')+')&status=eq.active&select=id,organisation_type,status',{headers:h});
   const allowed=new Set((Array.isArray(orgs)?orgs:[]).filter(o=>policy.types.includes(o.organisation_type)&&o.status==='active').map(o=>o.id));
   if(!eligible.some(m=>allowed.has(m.organisation_id)))return reply(res,403,{ok:false,error:'matching_active_organisation_required',message:'No active membership for the required organisation type was found.'});
   return reply(res,200,{ok:true,workspace,access:'granted'});
  }
  const roles=await read(base+'platform_role_assignments?user_id=eq.'+encodeURIComponent(user.id)+'&revoked_at=is.null&select=role',{headers:h});
  if(!(Array.isArray(roles)?roles:[]).some(x=>policy.roles.includes(x.role)))return reply(res,403,{ok:false,error:'platform_role_required',message:'This internal workspace is limited to staff with an active platform role.'});
  return reply(res,200,{ok:true,workspace,access:'granted'});
 }catch(_){return reply(res,503,{ok:false,error:'access_check_unavailable',message:'We could not verify workspace permissions. Please try again shortly.'});}
};