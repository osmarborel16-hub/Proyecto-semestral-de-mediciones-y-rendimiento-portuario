// ============================================================================
// CONFIGURACIÓN DEL DASHBOARD: metas y umbrales acordados por el grupo.
// Si el grupo cambia una meta, se cambia SOLO aquí (y en docs/fichas_kpi.md).
// ============================================================================
window.CONFIG = {
  // Umbrales de alerta del mapa del patio (Yard Density, %)
  umbralAmarillo: 70,   // desde 70 % el bloque se pinta amarillo
  umbralRojo: 80,       // desde 80 % el bloque se pinta rojo (congestión, suben los remanejos)

  metas: {
    capacidadPctNominal: 98,  // Capacidad operativa >= 98 % de la nominal (pocos slots inoperativos)
    densidad: 70,             // Yard Density <= 70 %
    dwellGlobal: 5.0,         // Dwell time global <= 5 días
    dwellCategoria: {         // Dwell time por categoría (días)
      'Importación': 5,
      'Exportación': 4,
      'Transbordo': 4,
      'Vacíos': 7,
    },
    remanejos: 25,            // Rehandle ratio <= 25 %
    tiempoServicio: 20,       // Tiempo de servicio en patio <= 20 min por camión
    agingDias: 10,            // "X" del KPI de antigüedad: contenedores con más de 10 días
    agingPct: 10,             // y que no pasen del 10 % del inventario
    diasAlertaRoja: 14,       // Días hasta alerta roja >= 14 días (tiempo para reaccionar)
  },

  ventanaTendencia: 14,       // días usados para medir el crecimiento del inventario y las llegadas
  horizonteProyeccion: 14,    // días que proyecta el simulador
};
