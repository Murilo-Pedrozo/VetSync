import pytest
from rest_framework.test import APIClient

from core.models import Animal, Organizacao, Tutor, Usuario, Vacina

SENHA = "Senha-de-teste-123"


def cliente_de(username):
    cliente = APIClient()
    resposta = cliente.post(
        "/api/auth/login/", {"username": username, "password": SENHA}, format="json"
    )
    cliente.credentials(HTTP_AUTHORIZATION=f"Token {resposta.json()['token']}")
    return cliente


@pytest.fixture
def org(db):
    return Organizacao.objects.create(nome="Clínica Teste")


@pytest.fixture
def outra_org(db):
    return Organizacao.objects.create(nome="Outra Clínica")


@pytest.fixture
def vet(org):
    return Usuario.objects.create_user(username="vet", password=SENHA, organizacao=org)


@pytest.fixture
def recepcao(org):
    return Usuario.objects.create_user(
        username="rec", password=SENHA, organizacao=org, papel="recepcao"
    )


@pytest.fixture
def cliente(vet):
    return cliente_de("vet")


@pytest.fixture
def cliente_recepcao(recepcao):
    return cliente_de("rec")


@pytest.fixture
def tutor(org):
    return Tutor.objects.create(
        organizacao=org, nome="Ana Paula Ribeiro", telefone="(19) 99871-2204"
    )


@pytest.fixture
def animal(org, tutor):
    return Animal.objects.create(
        organizacao=org, tutor=tutor, nome="Mimi",
        especie="gato", sexo="femea", idade_estimada="2 anos",
    )


@pytest.fixture
def vacina30(org):
    return Vacina.objects.create(organizacao=org, nome="Vacina teste A", intervalo_dias=30)


@pytest.fixture
def animal_alheio(outra_org):
    tutor = Tutor.objects.create(organizacao=outra_org, nome="Alheio", telefone="1")
    return Animal.objects.create(
        organizacao=outra_org, tutor=tutor, nome="Rex",
        especie="cao", sexo="macho", idade_estimada="3 anos",
    )