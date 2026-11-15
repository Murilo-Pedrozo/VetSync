export default function PaginaEmBreve({ titulo }) {
  return (
    <section>
      <p className="lead">
        A página de {titulo.toLowerCase()} será ligada à API na próxima etapa do desenvolvimento.
      </p>
    </section>
  );
}
