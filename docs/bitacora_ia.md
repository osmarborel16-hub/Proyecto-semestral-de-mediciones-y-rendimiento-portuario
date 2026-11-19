# Bitácora de uso de IA

Aquí se registran los prompts importantes, qué se aceptó de lo que propuso la IA, qué se corrigió y por qué.
Herramienta: Claude Code (Anthropic).

| Fecha | Integrante | Prompt (resumen) | Qué propuso la IA | Qué aceptamos | Qué corregimos y por qué |
|---|---|---|---|---|---|
| 2026-11-18 | Osmar Chiari | Generar un plan para la Idea 3 con los KPI, módulos y datos del documento del proyecto | Plan con patio de 6 bloques (4 600 TEU), datos de 60 días con semilla fija, 8 KPI con metas, 5 módulos + 1 extra, reparto en 4 roles | _por completar_ | _por completar_ |
| 2026-11-18 | Osmar Chiari | Crear la estructura inicial del repositorio para el H1 | README, fichas de KPI, bitácora, supuestos, verificación manual y esqueleto de `index.html` | _por completar_ | _por completar_ |
| 2026-11-19 | Osmar Chiari | Generar los datos simulados con semilla fija | Generador `generarDatos()` en `index.html` (60 días + 30 de calentamiento, buques 3.5/semana, 4 categorías, asignación de bloques con desborde a E, remanejos según densidad, visitas de camión) y exportación a CSV | _por completar_ | La IA recalibró dos veces: la 1.ª versión dejaba el patio en 76 % el día 1 y en rojo el día 60 (sin margen para "días hasta alerta roja"); se bajaron los TEU por buque y se ajustó la cuota de vacíos para empezar en ~71 % y terminar en ~79 % |
| 2026-11-19 | Osmar Chiari | Construir el Módulo 1 (mapa del patio) y completar supuestos y README | Mapa de calor por bloque con estado (ícono + texto), umbrales editables, alertas con TEU de margen y días seguidos, gráfico de evolución con tabla equivalente, tarjeta de Yard Density; fuentes reales para tiers, lanes, umbrales y dwell | _por completar_ | La IA corrigió su propio gráfico: la línea del umbral amarillo se confundía con la serie amarilla del bloque D, así que las líneas de umbral pasaron a gris con trazos distintos |

## Decisiones del grupo

- _Ejemplo: elegimos un umbral rojo de 85 % porque…_
