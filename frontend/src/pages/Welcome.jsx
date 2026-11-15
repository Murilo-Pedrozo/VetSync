import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navegar = useNavigate();
  const [saindo, setSaindo] = useState(false);

  function comecar() {
    sessionStorage.setItem("vetsync_boas_vindas", "1");
    setSaindo(true);
    setTimeout(() => navegar("/login"), 400);
  }

  return (
    <div className={"welcome" + (saindo ? " sai" : "")}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="i-paw" viewBox="0 0 24 24">
          <circle cx="6" cy="11" r="2" /><circle cx="10" cy="6" r="2" /><circle cx="15" cy="6" r="2" /><circle cx="19" cy="11" r="2" />
          <path d="M12 12c-3 0-6 3-6 6 0 2 2 3 6 3s6-1 6-3c0-3-3-6-6-6z" />
        </symbol>
      </svg>
      <svg className="ecg" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path pathLength="1" d="M0 60 H380 l18 -8 l18 8 H500 l14 -52 l24 104 l14 -52 H760 l20 -14 l20 14 H1200" />
      </svg>
      <div className="w-centro">
        <p className="w-pequeno">Clínica VetSync</p>
        <h1>Bem-vindo ao VetSync.</h1>
        <p className="w-texto">O prontuário e a carteirinha de vacinação de cada animal, num só lugar.</p>
        <button className="btn btn-primary" onClick={comecar}>Entrar na clínica</button>
      </div>
      <svg className="bicho gato" viewBox="0 0 160 140" aria-hidden="true">
        <g className="cabeca">
          <polygon points="30,62 36,14 72,46" fill="#E9F1EC" /><polygon points="130,62 124,14 88,46" fill="#E9F1EC" />
          <polygon points="40,50 41,28 58,44" fill="#7FA491" /><polygon points="120,50 119,28 102,44" fill="#7FA491" />
          <ellipse cx="80" cy="88" rx="56" ry="46" fill="#E9F1EC" />
          <ellipse className="olho" cx="58" cy="82" rx="5" ry="7" fill="#14261E" /><ellipse className="olho" cx="102" cy="82" rx="5" ry="7" fill="#14261E" />
          <polygon points="74,95 86,95 80,102" fill="#A2412A" />
          <path d="M80 102 q-8 8 -16 2 M80 102 q8 8 16 2" fill="none" stroke="#14261E" strokeWidth="2" strokeLinecap="round" />
          <path d="M44 98 l-26 -5 M44 106 l-26 5 M116 98 l26 -5 M116 106 l26 5" stroke="#7FA491" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
      <svg className="bicho cao" viewBox="0 0 170 150" aria-hidden="true">
        <g className="cabeca">
          <ellipse cx="26" cy="72" rx="18" ry="44" fill="#C99A3E" transform="rotate(12 26 72)" /><ellipse cx="144" cy="72" rx="18" ry="44" fill="#C99A3E" transform="rotate(-12 144 72)" />
          <rect x="30" y="26" width="110" height="104" rx="48" fill="#F8ECD3" />
          <ellipse className="olho" cx="66" cy="76" rx="6" ry="8" fill="#14261E" /><ellipse className="olho" cx="104" cy="76" rx="6" ry="8" fill="#14261E" />
          <ellipse cx="85" cy="99" rx="13" ry="9" fill="#14261E" />
          <ellipse className="lingua" cx="85" cy="121" rx="7" ry="10" fill="#A2412A" />
          <path d="M85 108 v6 M85 114 q-10 8 -19 0 M85 114 q10 8 19 0" fill="none" stroke="#14261E" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
      <div className="pegadas" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <svg key={n} className="i" style={{ "--n": n }}><use href="#i-paw" /></svg>
        ))}
      </div>
    </div>
  );
}
