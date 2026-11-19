# Supuestos de los datos simulados

Los datos se generan en `index.html` con un generador pseudoaleatorio de **semilla fija 2026** (mulberry32). Así son reproducibles: siempre salen los mismos.
El CSV exportado desde el dashboard se guarda en esta carpeta (`datos_simulados.csv`).

## Patio

| Parámetro | Valor | Justificación |
|---|---|---|
| Bloques | 6 (A–F) | A–B importación, C–D exportación, E transbordo, F vacíos |
| Stacks por bloque | 30 | _por justificar_ |
| Lanes | 6 | ancho típico de un bloque atendido por RTG |
| Tiers | 5 | altura máxima de estiba |
| Shuffle slots | 4 por stack | se reservan Tiers − 1 huecos para poder remanejar |
| Slots inoperativos | 80 (40 en C y 40 en E) | reparación de pavimento y tomas reefer fuera de servicio |

## Flujos (valores de referencia para calibrar)

| Categoría | Llegadas (TEU/día) | Dwell objetivo de la simulación (días) |
|---|---|---|
| Importación | ~200 | ~6.5 |
| Exportación | ~180 | ~4.0 |
| Transbordo | ~160 | ~4.5 |
| Vacíos | ~70 entran / ~60 salen | ~13 y subiendo |

- Mezcla de tamaños: _% de 20' y % de 40' por definir_ (un 40' = 2 TEU).
- Buques: 3 o 4 arribos por semana, cada uno descarga entre 600 y 900 TEU.
- Menos retiros de importación el domingo y más el lunes.
- Camiones: horas pico de 8 a 11 y de 14 a 17; 3 turnos.

## Relaciones supuestas

- **Remanejos según densidad:** ratio ≈ 20 % + 1.2 × (densidad − 60) cuando la densidad pasa de 60 %, más un ruido pequeño. Justificación: a mayor altura de estiba hay más contenedores encima del que se busca.
- **Tiempo de servicio del camión:** ≈ 15 min de base + unos 3 min por cada remanejo + una cola en hora pico.

## Fuentes de referencia

- _Si usan una cifra real (altura de estiba, rangos de dwell, etc.), citarla aquí._
