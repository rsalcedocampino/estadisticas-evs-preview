#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Transforma el index.html de produccion (estadisticas-evs) para preview:
   1. Fuerza login en secciones brec y calc
   2. Inyecta decorador visual de candado (idempotente)
   El CNAME no se toca (este repo mantiene preview.energiasfuturo.com)."""
import re, io

html = io.open('index.html', encoding='utf-8').read()

html, n = re.subn(r"var _AUTH_PROTECTED\s*=\s*\[[^\]]*\]",
                  "var _AUTH_PROTECTED = ['brec','calc']", html)
print('_AUTH_PROTECTED forzado (%d reemplazos)' % n)

MARK = 'PREVIEW-LOCK-DECOR'
if MARK not in html:
    snippet = (
        '<script>/* PREVIEW-LOCK-DECOR */(function(){function decor(){'
        '(window._AUTH_PROTECTED||[]).forEach(function(id){'
        'var lbl=document.querySelector("#btn-"+id+" .sec-lbl");'
        'if(lbl&&lbl.innerHTML.indexOf("\\uD83D\\uDD12")<0){'
        'lbl.innerHTML+=" <span style=\'font-size:10px;background:#F57C00;color:#fff;'
        'border-radius:4px;padding:1px 5px;vertical-align:middle;font-weight:700;\'>\\uD83D\\uDD12</span>";}'
        'var sub=document.querySelector("#btn-"+id+" .sec-sub");'
        'if(sub&&sub.textContent.indexOf("Requiere cuenta")<0){'
        'sub.textContent="Requiere cuenta \\u00B7 "+sub.textContent;}});}'
        'if(document.readyState!=="loading"){decor();}'
        'else{document.addEventListener("DOMContentLoaded",decor);}})();</script>'
    )
    if '</body>' in html:
        html = html.replace('</body>', snippet + '\n</body>', 1)
    else:
        html += snippet
    print('decorador de candado inyectado')
else:
    print('decorador ya presente')

io.open('index.html', 'w', encoding='utf-8').write(html)


# --- Fix bug heredado de produccion: apostrofes sin escapar en KPI 12M ---
import io as _io
_h=_io.open('index.html',encoding='utf-8').read()
_bad="'<div class=\"sub-val\">Jun '25\u2013May '26 \u00b7 Red de carga</div>'"
if _bad in _h:
    _good="'<div class=\"sub-val\">Jun \\'25\u2013May \\'26 \u00b7 Red de carga</div>'"
    _h=_h.replace(_bad,_good)
    _io.open('index.html','w',encoding='utf-8').write(_h)
    print('fix apostrofe KPI 12M aplicado')

# --- Inyeccion de cruces DEV (datos publicos) tras forzar login ---
try:
    import inject_cruces
    inject_cruces.main()
except Exception as e:
    print('aviso: inject_cruces fallo:', e)
