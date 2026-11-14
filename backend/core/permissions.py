from rest_framework.permissions import SAFE_METHODS, BasePermission


class TemOrganizacao(BasePermission):
    message = "Seu usuário não está vinculado a uma organização."

    def has_permission(self, request, view):
        usuario = request.user
        return bool(usuario and usuario.is_authenticated and usuario.organizacao_id)


class SomenteVeterinarioEscreve(BasePermission):
    message = "Apenas veterinários e administradores podem fazer este registro."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.papel in {"veterinario", "admin"}