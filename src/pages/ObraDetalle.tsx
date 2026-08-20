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
  const [zoomOpen, setZoomOpen] = useState(false);
  const [fotoIndice, setFotoIndice] = useState(0);

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
        setFotoIndice(0);
        setLoading(false);
      });
  }, [id]);

  const fotos = obra ? [obra.foto_url, obra.foto_url_2, obra.foto_url_3].filter((f): f is string => !!f) : [];
  const fotoActual = fotos[fotoIndice];

  function fotoAnterior() {
    setFotoIndice((i) => (i - 1 + fotos.length) % fotos.length);
  }

  function fotoSiguiente() {
    setFotoIndice((i) => (i + 1) % fotos.length);
  }

  useEffect(() => {
    if (!zoomOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomOpen]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 px-6 py-8 text-center">
        <Link to="/" className="font-brand text-2xl font-light uppercase tracking-[0.15em] text-ink sm:text-3xl">
          MAJO RIOS COPELLO
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <Link to="/" className="text-sm text-ink/50 transition hover:text-clay">
          ‹ Volver al catálogo
        </Link>

        {loading && <p className="mt-8 text-center text-ink/50">Cargando…</p>}

        {!loading && !obra && (
          <p className="mt-8 text-center text-ink/50">No encontramos esta obra.</p>
        )}

        {!loading && obra && (
          <article className="mt-8 sm:mt-12">
            <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
              {obra.nombre}
            </h1>

            <div className="relative mt-6 overflow-hidden rounded-lg bg-ink/5">
              {fotoActual ? (
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  aria-label="Ampliar imagen"
                  className="block w-full cursor-zoom-in"
                >
                  <img
                    src={fotoActual}
                    alt={obra.nombre}
                    className="mx-auto max-h-[70vh] w-full object-contain"
                  />
                </button>
              ) : (
                <div className="flex aspect-square items-center justify-center text-ink/30">Sin foto</div>
              )}

              {fotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={fotoAnterior}
                    aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow transition hover:bg-white"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={fotoSiguiente}
                    aria-label="Foto siguiente"
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow transition hover:bg-white"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {fotos.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${i === fotoIndice ? "bg-clay" : "bg-white/80"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 space-y-3 text-ink/70">
              <div className="flex items-center justify-between gap-3">
                <span>
                  {obra.serie && (
                    <>
                      <span className="font-medium text-ink">Serie:</span> {obra.serie}
                    </>
                  )}
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    obra.vendido ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {obra.vendido ? "Vendido" : "Disponible"}
                </span>
              </div>
              {obra.tecnica && (
                <p>
                  <span className="font-medium text-ink">Técnica:</span> {obra.tecnica}
                </p>
              )}
              {obra.medidas && (
                <p>
                  <span className="font-medium text-ink">Medidas:</span> {obra.medidas}
                </p>
              )}
              {obra.enmarcado && (
                <p>
                  <span className="font-medium text-ink">Enmarcado:</span> {obra.enmarcado}
                </p>
              )}
              {obra.mostrar_precio && (
                <p className="text-xl font-medium text-clay">{moneyUSD.format(obra.precio)}</p>
              )}
            </div>

            <a
              href={whatsappConsultaLink(obra.nombre, window.location.href)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-clay px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.19c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.13.08-1.83-.11-.42-.12-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99s.75-2.12 1.02-2.41c.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.14.48.22.55.34.07.12.07.7-.17 1.38z" />
              </svg>
              Consultar precio
            </a>
          </article>
        )}
      </main>

      {zoomOpen && obra && fotoActual && (
        <div
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-ink/90 p-4"
          onClick={() => setZoomOpen(false)}
        >
          <img src={fotoActual} alt={obra.nombre} className="max-h-full max-w-full object-contain" />
          {fotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fotoAnterior();
                }}
                aria-label="Foto anterior"
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-2xl text-white transition hover:bg-white/30"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fotoSiguiente();
                }}
                aria-label="Foto siguiente"
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-2xl text-white transition hover:bg-white/30"
              >
                ›
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 text-3xl leading-none text-white/80 transition hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
