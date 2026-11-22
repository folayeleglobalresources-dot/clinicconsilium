const TYPES=new Set(['doctor','specialist','hospital','clinic','laboratory','pharmacy']);
const FIELDS='id,listing_type,display_name,slug,summary,description,country_code,state_region,city,practice_address,specialties,services,languages,phone,public_email,website,latitude,longitude,created_at';
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
function reply(res,status,payload){res.setHeader('Cache-Control','public, max-age=60, stale-while-revalidate=120');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(payload);}
module.exports=async(req,res)=>{
 if(req.method!=='GET'){res.setHeader('Allow','GET');return reply(res,405,{ok:false,error:'method_not_allowed'});}
 const url=clean(process.env.SUPABASE_URL,500).replace(/\/$/,'');
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return reply(res,503,{ok:false,error:'directory_not_configured'});
 const type=clean(req.query&&req.query.type,24).toLowerCase();
 if(type&&!TYPES.has(type))return reply(res,400,{ok:false,error:'invalid_listing_type'});
 const city=clean(req.query&&req.query.city,100),state=clean(req.query&&req.query.state,100);
 const q=clean(req.query&&req.query.q,100);
 const specialty=clean(req.query&&req.query.specialty,100);
 const country=clean(req.query&&req.query.country,2).toUpperCase()||'NG';
 const limit=Math.min(Math.max(Number.parseInt(req.query&&req.query.limit,10)||30,1),60);
 const params=new URLSearchParams({select:FIELDS,verification_status:'eq.verified',publication_status:'eq.published',country_code:'eq.'+country,order:'display_name.asc',limit:String(limit)});
 if(type)params.set('listing_type','eq.'+type);
 if(city)params.set('city','ilike.*'+city.replace(/[,*()]/g,'')+'*');
 if(state)params.set('state_region','ilike.*'+state.replace(/[,*()]/g,'')+'*');
 if(specialty)params.set('specialties','cs.{'+specialty.replace(/[{},"]/g,'')+'}');
 if(q){const safe=q.replace(/[,*()]/g,'');params.set('or','(display_name.ilike.*'+safe+'*,summary.ilike.*'+safe+'*,city.ilike.*'+safe+'*,state_region.ilike.*'+safe+'*)');}
 try{
  const r=await fetch(url+'/rest/v1/healthcare_network_listings?'+params.toString(),{headers:{apikey:key,Authorization:'Bearer '+key}});
  if(!r.ok)return reply(res,503,{ok:false,error:'directory_unavailable'});
  const rows=await r.json();
  return reply(res,200,{ok:true,listings:Array.isArray(rows)?rows:[],count:Array.isArray(rows)?rows.length:0,filters:{type,city,state,specialty,country}});
 }catch(_){return reply(res,503,{ok:false,error:'directory_unavailable'});}
};
