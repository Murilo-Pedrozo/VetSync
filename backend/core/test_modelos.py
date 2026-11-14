from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError

from core.models import Animal, Organizacao, Tutor, Usuario, Vacina, Vacinacao


@pytest.fixture
def org(db):
    return Organizacao.objects.create(nome="Clínica Teste")


@pytest.fixture
def outra_org(db):
    return Organizacao.objects.create(nome="Outra Clínica")


@pytest.fixture
def vet(org):
    return Usuario.objects.create_user(
        username="vet", password="Senha-de-teste-123", organizacao=org
    )


@pytest.fixture
def tutor(org):
    return Tutor.objects.create(
        organizacao=org, nome="Ana Paula Ribeiro", telefone="(19) 99871-2204"
    )


@pytest.fixture
def animal(org, tutor):
    return Animal.objects.create(
        organizacao=org, tutor=tutor, nome="Mimi",
        especie="gato", sexo="femea", peso_kg=Decimal("3.8"),
    )


def test_cadastro_de_tutor(tutor):
    assert tutor.pk is not None
    assert str(tutor) == "Ana Paula Ribeiro"


def test_animal_associado_ao_tutor(animal, tutor):
    assert animal.tutor == tutor
    assert tutor.animais.count() == 1


def test_cpf_duplicado_na_mesma_organizacao_e_recusado(org, tutor):
    Tutor.objects.create(organizacao=org, nome="A", telefone="1", cpf="12345678901")
    with pytest.raises(IntegrityError), transaction.atomic():
        Tutor.objects.create(organizacao=org, nome="B", telefone="2", cpf="12345678901")


def test_tutores_sem_cpf_podem_se_repetir(org):
    Tutor.objects.create(organizacao=org, nome="A", telefone="1")
    Tutor.objects.create(organizacao=org, nome="B", telefone="2")
    assert Tutor.objects.filter(organizacao=org, cpf="").count() == 2


def test_peso_precisa_ser_positivo(org, tutor):
    with pytest.raises(IntegrityError), transaction.atomic():
        Animal.objects.create(
            organizacao=org, tutor=tutor, nome="X",
            especie="cao", sexo="macho", peso_kg=Decimal("0"),
        )


def test_animal_nao_pode_usar_tutor_de_outra_organizacao(outra_org, tutor):
    animal = Animal(
        organizacao=outra_org, tutor=tutor, nome="Y", especie="cao", sexo="macho"
    )
    with pytest.raises(ValidationError):
        animal.full_clean()


def test_proxima_dose_soma_o_intervalo(org, animal, vet):
    vacina = Vacina.objects.create(organizacao=org, nome="Vacina teste A", intervalo_dias=30)
    aplicacao = Vacinacao.objects.create(
        organizacao=org, animal=animal, vacina=vacina, veterinario=vet,
        data_aplicacao=date(2026, 1, 10), lote="L-1",
    )
    assert aplicacao.proxima_dose == date(2026, 2, 9)


def test_vacina_sem_intervalo_nao_calcula_proxima_dose(org, animal, vet):
    vacina = Vacina.objects.create(organizacao=org, nome="Vacina teste D")
    aplicacao = Vacinacao.objects.create(
        organizacao=org, animal=animal, vacina=vacina, veterinario=vet,
        data_aplicacao=date(2026, 1, 10), lote="L-2",
    )
    assert aplicacao.proxima_dose is None


def test_tutor_com_animais_nao_pode_ser_excluido(tutor, animal):
    with pytest.raises(ProtectedError):
        tutor.delete()