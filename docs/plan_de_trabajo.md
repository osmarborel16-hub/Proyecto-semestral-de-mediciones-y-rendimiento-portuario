# Plan de trabajo — Idea 3 · Un patio que se llena

Proyecto semestral UMIP · Medición y Rendimiento de Terminales Portuarias
Repositorio: `osmarborel16-hub/Proyecto-semestral-de-mediciones-y-rendimiento-portuario` (hoy solo tiene el README con el título)
Regla del grupo: todo en español, solo las fórmulas del curso, un solo `index.html`.

---

## 1. Objetivo y preguntas que el dashboard debe responder

Medir la congestión del patio (densidad, dwell time, remanejos, servicio a camiones) y probar con números una medida para liberar espacio.

1. ¿Qué categoría presiona más el patio y cuántos TEU ocupa de más?
2. ¿Cuántos días faltan para la alerta roja si nada cambia?
3. ¿Cuánto bajan la densidad y los remanejos con la propuesta?

Todo el dashboard se diseña al revés: cada módulo existe para responder una de estas tres preguntas.

---

## 2. Patio simulado (parámetros base)

| Parámetro | Valor propuesto | Comentario |
|---|---|---|
| Bloques | 6 (A–F) | A–B importación, C–D exportación, E transbordo, F vacíos |
| Stacks por bloque | 30 | posiciones de 20' a lo largo del bloque |
| Lanes (filas) | 6 | ancho típico de un bloque RTG |
| Tiers | 5 | altura máxima de estiba |
| Shuffle slots por stack | 4 | huecos reservados para remanejar (Tiers − 1) |
| Slots inoperativos | 80 | p. ej. 40 en C (reparación de pavimento) y 40 en E (zona de reefer fuera de servicio) |

**Capacidad operativa** = [Bloques × Stacks × (Tiers × Lanes − Shuffle slots)] − slots inoperativos
= [6 × 30 × (5 × 6 − 4)] − 80 = [6 × 30 × 26] − 80 = 4 680 − 80 = **4 600 TEU**

(Este es el primer KPI verificado a mano.)

---

## 3. Datos simulados (60 días, semilla fija)

### 3.1 Cómo se generan
- Un generador en JavaScript **dentro de `index.html`** con un PRNG con semilla fija (p. ej. `mulberry32(2026)`). Así siempre salen los mismos datos y el archivo abre con doble clic, sin servidor. (Ojo: `fetch()` de un .json no funciona al abrir con doble clic, por eso no se usan archivos externos de datos.)
- Un botón **"Exportar CSV"** descarga los datos generados; esa copia se guarda en `data/` para la verificación a mano y para el profesor.

### 3.2 Tablas
| Tabla | Campos | Sirve para |
|---|---|---|
| `contenedores` | id, categoría, tamaño (20'/40' → 1 o 2 TEU), bloque, fecha_entrada, fecha_salida (vacía si sigue en patio) | dwell time, aging |
| `inventario_diario` | día, bloque, categoría, TEU, entradas, salidas | densidad, mapa de calor, días hasta alerta roja |
| `movimientos` | día, bloque, turno, productivos, improductivos | rehandle ratio |
| `visitas_camion` | día, turno, hora_entrada_bloque, hora_salida_bloque, bloque, remanejos | tiempo de servicio en patio |
| `buques` | día de arribo, TEU descargados por categoría, TEU cargados | llegadas al patio y simulador |

### 3.3 Supuestos (van al README; valores de referencia para calibrar)
| Categoría | Llegadas (TEU/día) | Dwell actual (días) | Inventario esperado (TEU) |
|---|---|---|---|
| Importación | ~200 | ~6.5 | ~1 300 |
| Exportación | ~180 | ~4.0 | ~720 |
| Transbordo | ~160 | ~4.5 | ~720 |
| Vacíos | ~70 entran / ~60 salen | ~13 y subiendo | ~900 y creciendo |
| **Total** | | | **~3 650 TEU ≈ 79 % de densidad al día 60** |

Para que los datos sean creíbles:
- **Buques:** 3 o 4 arribos por semana; cada uno descarga entre 600 y 900 TEU (importación + transbordo) → picos de inventario los días de buque.
- **Semana:** menos retiros de importación el domingo y más el lunes.
- **Camiones:** horas pico de 8 a 11 y de 14 a 17, tres turnos.
- **Vacíos:** entran más de los que salen (la naviera reposiciona lento). Esto hace crecer el inventario unos 8 a 12 TEU por día y es la **causa raíz** que el grupo debe descubrir y defender.
- **Remanejos según densidad** (supuesto justificado: a más altura de estiba, más cajas encima de la que se busca): ratio ≈ 20 % + 1.2 × (densidad − 60) cuando la densidad pasa de 60 %, más un ruido aleatorio pequeño.
- **Tiempo de servicio del camión** ≈ 15 min de base + unos 3 min por cada remanejo + una cola en hora pico.
- **Calibración:** ajustar el crecimiento para que la alerta roja (85 %) quede entre 2 y 4 semanas después del día 60.

Si se usa una cifra real de referencia (por ejemplo, una altura de estiba o un rango de dwell de la industria), se cita la fuente en el README.

### 3.4 Detalle que el profesor puede preguntar
- El **dwell time** se calcula con los contenedores que **ya salieron** (estancia completa).
- El **aging** (antigüedad) se calcula con los que **siguen en patio** (días desde la entrada hasta hoy).
- El inventario y la densidad se miden en **TEU**. El dwell time se mide **por contenedor**, y un 40' cuenta como un contenedor.

---

## 4. KPI: fórmula, meta y alerta

Las metas son propuestas del grupo y cada una se justifica en su ficha.

| # | KPI | Fórmula (del curso) | Unidad | Meta propuesta | Señal |
|---|---|---|---|---|---|
| 1 | Capacidad operativa | [Bloques × Stacks × (Tiers × Lanes − Shuffle slots)] − slots inoperativos | TEU | referencia: 4 600; slots inoperativos ≤ 2 % | gris si hay más inoperativos de la cuenta |
| 2 | Yard Density | Inventario ÷ capacidad operativa × 100 | % | ≤ 70 % | verde ≤ 70 · amarilla 70–85 · roja > 85 |
| 3 | Dwell time por categoría | Σ días en patio ÷ contenedores de la categoría | días | Imp ≤ 5 · Exp ≤ 4 · Trb ≤ 4 · Vac ≤ 7 | rojo si supera la meta |
| 4 | Dwell time global | Promedio ponderado por contenedores (no promedio simple) | días | ≤ 5 | rojo si > 5 |
| 5 | Remanejos (rehandle ratio) | Movimientos improductivos ÷ movimientos productivos × 100 | % | ≤ 30 % | amarillo 30–40 · rojo > 40 |
| 6 | Tiempo de servicio en patio | Tiempo del camión desde que entra al bloque hasta que sale | min | ≤ 25 min (promedio del turno) | rojo si > 25 |
| 7 | Antigüedad del inventario | Contenedores con más de X días en patio (X ajustable, por defecto 10) | contenedores | ≤ 5 % del inventario | rojo si supera |
| 8 | Días hasta alerta roja | TEU de margen ÷ crecimiento diario del inventario | días | ≥ 30 días | rojo si < 15 · amarillo 15–30 |

En las fichas hay que dejar escritas estas definiciones operativas:
- **TEU de margen** = (85 % × capacidad operativa) − inventario actual = 3 910 − inventario.
- **Crecimiento diario** = pendiente del inventario de los últimos 14 días (o promedio de entradas − salidas). El grupo elige uno y lo justifica.
- **Dwell global ponderado** = Σ (dwell de la categoría × contenedores de la categoría) ÷ Σ contenedores. En pantalla se muestra junto al promedio simple, para que se vea la diferencia.

---

## 5. Módulos del dashboard (`index.html`)

Arriba de todo:
- Una barra fija con el aviso **"DATOS SIMULADOS"**.
- **Filtros globales:** rango de fechas, turno, bloque y categoría.
- Una fila de **tarjetas de KPI** con su meta y su color.

| Módulo | Qué muestra | Interacción | Pregunta que responde |
|---|---|---|---|
| **1 · Mapa del patio** | Cuadrícula de los bloques A–F coloreada por densidad (mapa de calor); TEU y % por bloque; tarjeta de capacidad operativa | Deslizador de día (1–60); umbrales amarillo/rojo editables; clic en un bloque para filtrar todo el dashboard | Dónde está la congestión hoy |
| **2 · Dwell time** | Barras de dwell por categoría contra su meta; histograma de antigüedad (0–3, 4–7, 8–10, >10 días); dwell global ponderado vs simple | Campo X días para el aging; filtro de categoría | **P1:** qué categoría presiona y cuántos TEU de más (TEU de más = llegadas diarias × (dwell actual − dwell meta)) |
| **3 · Remanejos** | Rehandle ratio por bloque y por día (líneas); dispersión densidad vs remanejos con recta de tendencia; tiempo de servicio del camión por turno | Filtros de bloque y turno | Relación causa-efecto: la densidad provoca remanejos, los remanejos provocan espera |
| **4 · Simulador de escenarios** | Proyección de densidad a 14 días con líneas de umbral; **días hasta alerta roja** | Deslizadores: dwell de cada categoría, buques extra por semana, TEU por buque, tiempo libre de almacenaje | **P2:** cuántos días faltan para la roja |
| **5 · Mejora (A3)** | Ficha A3: problema → causa raíz → categoría crítica → propuesta → TEU liberados → densidad nueva → remanejos esperados; tabla de situación actual vs propuesta | Selector de propuesta (evacuar vacíos, reducir el tiempo libre, citas de retiro, combinada) | **P3:** cuánto bajan la densidad y los remanejos |
| *6 · Camiones y citas (extra, +3)* | Tiempo de servicio por hora; efecto de pasar X % de los retiros a citas fuera de la hora pico | Deslizador del % con cita | Justifica la medida "citas de retiro" con su propio KPI |

### Lógica del simulador (Módulo 4)
- Se basa en la **Ley de Little** (la misma del ejemplo de la ficha del curso): inventario de la categoría = llegadas diarias × dwell time.
- Al cambiar el dwell de una categoría, su inventario se mueve en ΔTEU = llegadas × Δdwell. Ese número son los **TEU liberados**.
- Proyección día a día: inventario(t+1) = inventario(t) + entradas − salidas, con salidas = inventario de la categoría ÷ dwell, sumando los buques programados.
- La densidad proyectada se compara con el umbral rojo y se calcula en qué día lo cruza.

### Cálculo de la mejora (Módulo 5), ejemplo con los valores de referencia
- Vacíos: 70 TEU/día × (13 − 7) días = **420 TEU de más** → es la categoría crítica (importación tiene unos 300 de más, transbordo unos 80).
- Si se evacúan vacíos hasta llegar a un dwell de 7 días: inventario 3 650 − 420 = 3 230 TEU → densidad ≈ **70 %** (antes ≈ 79 %).
- Remanejos esperados con la recta del Módulo 3: unos 43 % → unos **32 %**.
- Los números finales salen de los datos generados, no de esta tabla.

---

## 6. Estructura del repositorio

```
Proyecto-semestral-de-mediciones-y-rendimiento-portuario/
├── index.html              # dashboard completo: estilos, generador de datos, cálculos y gráficos
├── data/
│   ├── datos_simulados.csv # exportado desde el dashboard (semilla 2026)
│   └── supuestos.md        # tabla de supuestos y fuentes
├── docs/
│   ├── fichas_kpi.md       # 8 fichas: nombre, definición, fórmula, unidad y frecuencia, meta, fuente, decisión
│   ├── verificacion_manual.md  # 3 o más KPI calculados a mano vs dashboard
│   └── bitacora_ia.md      # prompts importantes, qué se aceptó, qué se corrigió y por qué
├── presentacion/           # diapositivas en PDF
└── README.md               # problema, cómo abrir, supuestos, integrantes, enlace a GitHub Pages
```

Chart.js se carga desde un CDN. Conviene guardar además una copia local de respaldo (`chart.umd.min.js`) por si no hay internet el día de la presentación.

Dentro de `index.html`, cada módulo va en su propio bloque marcado (`<!-- ===== MÓDULO 2 · DWELL ===== -->` y una función `renderModulo2()`). Así cada integrante trabaja en su rama sin pisar a los demás y los Pull Requests se fusionan sin conflictos.

---

## 7. Reparto del trabajo (3 integrantes: Leslie West toma los roles 1 y 2)

| Integrante | Responsable de | Rama sugerida |
|---|---|---|
| 1 · Leslie West | Generador de datos y semilla, capacidad operativa, Módulo 1, `supuestos.md`, README | `datos-y-mapa` |
| 2 · Leslie West | Módulo 2 (dwell y aging), fichas de KPI 3, 4 y 7 | `modulo-dwell` |
| 3 · Adriana Garibaldi | Módulo 3 (remanejos y servicio en patio), fichas 5 y 6, **verificación manual** | `modulo-remanejos` |
| 4 · Osmar Chiari | Módulos 4 y 5 (simulador y A3), fichas 1, 2 y 8, módulo extra, GitHub Pages | `simulador-mejora` |

Reglas del equipo:
- Cada quien hace commits propios con mensajes claros.
- Todo entra por Pull Request y **otro integrante lo revisa** antes de fusionar.
- La bitácora de IA la alimentan todos.
- Nada de claves ni tokens en el repositorio.

---

## 8. Cronograma por hitos (poner las fechas que dé el profesor)

| Hito | Entregables | Tareas concretas |
|---|---|---|
| **H1 · Propuesta (5 pts)** | README inicial, problema, lista de KPI, boceto de módulos | Crear la estructura de carpetas; README con problema y 8 KPI; boceto de los 5 módulos (foto o diagrama); invitar al profesor como colaborador |
| **H2 · Avance (10 pts)** | Datos listos, 2 módulos funcionando, fichas en borrador, commits de todos | Generador con semilla + CSV exportado; Módulos 1 y 2 operativos con filtros; fichas en borrador; primera entrada de la bitácora |
| **H3 · Entrega final** | Dashboard completo, fichas, bitácora, README, diapositivas | Módulos 3, 4 y 5 (y el 6 si da tiempo); metas y alertas en todas las tarjetas; verificación manual de 3 KPI; GitHub Pages; PDF de la presentación |
| **H4 · Presentación** | 15 min + preguntas | Ensayo con todos hablando; practicar cambiar un supuesto en vivo y explicar un cálculo a mano |

---

## 9. Verificación manual (mínimo 3 KPI, en `docs/verificacion_manual.md`)

1. **Capacidad operativa:** 6 × 30 × (5 × 6 − 4) − 80 = 4 600 TEU.
2. **Yard Density** de un día y un bloque concretos: TEU del CSV ÷ capacidad del bloque × 100, comparado con el dashboard.
3. **Dwell time global ponderado:** con una muestra de unos 20 contenedores del CSV, en Excel; además se muestra por qué el promedio simple da otro número.
4. *(Extra)* **Días hasta alerta roja:** (3 910 − inventario del día 60) ÷ crecimiento diario.

Cada caso lleva captura del dashboard, tabla con el cálculo a mano y la diferencia (debe ser 0 o explicarse por redondeo).

---

## 10. Presentación (15 min)

Problema (2 min) → KPI y metas (3 min) → datos simulados y supuestos (2 min) → demostración en vivo: mapa → dwell → remanejos → simulador (5 min) → A3 con antes/después (2 min) → conclusiones (1 min). Cada integrante presenta el módulo que construyó.

---

## 11. Lista de control antes de entregar
- [ ] `index.html` abre con doble clic en Chrome/Edge sin errores en la consola
- [ ] 5 módulos (o más) y 8 KPI con meta, color y ficha
- [ ] Aviso de datos simulados visible
- [ ] Filtros y deslizadores actualizan tarjetas y gráficos
- [ ] Las tres preguntas de mejora respondidas con números en el Módulo 5
- [ ] README, supuestos, fichas, bitácora y verificación manual completos
- [ ] Commits y PR de todos; el profesor tiene acceso
- [ ] GitHub Pages activo (+2)
