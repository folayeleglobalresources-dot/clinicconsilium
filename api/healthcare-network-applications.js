const crypto = require('crypto');
const MAX_BODY = 18000;
const TYPES = new Set(['doctor','specialist','hospital','clinic','laboratory','pharmacy']);
const clean = (v,n) => typeof v === 'string' ? v.trim().slice(0,n) : '';
function reply(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(data);}
function headers(key,extra={}){return {apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...extra};}
module.exports = async (req,res) => {
 if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(res,405,{ok:false,error:'method_not_allowed'});}
 const host=String(req.headers.host||'').toLowerCase(),origin=req.headers.origin;
 if(origin){let h='';try{h=new URL(origin).host.toLowerCase();}catch(_){}if(!new Set([host,'clinicconsilium.vercel.app']).has(h))return reply(res,403,{ok:false,error:'origin_not_allowed'});}
 if(!String(req.headers['content-type']||'').toLowerCase().includes('application/json'))return reply(res,415,{ok:false,error:'json_required'});
 let b=req.body;if(typeof b==='string'){if(Buffer.byteLength(b,'utf8')>MAX_BODY)return reply(res,413,{ok:false,error:'request_too_large'});try{b=JSON.parse(b);}catch(_){return reply(res,400,{ok:false,error:'invalid_json'});}}
 if(!b||typeof b!=='object'||Array.isArray(b))return reply(res,400,{ok:false,error:'invalid_request'});
 if(clean(b.website,200))return reply(res,200,{ok:true,message:'Thank you for your interest.'});
 const type=clean(b.application_type,24).toLowerCase(),name=clean(b.contact_name,120),email=clean(b.contact_email,254).toLowerCase(),organisation=clean(b.organisation_name,180);
 const body={application_type:type,contact_name:name,contact_email:email,phone:clean(b.phone,40)||null,professional_title:clean(b.professional_title,160)||null,organisation_name:organisation,state_region:clean(b.state_region,100)||null,city:clean(b.city,100)||null,country_code:clean(b.country_code,2).toUpperCase()||'NG',practice_address:clean(b.practice_address,240)||null,registration_body:clean(b.registration_body,160)||null,registration_reference:clean(b.registration_reference,180)||null,specialty:clean(b.specialty,180)||null,services:clean(b.services,1000)||null,languages:Array.isArray(b.languages)?b.languages.map(x=>clean(x,40)).filter(Boolean).slice(0,12):[],website:clean(b.website_url,240)||null,summary:clean(b.summary,500)||null,participation_interest:clean(b.participation_interest,300)||null};
 if(!TYPES.has(type)||name.length<2||! /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||organisation.length<2||! /^[A-Z]{2}$/.test(body.country_code)||!body.city||!body.state_region||!body.services||!body.registration_body||!body.registration_reference)return reply(res,400,{ok:false,error:'required_fields_missing',message:'Please complete the required contact, organisation, location, service and regulatory details.'});
 if(body.website&&!/^https:\\/\\//i.test(body.website))return reply(res,400,{ok:false,error:'website_must_use_https'});
 const url=clean(process.env.SUPABASE_URL,500).replace(/\\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return reply(res,503,{ok:false,error:'application_service_unavailable'});
 try{
  const recent=await fetch(url+'/rest/v1/healthcare_network_applications?contact_email=eq.'+encodeURIComponent(email)+'&created_at=gte.'+encodeURIComponent(new Date(Date.now()-15*60*1000).toISOString())+'&select=id&limit=1',{headers:headers(key)});
  if(recent.ok&&(await recent.json()).length)return reply(res,429,{ok:false,error:'recent_application_exists',message:'An application from this email was received recently. Please wait before submitting another.'});
  const token=crypto.randomBytes(32).toString('base64url'),hash=crypto.createHash('sha256').update(token).digest('hex');
  const saved=await fetch(url+'/rest/v1/healthcare_network_applications',{method:'POST',headers:headers(key,{Prefer:'return=representation'}),body:JSON.stringify({...body,upload_token_hash:hash})});
  if(!saved.ok)return reply(res,503,{ok:false,error:'application_save_failed',message:'We could not securely save your application. Please try again.'});
  const rows=await saved.json();if(!rows[0]?.id)return reply(res,503,{ok:false,error:'application_save_unconfirmed'});
  return reply(res,201,{ok:true,application_id:rows[0].id,upload_token:token,upload_expires_at:rows[0].upload_token_expires_at,message:'Your application has been received. It will be reviewed before any listing can be verified or published.'});
 }catch(_){return reply(res,503,{ok:false,error:'application_service_unavailable'});}
};