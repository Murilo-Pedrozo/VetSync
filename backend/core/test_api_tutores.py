import pytest
from rest_framework.test import APIClient

from core.models import Animal, Organizacao, Tutor, Usuario
from core.validators import cpf_valido

SENHA = "Senha-de-teste-123"


@pytest.fixture
def org(db):
    return Organizacao.objects.create(nome="Clínica Teste")


@pytest.fixture
def outra_org(db):
    return Organizacao.objects.create(nome="Outra Clínica")


@pytest.fixture
def vet(org):
    return Usuario.objects.create_user(username="vet", password=SENHA, organizacao=org)


def logar(username="vet"):
    cliente = APIClient()
    resposta = cliente.post(
        "/api/auth/login/", {"username": username, "password": SENHA}, format="json"
    )
    cliente.credentials(HTTP_AUTHORIZATION=f"Token {resposta.json()['token']}")
    return cliente


@pytest.fixture
def cliente(vet):
    return logar()


def test_cpf_valido_confere_digitos_verificadores():
    assert cpf_valido("52998224725")
    assert not cpf_valido("52998224726")
    assert not cpf_valido("11111111111")


def test_login_correto_devolve_token_e_usuario(vet):
    r = APIClient().post("/api/auth/login/", {"username": "vet", "password": SENHA}, format="json")
    assert r.status_code == 200
    assert r.json()["token"]
    assert r.json()["usuario"]["username"] == "vet"


def test_login_com_senha_errada_e_recusado(vet):
    r = APIClient().post("/api/auth/login/", {"username": "vet", "password": "errada"}, format="json")
    assert r.status_code == 400


def test_rota_protegida_sem_token_retorna_401(db):
    assert APIClient().get("/api/tutores/").status_code == 401


def test_logout_invalida_o_token(cliente):
    assert cliente.post("/api/auth/logout/").status_code == 204
    assert cliente.get("/api/tutores/").status_code == 401


def test_cria_tutor_na_organizacao_do_usuario(cliente, org):
    r = cliente.post(
        "/api/tutores/",
        {"nome": "Ana", "telefone": "(19) 99999-0000", "cpf": "52998224725"},
        format="json",
    )
    assert r.status_code == 201
    assert Tutor.objects.get(pk=r.json()["id"]).organizacao == org


def test_cpf_invalido_e_recusado(cliente):
    r = cliente.post(
        "/api/tutores/",
        {"nome": "Ana", "telefone": "1", "cpf": "12345678901"},
        format="json",
    )
    assert r.status_code == 400
    assert "cpf" in r.json()


def test_campos_obrigatorios_sao_validados(cliente):
    r = cliente.post("/api/tutores/", {}, format="json")
    assert r.status_code == 400
    assert {"nome", "telefone"} <= set(r.json())


def test_nao_enxerga_tutor_de_outra_organizacao(cliente, outra_org):
    alheio = Tutor.objects.create(organizacao=outra_org, nome="Alheio", telefone="1")
    assert cliente.get("/api/tutores/").json()["count"] == 0
    assert cliente.get(f"/api/tutores/{alheio.pk}/").status_code == 404


def test_nao_exclui_tutor_com_animais(cliente, org):
    tutor = Tutor.objects.create(organizacao=org, nome="A", telefone="1")
    Animal.objects.create(organizacao=org, tutor=tutor, nome="Rex", especie="cao", sexo="macho")
    r = cliente.delete(f"/api/tutores/{tutor.pk}/")
    assert r.status_code == 409
    assert Tutor.objects.filter(pk=tutor.pk).exists()


def test_usuario_sem_organizacao_recebe_403(db):
    Usuario.objects.create_user(username="sem", password=SENHA)
    assert logar("sem").get("/api/tutores/").status_code == 403