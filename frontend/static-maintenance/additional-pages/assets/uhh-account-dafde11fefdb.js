(() => {
  'use strict';
  const API = 'https://api.urbanhelphub.com/api';
  const mode = document.body.dataset.mode;
  const root = document.getElementById('account-app');
  const status = document.getElementById('page-status');
  const token = sessionStorage.getItem('urbanhelphub_token') || localStorage.getItem('urbanhelphub_token');
  const countries = ['Australia','Canada','Ghana','India','Ireland','Kenya','Nigeria','New Zealand','South Africa','United Arab Emirates','United Kingdom','United States'];
  const fields = [['name','Full name','text',true],['email','Email','email',true],['phone','Phone','tel'],['address_line_1','Street address','text'],['address_line_2','Address line 2','text'],['city','City','text',true],['province','Province / state','text',true],['postal_code','Postal code','text',true],['country','Country','select',true],['headline','Headline','text'],['bio','About you','textarea'],['date_of_birth','Date of birth','date']];
  let profile;
  function el(tag, props={}, ...children) {
    const node=document.createElement(tag);
    for(const [key,value] of Object.entries(props)) {
      if(key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(),value);
      else if(key==='className')node.className=value;
      else if(key==='text')node.textContent=value;
      else if(value!==undefined && value!==false)node.setAttribute(key,value===true?'':String(value));
    }
    for(const child of children.flat()) if(child!=null)node.append(child instanceof Node?child:document.createTextNode(String(child)));
    return node;
  }
  function message(text,error=false) {status.textContent=text;status.className=error?'notice error':'notice';status.hidden=!text;}
  async function api(path,options={}) {
    const response=await fetch(API+path,{...options,cache:'no-store',headers:{Accept:'application/json',Authorization:`Bearer ${token}`,...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
    if(response.status===401){window.location.assign('/login/');throw Error('Please sign in again.');}
    const result=await response.json();
    if(!response.ok||!result.success)throw Error(Object.values(result.errors||{}).flat()[0]||result.message||'Unable to complete this action.');
    return result.data ?? result;
  }
  function table(values) {
    return el('dl',{className:'details'},fields.map(([key,label])=>el('div',{},el('dt',{},label),el('dd',{},values?.[key]||'—'))));
  }
  function persistUser(user) {if(user)(localStorage.getItem('urbanhelphub_user')?localStorage:sessionStorage).setItem('urbanhelphub_user',JSON.stringify(user));}
  async function customer() {
    profile=await api('/customer/profile');persistUser(profile.user);
    root.replaceChildren();
    const current=el('section',{className:'panel'},el('h2',{},'Current approved details'),table(profile.current));
    const proposed=profile.pending?.proposed||profile.current;
    const form=el('form',{id:'profile-form'});
    for(const [key,label,type,required] of fields) {
      let input=el(type==='select'?'select':type==='textarea'?'textarea':'input',{name:key,id:'field-'+key,...(type==='select'||type==='textarea'?{}:{type}),required:!!required,autocomplete:key==='email'?'email':key==='name'?'name':undefined});
      if(type==='select'){input.append(el('option',{value:''},'Choose a country'));for(const country of countries)input.append(el('option',{value:country},country));}
      input.value=proposed[key]||'';
      if(key==='bio')input.maxLength=5000;
      else if(key!=='country'&&key!=='date_of_birth')input.maxLength=({phone:30,province:100,postal_code:20,city:120})[key]||255;
      form.append(el('label',{},el('span',{},label+(required?' *':'')),input));
    }
    const submit=el('button',{type:'submit'},profile.pending?'Update pending request':'Submit for approval');
    form.append(el('p',{className:'wide muted'},'Changes—including your postal code and province—take effect only after Admin approval. Existing tasks and payments keep their original details. If you change email, use the new address to sign in after approval.'),submit);
    form.addEventListener('submit',async event=>{
      event.preventDefault();submit.disabled=true;message('');
      const payload=Object.fromEntries(new FormData(form));payload.expected_revision=profile.pending?.revision??null;
      for(const key of Object.keys(payload))if(payload[key]==='')payload[key]=null;
      try {const result=await api('/customer/profile',{method:'PUT',body:JSON.stringify(payload)});await customer();message(result.message||'Changes submitted for Admin approval.');}
      catch(error){message(error.message,true);submit.disabled=false;}
    });
    const panel=el('section',{className:'panel'},el('h2',{},'Edit profile'),form);
    if(profile.pending)panel.prepend(el('p',{className:'notice'},'Awaiting Admin approval. Your current details remain active.'));
    else if(profile.latest)panel.prepend(el('p',{className:'notice'},`Latest request: ${profile.latest.status}${profile.latest.review_note?' — '+profile.latest.review_note:''}`));
    root.append(el('div',{className:'columns'},current,panel));
  }
  function comparison(item) {
    const body=el('tbody');
    for(const [key,label] of fields) if((item.current[key]||'')!==(item.proposed[key]||'')) {
      body.append(el('tr',{},el('th',{scope:'row'},label),el('td',{},item.current[key]||'—'),el('td',{},item.proposed[key]||'—')));
    }
    return el('div',{className:'table-scroll'},el('table',{},el('thead',{},el('tr',{},el('th',{},'Field'),el('th',{},'Current'),el('th',{},'Requested'))),body));
  }
  function requestCard(item) {
    const note=el('textarea',{placeholder:'Admin note (optional)',maxlength:2000,'aria-label':'Review note'});
    const card=el('article',{className:'panel',id:'request-'+item.id},el('h2',{},item.current.name||'Customer'),el('p',{className:'muted'},`Request #${item.id} · revision ${item.revision}`),comparison(item),note);
    const actions=el('div',{className:'actions'});
    for(const [decision,label] of [['approved','Approve changes'],['rejected','Reject changes']]) {
      const button=el('button',{type:'button',className:decision==='rejected'?'secondary':''},label);
      button.addEventListener('click',async()=>{
        for(const b of actions.querySelectorAll('button'))b.disabled=true;
        try {const result=await api(`/admin/review/customer-profiles/${item.id}`,{method:'PUT',body:JSON.stringify({decision,revision:item.revision,note:note.value})});await admin();message(result.message||'Review saved.');}
        catch(error){message(error.message,true);for(const b of actions.querySelectorAll('button'))b.disabled=false;}
      });actions.append(button);
    }
    card.append(actions);return card;
  }
  async function admin() {
    const pending=await api('/admin/review/customer-profiles');
    const users=mode==='customers'?await api('/admin/review/customers'):null;
    root.replaceChildren();
    const queue=el('section',{},el('h2',{},`Pending customer profile changes (${pending.length})`));
    if(!pending.length)queue.append(el('p',{className:'panel muted'},'No customer profile changes are awaiting approval.'));
    for(const item of pending)queue.append(requestCard(item));
    root.append(queue);
    if(users) {
      const list=el('section',{},el('h2',{},`Customers (${users.length})`));
      const search=el('input',{type:'search',placeholder:'Search customers by name, email, city or postal code','aria-label':'Search customers'});
      const cards=el('div',{className:'customer-list'});
      function draw(){cards.replaceChildren();const query=search.value.toLowerCase().trim();for(const user of users){if(![user.name,user.email,user.profile.city,user.profile.province,user.profile.postal_code].join(' ').toLowerCase().includes(query))continue;const card=el('details',{className:'panel'},el('summary',{},`${user.name} · ${user.email}${user.pending?' · Profile changes pending':''}`),table(user.profile));cards.append(card);}}
      search.addEventListener('input',draw);draw();list.append(search,cards);root.append(list);
    }
  }
  if(!token){window.location.replace('/login/');return;}
  (mode==='customer'?customer():admin()).catch(error=>message(error.message,true));
})();
