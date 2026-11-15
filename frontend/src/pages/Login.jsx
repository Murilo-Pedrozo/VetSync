import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Login() {
  const { token, entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (token) return <Navigate to="/" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro("Informe usuário e senha para entrar.");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      await entrar(usuario.trim(), senha);
      navegar(local.state?.de?.pathname ?? "/", { replace: true });
    } catch (falha) {
      if (!falha.response) setErro("Não foi possível conectar ao servidor.");
      else setErro(falha.response.data?.detail ?? "Usuário ou senha inválidos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <div className="login-art">
        <h1>VetSync</h1>
        <p>Prontuário e carteira de vacinação dos animais, num só lugar.</p>
      </div>
      <form className="login-form" onSubmit={enviar} noValidate>
        <h2>Entrar</h2>
        <p>Use a conta da sua clínica.</p>
        <label htmlFor="usuario">Usuário
          <input id="usuario" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </label>
        <label htmlFor="senha">Senha
          <input id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        {erro && <div className="alert alert-error" role="alert">{erro}</div>}
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
