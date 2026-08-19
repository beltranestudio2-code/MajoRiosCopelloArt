// Importa a Supabase los datos parseados desde el Excel (scripts/import_data.json).
// Corré esto vos misma desde tu terminal: node scripts/import-excel.mjs
// Te va a pedir tu email y contraseña de /admin para loguearte (no queda guardado en ningún lado).

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import readline from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const BACKSPACE_CODES = [8, 127];
const CTRL_C_CODE = 3;

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) {
    console.error("No encontre .env en la raiz del proyecto. Copia .env.example a .env y completalo primero.");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding("utf-8");
    let value = "";
    const onData = (chunk) => {
      const char = chunk.toString();
      const code = char.charCodeAt(0);
      if (char === "\n" || char === "\r") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
        return;
      }
      if (code === CTRL_C_CODE) process.exit(1);
      if (BACKSPACE_CODES.includes(code)) {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  console.log("=== Login (usuario de /admin y /gestion) ===");
  const email = await ask("Email: ");
  const password = await askHidden("Contrasena: ");

  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) {
    console.error("No se pudo loguear:", loginError.message);
    process.exit(1);
  }
  console.log("Login OK.\n");

  const dataPath = join(__dirname, "import_data.json");
  const data = JSON.parse(readFileSync(dataPath, "utf-8"));

  console.log(`Tipo de cambio sugerido (ARS por USD): ${data.tipo_cambio_sugerido}`);
  const confirmTC = await ask("Guardar este tipo de cambio en Gestion? (s/n): ");
  if (confirmTC.trim().toLowerCase().startsWith("s")) {
    const { error } = await supabase.from("configuracion").upsert({ id: 1, tipo_cambio: data.tipo_cambio_sugerido });
    if (error) console.error("  Error guardando tipo de cambio:", error.message);
    else console.log("  Tipo de cambio guardado.\n");
  }

  console.log(`Cargando ${data.obras_stock_ocultas.length} obras de stock (ocultas)...`);
  const stockRows = data.obras_stock_ocultas.map(({ nombre, descripcion, precio, costo, stock, disponible }) => ({
    nombre, descripcion, precio, costo, stock, disponible,
  }));
  const { error: stockError, data: stockInserted } = await supabase.from("obras").insert(stockRows).select("id");
  if (stockError) {
    console.error("  Error cargando stock:", stockError.message);
  } else {
    console.log(`  OK, ${stockInserted.length} obras creadas (ocultas, revisalas en /admin).\n`);
  }

  console.log(`Cargando ${data.obras_vendidas_historicas.length} obras historicas + ventas...`);
  const obraIdByRef = {};
  for (let i = 0; i < data.obras_vendidas_historicas.length; i++) {
    const o = data.obras_vendidas_historicas[i];
    const { data: inserted, error } = await supabase
      .from("obras")
      .insert({ nombre: o.nombre, descripcion: o.descripcion, precio: o.precio, costo: o.costo, stock: o.stock, disponible: o.disponible })
      .select("id")
      .single();
    if (error) {
      console.error(`  Error creando obra historica "${o.nombre}":`, error.message);
      continue;
    }
    obraIdByRef[i] = inserted.id;
  }

  let ventasOk = 0;
  for (const v of data.ventas_historicas) {
    const obra_id = obraIdByRef[v._obra_ref];
    if (!obra_id) continue;
    const { error } = await supabase.from("ventas").insert({
      obra_id,
      fecha_venta: v.fecha_venta,
      comprador_nombre: v.comprador_nombre,
      comprador_contacto: v.comprador_contacto,
      precio_venta: v.precio_venta,
    });
    if (error) console.error(`  Error registrando venta de "${v.comprador_nombre}":`, error.message);
    else ventasOk++;
  }
  console.log(`  OK, ${ventasOk} ventas historicas registradas.\n`);

  if (data.ordenes_pendientes_no_importadas.length) {
    console.log("No se importaron estos pedidos (todavia no estan 100% pagados/entregados). Registralos vos desde /gestion cuando se completen:");
    for (const p of data.ordenes_pendientes_no_importadas) console.log("  -", p);
    console.log();
  }

  const sinCosto = data.obras_stock_ocultas.filter((o) => o._fuente_costo === "SIN_DATO_revisar");
  if (sinCosto.length) {
    console.log("Estas obras quedaron con costo $0 porque no encontre el dato en tu planilla, completalas en /admin:");
    for (const o of sinCosto) console.log("  -", o.nombre);
  }

  console.log("\nListo. Cerrando sesion...");
  await supabase.auth.signOut();
}

main();
