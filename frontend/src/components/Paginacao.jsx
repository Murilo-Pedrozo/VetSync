export default function Paginacao({ pagina, total, tamanho = 20, onMudar }) {
  const paginas = Math.max(1, Math.ceil(total / tamanho));
  if (paginas <= 1) return null;
  return (
    <div className="paginacao">
      <button className="btn btn-ghost btn-sm" disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)}>Anterior</button>
      <span>Página {pagina} de {paginas}</span>
      <button className="btn btn-ghost btn-sm" disabled={pagina >= paginas} onClick={() => onMudar(pagina + 1)}>Próxima</button>
    </div>
  );
}
