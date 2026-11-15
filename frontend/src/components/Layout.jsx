import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const ABAS = [
  ["/", "Hoje"],
  ["/tutores", "Tutores"],
  ["/animais", "Animais"],
  ["/atendimentos", "Atendimentos"],
  ["/vacinacao", "Vacinação"],
  ["/historico", "Histórico"],
];

export default function Layout() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();

  const nome = [usuario?.first_name, usuario?.last_name].filter(Boolean).join(" ") || usuario?.username;
  const aba = ABAS.find(([caminho]) => caminho === pathname);
  const titulo = pathname === "/" ? usuario?.organizacao || "VetSync" : aba ? aba[1] : "VetSync";
  const data = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  async function aoSair() {
    await sair();
    navegar("/login", { replace: true });
  }

  return (
    <div className="app">
      <header className="pasta">
        <div className="brand">VetSync</div>
        <nav className="abas" aria-label="Navegação principal">
          {ABAS.map(([caminho, rotulo]) => (
            <NavLink
              key={caminho}
              to={caminho}
              end={caminho === "/"}
              className={({ isActive }) => "nav-item" + (isActive ? " is-active" : "")}
            >
              {rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="usuario">
          <span>{nome}</span>
          <button className="link" onClick={aoSair}>Sair</button>
        </div>
      </header>
      <div className="main">
        <header className="topbar">
          <h1>{titulo}</h1>
          <time>{data}</time>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
