const TYPES=new Set(['doctor','specialist','hospital','clinic','laboratory','pharmacy']);
const STATUSES=new Set(['pending_review','verified','rejected','suspended']);
const COLS='id,organisation_id,owner_user_id,listing_type,display_name,slug,summary,description,country_code,state_region,city,practice_address,latitude,longitude,specialties,services,languages,phone,public_email,website,registration_body,credential_reference,verification_status,publication_status,reviewed_by,reviewed_at,published_at,created_at,updated_at';
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
function reply(res,status,payload){res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(payload);}
function headers(key,extra={}){return {apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...extra};}
async function requireAdmin(req){
 const token=String(req.headers.authorization||'').match(/^Bearer\s+(.+)$/i);if(!token)return{ok:false,status:401,error:'sign_in_required'};
 const url=clean(process.env.SUPABASE_URL,500).replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY,anon=process.env.SUPABASE_ANON_KEY;
 const allowed=String(process.env.CLINICCONSILIUM_ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
 if(!url||!key||!anon||!allowed.length)return{ok:false,status:503,error:'admin_access_not_configured'};
 try{const r=await fetch(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+token[1]}});if(!r.ok)return{ok:false,status:401,error:'invalid_or_expired_session'};const u=await r.json();const email=clean(u.email,254).toLowerCase();if(!u.email_confirmed_at)return{ok:false,status:403,error:'email_not_confirmed'};if(!allowed.includes(email))return{ok:false,status:403,error:'admin_access_denied'};return{ok:true,id:u.id,email,url,key};}
 catch(_){return{ok:false,status:503,error:'identity_service_unavailable'};}
}
function list(v,max){return Array.isArray(v)?v.map(x=>clean(x,100)).filter(Boolean).slice(0,max):[];}
function slugify(s){return clean(s,180).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,160);}
module.exports=async(req,res)=>{
 if(!['GET','POST','PATCH'].includes(req.method)){res.setHeader('Allow','GET, POST, PATCH');return reply(res,405,{ok:false,error:'method_not_allowed'});}
 const admin=await requireAdmin(req);if(!admin.ok)return reply(res,admin.status,{ok:false,error:admin.error});
 const base=admin.url+'/rest/v1/healthcare_network_listings';
 if(req.method==='GET'){
  const status=clean(req.query&&req.query.status,30);
  if(status&&!new Set(['pending_review','verified','rejected','suspended']).has(status))return reply(res,400,{ok:false,error:'invalid_status'});
  const params=new URLSearchParams({select:COLS,order:'created_at.desc',limit:'300'});
  if(status)params.set('verification_status','eq.'+status);
  try{const r=await fetch(base+'?'+params.toString(),{headers:headers(admin.key)});if(!r.ok)return reply(res,503,{ok:false,error:'network_queue_unavailable'});return reply(res,200,{ok:true,listings:await r.json(),reviewer:admin.email});}
  catch(_){return reply(res,503,{ok:false,error:'network_queue_unavailable'});}
 }
 let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch(_){body=null}}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply(res,400,{ok:false,error:'invalid_json'});
 if(req.method==='POST'){
  const type=clean(body.listing_type,24).toLowerCase(),name=clean(body.display_name,180),country=clean(body.country_code,2).toUpperCase()||'NG';
  if(!TYPES.has(type)||name.length<2||!/^[A-Z]{2}$/.test(country))return reply(res,400,{ok:false,error:'required_listing_fields_missing'});
  const slug=slugify(body.slug||name);if(!slug)return reply(res,400,{ok:false,error:'invalid_slug'});
  const payload={listing_type:type,display_name:name,slug,summary:clean(body.summary,500),description:clean(body.description,3000),country_code:country,state_region:clean(body.state_region,100)||null,city:clean(body.city,100)||null,practice_address:clean(body.practice_address,240)||null,specialties:list(body.specialties,30),services:list(body.services,40),languages:list(body.languages,15),phone:clean(body.phone,40)||null,public_email:clean(body.public_email,254).toLowerCase()||null,website:clean(body.website,240)||null,registration_body:clean(body.registration_body,160)||null,credential_reference:clean(body.credential_reference,240)||null,organisation_id:clean(body.organisation_id,36)||null,owner_user_id:clean(body.owner_user_id,36)||null,verification_status:'pending_review',publication_status:'unpublished'};
  if(payload.website&&!/^https:\/\//i.test(payload.website))return reply(res,400,{ok:false,error:'website_must_use_https'});
  try{const r=await fetch(base,{method:'POST',headers:headers(admin.key,{Prefer:'return=representation'}),body:JSON.stringify(payload)});if(!r.ok){const e=await r.json().catch(()=>[]);return reply(res,r.status===409?409:503,{ok:false,error:'listing_create_failed',detail:Array.isArray(e)?e[0]?.message:undefined});}const rows=await r.json();return reply(res,201,{ok:true,listing:rows[0]});}
  catch(_){return reply(res,503,{ok:false,error:'listing_create_failed'});}
 }
 const id=clean(body.id,36),action=clean(body.action,24);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return reply(res,400,{ok:false,error:'invalid_listing_id'});
 if(!['verify','publish','unpublish','reject','suspend','reinstate'].includes(action))return reply(res,400,{ok:false,error:'invalid_action'});
 const read=await fetch(base+'?id=eq.'+encodeURIComponent(id)+'&select='+COLS+'&limit=1',{headers:headers(admin.key)});
 if(!read.ok)return reply(res,503,{ok:false,error:'listing_lookup_failed'});
 const rows=await read.json();if(!rows.length)return reply(res,404,{ok:false,error:'listing_not_found'});
 const before=rows[0],patch={reviewed_by:admin.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
 if(action==='verify'){if(before.verification_status!=='pending_review')return reply(res,409,{ok:false,error:'listing_not_reviewable'});patch.verification_status='verified';}
 if(action==='publish'){if(before.verification_status!=='verified')return reply(res,409,{ok:false,error:'verification_required_before_publication'});patch.publication_status='published';patch.published_at=new Date().toISOString();}
 if(action==='unpublish'){patch.publication_status='unpublished';patch.published_at=null;}
 if(action==='reject'){patch.verification_status='rejected';patch.publication_status='unpublished';patch.published_at=null;}
 if(action==='suspend'){patch.verification_status='suspended';patch.publication_status='unpublished';patch.published_at=null;}
 if(action==='reinstate'){if(before.verification_status!=='suspended')return reply(res,409,{ok:false,error:'listing_not_suspended'});patch.verification_status='pending_review';patch.publication_status='unpublished';patch.published_at=null;}
 const notes=clean(body.review_notes,2000);if(notes)patch.description=before.description;
 try{
  const r=await fetch(base+'?id=eq.'+encodeURIComponent(id)+'&select='+COLS,{method:'PATCH',headers:headers(admin.key,{Prefer:'return=representation'}),body:JSON.stringify(patch)});
  if(!r.ok)return reply(res,503,{ok:false,error:'listing_update_failed'});
  const changed=await r.json();if(!changed.length)return reply(res,404,{ok:false,error:'listing_not_found'});
  await fetch(admin.url+'/rest/v1/security_audit_events',{method:'POST',headers:headers(admin.key,{Prefer:'return=minimal'}),body:JSON.stringify({actor_user_id:admin.id,action:'healthcare_network_'+action,resource_type:'healthcare_network_listing',resource_id:id,metadata:{listing_type:before.listing_type,verification_status:changed[0].verification_status,publication_status:changed[0].publication_status}})}).catch(()=>null);
  return reply(res,200,{ok:true,listing:changed[0]});
 }catch(_){return reply(res,503,{ok:false,error:'listing_update_failed'});}
};
