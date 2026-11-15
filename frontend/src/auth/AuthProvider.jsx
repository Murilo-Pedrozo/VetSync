import { useState } from "react";
import { api } from "../services/api";
import { lerToken, lerUsuario, limparSessao, salvarSessao } from "../services/sessao";
import { AuthContext } from "./contexto";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(lerToken);
  const [usuario, setUsuario] = useState(lerUsuario);

  async function entrar(username, password) {
    const { data } = await api.post("/auth/login/", { username, password });
    salvarSessao(data.token, data.usuario);
    setToken(data.token);
    setUsuario(data.usuario);
  }

  async function sair() {
    try {
      await api.post("/auth/logout/");
    } catch {
      // token já inválido no servidor: segue com o logout local
    }
    limparSessao();
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ token, usuario, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}
