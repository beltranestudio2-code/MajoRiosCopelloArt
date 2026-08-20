import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { moneyUSD } from "../lib/format";
import { whatsappConsultaLink } from "../lib/whatsapp";
import type { Obra } from "../lib/types";

export default function ObraDetalle() {
  const { id } = useParams<{ id: string }>();
  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("obras")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setObra(data ?? null);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 px-6 py-8 text-center">
        <Link to="/" className="font-brand text-2xl font-light uppercase tracking-[0.15em] text-ink sm:text-3xl">
          MAJO RIOS COPELLO
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="text-sm text-ink/50 transition hover:text-clay">
          ‹ Volver al catálogo
        </Link>

        {loading && <p className="mt-8 text-center text-ink/50">Cargando…</p>}

        {!loading && !obra && (
          <p className="mt-8 text-center text-ink/50">No encontramos esta obra.</p>
        )}

        {!loading && obra && (
          <article className="mt-6">
            <div className="aspect-square overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
              {obra.foto_url ? (
                <img src={obra.foto_url} alt={obra.nombre} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink/30">Sin foto</div>
              )}
            </div>

            <div className="mt-6">
              <h1 className="font-display text-3xl font-semibold text-ink">{obra.nombre}</h1>
              {obra.descripcion && <p className="mt-2 text-ink/60">{obra.descripcion}</p>}

              <p className="mt-4 text-xl font-medium text-clay">
                {obra.mostrar_precio ? moneyUSD.format(obra.precio) : "Precio a consultar"}
              </p>

              <a
                href={whatsappConsultaLink(obra.nombre)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded bg-clay px-6 py-3 font-medium text-white transition hover:opacity-90"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.19c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.13.08-1.83-.11-.42-.12-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99s.75-2.12 1.02-2.41c.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.14.48.22.55.34.07.12.07.7-.17 1.38z" />
                </svg>
                Consultar precio
              </a>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
