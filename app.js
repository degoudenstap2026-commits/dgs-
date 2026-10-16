
async function loadSupabaseSdk(){
  if(window.supabase?.createClient)return true;
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  return !!window.supabase?.createClient;
}
function isSupabaseConfigured(){return window.SUPABASE_URL&&!window.SUPABASE_URL.includes('VUL_HIER')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('VUL_HIER')}
async function getSupabaseClient(){if(!isSupabaseConfigured())return null;await loadSupabaseSdk();if(!window.__goudenSupabase)window.__goudenSupabase=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);return window.__goudenSupabase}
async function loadData(){
 const client=await getSupabaseClient().catch(()=>null);
 if(client){const {data,error}=await client.from('site_content').select('content').eq('id',1).maybeSingle();if(!error&&data?.content&&Object.keys(data.content).length)return data.content;if(error)console.warn('Online inhoud niet geladen:',error.message)}
 const saved=localStorage.getItem('goudenstap-data');if(saved)return JSON.parse(saved);
 const r=await fetch('data.json');return r.json();
}
async function saveData(d){
 localStorage.setItem('goudenstap-data',JSON.stringify(d));
 const client=await getSupabaseClient().catch(()=>null);
 if(!client)return {cloud:false};
 const {data:sessionData}=await client.auth.getSession();
 if(!sessionData?.session)return {cloud:false,loginRequired:true};
 const {error}=await client.from('site_content').upsert({id:1,content:d},{onConflict:'id'});
 if(error)throw error;
 return {cloud:true};
}
function resetData(){if(confirm('Standaardgegevens opnieuw laden? Dit verwijdert de lokale kopie.')){localStorage.removeItem('goudenstap-data');location.reload()}}
function applySite(d){document.querySelectorAll('[data-site-name]').forEach(e=>e.textContent=d.site.name);document.querySelectorAll('[data-tagline]').forEach(e=>e.textContent=d.site.tagline);document.documentElement.style.setProperty('--primary',d.site.primary);document.documentElement.style.setProperty('--dark',d.site.dark);document.documentElement.style.setProperty('--cream',d.site.cream);document.documentElement.style.setProperty('--text',d.site.text);document.querySelectorAll('[data-footer]').forEach(e=>e.textContent=d.site.footer)}
