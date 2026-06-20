/* ===== Observatorio EV · v2 ===== */
let DB=null, CARG=null, _map=null, _donut=null, _chart=null, _emap=null, _edonut=null;
const DATA={};            // cache de datasets por seccion
const F={};               // filtros por seccion
const fmt=n=>(Math.round((n||0)*10)/10).toLocaleString('es-CL');
const fint=n=>Math.round(n||0).toLocaleString('es-CL');
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const norm=s=>(s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
const V='1781929676';
async function load(name){ if(DATA[name])return DATA[name];
  DATA[name]=await fetch(`data/${name}.json?v=${V}`).then(r=>r.json()); return DATA[name]; }

function spark(serie,color){
  if(!serie||serie.length<2) return '';
  const w=120,h=34,mn=Math.min(...serie),mx=Math.max(...serie),rg=(mx-mn)||1;
  const pts=serie.map((v,i)=>[i/(serie.length-1)*w, h-((v-mn)/rg)*(h-6)-3]);
  const dd=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const id='g'+Math.random().toString(36).slice(2,7);
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${dd} L${w} ${h} L0 ${h} Z" fill="url(#${id})"/><path d="${dd}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts.at(-1)[0].toFixed(1)}" cy="${pts.at(-1)[1].toFixed(1)}" r="3" fill="${color}"/></svg>`;
}
function kpi(o){return `<div class="kpi"><div class="top"><div class="ico" style="background:${o.bg};color:${o.c}">${o.icon}</div><div class="lbl">${o.lbl}</div></div><div class="val">${o.val}${o.unit?`<small>${o.unit}</small>`:''}</div>${o.serie?spark(o.serie,o.c):''}</div>`;}
const IC={
  bolt:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>',
  car:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3m-11 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3M19 6.5A1.5 1.5 0 0017.5 5h-11A1.5 1.5 0 005 6.5L3 12v8h2v-2h14v2h2v-8z"/></svg>',
  plug:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v6m10-6v6M5 8h14v2a7 7 0 01-6 6.9V22h-2v-5.1A7 7 0 015 10z"/></svg>',
  map:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7m0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5"/></svg>',
  sun:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7a5 5 0 100 10 5 5 0 000-10m0-5v3m0 14v3M2 12h3m14 0h3M4.2 4.2l2.1 2.1m11.4 11.4l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  bat:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h14v8H4zm15 2h2v4h-2M7 10l3 0-1 2 2 0-3 4 1-3-2 0z"/></svg>',
  target:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20m0 4a6 6 0 100 12 6 6 0 000-12m0 4a2 2 0 100 4 2 2 0 000-4"/></svg>',
  doc:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h9l5 5v15H6zm8 1.5V8h4.5"/></svg>',
  calc:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12v20H6zm2 3h8v3H8zm0 5h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2zM8 14h2v2H8zm3 0h2v2h-2zm3 0h2v5h-2zM8 17h2v2H8zm3 0h2v2h-2z"/></svg>'
};
function velOf(c){const kw=+c.kw||0; if(c.t==='DC'||kw>=50)return 'DC'; if(kw<=7)return 'AC_lenta'; return 'AC_semi';}
const COLS={BEV:'#2563EB',PHEV:'#16A34A',HEV:'#F59E0B',MHEV:'#7C3AED',EBUS:'#0D9488',ETRUCK:'#EF4444'};
const REGS=()=>DB.regiones_orden;
function fopt(arr,sel){return arr.map(r=>`<option value="${r}"${sel===r?' selected':''}>${r}</option>`).join('');}
function destroyCharts(){[_donut,_chart,_edonut].forEach(c=>{try{c&&c.destroy()}catch(e){}});_donut=_chart=_edonut=null;
  if(_map){try{_map.remove()}catch(e){}_map=null;} if(_emap){try{_emap.remove()}catch(e){}_emap=null;}}

/* ===== INICIO ===== */
function pageInicio(){const r=DB.resumen;
  return `<div class="hero"><h1>El observatorio de electromovilidad y energía de Chile</h1>
   <p>Datos oficiales de vehículos eléctricos, infraestructura de carga, generación renovable y almacenamiento — actualizados y listos para decidir dónde invertir.</p>
   <div class="herobtns"><button class="btn btn-primary" data-go="resumen">Ver resumen ejecutivo</button><button class="btn btn-ghost" data-go="infra">Explorar infraestructura</button></div></div>
   <div class="feat">
     <div class="f" data-go="mercado" style="cursor:pointer"><div class="fi">📈</div><h4>Mercado EV</h4><p>Penetración mensual y flota acumulada por tecnología y región.</p></div>
     <div class="f" data-go="infra" style="cursor:pointer"><div class="fi">🔌</div><h4>Infraestructura</h4><p>${fint(r.conectores.valor)} conectores públicos georreferenciados.</p></div>
     <div class="f" data-go="energia" style="cursor:pointer"><div class="fi">☀️</div><h4>Energía y BESS</h4><p>${fint(r.ernc_mw.valor)} MW renovables y ${fint(r.bess_mwh.valor)} MWh de almacenamiento.</p></div>
     <div class="f" data-go="inversion" style="cursor:pointer"><div class="fi">🎯</div><h4>Oportunidades</h4><p>${fint(r.comunas_sin.valor)} comunas aún sin carga pública.</p></div>
   </div>`;
}
/* ===== RESUMEN ===== */
function pageResumen(){const r=DB.resumen;
  const cards=[
    kpi({lbl:'Penetración EV (mensual)',val:(''+r.penetracion.valor).replace('.',','),unit:'%',serie:r.penetracion.serie,bg:'#EFF6FF',c:'#2563EB',icon:IC.bolt}),
    kpi({lbl:'Flota EV enchufable acumulada',val:fint(r.evs_acum.valor),serie:r.evs_acum.serie,bg:'#ECFDF5',c:'#16A34A',icon:IC.car}),
    kpi({lbl:'Conectores públicos',val:fint(r.conectores.valor),bg:'#FEF3C7',c:'#F59E0B',icon:IC.plug}),
    kpi({lbl:'Comunas sin cargador',val:fint(r.comunas_sin.valor),unit:'/ '+r.comunas_sin.de,bg:'#FEE2E2',c:'#EF4444',icon:IC.map}),
    kpi({lbl:'Potencia renovable operativa',val:fint(r.ernc_mw.valor),unit:'MW',bg:'#FEF9C3',c:'#CA8A04',icon:IC.sun}),
    kpi({lbl:'Almacenamiento BESS',val:fint(r.bess_mwh.valor),unit:'MWh',bg:'#F3E8FF',c:'#7C3AED',icon:IC.bat})
  ].join('');
  return `<div class="page-head"><h1>Resumen Ejecutivo</h1><p class="sub">Indicadores clave del ecosistema de electromovilidad y energía en Chile, consolidados desde fuentes oficiales.</p><div class="meta"><span class="pill">📅 Actualizado: ${DB.fecha}</span></div></div>
   <div class="grid g3">${cards}</div>
   <div class="insight"><div class="ic">i</div><div><b>Lectura ejecutiva.</b> La penetración EV mensual alcanza ${(''+r.penetracion.valor).replace('.',',')}% del mercado, con una flota enchufable acumulada de ${fint(r.evs_acum.valor)} vehículos. La red pública suma ${fint(r.conectores.valor)} conectores, pero ${fint(r.comunas_sin.valor)} de ${r.comunas_sin.de} comunas siguen sin carga — la principal brecha y la mayor oportunidad de inversión.</div></div>`;
}
/* ===== INFRAESTRUCTURA ===== */
function pageInfra(){F.infra={region:'',vel:''};
  return `<div class="page-head"><h1>Infraestructura de Carga</h1><p class="sub">Distribución, tecnología y operadores de la red pública de carga en Chile.</p><div class="meta"><span class="pill">📅 ${DB.fecha}</span></div></div>
   <div class="filterbar">
     <div class="fgroup"><label>Región</label><select id="if-reg"><option value="">Todo Chile</option>${fopt(REGS())}</select></div>
     <div class="fgroup"><label>Velocidad de carga</label><select id="if-vel"><option value="">Todas</option><option value="AC_lenta">AC lenta (≤7 kW)</option><option value="AC_semi">AC semi-rápida (7–22 kW)</option><option value="DC">DC rápida (≥50 kW)</option></select></div>
     <button class="btn btn-ghost" id="if-reset" style="align-self:flex-end">Limpiar filtros</button></div>
   <div class="grid g4" id="if-kpis" style="margin-bottom:16px"></div>
   <div class="grid g3" style="grid-template-columns:1.6fr 1fr;margin-bottom:16px">
     <div class="card"><h3>Mapa interactivo — Conectores públicos</h3><div class="csub" id="if-mapsub"></div><div id="mapwrap" style="margin-top:12px"></div>
       <div style="display:flex;gap:18px;margin-top:10px;font-size:12.5px;flex-wrap:wrap"><span class="legrow"><i class="dot" style="background:#16A34A"></i> AC lenta (≤7 kW)</span><span class="legrow"><i class="dot" style="background:#2563EB"></i> AC semi (7–22 kW)</span><span class="legrow"><i class="dot" style="background:#EF4444"></i> DC rápida (≥50 kW)</span></div>
       <div class="card-src">Fuente: Superintendencia de Electricidad y Combustibles (SEC) · ${DB.fecha}</div></div>
     <div class="card"><h3>Conectores por velocidad</h3><div class="csub">Mix tecnológico de la red.</div><div style="position:relative;height:210px;margin-top:10px"><canvas id="donut"></canvas></div><div id="donut-leg" style="margin-top:8px"></div><div class="card-src">Fuente: SEC · ${DB.fecha}</div></div></div>
   <div class="card"><h3>Ranking de operadores</h3><div class="csub" id="if-ranksub"></div><div style="margin-top:12px" id="if-rank"></div><div class="card-src">Fuente: SEC, clasificación por instalador · ${DB.fecha}</div></div>
   <div class="insight"><div class="ic">i</div><div id="if-insight"></div></div>`;
}
function bindInfra(){const r=$('#if-reg'),v=$('#if-vel'),x=$('#if-reset');
  r.onchange=e=>{F.infra.region=e.target.value;renderInfra();};
  v.onchange=e=>{F.infra.vel=e.target.value;renderInfra();};
  x.onclick=()=>{F.infra={region:'',vel:''};r.value='';v.value='';renderInfra();};}
function renderInfra(){const f=F.infra;
  const D=CARG.filter(c=>(!f.region||c.r===f.region)&&(!f.vel||velOf(c)===f.vel));
  const total=D.length, comunas=new Set(D.filter(c=>c.c).map(c=>norm(c.c)));
  const totCom=f.region?(DB.comunas_por_region[f.region]||0):346, sin=Math.max(totCom-comunas.size,0);
  const pot=D.reduce((a,c)=>a+(+c.kw||0),0)/1000;
  $('#if-kpis').innerHTML=[
    kpi({lbl:'Conectores públicos',val:fint(total),bg:'#FEF3C7',c:'#F59E0B',icon:IC.plug}),
    kpi({lbl:'Comunas con carga',val:fint(comunas.size),bg:'#ECFDF5',c:'#16A34A',icon:IC.map}),
    kpi({lbl:'Comunas sin carga',val:fint(sin),unit:'/ '+totCom,bg:'#FEE2E2',c:'#EF4444',icon:IC.map}),
    kpi({lbl:'Potencia instalada',val:fmt(pot),unit:'MW',bg:'#EFF6FF',c:'#2563EB',icon:IC.bolt})].join('');
  const amb=f.region||'todo Chile';
  $('#if-mapsub').textContent=`${fint(total)} puntos georreferenciados en ${amb}. Color por velocidad de carga.`;
  const vv={AC_lenta:0,AC_semi:0,DC:0}; D.forEach(c=>vv[velOf(c)]++);
  if(_donut)_donut.destroy(); const ctx=$('#donut');
  if(ctx)_donut=new Chart(ctx,{type:'doughnut',data:{labels:['AC lenta','AC semi','DC rápida'],datasets:[{data:[vv.AC_lenta,vv.AC_semi,vv.DC],backgroundColor:['#16A34A','#2563EB','#EF4444'],borderWidth:0}]},options:{cutout:'66%',plugins:{legend:{display:false}},maintainAspectRatio:false}});
  $('#donut-leg').innerHTML=[['#16A34A','AC lenta ≤7 kW',vv.AC_lenta],['#2563EB','AC semi 7–22 kW',vv.AC_semi],['#EF4444','DC ≥50 kW',vv.DC]].map(([c,n,val])=>`<div class="legrow"><i class="dot" style="background:${c}"></i><span class="nm">${n}</span><span class="vl">${fint(val)}</span></div>`).join('');
  const op={}; D.forEach(c=>{if(c.op)op[c.op]=(op[c.op]||0)+1;});
  let arr=Object.entries(op).sort((a,b)=>b[1]-a[1]); const top=arr.slice(0,5),ot=arr.slice(5).reduce((a,x)=>a+x[1],0),tot=arr.reduce((a,x)=>a+x[1],0)||1;
  const rows=[...top]; if(ot>0)rows.push(['Otros',ot]); const mx=rows.length?rows[0][1]:1;
  $('#if-ranksub').textContent=`Participación por número de conectores · ${amb}.`;
  $('#if-rank').innerHTML=rows.length?rows.map((o,i)=>`<div class="rank" style="padding:7px 0;border-bottom:1px solid var(--line)"><div class="legrow"><span style="width:20px;font-weight:800;color:var(--muted)">${i+1}</span><span class="nm">${o[0]}</span><span class="vl">${fint(o[1])} · ${(o[1]/tot*100).toFixed(1)}%</span></div><div class="bar"><i style="width:${(o[1]/mx*100).toFixed(0)}%"></i></div></div>`).join(''):'<p style="color:var(--muted)">Sin operadores en la selección.</p>';
  $('#if-insight').innerHTML=`<b>Lectura ejecutiva.</b> En ${amb} hay ${fint(total)} conectores en ${fint(comunas.size)} comunas; ${fint(sin)} de ${totCom} siguen sin carga. La carga rápida DC representa ${total?(vv.DC/total*100).toFixed(0):0}% del total.`;
  drawMap('mapwrap',D,f.region);
}
function drawMap(id,D,region){const el=$('#'+id); if(!el)return;
  if(_map){try{_map.remove()}catch(e){}_map=null;}
  _map=L.map(id,{scrollWheelZoom:false}).setView([-35.5,-71.3],5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'© OpenStreetMap, © CARTO'}).addTo(_map);
  const col=c=>({AC_lenta:'#16A34A',AC_semi:'#2563EB',DC:'#EF4444'})[velOf(c)]; const pts=[];
  D.forEach(c=>{if(!c.lat||!c.lng)return;pts.push([c.lat,c.lng]);L.circleMarker([c.lat,c.lng],{radius:3.2,color:col(c),fillColor:col(c),fillOpacity:.75,weight:0}).bindPopup(`<b>${c.c||''}</b><br>${c.r||''}<br>${c.kw||'?'} kW · ${c.t||''}`).addTo(_map);});
  if(region&&pts.length){try{_map.fitBounds(pts,{padding:[25,25],maxZoom:11})}catch(e){}}}

/* ===== MERCADO EV ===== */
const TECHS=['BEV','PHEV','HEV','MHEV','EBUS','ETRUCK'];
async function pageMercado(){const M=await load('mercado');
  F.merc={anio:'',tech:'',q:'',orden:'anio'};
  const anios=[...new Set(M.meses.map(m=>m.slice(0,4)))].sort();
  return `<div class="page-head"><h1>Mercado EV</h1><p class="sub">Ventas mensuales, penetración por tecnología y ranking de marcas y modelos.</p><div class="meta"><span class="pill">📅 ${DB.fecha}</span></div></div>
   <div class="filterbar">
     <div class="fgroup"><label>Año</label><select id="mf-anio"><option value="">Todos</option>${fopt(anios)}</select></div>
     <div class="fgroup"><label>Tecnología</label><select id="mf-tech"><option value="">Todas</option>${TECHS.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div>
     <button class="btn btn-ghost" id="mf-reset" style="align-self:flex-end">Limpiar filtros</button></div>
   <div class="grid g4" id="mc-kpis" style="margin-bottom:16px"></div>
   <div class="grid g3" style="grid-template-columns:1.6fr 1fr;margin-bottom:16px">
     <div class="card"><h3>Ventas mensuales por tecnología</h3><div class="csub" id="mc-chsub">Últimos 12 meses.</div><div style="position:relative;height:280px;margin-top:12px"><canvas id="mc-chart"></canvas></div><div class="card-src">Fuente: ANAC · vehículos eléctricos Chile mensual · ${DB.fecha}</div></div>
     <div class="card"><h3>Mix tecnológico</h3><div class="csub" id="mc-donsub">Participación por tecnología.</div><div style="position:relative;height:210px;margin-top:10px"><canvas id="mc-donut"></canvas></div><div id="mc-donleg" style="margin-top:8px"></div><div class="card-src">Fuente: ANAC · ${DB.fecha}</div></div></div>
   <div class="card" style="margin-bottom:16px"><h3>Ranking de marcas</h3><div class="csub" id="mc-ranksub">Por unidades acumuladas en el año.</div><div style="margin-top:12px" id="mc-rank"></div><div class="card-src">Fuente: ANAC · marcas de EVs por mes · ${DB.fecha}</div></div>
   <div class="card"><h3>Buscador de vehículos — marca y modelo</h3><div class="csub">Vehículos homologados y ventas. Ordena por año, modelo o tecnología.</div>
     <div class="filterbar" style="box-shadow:none;border:none;padding:10px 0;margin:8px 0 4px">
       <div class="fgroup" style="flex:1"><label>Buscar marca o modelo</label><input id="mc-q" type="text" placeholder="Ej: BYD, Tesla, Dolphin…" style="padding:9px 12px;border:1.5px solid var(--line);border-radius:9px;font-size:13.5px"></div>
       <div class="fgroup"><label>Ordenar por</label><select id="mc-orden"><option value="anio">Año (desc)</option><option value="modelo">Modelo (A-Z)</option><option value="tech">Tecnología</option></select></div></div>
     <div id="mc-busca"></div><div class="card-src">Fuente: ANAC · vehículos homologados y link de ficha de seguridad · ${DB.fecha}</div></div>
   <div class="insight"><div class="ic">i</div><div id="mc-insight"></div></div>`;
}
function bindMercado(){const M=DATA.mercado;
  $('#mf-anio').onchange=e=>{F.merc.anio=e.target.value;renderMercado();};
  $('#mf-tech').onchange=e=>{F.merc.tech=e.target.value;renderMercado();};
  $('#mf-reset').onclick=()=>{F.merc={anio:'',tech:'',q:'',orden:'anio'};$('#mf-anio').value='';$('#mf-tech').value='';$('#mc-q').value='';renderMercado();renderBuscador();};
  let t;$('#mc-q').oninput=e=>{F.merc.q=e.target.value;clearTimeout(t);t=setTimeout(renderBuscador,180);};
  $('#mc-orden').onchange=e=>{F.merc.orden=e.target.value;renderBuscador();};}
function renderMercado(){const M=DATA.mercado,f=F.merc;
  const meses=f.anio?M.serie.filter(s=>s.mes.startsWith(f.anio)):M.serie;
  const techs=f.tech?[f.tech]:TECHS;
  // KPIs: ultimo mes enchufables, acumulado periodo, marcas activas, modelos homologados
  const ult=M.serie.at(-1); const enchUlt=(ult.bev||0)+(ult.phev||0);
  const acum=meses.reduce((a,s)=>a+techs.reduce((x,t)=>x+(s[t.toLowerCase()]||0),0),0);
  const marcasAct=M.marcas.filter(m=>m.a2026>0).length;
  $('#mc-kpis').innerHTML=[
    kpi({lbl:'Enchufables último mes (BEV+PHEV)',val:fint(enchUlt),bg:'#EFF6FF',c:'#2563EB',icon:IC.car}),
    kpi({lbl:(f.tech||'Total')+' en el periodo',val:fint(acum),unit:'u',bg:'#ECFDF5',c:'#16A34A',icon:IC.bolt}),
    kpi({lbl:'Marcas activas (2026)',val:fint(marcasAct),bg:'#FEF3C7',c:'#F59E0B',icon:IC.target}),
    kpi({lbl:'Modelos homologados',val:fint(M.homol.length),bg:'#F3E8FF',c:'#7C3AED',icon:IC.doc})].join('');
  // chart: ultimos 12 meses (o del año) apilado por tecnologia
  const last=meses.slice(-12); const labels=last.map(s=>s.mes.slice(2));
  const ds=techs.map(t=>({label:t,data:last.map(s=>s[t.toLowerCase()]||0),backgroundColor:COLS[t],borderWidth:0}));
  $('#mc-chsub').textContent=f.anio?`Año ${f.anio}.`:'Últimos 12 meses.';
  if(_chart)_chart.destroy(); const cx=$('#mc-chart');
  if(cx)_chart=new Chart(cx,{type:'bar',data:{labels,datasets:ds},options:{responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true,ticks:{font:{size:10}}},y:{stacked:true}},plugins:{legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}}}}});
  // donut mix tecnologico (periodo)
  const mix=TECHS.map(t=>meses.reduce((a,s)=>a+(s[t.toLowerCase()]||0),0));
  if(_donut)_donut.destroy(); const dc=$('#mc-donut');
  if(dc)_donut=new Chart(dc,{type:'doughnut',data:{labels:TECHS,datasets:[{data:mix,backgroundColor:TECHS.map(t=>COLS[t]),borderWidth:0}]},options:{cutout:'62%',plugins:{legend:{display:false}},maintainAspectRatio:false}});
  const tot=mix.reduce((a,b)=>a+b,0)||1;
  $('#mc-donleg').innerHTML=TECHS.map((t,i)=>`<div class="legrow"><i class="dot" style="background:${COLS[t]}"></i><span class="nm">${t}</span><span class="vl">${fint(mix[i])} · ${(mix[i]/tot*100).toFixed(0)}%</span></div>`).join('');
  // ranking marcas
  let mk=[...M.marcas]; if(f.tech==='BEV')mk.sort((a,b)=>b.bev-a.bev); else if(f.tech==='PHEV')mk.sort((a,b)=>b.phev-a.phev); else mk.sort((a,b)=>b.a2026-a.a2026);
  mk=mk.filter(m=>(f.tech==='BEV'?m.bev:f.tech==='PHEV'?m.phev:m.a2026)>0).slice(0,10);
  const vget=m=>f.tech==='BEV'?m.bev:f.tech==='PHEV'?m.phev:m.a2026;
  const mx=mk.length?vget(mk[0]):1;
  $('#mc-ranksub').textContent=f.tech?`Top marcas ${f.tech} (último mes).`:'Top marcas por unidades acumuladas 2026.';
  $('#mc-rank').innerHTML=mk.map((m,i)=>`<div class="rank" style="padding:7px 0;border-bottom:1px solid var(--line)"><div class="legrow"><span style="width:20px;font-weight:800;color:var(--muted)">${i+1}</span><span class="nm" style="text-transform:capitalize">${m.marca}</span><span class="vl">${fint(vget(m))} u</span></div><div class="bar"><i style="width:${(vget(m)/mx*100).toFixed(0)}%"></i></div></div>`).join('');
  $('#mc-insight').innerHTML=`<b>Lectura ejecutiva.</b> En el último mes se vendieron ${fint(enchUlt)} vehículos enchufables (BEV+PHEV). El mercado lo lideran ${mk.slice(0,3).map(m=>m.marca).join(', ')}. Hay ${fint(marcasAct)} marcas activas y ${fint(M.homol.length)} modelos homologados en catálogo.`;
  renderBuscador();
}
function renderBuscador(){const M=DATA.mercado,f=F.merc; const q=norm(f.q);
  let rows=M.homol.map(h=>({marca:h[0],modelo:h[1],tech:h[2],carr:h[3],anio:h[4],seg:h[7]}));
  if(f.tech)rows=rows.filter(r=>r.tech===f.tech);
  if(q)rows=rows.filter(r=>norm(r.marca).includes(q)||norm(r.modelo).includes(q));
  if(f.orden==='modelo')rows.sort((a,b)=>a.modelo.localeCompare(b.modelo));
  else if(f.orden==='tech')rows.sort((a,b)=>(''+a.tech).localeCompare(''+b.tech)||(''+b.anio).localeCompare(''+a.anio));
  else rows.sort((a,b)=>(''+b.anio).localeCompare(''+a.anio));
  const el=$('#mc-busca'); if(!el)return;
  if(!q&&!f.tech){el.innerHTML='<p style="color:var(--muted);padding:8px 0">Escribe una marca o modelo para ver resultados.</p>';return;}
  const tcol={BEV:'#2563EB',PHEV:'#16A34A',HEV:'#F59E0B',MHEV:'#7C3AED'};
  const cards=rows.slice(0,60).map(r=>`<div style="border:1px solid var(--line);border-radius:11px;padding:11px 13px;background:#fff">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><b style="font-size:13.5px">${r.marca}</b><span style="font-size:10.5px;font-weight:700;color:#fff;background:${tcol[r.tech]||'#64748B'};padding:2px 7px;border-radius:10px">${r.tech}</span></div>
    <div style="font-size:12.5px;color:var(--ink);margin-top:3px">${r.modelo}</div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:4px">${r.carr||''} · ${r.anio||''}${r.seg?` · ⭐ ${r.seg}`:''}</div></div>`).join('');
  el.innerHTML=`<div style="font-size:12px;color:var(--muted);margin-bottom:8px">${fint(rows.length)} resultados${rows.length>60?' (mostrando 60)':''}</div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">${cards}</div>`;
}

/* ===== ENERGÍA Y BESS ===== */
const ESTADOS=['En Operación','En Construcción','Aprobado','En Calificación','En Pruebas'];
async function pageEnergia(){const E=await load('energia');
  F.ener={region:'',estado:'',fuente:''};
  const fuentes=[...new Set(E.mapa.map(p=>p.t))].filter(Boolean).sort();
  return `<div class="page-head"><h1>Energía y BESS</h1><p class="sub">Generación renovable, almacenamiento y ubicación de proyectos energéticos en Chile.</p><div class="meta"><span class="pill">📅 ${DB.fecha}</span></div></div>
   <div class="filterbar">
     <div class="fgroup"><label>Región</label><select id="ef-reg"><option value="">Todo Chile</option>${fopt(REGS())}</select></div>
     <div class="fgroup"><label>Estado</label><select id="ef-est"><option value="">Todos</option>${ESTADOS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
     <div class="fgroup"><label>Fuente / Tecnología</label><select id="ef-fue"><option value="">Todas</option>${fuentes.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
     <button class="btn btn-ghost" id="ef-reset" style="align-self:flex-end">Limpiar filtros</button></div>
   <div class="grid g4" id="en-kpis" style="margin-bottom:16px"></div>
   <div class="grid g3" style="grid-template-columns:1.6fr 1fr;margin-bottom:16px">
     <div class="card"><h3>Mapa de proyectos energéticos</h3><div class="csub" id="en-mapsub"></div><div id="emap" style="height:460px;border-radius:14px;overflow:hidden;border:1px solid var(--line);margin-top:12px"></div>
       <div style="display:flex;gap:16px;margin-top:10px;font-size:12.5px;flex-wrap:wrap"><span class="legrow"><i class="dot" style="background:#F59E0B"></i> Solar</span><span class="legrow"><i class="dot" style="background:#0EA5E9"></i> Eólica</span><span class="legrow"><i class="dot" style="background:#7C3AED"></i> BESS</span><span class="legrow"><i class="dot" style="background:#16A34A"></i> Otra</span></div>
       <div class="card-src">Fuente: Coordinador Eléctrico Nacional (CEN) · SEIA · ${DB.fecha}</div></div>
     <div class="card"><h3>Capacidad por fuente</h3><div class="csub">MW por tecnología (cartera total).</div><div style="position:relative;height:210px;margin-top:10px"><canvas id="en-donut"></canvas></div><div id="en-donleg" style="margin-top:8px"></div><div class="card-src">Fuente: CEN · ${DB.fecha}</div></div></div>
   <div class="card"><h3>Ranking de potencia por región</h3><div class="csub" id="en-ranksub">MW renovables operativos.</div><div style="margin-top:12px" id="en-rank"></div><div class="card-src">Fuente: CEN · ${DB.fecha}</div></div>
   <div class="insight"><div class="ic">i</div><div id="en-insight"></div></div>`;
}
function fuenteCol(t){t=(t||'').toLowerCase(); if(t.includes('solar'))return '#F59E0B'; if(t.includes('eól')||t.includes('eol'))return '#0EA5E9'; if(t.includes('bess')||t.includes('bater'))return '#7C3AED'; return '#16A34A';}
function bindEnergia(){
  $('#ef-reg').onchange=e=>{F.ener.region=e.target.value;renderEnergia();};
  $('#ef-est').onchange=e=>{F.ener.estado=e.target.value;renderEnergia();};
  $('#ef-fue').onchange=e=>{F.ener.fuente=e.target.value;renderEnergia();};
  $('#ef-reset').onclick=()=>{F.ener={region:'',estado:'',fuente:''};$('#ef-reg').value='';$('#ef-est').value='';$('#ef-fue').value='';renderEnergia();};}
function renderEnergia(){const E=DATA.energia,f=F.ener;
  // mapa de proyectos (mapeo de regiones: BESS usa nombres con tildes/variantes; comparar por includes)
  const matchReg=(pr)=>!f.region||norm(pr)===norm(f.region)||norm(pr).includes(norm(f.region));
  const D=E.mapa.filter(p=>matchReg(p.r)&&(!f.estado||p.e===f.estado)&&(!f.fuente||p.t===f.fuente));
  const op=D.filter(p=>p.e==='En Operación');
  const mwOp=op.reduce((a,p)=>a+(+p.mw||0),0);
  const mwTot=D.reduce((a,p)=>a+(+p.mw||0),0);
  const bess=D.filter(p=>(p.t||'').toLowerCase().includes('bess'));
  $('#en-kpis').innerHTML=[
    kpi({lbl:'MW renovables (operativos)',val:fint(mwOp),unit:'MW',bg:'#FEF9C3',c:'#CA8A04',icon:IC.sun}),
    kpi({lbl:'MW en cartera (selección)',val:fint(mwTot),unit:'MW',bg:'#EFF6FF',c:'#2563EB',icon:IC.bolt}),
    kpi({lbl:'Proyectos',val:fint(D.length),bg:'#ECFDF5',c:'#16A34A',icon:IC.target}),
    kpi({lbl:'Proyectos BESS',val:fint(bess.length),bg:'#F3E8FF',c:'#7C3AED',icon:IC.bat})].join('');
  const amb=f.region||'todo Chile';
  $('#en-mapsub').textContent=`${fint(D.length)} proyectos en ${amb}. Tamaño según capacidad (MW).`;
  // donut por fuente (de la seleccion)
  const byF={}; D.forEach(p=>{const k=p.t||'Otra';byF[k]=(byF[k]||0)+(+p.mw||0);});
  let fe=Object.entries(byF).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if(_edonut)_edonut.destroy(); const dc=$('#en-donut');
  if(dc)_edonut=new Chart(dc,{type:'doughnut',data:{labels:fe.map(x=>x[0]),datasets:[{data:fe.map(x=>Math.round(x[1])),backgroundColor:fe.map(x=>fuenteCol(x[0])),borderWidth:0}]},options:{cutout:'60%',plugins:{legend:{display:false}},maintainAspectRatio:false}});
  const tot=fe.reduce((a,x)=>a+x[1],0)||1;
  $('#en-donleg').innerHTML=fe.map(x=>`<div class="legrow"><i class="dot" style="background:${fuenteCol(x[0])}"></i><span class="nm">${x[0]}</span><span class="vl">${fint(x[1])} MW</span></div>`).join('');
  // ranking por region (operativos MW)
  const byR={}; D.forEach(p=>{if(p.e==='En Operación'){const k=p.r||'—';byR[k]=(byR[k]||0)+(+p.mw||0);}});
  let rr=Object.entries(byR).sort((a,b)=>b[1]-a[1]).slice(0,10); const mx=rr.length?rr[0][1]:1;
  $('#en-ranksub').textContent=`MW renovables operativos · ${amb}.`;
  $('#en-rank').innerHTML=rr.length?rr.map((o,i)=>`<div class="rank" style="padding:7px 0;border-bottom:1px solid var(--line)"><div class="legrow"><span style="width:20px;font-weight:800;color:var(--muted)">${i+1}</span><span class="nm">${o[0]}</span><span class="vl">${fint(o[1])} MW</span></div><div class="bar"><i style="width:${(o[1]/mx*100).toFixed(0)}%"></i></div></div>`).join(''):'<p style="color:var(--muted)">Sin proyectos operativos en la selección.</p>';
  $('#en-insight').innerHTML=`<b>Lectura ejecutiva.</b> En ${amb} hay ${fint(D.length)} proyectos energéticos con ${fint(mwOp)} MW renovables operativos y ${fint(bess.length)} iniciativas de almacenamiento BESS. La cartera total en desarrollo suma ${fint(mwTot)} MW.`;
  // mapa
  if(_emap){try{_emap.remove()}catch(e){}_emap=null;}
  _emap=L.map('emap',{scrollWheelZoom:false}).setView([-35.5,-71.3],5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'© OpenStreetMap, © CARTO'}).addTo(_emap);
  const pts=[];
  D.forEach(p=>{if(!p.lat||!p.lng)return;pts.push([p.lat,p.lng]);const rad=Math.max(3,Math.min(14,Math.sqrt((+p.mw||1))/2.2));
    L.circleMarker([p.lat,p.lng],{radius:rad,color:fuenteCol(p.t),fillColor:fuenteCol(p.t),fillOpacity:.55,weight:1}).bindPopup(`<b>${p.n||''}</b><br>${p.t||''}<br>${p.r||''}<br>${fint(p.mw)} MW · ${p.e||''}`).addTo(_emap);});
  if(f.region&&pts.length){try{_emap.fitBounds(pts,{padding:[25,25],maxZoom:9})}catch(e){}}}

/* ===== OPORTUNIDADES DE INVERSIÓN ===== */
async function pageInversion(){const I=await load('inversion');
  F.inv={region:'',prio:''};
  return `<div class="page-head"><h1>Oportunidades de Inversión</h1><p class="sub">Brechas de cobertura priorizadas: dónde falta carga pública y con qué urgencia.</p><div class="meta"><span class="pill">📅 ${DB.fecha}</span></div></div>
   <div class="filterbar">
     <div class="fgroup"><label>Región</label><select id="vf-reg"><option value="">Todo Chile</option>${fopt(REGS())}</select></div>
     <div class="fgroup"><label>Prioridad</label><select id="vf-prio"><option value="">Todas</option><option value="ALTA">Alta</option><option value="MEDIA">Media</option><option value="BAJA">Baja</option></select></div>
     <button class="btn btn-ghost" id="vf-reset" style="align-self:flex-end">Limpiar filtros</button></div>
   <div class="grid g4" id="iv-kpis" style="margin-bottom:16px"></div>
   <div class="grid g3" style="grid-template-columns:1fr 1fr;margin-bottom:16px">
     <div class="card"><h3>Cobertura nacional de carga</h3><div class="csub">Comunas con y sin carga pública.</div><div style="position:relative;height:210px;margin-top:10px"><canvas id="iv-donut"></canvas></div><div id="iv-donleg" style="margin-top:8px"></div><div class="card-src">Fuente: SEC · ${DB.fecha}</div></div>
     <div class="card"><h3>Brechas por prioridad</h3><div class="csub" id="iv-psub">Distribución de oportunidades.</div><div style="margin-top:12px" id="iv-prio"></div><div class="card-src">Fuente: análisis EV · distancia a carga + tráfico · ${DB.fecha}</div></div></div>
   <div class="card"><h3>Ranking de brechas priorizadas</h3><div class="csub" id="iv-ranksub">Localidades con mayor necesidad de carga, por distancia al cargador más cercano.</div><div style="overflow-x:auto;margin-top:12px"><table id="iv-table" style="width:100%;border-collapse:collapse;font-size:13px"></table></div><div class="card-src">Fuente: análisis EV · SEC + distancias viales · ${DB.fecha}</div></div>
   <div class="insight"><div class="ic">i</div><div id="iv-insight"></div></div>`;
}
function bindInversion(){
  $('#vf-reg').onchange=e=>{F.inv.region=e.target.value;renderInversion();};
  $('#vf-prio').onchange=e=>{F.inv.prio=e.target.value;renderInversion();};
  $('#vf-reset').onclick=()=>{F.inv={region:'',prio:''};$('#vf-reg').value='';$('#vf-prio').value='';renderInversion();};}
function renderInversion(){const I=DATA.inversion,f=F.inv;
  const D=I.gaps.filter(g=>(!f.region||g.region===f.region)&&(!f.prio||g.prioridad===f.prio));
  const alta=D.filter(g=>g.prioridad==='ALTA').length, media=D.filter(g=>g.prioridad==='MEDIA').length, baja=D.filter(g=>g.prioridad==='BAJA').length;
  const kwTot=D.reduce((a,g)=>a+(+g.kw_recom||0),0);
  $('#iv-kpis').innerHTML=[
    kpi({lbl:'Brechas detectadas',val:fint(D.length),bg:'#FEE2E2',c:'#EF4444',icon:IC.target}),
    kpi({lbl:'Prioridad alta',val:fint(alta),bg:'#FEF3C7',c:'#F59E0B',icon:IC.bolt}),
    kpi({lbl:'Comunas sin carga',val:fint(I.cobertura.sin),unit:'/ '+I.cobertura.total,bg:'#EFF6FF',c:'#2563EB',icon:IC.map}),
    kpi({lbl:'Potencia recomendada',val:fint(kwTot/1000),unit:'MW',bg:'#F3E8FF',c:'#7C3AED',icon:IC.plug})].join('');
  // donut cobertura
  if(_donut)_donut.destroy(); const dc=$('#iv-donut');
  if(dc)_donut=new Chart(dc,{type:'doughnut',data:{labels:['Con carga','Sin carga'],datasets:[{data:[I.cobertura.con,I.cobertura.sin],backgroundColor:['#16A34A','#EF4444'],borderWidth:0}]},options:{cutout:'64%',plugins:{legend:{display:false}},maintainAspectRatio:false}});
  $('#iv-donleg').innerHTML=[['#16A34A','Comunas con carga',I.cobertura.con],['#EF4444','Comunas sin carga',I.cobertura.sin]].map(([c,n,v])=>`<div class="legrow"><i class="dot" style="background:${c}"></i><span class="nm">${n}</span><span class="vl">${fint(v)}</span></div>`).join('');
  // prioridad bars
  const pr=[['ALTA',alta,'#EF4444'],['MEDIA',media,'#F59E0B'],['BAJA',baja,'#16A34A']]; const mxp=Math.max(alta,media,baja,1);
  $('#iv-prio').innerHTML=pr.map(([n,v,c])=>`<div class="rank" style="padding:7px 0"><div class="legrow"><span class="nm">${n[0]+n.slice(1).toLowerCase()}</span><span class="vl">${fint(v)} brechas</span></div><div class="bar"><i style="width:${(v/mxp*100).toFixed(0)}%;background:${c}"></i></div></div>`).join('');
  // tabla ranking por distancia
  const rows=[...D].sort((a,b)=>(b.dist_cercano||0)-(a.dist_cercano||0)).slice(0,15);
  $('#iv-table').innerHTML=`<thead><tr style="text-align:left;color:var(--muted);font-size:11.5px;text-transform:uppercase">
    <th style="padding:8px 6px">#</th><th style="padding:8px 6px">Localidad</th><th style="padding:8px 6px">Región</th><th style="padding:8px 6px;text-align:right">Dist. cargador (km)</th><th style="padding:8px 6px;text-align:right">kW recom.</th><th style="padding:8px 6px;text-align:center">Prioridad</th></tr></thead><tbody>`+
    rows.map((g,i)=>{const pc=g.prioridad==='ALTA'?'#EF4444':g.prioridad==='MEDIA'?'#F59E0B':'#16A34A';
      return `<tr style="border-top:1px solid var(--line)"><td style="padding:8px 6px;color:var(--muted)">${i+1}</td><td style="padding:8px 6px;font-weight:700">${g.lugar}</td><td style="padding:8px 6px">${g.region}</td><td style="padding:8px 6px;text-align:right">${fmt(g.dist_cercano)}</td><td style="padding:8px 6px;text-align:right">${fint(g.kw_recom)}</td><td style="padding:8px 6px;text-align:center"><span style="font-size:10.5px;font-weight:700;color:#fff;background:${pc};padding:2px 8px;border-radius:10px">${g.prioridad}</span></td></tr>`;}).join('')+'</tbody>';
  const amb=f.region||'todo Chile';
  $('#iv-insight').innerHTML=`<b>Lectura ejecutiva.</b> En ${amb} se detectan ${fint(D.length)} brechas de cobertura (${fint(alta)} de prioridad alta). La potencia recomendada para cerrarlas suma ${fint(kwTot/1000)} MW. A nivel nacional ${fint(I.cobertura.sin)} de ${I.cobertura.total} comunas siguen sin carga pública.`;
}

/* ===== REPORTES REGIONALES & COMUNALES ===== */
async function pageReportes(){const R=await load('reportes');
  F.rep={region:'',comuna:''};
  return `<div class="page-head"><h1>Reportes Regionales & Comunales</h1><p class="sub">Selecciona una región y una comuna para ver su ficha completa de electromovilidad y energía.</p><div class="meta"><span class="pill">📅 ${DB.fecha}</span></div></div>
   <div class="filterbar">
     <div class="fgroup"><label>Región</label><select id="rf-reg"><option value="">Selecciona región…</option>${fopt(REGS())}</select></div>
     <div class="fgroup"><label>Comuna</label><select id="rf-com"><option value="">Toda la región</option></select></div>
     <button class="btn btn-ghost" id="rf-reset" style="align-self:flex-end">Limpiar</button></div>
   <div id="rep-body"></div>`;
}
function bindReportes(){const R=DATA.reportes;
  $('#rf-reg').onchange=e=>{F.rep.region=e.target.value;F.rep.comuna='';
    const sel=$('#rf-com'); const coms=R.com.filter(c=>c.r===F.rep.region).map(c=>c.c).sort((a,b)=>a.localeCompare(b));
    sel.innerHTML='<option value="">Toda la región</option>'+coms.map(c=>`<option value="${c}">${c}</option>`).join('');
    renderReportes();};
  $('#rf-com').onchange=e=>{F.rep.comuna=e.target.value;renderReportes();};
  $('#rf-reset').onclick=()=>{F.rep={region:'',comuna:''};$('#rf-reg').value='';$('#rf-com').innerHTML='<option value="">Toda la región</option>';renderReportes();};}
function ind(lbl,val,unit){return `<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:13px 15px"><div style="font-size:12px;color:var(--muted);font-weight:600">${lbl}</div><div style="font-size:22px;font-weight:800;margin-top:3px">${val}${unit?`<small style="font-size:13px;color:var(--muted);font-weight:700"> ${unit}</small>`:''}</div></div>`;}
function renderReportes(){const R=DATA.reportes,f=F.rep; const el=$('#rep-body'); if(!el)return;
  if(!f.region){el.innerHTML='<div class="card soon"><div class="big">📍</div><h3>Selecciona una región</h3><p style="margin-top:6px">Elige una región (y opcionalmente una comuna) para ver su ficha.</p></div>';return;}
  // mapeo nombre region -> clave FICHA_REG
  const rkey=Object.keys(R.reg).find(k=>norm(k)===norm(f.region)||norm(f.region).includes(norm(k))||norm(k).includes(norm(f.region.replace('La ',''))));
  if(f.comuna){const c=R.com.find(x=>x.c===f.comuna&&x.r===f.region); if(!c){el.innerHTML='<p>Sin datos para la comuna.</p>';return;}
    el.innerHTML=`<div class="card"><h3>${c.c} <span style="font-weight:600;color:var(--muted);font-size:14px">· ${c.r}</span></h3>
     <div class="grid g4" style="margin-top:14px">${ind('Población',fint(c.p))}${ind('Vehículos eléctricos',fint(c.e))}${ind('Conectores públicos',fint(c.k))}${ind('Cargadores DC',fint(c.d))}</div>
     <div class="grid g4" style="margin-top:12px">${ind('Potencia máx.',fint(c.kw),'kW')}${ind('EV por 1.000 hab.',(''+c.e1).replace('.',','))}${ind('Ratio EV/conector',(''+c.rt).replace('.',','))}${ind('Conectores /10mil hab',(''+c.c10).replace('.',','))}</div>
     ${c.pr?`<div style="margin-top:16px"><h3 style="font-size:14px">Precio de carga (kWh)</h3>
       <div class="grid g2" style="margin-top:10px">
         <div style="background:#ECFDF5;border:1px solid #BBF7D0;border-radius:12px;padding:13px 15px"><div style="font-size:12px;color:#16A34A;font-weight:700">PRECIO MÍNIMO</div><div style="font-size:22px;font-weight:800">$${c.pr.min}<small style="font-size:12px;color:var(--muted)"> /kWh</small></div><div style="font-size:11.5px;color:var(--muted);margin-top:4px">${c.pr.mindesc||''}<br>${c.pr.minloc||''}</div></div>
         <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:13px 15px"><div style="font-size:12px;color:#EF4444;font-weight:700">PRECIO MÁXIMO</div><div style="font-size:22px;font-weight:800">$${c.pr.max}<small style="font-size:12px;color:var(--muted)"> /kWh</small></div><div style="font-size:11.5px;color:var(--muted);margin-top:4px">${c.pr.maxdesc||''}<br>${c.pr.maxloc||''}</div></div></div></div>`:''}
     <div class="card-src">Fuente: SEC · INE Censo 2024 · permisos de circulación · ${DB.fecha}</div></div>`;
    return;}
  // ficha regional
  const rg=rkey?R.reg[rkey]:null;
  if(!rg){el.innerHTML='<p>Sin datos regionales.</p>';return;}
  el.innerHTML=`<div class="card"><h3>Región de ${f.region}</h3>
    <div class="grid g4" style="margin-top:14px">${ind('Comunas',fint(rg.comunas))}${ind('Población',fint(rg.pob))}${ind('Vehículos eléctricos',fint(rg.evs))}${ind('Conectores públicos',fint(rg.con))}</div>
    <div class="grid g4" style="margin-top:12px">${ind('Cargadores DC',fint(rg.dc))}${ind('Comunas sin carga',fint(rg.sincarg))}${ind('EV por 1.000 hab.',(''+rg.evs_1000).replace('.',','))}${ind('Ratio EV/conector',(''+rg.ratio).replace('.',','))}</div>
    <h3 style="font-size:14px;margin-top:18px">Energía renovable</h3>
    <div class="grid g4" style="margin-top:10px">${ind('ERNC operativa',fint(rg.ernc_mw),'MW')}${ind('Proyectos ERNC',fint(rg.ernc_n))}${ind('Solar',fint(rg.solar_mw),'MW')}${ind('Tráfico medio (TMDA)',fint(rg.tmda))}</div>
    <div class="card-src">Fuente: SEC · CEN · INE Censo 2024 · MOP Vialidad · ${DB.fecha}</div></div>
    <div class="insight"><div class="ic">i</div><div><b>Lectura ejecutiva.</b> ${f.region} tiene ${fint(rg.evs)} vehículos eléctricos y ${fint(rg.con)} conectores públicos en ${fint(rg.comunas)} comunas, con ${fint(rg.sincarg)} aún sin carga. En energía suma ${fint(rg.ernc_mw)} MW renovables operativos. Selecciona una comuna para el detalle.</div></div>`;
}

/* ===== CALCULADORA DE OPORTUNIDADES ===== */
async function pageCalc(){const C=await load('calc');
  F.calc={region:'',comuna:''};
  return `<div class="page-head"><h1>Calculadora de Oportunidades</h1><p class="sub">Explora el score de oportunidad de inversión por comuna, según flota EV, cobertura de carga y potencial.</p><div class="meta"><span class="pill">📅 ${DB.fecha}</span></div></div>
   <div class="filterbar">
     <div class="fgroup"><label>Región</label><select id="cf-reg"><option value="">Todo Chile</option>${fopt(REGS())}</select></div>
     <div class="fgroup"><label>Comuna</label><select id="cf-com"><option value="">Todas</option></select></div>
     <button class="btn btn-ghost" id="cf-reset" style="align-self:flex-end">Limpiar</button></div>
   <div id="calc-body"></div>
   <div class="card" style="margin-top:16px"><h3>Ranking de comunas por oportunidad</h3><div class="csub" id="cl-ranksub">Score 0–100: mayor score = mayor oportunidad de inversión en carga.</div><div style="overflow-x:auto;margin-top:12px"><table id="cl-table" style="width:100%;border-collapse:collapse;font-size:13px"></table></div><div class="card-src">Fuente: análisis EV · flota + cobertura + potencial ERNC · ${DB.fecha}</div></div>
   <div class="insight"><div class="ic">i</div><div id="cl-insight"></div></div>`;
}
function bindCalc(){const C=DATA.calc;
  $('#cf-reg').onchange=e=>{F.calc.region=e.target.value;F.calc.comuna='';
    const coms=C.data.filter(d=>d.region===F.calc.region).map(d=>d.comuna).sort((a,b)=>a.localeCompare(b));
    $('#cf-com').innerHTML='<option value="">Todas</option>'+coms.map(c=>`<option value="${c}">${c}</option>`).join('');renderCalc();};
  $('#cf-com').onchange=e=>{F.calc.comuna=e.target.value;renderCalc();};
  $('#cf-reset').onclick=()=>{F.calc={region:'',comuna:''};$('#cf-reg').value='';$('#cf-com').innerHTML='<option value="">Todas</option>';renderCalc();};}
function scoreColor(s){return s>=70?'#EF4444':s>=50?'#F59E0B':'#16A34A';}
function renderCalc(){const C=DATA.calc,f=F.calc; const body=$('#calc-body');
  let D=C.data.filter(d=>!f.region||d.region===f.region);
  if(f.comuna){const c=C.data.find(d=>d.comuna===f.comuna); if(c&&body){const col=scoreColor(c.score);
    body.innerHTML=`<div class="card"><h3>${c.comuna} <span style="font-weight:600;color:var(--muted);font-size:14px">· ${c.region}</span></h3>
     <div style="display:flex;gap:24px;align-items:center;margin-top:14px;flex-wrap:wrap">
       <div style="text-align:center"><div style="font-size:56px;font-weight:800;color:${col};line-height:1">${c.score}</div><div style="font-size:12px;color:var(--muted);font-weight:700">SCORE DE OPORTUNIDAD</div></div>
       <div class="grid g2" style="flex:1;min-width:280px">${ind('Vehículos eléctricos',fint(c.evs))}${ind('Conectores actuales',fint(c.total_carg))}${ind('Potencia máxima',fint(c.max_kw),'kW')}${ind('¿Tiene carga DC?',c.has_dc?'Sí':'No')}</div></div>
     <div style="margin-top:14px;padding:12px 15px;background:${col}14;border:1px solid ${col}40;border-radius:12px;font-size:13px"><b style="color:${col}">${c.score>=70?'Oportunidad alta':c.score>=50?'Oportunidad media':'Oportunidad baja'}.</b> ${c.evs} EV y ${c.total_carg} conectores ${c.has_dc?'(con carga rápida DC)':'(sin carga rápida DC)'}. ${c.total_carg===0?'Comuna sin carga pública: prioridad de despliegue.':'Evaluar ampliación de capacidad.'}</div>
     <div class="card-src">Fuente: análisis EV · ${DB.fecha}</div></div>`;}}
  else if(body){body.innerHTML='';}
  // ranking
  D=[...D].sort((a,b)=>b.score-a.score).slice(0,15);
  $('#cl-table').innerHTML=`<thead><tr style="text-align:left;color:var(--muted);font-size:11.5px;text-transform:uppercase"><th style="padding:8px 6px">#</th><th style="padding:8px 6px">Comuna</th><th style="padding:8px 6px">Región</th><th style="padding:8px 6px;text-align:right">EVs</th><th style="padding:8px 6px;text-align:right">Conectores</th><th style="padding:8px 6px;text-align:center">DC</th><th style="padding:8px 6px;text-align:right">Score</th></tr></thead><tbody>`+
    D.map((c,i)=>{const col=scoreColor(c.score);return `<tr style="border-top:1px solid var(--line)"><td style="padding:8px 6px;color:var(--muted)">${i+1}</td><td style="padding:8px 6px;font-weight:700">${c.comuna}</td><td style="padding:8px 6px">${c.region}</td><td style="padding:8px 6px;text-align:right">${fint(c.evs)}</td><td style="padding:8px 6px;text-align:right">${fint(c.total_carg)}</td><td style="padding:8px 6px;text-align:center">${c.has_dc?'✓':'—'}</td><td style="padding:8px 6px;text-align:right"><span style="font-weight:800;color:${col}">${c.score}</span></td></tr>`;}).join('')+'</tbody>';
  const amb=f.region||'todo Chile';
  $('#cl-insight').innerHTML=`<b>Lectura ejecutiva.</b> En ${amb}, las comunas con mayor score combinan alta flota EV y baja cobertura de carga — las prioridades de inversión. ${D[0]?`Encabeza ${D[0].comuna} (score ${D[0].score}).`:''}`;
}

/* ===== METODOLOGÍA ===== */
function pageMetodo(){
  const fuentes=[
    ['Mercado EV','ANAC — ventas mensuales de vehículos eléctricos e híbridos; homologaciones y fichas de seguridad','Mensual'],
    ['Infraestructura de carga','SEC — Superintendencia de Electricidad y Combustibles, registro de conectores públicos','Mensual'],
    ['Energía y BESS','CEN — Coordinador Eléctrico Nacional; SEIA — proyectos de generación y almacenamiento','Mensual'],
    ['Población y territorio','INE — Censo 2024','Anual'],
    ['Tráfico vial','MOP Vialidad — TMDA (tránsito medio diario anual)','Anual'],
    ['Permisos de circulación','Registro Civil / municipios — flota acumulada','Anual']
  ];
  const defs=[
    ['Penetración EV','Participación de vehículos electrificados (BEV+PHEV+HEV+MHEV) sobre el total de ventas del mes.'],
    ['BEV / PHEV','Eléctrico de batería / híbrido enchufable. Ambos son "enchufables" y demandan carga.'],
    ['Conector vs cargador','Un cargador puede tener varios conectores (puntos de carga simultáneos).'],
    ['Velocidad de carga','AC lenta ≤7 kW · AC semi-rápida 7–22 kW · DC rápida ≥50 kW.'],
    ['ERNC','Energías Renovables No Convencionales (solar, eólica, mini-hidro, biomasa, geotérmica).'],
    ['BESS','Battery Energy Storage System — almacenamiento en baterías, medido en MWh.'],
    ['Score de oportunidad','Índice 0–100 que combina flota EV, ausencia de carga, potencial de upgrade, rutas y ERNC.']
  ];
  return `<div class="page-head"><h1>Metodología</h1><p class="sub">Fuentes, definiciones y frecuencia de actualización de los datos del observatorio.</p><div class="meta"><span class="pill">📅 Actualizado: ${DB.fecha}</span></div></div>
   <div class="card"><h3>Fuentes de datos</h3><div style="overflow-x:auto;margin-top:12px"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="text-align:left;color:var(--muted);font-size:11.5px;text-transform:uppercase"><th style="padding:8px 6px">Sección</th><th style="padding:8px 6px">Fuente</th><th style="padding:8px 6px">Frecuencia</th></tr></thead><tbody>${fuentes.map(([s,f,fr])=>`<tr style="border-top:1px solid var(--line)"><td style="padding:9px 6px;font-weight:700">${s}</td><td style="padding:9px 6px">${f}</td><td style="padding:9px 6px"><span class="pill">${fr}</span></td></tr>`).join('')}</tbody></table></div></div>
   <div class="card" style="margin-top:16px"><h3>Definiciones clave</h3><div class="grid g2" style="margin-top:12px">${defs.map(([t,d])=>`<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:13px 15px"><b style="font-size:13.5px;color:var(--primary-d)">${t}</b><p style="font-size:12.5px;color:var(--muted);margin-top:4px">${d}</p></div>`).join('')}</div></div>
   <div class="insight"><div class="ic">i</div><div><b>Transparencia.</b> Todos los indicadores provienen de fuentes oficiales y se actualizan periódicamente. Cada gráfico del observatorio indica su fuente y fecha de actualización al pie.</div></div>`;
}

/* ===== ROUTER ===== */
const PAGES={inicio:pageInicio,resumen:pageResumen,infra:pageInfra,mercado:pageMercado,energia:pageEnergia,inversion:pageInversion,reportes:pageReportes,calc:pageCalc,metodo:pageMetodo};
const AFTER={infra:()=>{bindInfra();renderInfra();},mercado:()=>{bindMercado();renderMercado();},energia:()=>{bindEnergia();renderEnergia();},inversion:()=>{bindInversion();renderInversion();},reportes:()=>{bindReportes();renderReportes();},calc:()=>{bindCalc();renderCalc();}};
async function go(id){
  destroyCharts();
  const main=$('#main'); main.innerHTML='<div style="padding:60px;text-align:center;color:var(--muted)">Cargando…</div>';
  $$('.nav-links a').forEach(a=>a.classList.toggle('active',a.dataset.go===id));
  document.getElementById('navlinks').classList.remove('open'); window.scrollTo(0,0);
  let html; try{ html=await PAGES[id](); }catch(e){ main.innerHTML='<p style="padding:40px">Error: '+e+'</p>'; return; }
  main.innerHTML=`<section class="page active">${html}</section>`;
  if(AFTER[id]) AFTER[id]();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]');if(t){e.preventDefault();go(t.dataset.go);}});
Promise.all([fetch('data/datos.json?v='+V).then(r=>r.json()),fetch('data/cargadores.json?v='+V).then(r=>r.json())])
 .then(([d,c])=>{DB=d;CARG=c;const ff=$('#foot-fecha');if(ff)ff.textContent='Actualizado '+d.fecha;go('inicio');})
 .catch(e=>{$('#main').innerHTML='<p style="padding:40px">Error cargando datos: '+e+'</p>';});
