import { supabase } from './supabase.js';
import { AI_FUNCTION } from './config.js';
export async function callAI({action='chat',prompt='',history=[],storagePath='',mimeType=''}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) throw new Error('Your session has expired. Please sign in again.');
  const body=action==='vision'?{action,storagePath,mimeType}:{action,prompt,history};
  const res=await fetch(AI_FUNCTION,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||`AI request failed (${res.status})`);
  return data.text||'No AI response was generated.';
}
