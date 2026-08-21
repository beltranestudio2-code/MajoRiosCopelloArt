import { NavLink, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm font-medium ${isActive ? "bg-navy text-white" : "text-ink/70 hover:bg-ink/5"}`;

export default function PrivateLayout() {
  return (
    <div className="min-h-screen bg-paper">
      <nav className="flex items-center justify-between border-b border-ink/10 bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold text-ink">Majo Rioscopello — Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/admin" end className={linkClass}>
            Catálogo
          </NavLink>
          <NavLink to="/gestion" className={linkClass}>
            Gestión
          </NavLink>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
          >
            Ver sitio público ↗
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            className="ml-2 rounded px-3 py-2 text-sm font-medium text-ink/50 hover:bg-ink/5"
          >
            Salir
          </button>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
