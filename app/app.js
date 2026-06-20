/* ===== Observatorio EV · prototipo v2 ===== */
let DB=null, CARG=null, _map=null, _donut=null;
let FILTRO={region:'',vel:''};
const fmt=n=>(n||0).toLocaleString('es-CL');
const $=s=>document.querySelector(s);
const norm=s=>(s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();

function spark(serie,color){
  if(!serie||serie.length<2) return '';
  const w=120,h=34,mn=Math.min(...serie),mx=Math.max(...serie),rg=(mx-mn)||1;
  const pts=serie.map((v,i)=>[i/(serie.length-1)*w, h-((v-mn)/rg)*(h-6)-3]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area=d+` L${w} ${h} L0 ${h} Z`;
  const id='g'+Math.random().toString(36).slice(2,7);
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${pts.at(-1)[0].toFixed(1)}" cy="${pts.at(-1)[1].toFixed(1)}" r="3" fill="${color}"/></svg>`;
}
function kpi(o){
  return `<div class="kpi">
    <div class="top"><div class="ico" style="background:${o.bg};color:${o.c}">${o.icon}</div>
    <div class="lbl">${o.lbl}</div></div>
    <div class="val">${o.val}${o.unit?`<small>${o.unit}</small>`:''}</div>
    ${o.serie?spark(o.serie,o.c):''}</div>`;
}
const IC={
  bolt:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>',
  car:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3m-11 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3M19 6.5A1.5 1.5 0 0017.5 5h-11A1.5 1.5 0 005 6.5L3 12v8h2v-2h14v2h2v-8z"/></svg>',
  plug:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v6m10-6v6M5 8h14v2a7 7 0 01-6 6.9V22h-2v-5.1A7 7 0 015 10z"/></svg>',
  map:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7m0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5"/></svg>',
  sun:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7a5 5 0 100 10 5 5 0 000-10m0-5v3m0 14v3M2 12h3m14 0h3M4.2 4.2l2.1 2.1m11.4 11.4l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  bat:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h14v8H4zm15 2h2v4h-2M7 10l3 0-1 2 2 0-3 4 1-3-2 0z"/></svg>'
};
function velOf(c){const kw=+c.kw||0; if(c.t==='DC'||kw>=50)return 'DC'; if(kw<=7)return 'AC_lenta'; return 'AC_semi';}
function marca(s){return s;} // ya normalizado en datos

/* ===== PÁGINAS ===== */
function pageInicio(){
  const r=DB.resumen;
  return `<section class="page" id="p-inicio">
   <div class="hero">
     <h1>El observatorio de electromovilidad y energía de Chile</h1>
     <p>Datos oficiales de vehículos eléctricos, infraestructura de carga, generación renovable y almacenamiento — actualizados y listos para decidir dónde invertir.</p>
     <div class="herobtns"><button class="btn btn-primary" data-go="resumen">Ver resumen ejecutivo</button>
     <button class="btn btn-ghost" data-go="infra">Explorar infraestructura</button></div>
   </div>
   <div class="feat">
     <div class="f"><div class="fi">📈</div><h4>Mercado EV</h4><p>Penetración mensual y flota acumulada por tecnología y región.</p></div>
     <div class="f"><div class="fi">🔌</div><h4>Infraestructura</h4><p>${fmt(r.conectores.valor)} conectores públicos georreferenciados.</p></div>
     <div class="f"><div class="fi">☀️</div><h4>Energía y BESS</h4><p>${fmt(r.ernc_mw.valor)} MW renovables y ${fmt(r.bess_mwh.valor)} MWh de almacenamiento.</p></div>
     <div class="f"><div class="fi">🎯</div><h4>Oportunidades</h4><p>${fmt(r.comunas_sin.valor)} comunas aún sin carga pública.</p></div>
   </div></section>`;
}
function pageResumen(){
  const r=DB.resumen;
  const cards=[
    kpi({lbl:'Penetración EV (mensual)',val:r.penetracion.valor.toString().replace('.',','),unit:'%',serie:r.penetracion.serie,bg:'#EFF6FF',c:'#2563EB',icon:IC.bolt}),
    kpi({lbl:'Flota EV enchufable acumulada',val:fmt(r.evs_acum.valor),serie:r.evs_acum.serie,bg:'#ECFDF5',c:'#16A34A',icon:IC.car}),
    kpi({lbl:'Conectores públicos',val:fmt(r.conectores.valor),bg:'#FEF3C7',c:'#F59E0B',icon:IC.plug}),
    kpi({lbl:'Comunas sin cargador',val:fmt(r.comunas_sin.valor),unit:'/ '+r.comunas_sin.de,bg:'#FEE2E2',c:'#EF4444',icon:IC.map}),
    kpi({lbl:'Potencia renovable operativa',val:fmt(r.ernc_mw.valor),unit:'MW',bg:'#FEF9C3',c:'#CA8A04',icon:IC.sun}),
    kpi({lbl:'Almacenamiento BESS',val:fmt(r.bess_mwh.valor),unit:'MWh',bg:'#F3E8FF',c:'#7C3AED',icon:IC.bat})
  ].join('');
  return `<section class="page" id="p-resumen">
   <div class="page-head"><h1>Resumen Ejecutivo</h1>
     <p class="sub">Indicadores clave del ecosistema de electromovilidad y energía en Chile, consolidados desde fuentes oficiales.</p>
     <div class="meta"><span class="pill">📅 Actualizado: ${DB.fecha}</span></div>
   </div>
   <div class="grid g3">${cards}</div>
   <div class="insight"><div class="ic">i</div><div><b>Lectura ejecutiva.</b> La penetración EV mensual alcanza ${r.penetracion.valor.toString().replace('.',',')}% del mercado, con una flota enchufable acumulada de ${fmt(r.evs_acum.valor)} vehículos. La red pública suma ${fmt(r.conectores.valor)} conectores, pero ${fmt(r.comunas_sin.valor)} de ${r.comunas_sin.de} comunas siguen sin carga — la principal brecha y, a la vez, la mayor oportunidad de inversión.</div></div>
  </section>`;
}
function pageInfra(){
  const regsOpts=DB.regiones_orden.map(r=>`<option value="${r}"${FILTRO.region===r?' selected':''}>${r}</option>`).join('');
  return `<section class="page" id="p-infra">
   <div class="page-head"><h1>Infraestructura de Carga</h1>
     <p class="sub">Distribución, tecnología y operadores de la red pública de carga en Chile.</p>
     <div class="meta"><span class="pill">📅 ${DB.fecha}</span></div>
   </div>
   <div class="filterbar">
     <div class="fgroup"><label>Región</label>
       <select id="f-region"><option value="">Todo Chile</option>${regsOpts}</select></div>
     <div class="fgroup"><label>Velocidad de carga</label>
       <select id="f-vel"><option value="">Todas</option>
         <option value="AC_lenta"${FILTRO.vel==='AC_lenta'?' selected':''}>AC lenta (≤7 kW)</option>
         <option value="AC_semi"${FILTRO.vel==='AC_semi'?' selected':''}>AC semi-rápida (7–22 kW)</option>
         <option value="DC"${FILTRO.vel==='DC'?' selected':''}>DC rápida (≥50 kW)</option></select></div>
     <button class="btn btn-ghost" id="f-reset" style="align-self:flex-end">Limpiar filtros</button>
   </div>
   <div class="grid g4" id="infra-kpis" style="margin-bottom:16px"></div>
   <div class="grid g3" style="grid-template-columns:1.6fr 1fr;margin-bottom:16px">
     <div class="card"><h3>Mapa interactivo — Conectores públicos</h3><div class="csub" id="map-sub"></div>
       <div id="mapwrap" style="margin-top:12px"></div>
       <div style="display:flex;gap:18px;margin-top:10px;font-size:12.5px;flex-wrap:wrap">
         <span class="legrow"><i class="dot" style="background:#16A34A"></i> AC lenta (≤7 kW)</span>
         <span class="legrow"><i class="dot" style="background:#2563EB"></i> AC semi-rápida (7–22 kW)</span>
         <span class="legrow"><i class="dot" style="background:#EF4444"></i> DC rápida (≥50 kW)</span></div>
       <div class="card-src">Fuente: Superintendencia de Electricidad y Combustibles (SEC) · ${DB.fecha}</div>
     </div>
     <div class="card"><h3>Conectores por velocidad</h3><div class="csub">Mix tecnológico de la red.</div>
       <div style="position:relative;height:210px;margin-top:10px"><canvas id="donut"></canvas></div>
       <div id="donut-leg" style="margin-top:8px"></div>
       <div class="card-src">Fuente: SEC · ${DB.fecha}</div>
     </div>
   </div>
   <div class="card"><h3>Ranking de operadores</h3><div class="csub" id="rank-sub">Participación por número de conectores públicos instalados.</div>
     <div style="margin-top:12px" id="rank-body"></div>
     <div class="card-src">Fuente: SEC, clasificación por instalador · ${DB.fecha}</div>
   </div>
   <div class="insight"><div class="ic">i</div><div id="infra-insight"></div></div>
  </section>`;
}
function soon(t,d){return `<section class="page"><div class="page-head"><h1>${t}</h1><p class="sub">${d}</p></div>
  <div class="card soon"><div class="big">🚧</div><h3>Sección en construcción</h3><p style="margin-top:6px">Este módulo formará parte de la versión completa del observatorio.</p></div></section>`;}

const PAGES={
  inicio:pageInicio, resumen:pageResumen, infra:pageInfra,
  mercado:()=>soon('Mercado EV','Ventas mensuales, penetración por tecnología y ranking de marcas y modelos.'),
  energia:()=>soon('Energía y BESS','Generación renovable, almacenamiento y ubicación de proyectos.'),
  inversion:()=>soon('Oportunidades de Inversión','Brechas, scoring de comunas y potencial de retorno.'),
  reportes:()=>soon('Reportes Regionales & Comunales','Fichas descargables por región y comuna.'),
  calc:()=>soon('Calculadora de Oportunidades','Simula inversión, demanda y retorno por comuna.'),
  metodo:()=>soon('Metodología','Fuentes, definiciones y procesos de actualización de los datos.')
};

function go(id){
  $('#main').innerHTML=PAGES[id]();
  const sec=$('#main .page'); if(sec) sec.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.toggle('active',a.dataset.go===id));
  document.getElementById('navlinks').classList.remove('open');
  window.scrollTo(0,0);
  if(id==='infra'){ FILTRO={region:'',vel:''}; bindInfraFilters(); renderInfra(); }
}
/* ---- Infraestructura: filtros + recálculo ---- */
function bindInfraFilters(){
  const fr=$('#f-region'),fv=$('#f-vel'),rs=$('#f-reset');
  if(fr) fr.onchange=e=>{FILTRO.region=e.target.value; renderInfra();};
  if(fv) fv.onchange=e=>{FILTRO.vel=e.target.value; renderInfra();};
  if(rs) rs.onclick=()=>{FILTRO={region:'',vel:''}; if(fr)fr.value='';if(fv)fv.value=''; renderInfra();};
}
function datosFiltrados(){
  return CARG.filter(c=>{
    if(FILTRO.region && c.r!==FILTRO.region) return false;
    if(FILTRO.vel && velOf(c)!==FILTRO.vel) return false;
    return true;
  });
}
function renderInfra(){
  const D=datosFiltrados();
  const total=D.length;
  const comunas=new Set(D.filter(c=>c.c).map(c=>norm(c.c)));
  const totComReg=FILTRO.region?(DB.comunas_por_region[FILTRO.region]||0):346;
  const sinCarga=Math.max(totComReg-comunas.size,0);
  const potMW=Math.round(D.reduce((a,c)=>a+(+c.kw||0),0)/1000*10)/10;
  // KPIs
  $('#infra-kpis').innerHTML=[
    kpi({lbl:'Conectores públicos',val:fmt(total),bg:'#FEF3C7',c:'#F59E0B',icon:IC.plug}),
    kpi({lbl:'Comunas con carga',val:fmt(comunas.size),bg:'#ECFDF5',c:'#16A34A',icon:IC.map}),
    kpi({lbl:'Comunas sin carga',val:fmt(sinCarga),unit:'/ '+totComReg,bg:'#FEE2E2',c:'#EF4444',icon:IC.map}),
    kpi({lbl:'Potencia instalada',val:fmt(potMW),unit:'MW',bg:'#EFF6FF',c:'#2563EB',icon:IC.bolt})
  ].join('');
  const ambito=FILTRO.region?FILTRO.region:'todo Chile';
  $('#map-sub').textContent=`${fmt(total)} puntos georreferenciados en ${ambito}. Color por velocidad de carga.`;
  // donut por velocidad
  const v={AC_lenta:0,AC_semi:0,DC:0}; D.forEach(c=>v[velOf(c)]++);
  if(_donut)_donut.destroy();
  const ctx=$('#donut'); if(ctx){_donut=new Chart(ctx,{type:'doughnut',
    data:{labels:['AC lenta','AC semi','DC rápida'],datasets:[{data:[v.AC_lenta,v.AC_semi,v.DC],backgroundColor:['#16A34A','#2563EB','#EF4444'],borderWidth:0}]},
    options:{cutout:'66%',plugins:{legend:{display:false}},maintainAspectRatio:false}});}
  $('#donut-leg').innerHTML=[
    ['#16A34A','AC lenta ≤7 kW',v.AC_lenta],['#2563EB','AC semi 7–22 kW',v.AC_semi],['#EF4444','DC ≥50 kW',v.DC]
  ].map(([c,n,val])=>`<div class="legrow"><i class="dot" style="background:${c}"></i><span class="nm">${n}</span><span class="vl">${fmt(val)}</span></div>`).join('');
  // ranking operadores (recalculado sobre filtro)
  const op={}; D.forEach(c=>{const k=c.op||'(sin operador)'; if(c.op)op[k]=(op[k]||0)+1;});
  let arr=Object.entries(op).sort((a,b)=>b[1]-a[1]);
  const top=arr.slice(0,5), otros=arr.slice(5).reduce((a,x)=>a+x[1],0);
  const totOp=arr.reduce((a,x)=>a+x[1],0)||1;
  const rows=[...top]; if(otros>0)rows.push(['Otros',otros]);
  const maxop=rows.length?rows[0][1]:1;
  $('#rank-sub').textContent=`Participación por número de conectores · ${ambito}.`;
  $('#rank-body').innerHTML=rows.length?rows.map((o,i)=>`<div class="rank" style="padding:7px 0;border-bottom:1px solid var(--line)">
     <div class="legrow"><span style="width:20px;font-weight:800;color:var(--muted)">${i+1}</span><span class="nm">${o[0]}</span><span class="vl">${fmt(o[1])} · ${(o[1]/totOp*100).toFixed(1)}%</span></div>
     <div class="bar"><i style="width:${(o[1]/maxop*100).toFixed(0)}%"></i></div></div>`).join('')
     :'<p style="color:var(--muted)">Sin operadores identificados en la selección.</p>';
  // insight
  $('#infra-insight').innerHTML=`<b>Lectura ejecutiva.</b> En ${ambito} hay ${fmt(total)} conectores públicos en ${fmt(comunas.size)} comunas; ${fmt(sinCarga)} de ${totComReg} comunas siguen sin carga. La carga rápida DC representa ${total?(v.DC/total*100).toFixed(0):0}% del total — clave para corredores interurbanos.`;
  renderMap(D);
}
function renderMap(D){
  const el=$('#mapwrap'); if(!el) return;
  if(_map){_map.remove();_map=null;}
  _map=L.map('mapwrap',{scrollWheelZoom:false}).setView([-35.5,-71.3],5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'© OpenStreetMap, © CARTO'}).addTo(_map);
  const col=c=>({AC_lenta:'#16A34A',AC_semi:'#2563EB',DC:'#EF4444'})[velOf(c)];
  const pts=[];
  D.forEach(c=>{ if(!c.lat||!c.lng)return; pts.push([c.lat,c.lng]);
    L.circleMarker([c.lat,c.lng],{radius:3.2,color:col(c),fillColor:col(c),fillOpacity:.75,weight:0})
     .bindPopup(`<b>${c.c||''}</b><br>${c.r||''}<br>${c.kw||'?'} kW · ${c.t||''}`).addTo(_map);
  });
  if(FILTRO.region && pts.length){ try{_map.fitBounds(pts,{padding:[25,25],maxZoom:11});}catch(e){} }
}
/* navegación delegada */
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]'); if(t){e.preventDefault();go(t.dataset.go);}});

/* boot */
Promise.all([
  fetch('data/datos.json?v=1781928845').then(r=>r.json()),
  fetch('data/cargadores.json?v=1781928845').then(r=>r.json())
]).then(([d,c])=>{
  DB=d; CARG=c;
  $('#foot-fecha').textContent='Actualizado '+d.fecha;
  go('inicio');
}).catch(e=>{$('#main').innerHTML='<p style="padding:40px">Error cargando datos: '+e+'</p>';});
