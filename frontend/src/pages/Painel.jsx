import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../services/api";

export default function Painel() {
  const { usuario } = useAuth();
  const [numeros, setNumeros] = useState(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([api.get("/tutores/"), api.get("/animais/"), api.get("/atendimentos/")])
      .then(([tutores, animais, atendimentos]) => {
        if (ativo) {
          setNumeros({
            tutores: tutores.data.count,
            animais: animais.data.count,
            atendimentos: atendimentos.data.count,
          });
        }
      })
      .catch(() => {
        if (ativo) setFalhou(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const nome = usuario?.first_name || usuario?.username;

  return (
    <section>
      <div className="hero">
        <h2>{saudacao}, {nome}.</h2>
        <p>Aqui ficam os atendimentos, as vacinas e os retornos da sua clínica.</p>
      </div>
      {falhou && (
        <div className="alert alert-error">Não foi possível carregar os dados. Verifique a conexão com o servidor.</div>
      )}
      {!falhou && !numeros && <p className="lead">Carregando…</p>}
      {numeros && (
        <div className="summary">
          <div><b>{numeros.tutores}</b><span>tutores</span></div>
          <div><b>{numeros.animais}</b><span>animais</span></div>
          <div><b>{numeros.atendimentos}</b><span>atendimentos registrados</span></div>
        </div>
      )}
    </section>
  );
}
