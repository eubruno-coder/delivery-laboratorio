import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const url="https://naunzqclhsgwkmkdfmql.supabase.co";
const key=localStorage.getItem("delivery_lab_publishable_key")||prompt("Cole a chave publishable (sb_publishable_...) do projeto delivery-saas:");
if(!key||!key.startsWith("sb_publishable_"))throw Error("Chave publishable necessária.");
localStorage.setItem("delivery_lab_publishable_key",key);
const db=createClient(url,key);
const $=id=>document.getElementById(id);
let store=null,channel=null,poll=null;
const say=(message,bad=false)=>{const n=$("notice");n.textContent=message;n.className=bad?"error":"ok"};
const money=n=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
async function api(action,extra={}){
 const {data:{session}}=await db.auth.getSession();if(!session)throw Error("Faça login.");
 const res=await fetch(url+"/functions/v1/delivery-demo",{method:"POST",headers:{"Content-Type":"application/json","apikey":key,"Authorization":"Bearer "+session.access_token},body:JSON.stringify({action,...extra})});
 const data=await res.json();if(!res.ok)throw Error(data.error||"Erro na API");return data;
}
async function start(){
 const {data:{user}}=await db.auth.getUser();
 $("auth").classList.toggle("hide",!!user);$("app").classList.toggle("hide",!user);
 if(!user){store=null;if(channel){await db.removeChannel(channel);channel=null}clearInterval(poll);return}
 $("who").textContent=user.email||"Conta de teste";
 store=(await api("bootstrap")).establishment_id;
 const {data:products,error}=await db.from("products").select("id,name,price_cents").eq("establishment_id",store).eq("is_available",true).order("name");
 if(error)throw error;
 $("product").replaceChildren(...products.map(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.name+" — "+money(p.price_cents);return o}));
 await refresh();if(channel)await db.removeChannel(channel);
 channel=db.channel("orders-"+store).on("postgres_changes",{event:"INSERT",schema:"public",table:"orders",filter:"establishment_id=eq."+store},()=>{say("Novo pedido recebido!");refresh()}).subscribe(s=>$("connection").textContent=s==="SUBSCRIBED"?"Conectado":"Sincronizando");
 clearInterval(poll);poll=setInterval(()=>{if(!$("panelArea").classList.contains("hide"))refresh()},10000);
}
async function refresh(){
 if(!store)return;
 const {data,error}=await db.from("orders").select("id,order_number,customer_name,status,total_cents,created_at,order_items(product_name,quantity)").eq("establishment_id",store).order("created_at",{ascending:false}).limit(30);
 if(error){say(error.message,true);return}
 const root=$("orders");root.replaceChildren();
 if(!data.length){root.textContent="Nenhum pedido ainda.";return}
 for(const o of data){const div=document.createElement("div");div.className="order";const title=document.createElement("strong");title.textContent="Pedido #"+o.order_number+" • "+o.customer_name;const detail=document.createElement("p");detail.textContent=o.order_items.map(i=>i.quantity+"× "+i.product_name).join(", ");const status=document.createElement("small");status.textContent="Status: "+o.status+" • "+money(o.total_cents)+" • "+new Date(o.created_at).toLocaleString("pt-BR");div.append(title,detail,status);root.append(div)}
}
async function auth(mode){try{const email=$("email").value.trim(),password=$("password").value;const {error}=mode==="signup"?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});if(error)throw error;if(mode==="signup")say("Conta criada. Confirme seu e-mail se necessário.");await start()}catch(e){say(e.message,true)}}
$("login").onclick=()=>auth("login");$("signup").onclick=()=>auth("signup");
$("logout").onclick=async()=>{await db.auth.signOut();await start();say("Sessão encerrada.")};
$("tabSend").onclick=()=>{$("sendArea").classList.remove("hide");$("panelArea").classList.add("hide");$("tabSend").className="";$("tabPanel").className="secondary"};
$("tabPanel").onclick=()=>{$("panelArea").classList.remove("hide");$("sendArea").classList.add("hide");$("tabPanel").className="";$("tabSend").className="secondary";refresh()};
$("submit").onclick=async()=>{const btn=$("submit");btn.disabled=true;try{const result=await api("submit",{establishment_id:store,client_request_id:crypto.randomUUID(),customer_name:$("customer").value,product_id:$("product").value,quantity:Number($("quantity").value)});say("Pedido registrado! ID: "+result.order_id);await refresh()}catch(e){say(e.message,true)}finally{btn.disabled=false}};
start().catch(e=>say(e.message,true));