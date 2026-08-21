import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { moneyARS, moneyUSD } from "../lib/format";
import type { Configuracion, Obra, Venta } from "../lib/types";

const emptyForm = {
  obra_id: "",
  fecha_venta: new Date().toISOString().slice(0, 10),
  comprador_nombre: "",
  comprador_contacto: "",
  precio_venta: "",
};

export default function Gestion() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [tipoCambio, setTipoCambio] = useState(1000);
  const [tipoCambioInput, setTipoCambioInput] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroPublicado, setFiltroPublicado] = useState<"todas" | "publicadas" | "no_publicadas">("todas");

  async function cargarTodo() {
    setLoading(true);
    const [obrasRes, ventasRes, configRes] = await Promise.all([
      supabase.from("obras").select("*").order("nombre"),
      supabase.from("ventas").select("*, obra:obras(*)").order("fecha_venta", { ascending: false }),
      supabase.from("configuracion").select("*").eq("id", 1).maybeSingle(),
    ]);
    setObras(obrasRes.data ?? []);
    setVentas((ventasRes.data as unknown as Venta[]) ?? []);
    const config = configRes.data as Configuracion | null;
    if (config) {
      setTipoCambio(config.tipo_cambio);
      setTipoCambioInput(String(config.tipo_cambio));
    }
    setLoading(false);
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  async function guardarTipoCambio() {
    const valor = Number(tipoCambioInput);
    if (Number.isNaN(valor) || valor <= 0) return;
    setTipoCambio(valor);
    await supabase.from("configuracion").upsert({ id: 1, tipo_cambio: valor });
  }

  const obraSeleccionada = obras.find((o) => o.id === form.obra_id);

  // costo está en ARS, precio/precio_venta en USD: convertimos el costo a USD con el tipo de cambio.
  const costoUsd = (costoArs: number) => costoArs / tipoCambio;

  const resumen = useMemo(() => {
    const stockTotal = obras.reduce((acc, o) => acc + o.stock, 0);
    const unidadesVendidas = ventas.length;
    const ingresosUsd = ventas.reduce((acc, v) => acc + v.precio_venta, 0);
    const costosArs = ventas.reduce((acc, v) => acc + (v.obra?.costo ?? 0), 0);
    const rentabilidadUsd = ingresosUsd - costoUsd(costosArs);
    return { stockTotal, unidadesVendidas, ingresosUsd, costosArs, rentabilidadUsd };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obras, ventas, tipoCambio]);

  const obrasOrdenadas = useMemo(() => {
    const filtradas = obras.filter((o) => {
      if (filtroPublicado === "publicadas") return o.disponible;
      if (filtroPublicado === "no_publicadas") return !o.disponible;
      return true;
    });

    return [...filtradas].sort((a, b) => {
      if (a.disponible !== b.disponible) return a.disponible ? -1 : 1;
      const serieCompare = (a.serie ?? "").localeCompare(b.serie ?? "", "es");
      if (serieCompare !== 0) return serieCompare;
      const fotoA = a.foto_url ? 0 : 1;
      const fotoB = b.foto_url ? 0 : 1;
      if (fotoA !== fotoB) return fotoA - fotoB;
      return a.nombre.localeCompare(b.nombre, "es");
    });
  }, [obras, filtroPublicado]);

  function handleSelectObra(obra_id: string) {
    const obra = obras.find((o) => o.id === obra_id);
    setForm({ ...form, obra_id, precio_venta: obra ? String(obra.precio) : "" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const precio_venta = Number(form.precio_venta);
    if (!form.obra_id || !form.comprador_nombre.trim() || Number.isNaN(precio_venta)) {
      setError("Elegí una obra, cargá el comprador y un precio de venta válido.");
      return;
    }
    if (!obraSeleccionada || obraSeleccionada.stock < 1) {
      setError("Esa obra no tiene stock disponible.");
      return;
    }

    setSaving(true);
    try {
      const { error: ventaError } = await supabase.from("ventas").insert({
        obra_id: form.obra_id,
        fecha_venta: form.fecha_venta,
        comprador_nombre: form.comprador_nombre.trim(),
        comprador_contacto: form.comprador_contacto.trim() || null,
        precio_venta,
      });
      if (ventaError) throw ventaError;

      const nuevoStock = obraSeleccionada.stock - 1;
      const { error: obraError } = await supabase
        .from("obras")
        .update({ stock: nuevoStock, disponible: nuevoStock > 0 })
        .eq("id", obraSeleccionada.id);
      if (obraError) throw obraError;

      setForm(emptyForm);
      cargarTodo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Gestión</h1>
      <p className="mt-1 text-sm text-ink/60">Costos, stock, ventas y rentabilidad del emprendimiento.</p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-ink/10 bg-white p-4">
        <div>
          <label className="block text-sm font-medium text-ink/80">Tipo de cambio (ARS por 1 USD)</label>
          <p className="text-xs text-ink/50">Los precios se cargan en USD y los costos en ARS. Este valor se usa para calcular la rentabilidad.</p>
        </div>
        <input
          type="number"
          min="1"
          value={tipoCambioInput}
          onChange={(e) => setTipoCambioInput(e.target.value)}
          className="w-32 rounded border border-ink/20 px-3 py-1.5"
        />
        <button
          onClick={guardarTipoCambio}
          className="rounded bg-ink/80 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Guardar
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Stock total" value={String(resumen.stockTotal)} />
        <Stat label="Unidades vendidas" value={String(resumen.unidadesVendidas)} />
        <Stat label="Ingresos" value={moneyUSD.format(resumen.ingresosUsd)} />
        <Stat label="Costos (obras vendidas)" value={moneyARS.format(resumen.costosArs)} />
        <Stat label="Rentabilidad" value={moneyUSD.format(resumen.rentabilidadUsd)} highlight />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={handleSubmit} className="h-fit rounded-lg border border-ink/10 bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Registrar venta</h2>

          <label className="mt-4 block text-sm font-medium text-ink/80">Obra</label>
          <select
            value={form.obra_id}
            onChange={(e) => handleSelectObra(e.target.value)}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            required
          >
            <option value="">Seleccionar…</option>
            {obras
              .filter((o) => o.stock > 0)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre} (stock: {o.stock})
                </option>
              ))}
          </select>

          <label className="mt-4 block text-sm font-medium text-ink/80">Fecha de venta</label>
          <input
            type="date"
            value={form.fecha_venta}
            onChange={(e) => setForm({ ...form, fecha_venta: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            required
          />

          <label className="mt-4 block text-sm font-medium text-ink/80">Comprador</label>
          <input
            value={form.comprador_nombre}
            onChange={(e) => setForm({ ...form, comprador_nombre: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            required
          />

          <label className="mt-4 block text-sm font-medium text-ink/80">Contacto (teléfono, IG, email)</label>
          <input
            value={form.comprador_contacto}
            onChange={(e) => setForm({ ...form, comprador_contacto: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
          />

          <label className="mt-4 block text-sm font-medium text-ink/80">Precio de venta real (USD)</label>
          <input
            type="number"
            min="0"
            value={form.precio_venta}
            onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            required
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded bg-navy py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Registrar venta"}
          </button>
        </form>

        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Ventas</h2>
          {loading && <p className="mt-2 text-ink/50">Cargando…</p>}
          <div className="mt-3 overflow-x-auto rounded-lg border border-ink/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-ink/50">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Obra</th>
                  <th className="px-4 py-2">Comprador</th>
                  <th className="px-4 py-2">Contacto</th>
                  <th className="px-4 py-2">Precio venta</th>
                  <th className="px-4 py-2">Rentabilidad</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const rentabilidad = v.precio_venta - costoUsd(v.obra?.costo ?? 0);
                  return (
                    <tr key={v.id} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-2">{v.fecha_venta}</td>
                      <td className="px-4 py-2">{v.obra?.nombre ?? "—"}</td>
                      <td className="px-4 py-2">{v.comprador_nombre}</td>
                      <td className="px-4 py-2 text-ink/60">{v.comprador_contacto ?? "—"}</td>
                      <td className="px-4 py-2">{moneyUSD.format(v.precio_venta)}</td>
                      <td className={`px-4 py-2 ${rentabilidad >= 0 ? "text-green-700" : "text-red-600"}`}>
                        {moneyUSD.format(rentabilidad)}
                      </td>
                    </tr>
                  );
                })}
                {!loading && ventas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-ink/40">
                      Todavía no hay ventas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">Stock y costos por obra</h2>
            <div className="flex gap-2">
              {(
                [
                  { key: "todas", label: "Todas" },
                  { key: "publicadas", label: "Publicadas" },
                  { key: "no_publicadas", label: "No publicadas" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFiltroPublicado(opt.key)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    filtroPublicado === opt.key
                      ? "border-navy bg-navy text-white"
                      : "border-ink/20 text-ink/60 hover:border-navy/50 hover:text-navy"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Orden: primero publicadas, después por serie, y dentro de cada serie primero las que ya tienen foto.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-ink/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-ink/50">
                <tr>
                  <th className="px-4 py-2">Obra</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Serie</th>
                  <th className="px-4 py-2">Foto</th>
                  <th className="px-4 py-2">Precio (USD)</th>
                  <th className="px-4 py-2">Costo (ARS)</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Margen unitario (USD)</th>
                </tr>
              </thead>
              <tbody>
                {obrasOrdenadas.map((o) => (
                  <tr key={o.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-2">{o.nombre}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          o.disponible ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/50"
                        }`}
                      >
                        {o.disponible ? "Publicada" : "Oculta"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-ink/60">{o.serie ?? "—"}</td>
                    <td className="px-4 py-2 text-ink/60">{o.foto_url ? "Sí" : "No"}</td>
                    <td className="px-4 py-2">{moneyUSD.format(o.precio)}</td>
                    <td className="px-4 py-2">{moneyARS.format(o.costo)}</td>
                    <td className="px-4 py-2">{o.stock}</td>
                    <td className="px-4 py-2">{moneyUSD.format(o.precio - costoUsd(o.costo))}</td>
                  </tr>
                ))}
                {obrasOrdenadas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-ink/40">
                      No hay obras que coincidan con el filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border border-ink/10 bg-white p-4 ${highlight ? "ring-1 ring-navy" : ""}`}>
      <p className="text-xs text-ink/50">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${highlight ? "text-navy" : "text-ink"}`}>{value}</p>
    </div>
  );
}
