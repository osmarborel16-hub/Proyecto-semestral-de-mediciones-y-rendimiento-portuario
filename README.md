# Dashboard de KPI portuarios — Idea 3 · Un patio que se llena

Proyecto semestral · Medición y Rendimiento de Terminales Portuarias · Universidad Marítima de Panamá (UMIP)
Desarrollado con apoyo de agentes de IA (Claude Code). **Todos los datos son simulados.**

## Integrantes

| Integrante | Rol en el proyecto | Usuario GitHub |
|---|---|---|
| Osmar Chiari | _por asignar_ | _@usuario_ |
| _Nombre 2_ | _por asignar_ | _@usuario_ |
| _Nombre 3_ | _por asignar_ | _@usuario_ |
| _Nombre 4_ | _por asignar_ | _@usuario_ |

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

## 4. Cómo abrir el dashboard

1. Descargar o clonar el repositorio.
2. Abrir `index.html` con doble clic en Chrome o Edge. No hace falta instalar nada ni usar un servidor.
3. Los gráficos usan Chart.js desde un CDN, así que se necesita internet.

Enlace en GitHub Pages: _pendiente_

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
