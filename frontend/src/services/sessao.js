const TOKEN = "vetsync_token";
const USUARIO = "vetsync_usuario";

export const lerToken = () => localStorage.getItem(TOKEN);

export function lerUsuario() {
  try {
    return JSON.parse(localStorage.getItem(USUARIO));
  } catch {
    return null;
  }
}

export function salvarSessao(token, usuario) {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(USUARIO, JSON.stringify(usuario));
}

export function limparSessao() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(USUARIO);
}
