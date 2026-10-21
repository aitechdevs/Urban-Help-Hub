(e) => {
  'use strict';
  const R=e.i(71645), h=R.createElement, API=e.i(54858).API_URL;
  const auth=()=>sessionStorage.getItem('urbanhelphub_token')||localStorage.getItem('urbanhelphub_token');
  function destination(item){
    let user={};try{user=JSON.parse(sessionStorage.getItem('urbanhelphub_user')||localStorage.getItem('urbanhelphub_user')||'{}')}catch{}
    const helper=user.role==='helper'||location.pathname.startsWith('/helper/');
    const admin=user.role==='admin'||location.pathname.startsWith('/admin/');
    let data=item.data||{};if(typeof data==='string'){try{data=JSON.parse(data)}catch{data={}}}data=data||{};
    const task=Number(data.task_id);const query=Number.isSafeInteger(task)&&task>0?'?task='+task:'';
    if(item.type==='new_message')return {url:(helper?'/helper/messages/':'/messages/')+query,label:'Open conversation'};
    if(helper&&['completion_confirmed','payment_completed','payout_paid','payout_pending','payment_received'].includes(item.type))return {url:'/helper/earnings/',label:'View earnings and payout'};
    if(helper&&['helper_confirmed','job_started','task_updated','task_cancelled','helper_selected'].includes(item.type))return {url:'/helper/jobs/'+query,label:'View job'};
    if(!helper&&!admin&&['completion_requested','helper_accepted','job_started','task_updated'].includes(item.type))return {url:'/dashboard/'+query+'#uhh-tasks',label:item.type==='completion_requested'?'Review job completion':'Review task'};
    let raw=item.action_url;
    if(typeof raw==='string'&&raw.startsWith('/')&&!raw.startsWith('//')&&!raw.includes('\\')){
      try{const url=new URL(raw,location.origin);if(url.origin===location.origin)return {url:url.pathname+url.search+url.hash,label:'View details'}}catch{}
    }
    return {url:admin?'/admin/':helper?'/helper/dashboard/':'/dashboard/',label:'View dashboard'};
  }
  function Bell(){
    const [open,setOpen]=R.useState(false),[items,setItems]=R.useState([]),[unread,setUnread]=R.useState(0),[loading,setLoading]=R.useState(true);const ref=R.useRef(null);
    async function load(){if(!auth())return;try{const res=await fetch(API+'/notifications',{headers:{Accept:'application/json',Authorization:'Bearer '+auth()}});const p=await res.json();if(res.ok&&p.success){setItems(p.data.notifications||[]);setUnread(Number(p.data.unread_count||0))}}catch{}finally{setLoading(false)}}
    R.useEffect(()=>{load();const timer=window.setInterval(load,30000);return()=>window.clearInterval(timer)},[]);
    R.useEffect(()=>{const close=event=>{if(ref.current&&!ref.current.contains(event.target))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
    async function read(item){if(item.read_at)return;try{const res=await fetch(API+'/notifications/'+item.id+'/read',{method:'PUT',headers:{Accept:'application/json',Authorization:'Bearer '+auth()}});if(res.ok){setItems(list=>list.map(n=>n.id===item.id?{...n,read_at:new Date().toISOString()}:n));setUnread(n=>Math.max(0,n-1))}}catch{}}
    async function all(){try{const res=await fetch(API+'/notifications/read-all',{method:'PUT',headers:{Accept:'application/json',Authorization:'Bearer '+auth()}});if(res.ok){setItems(list=>list.map(n=>({...n,read_at:n.read_at||new Date().toISOString()})));setUnread(0)}}catch{}}
    return h('div',{ref,className:'relative'},h('button',{type:'button','aria-label':`Notifications${unread?', '+unread+' unread':''}`,'aria-expanded':open,onClick:()=>setOpen(x=>!x),className:'relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-xl text-[#082f5b] transition hover:bg-slate-50'},'🔔',unread>0&&h('span',{className:'absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-xs font-bold text-white'},unread>99?'99+':unread)),open&&h('div',{className:'absolute right-0 top-12 z-[80] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl'},h('div',{className:'flex items-center justify-between border-b border-slate-100 px-4 py-3'},h('div',null,h('p',{className:'font-black text-[#082f5b]'},'Notifications'),h('p',{className:'text-xs text-slate-500'},unread+' unread')),unread>0&&h('button',{type:'button',onClick:all,className:'text-xs font-bold text-green-700 hover:underline'},'Mark all read')),h('div',{className:'max-h-[420px] overflow-y-auto'},loading?h('p',{className:'p-6 text-center text-sm text-slate-500'},'Loading notifications…'):items.length===0?h('p',{className:'p-6 text-center text-sm text-slate-500'},'No notifications yet'):items.map(item=>{const target=destination(item);return h('a',{key:item.id,href:target.url,onClick:()=>{read(item);setOpen(false)},className:`block w-full cursor-pointer border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${item.read_at?'bg-white':'bg-green-50/60'}`,style:{textDecoration:'none'},'aria-label':item.title+': '+target.label},h('span',{className:'block text-sm font-black text-[#082f5b]'},item.title),h('span',{className:'mt-1 block text-sm leading-5 text-slate-600'},item.message),h('span',{className:'mt-2 block text-xs font-bold text-green-700',style:{textDecoration:'underline'}},target.label))}))))
  }
  e.s(['default',0,Bell]);
}
