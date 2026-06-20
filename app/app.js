/* ===== Observatorio EV · prototipo v2 ===== */
let DB=null, CARG=null, _map=null, _donut=null;
const fmt=n=>(n||0).toLocaleString('es-CL');
const $=s=>document.querySelector(s);

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
  const delta=o.delta!=null?`<div class="delta ${o.delta>=0?'up':'down'}">${o.delta>=0?'▲':'▼'} ${Math.abs(o.delta)}% ${o.deltaTxt||''}</div>`:'';
  return `<div class="kpi">
    <div class="top"><div class="ico" style="background:${o.bg};color:${o.c}">${o.icon}</div>
    <div class="lbl">${o.lbl}</div></div>
    <div class="val">${o.val}${o.unit?`<small>${o.unit}</small>`:''}</div>${delta}
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
    kpi({lbl:'Penetración EV (mensual)',val:r.penetracion.valor.toString().replace('.',',') ,unit:'%',serie:r.penetracion.serie,bg:'#EFF6FF',c:'#2563EB',icon:IC.bolt}),
    kpi({lbl:'Flota EV enchufable acumulada',val:fmt(r.evs_acum.valor),serie:r.evs_acum.serie,bg:'#ECFDF5',c:'#16A34A',icon:IC.car}),
    kpi({lbl:'Conectores públicos',val:fmt(r.conectores.valor),bg:'#FEF3C7',c:'#F59E0B',icon:IC.plug}),
    kpi({lbl:'Comunas sin cargador',val:fmt(r.comunas_sin.valor),unit:'/ '+r.comunas_sin.de,bg:'#FEE2E2',c:'#EF4444',icon:IC.map}),
    kpi({lbl:'Potencia renovable operativa',val:fmt(r.ernc_mw.valor),unit:'MW',bg:'#FEF9C3',c:'#CA8A04',icon:IC.sun}),
    kpi({lbl:'Almacenamiento BESS',val:fmt(r.bess_mwh.valor),unit:'MWh',bg:'#F3E8FF',c:'#7C3AED',icon:IC.bat})
  ].join('');
  return `<section class="page" id="p-resumen">
   <div class="page-head"><h1>Resumen Ejecutivo</h1>
     <p class="sub">Indicadores clave del ecosistema de electromovilidad y energía en Chile, consolidados desde fuentes oficiales.</p>
     <div class="meta"><span class="pill">📅 Actualizado: ${DB.fecha}</span><span class="pill">Fuentes: ${DB.fuentes}</span></div>
   </div>
   <div class="grid g3">${cards}</div>
   <div class="insight"><div class="ic">i</div><div><b>Lectura ejecutiva.</b> La penetración EV mensual alcanza ${r.penetracion.valor.toString().replace('.',',')}% del mercado, con una flota enchufable acumulada de ${fmt(r.evs_acum.valor)} vehículos. La red pública suma ${fmt(r.conectores.valor)} conectores, pero ${fmt(r.comunas_sin.valor)} de ${r.comunas_sin.de} comunas siguen sin carga — la principal brecha y, a la vez, la mayor oportunidad de inversión.</div></div>
  </section>`;
}
function pageInfra(){
  const f=DB.infraestructura, v=f.por_velocidad;
  const kpis=[
    kpi({lbl:'Conectores públicos',val:fmt(f.conectores),bg:'#FEF3C7',c:'#F59E0B',icon:IC.plug}),
    kpi({lbl:'Comunas con carga',val:fmt(f.comunas_con),bg:'#ECFDF5',c:'#16A34A',icon:IC.map}),
    kpi({lbl:'Comunas sin carga',val:fmt(f.comunas_sin),bg:'#FEE2E2',c:'#EF4444',icon:IC.map}),
    kpi({lbl:'Potencia instalada',val:fmt(f.potencia_mw),unit:'MW',bg:'#EFF6FF',c:'#2563EB',icon:IC.bolt})
  ].join('');
  const maxop=Math.max(...f.operadores.map(o=>o.n));
  const rank=f.operadores.map((o,i)=>`<div class="rank" style="padding:7px 0;border-bottom:1px solid var(--line)">
     <div class="legrow"><span style="width:20px;font-weight:800;color:var(--muted)">${i+1}</span><span class="nm">${o.nombre}</span><span class="vl">${fmt(o.n)} · ${o.pct}%</span></div>
     <div class="bar"><i style="width:${(o.n/maxop*100).toFixed(0)}%"></i></div></div>`).join('');
  return `<section class="page" id="p-infra">
   <div class="page-head"><h1>Infraestructura de Carga</h1>
     <p class="sub">Distribución, tecnología y operadores de la red pública de carga en Chile.</p>
     <div class="meta"><span class="pill">📅 ${DB.fecha}</span><span class="pill">Fuente: SEC</span></div>
   </div>
   <div class="grid g4" style="margin-bottom:16px">${kpis}</div>
   <div class="grid g3" style="grid-template-columns:1.6fr 1fr;margin-bottom:16px">
     <div class="card"><h3>Mapa interactivo — Conectores públicos</h3><div class="csub">${fmt(f.conectores)} puntos georreferenciados. Color por velocidad de carga.</div>
       <div id="mapwrap" style="margin-top:12px"></div>
       <div style="display:flex;gap:18px;margin-top:10px;font-size:12.5px;flex-wrap:wrap">
         <span class="legrow"><i class="dot" style="background:#16A34A"></i> AC lenta (≤7 kW)</span>
         <span class="legrow"><i class="dot" style="background:#2563EB"></i> AC semi-rápida (7–22 kW)</span>
         <span class="legrow"><i class="dot" style="background:#EF4444"></i> DC rápida (≥50 kW)</span></div>
       <div class="card-src">Fuente: Superintendencia de Electricidad y Combustibles (SEC) · ${DB.fecha}</div>
     </div>
     <div class="card"><h3>Conectores por velocidad</h3><div class="csub">Mix tecnológico de la red.</div>
       <div style="position:relative;height:210px;margin-top:10px"><canvas id="donut"></canvas></div>
       <div style="margin-top:8px">
         <div class="legrow"><i class="dot" style="background:#16A34A"></i><span class="nm">AC lenta ≤7 kW</span><span class="vl">${fmt(v.AC_lenta)}</span></div>
         <div class="legrow"><i class="dot" style="background:#2563EB"></i><span class="nm">AC semi 7–22 kW</span><span class="vl">${fmt(v.AC_semi)}</span></div>
         <div class="legrow"><i class="dot" style="background:#EF4444"></i><span class="nm">DC ≥50 kW</span><span class="vl">${fmt(v.DC)}</span></div>
       </div>
       <div class="card-src">Fuente: SEC · ${DB.fecha}</div>
     </div>
   </div>
   <div class="card"><h3>Ranking de operadores</h3><div class="csub">Participación por número de conectores públicos instalados.</div>
     <div style="margin-top:12px">${rank}</div>
     <div class="card-src">Fuente: SEC, clasificación por instalador · ${DB.fecha}</div>
   </div>
   <div class="insight"><div class="ic">i</div><div><b>Lectura ejecutiva.</b> La red la concentran dos actores — Enel X Way y Copec Voltex suman cerca del 66% de los conectores. La carga rápida DC ya representa ${(v.DC/f.conectores*100).toFixed(0)}% del total, señal de maduración hacia corredores interurbanos. Con ${fmt(f.comunas_sin)} comunas sin carga, el despliegue sigue concentrado en zonas urbanas de alta densidad.</div></div>
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
  if(id==='infra'){ renderMap(); renderDonut(); }
}
function renderDonut(){
  const v=DB.infraestructura.por_velocidad;
  const ctx=$('#donut'); if(!ctx) return;
  if(_donut) _donut.destroy();
  _donut=new Chart(ctx,{type:'doughnut',data:{labels:['AC lenta','AC semi','DC rápida'],
    datasets:[{data:[v.AC_lenta,v.AC_semi,v.DC],backgroundColor:['#16A34A','#2563EB','#EF4444'],borderWidth:0}]},
    options:{cutout:'66%',plugins:{legend:{display:false}},maintainAspectRatio:false}});
}
function renderMap(){
  const el=$('#mapwrap'); if(!el||!CARG) return;
  if(_map){_map.remove();_map=null;}
  _map=L.map('mapwrap',{scrollWheelZoom:false}).setView([-35.5,-71.3],5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'© OpenStreetMap, © CARTO'}).addTo(_map);
  const col=c=>{const kw=+c.kw||0; if(c.t==='DC'||kw>=50)return '#EF4444'; if(kw<=7)return '#16A34A'; return '#2563EB';};
  CARG.forEach(c=>{ if(!c.lat||!c.lng)return;
    L.circleMarker([c.lat,c.lng],{radius:3.2,color:col(c),fillColor:col(c),fillOpacity:.75,weight:0})
     .bindPopup(`<b>${c.c||''}</b><br>${c.r||''}<br>${c.kw||'?'} kW · ${c.t||''}`).addTo(_map);
  });
}
/* navegación delegada */
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]'); if(t){e.preventDefault();go(t.dataset.go);}});

/* boot */
Promise.all([
  fetch('data/datos.json?v=1781928227').then(r=>r.json()),
  fetch('data/cargadores.json?v=1781928227').then(r=>r.json())
]).then(([d,c])=>{
  DB=d; CARG=c;
  $('#foot-fuentes').textContent=d.fuentes;
  $('#foot-fecha').textContent='Actualizado '+d.fecha;
  go('inicio');
}).catch(e=>{$('#main').innerHTML='<p style="padding:40px">Error cargando datos: '+e+'</p>';});
