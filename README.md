# Dashboard de KPI portuarios — Idea 3 · Un patio que se llena

Proyecto semestral · Medición y Rendimiento de Terminales Portuarias · Universidad Marítima de Panamá (UMIP)
Desarrollado con apoyo de agentes de IA (Claude Code). **Todos los datos son simulados.**

## Integrantes

| Integrante | Roles | Responsable de |
|---|---|---|
| **Leslie West** | Integrantes 1 y 2 | Datos simulados, capacidad operativa, Módulo 1 · Mapa del patio, Módulo 2 · Dwell time, supuestos, README y fichas 3, 4 y 7 |
| **Adriana Garibaldi** | Integrante 3 | Módulo 3 · Remanejos y servicio en patio, Módulo 6 · Camiones y citas (extra), fichas 5 y 6, verificación manual de KPI |
| **Osmar Chiari** | Integrante 4 | Coordinación y estructura inicial (H1), Módulo 4 · Simulador, Módulo 5 · Mejora (A3), fichas 1, 2 y 8, GitHub Pages |

Todo se sube desde la cuenta del grupo (`osmarborel16-hub`), pero cada commit lleva como **autor** al integrante responsable de ese trabajo. Los tres primeros PR (#2 a #5: estructura, datos y Módulo 1) se subieron antes de definir los nombres y aparecen con autor "Claude". Sus responsables son Osmar Chiari (estructura inicial) y Leslie West (datos, Módulo 1, supuestos y README).

Grupo: ____ · Profesor: José Abel Diez Cubilla

## 1. Problema

El patio de contenedores está cada vez más lleno. Con alta densidad aumentan los **remanejos** (movimientos improductivos), los **camiones esperan más** en el patio y las **grúas de muelle se quedan esperando** contenedores. Algunas categorías de carga se quedan demasiados días en la terminal.

El grupo simula el inventario del patio por bloque durante 60 días, mide la densidad, el dwell time y los remanejos, y evalúa medidas para liberar espacio: reducir el tiempo libre de almacenaje, citas de retiro o evacuar vacíos.

### Preguntas que responde el dashboard
1. ¿Qué categoría presiona más el patio y cuántos TEU ocupa de más?
2. ¿Cuántos días faltan para la alerta roja si nada cambia?
3. ¿Cuánto bajan la densidad y los remanejos con la propuesta?

## 2. KPI (fórmulas del curso)

| # | KPI | Fórmula | Unidad |
|---|---|---|---|
| 1 | Capacidad operativa | [Bloques × Stacks × (Tiers × Lanes − Shuffle slots)] − slots inoperativos | TEU |
| 2 | Yard Density | Inventario ÷ capacidad operativa × 100 | % |
| 3 | Dwell time por categoría | Σ días en patio ÷ contenedores de la categoría | días |
| 4 | Dwell time global | Promedio ponderado por contenedores (no promedio simple) | días |
| 5 | Remanejos (rehandle ratio) | Movimientos improductivos ÷ movimientos productivos × 100 | % |
| 6 | Tiempo de servicio en patio | Tiempo del camión desde que entra al bloque hasta que sale | min |
| 7 | Antigüedad del inventario | Contenedores con más de X días en patio (aging) | contenedores |
| 8 | Días hasta alerta roja | TEU de margen ÷ crecimiento diario del inventario | días |

La ficha completa de cada KPI (meta, fuente y decisión que apoya) está en [`docs/fichas_kpi.md`](docs/fichas_kpi.md).

## 3. Módulos del dashboard (boceto)

| Módulo | Qué muestra | Interacción |
|---|---|---|
| 1 · Mapa del patio | Mapa de calor de densidad por bloque (A–F), alertas amarilla y roja | Deslizador de día, umbrales editables, clic en un bloque para filtrar |
| 2 · Dwell time | Dwell por categoría (importación, exportación, transbordo, vacíos) vs meta; gráfico de antigüedad | X días para el aging, filtro de categoría |
| 3 · Remanejos | Remanejos por bloque y por día; dispersión densidad vs remanejos; tiempo de servicio del camión | Filtros de bloque y turno |
| 4 · Simulador de escenarios | Proyección de la densidad a 14 días y días hasta la alerta roja | Deslizadores de dwell por categoría y de llegada de buques |
| 5 · Mejora (A3) | Categoría crítica, propuesta, TEU liberados, nueva densidad y remanejos esperados; actual vs propuesta | Selector de propuesta |
| 6 · Camiones y citas (extra) | Tiempo de servicio por hora y efecto de las citas de retiro | % de retiros con cita |

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ DATOS SIMULADOS                                           │
│  Filtros: [Fechas] [Turno] [Bloque] [Categoría]              │
│  [Capacidad] [Densidad] [Dwell global] [Remanejos] [Servicio]│
│  [Aging] [Días a alerta roja]                                │
├──────────────────────────────────────────────────────────────┤
│  Mapa | Dwell | Remanejos | Simulador | Mejora A3 | Camiones │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              contenido del módulo activo               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Estado de avance

| Módulo | Estado | Responsable |
|---|---|---|
| Datos simulados (semilla 2026) | ✅ Listo | Leslie West |
| 1 · Mapa del patio | ✅ Listo | Leslie West |
| 2 · Dwell time | ✅ Listo | Leslie West |
| 3 · Remanejos | ✅ Listo | Adriana Garibaldi |
| 4 · Simulador de escenarios | ✅ Listo | Osmar Chiari |
| 5 · Mejora (A3) | ✅ Listo | Osmar Chiari |
| 6 · Camiones y citas (extra) | ✅ Listo | Adriana Garibaldi |

## 4. Cómo abrir y usar el dashboard

1. Descargar o clonar el repositorio.
2. Abrir `index.html` con doble clic en Chrome o Edge. No hace falta instalar nada ni usar un servidor.
3. Los gráficos usan Chart.js desde un CDN, así que se necesita internet. Sin internet, el Módulo 1 sigue mostrando el mapa, las alertas y la tabla de datos, pero no el gráfico.

**Filtros globales** (barra superior): rango de días, turno, bloque y categoría. El **"Día hasta"** es el día de corte que usan el mapa y las tarjetas de KPI.

**Módulo 1 · Mapa del patio**
- **Deslizador "Día del mapa"**: cambia el día de corte (está sincronizado con "Día hasta"). **▶ Reproducir** recorre los 60 días; sirve para la demostración en vivo.
- **Mapa de calor**: cada bloque muestra su Yard Density, los TEU sobre su capacidad, un medidor con las marcas de los umbrales y la mezcla de categorías. El color siempre va con ícono y texto de estado (✔ Verde, ⚠ Amarilla, ⛔ Roja).
- **Clic en un bloque**: filtra todo el dashboard por ese bloque. Un segundo clic quita el filtro.
- **Umbrales amarillo y rojo**: se pueden cambiar en vivo (por ejemplo, si el profesor lo pide) y todo el dashboard se recalcula.
- **Alertas del día**: densidad del patio completo y de cada bloque en alerta, con los TEU que faltan para la roja (o que la superan) y los días seguidos en ese estado.
- **Evolución de la densidad**: el total del patio o los 6 bloques en el rango de días elegido, con las líneas de umbral y una línea punteada en el día del mapa. Debajo hay una tabla con los mismos datos.
- **Capacidad operativa** (KPI 1): el cálculo completo aparece al pie del módulo.

**Módulo 2 · Dwell time**
- **Respuesta a la pregunta 1**: qué categoría presiona más el patio y cuántos TEU ocupa de más. Se calcula con la Ley de Little: llegadas diarias × (dwell actual − meta).
- **Barras de dwell por categoría** con la marca de la meta y el estado (✔ cumple / ⛔ días sobre la meta). Cuentan los contenedores que **salieron** en el rango de días filtrado.
- **Dwell global ponderado** (el KPI) junto al **promedio simple** tachado, para explicar por qué no se usa el simple.
- **Antigüedad del inventario**: histograma por categoría al cierre del día de corte, con la línea de X días. **X se cambia en vivo** y la tarjeta de KPI se actualiza.
- **Detalle del cálculo**: tabla con contenedores, Σ días, dwell, meta, llegadas y TEU de más. Es la base para la verificación a mano.
- Respeta los filtros de días, bloque y categoría; el turno no aplica.

**Módulo 3 · Remanejos** (con 4 sub-pestañas)
- **Resumen**: remanejos del patio, bloque con más y con menos remanejos, tiempo de servicio del camión y diferencia entre hora pico y fuera de pico.
- **Por bloque**: barras de remanejos por bloque con las líneas de meta (30 %) y de rojo (40 %), y una tabla con densidad media, movimientos productivos e improductivos, y estado.
- **Por día**: evolución diaria (total o por bloque) con la tabla equivalente.
- **Densidad vs remanejos**: un punto por bloque y día, con la recta de tendencia en el tramo de operación (≥ 60 %). Muestra cuántos puntos de remanejos se suman por cada 10 puntos de densidad. El Módulo 5 usa esta relación para estimar los remanejos con la propuesta.
- **Servicio en patio**: minutos promedio por hora de entrada al bloque (con la meta de 25 min), por turno y por bloque.
- Respeta los filtros de días, **turno** y bloque; la categoría solo aplica al tiempo de servicio.

**Módulo 4 · Simulador de escenarios**
- Mide el **régimen actual** en los últimos 28 días hasta el día de corte: inventario, crecimiento diario (pendiente de mínimos cuadrados), llegadas y dwell por categoría.
- **Deslizadores**: dwell de cada categoría (con la marca del valor actual y la meta), buques extra por semana y TEU por buque.
- **Proyección a 14 días**: densidad real de los últimos 30 días, proyección sin cambios (punteada) y proyección con el escenario, con los umbrales.
- **Días hasta alerta roja** (KPI 8) = TEU de margen ÷ crecimiento diario, sin cambios y con el escenario, y **TEU liberados**.
- Cómo proyecta: inventario de hoy + tendencia + cambio por el escenario según la Ley de Little (llegadas × Δdwell), aplicado de forma gradual durante un ciclo de dwell.
- **↺ Restablecer** vuelve a la situación actual.

**Módulo 5 · Mejora (A3)**
- **Selector de propuesta**: evacuar vacíos, reducir el tiempo libre de importación, combinada o el escenario armado en el Módulo 4.
- **Respuestas a las 3 preguntas del proyecto** con los números del día de corte.
- **Ficha A3** de 8 bloques: antecedentes, situación actual, causa raíz, objetivo, contramedidas, resultado esperado, plan de implementación y seguimiento.
- **Tabla actual vs propuesta**: inventario, densidad, remanejos esperados, días hasta alerta roja y dwell (global y por categoría).

**Módulo 6 · Camiones y citas (extra)**
- **Controles**: % de camiones con cita, a quién aplica (solo retiros de importación, o también entregas), ventana horaria de citas y % de remanejos evitados en los retiros con cita (pre-ubicación, supuesto editable).
- **Tarjetas**: servicio promedio en patio hoy → con citas, % de visitas que superan 25 min, camiones en la hora más cargada del patio y horas-camión ahorradas por día. Si la ventana es muy corta, avisa que se crea una hora pico nueva.
- **Camiones por hora** (hoy vs con citas): las citas se asignan primero a las horas menos cargadas de la ventana, hasta nivelarlas.
- **Servicio por hora**: medido hoy vs estimado con citas, con la meta de 25 min.
- **Cómo se estima**: regresión minutos ≈ a + b × remanejos + c × camiones en esa hora, con sus coeficientes y R². Debajo, una tabla por hora con todos los valores.
- Respeta los filtros de días, bloque y categoría; el turno no aplica. Supuestos en [`data/supuestos.md`](data/supuestos.md#4b-escenario-de-citas-de-camiones-módulo-6).

Enlace en GitHub Pages: https://osmarborel16-hub.github.io/Proyecto-semestral-de-mediciones-y-rendimiento-portuario/

## 5. Datos simulados y supuestos

- Los datos se generan dentro de `index.html` (función `generarDatos()`) con un generador pseudoaleatorio de **semilla fija (2026)**. Cada vez que se abre salen exactamente los mismos datos.
- Periodo de 60 días (7 sep a 5 nov 2026), 6 bloques (A–F), 4 categorías (importación, exportación, transbordo y vacíos) y 30 buques.
- Las tablas se descargan en CSV desde el panel "Datos simulados" del dashboard o con `node data/exportar_csv.js`. Los CSV ya generados están en [`data/`](data/).
- Todos los supuestos, sus justificaciones y el significado de cada columna están en [`data/supuestos.md`](data/supuestos.md).

## 6. Estructura del repositorio

```
├── index.html               # dashboard completo (un solo archivo)
├── data/                    # supuestos y datos exportados (CSV)
├── docs/
│   ├── fichas_kpi.md        # una ficha por KPI
│   ├── verificacion_manual.md
│   ├── bitacora_ia.md       # prompts importantes y decisiones del grupo
│   └── plan_de_trabajo.md
├── presentacion/            # diapositivas en PDF
└── README.md
```

## 7. Forma de trabajo

- Cada integrante trabaja en su propia rama y sube sus cambios con un **Pull Request**. Otro integrante lo revisa antes de fusionarlo.
- Los mensajes de commit explican qué se cambió.
- No se suben claves, contraseñas ni tokens.
