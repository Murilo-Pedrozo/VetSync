from django.contrib.auth import authenticate
from django.db import connection
from django.db.models import Count, ProtectedError
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Tutor
from .permissions import TemOrganizacao
from .serializers import LoginSerializer, TutorSerializer, UsuarioSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def saude(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return Response({"status": "ok", "banco": "conectado"})


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        dados = LoginSerializer(data=request.data)
        dados.is_valid(raise_exception=True)
        usuario = authenticate(
            request,
            username=dados.validated_data["username"],
            password=dados.validated_data["password"],
        )
        if usuario is None:
            return Response({"detail": "Usuário ou senha inválidos."},
                            status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=usuario)
        return Response({"token": token.key, "usuario": UsuarioSerializer(usuario).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EuView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)


class OrganizacaoViewSet(viewsets.ModelViewSet):
    """Base: só mostra e só cria registros da organização do usuário logado."""

    permission_classes = [IsAuthenticated, TemOrganizacao]

    def get_queryset(self):
        return super().get_queryset().filter(organizacao_id=self.request.user.organizacao_id)

    def perform_create(self, serializer):
        serializer.save(organizacao=self.request.user.organizacao)


class TutorViewSet(OrganizacaoViewSet):
    queryset = Tutor.objects.annotate(total_animais=Count("animais"))
    serializer_class = TutorSerializer
    search_fields = ["nome", "telefone", "cpf"]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Este tutor possui animais cadastrados e não pode ser excluído."},
                status=status.HTTP_409_CONFLICT,
            )