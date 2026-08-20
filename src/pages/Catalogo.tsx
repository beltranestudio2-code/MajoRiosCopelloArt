import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { moneyUSD } from "../lib/format";
import type { Obra } from "../lib/types";

export default function Catalogo() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [serieActiva, setSerieActiva] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("obras")
      .select("*")
      .eq("disponible", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setObras(data ?? []);
        setLoading(false);
      });
  }, []);

  const series = useMemo(
    () => Array.from(new Set(obras.map((o) => o.serie).filter((s): s is string => !!s))).sort(),
    [obras]
  );

  const obrasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return obras.filter((obra) => {
      const coincideSerie = !serieActiva || obra.serie === serieActiva;
      const coincideTexto =
        !texto ||
        obra.nombre.toLowerCase().includes(texto) ||
        (obra.tecnica?.toLowerCase().includes(texto) ?? false) ||
        (obra.serie?.toLowerCase().includes(texto) ?? false);
      return coincideSerie && coincideTexto;
    });
  }, [obras, busqueda, serieActiva]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 px-6 py-10 text-center">
        <h1 className="font-brand whitespace-nowrap text-lg font-light uppercase tracking-[0.04em] text-ink sm:text-4xl sm:tracking-[0.15em] md:text-5xl">
          MAJO RIOS COPELLO
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-ink/60">
          "En un mundo donde todo se genera con inteligencia artificial, crear con las manos es un acto de rebeldía."
        </p>
        <a
          href="https://instagram.com/majorioscopello_art"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-ink/70 transition hover:text-clay"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
          <span className="text-sm">@majorioscopello_art</span>
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {loading && <p className="text-center text-ink/50">Cargando obras…</p>}

        {!loading && obras.length === 0 && (
          <p className="text-center text-ink/50">Todavía no hay obras publicadas. ¡Volvé pronto!</p>
        )}

        {!loading && obras.length > 0 && (
          <div className="mb-10 flex flex-col items-center gap-4">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              type="search"
              placeholder="Buscar una obra…"
              className="w-full max-w-sm rounded border border-ink/20 bg-white px-4 py-2 text-ink placeholder:text-ink/40"
            />
            {series.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setSerieActiva(null)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    serieActiva === null
                      ? "border-clay bg-clay text-white"
                      : "border-ink/20 text-ink/60 hover:border-clay/50 hover:text-clay"
                  }`}
                >
                  Todas
                </button>
                {series.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSerieActiva(s)}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      serieActiva === s
                        ? "border-clay bg-clay text-white"
                        : "border-ink/20 text-ink/60 hover:border-clay/50 hover:text-clay"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && obras.length > 0 && obrasFiltradas.length === 0 && (
          <p className="text-center text-ink/50">No encontramos obras que coincidan con la búsqueda.</p>
        )}

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {obrasFiltradas.map((obra) => (
            <Link
              key={obra.id}
              to={`/obra/${obra.id}`}
              className="group overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm"
            >
              <div className="aspect-square overflow-hidden bg-ink/5">
                {obra.foto_url ? (
                  <img
                    src={obra.foto_url}
                    alt={obra.nombre}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink/30">Sin foto</div>
                )}
              </div>
              <div className="p-4">
                {obra.serie && (
                  <p className="text-xs uppercase tracking-wide text-clay/80">{obra.serie}</p>
                )}
                <h2 className="font-display text-xl font-semibold text-ink">{obra.nombre}</h2>
                {(obra.tecnica || obra.medidas) && (
                  <p className="mt-1 text-sm text-ink/60">{[obra.tecnica, obra.medidas].filter(Boolean).join(" · ")}</p>
                )}
                <p className="mt-3 text-lg font-medium text-clay">
                  {obra.mostrar_precio ? moneyUSD.format(obra.precio) : "Consultar precio"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-ink/10 px-6 py-6 text-center text-xs text-ink/40">
        <Link to="/login" className="hover:text-ink/60">
          Acceso privado
        </Link>
      </footer>
    </div>
  );
}
