import { useEffect, useState } from "react";
import Campo from "../components/Campo.jsx";
import Paginacao from "../components/Paginacao.jsx";
import SituacaoVacinal from "../components/SituacaoVacinal.jsx";
import { useAviso } from "../components/useAviso.jsx";
import { api } from "../services/api";
import { lerErros } from "../services/erros";

const VAZIO = {
  id: null, nome: "", especie: "", sexo: "", raca: "", data_nascimento: "",
  idade_estimada: "", peso_kg: "", tutor: "", tutorNome: "", observacoes: "",
};
const SEM_ERROS = { geral: "", campos: {} };

export default function Animais() {
  const [dados, setDados] = useState({ count: 0, results: [] });
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(false);
  const [recarregar, setRecarregar] = useState(0);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState(SEM_ERROS);
  const [salvando, setSalvando] = useState(false);
  const [buscaTutor, setBuscaTutor] = useState("");
  const [opcoes, setOpcoes] = useState([]);
  const [aviso, mostrarAviso] = useAviso();

  useEffect(() => {
    let ativo = true;
    const espera = setTimeout(() => {
      setCarregando(true);
      api.get("/animais/", { params: { page: pagina, search: busca || undefined } })
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

  // Tutores para o campo de seleção (busca pelo nome).
  useEffect(() => {
    let ativo = true;
    const espera = setTimeout(() => {
      api.get("/tutores/", { params: { search: buscaTutor || undefined } })
        .then(({ data }) => {
          if (ativo) setOpcoes(data.results.map((t) => ({ id: String(t.id), nome: t.nome })));
        })
        .catch(() => setOpcoes([]));
    }, 250);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [buscaTutor]);

  const preencher = (nome) => (e) => setForm({ ...form, [nome]: e.target.value });

  function editar(a) {
    setForm({
      id: a.id, nome: a.nome, especie: a.especie, sexo: a.sexo, raca: a.raca,
      data_nascimento: a.data_nascimento ?? "", idade_estimada: a.idade_estimada,
      peso_kg: a.peso_kg ?? "", tutor: String(a.tutor), tutorNome: a.tutor_nome,
      observacoes: a.observacoes,
    });
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
    if (!form.especie) campos.especie = "Escolha a espécie.";
    if (!form.sexo) campos.sexo = "Escolha o sexo.";
    if (!form.tutor) campos.tutor = "Escolha o tutor.";
    if (!form.data_nascimento && !form.idade_estimada.trim()) {
      campos.idade_estimada = "Informe a data de nascimento ou a idade estimada.";
    }
    if (form.peso_kg !== "" && Number(form.peso_kg) <= 0) campos.peso_kg = "O peso deve ser maior que zero.";
    if (Object.keys(campos).length) {
      setErros({ geral: "", campos });
      return;
    }
    setErros(SEM_ERROS);
    setSalvando(true);
    const corpo = {
      nome: form.nome.trim(), especie: form.especie, sexo: form.sexo, raca: form.raca,
      data_nascimento: form.data_nascimento || null, idade_estimada: form.idade_estimada,
      peso_kg: form.peso_kg === "" ? null : form.peso_kg, tutor: Number(form.tutor),
      observacoes: form.observacoes,
    };
    try {
      if (form.id) await api.put(`/animais/${form.id}/`, corpo);
      else await api.post("/animais/", corpo);
      mostrarAviso(form.id ? "Animal atualizado." : "Animal cadastrado.");
      limpar();
      setRecarregar((n) => n + 1);
    } catch (falhaEnvio) {
      setErros(lerErros(falhaEnvio));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(animal) {
    if (!window.confirm(`Excluir o animal ${animal.nome}?`)) return;
    try {
      await api.delete(`/animais/${animal.id}/`);
      mostrarAviso("Animal excluído.");
      if (form.id === animal.id) limpar();
      setRecarregar((n) => n + 1);
    } catch (e) {
      mostrarAviso(e.response?.data?.detail ?? "Não foi possível excluir.", true);
    }
  }

  const c = erros.campos;
  const listaTutores =
    form.tutor && !opcoes.some((o) => o.id === form.tutor)
      ? [{ id: form.tutor, nome: form.tutorNome }, ...opcoes]
      : opcoes;

  return (
    <div className="grid">
      <div className="panel">
        <div className="head-row"><h2>Animais cadastrados</h2></div>
        <input
          className="search" type="search" placeholder="Buscar por animal, raça ou tutor"
          aria-label="Buscar animal" value={busca}
          onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
        />
        {falha && <div className="alert alert-error">Não foi possível carregar os animais.</div>}
        {!falha && !carregando && dados.results.length === 0 && (
          <p className="vazio">{busca ? "Nenhum animal encontrado." : "Nenhum animal cadastrado. Use o formulário ao lado."}</p>
        )}
        {dados.results.length > 0 && (
          <table className="table" style={{ opacity: carregando ? 0.6 : 1 }}>
            <thead><tr><th>Animal</th><th>Tutor</th><th>Vacinas</th><th></th></tr></thead>
            <tbody>
              {dados.results.map((a) => (
                <tr key={a.id}>
                  <td>{a.nome}<small>{a.especie}{a.raca ? `, ${a.raca}` : ""}</small></td>
                  <td>{a.tutor_nome}</td>
                  <td><SituacaoVacinal valor={a.situacao_vacinal} /></td>
                  <td className="r">
                    <button className="btn btn-ghost btn-sm" onClick={() => editar(a)}>Editar</button>{" "}
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => excluir(a)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Paginacao pagina={pagina} total={dados.count} onMudar={setPagina} />
      </div>

      <form className="panel" onSubmit={salvar} noValidate>
        <h2>{form.id ? "Editar animal" : "Novo animal"}</h2>
        <Campo rotulo="Nome *" id="a-nome" erro={c.nome}>
          <input id="a-nome" className={c.nome ? "invalid" : ""} value={form.nome} onChange={preencher("nome")} />
        </Campo>
        <div className="two-col">
          <Campo rotulo="Espécie *" id="a-especie" erro={c.especie}>
            <select id="a-especie" className={c.especie ? "invalid" : ""} value={form.especie} onChange={preencher("especie")}>
              <option value="">Selecione</option>
              <option value="cao">Cão</option>
              <option value="gato">Gato</option>
              <option value="outra">Outra</option>
            </select>
          </Campo>
          <Campo rotulo="Sexo *" id="a-sexo" erro={c.sexo}>
            <select id="a-sexo" className={c.sexo ? "invalid" : ""} value={form.sexo} onChange={preencher("sexo")}>
              <option value="">Selecione</option>
              <option value="femea">Fêmea</option>
              <option value="macho">Macho</option>
            </select>
          </Campo>
        </div>
        <Campo rotulo="Raça" id="a-raca" erro={c.raca}>
          <input id="a-raca" value={form.raca} onChange={preencher("raca")} />
        </Campo>
        <div className="two-col">
          <Campo rotulo="Data de nascimento" id="a-nasc" erro={c.data_nascimento}>
            <input id="a-nasc" type="date" value={form.data_nascimento} onChange={preencher("data_nascimento")} />
          </Campo>
          <Campo rotulo="Ou idade estimada" id="a-idade" erro={c.idade_estimada}>
            <input id="a-idade" className={c.idade_estimada ? "invalid" : ""} placeholder="Ex.: 3 anos" value={form.idade_estimada} onChange={preencher("idade_estimada")} />
          </Campo>
        </div>
        <Campo rotulo="Peso (kg)" id="a-peso" erro={c.peso_kg}>
          <input id="a-peso" className={c.peso_kg ? "invalid" : ""} type="number" step="0.1" min="0" value={form.peso_kg} onChange={preencher("peso_kg")} />
        </Campo>
        <Campo rotulo="Tutor *" id="a-tutor" erro={c.tutor}>
          <input aria-label="Buscar tutor" placeholder="Digite para buscar o tutor" value={buscaTutor} onChange={(e) => setBuscaTutor(e.target.value)} />
          <select id="a-tutor" className={c.tutor ? "invalid" : ""} value={form.tutor} onChange={preencher("tutor")}>
            <option value="">Selecione</option>
            {listaTutores.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Observações" id="a-obs" erro={c.observacoes}>
          <textarea id="a-obs" rows="2" value={form.observacoes} onChange={preencher("observacoes")} />
        </Campo>
        {erros.geral && <div className="alert alert-error" role="alert">{erros.geral}</div>}
        <div className="form-actions">
          {form.id && <button type="button" className="btn btn-ghost" onClick={limpar}>Cancelar edição</button>}
          <button className="btn btn-primary" type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : form.id ? "Salvar alterações" : "Salvar animal"}
          </button>
        </div>
      </form>
      {aviso}
    </div>
  );
}
