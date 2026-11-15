import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function RotaProtegida() {
  const { token } = useAuth();
  const local = useLocation();

  if (!token) {
    const jaViuBoasVindas = sessionStorage.getItem("vetsync_boas_vindas");
    return <Navigate to={jaViuBoasVindas ? "/login" : "/bem-vindo"} state={{ de: local }} replace />;
  }
  return <Outlet />;
}
