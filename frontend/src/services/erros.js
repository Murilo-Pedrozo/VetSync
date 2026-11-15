// Converte a resposta de erro da API em { geral, campos }.
export function lerErros(falha) {
  if (!falha.response) {
    return { geral: "Não foi possível conectar ao servidor.", campos: {} };
  }
  const dados = falha.response.data;
  if (dados && typeof dados === "object" && !dados.detail) {
    const campos = {};
    let geral = "";
    for (const [chave, valor] of Object.entries(dados)) {
      const texto = Array.isArray(valor) ? valor.join(" ") : String(valor);
      if (chave === "non_field_errors") geral = texto;
      else campos[chave] = texto;
    }
    return { geral, campos };
  }
  return { geral: dados?.detail ?? "Não foi possível concluir a operação.", campos: {} };
}
