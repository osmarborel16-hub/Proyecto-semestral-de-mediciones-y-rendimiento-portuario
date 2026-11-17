// ============================================================================
// INTERFAZ DEL DASHBOARD - filtros, tarjetas de KPI, gráficos y módulos.
// Los cálculos están en js/kpi.js; las metas en js/config.js.
// ============================================================================
(function () {
  const C = window.CONFIG, M = C.metas;
  const P = KPI.preparar(window.DATOS);
  const CATS = P.categorias;
  const COLOR_CAT = { 'Importación': '#1f5f8b', 'Exportación': '#e07b39', 'Transbordo': '#6a4c93', 'Vacíos': '#7f8c8d' };
  const COLOR = { verde: '#2e8b57', amarillo: '#d4a017', rojo: '#c0392b' };
  Chart.defaults.animation = false;
  Chart.defaults.font.family = '"Segoe UI", Roboto, Arial, sans-serif';

  // ---------------- Estado de la interfaz ----------------
  const estado = { dia: P.dias - 1, periodo: 14, categoria: '', bloque: '', escenario: null, nombreEscenario: 'Situación actual' };

  // ---------------- Utilidades ----------------
  const $ = (id) => document.getElementById(id);
  const fmt = (x, dec = 1) => (x == null || !isFinite(x) ? '—' : x.toLocaleString('es-PA', { minimumFractionDigits: dec, maximumFractionDigits: dec }));
  const fmtDias = (x) => (x === Infinity ? 'sin riesgo' : x === 0 ? 'ya en rojo' : fmt(x, 1));
  const fechaLarga = (d) => { const [y, m, dd] = P.fechas[d].split('-'); return `${dd}/${m}/${y}`; };
  const rango = () => ({ desde: Math.max(0, estado.dia - estado.periodo + 1), hasta: estado.dia });
  const el = (tag, props = {}, hijos = []) => {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => { if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else e[k] = v; });
    [].concat(hijos).forEach((h) => e.append(h instanceof Node ? h : document.createTextNode(h)));
    return e;
  };
  const graficos = {};
  function grafico(id, config) {
    if (graficos[id]) graficos[id].destroy();
    graficos[id] = new Chart($(id), config);
  }
  function guardar(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } }
  function leer(clave) { try { return localStorage.getItem(clave) || ''; } catch (e) { return ''; } }

  // Semáforos ---------------------------------------------------------------
  function estadoDensidad(d) { return d >= C.umbralRojo ? 'rojo' : d >= C.umbralAmarillo ? 'amarillo' : 'verde'; }
  // KPI donde "menos es mejor": verde si cumple, amarillo si está hasta 10 % por encima, rojo si más
  function estadoMenor(valor, meta) { if (valor == null) return 'verde'; return valor <= meta ? 'verde' : valor <= meta * 1.1 ? 'amarillo' : 'rojo'; }
  // KPI donde "más es mejor"
  function estadoMayor(valor, meta, margenAmarillo) { return valor >= meta ? 'verde' : valor >= meta - margenAmarillo ? 'amarillo' : 'rojo'; }
  const textoEstado = { verde: 'Cumple', amarillo: 'Alerta', rojo: 'No cumple' };

  // ---------------- Cálculo de todos los KPI con los filtros actuales ----------------
  function calcular() {
    const { desde, hasta } = rango();
    const capTotal = KPI.capacidadTotal(), capNom = KPI.capacidadNominalTotal();
    const dw = KPI.dwell(desde, hasta);
    const rem = KPI.remanejos(desde, hasta, null);
    const ts = KPI.tiempoServicio(desde, hasta, null, M.tiempoServicio);
    const ag = KPI.aging(estado.dia, M.agingDias);
    const roja = KPI.diasHastaAlertaRoja(estado.dia, C.umbralRojo, C.ventanaTendencia);
    const lam = KPI.llegadasPromedio(Math.max(0, estado.dia - C.ventanaTendencia + 1), estado.dia);
    const invCat = KPI.inventarioCategorias(estado.dia);
    // TEU de más por categoría = λ × (dwell real − meta)
    const presion = CATS.map((c, i) => {
      const real = dw.porCategoria[i].promedio, meta = M.dwellCategoria[c];
      return { categoria: c, real, meta, lambda: lam[i], inv: invCat[i], n: dw.porCategoria[i].n,
               teuDeMas: real != null ? Math.max(0, lam[i] * (real - meta)) : 0 };
    });
    const peorDwell = presion.filter((p) => p.real != null).sort((a, b) => (b.real / b.meta) - (a.real / a.meta))[0];
    return {
      desde, hasta, capTotal, capNom, inop: KPI.slotsInoperativos(), pctCap: (capTotal / capNom) * 100,
      inv: KPI.inventarioTotal(estado.dia), densidad: KPI.densidadTotal(estado.dia),
      dw, rem, ts, ag, roja, lam, invCat, presion, peorDwell,
      bloquesRojos: P.bloques.filter((b, j) => KPI.densidadBloque(estado.dia, j) >= C.umbralRojo),
    };
  }

  // ---------------- Tarjetas de KPI ----------------
  function tarjeta(nombre, valor, unidad, metaTxt, est, detalle) {
    return el('div', { class: 'kpi ' + est }, [
      el('div', { class: 'nombre' }, nombre),
      el('div', { class: 'valor' }, [valor, ' ', el('small', {}, unidad)]),
      el('div', { class: 'meta' }, metaTxt + (detalle ? ' · ' + detalle : '')),
      el('div', { class: 'estado ' + est }, textoEstado[est]),
    ]);
  }
  function renderKPIs(k) {
    const pd = k.peorDwell;
    $('kpis').replaceChildren(
      tarjeta('Capacidad operativa', fmt(k.capTotal, 0), 'TEU', `Meta ≥ ${M.capacidadPctNominal} % de la nominal`, estadoMayor(k.pctCap, M.capacidadPctNominal, 3), `${fmt(k.pctCap, 1)} % (${k.inop} slots inoperativos)`),
      tarjeta('Yard Density', fmt(k.densidad, 1), '%', `Meta ≤ ${M.densidad} %`, estadoDensidad(k.densidad), `${fmt(k.inv, 0)} TEU en patio`),
      tarjeta('Dwell time global', fmt(k.dw.global, 2), 'días', `Meta ≤ ${fmt(M.dwellGlobal, 1)} días`, estadoMenor(k.dw.global, M.dwellGlobal), 'ponderado por contenedores'),
      tarjeta('Dwell crítico: ' + (pd ? pd.categoria : '—'), fmt(pd && pd.real, 2), 'días', `Meta ≤ ${pd ? pd.meta : '—'} días`, pd ? estadoMenor(pd.real, pd.meta) : 'verde', 'categoría más lejos de su meta'),
      tarjeta('Rehandle ratio', fmt(k.rem.ratio, 1), '%', `Meta ≤ ${M.remanejos} %`, estadoMenor(k.rem.ratio, M.remanejos), `${fmt(k.rem.improductivos, 0)} remanejos`),
      tarjeta('Tiempo de servicio en patio', fmt(k.ts.promedio, 1), 'min', `Meta ≤ ${M.tiempoServicio} min`, estadoMenor(k.ts.promedio, M.tiempoServicio), 'por camión'),
      tarjeta(`Aging (> ${M.agingDias} días)`, fmt(k.ag.mayoresX, 0), 'contenedores', `Meta ≤ ${M.agingPct} % del inventario`, estadoMenor(k.ag.pct, M.agingPct), `${fmt(k.ag.pct, 1)} % de ${fmt(k.ag.enPatio, 0)}`),
      tarjeta('Días hasta alerta roja', fmtDias(k.roja.dias), k.roja.dias === Infinity || k.roja.dias === 0 ? '' : 'días', `Meta ≥ ${M.diasAlertaRoja} días`, k.roja.dias >= M.diasAlertaRoja ? 'verde' : k.roja.dias >= M.diasAlertaRoja / 2 ? 'amarillo' : 'rojo', `crece ${fmt(k.roja.crecimiento, 0)} TEU/día`),
    );
  }

  // ---------------- Módulo 1: mapa del patio ----------------
  function renderMapa(k) {
    document.querySelectorAll('.uAm').forEach((e) => { e.textContent = C.umbralAmarillo; });
    document.querySelectorAll('.uRo').forEach((e) => { e.textContent = C.umbralRojo; });
    const orden = P.bloques.map((b, j) => ({ b, j })).sort((x, y) => x.b.id.slice(1) - y.b.id.slice(1) || x.b.id.localeCompare(y.b.id));
    const inv = KPI.inventarioBloques(estado.dia);
    $('mapa').replaceChildren(...orden.map(({ b, j }) => {
      const d = KPI.densidadBloque(estado.dia, j), est = estadoDensidad(d);
      const atenuado = estado.categoria && b.categoria !== estado.categoria;
      return el('div', { class: 'bloque' + (atenuado ? ' atenuado' : ''), style: `background:${COLOR[est]}`, title: `${b.id}: ${fmt(inv[j], 0)} de ${fmt(b.cap, 0)} TEU` }, [
        el('div', {}, [el('div', { class: 'id' }, b.id), el('div', { class: 'cat' }, b.categoria)]),
        el('div', { class: 'dens' }, fmt(d, 1) + ' %'),
        el('div', { class: 'teu' }, `${fmt(inv[j], 0)} / ${fmt(b.cap, 0)} TEU`),
      ]);
    }));

    const tb = $('tAlertas').querySelector('tbody');
    const filas = P.bloques.map((b, j) => ({ b, inv: inv[j], d: KPI.densidadBloque(estado.dia, j) })).sort((a, b) => b.d - a.d);
    tb.replaceChildren(...filas.map((f) => {
      const est = estadoDensidad(f.d);
      return el('tr', {}, [el('td', {}, f.b.id), el('td', {}, f.b.categoria), el('td', { class: 'num' }, fmt(f.inv, 0)), el('td', { class: 'num' }, fmt(f.b.cap, 0)),
        el('td', { class: 'num' }, fmt(f.d, 1) + ' %'), el('td', {}, el('span', { class: 'etiqueta ' + est }, est === 'verde' ? 'Normal' : est === 'amarillo' ? 'Amarilla' : 'Roja'))]);
    }));

    const dias = [...Array(P.dias).keys()];
    const etiquetas = dias.map((d) => P.fechas[d].slice(5));
    const ref = (valor, color, label) => ({ label, data: dias.map(() => valor), borderColor: color, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 });
    grafico('gDensidad', {
      type: 'line',
      data: { labels: etiquetas, datasets: [
        { label: 'Total patio', data: dias.map((d) => KPI.densidadTotal(d)), borderColor: '#1d2733', borderWidth: 3,
          pointRadius: dias.map((d) => (d === estado.dia ? 6 : 0)), pointBackgroundColor: '#1d2733' },
        ...CATS.map((c) => ({ label: 'Bloques ' + c, data: dias.map((d) => KPI.densidadGrupo(d, c)), borderColor: COLOR_CAT[c], borderWidth: 1.5, pointRadius: 0,
          hidden: estado.categoria !== '' && estado.categoria !== c })),
        ref(C.umbralAmarillo, COLOR.amarillo, `Umbral amarillo ${C.umbralAmarillo} %`), ref(C.umbralRojo, COLOR.rojo, `Umbral rojo ${C.umbralRojo} %`),
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        scales: { y: { title: { display: true, text: 'Densidad (%)' }, suggestedMin: 40, suggestedMax: 100 } },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y, 1)} %` } }, legend: { labels: { boxWidth: 12 } } } },
    });
  }

  // ---------------- Módulo 2: dwell time y aging ----------------
  function renderDwell(k) {
    const cats = estado.categoria ? [estado.categoria] : CATS;
    const idx = cats.map((c) => CATS.indexOf(c));
    grafico('gDwell', {
      type: 'bar',
      data: { labels: cats, datasets: [
        { label: 'Dwell real (días)', data: idx.map((i) => k.dw.porCategoria[i].promedio),
          backgroundColor: idx.map((i) => COLOR[estadoMenor(k.dw.porCategoria[i].promedio, M.dwellCategoria[CATS[i]])]) },
        { label: 'Meta (días)', data: cats.map((c) => M.dwellCategoria[c]), backgroundColor: '#c9d3dd' },
      ] },
      options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'días' } } },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y, 2)}` } } } },
    });
    grafico('gAging', {
      type: 'bar',
      data: { labels: k.ag.tramos.map((t) => t.etiqueta), datasets: cats.map((c) => ({ label: c, data: k.ag.tramos.map((t) => t.porCat[CATS.indexOf(c)]), backgroundColor: COLOR_CAT[c] })) },
      options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: 'contenedores' } } } },
    });
    const tb = $('tDwell').querySelector('tbody');
    tb.replaceChildren(...k.presion.filter((p) => !estado.categoria || p.categoria === estado.categoria).map((p) => {
      const est = estadoMenor(p.real, p.meta);
      return el('tr', {}, [el('td', {}, p.categoria), el('td', { class: 'num' }, fmt(p.n, 0)), el('td', { class: 'num' }, fmt(p.real, 2)),
        el('td', { class: 'num' }, fmt(p.meta, 1)), el('td', { class: 'num' }, fmt(p.lambda, 1)), el('td', { class: 'num' }, fmt(p.inv, 0)),
        el('td', { class: 'num' }, fmt(p.teuDeMas, 0)), el('td', {}, el('span', { class: 'etiqueta ' + est }, textoEstado[est]))]);
    }));
    $('notaDwellGlobal').textContent = `Dwell global ponderado = ${fmt(k.dw.sumaDias, 0)} días ÷ ${fmt(k.dw.n, 0)} contenedores = ${fmt(k.dw.global, 2)} días. ` +
      `El promedio simple de las 4 categorías daría ${fmt(k.dw.promedioSimple, 2)} días: es incorrecto porque trata igual a una categoría con pocos contenedores que a una con muchos.`;
  }

  // ---------------- Módulo 3: remanejos ----------------
  function renderRemanejos(k) {
    const js = estado.bloque === '' ? null : [Number(estado.bloque)];
    const dias = [...Array(P.dias).keys()];
    const serie = dias.map((d) => KPI.remanejos(d, d, js).ratio);
    grafico('gRemDia', {
      type: 'line',
      data: { labels: dias.map((d) => P.fechas[d].slice(5)), datasets: [
        { label: 'Rehandle ratio (%)', data: serie, borderColor: '#1f5f8b', borderWidth: 2,
          pointRadius: dias.map((d) => (d === estado.dia ? 5 : 0)),
          segment: { borderColor: (ctx) => (ctx.p1DataIndex >= k.desde && ctx.p1DataIndex <= k.hasta ? '#1f5f8b' : '#9db7cc') } },
        { label: `Meta ${M.remanejos} %`, data: dias.map(() => M.remanejos), borderColor: COLOR.rojo, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 },
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: true, title: { display: true, text: '%' } } },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y, 1)}` } } } },
    });
    const porBloque = P.bloques.map((b, j) => KPI.remanejos(k.desde, k.hasta, [j]).ratio);
    grafico('gRemBloque', {
      type: 'bar',
      data: { labels: P.bloques.map((b) => b.id), datasets: [{ label: 'Rehandle ratio (%)', data: porBloque, backgroundColor: porBloque.map((r) => COLOR[estadoMenor(r, M.remanejos)]) }] },
      options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: '%' } } }, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${fmt(c.parsed.y, 1)} %` } } } },
    });
    const pts = KPI.puntosDensidadRemanejos(null);
    const reg = KPI.regresion(pts);
    const sel = js ? P.bloques[js[0]].id : null;
    const xs = pts.map((p) => p.x), xmin = Math.min(...xs), xmax = Math.max(...xs);
    grafico('gRemDens', {
      type: 'scatter',
      data: { datasets: [
        { label: sel ? 'Otros bloques' : 'Bloque-día', data: pts.filter((p) => !sel || p.bloque !== sel), backgroundColor: sel ? 'rgba(150,160,170,0.35)' : 'rgba(31,95,139,0.45)', pointRadius: 3 },
        ...(sel ? [{ label: 'Bloque ' + sel, data: pts.filter((p) => p.bloque === sel), backgroundColor: COLOR.rojo, pointRadius: 4 }] : []),
        { type: 'line', label: 'Recta de tendencia', data: reg ? [{ x: xmin, y: reg.predecir(xmin) }, { x: xmax, y: reg.predecir(xmax) }] : [], borderColor: '#1d2733', borderWidth: 2, pointRadius: 0 },
      ] },
      options: { maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Densidad del bloque al inicio del día (%)' } }, y: { beginAtZero: true, title: { display: true, text: 'Rehandle ratio (%)' } } },
        plugins: { tooltip: { callbacks: { label: (c) => (c.raw.bloque ? `${c.raw.bloque} · ${P.fechas[c.raw.dia]}: ` : '') + `densidad ${fmt(c.parsed.x, 1)} %, remanejos ${fmt(c.parsed.y, 1)} %` } } } },
    });
    $('notaRegresion').textContent = reg
      ? `Cada punto es un bloque en un día. Recta: remanejos (%) = ${fmt(reg.a, 2)} + ${fmt(reg.b, 3)} × densidad (%) · R² = ${fmt(reg.r2, 2)}. Cada punto de densidad adicional suma unos ${fmt(reg.b, 2)} puntos de rehandle ratio.`
      : 'No hay suficientes datos.';
  }

  // ---------------- Módulo 4: simulador ----------------
  const ctrl = {}; // referencias a los sliders
  function baseSimulador(k) {
    return { dwell: k.presion.map((p) => p.real || p.meta), cambio: 0, evacVacios: 0, crec: KPI.crecimientoLlegadas(Math.max(0, estado.dia - 29), estado.dia) };
  }
  function crearControles() {
    const cont = $('controles');
    const slider = (clave, etiqueta, min, max, paso, unidad) => {
      const valor = el('b', {}, '—'), actual = el('div', { class: 'actual' }, '');
      const input = el('input', { type: 'range', min, max, step: paso });
      input.addEventListener('input', () => { estado.escenario[clave.k][clave.i] = Number(input.value); estado.nombreEscenario = 'Escenario personalizado'; renderSimuladorYA3(); });
      cont.append(el('div', { class: 'control' }, [el('label', {}, [etiqueta, el('span', {}, [valor, ' ' + unidad])]), input, actual]));
      return { input, valor, actual };
    };
    CATS.forEach((c, i) => { ctrl['dwell' + i] = slider({ k: 'dwell', i }, 'Dwell ' + c, 1, 20, 0.5, 'días'); });
    ctrl.cambio = slider({ k: 'otros', i: 'cambio' }, 'Cambio en llegadas', -30, 30, 1, '%');
    ctrl.evacVacios = slider({ k: 'otros', i: 'evacVacios' }, 'Evacuación extra de vacíos', 0, 150, 5, 'TEU/día');
    ctrl.crec = slider({ k: 'otros', i: 'crec' }, 'Crecimiento de llegadas', -1, 1.5, 0.05, '% por día');
    document.querySelectorAll('[data-esc]').forEach((b) => b.addEventListener('click', () => aplicarEscenario(b.dataset.esc, b.textContent)));
  }
  function aplicarEscenario(nombre, etiqueta) {
    const base = baseSimulador(calcular());
    const e = { dwell: base.dwell.slice(), otros: { cambio: 0, evacVacios: 0, crec: base.crec } };
    const iImp = CATS.indexOf('Importación');
    if (nombre === 'tiempoLibre' || nombre === 'combinado') e.dwell[iImp] = Math.max(1, Math.round((base.dwell[iImp] - 2) * 2) / 2);
    if (nombre === 'citas') e.dwell[iImp] = Math.max(1, Math.round((base.dwell[iImp] - 1) * 2) / 2);
    if (nombre === 'vacios' || nombre === 'combinado') e.otros.evacVacios = 60;
    estado.escenario = e;
    estado.nombreEscenario = nombre === 'reset' ? 'Situación actual' : etiqueta;
    renderSimuladorYA3();
  }
  function simular(k) {
    const base = baseSimulador(k);
    if (!estado.escenario) estado.escenario = { dwell: base.dwell.slice(), otros: { cambio: 0, evacVacios: 0, crec: base.crec } };
    const e = estado.escenario;
    const H = C.horizonteProyeccion, cap = k.capTotal, iVac = CATS.indexOf('Vacíos');
    const comun = { inv0: KPI.inventarioCategoriasSuavizado(estado.dia), lambda: k.lam, horizonte: H };
    const sBase = KPI.proyectar({ ...comun, dwell: base.dwell, crecimientoPct: base.crec, cambioLlegadasPct: 0, evacuacion: [] });
    const evac = CATS.map((_, i) => (i === iVac ? e.otros.evacVacios : 0));
    const sEsc = KPI.proyectar({ ...comun, dwell: e.dwell, crecimientoPct: e.otros.crec, cambioLlegadasPct: e.otros.cambio, evacuacion: evac });
    const dens = (s) => s.map((x) => (x.total / cap) * 100);
    const dB = dens(sBase), dE = dens(sEsc);
    const regR = KPI.regresion(KPI.puntosDensidadRemanejos(null));
    const regT = KPI.regresion(KPI.puntosDensidadServicio());
    const primerRojo = (serie) => { const i = serie.findIndex((d) => d >= C.umbralRojo); return i < 0 ? Infinity : i; };
    // Se ancla en el valor real del periodo y se usa la pendiente de la recta (efecto de cada punto de densidad)
    let densProm = 0;
    for (let d = k.desde; d <= k.hasta; d++) densProm += KPI.densidadTotal(d - 1);
    densProm /= (k.hasta - k.desde + 1);
    const remEsp = (dens) => (regR ? Math.max(0, k.rem.ratio + regR.b * (dens - densProm)) : null);
    const tsEsp = (dens) => (regT && k.ts.promedio != null ? Math.max(0, k.ts.promedio + regT.b * (dens - densProm)) : null);
    return { base, e, H, dB, dE, sBase, sEsc, teuLiberados: sBase[H].total - sEsc[H].total, densProm,
      remB: remEsp(dB[H]), remE: remEsp(dE[H]), tsB: tsEsp(dB[H]), tsE: tsEsp(dE[H]),
      rojoB: primerRojo(dB), rojoE: primerRojo(dE) };
  }
  function renderSimulador(k, s) {
    document.querySelectorAll('.horizonte').forEach((x) => { x.textContent = s.H; });
    $('crecMedido').textContent = fmt(s.base.crec, 2);
    CATS.forEach((c, i) => {
      const r = ctrl['dwell' + i]; r.input.value = s.e.dwell[i]; r.valor.textContent = fmt(s.e.dwell[i], 1);
      r.actual.textContent = `actual: ${fmt(s.base.dwell[i], 2)} días · meta ${M.dwellCategoria[c]} días`;
    });
    [['cambio', 0, '%'], ['evacVacios', 0, 'TEU/día'], ['crec', s.base.crec, '% por día']].forEach(([key, act, u]) => {
      const r = ctrl[key]; r.input.value = s.e.otros[key]; r.valor.textContent = fmt(s.e.otros[key], key === 'crec' ? 2 : 0);
      r.actual.textContent = `actual: ${fmt(act, key === 'crec' ? 2 : 0)} ${u}`;
    });
    const dias = [...Array(s.H + 1).keys()];
    const ref = (v, c, l) => ({ label: l, data: dias.map(() => v), borderColor: c, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 });
    grafico('gProy', {
      type: 'line',
      data: { labels: dias.map((d) => 'día +' + d), datasets: [
        { label: 'Sin cambios', data: s.dB, borderColor: COLOR.rojo, borderWidth: 2.5, pointRadius: 2 },
        { label: 'Escenario: ' + estado.nombreEscenario, data: s.dE, borderColor: '#1f5f8b', borderWidth: 2.5, pointRadius: 2 },
        ref(C.umbralAmarillo, COLOR.amarillo, 'Umbral amarillo'), ref(C.umbralRojo, COLOR.rojo, 'Umbral rojo'),
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { suggestedMin: 50, suggestedMax: 95, title: { display: true, text: 'Densidad (%)' } } },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y, 1)} %` } } } },
    });
    const caja = (n, v) => el('div', { class: 'resultado' }, [el('div', { class: 'nombre' }, n), el('div', { class: 'valor' }, v)]);
    const diasRojo = (x) => (x === Infinity ? `> ${s.H} días` : x === 0 ? 'ya en rojo' : `día +${x}`);
    $('resultados').replaceChildren(
      caja('Densidad sin cambios', fmt(s.dB[s.H], 1) + ' %'),
      caja('Densidad con escenario', fmt(s.dE[s.H], 1) + ' %'),
      caja('TEU liberados', fmt(s.teuLiberados, 0) + ' TEU'),
      caja('Rehandle ratio esperado', `${fmt(s.remB, 1)} → ${fmt(s.remE, 1)} %`),
      caja('Tiempo de servicio esperado', `${fmt(s.tsB, 1)} → ${fmt(s.tsE, 1)} min`),
      caja('Alerta roja (≥ ' + C.umbralRojo + ' %)', `${diasRojo(s.rojoB)} → ${diasRojo(s.rojoE)}`),
    );
  }

  // ---------------- Módulo 5: A3 ----------------
  function renderA3(k, s) {
    const li = (t) => el('li', {}, t);
    $('a3Problema').replaceChildren(
      li(`Al ${fechaLarga(estado.dia)} la densidad del patio es ${fmt(k.densidad, 1)} % (meta ≤ ${M.densidad} %), con ${k.bloquesRojos.length} bloque(s) en alerta roja${k.bloquesRojos.length ? ': ' + k.bloquesRojos.map((b) => b.id).join(', ') : ''}.`),
      li(`El inventario crece ${fmt(k.roja.crecimiento, 0)} TEU/día; faltan ${fmtDias(k.roja.dias)}${isFinite(k.roja.dias) && k.roja.dias > 0 ? ' días' : ''} para la alerta roja del patio completo.`),
      li(`Con más densidad suben los remanejos (${fmt(k.rem.ratio, 1)} %) y el tiempo de servicio de los camiones (${fmt(k.ts.promedio, 1)} min).`),
    );
    const filaKPI = (n, v, m, est) => el('tr', {}, [el('td', {}, n), el('td', { class: 'num' }, v), el('td', { class: 'num' }, m), el('td', {}, el('span', { class: 'etiqueta ' + est }, textoEstado[est]))]);
    $('a3Actual').querySelector('tbody').replaceChildren(
      filaKPI('Yard Density', fmt(k.densidad, 1) + ' %', '≤ ' + M.densidad + ' %', estadoDensidad(k.densidad)),
      filaKPI('Dwell global', fmt(k.dw.global, 2) + ' d', '≤ ' + M.dwellGlobal + ' d', estadoMenor(k.dw.global, M.dwellGlobal)),
      ...k.presion.map((p) => filaKPI('Dwell ' + p.categoria, fmt(p.real, 2) + ' d', '≤ ' + p.meta + ' d', estadoMenor(p.real, p.meta))),
      filaKPI('Rehandle ratio', fmt(k.rem.ratio, 1) + ' %', '≤ ' + M.remanejos + ' %', estadoMenor(k.rem.ratio, M.remanejos)),
      filaKPI('Tiempo de servicio', fmt(k.ts.promedio, 1) + ' min', '≤ ' + M.tiempoServicio + ' min', estadoMenor(k.ts.promedio, M.tiempoServicio)),
      filaKPI(`Aging > ${M.agingDias} d`, fmt(k.ag.pct, 1) + ' %', '≤ ' + M.agingPct + ' %', estadoMenor(k.ag.pct, M.agingPct)),
    );
    const orden = k.presion.slice().sort((a, b) => b.teuDeMas - a.teuDeMas);
    $('a3Causa').replaceChildren(...orden.filter((p) => p.teuDeMas > 0).map((p) =>
      li(`${p.categoria}: dwell ${fmt(p.real, 2)} días vs meta ${p.meta} → ocupa ${fmt(p.teuDeMas, 0)} TEU de más (${fmt((p.teuDeMas / k.capTotal) * 100, 1)} puntos de densidad).`)),
      ...(orden[0] && orden[0].teuDeMas > 0 ? [] : [li('Ninguna categoría supera su meta de dwell en el periodo.')]));
    const horasExtra = k.ts.horasExtra;
    const nDias = k.hasta - k.desde + 1;
    $('a3Desperdicio').replaceChildren(
      li(`Movimientos improductivos (remanejos): ${fmt(k.rem.improductivos, 0)} en ${nDias} días (≈ ${fmt(k.rem.improductivos / nDias, 0)} por día).`),
      li(`Espera de camiones en patio: ${fmt(horasExtra, 0)} horas-camión por encima de la meta de ${M.tiempoServicio} min en el periodo (sumando bloque por bloque y día por día).`),
      li(`Inventario estancado: ${fmt(k.ag.mayoresX, 0)} contenedores con más de ${M.agingDias} días (${fmt(k.ag.pct, 1)} % del inventario).`),
    );
    const cambios = [];
    CATS.forEach((c, i) => { if (Math.abs(s.e.dwell[i] - s.base.dwell[i]) > 0.05) cambios.push(`Dwell de ${c}: ${fmt(s.base.dwell[i], 2)} → ${fmt(s.e.dwell[i], 1)} días`); });
    if (s.e.otros.evacVacios) cambios.push(`Evacuar ${s.e.otros.evacVacios} TEU/día de vacíos (reposicionamiento con las líneas)`);
    if (s.e.otros.cambio) cambios.push(`Cambio en llegadas: ${s.e.otros.cambio > 0 ? '+' : ''}${s.e.otros.cambio} %`);
    if (Math.abs(s.e.otros.crec - s.base.crec) > 0.01) cambios.push(`Crecimiento de llegadas: ${fmt(s.e.otros.crec, 2)} % por día`);
    $('a3Propuesta').replaceChildren(li('Escenario: ' + estado.nombreEscenario), ...(cambios.length ? cambios.map(li) : [li('Sin cambios: elijan un escenario en el módulo 4 (Simulador).')]));
    const diasRojo = (x) => (x === Infinity ? `> ${s.H} d` : x === 0 ? 'ya en rojo' : `día +${x}`);
    const fila = (n, a, b, m) => el('tr', {}, [el('td', {}, n), el('td', { class: 'num' }, a), el('td', { class: 'num' }, b), el('td', { class: 'num' }, m)]);
    const iImp = CATS.indexOf('Importación');
    $('a3Resultado').querySelector('tbody').replaceChildren(
      fila(`Densidad al día +${s.H}`, fmt(s.dB[s.H], 1) + ' %', fmt(s.dE[s.H], 1) + ' %', '≤ ' + M.densidad + ' %'),
      fila('TEU liberados', '—', fmt(s.teuLiberados, 0) + ' TEU', '—'),
      fila('Dwell importación', fmt(s.base.dwell[iImp], 2) + ' d', fmt(s.e.dwell[iImp], 1) + ' d', '≤ ' + M.dwellCategoria['Importación'] + ' d'),
      fila('Rehandle ratio esperado', fmt(s.remB, 1) + ' %', fmt(s.remE, 1) + ' %', '≤ ' + M.remanejos + ' %'),
      fila('Tiempo de servicio esperado', fmt(s.tsB, 1) + ' min', fmt(s.tsE, 1) + ' min', '≤ ' + M.tiempoServicio + ' min'),
      fila('Llega a alerta roja', diasRojo(s.rojoB), diasRojo(s.rojoE), 'no llegar'),
    );
  }

  // ---------------- Módulo 6: verificación paso a paso ----------------
  function renderVerificacion(k) {
    const b0 = P.bloques[0];
    const paso = (html) => el('p', { class: 'paso' }, html);
    const f = (t) => el('span', { class: 'formula' }, t);
    const inv = KPI.inventarioBloques(estado.dia);
    const caja = (titulo, hijos) => el('div', { class: 'panel' }, [el('h3', {}, titulo), ...hijos]);
    $('verificacion').replaceChildren(
      caja(`1. Yard Density al cierre del ${fechaLarga(estado.dia)} (día ${estado.dia})`, [
        paso(['Capacidad del bloque ', b0.id, ': ', f(`${b0.stacks} × (${b0.tiers} × ${b0.lanes} − ${b0.shuffle}) − ${b0.inoperativos} = ${fmt(b0.cap, 0)} TEU`)]),
        paso(['Capacidad operativa total (8 bloques): ', f(P.bloques.map((b) => b.cap).join(' + ') + ' = ' + fmt(k.capTotal, 0) + ' TEU')]),
        paso(['Inventario: en contenedores.csv filtrar ', f(`dia_entrada ≤ ${estado.dia}`), ' y ', f(`dia_salida > ${estado.dia}`), ' y sumar la columna teu = ', f(fmt(k.inv, 0) + ' TEU'),
          ` (por bloque: ${P.bloques.map((b, j) => `${b.id} ${fmt(inv[j], 0)}`).join(', ')})`]),
        paso(['Yard Density = ', f(`${fmt(k.inv, 0)} ÷ ${fmt(k.capTotal, 0)} × 100 = ${fmt(k.densidad, 2)} %`)]),
      ]),
      caja(`2. Dwell time global, salidas del ${fechaLarga(k.desde)} al ${fechaLarga(k.hasta)} (días ${k.desde} a ${k.hasta})`, [
        paso(['En contenedores.csv filtrar ', f(`${k.desde} ≤ dia_salida ≤ ${k.hasta}`), ', crear la columna ', f('dias = dia_salida − dia_entrada'), ' y sumar por categoría:']),
        ...k.dw.porCategoria.map((c) => paso(`${c.nombre}: ${fmt(c.sumaDias, 0)} días ÷ ${fmt(c.n, 0)} contenedores = ${fmt(c.promedio, 3)} días`)),
        paso(['Global ponderado = ', f(`${fmt(k.dw.sumaDias, 0)} ÷ ${fmt(k.dw.n, 0)} = ${fmt(k.dw.global, 3)} días`), ` (promedio simple, incorrecto: ${fmt(k.dw.promedioSimple, 3)})`]),
      ]),
      caja(`3. Rehandle ratio, días ${k.desde} a ${k.hasta}`, [
        paso(['Improductivos: en movimientos_bloque.csv sumar ', f('remanejos'), ` de los días ${k.desde} a ${k.hasta} = `, f(fmt(k.rem.improductivos, 0))]),
        paso(['Productivos: en contenedores.csv contar entradas ', f(`${k.desde} ≤ dia_entrada ≤ ${k.hasta}`), ' + salidas ', f(`${k.desde} ≤ dia_salida ≤ ${k.hasta}`), ' = ', f(fmt(k.rem.productivos, 0))]),
        paso(['Rehandle ratio = ', f(`${fmt(k.rem.improductivos, 0)} ÷ ${fmt(k.rem.productivos, 0)} × 100 = ${fmt(k.rem.ratio, 2)} %`)]),
      ]),
    );
  }

  // ---------------- Render general ----------------
  function renderSimuladorYA3() {
    const k = calcular(), s = simular(k);
    renderSimulador(k, s);
    renderA3(k, s);
  }
  function render() {
    $('fechaSel').textContent = `${fechaLarga(estado.dia)} (día ${estado.dia})`;
    const k = calcular();
    renderKPIs(k); renderMapa(k); renderDwell(k); renderRemanejos(k); renderVerificacion(k);
    estado.escenario = null; estado.nombreEscenario = 'Situación actual';
    const s = simular(k);
    renderSimulador(k, s); renderA3(k, s);
  }

  // ---------------- Inicio ----------------
  function iniciar() {
    $('fDia').max = P.dias - 1; $('fDia').value = estado.dia;
    CATS.forEach((c) => $('fCategoria').append(el('option', { value: c }, c)));
    P.bloques.forEach((b, j) => $('fBloque').append(el('option', { value: String(j) }, `${b.id} (${b.categoria})`)));
    $('fDia').addEventListener('input', () => { estado.dia = Number($('fDia').value); render(); });
    $('fPeriodo').addEventListener('change', () => { estado.periodo = Number($('fPeriodo').value); render(); });
    $('fCategoria').addEventListener('change', () => { estado.categoria = $('fCategoria').value; render(); });
    $('fBloque').addEventListener('change', () => { estado.bloque = $('fBloque').value; renderRemanejos(calcular()); });
    document.querySelectorAll('#pestanas button').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('#pestanas button').forEach((x) => x.classList.toggle('activa', x === b));
      document.querySelectorAll('.modulo').forEach((m) => m.classList.toggle('activo', m.id === b.dataset.mod));
      Object.values(graficos).forEach((g) => g.resize());
    }));
    ['txtCausa', 'txtPropuesta', 'txtPlan'].forEach((id) => {
      $(id).value = leer('a3-' + id);
      $(id).addEventListener('input', () => guardar('a3-' + id, $(id).value));
    });
    crearControles();
    render();
  }
  iniciar();
})();
