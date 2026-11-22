const TYPES=new Set(['doctor','specialist','hospital','clinic','laboratory','pharmacy']);
const FIELDS='id,listing_type,display_name,slug,summary,description,country_code,state_region,city,practice_address,specialties,services,languages,phone,public_email,website,latitude,longitude,created_at';
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const safe=(v,n)=>clean(v,n).replace(/[^a-zA-Z0-9\s-]/g,'').trim();
function reply(res,status,payload,noStore=false){res.setHeader('Cache-Control',noStore?'no-store':'public, max-age=60, stale-while-revalidate=120');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(payload);}
function distanceKm(a,b,c,d){const rad=x=>x*Math.PI/180,dl=rad(c-a),dn=rad(d-b),h=Math.sin(dl/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(dn/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
async function directoryHandler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return reply(res,405,{ok:false,error:'method_not_allowed'});}
 const url=clean(process.env.SUPABASE_URL,500).replace(/\/$/,'');const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return reply(res,503,{ok:false,error:'directory_not_configured'});
 const type=clean(req.query&&req.query.type,24).toLowerCase();if(type&&!TYPES.has(type))return reply(res,400,{ok:false,error:'invalid_listing_type'});
 const city=safe(req.query&&req.query.city,100),state=safe(req.query&&req.query.state,100),q=safe(req.query&&req.query.q,100),specialty=safe(req.query&&req.query.specialty,100);
 const country=clean(req.query&&req.query.country,2).toUpperCase()||'NG';if(!/^[A-Z]{2}$/.test(country))return reply(res,400,{ok:false,error:'invalid_country_code'});
 const limit=Math.min(Math.max(Number.parseInt(req.query&&req.query.limit,10)||30,1),60),rawLat=req.query&&req.query.near_lat,rawLng=req.query&&req.query.near_lng,hasNear=rawLat!==undefined||rawLng!==undefined;
 let lat=null,lng=null,radius=Number.parseFloat(req.query&&req.query.radius_km)||25;
 if(hasNear){lat=Number(rawLat);lng=Number(rawLng);if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat>90||lng < -180||lng>180||!Number.isFinite(radius)||radius<1||radius>100)return reply(res,400,{ok:false,error:'invalid_location_search'},true);}
 const params=new URLSearchParams({select:FIELDS,verification_status:'eq.verified',publication_status:'eq.published',country_code:'eq.'+country,order:'display_name.asc',limit:String(hasNear?1000:limit)});
 if(type)params.set('listing_type','eq.'+type);if(city)params.set('city','ilike.*'+city+'*');if(state)params.set('state_region','ilike.*'+state+'*');if(specialty)params.set('specialties','cs.{'+specialty+'}');
 if(q)params.set('or','(display_name.ilike.*'+q+'*,summary.ilike.*'+q+'*,city.ilike.*'+q+'*,state_region.ilike.*'+q+'*)');
 if(hasNear){const dy=radius/110.574,dx=Math.min(180,radius/(111.32*Math.max(.01,Math.abs(Math.cos(lat*Math.PI/180)))));params.set('and','(latitude.gte.'+(lat-dy)+',latitude.lte.'+(lat+dy)+',longitude.gte.'+(lng-dx)+',longitude.lte.'+(lng+dx)+')');}
 try{const r=await fetch(url+'/rest/v1/healthcare_network_listings?'+params.toString(),{headers:{apikey:key,Authorization:'Bearer '+key}});if(!r.ok)return reply(res,503,{ok:false,error:'directory_unavailable'},hasNear);let rows=await r.json();if(!Array.isArray(rows))rows=[];
 if(hasNear)rows=rows.filter(x=>Number.isFinite(Number(x.latitude))&&Number.isFinite(Number(x.longitude))).map(x=>({...x,distance_km:Number(distanceKm(lat,lng,Number(x.latitude),Number(x.longitude)).toFixed(1))})).filter(x=>x.distance_km<=radius).sort((a,b)=>a.distance_km-b.distance_km).slice(0,limit);
 return reply(res,200,{ok:true,listings:rows,count:rows.length,filters:{type,city,state,specialty,country,nearby:hasNear,radius_km:hasNear?radius:null}},hasNear);
 }catch(_){return reply(res,503,{ok:false,error:'directory_unavailable'},hasNear);}
};
const handleApplications=require('../lib/healthcare-network-applications');
const handleDocuments=require('../lib/healthcare-network-application-documents');
module.exports=async(req,res)=>{
 const resource=clean(req.query&&req.query.resource,40);
 if(resource==='applications')return handleApplications(req,res);
 if(resource==='application-documents')return handleDocuments(req,res);
 return directoryHandler(req,res);
};
