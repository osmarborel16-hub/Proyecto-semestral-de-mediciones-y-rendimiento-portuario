# Datos simulados: cómo se generan y qué supuestos usan

## 1. Reproducibilidad

- Los datos se generan **dentro de `index.html`** (sección 4 del `<script>`, función `generarDatos()`). Todos los parámetros están juntos en el objeto `SIM`.
- Se usa un generador pseudoaleatorio **mulberry32 con semilla fija 2026**. Cada vez que se abre el dashboard salen exactamente los mismos datos. Para probar otro escenario aleatorio basta con cambiar `SIM.semilla`.
- Los CSV de esta carpeta salen del mismo código. Hay dos formas de obtenerlos:
  - en el dashboard: panel **"Datos simulados"** → botones de descarga;
  - en la terminal: `node data/exportar_csv.js`. Este script no tiene lógica propia: lee y ejecuta el código de `index.html`.
- Periodo reportado: **día 1 (lunes 7 sep 2026) a día 60 (jueves 5 nov 2026)**. Antes se simulan **30 días de calentamiento**, para que el día 1 el patio ya esté ocupado como en una terminal real. Esos días no se reportan, pero algunos contenedores que entraron en el calentamiento siguen en el patio; por eso tienen `dia_entrada` negativo.

## 2. Patio

| Parámetro | Valor | Justificación |
|---|---|---|
| Bloques | 6 (A–F) | tamaño de terminal mediana |
| Stacks por bloque | 30 | posiciones de 20' a lo largo del bloque |
| Lanes | 6 | ancho de bloque estándar para RTG: los fabricantes ofrecen pórticos para 6 filas + carril de camión [F3] |
| Tiers | 5 | apilado "1 sobre 5": el RTG levanta un contenedor por encima de una pila de 5 [F3] |
| Shuffle slots | 4 por stack | se reservan Tiers − 1 huecos para poder remanejar |
| Slots inoperativos | 80 (40 en C y 40 en E) | reparación de pavimento y tomas reefer fuera de servicio |
| **Capacidad operativa** | **4 600 TEU** | [6 × 30 × (5 × 6 − 4)] − 80 |

**Asignación de bloques.** Cada categoría tiene bloques preferidos. Un contenedor entra al primero de su lista que esté por debajo del **85 %**; si todos están por encima, va al menos lleno de la lista. El bloque E funciona como **bloque de desborde**.

| Categoría | Orden de preferencia |
|---|---|
| Importación (IMP) | A → B → E |
| Exportación (EXP) | C → E |
| Transbordo (TRB) | D → E |
| Vacíos (VAC) | F → E |

## 2b. Umbrales de alerta de densidad (decisión del grupo)

| Estado | Rango | Justificación |
|---|---|---|
| ✔ Verde | ≤ 70 % | El Banco Mundial ubica el riesgo de congestión por encima del 70 % de utilización; el promedio mundial de 2025 fue 72.2 % [F1] |
| ⚠ Amarilla | > 70 % y ≤ 85 % | Zona de vigilancia: el patio funciona, pero los remanejos y las esperas crecen |
| ⛔ Roja | > 85 % | Con utilizaciones de 80–85 %, puertos de EE. UU. reportaron una alteración severa de la capacidad de almacenar y mover contenedores y más tiempo de camiones [F2]. Pasado cierto umbral, el rendimiento del patio cae de forma marcada [F4] |

Los umbrales se pueden cambiar en vivo en el Módulo 1. Todo el dashboard usa los valores que estén puestos.

## 3. Llegadas y salidas por categoría

| Categoría | Cómo entra | Cómo sale | Parámetros |
|---|---|---|---|
| **Importación** | se descarga del buque durante su operación (18 h) | la retira un camión | ~340 TEU por buque (±15 %). Dwell con distribución lognormal de media 6.5 días. Un **3 % queda retenido** (aduana o sin retirar) entre 15 y 30 días. Lo que tocaba retirar en **domingo pasa al lunes** |
| **Exportación** | la entrega un camión entre 1 y 7 días antes de su buque (lo más común, 3 días) | se carga en su buque | ~300 TEU por buque (±15 %). Las entregas de domingo pasan al sábado |
| **Transbordo** | se descarga de un buque | sale en el siguiente buque disponible tras una espera (lognormal de media 3.5 días, mínimo 2) | ~290 TEU por buque (±15 %) |
| **Vacíos** | los devuelven los camiones cada día | salen en los buques según la **cuota de la naviera**, primero los más antiguos | ~64 TEU por día (menos el domingo, más el lunes); stock inicial de 560 TEU. Cuota de **128 TEU por buque antes del día 1 y 120 TEU desde el día 1** |

- **Buques:** lunes, miércoles y viernes, más un sábado sí y otro no (**3.5 buques por semana**, 30 en el periodo). La hora de atraque es aleatoria.
- **Tamaños:** de 55 a 60 % de los contenedores son de 40' (2 TEU); el resto, de 20' (1 TEU).
- **Camiones:** las horas se reparten con picos de 8 a 11 y de 14 a 17 (`PESO_HORA`). Turnos: 1 = 06–14, 2 = 14–22, 3 = 22–06.

**Causa raíz simulada (supuesto central del proyecto).** Los vacíos entran más rápido de lo que la naviera los evacúa, y desde el día 1 la cuota por buque baja de 128 a 120 TEU. El stock de vacíos crece unos **8–9 TEU por día**, desborda hacia el bloque E y sube la densidad total. Es una situación que el grupo **supone** para el ejercicio, no un dato real.

**Rangos de dwell.** Los dwell simulados (importación ≈ 7, exportación ≈ 4, transbordo ≈ 5 días) quedan dentro de los rangos observados en puertos reales: en el tercer trimestre de 2025, el dwell promedio de importación estuvo entre 3 y 9 días en la mayoría de los casos, y el de exportación y transbordo entre 3 y 10 [F5]. El dwell de vacíos (≈ 13 días y subiendo) es alto a propósito: es el problema que el proyecto analiza.

## 4. Relaciones supuestas

- **Remanejos según densidad.** Cada movimiento productivo genera un número de remanejos que sigue una distribución de Poisson con media ratio ÷ 100, donde:
  ratio (%) = 20 + 1.2 × max(0, densidad del bloque al inicio del día − 60) + ruido (desviación de 3 puntos).
  Justificación: a mayor altura de estiba, más contenedores quedan encima del que se busca.
- **Tiempo de servicio del camión en el bloque** = 16 min + 6 min por cada remanejo de esa visita + cola (de 3 a 9 min en hora pico, de 0 a 3 min fuera de pico) + ruido (desviación de 2 min), con un mínimo de 8 min.
  Visitas que generan camión: retiro de importación, entrega de exportación y entrega de vacíos. El transbordo no usa camión.

## 5. Tablas (archivos CSV)

### `contenedores.csv`
Todos los contenedores que estuvieron en el patio en algún momento del periodo.

| Columna | Significado |
|---|---|
| id | identificador (prefijo de categoría + número) |
| categoria | IMP, EXP, TRB o VAC |
| tamano / teu | 20' = 1 TEU · 40' = 2 TEU |
| bloque | A–F |
| entrada / salida | fecha y hora; `salida` vacía = sigue en patio al cierre del día 60 |
| dia_entrada / dia_salida | número de día (1 = 7 sep 2026; negativo = entró en el calentamiento) |
| dias_en_patio | estancia completa en días (solo los que salieron) → **dwell time** |
| dias_al_cierre | días que lleva en patio al cierre del día 60 (solo los que siguen) → **aging** |
| buque | buque con el que llegó (IMP, TRB) o con el que salió (EXP, VAC) |

### `inventarioDiario.csv`
TEU **al cierre** de cada día, por bloque y categoría, con los TEU que entraron y salieron ese día. → **Yard Density**, mapa de calor, días hasta alerta roja.

### `movimientos.csv`
Movimientos productivos (entradas y salidas de contenedores) e improductivos (remanejos) por día, bloque y turno. → **rehandle ratio**.

### `visitasCamion.csv`
Una fila por visita de camión: hora de entrada y de salida del bloque, operación (entrega o retiro), remanejos y minutos. → **tiempo de servicio en patio**.

### `buques.csv`
Atraque de cada buque y TEU descargados y cargados por categoría, incluida la cuota y la carga real de vacíos.

## 6. Comprobación rápida de credibilidad (semilla 2026)

Valores de control para revisar que los datos tienen sentido. **No son los KPI oficiales**: esos los calcula cada módulo con las fórmulas del curso.

| Control | Valor |
|---|---|
| Densidad total día 1 → día 60 | 70.6 % → 80.2 % (promedio de 7 días: ~71 % → ~79 %) |
| Variación semanal | la densidad sube 5–8 puntos los días de buque y baja después |
| Vacíos en inventario día 1 → día 60 | 658 → 1 166 TEU |
| Densidad por bloque día 60 | A 79 · B 59 · C 85 · D 79 · E 90 · F 90 % |
| Dwell de los contenedores que salieron | IMP ≈ 7.1 · EXP ≈ 4.2 · TRB ≈ 5.0 · VAC ≈ 13.2 días |
| Remanejos (global del periodo) | ≈ 39 % |
| Visitas de camión | ≈ 246 por día; servicio medio ≈ 22.6 min |
| Contenedores con más de 10 días al cierre del día 60 | 365 de 2 328 que siguen en patio (15.7 %) |

El grupo debe decidir cómo calcula el **crecimiento diario** para "días hasta alerta roja". Por la variación semanal, una sola diferencia entre dos días no sirve. Opciones: la pendiente de los últimos 14 días o la pendiente de todo el periodo, sobre el promedio móvil de 7 días. Hay que justificar la elección en la ficha 8.

## 7. Fuentes de referencia

Solo se usan para justificar parámetros y umbrales. Los datos del dashboard son todos simulados.

- **[F1]** Banco Mundial y S&P Global Market Intelligence, *Container Terminal Performance Improvement Guide*, citado en Trans.info, "Container terminals hit 72.2% capacity. The World Bank says that's already past the congestion line". https://trans.info/world-bank-container-terminals-capacity-congestion-514704
- **[F2]** Logistics Management, "New reports point to U.S. port congestion in 'Critical' shape". https://www.logisticsmgmt.com/article/new_reports_point_to_u.s._port_congestion_in_critical_shape/Resilience360
- **[F3]** Liebherr, *Rubber Tyre Gantry Crane (RTG) – Technical Description*: luces de pórtico para 5, 6 y 7 filas + carril de camión y alturas de elevación de 1 sobre 3 a 1 sobre 6. https://www-assets.liebherr.com/media/bu-media/lhbu-mcc/downloads-and-brochures/brochures/lcc/liebherr-rtg-cranes-technical-description.pdf
- **[F4]** S. Wiersma, *Limiting the Performance Loss of an RTG Container Terminal with a Highly Utilized Storage Yard*, TU Delft. https://repository.tudelft.nl/record/uuid:27aca9f5-4f9c-413c-8b26-473fcf10b15e
- **[F5]** S&P Global Market Intelligence, *Middle East, India and Africa port congestion analysis Q3 2025* (28 nov 2025). https://www.spglobal.com/market-intelligence/en/news-insights/research/2025/11/middle-east-india-and-africa-port-congestion-analysis-q3-2025
