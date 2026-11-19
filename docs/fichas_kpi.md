# Fichas de KPI

Cada ficha tiene: nombre, definición, fórmula (la del curso), unidad y frecuencia, meta, fuente del dato y decisión que apoya.
Las metas son **propuestas del grupo** y hay que completar la justificación de cada una antes de la entrega final (H3).

Umbrales de densidad que usa todo el dashboard: **verde ≤ 70 %**, **amarilla > 70 % y ≤ 85 %**, **roja > 85 %**.

---

## 1. Capacidad operativa

| Campo | Contenido |
|---|---|
| Nombre | Capacidad operativa del patio |
| Definición | TEU que el patio puede almacenar en operación normal, descontando los huecos para remanejar y las posiciones fuera de servicio |
| Fórmula | [Bloques × Stacks × (Tiers × Lanes − Shuffle slots)] − slots inoperativos |
| Unidad y frecuencia | TEU · se recalcula cuando cambia un parámetro o un slot inoperativo |
| Meta | Referencia: 4 600 TEU. Slots inoperativos ≤ 2 % de la capacidad bruta (≤ 94 TEU) |
| Fuente del dato | Parámetros del patio simulado (`PATIO` en `index.html`) |
| Decisión que apoya | Base de la densidad; decidir si reparar slots inoperativos o cambiar la altura de estiba |
| Justificación de la meta | _por completar_ |

Cálculo: [6 × 30 × (5 × 6 − 4)] − 80 = 4 680 − 80 = **4 600 TEU**

## 2. Yard Density

| Campo | Contenido |
|---|---|
| Nombre | Densidad del patio (Yard Density) |
| Definición | Porcentaje de la capacidad operativa ocupado por el inventario |
| Fórmula | Inventario ÷ capacidad operativa × 100 |
| Unidad y frecuencia | % · diaria, por bloque y total |
| Meta | ≤ 70 % (amarilla > 70 %, roja > 85 %) |
| Fuente del dato | `inventario_diario` simulado (TEU por bloque y día) |
| Decisión que apoya | Activar medidas para liberar espacio; asignar bloques |
| Justificación de la meta | _por completar_ |

## 3. Dwell time por categoría

| Campo | Contenido |
|---|---|
| Nombre | Tiempo de permanencia por categoría |
| Definición | Días promedio que un contenedor de cada categoría pasa en el patio, desde que entra hasta que sale |
| Fórmula | Σ días en patio ÷ contenedores de la categoría |
| Unidad y frecuencia | días · por periodo filtrado |
| Meta | Importación ≤ 5 · Exportación ≤ 4 · Transbordo ≤ 4 · Vacíos ≤ 7 |
| Fuente del dato | `contenedores` simulados que ya salieron (fecha de entrada y de salida) |
| Decisión que apoya | Identificar la categoría crítica; ajustar el tiempo libre de almacenaje |
| Justificación de la meta | Importación ≤ 5 días: en el tercer trimestre de 2025 el dwell de importación estuvo entre 3 y 9 días en la mayoría de los puertos analizados por S&P Global [F5 en `data/supuestos.md`]; el grupo elige la mitad baja del rango para una terminal eficiente. Exportación y transbordo ≤ 4 días: la carga de exportación espera a su buque (en la simulación llega de 1 a 7 días antes) y con 3.5 buques por semana el siguiente sale en 2 días o menos. Vacíos ≤ 7 días: una semana de margen para que la naviera los reposicione; más tiempo convierte al vacío en un ocupante de espacio sin carga |
| Cálculo en el dashboard | Módulo 2 · función `dwellTime()`: solo contenedores que **salieron** en el rango de días (estancia completa, columna `dias_en_patio`) |

## 4. Dwell time global

| Campo | Contenido |
|---|---|
| Nombre | Tiempo de permanencia global |
| Definición | Dwell promedio de todo el patio, ponderado por la cantidad de contenedores de cada categoría |
| Fórmula | Promedio ponderado por contenedores (no promedio simple) = Σ (dwell de la categoría × contenedores de la categoría) ÷ Σ contenedores |
| Unidad y frecuencia | días · por periodo filtrado |
| Meta | ≤ 5 días |
| Fuente del dato | `contenedores` simulados que ya salieron |
| Decisión que apoya | Seguimiento general de la rotación del patio |
| Justificación de la meta | Con la mezcla de la terminal (unos 32 % importación, 29 % exportación, 28 % transbordo y 11 % vacíos), cumplir las metas de cada categoría da un global ponderado de unos 4.7 días: (6 356 × 5 + 5 806 × 4 + 5 593 × 4 + 2 242 × 7) ÷ 19 997 = 4.65. El grupo redondea a 5 |
| Por qué ponderado | El promedio simple de las 4 categorías (7.36 días) exagera el peso de los vacíos, que son pocos contenedores con dwell alto. El ponderado (6.35 días) refleja lo que vive el patio. El Módulo 2 muestra los dos para que se vea la diferencia |

## 5. Remanejos (rehandle ratio)

| Campo | Contenido |
|---|---|
| Nombre | Índice de remanejos |
| Definición | Movimientos improductivos (cambiar de sitio una caja para sacar otra) por cada 100 movimientos productivos |
| Fórmula | Movimientos improductivos ÷ movimientos productivos × 100 |
| Unidad y frecuencia | % · diario, por bloque y turno |
| Meta | ≤ 30 % (amarillo 30–40 %, rojo > 40 %) |
| Fuente del dato | `movimientos` simulados |
| Decisión que apoya | Reducir la altura de estiba; segregar mejor las cajas; evaluar el beneficio de liberar espacio |
| Justificación de la meta | _por completar_ |

## 6. Tiempo de servicio en patio

| Campo | Contenido |
|---|---|
| Nombre | Tiempo de servicio del camión en patio |
| Definición | Minutos desde que el camión entra al bloque hasta que sale |
| Fórmula | Tiempo del camión desde que entra al bloque hasta que sale (promedio de las visitas) |
| Unidad y frecuencia | min · por hora, turno y día |
| Meta | ≤ 25 min de promedio por turno |
| Fuente del dato | `visitas_camion` simuladas (hora de entrada y de salida del bloque) |
| Decisión que apoya | Implementar citas de retiro; reforzar equipos en hora pico |
| Justificación de la meta | _por completar_ |

## 7. Antigüedad del inventario (aging)

| Campo | Contenido |
|---|---|
| Nombre | Contenedores envejecidos |
| Definición | Contenedores que siguen en patio y llevan más de X días (X ajustable; 10 por defecto) |
| Fórmula | Contenedores con más de X días en patio |
| Unidad y frecuencia | contenedores · diaria |
| Meta | ≤ 5 % del inventario en contenedores |
| Fuente del dato | `contenedores` simulados que siguen en patio el día seleccionado |
| Decisión que apoya | Lista de retiro prioritario; cobro de almacenaje; evacuación de vacíos |
| Justificación de la meta | X = 10 días es el doble de la meta de dwell de importación: un contenedor que lleva más de 10 días ya es una excepción (retenido, abandonado o vacío olvidado). Que esas excepciones sean como máximo el 5 % del inventario deja el patio para la carga que rota |
| Cálculo en el dashboard | Módulo 2 · función `antiguedad()`: contenedores presentes al cierre del día de corte con (día de corte − entrada) > X. X se cambia en vivo en el Módulo 2 |

## 8. Días hasta alerta roja

| Campo | Contenido |
|---|---|
| Nombre | Días hasta alerta roja |
| Definición | Días que faltan para que la densidad pase el umbral rojo si nada cambia |
| Fórmula | TEU de margen ÷ crecimiento diario del inventario |
| Definiciones operativas | TEU de margen = (85 % × capacidad operativa) − inventario actual = 3 910 − inventario. Crecimiento diario = _el grupo elige y justifica: pendiente de los últimos 14 días o promedio de (entradas − salidas)_ |
| Unidad y frecuencia | días · diaria |
| Meta | ≥ 30 días (amarillo 15–30, rojo < 15) |
| Fuente del dato | `inventario_diario` simulado |
| Decisión que apoya | Cuándo hay que activar la medida de mejora |
| Justificación de la meta | _por completar_ |
