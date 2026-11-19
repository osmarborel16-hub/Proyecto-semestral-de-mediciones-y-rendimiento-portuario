# Verificación manual de KPI

El curso pide verificar a mano al menos 3 KPI. Para cada uno: captura del dashboard, cálculo a mano con los datos del CSV exportado y la diferencia (debe ser 0 o explicarse por redondeo).

## 1. Capacidad operativa ✅

| Parámetro | Valor |
|---|---|
| Bloques | 6 |
| Stacks | 30 |
| Tiers | 5 |
| Lanes | 6 |
| Shuffle slots | 4 |
| Slots inoperativos | 80 |

[6 × 30 × (5 × 6 − 4)] − 80
= [6 × 30 × 26] − 80
= 4 680 − 80
= **4 600 TEU**

Dashboard: _captura pendiente_ · Diferencia: _pendiente_

## 2. Yard Density (un día y un bloque)

- Día: ___ · Bloque: ___
- Capacidad del bloque = 30 × 26 − slots inoperativos del bloque = ___ TEU
- Inventario del bloque (CSV) = ___ TEU
- Densidad = ___ ÷ ___ × 100 = ___ %
- Dashboard: ___ % · Diferencia: ___

## 3. Dwell time global ponderado

Muestra de unos 20 contenedores del CSV (hoja de Excel adjunta).

| Categoría | Contenedores | Σ días | Dwell (días) |
|---|---|---|---|
| Importación | | | |
| Exportación | | | |
| Transbordo | | | |
| Vacíos | | | |
| **Global ponderado** | Σ | Σ | Σ días ÷ Σ contenedores |
| Promedio simple (incorrecto) | | | promedio de los 4 dwell |

Explicar por qué el promedio simple da otro número.

## 4. (Extra) Días hasta alerta roja

- Inventario del día 60 = ___ TEU
- TEU de margen = 3 910 − ___ = ___
- Crecimiento diario = ___ TEU/día
- Días hasta alerta roja = ___ ÷ ___ = ___ días
