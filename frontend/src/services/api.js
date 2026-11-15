import axios from "axios";
import { lerToken, limparSessao } from "./sessao";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Envia o token em toda requisição.
api.interceptors.request.use((config) => {
  const token = lerToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Token inválido ou expirado: limpa a sessão e volta ao login.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const url = erro.config?.url ?? "";
    if (erro.response?.status === 401 && !url.includes("/auth/login")) {
      limparSessao();
      window.location.assign("/login");
    }
    return Promise.reject(erro);
  }
);
