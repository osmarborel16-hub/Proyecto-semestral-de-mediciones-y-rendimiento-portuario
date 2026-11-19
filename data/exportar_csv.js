// Exporta los datos simulados a CSV usando EXACTAMENTE el mismo código de index.html.
// No contiene lógica propia de simulación: lee el <script> de index.html y lo ejecuta.
// Uso (desde la carpeta del repositorio):  node data/exportar_csv.js
// Resultado: data/*.csv (los mismos datos que descargan los botones del dashboard, semilla 2026)

const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const codigo = html.split('<script>')[1].split('</script>')[0];

// Solo se necesita la parte de datos (secciones 1 a 4); la interfaz del navegador no se ejecuta.
const hastaTarjetas = codigo.split('/* =====================================================================\n   5. TARJETAS')[0];

const tablas = new Function(hastaTarjetas + '\ngenerarDatos();\nreturn { DATOS, aCSV };')();

for (const [nombre, filas] of Object.entries(tablas.DATOS)) {
  const archivo = path.join(__dirname, nombre + '.csv');
  fs.writeFileSync(archivo, '﻿' + tablas.aCSV(filas) + '\n');
  console.log(`${nombre}.csv  ${filas.length} filas`);
}
