from rest_framework.permissions import BasePermission


class TemOrganizacao(BasePermission):
    message = "Seu usuário não está vinculado a uma organização."

    def has_permission(self, request, view):
        usuario = request.user
        return bool(usuario and usuario.is_authenticated and usuario.organizacao_id)