import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { moneyUSD } from "../lib/format";
import type { Obra } from "../lib/types";

export default function Catalogo() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 px-6 py-10 text-center">
        <h1 className="font-brand text-4xl font-light uppercase tracking-[0.15em] text-ink sm:text-5xl">
          MAJO RIOS COPELLO
        </h1>
        <p className="mt-3 text-ink/60">Obras originales</p>
        <a
          href="https://instagram.com/majorioscopello_art"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram de Majo Rioscopello"
          className="mt-4 inline-flex text-ink/70 transition hover:text-clay"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {loading && <p className="text-center text-ink/50">Cargando obras…</p>}

        {!loading && obras.length === 0 && (
          <p className="text-center text-ink/50">Todavía no hay obras publicadas. ¡Volvé pronto!</p>
        )}

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {obras.map((obra) => (
            <article key={obra.id} className="group overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
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
                <h2 className="font-display text-xl font-semibold text-ink">{obra.nombre}</h2>
                {obra.descripcion && <p className="mt-1 text-sm text-ink/60">{obra.descripcion}</p>}
                <p className="mt-3 text-lg font-medium text-clay">{moneyUSD.format(obra.precio)}</p>
              </div>
            </article>
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
