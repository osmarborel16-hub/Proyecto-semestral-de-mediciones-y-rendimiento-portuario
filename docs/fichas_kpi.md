# Fichas de KPI · Idea 3 «Un patio que se llena»

Fórmulas del curso. Las metas son propuestas por el grupo (revisar y justificar) y se cambian en `js/config.js`.
El código de cada cálculo está en `js/kpi.js`.

---

## 1. Capacidad operativa

| Campo | Contenido |
|---|---|
| Nombre | Capacidad operativa del patio |
| Definición | TEU que el patio puede almacenar de verdad, descontando los slots reservados para remanejar y los que están fuera de servicio |
| Fórmula | Capacidad = Σ por bloque [Stacks × (Tiers × Lanes − Shuffle slots)] − slots inoperativos |
| Unidad y frecuencia | TEU · cada vez que cambia el diseño o hay slots fuera de servicio |
| Meta | ≥ 98 % de la capacidad nominal (nominal = sin descontar inoperativos) |
| Fuente del dato | Diseño del patio en `data/generar_datos.py` (lista `BLOQUES`), copiado en `data/datos.js` |
| Decisión que apoya | Si conviene reparar los slots inoperativos o reorganizar bloques antes de pensar en ampliar |
| Función | `KPI.capacidadBloque()`, `KPI.capacidadTotal()` |

## 2. Yard Density

| Campo | Contenido |
|---|---|
| Nombre | Densidad del patio (Yard Density) |
| Definición | Porcentaje de la capacidad operativa ocupado por contenedores al cierre del día |
| Fórmula | Yard Density = Inventario (TEU) ÷ Capacidad operativa (TEU) × 100 |
| Unidad y frecuencia | % · diaria, por bloque y total |
| Meta | ≤ 70 %. Alerta amarilla desde 70 % y roja desde 80 % (por encima del 80 % los remanejos crecen rápido) |
| Fuente del dato | `data/contenedores.csv`: contenedores con `dia_entrada ≤ d` y `dia_salida > d`, sumando TEU |
| Decisión que apoya | Qué bloques necesitan medidas urgentes y cuándo activar el plan de contingencia |
| Función | `KPI.densidadTotal()`, `KPI.densidadBloque()` |

## 3. Dwell time por categoría

| Campo | Contenido |
|---|---|
| Nombre | Tiempo de permanencia (dwell time) por categoría |
| Definición | Días promedio que un contenedor de la categoría pasa en el patio, desde que entra hasta que sale |
| Fórmula | Dwell = Σ (día de salida − día de entrada) ÷ número de contenedores de la categoría (contenedores que salieron en el periodo) |
| Unidad y frecuencia | días · semanal o por el periodo elegido (7, 14, 30 o 60 días) |
| Meta | Importación ≤ 5 · Exportación ≤ 4 · Transbordo ≤ 4 · Vacíos ≤ 7 días |
| Fuente del dato | `data/contenedores.csv` (columnas `categoria`, `dia_entrada`, `dia_salida`) |
| Decisión que apoya | Qué categoría atacar primero (tiempo libre de almacenaje, citas de retiro, evacuación de vacíos) |
| Función | `KPI.dwell()` |

## 4. Dwell time global

| Campo | Contenido |
|---|---|
| Nombre | Dwell time global del patio |
| Definición | Días promedio en patio de todos los contenedores, ponderado por el número de contenedores de cada categoría |
| Fórmula | Dwell global = Σ días de todos los contenedores ÷ Σ contenedores. **No** es el promedio simple de los 4 dwell por categoría |
| Unidad y frecuencia | días · por periodo |
| Meta | ≤ 5 días |
| Fuente del dato | `data/contenedores.csv` |
| Decisión que apoya | Seguimiento general de la rotación del patio y comparación antes/después de la propuesta |
| Función | `KPI.dwell().global` (el dashboard muestra también el promedio simple para explicar por qué es incorrecto) |

## 5. Remanejos (rehandle ratio)

| Campo | Contenido |
|---|---|
| Nombre | Rehandle ratio |
| Definición | Movimientos improductivos (mover contenedores que estorban) por cada 100 movimientos productivos (entradas y salidas pedidas por el cliente) |
| Fórmula | Rehandle ratio = Movimientos improductivos ÷ Movimientos productivos × 100 |
| Unidad y frecuencia | % · diaria, por bloque y total |
| Meta | ≤ 25 % |
| Fuente del dato | Improductivos: columna `remanejos` de `data/movimientos_bloque.csv`. Productivos: entradas + salidas de `data/contenedores.csv` |
| Decisión que apoya | Cuánto equipo (RTG, horas-hombre) se pierde en movimientos que no agregan valor (desperdicio Lean) |
| Función | `KPI.remanejos()` |

## 6. Tiempo de servicio en patio

| Campo | Contenido |
|---|---|
| Nombre | Tiempo de servicio al camión en patio |
| Definición | Minutos desde que el camión entra al bloque hasta que sale con su contenedor |
| Fórmula | Promedio ponderado por camiones = Σ (tiempo del bloque-día × camiones) ÷ Σ camiones |
| Unidad y frecuencia | minutos por camión · diaria |
| Meta | ≤ 20 min |
| Fuente del dato | `data/movimientos_bloque.csv` (columnas `camiones` y `tiempo_servicio_min`) |
| Decisión que apoya | Si la congestión del patio ya afecta el Truck Turn Time y si hacen falta citas de retiro |
| Función | `KPI.tiempoServicio()` |

## 7. Antigüedad del inventario (aging)

| Campo | Contenido |
|---|---|
| Nombre | Contenedores con más de X días en patio |
| Definición | Contenedores en patio al cierre del día cuya edad (día − día de entrada) supera X = 10 días |
| Fórmula | Aging = número de contenedores en patio con edad > 10 días. También como % del inventario en contenedores |
| Unidad y frecuencia | contenedores y % · diaria |
| Meta | ≤ 10 % del inventario |
| Fuente del dato | `data/contenedores.csv` |
| Decisión que apoya | Lista de contenedores para gestionar con aduana, consignatarios o líneas (abandono, subasta, traslado a depósito externo) |
| Función | `KPI.aging()` |

## 8. Días hasta alerta roja

| Campo | Contenido |
|---|---|
| Nombre | Días hasta alerta roja |
| Definición | Días que faltan para que el patio llegue al 80 % si el inventario sigue creciendo al ritmo actual |
| Fórmula | Días = TEU de margen ÷ crecimiento diario del inventario. Margen = capacidad × 80 % − inventario. Crecimiento = pendiente de la recta del inventario de los últimos 14 días (TEU/día) |
| Unidad y frecuencia | días · diaria |
| Meta | ≥ 14 días (tiempo para reaccionar) |
| Fuente del dato | Inventario diario calculado de `data/contenedores.csv` |
| Decisión que apoya | Cuándo activar medidas de contingencia (evacuar vacíos, reducir tiempo libre, habilitar áreas extra) |
| Supuesto del grupo | El inventario del margen es el promedio de los últimos 7 días, para que un viernes antes del buque del sábado no distorsione el resultado. Si el inventario no crece, el KPI dice «sin riesgo» |
| Función | `KPI.diasHastaAlertaRoja()` |

---

### KPI de apoyo usados en el análisis

- **TEU de más por categoría** = llegadas diarias (TEU/día) × (dwell real − dwell meta). Sale de la Ley de Little (Inventario = λ × W): es el espacio que se libera si la categoría cumple su meta.
- **Proyección del simulador**: por categoría, `I(t+1) = I(t) + λ − I(t) ÷ Dwell − evacuación`.
