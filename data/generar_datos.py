"""
Generador de datos simulados - Idea 3: "Un patio que se llena"
Proyecto Semestral UMIP - Medición y Rendimiento de Terminales Portuarias

Qué genera (todo dentro de data/):
  - datos.js                 -> lo lee el dashboard (window.DATOS), funciona con doble clic sin servidor
  - contenedores.csv         -> un registro por contenedor (para verificar KPI a mano en Excel)
  - movimientos_bloque.csv   -> remanejos, camiones y tiempo de servicio por bloque y día

Cómo ejecutarlo:   python data/generar_datos.py
Reproducible: usa una semilla fija (SEMILLA). Si se vuelve a ejecutar, salen exactamente los mismos datos.
Solo usa la librería estándar de Python (no hay que instalar nada).

Todos los supuestos están explicados en el README (sección "Supuestos de los datos").
"""
import csv
import json
import math
import random
from datetime import date, timedelta
from pathlib import Path

SEMILLA = 2026
random.seed(SEMILLA)

CARPETA = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# 1. Periodo simulado
# ---------------------------------------------------------------------------
DIAS_CALENTAMIENTO = 90          # días previos para que el patio arranque "lleno" (no se muestran)
DIAS_ANALISIS = 60               # días que se muestran en el dashboard
FECHA_INICIO = date(2026, 9, 1)  # primer día del periodo de análisis (día 0)

# ---------------------------------------------------------------------------
# 2. Diseño del patio (supuesto del grupo)
#    Capacidad operativa = Stacks x (Tiers x Lanes - Shuffle slots) - slots inoperativos   [por bloque]
# ---------------------------------------------------------------------------
BLOQUES = [
    # id,  categoría,      stacks, lanes, tiers, shuffle, inoperativos
    ("A1", "Importación",   32,     6,     5,     4,       10),
    ("A2", "Importación",   32,     6,     5,     4,        0),
    ("B1", "Exportación",   32,     6,     5,     4,        0),
    ("B2", "Exportación",   32,     6,     5,     4,       16),
    ("C1", "Transbordo",    32,     6,     5,     4,        0),
    ("C2", "Transbordo",    32,     6,     5,     4,        0),
    ("D1", "Vacíos",        32,     6,     6,     5,        0),
    ("D2", "Vacíos",        32,     6,     6,     5,        0),
]
CATEGORIAS = ["Importación", "Exportación", "Transbordo", "Vacíos"]


def capacidad_bloque(stacks, lanes, tiers, shuffle, inop):
    return stacks * (tiers * lanes - shuffle) - inop


# ---------------------------------------------------------------------------
# 3. Llegadas y dwell time por categoría (supuestos del grupo)
#    teu_dia: llegadas promedio de TEU por día al inicio del análisis
#    dwell_medio / cv: distribución lognormal del tiempo en patio (días)
# ---------------------------------------------------------------------------
PARAM_CAT = {
    "Importación": dict(teu_dia=180, dwell_medio=6.0, cv=0.6, retenidos=0.05),  # 5 % retenidos (aduana/abandono)
    "Exportación": dict(teu_dia=230, dwell_medio=3.0, cv=0.5, retenidos=0.0),
    "Transbordo":  dict(teu_dia=250, dwell_medio=3.8, cv=0.6, retenidos=0.0),
    "Vacíos":      dict(teu_dia=100, dwell_medio=12.0, cv=0.7, retenidos=0.0),
}
CRECIMIENTO_DIARIO = 0.0035      # +0.35 % por día de volumen (más buques/servicios): el patio se llena
PROB_40PIES = 0.60               # 60 % de contenedores de 40' (2 TEU), 40 % de 20' (1 TEU)
DIAS_BUQUE = {0, 2, 5}
LIMITE_DESBORDE = 0.97           # si los bloques de la categoría pasan del 97 %, el contenedor va a otro bloque           # lunes, miércoles y sábado hay buques (más llegadas de imp/transbordo)

# ---------------------------------------------------------------------------
# 4. Remanejos y tiempo de servicio (relación supuesta y justificada en el README)
#    Altura media de pila h = TEU en el bloque / (stacks x lanes)
#    Remanejos esperados por retiro = factor_categoria x (h - 1) / 4 x (1 + 3 x max(0, densidad - 0.75))
#    Tiempo de servicio (min/camión) = 10 + 8 x remanejos por retiro + 40 x max(0, densidad - 0.75) + ruido
# ---------------------------------------------------------------------------
FACTOR_REMANEJO = {"Importación": 1.0, "Transbordo": 0.8, "Exportación": 0.5, "Vacíos": 0.3}
CAMIONES_POR_MOV = {"Importación": 1.0, "Exportación": 1.0, "Transbordo": 0.0, "Vacíos": 1.0}


def lognormal(media, cv):
    sigma2 = math.log(1 + cv ** 2)
    mu = math.log(media) - sigma2 / 2
    return random.lognormvariate(mu, math.sqrt(sigma2))


def poisson(lam):
    """Poisson con la librería estándar (Knuth para lam pequeño, normal para lam grande)."""
    if lam <= 0:
        return 0
    if lam > 60:
        return max(0, int(round(random.gauss(lam, math.sqrt(lam)))))
    L, k, p = math.exp(-lam), 0, 1.0
    while True:
        p *= random.random()
        if p <= L:
            return k
        k += 1


def factor_dia(dia_abs, categoria):
    """Patrón semanal: imp. y transbordo llegan en días de buque; exp. y vacíos por camión en días hábiles."""
    dow = (FECHA_INICIO + timedelta(days=dia_abs - DIAS_CALENTAMIENTO)).weekday()
    if categoria in ("Importación", "Transbordo"):
        return 1.75 if dow in DIAS_BUQUE else 0.44
    return 0.35 if dow == 6 else 1.11   # domingo baja la actividad de camiones


def siguiente_dia_buque(dia_abs):
    d = dia_abs
    while (FECHA_INICIO + timedelta(days=d - DIAS_CALENTAMIENTO)).weekday() not in DIAS_BUQUE:
        d += 1
    return d


def main():
    total_dias = DIAS_CALENTAMIENTO + DIAS_ANALISIS
    bloques_por_cat = {c: [b[0] for b in BLOQUES if b[1] == c] for c in CATEGORIAS}
    info_bloque = {b[0]: dict(cat=b[1], stacks=b[2], lanes=b[3], tiers=b[4], shuffle=b[5], inop=b[6],
                              cap=capacidad_bloque(*b[2:])) for b in BLOQUES}

    # --- 4.1 Generar contenedores (llegada, salida, bloque, TEU) ---
    contenedores = []
    # ocupación futura por bloque y día (TEU), para asignar cada contenedor al bloque con más espacio
    ocupacion = {b: [0] * (total_dias + 120) for b in info_bloque}

    def elegir_bloque(cat, d):
        """Bloque menos lleno de su categoría; si todos pasan del 97 %, desborda al bloque menos lleno del patio."""
        dens = lambda b: ocupacion[b][d] / info_bloque[b]["cap"]
        propio = min(bloques_por_cat[cat], key=dens)
        if dens(propio) < LIMITE_DESBORDE:
            return propio
        return min(info_bloque, key=dens)

    for d in range(total_dias):
        crec = (1 + CRECIMIENTO_DIARIO) ** (d - DIAS_CALENTAMIENTO)
        for cat in CATEGORIAS:
            p = PARAM_CAT[cat]
            teu_esperados = p["teu_dia"] * crec * factor_dia(d, cat)
            n = poisson(teu_esperados / (1 + PROB_40PIES))
            for _ in range(n):
                teu = 2 if random.random() < PROB_40PIES else 1
                dwell = lognormal(p["dwell_medio"], p["cv"])
                if random.random() < p["retenidos"]:
                    dwell += random.uniform(15, 35)                 # cola larga: aging
                salida = d + max(1, int(round(dwell)))
                if cat == "Exportación":
                    salida = siguiente_dia_buque(salida)            # salen solo cuando hay buque
                elif cat == "Importación":
                    dow = (FECHA_INICIO + timedelta(days=salida - DIAS_CALENTAMIENTO)).weekday()
                    if dow == 6 and random.random() < 0.6:
                        salida += 1                                  # domingo: muchos retiran el lunes
                b = elegir_bloque(cat, d)
                for k in range(d, salida):
                    ocupacion[b][k] += teu
                contenedores.append([cat, b, teu, d, salida])

    # --- 4.2 Remanejos y tiempo de servicio por bloque y día (dependen de la densidad) ---
    entradas = {}
    salidas = {}
    for c in contenedores:
        entradas[(c[1], c[3])] = entradas.get((c[1], c[3]), 0) + 1
        salidas[(c[1], c[4])] = salidas.get((c[1], c[4]), 0) + 1
    # inventario en TEU al INICIO de cada día (antes de los movimientos del día) = entró antes y aún no sale
    delta = {}
    for c in contenedores:
        delta[(c[1], c[3])] = delta.get((c[1], c[3]), 0) + c[2]
        delta[(c[1], c[4])] = delta.get((c[1], c[4]), 0) - c[2]

    movimientos = []
    inventario = {b: 0 for b in info_bloque}
    for d in range(total_dias):
        for b, ib in info_bloque.items():
            dens = inventario[b] / ib["cap"]
            h = inventario[b] / (ib["stacks"] * ib["lanes"])
            rpr = FACTOR_REMANEJO[ib["cat"]] * max(0.0, h - 1) / 4 * (1 + 3 * max(0.0, dens - 0.75))
            retiros = salidas.get((b, d), 0)
            ent = entradas.get((b, d), 0)
            reman = poisson(retiros * rpr)
            camiones = int(round((ent + retiros) * CAMIONES_POR_MOV[ib["cat"]]))
            t_serv = 0.0
            if camiones > 0:
                t_serv = 10 + 8 * rpr + 40 * max(0.0, dens - 0.75) + random.gauss(0, 1.0)
            if d >= DIAS_CALENTAMIENTO:
                movimientos.append(dict(dia=d - DIAS_CALENTAMIENTO, bloque=b, remanejos=reman,
                                        camiones=camiones, tiempo_servicio_min=round(max(5.0, t_serv), 1) if camiones else None))
            inventario[b] += delta.get((b, d), 0)

    # --- 4.3 Guardar solo lo que toca el periodo de análisis (día 0 = FECHA_INICIO) ---
    visibles = []
    for c in contenedores:
        cat, b, teu, ent, sal = c
        if sal >= DIAS_CALENTAMIENTO and ent < total_dias:         # estuvo en patio en el análisis (o al cierre del día -1)
            visibles.append([CATEGORIAS.index(cat), b, teu, ent - DIAS_CALENTAMIENTO, sal - DIAS_CALENTAMIENTO])
    visibles.sort(key=lambda r: (r[3], r[1]))

    fechas = [(FECHA_INICIO + timedelta(days=i)).isoformat() for i in range(DIAS_ANALISIS)]
    datos = {
        "meta": {"semilla": SEMILLA, "fecha_inicio": FECHA_INICIO.isoformat(), "dias": DIAS_ANALISIS,
                 "nota": "Datos SIMULADOS con data/generar_datos.py. No son datos reales de una terminal."},
        "fechas": fechas,
        "categorias": CATEGORIAS,
        "bloques": [dict(id=b, categoria=ib["cat"], stacks=ib["stacks"], lanes=ib["lanes"], tiers=ib["tiers"],
                         shuffle=ib["shuffle"], inoperativos=ib["inop"]) for b, ib in info_bloque.items()],
        # contenedor = [categoria (índice), bloque, TEU, día de entrada, día de salida]  (día 0 = fecha_inicio;
        # entrada negativa = ya estaba en patio; salida >= 60 = sigue en patio al final)
        "contenedores": visibles,
        "movimientos": [[m["dia"], m["bloque"], m["remanejos"], m["camiones"], m["tiempo_servicio_min"]] for m in movimientos],
    }
    with open(CARPETA / "datos.js", "w", encoding="utf-8") as f:
        f.write("// Archivo GENERADO por data/generar_datos.py - no editar a mano\n")
        f.write("window.DATOS = ")
        json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    with open(CARPETA / "contenedores.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "categoria", "bloque", "teu", "dia_entrada", "dia_salida", "fecha_entrada", "fecha_salida"])
        for i, (ci, b, teu, ent, sal) in enumerate(visibles, 1):
            w.writerow([f"C{i:05d}", CATEGORIAS[ci], b, teu, ent, sal,
                        (FECHA_INICIO + timedelta(days=ent)).isoformat(), (FECHA_INICIO + timedelta(days=sal)).isoformat()])

    with open(CARPETA / "movimientos_bloque.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["dia", "fecha", "bloque", "remanejos", "camiones", "tiempo_servicio_min"])
        for m in movimientos:
            w.writerow([m["dia"], fechas[m["dia"]], m["bloque"], m["remanejos"], m["camiones"],
                        "" if m["tiempo_servicio_min"] is None else m["tiempo_servicio_min"]])

    print(f"Contenedores en el periodo: {len(visibles):,}")
    print(f"Capacidad operativa total: {sum(ib['cap'] for ib in info_bloque.values()):,} TEU")
    print("Archivos: data/datos.js, data/contenedores.csv, data/movimientos_bloque.csv")


if __name__ == "__main__":
    main()
