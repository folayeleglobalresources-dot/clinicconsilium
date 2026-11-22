const ALLOWED_STATUSES=new Set(['new','in_review','responded','closed','spam']);const MAX_ROWS=500;
function reply(res,status,payload){res.setHeader('Cache-Control','no-store, private');res.setHeader('Pragma','no-cache');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(payload);}
function clean(v,n){return typeof v==='string'?v.trim().slice(0,n):'';}function headers(k,x={}){return {apikey:k,Authorization:'Bearer '+k,'Content-Type':'application/json',...x};}
function emailList(v){return String(v||'').split(',').map(x=>x.trim().toLowerCase()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));}
async function requireAdmin(req){const m=String(req.headers.authorization||'').match(/^Bearer\s+(.+)$/i);if(!m)return{ok:false,status:401,error:'sign_in_required'};const url=clean(process.env.SUPABASE_URL,500).replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY,admins=emailList(process.env.CLINICCONSILIUM_ADMIN_EMAILS),staff=emailList(process.env.CLINICCONSILIUM_STAFF_EMAILS);if(!url||!key||!process.env.SUPABASE_ANON_KEY||!admins.length)return{ok:false,status:503,error:'admin_access_not_configured'};let r;try{r=await fetch(url+'/auth/v1/user',{headers:{apikey:process.env.SUPABASE_ANON_KEY,Authorization:'Bearer '+m[1]}})}catch(_){return{ok:false,status:503,error:'identity_service_unavailable'}}if(!r.ok)return{ok:false,status:401,error:'invalid_or_expired_session'};let u;try{u=await r.json()}catch(_){return{ok:false,status:401,error:'invalid_session_response'}}const email=clean(u&&u.email,254).toLowerCase();if(!u||!u.email_confirmed_at)return{ok:false,status:403,error:'email_not_confirmed'};if(admins.includes(email))return{ok:true,email,role:'administrator',admins,staff};if(staff.includes(email))return{ok:true,email,role:'staff',admins,staff};return{ok:false,status:403,error:'admin_access_denied'};}
function parseBody(b){if(typeof b==='string'){try{return JSON.parse(b)}catch(_){return null}}return b&&typeof b==='object'&&!Array.isArray(b)?b:null;}
async function getEnquiry(url,key,id){const r=await fetch(url+'/rest/v1/enquiries?id=eq.'+encodeURIComponent(id)+'&select=id,reference_number,name,email,role,interest,enquiry_type,data_request_type,status,email_delivery_status,email_delivery_reference,admin_notes,owner_email,assigned_by_email,follow_up_at,created_at,updated_at&limit=1',{headers:headers(key)});if(!r.ok)throw Error('enquiries_unavailable');const rows=await r.json();return Array.isArray(rows)?rows[0]||null:null;}

async function readAdminRows(url,key,table,params){
 const response=await fetch(url+'/rest/v1/'+table+'?'+params.toString(),{headers:headers(key)});
 if(!response.ok)throw Error('admin_data_unavailable');
 const rows=await response.json();
 if(!Array.isArray(rows))throw Error('invalid_admin_data');
 return rows;
}
function safeAuditMetadata(value){
 const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{},out={};
 for(const key of ['requested_account_type','verification_status','listing_type','publication_status','application_type','listing_id']){
  const v=source[key];if(['string','number','boolean'].includes(typeof v))out[key]=String(v).slice(0,160);
 }
 return out;
}
async function loadAuditView(url,key){
 const securityParams=new URLSearchParams({select:'id,actor_user_id,action,resource_type,resource_id,metadata,created_at',order:'created_at.desc',limit:'100'});
 const activityParams=new URLSearchParams({select:'id,enquiry_id,actor_email,event_type,details,created_at',order:'created_at.desc',limit:'100'});
 const [security,activity]=await Promise.all([
  readAdminRows(url,key,'security_audit_events',securityParams),
  readAdminRows(url,key,'enquiry_activity',activityParams)
 ]);
 const events=[
  ...security.map(e=>({id:e.id,source:'security',created_at:e.created_at,actor:e.actor_user_id||'System',action:e.action,resource_type:e.resource_type,resource_id:e.resource_id||'',details:safeAuditMetadata(e.metadata)})),
  ...activity.map(e=>{const d=e.details&&typeof e.details==='object'?e.details:{};const safe={};for(const k of ['from','to','updated','cleared'])if(d[k]!==undefined)safe[k]=d[k];return{id:e.id,source:'enquiry',created_at:e.created_at,actor:e.actor_email||'Team member',action:e.event_type,resource_type:'enquiry',resource_id:e.enquiry_id||'',details:safe};})
 ].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,150);
 return {ok:true,read_only:true,events,total:events.length};
}
async function loadUsersRoles(url,key,auth){
 const usersResponse=await fetch(url+'/auth/v1/admin/users?page=1&per_page=1000',{headers:headers(key)});
 if(!usersResponse.ok)throw Error('auth_users_unavailable');
 const authData=await usersResponse.json(),authUsers=Array.isArray(authData.users)?authData.users:[];
 const [registrations,assignments,memberships,organisations]=await Promise.all([
  readAdminRows(url,key,'account_registrations',new URLSearchParams({select:'user_id,email,full_name,requested_account_type,status,verification_status,approved_access_role,created_at',order:'created_at.desc',limit:'1000'})),
  readAdminRows(url,key,'platform_role_assignments',new URLSearchParams({select:'user_id,role,granted_at,revoked_at',order:'granted_at.desc',limit:'1000'})),
  readAdminRows(url,key,'organisation_memberships',new URLSearchParams({select:'user_id,organisation_id,role,status,created_at',order:'created_at.desc',limit:'1000'})),
  readAdminRows(url,key,'organisations',new URLSearchParams({select:'id,display_name',limit:'1000'}))
 ]);
 const registrationByUser=new Map(registrations.map(x=>[x.user_id,x]));
 const organisationNames=new Map(organisations.map(x=>[x.id,clean(x.display_name,160)]));
 const platformByUser=new Map(),membershipByUser=new Map();
 assignments.forEach(x=>{if(!platformByUser.has(x.user_id))platformByUser.set(x.user_id,[]);platformByUser.get(x.user_id).push({role:x.role,status:x.revoked_at?'revoked':'active',granted_at:x.granted_at,revoked_at:x.revoked_at||null});});
 memberships.forEach(x=>{if(!membershipByUser.has(x.user_id))membershipByUser.set(x.user_id,[]);membershipByUser.get(x.user_id).push({organisation:organisationNames.get(x.organisation_id)||'Organisation',role:x.role,status:x.status,created_at:x.created_at});});
 const users=authUsers.map(u=>{
  const registration=registrationByUser.get(u.id)||null,email=clean(u.email,254).toLowerCase();
  return {
   id:clean(u.id,50),email,
   full_name:clean(registration&&registration.full_name||u.user_metadata&&u.user_metadata.full_name,160),
   email_confirmed:Boolean(u.email_confirmed_at),
   created_at:u.created_at||null,last_sign_in_at:u.last_sign_in_at||null,
   requested_account_type:registration&&registration.requested_account_type||null,
   registration_status:registration&&registration.status||'no_registration',
   verification_status:registration&&registration.verification_status||null,
   approved_access_role:registration&&registration.approved_access_role||null,
   configured_workspace_role:auth.admins.includes(email)?'administrator':auth.staff.includes(email)?'staff':'none',
   platform_roles:platformByUser.get(u.id)||[],
   organisation_memberships:membershipByUser.get(u.id)||[]
  };
 }).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
 return {ok:true,read_only:true,total:users.length,users};
}

module.exports=async(req,res)=>{if(!['GET','PATCH'].includes(req.method)){res.setHeader('Allow','GET, PATCH');return reply(res,405,{ok:false,error:'method_not_allowed'})}const auth=await requireAdmin(req);if(!auth.ok)return reply(res,auth.status,{ok:false,error:auth.error});const url=clean(process.env.SUPABASE_URL,500).replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(req.method==='GET'){const view=clean(req.query&&req.query.view,20);if(view==='audit'||view==='users'){if(auth.role!=='administrator')return reply(res,403,{ok:false,error:'administrator_access_required'});try{return reply(res,200,view==='audit'?await loadAuditView(url,key):await loadUsersRoles(url,key,auth));}catch(_){return reply(res,503,{ok:false,error:view+'_view_unavailable'});}}const id=clean(req.query&&req.query.id,50);if(id){if(!/^[0-9a-f-]{36}$/i.test(id))return reply(res,400,{ok:false,error:'invalid_enquiry_id'});try{const enquiry=await getEnquiry(url,key,id);if(!enquiry||(enquiry.enquiry_type==='data_protection_request'&&auth.role!=='administrator')||(auth.role==='staff'&&enquiry.owner_email!==auth.email))return reply(res,404,{ok:false,error:'enquiry_not_found'});const r=await fetch(url+'/rest/v1/rpc/admin_get_enquiry_activity',{method:'POST',headers:headers(key),body:JSON.stringify({p_id:id})});if(!r.ok)return reply(res,503,{ok:false,error:'activity_unavailable'});return reply(res,200,{ok:true,enquiry,activity:await r.json()})}catch(_){return reply(res,503,{ok:false,error:'database_unavailable'})}}
const status=clean(req.query&&req.query.status,20),search=clean(req.query&&req.query.search,120);if(status&&status!=='all'&&!ALLOWED_STATUSES.has(status))return reply(res,400,{ok:false,error:'invalid_status_filter'});const q=new URLSearchParams({select:'id,reference_number,name,email,role,interest,enquiry_type,data_request_type,status,source,email_delivery_status,email_delivery_reference,admin_notes,owner_email,assigned_by_email,follow_up_at,created_at,updated_at',order:'created_at.desc',limit:String(MAX_ROWS)});if(status&&status!=='all')q.set('status','eq.'+status);if(auth.role==='staff'){q.set('owner_email','eq.'+auth.email);q.set('enquiry_type','neq.data_protection_request');}if(search){const safe=search.replace(/[,%().*]/g,' ').trim();if(safe)q.set('or','(reference_number.ilike.*'+safe+'*,name.ilike.*'+safe+'*,email.ilike.*'+safe+'*,role.ilike.*'+safe+'*)')}try{const r=await fetch(url+'/rest/v1/enquiries?'+q.toString(),{headers:headers(key)});if(!r.ok)return reply(res,503,{ok:false,error:'enquiries_unavailable'});const rows=await r.json(),enquiries=Array.isArray(rows)?rows:[],stats={total:enquiries.length,new:0,in_review:0,responded:0,closed:0,spam:0,unassigned:0,overdue:0,due_today:0},now=new Date(),today=now.toISOString().slice(0,10);enquiries.forEach(x=>{if(Object.prototype.hasOwnProperty.call(stats,x.status))stats[x.status]++;if(!x.owner_email)stats.unassigned++;if(x.follow_up_at&&!['closed','spam'].includes(x.status)){const d=new Date(x.follow_up_at);if(!Number.isNaN(d.getTime())&&d<now)stats.overdue++;if(!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===today)stats.due_today++}});return reply(res,200,{ok:true,enquiries,stats,limit:MAX_ROWS,admin:auth.email,role:auth.role,staff:[...new Set([...auth.admins,...auth.staff])].sort().map(email=>({email,role:auth.admins.includes(email)?'administrator':'staff'}))})}catch(_){return reply(res,503,{ok:false,error:'database_unavailable'})}}
const b=parseBody(req.body);if(!b)return reply(res,400,{ok:false,error:'invalid_json'});const id=clean(b.id,50);if(!/^[0-9a-f-]{36}$/i.test(id))return reply(res,400,{ok:false,error:'invalid_enquiry_id'});let before;try{before=await getEnquiry(url,key,id)}catch(_){return reply(res,503,{ok:false,error:'database_unavailable'})}if(!before)return reply(res,404,{ok:false,error:'enquiry_not_found'});if(before.enquiry_type==='data_protection_request'&&auth.role!=='administrator')return reply(res,403,{ok:false,error:'administrator_access_required'});if(auth.role==='staff'&&before.owner_email!==auth.email)return reply(res,403,{ok:false,error:'only_assigned_staff_can_update'});
const status=b.status===undefined?undefined:clean(b.status,20),notes=b.admin_notes===undefined?undefined:(typeof b.admin_notes==='string'?b.admin_notes.trim():null),owner=b.owner_email===undefined?undefined:(b.owner_email===null||b.owner_email===''?null:clean(b.owner_email,254).toLowerCase()),follow=b.follow_up_at===undefined?undefined:(b.follow_up_at===null||b.follow_up_at===''?null:clean(b.follow_up_at,40));
if(status!==undefined&&!ALLOWED_STATUSES.has(status))return reply(res,400,{ok:false,error:'invalid_status'});if(notes===null||(notes!==undefined&&notes.length>2000))return reply(res,400,{ok:false,error:'invalid_notes'});if(notes!==undefined&&/(diagnos(?:is|es|ed)|medical record|medical history|prescription|date of birth|national identification number|patient details|health condition|symptom|medicine name|drug name|dosage|treatment history|test result|blood pressure|allerg(?:y|ies))/i.test(notes))return reply(res,400,{ok:false,error:'sensitive_information_not_allowed',message:'Use operational notes only. Do not add clinical or personal health information.'});if(owner!==undefined&&auth.role!=='administrator')return reply(res,403,{ok:false,error:'administrator_assignment_required'});if(owner!==undefined&&owner!==null&&![...auth.admins,...auth.staff].includes(owner))return reply(res,400,{ok:false,error:'staff_member_not_authorized'});if(follow!==undefined&&follow!==null&&(Number.isNaN(Date.parse(follow))||!/^\d{4}-\d{2}-\d{2}T/.test(follow)))return reply(res,400,{ok:false,error:'invalid_follow_up_date'});if([status,notes,owner,follow].every(v=>v===undefined))return reply(res,400,{ok:false,error:'no_changes_requested'});
try{const r=await fetch(url+'/rest/v1/rpc/admin_update_enquiry',{method:'POST',headers:headers(key),body:JSON.stringify({p_id:id,p_actor_email:auth.email,p_status:status??null,p_admin_notes:notes??null,p_owner_email:owner??null,p_follow_up_at:follow??null,p_set_status:status!==undefined,p_set_notes:notes!==undefined,p_set_owner:owner!==undefined,p_set_follow_up:follow!==undefined})});if(!r.ok)return reply(res,503,{ok:false,error:'update_failed'});const updated=await r.json();if(!updated)return reply(res,404,{ok:false,error:'enquiry_not_found'});return reply(res,200,{ok:true,enquiry:updated})}catch(_){return reply(res,503,{ok:false,error:'database_unavailable'})}};
