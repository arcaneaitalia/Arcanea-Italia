const { createClient } = require('@supabase/supabase-js');
exports.handler = async (event) => {
 const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
 if(event.httpMethod!=='POST') return {statusCode:405,headers,body:JSON.stringify({error:'Metodo non consentito.'})};
 const {SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}=process.env;
 if(!url||!key) return {statusCode:503,headers,body:JSON.stringify({error:'Configura Supabase nelle variabili Netlify.'})};
 const auth=event.headers.authorization||event.headers.Authorization||'';
 if(!auth.startsWith('Bearer ')) return {statusCode:401,headers,body:JSON.stringify({error:'Accedi prima di giocare.'})};
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try {
  const {data,error}=await db.auth.getUser(auth.slice(7));
  if(error||!data.user) return {statusCode:401,headers,body:JSON.stringify({error:'Sessione non valida.'})};
  if(!data.user.email_confirmed_at) return {statusCode:403,headers,body:JSON.stringify({error:'Conferma la tua email prima di giocare.'})};
  const {data:result,error:rpcError}=await db.rpc('arcanea_play_scratch',{p_user_id:data.user.id});
  if(rpcError){console.error(rpcError);return {statusCode:500,headers,body:JSON.stringify({error:'Errore nella registrazione della giocata.'})};}
  if(result?.error==='COOLDOWN') return {statusCode:429,headers,body:JSON.stringify({error:'Hai già giocato. Riprova dopo sette giorni.',next_play_at:result.next_play_at})};
  return {statusCode:200,headers,body:JSON.stringify(result)};
 } catch(e){console.error(e);return {statusCode:500,headers,body:JSON.stringify({error:'Errore temporaneo.'})};}
};
