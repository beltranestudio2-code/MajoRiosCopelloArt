import { Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./lib/auth";
import PrivateLayout from "./components/PrivateLayout";
import Catalogo from "./pages/Catalogo";
import Login from "./pages/Login";
import AdminCatalogo from "./pages/AdminCatalogo";
import Gestion from "./pages/Gestion";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <PrivateLayout />
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<AdminCatalogo />} />
          <Route path="/gestion" element={<Gestion />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
