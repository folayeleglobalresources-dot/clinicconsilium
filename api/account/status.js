const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reply(res,status,payload){res.setHeader('Cache-Control','no-store, private');res.setHeader('Pragma','no-cache');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(status).json(payload);}
function headers(key,extra={}){return {apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...extra};}
async function setAppAccess(url,key,userId,role,status){
  const h=headers(key);
  const get=await fetch(url+'/auth/v1/admin/users/'+encodeURIComponent(userId),{headers:h});
  if(!get.ok)throw Error('auth_user_lookup_failed');
  const payload=await get.json(),app=payload.app_metadata&&typeof payload.app_metadata==='object'?payload.app_metadata:{};
  const roles=Array.isArray(app.clinicconsilium_roles)?app.clinicconsilium_roles.filter(x=>x!=='patient'&&x!=='professional'):[];
  if(status==='approved'&&role)roles.push(role);
  const next={...app,clinicconsilium_roles:[...new Set(roles)],clinicconsilium_access_status:status};
  const put=await fetch(url+'/auth/v1/admin/users/'+encodeURIComponent(userId),{method:'PUT',headers:h,body:JSON.stringify({app_metadata:next})});
  if(!put.ok)throw Error('auth_access_update_failed');
}
module.exports=async(req,res)=>{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return reply(res,405,{ok:false,error:'method_not_allowed'});}
  const token=String(req.headers.authorization||'').match(/^Bearer\s+(.+)$/i);
  if(!token)return reply(res,401,{ok:false,error:'sign_in_required'});
  const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,''),anon=process.env.SUPABASE_ANON_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!key)return reply(res,503,{ok:false,error:'account_access_not_configured'});
  let identity;
  try{const r=await fetch(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+token[1]}});if(!r.ok)return reply(res,401,{ok:false,error:'invalid_or_expired_session'});identity=await r.json();}
  catch(_){return reply(res,503,{ok:false,error:'identity_service_unavailable'});}
  if(!identity||!UUID.test(identity.id||''))return reply(res,401,{ok:false,error:'invalid_identity'});
  const h=headers(key),base=url+'/rest/v1/account_registrations';
  try{
    const r=await fetch(base+'?user_id=eq.'+encodeURIComponent(identity.id)+'&select=user_id,email,full_name,requested_account_type,status,verification_status,approved_access_role,created_at,updated_at&limit=1',{headers:h});
    if(!r.ok)return reply(res,503,{ok:false,error:'registration_lookup_failed'});
    const rows=await r.json();if(!rows.length)return reply(res,404,{ok:false,error:'registration_not_found'});
    let record=rows[0];
    if(identity.email_confirmed_at&&record.status==='pending_email'){
      const next=record.requested_account_type==='patient'
        ?{status:'approved',approved_access_role:'patient',updated_at:new Date().toISOString()}
        :{status:'pending_review',updated_at:new Date().toISOString()};
      const update=await fetch(base+'?user_id=eq.'+encodeURIComponent(identity.id),{method:'PATCH',headers:{...h,Prefer:'return=representation'},body:JSON.stringify(next)});
      if(!update.ok)return reply(res,503,{ok:false,error:'registration_update_failed'});
      const changed=await update.json();if(changed.length)record=changed[0];
    }
    if(record.status==='approved'&&record.approved_access_role){
      try{await setAppAccess(url,key,identity.id,record.approved_access_role,'approved');}
      catch(_){
        if(record.requested_account_type==='patient'&&record.status==='approved'){
          await fetch(base+'?user_id=eq.'+encodeURIComponent(identity.id),{method:'PATCH',headers:h,body:JSON.stringify({status:'pending_review',approved_access_role:null,updated_at:new Date().toISOString()})});
          return reply(res,503,{ok:false,error:'access_provisioning_pending'});
        }
        return reply(res,503,{ok:false,error:'access_provisioning_pending'});
      }
    }
    return reply(res,200,{ok:true,registration:record,email_verified:!!identity.email_confirmed_at,access:record.status==='approved'?record.approved_access_role:null});
  }catch(_){return reply(res,503,{ok:false,error:'registration_service_unavailable'});}
};
