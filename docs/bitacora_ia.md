# Bitácora de uso de IA

Registro de los prompts importantes, lo que aceptamos, lo que corregimos y por qué (requisito 3.6 de la guía).
Agentes usados: Claude (Anthropic).

| # | Fecha | Integrante | Prompt (resumen) | Qué hizo la IA | Qué aceptamos | Qué corregimos y por qué |
|---|---|---|---|---|---|---|
| 1 | 17/11/2026 | Osmar Chiari | «Genera el código para la Idea 3 (patio que se llena) para aplicarlo en GitHub», con el PDF del proyecto adjunto | Propuso el diseño del patio, el generador de datos con semilla fija, los 8 KPI con las fórmulas de la guía, el dashboard de 6 módulos, las fichas, la verificación y el README | _completar_ | _completar_ |
| 2 | | | | | | |
| 3 | | | | | | |

## Decisiones del grupo

- _Ejemplo: aceptamos la meta de densidad del 70 % porque…_
- _Ejemplo: cambiamos el factor de remanejos de importación porque…_

## Revisiones hechas a mano

- [ ] Verificamos Yard Density, Dwell global y Rehandle ratio en Excel (`docs/verificacion_manual.md`).
- [ ] Revisamos que cada fórmula de `js/kpi.js` sea la del curso.
- [ ] Revisamos los supuestos del README y los justificamos.

## Correcciones durante el desarrollo (registradas por la IA)

- La primera versión de los datos dejaba bloques de importación por encima del 100 % de densidad. Se agregó una regla: si los bloques de la categoría pasan del 97 %, el contenedor se desborda al bloque menos lleno.
- El primer modelo de remanejos daba un rehandle ratio cercano al 47 %, demasiado alto para una terminal normal. Se recalibró a `(h − 1) ÷ 4` para que la situación base quede cerca del 25 %.
- El KPI «Días hasta alerta roja» y el simulador cambiaban mucho según el día de la semana, porque los viernes se acumula exportación antes del buque del sábado. Se usó el inventario promedio de 7 días.
- El tiempo de servicio de la A3 salía «0 horas-camión por encima de la meta» porque se calculaba con el promedio. Se cambió a sumar bloque por bloque y día por día.
