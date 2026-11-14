from django.contrib.auth import authenticate
from django.db import connection
from django.db.models import Count, ProtectedError
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Animal, Atendimento, Tutor, Vacina, Vacinacao
from .permissions import SomenteVeterinarioEscreve, TemOrganizacao
from .serializers import (AnimalSerializer, AtendimentoSerializer, LoginSerializer,
                          TutorSerializer, UsuarioSerializer, VacinacaoSerializer,
                          VacinaSerializer)
from .services import doses_do_animal


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
    mensagem_protegido = "Este registro possui dados vinculados e não pode ser excluído."

    def get_queryset(self):
        return super().get_queryset().filter(organizacao_id=self.request.user.organizacao_id)

    def perform_create(self, serializer):
        serializer.save(organizacao=self.request.user.organizacao)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({"detail": self.mensagem_protegido}, status=status.HTTP_409_CONFLICT)


class TutorViewSet(OrganizacaoViewSet):
    queryset = Tutor.objects.annotate(total_animais=Count("animais")).order_by("nome")
    serializer_class = TutorSerializer
    search_fields = ["nome", "telefone", "cpf"]
    mensagem_protegido = "Este tutor possui animais cadastrados e não pode ser excluído."


class AnimalViewSet(OrganizacaoViewSet):
    queryset = Animal.objects.select_related("tutor").order_by("nome")
    serializer_class = AnimalSerializer
    search_fields = ["nome", "raca", "tutor__nome"]
    mensagem_protegido = "Este animal possui atendimentos ou vacinações e não pode ser excluído."

    @action(detail=True, methods=["get"])
    def historico(self, request, pk=None):
        animal = self.get_object()
        contexto = self.get_serializer_context()
        atendimentos = animal.atendimentos.select_related("animal", "veterinario")
        vacinacoes = animal.vacinacoes.select_related("animal", "vacina", "veterinario")
        return Response({
            "animal": AnimalSerializer(animal, context=contexto).data,
            "tutor": {
                "id": animal.tutor_id,
                "nome": animal.tutor.nome,
                "telefone": animal.tutor.telefone,
                "email": animal.tutor.email,
            },
            "atendimentos": AtendimentoSerializer(atendimentos, many=True, context=contexto).data,
            "vacinacoes": VacinacaoSerializer(vacinacoes, many=True, context=contexto).data,
            "proximas_doses": doses_do_animal(animal),
        })


class VacinaViewSet(OrganizacaoViewSet):
    queryset = Vacina.objects.order_by("nome")
    serializer_class = VacinaSerializer
    permission_classes = [IsAuthenticated, TemOrganizacao, SomenteVeterinarioEscreve]
    search_fields = ["nome"]
    mensagem_protegido = "Esta vacina já foi aplicada e não pode ser excluída."


class RegistroClinicoViewSet(OrganizacaoViewSet):
    """Base de atendimentos e vacinações: filtro ?animal= e veterinário automático."""

    permission_classes = [IsAuthenticated, TemOrganizacao, SomenteVeterinarioEscreve]

    def get_queryset(self):
        consulta = super().get_queryset()
        animal = self.request.query_params.get("animal")
        if animal and animal.isdigit():
            consulta = consulta.filter(animal_id=animal)
        return consulta

    def perform_create(self, serializer):
        serializer.save(
            organizacao=self.request.user.organizacao, veterinario=self.request.user
        )


class AtendimentoViewSet(RegistroClinicoViewSet):
    queryset = Atendimento.objects.select_related("animal", "veterinario")
    serializer_class = AtendimentoSerializer
    search_fields = ["animal__nome", "diagnostico"]


class VacinacaoViewSet(RegistroClinicoViewSet):
    queryset = Vacinacao.objects.select_related("animal", "vacina", "veterinario")
    serializer_class = VacinacaoSerializer
    search_fields = ["animal__nome", "vacina__nome", "lote"]