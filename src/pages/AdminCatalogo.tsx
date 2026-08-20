import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { moneyARS, moneyUSD } from "../lib/format";
import type { Obra } from "../lib/types";

const emptyForm = {
  nombre: "",
  tecnica: "",
  medidas: "",
  enmarcado: "",
  serie: "",
  precio: "",
  costo: "",
  stock: "1",
  mostrar_precio: false,
};

export default function AdminCatalogo() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creandoSerie, setCreandoSerie] = useState(false);
  const [serieEditando, setSerieEditando] = useState<string | null>(null);
  const [nombreSerieEditado, setNombreSerieEditado] = useState("");

  const series = Array.from(new Set(obras.map((o) => o.serie).filter((s): s is string => !!s))).sort();
  const serieConteo = (nombre: string) => obras.filter((o) => o.serie === nombre).length;

  async function renombrarSerie(nombreActual: string) {
    const nuevoNombre = nombreSerieEditado.trim();
    if (!nuevoNombre || nuevoNombre === nombreActual) {
      setSerieEditando(null);
      return;
    }
    await supabase.from("obras").update({ serie: nuevoNombre }).eq("serie", nombreActual);
    setSerieEditando(null);
    cargarObras();
  }

  async function eliminarSerie(nombre: string) {
    const cantidad = serieConteo(nombre);
    if (!confirm(`¿Sacar la serie "${nombre}" de ${cantidad} obra(s)? Las obras no se borran, solo dejan de tener esa serie.`)) return;
    await supabase.from("obras").update({ serie: null }).eq("serie", nombre);
    cargarObras();
  }

  async function cargarObras() {
    setLoading(true);
    const { data } = await supabase.from("obras").select("*").order("created_at", { ascending: false });
    setObras(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    cargarObras();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setFile(null);
    setEditingId(null);
    setCreandoSerie(false);
  }

  function editar(obra: Obra) {
    setEditingId(obra.id);
    setForm({
      nombre: obra.nombre,
      tecnica: obra.tecnica ?? "",
      medidas: obra.medidas ?? "",
      enmarcado: obra.enmarcado ?? "",
      serie: obra.serie ?? "",
      precio: obra.precio ? String(obra.precio) : "",
      costo: String(obra.costo),
      stock: String(obra.stock),
      mostrar_precio: obra.mostrar_precio,
    });
    setFile(null);
    setCreandoSerie(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminar(obra: Obra) {
    if (!confirm(`¿Eliminar "${obra.nombre}"? Esta acción no se puede deshacer.`)) return;
    await supabase.from("obras").delete().eq("id", obra.id);
    cargarObras();
  }

  async function toggleDisponible(obra: Obra) {
    await supabase.from("obras").update({ disponible: !obra.disponible }).eq("id", obra.id);
    cargarObras();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const precio = form.precio.trim() === "" ? 0 : Number(form.precio);
    const costo = Number(form.costo);
    const stock = Number(form.stock);

    if (!form.nombre.trim() || Number.isNaN(precio) || Number.isNaN(costo) || Number.isNaN(stock)) {
      setError("Revisá los campos: nombre, costo y stock son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      let foto_url: string | undefined;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("obras").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("obras").getPublicUrl(path);
        foto_url = publicUrl.publicUrl;
      }

      const payload = {
        nombre: form.nombre.trim(),
        tecnica: form.tecnica.trim() || null,
        medidas: form.medidas.trim() || null,
        enmarcado: form.enmarcado.trim() || null,
        serie: form.serie.trim() || null,
        precio,
        costo,
        stock,
        disponible: stock > 0,
        mostrar_precio: form.mostrar_precio,
        ...(foto_url ? { foto_url } : {}),
      };

      if (editingId) {
        const { error: updateError } = await supabase.from("obras").update(payload).eq("id", editingId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("obras").insert(payload);
        if (insertError) throw insertError;
      }

      resetForm();
      cargarObras();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la obra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Catálogo</h1>
      <p className="mt-1 text-sm text-ink/60">Cargá, editá o sacá de circulación las obras del sitio público.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-ink/10 bg-white p-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink/80">Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Foto {editingId && "(dejar vacío para no cambiar)"}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Serie</label>
          {!creandoSerie ? (
            <select
              value={form.serie}
              onChange={(e) => {
                if (e.target.value === "__nueva__") {
                  setForm({ ...form, serie: "" });
                  setCreandoSerie(true);
                } else {
                  setForm({ ...form, serie: e.target.value });
                }
              }}
              className="mt-1 w-full rounded border border-ink/20 bg-white px-3 py-2"
            >
              <option value="">Sin serie</option>
              {series.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="__nueva__">+ Crear nueva serie…</option>
            </select>
          ) : (
            <div className="mt-1 flex gap-2">
              <input
                autoFocus
                value={form.serie}
                onChange={(e) => setForm({ ...form, serie: e.target.value })}
                placeholder="Nombre de la nueva serie"
                className="w-full rounded border border-ink/20 px-3 py-2"
              />
              <button
                type="button"
                onClick={() => {
                  setCreandoSerie(false);
                  setForm({ ...form, serie: "" });
                }}
                className="shrink-0 rounded px-2 text-sm text-ink/50 hover:bg-ink/5"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Técnica</label>
          <input
            value={form.tecnica}
            onChange={(e) => setForm({ ...form, tecnica: e.target.value })}
            placeholder="Ej: Óleo sobre tela"
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Medidas</label>
          <input
            value={form.medidas}
            onChange={(e) => setForm({ ...form, medidas: e.target.value })}
            placeholder="Ej: 50 x 70 cm"
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Enmarcado</label>
          <input
            value={form.enmarcado}
            onChange={(e) => setForm({ ...form, enmarcado: e.target.value })}
            placeholder="Ej: Con marco de madera natural"
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Precio de venta (USD)</label>
          <input
            type="number"
            min="0"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            placeholder="Dejar vacío si el precio está oculto"
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Costo — materiales, etc. (ARS)</label>
          <input
            type="number"
            min="0"
            value={form.costo}
            onChange={(e) => setForm({ ...form, costo: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Stock (unidades disponibles)</label>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
            <input
              type="checkbox"
              checked={form.mostrar_precio}
              onChange={(e) => setForm({ ...form, mostrar_precio: e.target.checked })}
              className="h-4 w-4 rounded border-ink/30"
            />
            Mostrar el precio en el catálogo público
          </label>
          <p className="mt-1 text-xs text-ink/50">
            Si está destildado, en el sitio público aparece "Consultar precio" con un botón de WhatsApp en vez del monto.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-clay px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Agregar obra"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded px-4 py-2 font-medium text-ink/60 hover:bg-ink/5">
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {series.length > 0 && (
        <div className="mt-6 rounded-lg border border-ink/10 bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Series</h2>
          <ul className="mt-3 divide-y divide-ink/10">
            {series.map((s) => (
              <li key={s} className="flex flex-wrap items-center justify-between gap-2 py-2">
                {serieEditando === s ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      autoFocus
                      value={nombreSerieEditado}
                      onChange={(e) => setNombreSerieEditado(e.target.value)}
                      className="flex-1 rounded border border-ink/20 px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => renombrarSerie(s)}
                      className="rounded px-2 py-1 text-sm text-clay hover:bg-clay/10"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setSerieEditando(null)}
                      className="rounded px-2 py-1 text-sm text-ink/50 hover:bg-ink/5"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-ink/80">
                      {s} <span className="text-xs text-ink/40">({serieConteo(s)} obra{serieConteo(s) === 1 ? "" : "s"})</span>
                    </span>
                    <div className="flex gap-2 text-sm">
                      <button
                        onClick={() => {
                          setSerieEditando(s);
                          setNombreSerieEditado(s);
                        }}
                        className="rounded px-2 py-1 text-clay hover:bg-clay/10"
                      >
                        Renombrar
                      </button>
                      <button onClick={() => eliminarSerie(s)} className="rounded px-2 py-1 text-red-600 hover:bg-red-50">
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        {loading && <p className="text-ink/50">Cargando…</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obras.map((obra) => (
            <div key={obra.id} className="overflow-hidden rounded-lg border border-ink/10 bg-white">
              <div className="aspect-square bg-ink/5">
                {obra.foto_url && <img src={obra.foto_url} alt={obra.nombre} className="h-full w-full object-cover" />}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-ink">{obra.nombre}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${obra.disponible ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/50"}`}>
                    {obra.disponible ? "Publicada" : "Oculta"}
                  </span>
                </div>
                {obra.serie && <p className="mt-0.5 text-xs uppercase tracking-wide text-clay/80">{obra.serie}</p>}
                <p className="mt-1 text-sm text-ink/60">
                  {obra.mostrar_precio ? moneyUSD.format(obra.precio) : "Precio oculto (consultar)"} · costo{" "}
                  {moneyARS.format(obra.costo)} · Stock {obra.stock}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <button onClick={() => editar(obra)} className="rounded px-2 py-1 text-clay hover:bg-clay/10">
                    Editar
                  </button>
                  <button onClick={() => toggleDisponible(obra)} className="rounded px-2 py-1 text-ink/60 hover:bg-ink/5">
                    {obra.disponible ? "Ocultar" : "Publicar"}
                  </button>
                  <button onClick={() => eliminar(obra)} className="rounded px-2 py-1 text-red-600 hover:bg-red-50">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
