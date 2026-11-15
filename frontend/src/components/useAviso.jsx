import { useRef, useState } from "react";

// Mensagem rápida de sucesso ou erro. Uso: const [aviso, mostrarAviso] = useAviso();
export function useAviso() {
  const [aviso, setAviso] = useState(null);
  const timer = useRef(null);

  function mostrar(texto, erro = false) {
    setAviso({ texto, erro });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), 4000);
  }

  const elemento = aviso ? (
    <div className={"toast" + (aviso.erro ? " erro" : "")} role="status">{aviso.texto}</div>
  ) : null;

  return [elemento, mostrar];
}
