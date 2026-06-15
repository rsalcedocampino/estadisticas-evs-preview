#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MODO COPIA EXACTA (pruebas): preview es replica identica de estadisticas-evs.
   Solo garantiza el CNAME de preview. NO fuerza login ni inyecta cruces.
   Para volver al modo preview normal (login + cruces), restaurar desde
   sync_transform_preview_full.py.bak (renombrar a sync_transform.py)."""
import io
io.open('CNAME','w',encoding='utf-8').write('preview.energiasfuturo.com\n')
print('modo copia exacta: CNAME asegurado, sin login ni cruces')
