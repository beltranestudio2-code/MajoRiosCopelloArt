import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { moneyARS, moneyUSD } from "../lib/format";
import type { Obra } from "../lib/types";

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  costo: "",
  stock: "1",
};

export default function AdminCatalogo() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
  }

  function editar(obra: Obra) {
    setEditingId(obra.id);
    setForm({
      nombre: obra.nombre,
      descripcion: obra.descripcion ?? "",
      precio: String(obra.precio),
      costo: String(obra.costo),
      stock: String(obra.stock),
    });
    setFile(null);
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

    const precio = Number(form.precio);
    const costo = Number(form.costo);
    const stock = Number(form.stock);

    if (!form.nombre.trim() || Number.isNaN(precio) || Number.isNaN(costo) || Number.isNaN(stock)) {
      setError("Revisá los campos: nombre, precio, costo y stock son obligatorios.");
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
        descripcion: form.descripcion.trim() || null,
        precio,
        costo,
        stock,
        disponible: stock > 0,
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
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink/80">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Precio de venta (USD)</label>
          <input
            type="number"
            min="0"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
            required
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
                <p className="mt-1 text-sm text-ink/60">
                  {moneyUSD.format(obra.precio)} · costo {moneyARS.format(obra.costo)} · Stock {obra.stock}
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
