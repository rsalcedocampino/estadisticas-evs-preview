#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Inyecta los cruces con datos publicos (DEV) en index.html, idempotente.
   1. Columna 'Trafico TMDA' (MOP) en la tabla de brechas + orden por trafico.
   2. Bloque 'Territorio - Poblacion y cobertura' (INE Censo 2024 + SEC + Permisos).
   Lee cruces_data.json. No toca login ni CNAME. Seguro de ejecutar varias veces."""
import json, re, io

MARK = 'CRUCE-DEV-DATOS-PUBLICOS'

def main():
    html = io.open('index.html', encoding='utf-8').read()
    if MARK in html:
        print('cruces ya presentes, nada que hacer'); return
    data = json.load(io.open('cruces_data.json', encoding='utf-8'))
    js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))

    gm = data['gap_tmda']
    for name in ('GAP_DATA', '_DATA'):
        m = re.search(r'var %s=(\[.*?\]);' % name, html)
        if not m: continue
        arr = json.loads(m.group(1))
        for it in arr: it['tmda'] = gm.get(it['lugar'])
        html = html[:m.start()] + 'var %s=%s;' % (name, js(arr)) + html[m.end():]

    th = '<th style="padding:6px 8px;text-align:center;">Prioridad</th>'
    if th in html and 'Trafico TMDA' not in html and 'TMDA' not in html:
        html = html.replace(th, '<th style="padding:6px 8px;text-align:right;">Trafico TMDA</th>' + th, 1)
    cell = "+r.kw_recom+' kW</td>'"
    if cell in html and html.count(cell) == 1:
        newcell = cell + "      +'<td style=\"padding:5px 8px;text-align:right;color:#555;\">'+(r.tmda?r.tmda.toLocaleString('es-CL')+' veh/dia':'s/d')+'</td>'"
        html = html.replace(cell, newcell, 1)
    opt = '<option value="dist_hp_desc">Mayor brecha primero</option>'
    if opt in html and 'tmda_desc' not in html:
        html = html.replace(opt, opt + '<option value="tmda_desc">Mayor trafico primero</option>', 1)
    srt = 'if(sort==="dist_hp_desc")data.sort(function(a,b){return b.dist_hp-a.dist_hp;});'
    if srt in html and 'tmda_desc' in html:
        html = html.replace(srt, srt + '\n  else if(sort==="tmda_desc")data.sort(function(a,b){return (b.tmda||0)-(a.tmda||0);});', 1)

    block = TERRITORIO_TPL
    block = block.replace('@N50K@', str(data['n50k']))
    block = block.replace('@SIN3@', data['sin3'])
    block = block.replace('@LEASN@', str(data['leasn']))
    block = block.replace('@POB@', js(data['CRUCE_POB']))
    block = block.replace('@PEOR@', js(data['CRUCE_PEOR']))
    anchor = '<!-- FIN GAP ANALYSIS -->'
    if anchor in html:
        html = html.replace(anchor, block + '\n' + anchor, 1)
    else:
        alt = '<!-- CALCULADORA DE OPORTUNIDADES -->'
        html = html.replace(alt, block + '\n' + alt, 1) if alt in html else html + block
    io.open('index.html', 'w', encoding='utf-8').write(html)
    print('cruces inyectados OK')

TERRITORIO_TPL = '''<!-- CRUCE-DEV-DATOS-PUBLICOS: TERRITORIO POBLACION -->
<div style="background:#fff;border:1.5px solid #2B5BA8;border-radius:10px;margin:14px 0;padding:14px 16px;">
  <div style="background:#2B5BA8;color:#fff;border-radius:8px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">
    <span style="font-weight:800;">\U0001F3D9️ TERRITORIO — POBLACIÓN Y COBERTURA POR COMUNA</span>
    <span style="font-size:11px;background:rgba(255,255,255,.18);border-radius:6px;padding:2px 8px;">Cruce INE Censo 2024 + SEC + Permisos de Circulación 2024</span>
  </div>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin:12px 0;">
    <div style="flex:1;min-width:180px;background:#fff;border:1px solid #ddd;border-left:4px solid #C62828;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:26px;font-weight:800;color:#C62828;">@N50K@</div><div style="font-size:11px;color:#555;">Comunas de +50.000 hab sin conector público</div><div style="font-size:10px;color:#999;">@SIN3@</div></div>
    <div style="flex:1;min-width:180px;background:#fff;border:1px solid #ddd;border-left:4px solid #2B5BA8;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:26px;font-weight:800;color:#2B5BA8;">14,9</div><div style="font-size:11px;color:#555;">EVs por 1.000 hab — líder orgánico: Providencia</div><div style="font-size:10px;color:#999;">Excluye comunas con flotas leasing</div></div>
    <div style="flex:1;min-width:180px;background:#fff;border:1px solid #ddd;border-left:4px solid #1ABBA8;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:26px;font-weight:800;color:#1ABBA8;">18,5 M</div><div style="font-size:11px;color:#555;">Población total censada — 346 comunas</div><div style="font-size:10px;color:#999;">Censo 2024 (INE)</div></div>
  </div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;">
    <div style="flex:1;min-width:320px;">
      <div style="font-weight:700;font-size:12px;color:#2B5BA8;margin-bottom:4px;">\U0001F697 EVs POR 1.000 HABITANTES — TOP 15 ORGÁNICO <span style="font-weight:400;color:#888;">(comunas ≥20.000 hab, sin leasing)</span></div>
      <div style="height:300px;"><canvas id="ch-evpc"></canvas></div>
      <div style="background:#FFF8E1;border-left:3px solid #F9A825;font-size:11px;color:#444;padding:6px 10px;margin-top:6px;">La adopción real per cápita la lideran <b>Providencia (14,9)</b>, <b>Peñalén (13,9)</b> y <b>Lo Barnechea (10,4)</b>. Se excluyen comunas pequeñas con flotas leasing (@LEASN@ comunas).</div>
      <div style="font-size:10px;color:#888;text-align:right;font-style:italic;">Fuente: INE Censo 2024 (población censada) + Permisos de Circulación</div>
    </div>
    <div style="flex:1;min-width:320px;">
      <div style="font-weight:700;font-size:12px;color:#2B5BA8;margin-bottom:4px;">\U0001F3D7️ COMUNAS GRANDES CON PEOR COBERTURA <span style="font-weight:400;color:#888;">(+50.000 hab, por conectores por 10.000 hab)</span></div>
      <div style="overflow-x:auto;max-height:300px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead style="position:sticky;top:0;background:#f5f5f5;"><tr style="border-bottom:2px solid #ddd;"><th style="padding:5px 8px;text-align:left;">#</th><th style="padding:5px 8px;text-align:left;">Comuna</th><th style="padding:5px 8px;text-align:right;">Población</th><th style="padding:5px 8px;text-align:right;">EVs</th><th style="padding:5px 8px;text-align:right;">Conectores</th><th style="padding:5px 8px;text-align:right;">Conect./10k hab</th></tr></thead>
        <tbody id="peor-tbody"></tbody>
      </table></div>
      <div style="font-size:10px;color:#888;text-align:right;font-style:italic;margin-top:4px;">Fuente: INE Censo 2024 + Registro de Cargadores Públicos SEC</div>
    </div>
  </div>
</div>
<script>
var CRUCE_POB=@POB@;
var CRUCE_PEOR=@PEOR@;
document.addEventListener('DOMContentLoaded',function(){
  if(typeof Chart==='undefined')return;
  new Chart(document.getElementById('ch-evpc'),{type:'bar',data:{labels:CRUCE_POB.labels,datasets:[{label:'EVs por 1.000 hab',data:CRUCE_POB.vals,backgroundColor:'#2B5BA8',borderRadius:4}]},options:{indexAxis:'y',maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#333'}},y:{ticks:{color:'#333',font:{size:10}}}}}});
  var tb=document.getElementById('peor-tbody');
  if(tb){var h='';CRUCE_PEOR.forEach(function(r,i){h+='<tr style="border-bottom:1px solid #eee;'+(i%2?'background:#fafafa;':'')+'"><td style="padding:4px 8px;color:#aaa;">'+(i+1)+'</td><td style="padding:4px 8px;font-weight:600;color:'+(r.con===0?'#C62828':'#2B5BA8')+';">'+r.comuna+'</td><td style="padding:4px 8px;text-align:right;">'+r.pob.toLocaleString('es-CL')+'</td><td style="padding:4px 8px;text-align:right;">'+r.evs+'</td><td style="padding:4px 8px;text-align:right;font-weight:700;">'+r.con+'</td><td style="padding:4px 8px;text-align:right;">'+r.con_10000+'</td></tr>';});tb.innerHTML=h;}
});
</script>'''

if __name__ == '__main__':
    main()
