# Instrucciones para el agente de IA (Claude Code / Codex)

Proyecto Semestral UMIP · Medición y Rendimiento de Terminales Portuarias · **Idea 3: «Un patio que se llena»**.

## Problema
El patio de contenedores se llena: suben la densidad, los remanejos y el tiempo de servicio, y algunas categorías se quedan demasiados días. El dashboard mide la situación y compara medidas para liberar espacio.

## Reglas
- Todo en **español** (código comentado, textos de la interfaz y documentos).
- El dashboard se abre con **doble clic en `index.html`**: sin servidor, sin `fetch` a archivos locales y sin `type="module"`. Los datos se cargan con `data/datos.js` (`window.DATOS`).
- **No inventar fórmulas.** Solo se usan las del curso (abajo). Si hace falta un KPI nuevo, primero se propone y el grupo lo aprueba.
- Cálculos en `js/kpi.js` (sin DOM), interfaz en `js/app.js`, metas en `js/config.js`. No poner metas fijas en otros archivos.
- Los datos solo se cambian editando `data/generar_datos.py` y volviéndolo a ejecutar (`python data/generar_datos.py`). Nunca se edita `datos.js` a mano. La semilla siempre es fija.
- La pantalla debe indicar que los datos son simulados.
- Nunca subir claves, contraseñas ni tokens.
- Antes de proponer código para un módulo, explicar el plan. Después de cambiar un cálculo, mostrar un ejemplo numérico para verificarlo a mano.

## KPI del curso (fórmulas)
| KPI | Fórmula |
|---|---|
| Capacidad operativa | [Bloques × Stacks × (Tiers × Lanes − Shuffle slots)] − slots inoperativos (TEU) |
| Yard Density | Inventario ÷ capacidad operativa × 100 |
| Dwell time por categoría | Σ días en patio ÷ contenedores de la categoría |
| Dwell time global | Promedio ponderado por contenedores (no promedio simple) |
| Rehandle ratio | Movimientos improductivos ÷ movimientos productivos × 100 |
| Tiempo de servicio en patio | Tiempo del camión desde que entra al bloque hasta que sale (min) |
| Antigüedad (aging) | Contenedores con más de X días en patio |
| Días hasta alerta roja | TEU de margen ÷ crecimiento diario del inventario |

Convención: un contenedor está en patio al cierre del día d si `dia_entrada ≤ d < dia_salida`; su dwell es `dia_salida − dia_entrada`.

## Estructura
```
index.html · css/estilos.css · js/{config,kpi,app}.js · js/lib/chart.umd.min.js
data/{generar_datos.py, datos.js, contenedores.csv, movimientos_bloque.csv}
docs/{fichas_kpi.md, bitacora_ia.md, verificacion_manual.md} · presentacion/ · README.md
```

## Flujo Git
Una rama por módulo o tarea, Pull Request hacia `main` y revisión de otro integrante. Registrar los prompts importantes en `docs/bitacora_ia.md`.
