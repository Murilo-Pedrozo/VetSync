export default function Campo({ rotulo, id, erro, children }) {
  return (
    <label htmlFor={id}>
      {rotulo}
      {children}
      {erro && <span className="campo-erro">{erro}</span>}
    </label>
  );
}
