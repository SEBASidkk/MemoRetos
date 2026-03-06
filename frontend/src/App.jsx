import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import Estadisticas from "./pages/Estadisticas";
import Memoretos from "./pages/Memoretos";
import MemoEditor from "./pages/MemoEditor";
import Grupos from "./pages/Grupos";
import GrupoDetalle from "./pages/GrupoDetalle";
import NuevoGrupo from "./pages/NuevoGrupo";
import Configuracion from "./pages/Configuracion";
import "./App.css";

function Protected({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="page-center"><p>Cargando...</p></div>;
  return token ? children : <Navigate to="/" />;
}

function AppRoutes() {
  const { token, loading } = useAuth();
  if (loading) return <div className="page-center"><p>Cargando...</p></div>;

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<Protected><Menu /></Protected>} />
      <Route path="/estadisticas" element={<Protected><Estadisticas /></Protected>} />
      <Route path="/memoretos" element={<Protected><Memoretos /></Protected>} />
      <Route path="/memoretos/nuevo" element={<Protected><MemoEditor /></Protected>} />
      <Route path="/memoretos/editar/:id" element={<Protected><MemoEditor /></Protected>} />
      <Route path="/grupos" element={<Protected><Grupos /></Protected>} />
      <Route path="/grupos/nuevo" element={<Protected><NuevoGrupo /></Protected>} />
      <Route path="/grupos/:id" element={<Protected><GrupoDetalle /></Protected>} />
      <Route path="/configuracion" element={<Protected><Configuracion /></Protected>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
