const SITUACOES = {
  em_dia: ["Em dia", "sage"],
  vence_em_breve: ["Vence em breve", "honey"],
  atrasada: ["Atrasada", "brick"],
  sem_previsao: ["Sem previsão", "neutral"],
  sem_vacinas: ["Sem vacinas", "neutral"],
};

export default function SituacaoVacinal({ valor }) {
  const [texto, cor] = SITUACOES[valor] ?? ["—", "neutral"];
  return <span className={`status status-${cor}`}>{texto}</span>;
}
