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
| Lanes | 6 | ancho típico de un bloque atendido por RTG |
| Tiers | 5 | altura máxima de estiba |
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
| Contenedores con más de 10 días al cierre del día 60 | ≈ 18 % de los que siguen en patio |

El grupo debe decidir cómo calcula el **crecimiento diario** para "días hasta alerta roja". Por la variación semanal, una sola diferencia entre dos días no sirve. Opciones: la pendiente de los últimos 14 días o la pendiente de todo el periodo, sobre el promedio móvil de 7 días. Hay que justificar la elección en la ficha 8.

## 7. Fuentes de referencia

- _Si se usa una cifra real (altura de estiba, rangos de dwell, etc.), citarla aquí con su fuente._
