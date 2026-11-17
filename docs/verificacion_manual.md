# Verificación manual de 3 KPI

La guía pide verificar a mano al menos 3 KPI. Aquí está el procedimiento con los resultados esperados para el **día 59 (30/10/2026)** y el periodo de **14 días (días 46 a 59)**, que es lo que muestra el dashboard al abrirlo.

**Lo que debe hacer el grupo:** repetir cada cálculo en Excel con los CSV, anotar quién lo hizo y pegar una captura de pantalla. El módulo 6 del dashboard muestra los mismos pasos con cualquier día y periodo, para que el profesor pueda pedir otro caso en vivo.

---

## KPI 1 · Yard Density (día 59)

1. Abrir `data/contenedores.csv` en Excel.
2. Filtrar `dia_entrada ≤ 59` y `dia_salida > 59`: son los contenedores que siguen en patio al cierre del día 59.
3. Sumar la columna `teu` → **5,388 TEU**.
4. Capacidad operativa: 822 + 832 + 832 + 816 + 832 + 832 + 992 + 992 = **6,950 TEU**.
   Ejemplo del bloque A1: 32 × (5 × 6 − 4) − 10 = 32 × 26 − 10 = 822 TEU.
5. Yard Density = 5,388 ÷ 6,950 × 100 = **77.53 %**.

Comprobación por bloque: filtrando también `bloque = A1` la suma da 658 TEU → 658 ÷ 822 = 80.0 % (alerta roja).

| Hecho por | Resultado en Excel | ¿Coincide con el dashboard? | Captura |
|---|---|---|---|
| | | | |

## KPI 2 · Dwell time global (salidas de los días 46 a 59)

1. En `data/contenedores.csv`, filtrar `46 ≤ dia_salida ≤ 59`.
2. Crear la columna `dias = dia_salida − dia_entrada`.
3. Tabla dinámica por `categoria`: suma de `dias` y cuenta de contenedores.

| Categoría | Σ días | Contenedores | Dwell (días) |
|---|---|---|---|
| Importación | 13,365 | 1,891 | 7.068 |
| Exportación | 8,951 | 2,415 | 3.706 |
| Transbordo | 9,641 | 2,546 | 3.787 |
| Vacíos | 11,666 | 983 | 11.868 |
| **Total** | **43,623** | **7,835** | **5.568** |

4. Dwell global ponderado = 43,623 ÷ 7,835 = **5.57 días**.
5. El promedio simple, (7.068 + 3.706 + 3.787 + 11.868) ÷ 4 = 6.61 días, es **incorrecto**: le da a vacíos (983 contenedores) el mismo peso que a transbordo (2,546).

| Hecho por | Resultado en Excel | ¿Coincide con el dashboard? | Captura |
|---|---|---|---|
| | | | |

## KPI 3 · Rehandle ratio (días 46 a 59)

1. En `data/movimientos_bloque.csv`, filtrar `46 ≤ dia ≤ 59` y sumar `remanejos` → **4,185** movimientos improductivos.
2. En `data/contenedores.csv`, contar los contenedores con `46 ≤ dia_entrada ≤ 59` (entradas) y los contenedores con `46 ≤ dia_salida ≤ 59` (salidas). Entradas + salidas = **15,807** movimientos productivos.
3. Rehandle ratio = 4,185 ÷ 15,807 × 100 = **26.48 %** (meta ≤ 25 % → alerta).

| Hecho por | Resultado en Excel | ¿Coincide con el dashboard? | Captura |
|---|---|---|---|
| | | | |

---

> Estos valores se calcularon por separado en Python, leyendo los CSV, y coinciden con los del dashboard (JavaScript). Si cambian la semilla o los supuestos en `data/generar_datos.py`, los números cambian: vuelvan a calcularlos.
