// ============================================================================
// CÁLCULO DE KPI - Idea 3 "Un patio que se llena"
// Cada función usa la fórmula del curso (ver docs/fichas_kpi.md).
// Aquí NO hay nada visual: solo cálculos, para poder revisarlos y verificarlos a mano.
//
// Convención de días: día 0 = primera fecha del periodo (2026-09-01).
// Un contenedor está EN PATIO al cierre del día d si: dia_entrada <= d < dia_salida.
// Dwell time de un contenedor = dia_salida - dia_entrada (días).
// ============================================================================
window.KPI = (function () {
  let P = null; // datos preparados (se llenan en preparar())

  // --------------------------------------------------------------------------
  // Capacidad operativa = Stacks x (Tiers x Lanes - Shuffle slots) - slots inoperativos   [TEU, por bloque]
  // --------------------------------------------------------------------------
  function capacidadBloque(b) {
    return b.stacks * (b.tiers * b.lanes - b.shuffle) - b.inoperativos;
  }
  function capacidadNominalBloque(b) {
    return b.stacks * (b.tiers * b.lanes - b.shuffle);
  }

  // Prepara tablas diarias una sola vez (inventario por bloque/categoría, entradas, salidas).
  function preparar(DATOS) {
    const dias = DATOS.dias || DATOS.fechas.length;
    const bloques = DATOS.bloques.map((b) => ({ ...b, cap: capacidadBloque(b), capNominal: capacidadNominalBloque(b) }));
    const idxB = Object.fromEntries(bloques.map((b, i) => [b.id, i]));
    const nB = bloques.length, nC = DATOS.categorias.length;
    const D0 = 1; // desplazamiento: la fila 0 de las tablas es el día -1 (cierre del día anterior al periodo)
    const filas = dias + D0;
    const mat = (cols) => Array.from({ length: filas }, () => new Array(cols).fill(0));

    const deltaB = mat(nB), deltaC = mat(nC);
    const entradasB = mat(nB), salidasB = mat(nB);       // contenedores (movimientos productivos)
    const llegadasTEUC = mat(nC);                         // TEU que llegan por categoría y día
    const conts = DATOS.contenedores.map(([c, b, teu, ent, sal]) => ({ c, b: idxB[b], teu, ent, sal }));

    for (const k of conts) {
      const fe = Math.max(0, k.ent + D0);                 // si entró antes del día -1, cuenta desde la fila 0
      if (fe < filas) { deltaB[fe][k.b] += k.teu; deltaC[fe][k.c] += k.teu; }
      const fs = k.sal + D0;
      if (fs < filas) { deltaB[fs][k.b] -= k.teu; deltaC[fs][k.c] -= k.teu; }
      if (k.ent >= 0 && k.ent < dias) { entradasB[k.ent + D0][k.b]++; llegadasTEUC[k.ent + D0][k.c] += k.teu; }
      if (k.sal >= 0 && k.sal < dias) salidasB[k.sal + D0][k.b]++;
    }
    // inventario al cierre de cada día = suma acumulada de entradas - salidas
    const invB = mat(nB), invC = mat(nC);
    for (let f = 0; f < filas; f++) {
      for (let j = 0; j < nB; j++) invB[f][j] = (f ? invB[f - 1][j] : 0) + deltaB[f][j];
      for (let j = 0; j < nC; j++) invC[f][j] = (f ? invC[f - 1][j] : 0) + deltaC[f][j];
    }
    // movimientos simulados por bloque y día: [dia, bloque, remanejos, camiones, tiempo_servicio_min]
    const reman = mat(nB), camiones = mat(nB), tServ = Array.from({ length: filas }, () => new Array(nB).fill(null));
    for (const [d, b, r, cam, t] of DATOS.movimientos) {
      reman[d + D0][idxB[b]] = r; camiones[d + D0][idxB[b]] = cam; tServ[d + D0][idxB[b]] = t;
    }
    P = { DATOS, dias, bloques, idxB, nB, nC, D0, conts, invB, invC, entradasB, salidasB, llegadasTEUC, reman, camiones, tServ,
          categorias: DATOS.categorias, fechas: DATOS.fechas };
    return P;
  }

  const fila = (d) => d + P.D0;
  const suma = (a) => a.reduce((s, x) => s + x, 0);

  function capacidadTotal() { return suma(P.bloques.map((b) => b.cap)); }
  function capacidadNominalTotal() { return suma(P.bloques.map((b) => b.capNominal)); }
  function slotsInoperativos() { return suma(P.bloques.map((b) => b.inoperativos)); }

  // --------------------------------------------------------------------------
  // Yard Density = Inventario / Capacidad operativa x 100
  // --------------------------------------------------------------------------
  function inventarioBloques(d) { return P.invB[fila(d)].slice(); }
  function inventarioTotal(d) { return suma(P.invB[fila(d)]); }
  function inventarioCategorias(d) { return P.invC[fila(d)].slice(); }
  function densidadTotal(d) { return (inventarioTotal(d) / capacidadTotal()) * 100; }
  function densidadBloque(d, j) { return (P.invB[fila(d)][j] / P.bloques[j].cap) * 100; }

  // Densidad de los bloques asignados a una categoría (para la línea por categoría del mapa)
  function densidadGrupo(d, categoria) {
    let inv = 0, cap = 0;
    P.bloques.forEach((b, j) => { if (b.categoria === categoria) { inv += P.invB[fila(d)][j]; cap += b.cap; } });
    return cap ? (inv / cap) * 100 : 0;
  }

  // --------------------------------------------------------------------------
  // Dwell time por categoría = Σ días en patio / contenedores de la categoría
  // Se calcula con los contenedores que SALIERON en el periodo [desde, hasta].
  // Dwell time global = Σ días de todos / Σ contenedores  (ponderado por contenedores, NO promedio simple)
  // --------------------------------------------------------------------------
  function dwell(desde, hasta) {
    const porCat = P.categorias.map((nombre) => ({ nombre, n: 0, sumaDias: 0, promedio: null }));
    for (const k of P.conts) {
      if (k.sal >= desde && k.sal <= hasta) { porCat[k.c].n++; porCat[k.c].sumaDias += k.sal - k.ent; }
    }
    porCat.forEach((x) => { x.promedio = x.n ? x.sumaDias / x.n : null; });
    const n = suma(porCat.map((x) => x.n)), sumaDias = suma(porCat.map((x) => x.sumaDias));
    const validos = porCat.filter((x) => x.n);
    return {
      porCategoria: porCat,
      global: n ? sumaDias / n : null,                                  // ponderado (correcto)
      promedioSimple: validos.length ? suma(validos.map((x) => x.promedio)) / validos.length : null, // solo para comparar
      n, sumaDias,
    };
  }

  // --------------------------------------------------------------------------
  // Antigüedad del inventario (aging): contenedores con más de X días en patio al cierre del día d
  // Edad = d - dia_entrada
  // --------------------------------------------------------------------------
  const TRAMOS_AGING = [[0, 3, '0–3 días'], [4, 7, '4–7 días'], [8, 10, '8–10 días'], [11, 20, '11–20 días'], [21, Infinity, 'más de 20 días']];
  function aging(d, X) {
    const tramos = TRAMOS_AGING.map(([a, b, etiqueta]) => ({ etiqueta, a, b, porCat: new Array(P.nC).fill(0) }));
    let enPatio = 0, mayoresX = 0;
    const mayoresXCat = new Array(P.nC).fill(0);
    for (const k of P.conts) {
      if (k.ent <= d && d < k.sal) {
        const edad = d - k.ent;
        enPatio++;
        if (edad > X) { mayoresX++; mayoresXCat[k.c]++; }
        const t = tramos.find((t) => edad >= t.a && edad <= t.b);
        t.porCat[k.c]++;
      }
    }
    return { tramos, enPatio, mayoresX, mayoresXCat, pct: enPatio ? (mayoresX / enPatio) * 100 : 0 };
  }

  // --------------------------------------------------------------------------
  // Remanejos (rehandle ratio) = movimientos improductivos / movimientos productivos x 100
  // Productivos = entradas + salidas de contenedores al bloque (lo que el cliente pidió mover)
  // Improductivos = remanejos (mover contenedores que estorban para llegar al buscado)
  // bloques: lista de índices de bloque a incluir (null = todos)
  // --------------------------------------------------------------------------
  function remanejos(desde, hasta, bloques) {
    const js = bloques || P.bloques.map((_, j) => j);
    let improd = 0, prod = 0;
    for (let d = desde; d <= hasta; d++) for (const j of js) {
      improd += P.reman[fila(d)][j];
      prod += P.entradasB[fila(d)][j] + P.salidasB[fila(d)][j];
    }
    return { improductivos: improd, productivos: prod, ratio: prod ? (improd / prod) * 100 : 0 };
  }

  // --------------------------------------------------------------------------
  // Tiempo de servicio en patio (min por camión), promedio ponderado por camiones atendidos
  // --------------------------------------------------------------------------
  // metaMin (opcional): calcula también las horas-camión por encima de la meta, bloque por bloque y día por día
  function tiempoServicio(desde, hasta, bloques, metaMin) {
    const js = bloques || P.bloques.map((_, j) => j);
    let sumaT = 0, cam = 0, minExtra = 0;
    for (let d = desde; d <= hasta; d++) for (const j of js) {
      const t = P.tServ[fila(d)][j], c = P.camiones[fila(d)][j];
      if (t != null && c > 0) {
        sumaT += t * c; cam += c;
        if (metaMin != null) minExtra += c * Math.max(0, t - metaMin);
      }
    }
    return { promedio: cam ? sumaT / cam : null, camiones: cam, horasExtra: minExtra / 60 };
  }

  // Regresión lineal simple y = a + b·x (mínimos cuadrados)
  function regresion(puntos) {
    const n = puntos.length;
    if (n < 2) return null;
    const mx = suma(puntos.map((p) => p.x)) / n, my = suma(puntos.map((p) => p.y)) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (const p of puntos) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; }
    if (!sxx) return null;
    const b = sxy / sxx, a = my - b * mx;
    return { a, b, r2: syy ? (sxy * sxy) / (sxx * syy) : 0, predecir: (x) => a + b * x };
  }

  // Inventario suavizado: promedio de los últimos 7 días (quita el ciclo semanal de los días de buque).
  // Supuesto del grupo: sin esto, un viernes antes del buque del sábado exagera la tendencia.
  function inventarioSuavizado(d, n = 7) {
    const desde = Math.max(0, d - n + 1);
    let s = 0; for (let i = desde; i <= d; i++) s += inventarioTotal(i);
    return s / (d - desde + 1);
  }
  function inventarioCategoriasSuavizado(d, n = 7) {
    const desde = Math.max(0, d - n + 1), out = new Array(P.nC).fill(0);
    for (let i = desde; i <= d; i++) P.invC[fila(i)].forEach((x, c) => { out[c] += x; });
    return out.map((x) => x / (d - desde + 1));
  }

  // --------------------------------------------------------------------------
  // Días hasta alerta roja = TEU de margen / crecimiento diario del inventario
  // Margen = capacidad x umbral rojo - inventario (suavizado 7 días)
  // Crecimiento diario = pendiente de la recta del inventario de los últimos N días (TEU/día)
  // --------------------------------------------------------------------------
  function diasHastaAlertaRoja(d, umbralRojo, ventana) {
    const desde = Math.max(0, d - ventana + 1);
    const pts = [];
    for (let i = desde; i <= d; i++) pts.push({ x: i, y: inventarioTotal(i) });
    const reg = regresion(pts);
    const crecimiento = reg ? reg.b : 0;
    const margen = capacidadTotal() * (umbralRojo / 100) - inventarioSuavizado(d);
    let dias;
    if (margen <= 0) dias = 0;                    // ya está en rojo
    else if (crecimiento <= 0) dias = Infinity;   // el inventario no crece: no hay fecha de alerta
    else dias = margen / crecimiento;
    return { dias, margen, crecimiento };
  }

  // Llegadas promedio de TEU por día de cada categoría en [desde, hasta]
  function llegadasPromedio(desde, hasta) {
    const out = new Array(P.nC).fill(0);
    const n = hasta - desde + 1;
    for (let d = desde; d <= hasta; d++) for (let c = 0; c < P.nC; c++) out[c] += P.llegadasTEUC[fila(d)][c];
    return out.map((x) => x / n);
  }

  // Crecimiento de las llegadas totales (% por día) = pendiente / promedio, recta de los últimos N días
  function crecimientoLlegadas(desde, hasta) {
    const pts = [];
    for (let d = desde; d <= hasta; d++) pts.push({ x: d, y: suma(P.llegadasTEUC[fila(d)]) });
    const reg = regresion(pts);
    const prom = suma(pts.map((p) => p.y)) / pts.length;
    return reg && prom ? (reg.b / prom) * 100 : 0;
  }

  // Puntos densidad (al inicio del día) vs rehandle ratio, por bloque y día, para la relación del módulo 3
  function puntosDensidadRemanejos(bloques) {
    const js = bloques || P.bloques.map((_, j) => j);
    const pts = [];
    for (let d = 0; d < P.dias; d++) for (const j of js) {
      const prod = P.entradasB[fila(d)][j] + P.salidasB[fila(d)][j];
      if (prod >= 20) pts.push({ x: densidadBloque(d - 1, j), y: (P.reman[fila(d)][j] / prod) * 100, bloque: P.bloques[j].id, dia: d });
    }
    return pts;
  }
  function puntosDensidadServicio() {
    const pts = [];
    for (let d = 0; d < P.dias; d++) P.bloques.forEach((b, j) => {
      const t = P.tServ[fila(d)][j];
      if (t != null && P.camiones[fila(d)][j] > 0) pts.push({ x: densidadBloque(d - 1, j), y: t });
    });
    return pts;
  }

  // --------------------------------------------------------------------------
  // Proyección de inventario (simulador, módulo 4)
  // Ley de Little por categoría: salidas diarias ≈ Inventario / Dwell time
  //   I(t+1) = I(t) + λ·(1 + crecimiento)^t - I(t) / DT - evacuación extra
  // --------------------------------------------------------------------------
  function proyectar({ inv0, lambda, dwell, crecimientoPct, cambioLlegadasPct, evacuacion, horizonte }) {
    const serie = [];
    let I = inv0.slice();
    serie.push({ dia: 0, inv: I.slice(), total: suma(I) });
    for (let t = 1; t <= horizonte; t++) {
      const factor = (1 + cambioLlegadasPct / 100) * Math.pow(1 + crecimientoPct / 100, t);
      I = I.map((x, c) => {
        const salidas = dwell[c] > 0 ? x / dwell[c] : x;
        return Math.max(0, x + lambda[c] * factor - salidas - (evacuacion[c] || 0));
      });
      serie.push({ dia: t, inv: I.slice(), total: suma(I) });
    }
    return serie;
  }

  return {
    preparar, capacidadBloque, capacidadNominalBloque, capacidadTotal, capacidadNominalTotal, slotsInoperativos,
    inventarioBloques, inventarioTotal, inventarioCategorias, inventarioSuavizado, inventarioCategoriasSuavizado, densidadTotal, densidadBloque, densidadGrupo,
    dwell, aging, remanejos, tiempoServicio, regresion, diasHastaAlertaRoja, llegadasPromedio, crecimientoLlegadas,
    puntosDensidadRemanejos, puntosDensidadServicio, proyectar,
    get P() { return P; },
  };
})();
