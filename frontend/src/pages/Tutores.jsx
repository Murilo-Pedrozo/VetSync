import { useEffect, useState } from "react";
import Campo from "../components/Campo.jsx";
import Paginacao from "../components/Paginacao.jsx";
import { useAviso } from "../components/useAviso.jsx";
import { api } from "../services/api";
import { lerErros } from "../services/erros";

const VAZIO = { id: null, nome: "", cpf: "", telefone: "", email: "", endereco: "" };
const SEM_ERROS = { geral: "", campos: {} };

export default function Tutores() {
  const [dados, setDados] = useState({ count: 0, results: [] });
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(false);
  const [recarregar, setRecarregar] = useState(0);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState(SEM_ERROS);
  const [salvando, setSalvando] = useState(false);
  const [aviso, mostrarAviso] = useAviso();

  useEffect(() => {
    let ativo = true;
    const espera = setTimeout(() => {
      setCarregando(true);
      api.get("/tutores/", { params: { page: pagina, search: busca || undefined } })
        .then(({ data }) => {
          if (!ativo) return;
          setDados(data);
          setFalha(false);
        })
        .catch((e) => {
          if (!ativo) return;
          if (e.response?.status === 404 && pagina > 1) setPagina(1);
          else setFalha(true);
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });
    }, 250);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [pagina, busca, recarregar]);

  const preencher = (nome) => (e) => setForm({ ...form, [nome]: e.target.value });

  function editar(t) {
    setForm({ id: t.id, nome: t.nome, cpf: t.cpf, telefone: t.telefone, email: t.email, endereco: t.endereco });
    setErros(SEM_ERROS);
  }

  function limpar() {
    setForm(VAZIO);
    setErros(SEM_ERROS);
  }

  async function salvar(evento) {
    evento.preventDefault();
    const campos = {};
    if (!form.nome.trim()) campos.nome = "Informe o nome.";
    if (!form.telefone.trim()) campos.telefone = "Informe o telefone.";
    if (form.cpf && form.cpf.length !== 11) campos.cpf = "O CPF deve ter 11 números.";
    if (Object.keys(campos).length) {
      setErros({ geral: "", campos });
      return;
    }
    setErros(SEM_ERROS);
    setSalvando(true);
    const { id, ...corpo } = form;
    try {
      if (id) await api.put(`/tutores/${id}/`, corpo);
      else await api.post("/tutores/", corpo);
      mostrarAviso(id ? "Tutor atualizado." : "Tutor cadastrado.");
      limpar();
      setRecarregar((n) => n + 1);
    } catch (falhaEnvio) {
      setErros(lerErros(falhaEnvio));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(tutor) {
    if (!window.confirm(`Excluir o tutor ${tutor.nome}?`)) return;
    try {
      await api.delete(`/tutores/${tutor.id}/`);
      mostrarAviso("Tutor excluído.");
      if (form.id === tutor.id) limpar();
      setRecarregar((n) => n + 1);
    } catch (e) {
      mostrarAviso(e.response?.data?.detail ?? "Não foi possível excluir.", true);
    }
  }

  const c = erros.campos;
  return (
    <div className="grid">
      <div className="panel">
        <div className="head-row"><h2>Tutores cadastrados</h2></div>
        <input
          className="search" type="search" placeholder="Buscar por nome, telefone ou CPF"
          aria-label="Buscar tutor" value={busca}
          onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
        />
        {falha && <div className="alert alert-error">Não foi possível carregar os tutores.</div>}
        {!falha && !carregando && dados.results.length === 0 && (
          <p className="vazio">{busca ? "Nenhum tutor encontrado." : "Nenhum tutor cadastrado. Use o formulário ao lado."}</p>
        )}
        {dados.results.length > 0 && (
          <table className="table" style={{ opacity: carregando ? 0.6 : 1 }}>
            <thead><tr><th>Nome</th><th>Contato</th><th>Animais</th><th></th></tr></thead>
            <tbody>
              {dados.results.map((t) => (
                <tr key={t.id}>
                  <td>{t.nome}<small>{t.endereco}</small></td>
                  <td>{t.telefone}<small>{t.email}</small></td>
                  <td>{t.total_animais}</td>
                  <td className="r">
                    <button className="btn btn-ghost btn-sm" onClick={() => editar(t)}>Editar</button>{" "}
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => excluir(t)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Paginacao pagina={pagina} total={dados.count} onMudar={setPagina} />
      </div>

      <form className="panel" onSubmit={salvar} noValidate>
        <h2>{form.id ? "Editar tutor" : "Novo tutor"}</h2>
        <Campo rotulo="Nome completo *" id="t-nome" erro={c.nome}>
          <input id="t-nome" className={c.nome ? "invalid" : ""} value={form.nome} onChange={preencher("nome")} />
        </Campo>
        <Campo rotulo="CPF (opcional)" id="t-cpf" erro={c.cpf}>
          <input id="t-cpf" className={c.cpf ? "invalid" : ""} inputMode="numeric" placeholder="Somente números" value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
        </Campo>
        <Campo rotulo="Telefone *" id="t-tel" erro={c.telefone}>
          <input id="t-tel" className={c.telefone ? "invalid" : ""} inputMode="tel" placeholder="(19) 99999-0000" value={form.telefone} onChange={preencher("telefone")} />
        </Campo>
        <Campo rotulo="E-mail" id="t-email" erro={c.email}>
          <input id="t-email" className={c.email ? "invalid" : ""} type="email" value={form.email} onChange={preencher("email")} />
        </Campo>
        <Campo rotulo="Endereço" id="t-end" erro={c.endereco}>
          <input id="t-end" value={form.endereco} onChange={preencher("endereco")} />
        </Campo>
        {erros.geral && <div className="alert alert-error" role="alert">{erros.geral}</div>}
        <div className="form-actions">
          {form.id && <button type="button" className="btn btn-ghost" onClick={limpar}>Cancelar edição</button>}
          <button className="btn btn-primary" type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : form.id ? "Salvar alterações" : "Salvar tutor"}
          </button>
        </div>
      </form>
      {aviso}
    </div>
  );
}
