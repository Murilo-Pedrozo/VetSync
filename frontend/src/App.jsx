import { Navigate, Route, Routes } from "react-router-dom";
import RotaProtegida from "./auth/RotaProtegida.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Painel from "./pages/Painel.jsx";
import PaginaEmBreve from "./pages/PaginaEmBreve.jsx";
import Welcome from "./pages/Welcome.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/bem-vindo" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<Painel />} />
          <Route path="tutores" element={<PaginaEmBreve titulo="Tutores" />} />
          <Route path="animais" element={<PaginaEmBreve titulo="Animais" />} />
          <Route path="atendimentos" element={<PaginaEmBreve titulo="Atendimentos" />} />
          <Route path="vacinacao" element={<PaginaEmBreve titulo="Vacinação" />} />
          <Route path="historico" element={<PaginaEmBreve titulo="Histórico clínico" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
