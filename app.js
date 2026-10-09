import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const url="https://naunzqclhsgwkmkdfmql.supabase.co";
const key=localStorage.getItem("delivery_lab_publishable_key")||prompt("Cole a chave publishable (sb_publishable_...) do projeto delivery-saas:");
if(!key||!key.startsWith("sb_publishable_"))throw Error("Chave publishable necessária.");
localStorage.setItem("delivery_lab_publishable_key",key);
const db=createClient(url,key),$=id=>document.getElementById(id);
let store=null,channel=null,poll=null,orders=[],refreshing=false;
const stages=[{id:"received",name:"Recebidos",color:"#dd9341"},{id:"preparing",name:"Preparando",color:"#4d87cb"},{id:"ready",name:"Prontos",color:"#41a17a"},{id:"out_for_delivery",name:"Em entrega",color:"#8470bb"},{id:"completed",name:"Finalizados",color:"#7d9184"}];
const labels={received:"Recebido",preparing:"Preparando",ready:"Pronto",out_for_delivery:"Saiu para entrega",completed:"Concluído",cancelled:"Cancelado"};
const money=n=>(n/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const say=(message,bad=false)=>{const n=$("notice");n.textContent=message;n.className=bad?"error":"ok";};
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
async function api(action,extra={}){
 const {data:{session}}=await db.auth.getSession();if(!session)throw Error("Faça login.");
 const res=await fetch(url+"/functions/v1/delivery-demo",{method:"POST",headers:{"Content-Type":"application/json","apikey":key,"Authorization":"Bearer "+session.access_token},body:JSON.stringify({action,...extra})});
 const data=await res.json();if(!res.ok)throw Error(data.error||"Erro na API");return data;
}
function actionFor(o){
 if(o.status==="received")return ["preparing","Iniciar preparo"];
 if(o.status==="preparing")return ["ready","Marcar pronto"];
 if(o.status==="ready")return o.fulfillment_type==="delivery"?["out_for_delivery","Saiu para entrega"]:["completed","Finalizar retirada"];
 if(o.status==="out_for_delivery")return ["completed","Concluir entrega"];
 return null;
}
async function changeStatus(o,target,button){
 if(target==="cancelled"&&!confirm("Cancelar o pedido #"+o.order_number+"?"))return;
 button.disabled=true;
 try{await api("change_status",{order_id:o.id,expected_status:o.status,new_status:target});say("Pedido #"+o.order_number+" atualizado: "+labels[target]);await refresh();}
 catch(e){say("Não foi possível atualizar: "+e.message,true);await refresh();}
 finally{button.disabled=false;}
}
function detail(o){
 $("modalTitle").textContent="Pedido #"+o.order_number;
 const root=$("modalContent");root.replaceChildren();
 for(const [label,value] of [["Cliente",o.customer_name],["Status",labels[o.status]||o.status],["Modalidade",o.fulfillment_type==="delivery"?"Entrega":"Retirada"],["Total",money(o.total_cents)],["Criado em",new Date(o.created_at).toLocaleString("pt-BR")]]){
 const p=el("p");p.append(el("strong",label+": "),document.createTextNode(String(value||"—")));root.append(p);}
 root.append(el("h3","Itens"));
 const ul=el("ul");for(const item of o.order_items||[])ul.append(el("li",item.quantity+"× "+item.product_name));root.append(ul);
 root.append(el("h3","Histórico de status"));
 const history=[...(o.order_status_history||[])].sort((a,b)=>new Date(a.changed_at)-new Date(b.changed_at));
 if(!history.length)root.append(el("p","Sem movimentações registradas.","muted"));
 for(const h of history)root.append(el("p",new Date(h.changed_at).toLocaleString("pt-BR")+" — "+(labels[h.old_status]||"Criado")+" → "+(labels[h.new_status]||h.new_status),"muted"));
 $("detailModal").classList.remove("hide");
}
function render(){
 const metrics=$("metrics");metrics.replaceChildren();
 for(const stage of stages.slice(0,3).concat(stages[4])){
  const card=el("div",undefined,"metric");const label=el("span");const dot=el("i",undefined,"mark");dot.style.background=stage.color;label.append(dot,document.createTextNode(stage.name));
  card.append(label,el("strong",String(orders.filter(o=>o.status===stage.id).length)));metrics.append(card);
 }
 const board=$("board");board.replaceChildren();
 const search=$("search").value.trim().toLocaleLowerCase("pt-BR"),sort=$("sort").value;
 const visible=orders.filter(o=>!search||String(o.order_number).includes(search)||(o.customer_name||"").toLocaleLowerCase("pt-BR").includes(search)).sort((a,b)=>sort==="oldest"?new Date(a.created_at)-new Date(b.created_at):new Date(b.created_at)-new Date(a.created_at));
 for(const stage of stages){
  const lane=el("section",undefined,"lane");lane.style.setProperty("--lane",stage.color);
  const subset=visible.filter(o=>o.status===stage.id);
  const head=el("div",undefined,"lane-head");head.append(el("span",stage.name),el("span",String(subset.length),"count"));lane.append(head);
  if(!subset.length)lane.append(el("div","Nenhum pedido","empty"));
  for(const o of subset){
   const card=el("article",undefined,"ticket");
   const top=el("div",undefined,"ticket-top");top.append(el("strong","#"+o.order_number),el("span",new Date(o.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})));card.append(top);
   card.append(el("div",o.customer_name||"Cliente de teste","ticket-name"));
   card.append(el("p",o.fulfillment_type==="delivery"?"🛵 Entrega":"🛍 Retirada"));
   card.append(el("p",(o.order_items||[]).map(i=>i.quantity+"× "+i.product_name).join(", ")));
   card.append(el("strong",money(o.total_cents)));
   const actions=el("div",undefined,"actions");const more=el("button","Detalhes","secondary");more.onclick=()=>detail(o);actions.append(more);
   const next=actionFor(o);if(next){const btn=el("button",next[1]);btn.onclick=()=>changeStatus(o,next[0],btn);actions.append(btn);}
   if(["received","preparing"].includes(o.status)){const cancel=el("button","Cancelar","danger");cancel.onclick=()=>changeStatus(o,"cancelled",cancel);actions.append(cancel);}
   card.append(actions);lane.append(card);
  }board.append(lane);
 }
}
async function refresh(){
 if(!store||refreshing)return;refreshing=true;
 try{
  const {data,error}=await db.from("orders").select("id,order_number,customer_name,status,total_cents,created_at,fulfillment_type,order_items(product_name,quantity),order_status_history(old_status,new_status,changed_at)").eq("establishment_id",store).order("created_at",{ascending:false}).limit(100);
  if(error)throw error;orders=data||[];render();
 }catch(e){say("Falha ao sincronizar pedidos: "+e.message,true);}finally{refreshing=false;}
}
async function start(){
 const {data:{user},error}=await db.auth.getUser();if(error&&!user)throw error;
 $("auth").classList.toggle("hide",!!user);$("app").classList.toggle("hide",!user);$("logout").classList.toggle("hide",!user);
 if(!user){store=null;orders=[];if(channel){await db.removeChannel(channel);channel=null;}clearInterval(poll);$("connection").textContent="Aguardando login";return;}
 $("who").textContent=user.email||"Conta de teste";
 store=(await api("bootstrap")).establishment_id;
 const {data:products,error:productError}=await db.from("products").select("id,name,price_cents").eq("establishment_id",store).eq("is_available",true).order("name");
 if(productError)throw productError;
 $("product").replaceChildren(...products.map(p=>{const option=el("option",p.name+" — "+money(p.price_cents));option.value=p.id;return option;}));
 await refresh();
 if(channel)await db.removeChannel(channel);
 channel=db.channel("orders-"+store).on("postgres_changes",{event:"*",schema:"public",table:"orders",filter:"establishment_id=eq."+store},()=>refresh()).subscribe(s=>{$("connection").textContent=s==="SUBSCRIBED"?"● Conectado":"Sincronizando";});
 clearInterval(poll);poll=setInterval(()=>{if(!document.hidden)refresh();},10000);
}
async function auth(mode){
 const btn=$(mode==="login"?"login":"signup");btn.disabled=true;
 try{
  const email=$("email").value.trim(),password=$("password").value;
  const {error}=mode==="signup"?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
  if(error)throw error;if(mode==="signup")say("Conta criada. Confirme o e-mail se necessário.");
  await start();
 }catch(e){say("Não foi possível entrar: "+e.message,true);}finally{btn.disabled=false;}
}
$("login").onclick=()=>auth("login");$("signup").onclick=()=>auth("signup");
$("logout").onclick=async()=>{await db.auth.signOut();await start();say("Sessão encerrada.");};
function tab(name){
 const panel=name==="panel";$("panelArea").classList.toggle("hide",!panel);$("sendArea").classList.toggle("hide",panel);
 $("tabPanel").classList.toggle("active",panel);$("tabSend").classList.toggle("active",!panel);if(panel)refresh();
}
$("tabPanel").onclick=()=>tab("panel");$("tabSend").onclick=()=>tab("send");
$("search").oninput=render;$("sort").onchange=render;$("reload").onclick=refresh;
$("modalClose").onclick=()=>$("detailModal").classList.add("hide");
$("detailModal").onclick=e=>{if(e.target===$("detailModal"))$("detailModal").classList.add("hide");};
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("detailModal").classList.add("hide");});
$("submit").onclick=async()=>{
 const btn=$("submit");btn.disabled=true;
 try{const result=await api("submit",{establishment_id:store,client_request_id:crypto.randomUUID(),customer_name:$("customer").value,product_id:$("product").value,quantity:Number($("quantity").value)});
 say("Pedido registrado! ID: "+result.order_id);await refresh();tab("panel");
 }catch(e){say("Falha ao enviar pedido: "+e.message,true);}finally{btn.disabled=false;}
};
start().catch(e=>say("Falha ao iniciar: "+e.message,true));
