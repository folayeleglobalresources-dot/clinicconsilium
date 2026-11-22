const crypto = require('crypto');
const MAX_FILE = 2621440, BUCKET = 'healthcare-network-credentials';
const TYPES = new Set(['application/pdf','image/jpeg','image/png']);
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
function reply(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(data);}
function headers(key,extra={}){return {apikey:key,Authorization:'Bearer '+key,...extra};}
function validMagic(buf,mime){if(mime==='application/pdf')return buf.subarray(0,5).toString()==='%PDF-';if(mime==='image/png')return buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));if(mime==='image/jpeg')return buf.length>3&&buf[0]===255&&buf[1]===216&&buf[2]===255;return false;}
module.exports=async(req,res)=>{
 if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(res,405,{ok:false,error:'method_not_allowed'});}
 const host=String(req.headers.host||'').toLowerCase(),origin=req.headers.origin;if(origin){let h='';try{h=new URL(origin).host.toLowerCase();}catch(_){}if(!new Set([host,'clinicconsilium.vercel.app']).has(h))return reply(res,403,{ok:false,error:'origin_not_allowed'});}
 let b=req.body;if(typeof b==='string'){if(Buffer.byteLength(b,'utf8')>3700000)return reply(res,413,{ok:false,error:'file_too_large'});try{b=JSON.parse(b);}catch(_){return reply(res,400,{ok:false,error:'invalid_json'});}}
 if(!b||typeof b!=='object')return reply(res,400,{ok:false,error:'invalid_request'});
 const appId=clean(b.application_id,36),token=clean(b.upload_token,100),filename=clean(b.filename,180),mime=clean(b.mime_type,80),docType=clean(b.document_type,40),encoded=clean(b.file_base64,3600000);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId)||token.length<40||!filename||!TYPES.has(mime)||!['professional_registration','facility_licence','accreditation','other'].includes(docType)||!encoded)return reply(res,400,{ok:false,error:'document_fields_invalid'});
 const buf=Buffer.from(encoded,'base64');if(!buf.length||buf.length>MAX_FILE||buf.toString('base64').replace(/=+$/,'')!==encoded.replace(/=+$/,''))return reply(res,413,{ok:false,error:'file_size_or_encoding_invalid'});
 if(!validMagic(buf,mime))return reply(res,415,{ok:false,error:'file_content_does_not_match_type'});
 const url=clean(process.env.SUPABASE_URL,500).replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return reply(res,503,{ok:false,error:'upload_service_unavailable'});
 try{
  const ar=await fetch(url+'/rest/v1/healthcare_network_applications?id=eq.'+encodeURIComponent(appId)+'&select=id,upload_token_hash,upload_token_expires_at&limit=1',{headers:headers(key,{'Content-Type':'application/json'})});
  if(!ar.ok)return reply(res,503,{ok:false,error:'application_lookup_failed'});const apps=await ar.json(),app=apps[0];if(!app)return reply(res,404,{ok:false,error:'application_not_found'});
  const supplied=crypto.createHash('sha256').update(token).digest('hex');
  if(!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(app.upload_token_hash))||new Date(app.upload_token_expires_at).getTime()<Date.now())return reply(res,403,{ok:false,error:'upload_access_expired'});
  const count=await fetch(url+'/rest/v1/healthcare_network_documents?application_id=eq.'+encodeURIComponent(appId)+'&select=id&limit=6',{headers:headers(key)});
  if(!count.ok)return reply(res,503,{ok:false,error:'document_count_unavailable'});if((await count.json()).length>=5)return reply(res,409,{ok:false,error:'document_limit_reached'});
  const ext=mime==='application/pdf'?'pdf':mime==='image/png'?'png':'jpg',path='applications/'+appId+'/'+crypto.randomUUID()+'.'+ext;
  const uploaded=await fetch(url+'/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',headers:headers(key,{'Content-Type':mime,'x-upsert':'false','cache-control':'0'}),body:buf});
  if(!uploaded.ok)return reply(res,503,{ok:false,error:'private_document_upload_failed'});
  const meta=await fetch(url+'/rest/v1/healthcare_network_documents',{method:'POST',headers:headers(key,{'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify({application_id:appId,object_path:path,document_type:docType,original_filename:filename.replace(/[\r\n]/g,' ').slice(0,180),mime_type:mime,file_size_bytes:buf.length})});
  if(!meta.ok){await fetch(url+'/storage/v1/object/'+BUCKET+'/'+path,{method:'DELETE',headers:headers(key)}).catch(()=>null);return reply(res,503,{ok:false,error:'document_record_failed'});}
  const rows=await meta.json();return reply(res,201,{ok:true,document:{id:rows[0].id,filename:rows[0].original_filename,document_type:rows[0].document_type},message:'Your document was uploaded to private storage for review.'});
 }catch(_){return reply(res,503,{ok:false,error:'upload_service_unavailable'});}
};