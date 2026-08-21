import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  vendido: false,
};

export default function AdminCatalogo() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [file3, setFile3] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewFile2, setPreviewFile2] = useState<string | null>(null);
  const [previewFile3, setPreviewFile3] = useState<string | null>(null);
  const [fotoActual2, setFotoActual2] = useState<string | null>(null);
  const [fotoActual3, setFotoActual3] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creandoSerie, setCreandoSerie] = useState(false);
  const [serieEditando, setSerieEditando] = useState<string | null>(null);
  const [nombreSerieEditado, setNombreSerieEditado] = useState("");
  const [filtroPublicado, setFiltroPublicado] = useState<"todas" | "publicadas" | "no_publicadas">("todas");

  const series = Array.from(new Set(obras.map((o) => o.serie).filter((s): s is string => !!s))).sort();
  const serieConteo = (nombre: string) => obras.filter((o) => o.serie === nombre).length;

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

  function elegirArchivo(
    f: File | null,
    setFileFn: (f: File | null) => void,
    setPreviewFn: (updater: (prev: string | null) => string | null) => void
  ) {
    setFileFn(f);
    setPreviewFn((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setFile(null);
    setFile2(null);
    setFile3(null);
    setPreviewFile((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewFile2((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewFile3((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFotoActual2(null);
    setFotoActual3(null);
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
      vendido: obra.vendido,
    });
    setFile(null);
    setFile2(null);
    setFile3(null);
    setPreviewFile((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewFile2((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewFile3((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFotoActual2(obra.foto_url_2);
    setFotoActual3(obra.foto_url_3);
    setCreandoSerie(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function quitarFotoExtra(campo: "foto_url_2" | "foto_url_3") {
    if (!editingId) return;
    if (!confirm("¿Quitar esta foto de la obra?")) return;
    await supabase.from("obras").update({ [campo]: null }).eq("id", editingId);
    if (campo === "foto_url_2") setFotoActual2(null);
    else setFotoActual3(null);
    cargarObras();
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

  async function toggleVendido(obra: Obra) {
    await supabase.from("obras").update({ vendido: !obra.vendido }).eq("id", obra.id);
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
      async function subirFoto(archivo: File) {
        const ext = archivo.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("obras").upload(path, archivo);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("obras").getPublicUrl(path);
        return publicUrl.publicUrl;
      }

      const foto_url = file ? await subirFoto(file) : undefined;
      const foto_url_2 = file2 ? await subirFoto(file2) : undefined;
      const foto_url_3 = file3 ? await subirFoto(file3) : undefined;

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
        vendido: form.vendido,
        ...(foto_url ? { foto_url } : {}),
        ...(foto_url_2 ? { foto_url_2 } : {}),
        ...(foto_url_3 ? { foto_url_3 } : {}),
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
          <label className="block text-sm font-medium text-ink/80">Foto principal {editingId && "(dejar vacío para no cambiar)"}</label>
          {previewFile && (
            <img src={previewFile} alt="Foto principal a subir" className="mt-1 h-12 w-12 rounded object-cover" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null, setFile, setPreviewFile)}
            className="mt-1 w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Foto 2 (opcional)</label>
          {previewFile2 ? (
            <div className="mt-1 flex items-center gap-2">
              <img src={previewFile2} alt="Foto 2 a subir" className="h-12 w-12 rounded object-cover" />
              <button
                type="button"
                onClick={() => elegirArchivo(null, setFile2, setPreviewFile2)}
                className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Quitar
              </button>
            </div>
          ) : (
            fotoActual2 && (
              <div className="mt-1 flex items-center gap-2">
                <img src={fotoActual2} alt="Foto 2 actual" className="h-12 w-12 rounded object-cover" />
                <button
                  type="button"
                  onClick={() => quitarFotoExtra("foto_url_2")}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Quitar
                </button>
              </div>
            )
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null, setFile2, setPreviewFile2)}
            className="mt-1 w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Foto 3 (opcional)</label>
          {previewFile3 ? (
            <div className="mt-1 flex items-center gap-2">
              <img src={previewFile3} alt="Foto 3 a subir" className="h-12 w-12 rounded object-cover" />
              <button
                type="button"
                onClick={() => elegirArchivo(null, setFile3, setPreviewFile3)}
                className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Quitar
              </button>
            </div>
          ) : (
            fotoActual3 && (
              <div className="mt-1 flex items-center gap-2">
                <img src={fotoActual3} alt="Foto 3 actual" className="h-12 w-12 rounded object-cover" />
                <button
                  type="button"
                  onClick={() => quitarFotoExtra("foto_url_3")}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Quitar
                </button>
              </div>
            )
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null, setFile3, setPreviewFile3)}
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
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
            <input
              type="checkbox"
              checked={form.vendido}
              onChange={(e) => setForm({ ...form, vendido: e.target.checked })}
              className="h-4 w-4 rounded border-ink/30"
            />
            Vendido
          </label>
          <p className="mt-1 text-xs text-ink/50">
            La obra sigue viéndose en el catálogo público, pero con una etiqueta roja "Vendido" en vez de verde "Disponible".
          </p>
        </div>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-navy px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
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
                      className="rounded px-2 py-1 text-sm text-navy hover:bg-navy/10"
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
                        className="rounded px-2 py-1 text-navy hover:bg-navy/10"
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/50">
            Orden: primero publicadas, después por serie, y dentro de cada serie primero las que ya tienen foto.
          </p>
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
        {loading && <p className="mt-3 text-ink/50">Cargando…</p>}
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obrasOrdenadas.map((obra) => (
            <div key={obra.id} className="overflow-hidden rounded-lg border border-ink/10 bg-white">
              <div className="aspect-square bg-ink/5">
                {obra.foto_url && <img src={obra.foto_url} alt={obra.nombre} className="h-full w-full object-cover" />}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">{obra.nombre}</h3>
                  <div className="flex shrink-0 gap-1">
                    {obra.vendido && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Vendido</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${obra.disponible ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/50"}`}>
                      {obra.disponible ? "Publicada" : "Oculta"}
                    </span>
                  </div>
                </div>
                {obra.serie && <p className="mt-0.5 text-xs uppercase tracking-wide text-navy/80">{obra.serie}</p>}
                <p className="mt-1 text-sm text-ink/60">
                  {obra.mostrar_precio ? moneyUSD.format(obra.precio) : "Precio oculto (consultar)"} · costo{" "}
                  {moneyARS.format(obra.costo)} · Stock {obra.stock}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <button onClick={() => editar(obra)} className="rounded px-2 py-1 text-navy hover:bg-navy/10">
                    Editar
                  </button>
                  <button onClick={() => toggleDisponible(obra)} className="rounded px-2 py-1 text-ink/60 hover:bg-ink/5">
                    {obra.disponible ? "Ocultar" : "Publicar"}
                  </button>
                  <button onClick={() => toggleVendido(obra)} className="rounded px-2 py-1 text-ink/60 hover:bg-ink/5">
                    {obra.vendido ? "Marcar disponible" : "Marcar vendido"}
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
