# Un patio que se llena · Dashboard de KPI del patio de contenedores

Proyecto Semestral · Universidad Marítima de Panamá (UMIP)
Curso: Medición y Rendimiento de Terminales Portuarias · Prof. José Abel Diez Cubilla
**Idea 3 · Un patio que se llena**

> ⚠ **Todos los datos son simulados** (mockup) con `data/generar_datos.py`. No son datos reales de una terminal.

## Integrantes

| Nombre | Usuario de GitHub | Módulo a cargo |
|---|---|---|
| Osmar Chiari | @osmarborel16-hub | _por definir_ |
| _Integrante 2_ | _@usuario_ | _por definir_ |
| _Integrante 3_ | _@usuario_ | _por definir_ |
| _Integrante 4_ | _@usuario_ | _por definir_ |

Grupo: ____ · Fecha de entrega: ____

## 1. El problema

El patio de contenedores está cada vez más lleno. Cuando la densidad pasa del 70–80 %, las pilas son más altas y hay que mover contenedores que estorban para llegar al buscado (**remanejos**, movimientos improductivos). Por eso los camiones tardan más en el patio y las grúas de muelle esperan contenedores. Además, algunas categorías de carga (importación y vacíos) se quedan más días de lo debido.

El dashboard mide la situación con 8 KPI y prueba medidas para liberar espacio: reducir el tiempo libre de almacenaje, citas de retiro y evacuación de vacíos.

**Preguntas que responde**

1. ¿Qué categoría presiona más el patio y cuántos TEU ocupa de más? → Módulo 2 (tabla «TEU de más») y Módulo 5 (causa raíz).
2. ¿Cuántos días faltan para la alerta roja si nada cambia? → KPI «Días hasta alerta roja» y Módulo 4.
3. ¿Cuánto bajan la densidad y los remanejos con la propuesta? → Módulo 4 (simulador) y Módulo 5 (A3).

## 2. Cómo abrir el dashboard

1. Descarguen o clonen el repositorio.
2. Hagan **doble clic en `index.html`**: se abre en Chrome o Edge. No hace falta instalar nada, ni servidor, ni internet (Chart.js está guardado en `js/lib/`).
3. También se puede publicar con **GitHub Pages**: Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save. A los pocos minutos queda en `https://osmarborel16-hub.github.io/Proyecto-semestral-de-mediciones-y-rendimiento-portuario/` (el repositorio debe ser público, o tener un plan que permita Pages en privados).

## 3. Módulos del dashboard

| Módulo | Qué muestra | Qué puede hacer el usuario |
|---|---|---|
| Tarjetas de KPI (arriba) | Los 8 KPI con su meta y un semáforo verde / amarillo / rojo | Cambian con el día de análisis y el periodo |
| 1 · Mapa del patio | Mapa de calor de los 8 bloques con su densidad y alerta amarilla / roja; evolución de 60 días; tabla de bloques en alerta | Elegir el día (slider) y la categoría |
| 2 · Dwell time | Dwell por categoría vs meta, aging del inventario y tabla «TEU de más» por categoría | Periodo (7 / 14 / 30 / 60 días) y categoría |
| 3 · Remanejos | Rehandle ratio por día y por bloque; relación densidad → remanejos con su recta | Elegir el bloque |
| 4 · Simulador | Proyección de la densidad 14 días, sin cambios vs escenario | Sliders de dwell por categoría, llegadas, evacuación de vacíos y crecimiento; botones de escenarios |
| 5 · Mejora (A3) | Resumen A3 Lean: problema, situación actual, causa raíz, desperdicio, propuesta, resultado esperado | Cuadros de texto para el análisis del grupo |
| 6 · Verificación | Paso a paso de 3 KPI con los filtros actuales para comparar con el cálculo a mano | — |

## 4. Estructura del repositorio

```
├── index.html                  # el dashboard (se abre con doble clic)
├── css/estilos.css             # estilos
├── js/
│   ├── config.js               # metas y umbrales del grupo (cambiar aquí)
│   ├── kpi.js                  # fórmulas de los KPI (sin nada visual)
│   ├── app.js                  # interfaz: filtros, gráficos, módulos
│   └── lib/chart.umd.min.js    # Chart.js 4.6.1 (licencia MIT, ver CHARTJS_LICENSE.md)
├── data/
│   ├── generar_datos.py        # script que genera los datos (semilla fija)
│   ├── datos.js                # datos que lee el dashboard (generado)
│   ├── contenedores.csv        # un registro por contenedor (para Excel)
│   └── movimientos_bloque.csv  # remanejos, camiones y tiempo de servicio por bloque y día
├── docs/
│   ├── fichas_kpi.md           # una ficha por KPI
│   ├── bitacora_ia.md          # prompts importantes y decisiones del grupo
│   └── verificacion_manual.md  # 3 KPI verificados a mano
├── presentacion/               # diapositivas en PDF (pendiente)
├── CLAUDE.md                   # instrucciones para el agente de IA
└── README.md
```

## 5. Datos simulados: cómo se generan

```bash
python data/generar_datos.py
```

Solo usa la librería estándar de Python 3. La **semilla es fija (2026)**: si se vuelve a ejecutar, salen exactamente los mismos datos. Genera 60 días de análisis (del 1/9/2026 al 30/10/2026), con 90 días previos de «calentamiento» para que el patio no arranque vacío.

### Supuestos de los datos (justificación del grupo)

**Diseño del patio.** 8 bloques de 32 stacks (bahías de 20') × 6 lanes (filas). Los bloques de carga llena tienen 5 tiers y los de vacíos 6, porque los vacíos pesan poco y se apilan más alto. Se reservan *shuffle slots* (tiers − 1 por stack) para poder remanejar. Hay 26 slots inoperativos (10 en A1 y 16 en B2, por mantenimiento). Capacidad operativa total: **6,950 TEU**.

| Bloque | Categoría | Stacks × (Tiers × Lanes − Shuffle) − Inop. | Capacidad (TEU) |
|---|---|---|---|
| A1 | Importación | 32 × (5 × 6 − 4) − 10 | 822 |
| A2 | Importación | 32 × (5 × 6 − 4) − 0 | 832 |
| B1 | Exportación | 32 × (5 × 6 − 4) − 0 | 832 |
| B2 | Exportación | 32 × (5 × 6 − 4) − 16 | 816 |
| C1, C2 | Transbordo | 32 × (5 × 6 − 4) | 832 c/u |
| D1, D2 | Vacíos | 32 × (6 × 6 − 5) | 992 c/u |

**Llegadas.** Al inicio del análisis llegan, en promedio, 180 TEU/día de importación, 230 de exportación, 250 de transbordo y 100 de vacíos. El volumen **crece 0.35 % por día** (nuevos servicios): por eso el patio se llena. Importación y transbordo llegan sobre todo los días de buque (lunes, miércoles y sábado); exportación y vacíos llegan por camión en días hábiles, con poca actividad el domingo. El 60 % de los contenedores son de 40' (2 TEU).

**Dwell time.** Distribución lognormal (pocos contenedores se quedan mucho tiempo) con media de 6 días para importación, 3 para exportación, 3.8 para transbordo y 12 para vacíos. El 5 % de importación queda retenido entre 15 y 35 días más (aduana o abandono): eso produce el aging. Exportación solo sale el día de un buque. Si la importación tocaba salir un domingo, el 60 % se retira el lunes.

**Asignación a bloques.** Cada contenedor va al bloque menos lleno de su categoría. Si los dos pasan del 97 %, se desborda al bloque menos lleno del patio.

**Remanejos.** Con la altura media de la pila h = TEU del bloque ÷ (stacks × lanes), los remanejos esperados por retiro son `factor × (h − 1) ÷ 4 × (1 + 3 × máx(0; densidad − 0.75))`. Esto representa que, a pilas más altas, hay más contenedores encima del buscado, y que por encima del 75 % se pierde el espacio libre para reacomodar. El factor depende de qué tan predecible es el retiro: importación 1.0 (el consignatario llega cuando quiere), transbordo 0.8, exportación 0.5 (se apila según el plan de estiba) y vacíos 0.3 (sirve cualquier vacío de la misma línea y tipo). Se cuenta un número aleatorio de Poisson alrededor de ese valor.

**Tiempo de servicio en patio.** `10 + 8 × remanejos por retiro + 40 × máx(0; densidad − 0.75)` minutos por camión, más un ruido normal de ±1 min. Transbordo no usa camiones externos.

> Los parámetros son supuestos del grupo, con valores en rangos razonables para una terminal mediana. Si usan cifras de referencia de publicaciones de la industria, citen la fuente aquí.

## 6. KPI y metas

| KPI | Fórmula | Meta |
|---|---|---|
| Capacidad operativa | Bloques × Stacks × (Tiers × Lanes − Shuffle slots) − slots inoperativos | ≥ 98 % de la nominal |
| Yard Density | Inventario ÷ capacidad operativa × 100 | ≤ 70 % (amarilla 70 %, roja 80 %) |
| Dwell time por categoría | Σ días en patio ÷ contenedores de la categoría | Imp ≤ 5 · Exp ≤ 4 · Transb ≤ 4 · Vacíos ≤ 7 días |
| Dwell time global | Promedio ponderado por contenedores | ≤ 5 días |
| Rehandle ratio | Movimientos improductivos ÷ productivos × 100 | ≤ 25 % |
| Tiempo de servicio en patio | Tiempo del camión desde que entra al bloque hasta que sale | ≤ 20 min |
| Antigüedad del inventario | Contenedores con más de 10 días en patio | ≤ 10 % del inventario |
| Días hasta alerta roja | TEU de margen ÷ crecimiento diario del inventario | ≥ 14 días |

Las fichas completas están en [`docs/fichas_kpi.md`](docs/fichas_kpi.md) y las metas se cambian en `js/config.js`.

## 7. Cómo trabajamos (Git)

- La rama `main` siempre funciona. Cada integrante trabaja su módulo en una rama propia y abre un Pull Request; otro integrante lo revisa antes del merge.
- Commits pequeños y con mensajes que expliquen el cambio.
- Prompts importantes y correcciones a la IA: [`docs/bitacora_ia.md`](docs/bitacora_ia.md).
- Nunca se suben claves, contraseñas ni tokens.
