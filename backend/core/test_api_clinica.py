from datetime import date, timedelta

from django.utils import timezone

from core.services import situacao_vacinal


def test_cria_animal_associado_ao_tutor(cliente, tutor):
    r = cliente.post(
        "/api/animais/",
        {"nome": "Mimi", "especie": "gato", "sexo": "femea",
         "idade_estimada": "2 anos", "peso_kg": "3.8", "tutor": tutor.pk},
        format="json",
    )
    assert r.status_code == 201
    assert r.json()["tutor_nome"] == tutor.nome


def test_animal_exige_nascimento_ou_idade(cliente, tutor):
    r = cliente.post(
        "/api/animais/",
        {"nome": "Mimi", "especie": "gato", "sexo": "femea", "tutor": tutor.pk},
        format="json",
    )
    assert r.status_code == 400


def test_animal_com_tutor_de_outra_organizacao_e_recusado(cliente, animal_alheio):
    r = cliente.post(
        "/api/animais/",
        {"nome": "X", "especie": "cao", "sexo": "macho",
         "idade_estimada": "1 ano", "tutor": animal_alheio.tutor_id},
        format="json",
    )
    assert r.status_code == 400
    assert "tutor" in r.json()


def test_vacinacao_calcula_proxima_dose(cliente, animal, vacina30):
    r = cliente.post(
        "/api/vacinacoes/",
        {"animal": animal.pk, "vacina": vacina30.pk,
         "data_aplicacao": "2026-01-10", "lote": "L-1"},
        format="json",
    )
    assert r.status_code == 201
    assert r.json()["proxima_dose"] == "2026-02-09"
    assert r.json()["situacao"] == "atrasada"


def test_situacao_vacinal():
    hoje = date(2026, 6, 1)
    assert situacao_vacinal(date(2026, 5, 31), hoje) == "atrasada"
    assert situacao_vacinal(date(2026, 6, 1), hoje) == "vence_em_breve"
    assert situacao_vacinal(date(2026, 6, 16), hoje) == "vence_em_breve"
    assert situacao_vacinal(date(2026, 6, 17), hoje) == "em_dia"
    assert situacao_vacinal(None, hoje) == "sem_previsao"


def test_vacinacao_futura_e_recusada(cliente, animal, vacina30):
    amanha = (timezone.localdate() + timedelta(days=1)).isoformat()
    r = cliente.post(
        "/api/vacinacoes/",
        {"animal": animal.pk, "vacina": vacina30.pk, "data_aplicacao": amanha, "lote": "L-1"},
        format="json",
    )
    assert r.status_code == 400
    assert "data_aplicacao" in r.json()


def test_nao_vacina_animal_de_outra_organizacao(cliente, animal_alheio, vacina30):
    r = cliente.post(
        "/api/vacinacoes/",
        {"animal": animal_alheio.pk, "vacina": vacina30.pk,
         "data_aplicacao": "2026-01-10", "lote": "L-1"},
        format="json",
    )
    assert r.status_code == 400
    assert "animal" in r.json()


def test_vacina_com_nome_repetido_e_recusada(cliente, vacina30):
    r = cliente.post(
        "/api/vacinas/", {"nome": "vacina teste a", "intervalo_dias": 30}, format="json"
    )
    assert r.status_code == 400
    assert "nome" in r.json()


def test_historico_reune_atendimentos_vacinacoes_e_proximas_doses(cliente, animal, vacina30):
    r1 = cliente.post(
        "/api/atendimentos/",
        {"animal": animal.pk, "data_hora": "2026-11-01T10:00:00-03:00",
         "anamnese": "Apatia", "diagnostico": "Gastrite leve"},
        format="json",
    )
    assert r1.status_code == 201
    aplicada = timezone.localdate() - timedelta(days=5)
    r2 = cliente.post(
        "/api/vacinacoes/",
        {"animal": animal.pk, "vacina": vacina30.pk,
         "data_aplicacao": aplicada.isoformat(), "lote": "L-2"},
        format="json",
    )
    assert r2.status_code == 201

    historico = cliente.get(f"/api/animais/{animal.pk}/historico/").json()
    assert historico["animal"]["nome"] == "Mimi"
    assert historico["tutor"]["nome"] == "Ana Paula Ribeiro"
    assert len(historico["atendimentos"]) == 1
    assert len(historico["vacinacoes"]) == 1
    dose = historico["proximas_doses"][0]
    assert dose["vacina"] == "Vacina teste A"
    assert dose["situacao"] == "em_dia"


def test_historico_de_outra_organizacao_retorna_404(cliente, animal_alheio):
    assert cliente.get(f"/api/animais/{animal_alheio.pk}/historico/").status_code == 404


def test_recepcao_consulta_mas_nao_registra_atendimento(cliente_recepcao, animal):
    assert cliente_recepcao.get("/api/atendimentos/").status_code == 200
    r = cliente_recepcao.post(
        "/api/atendimentos/",
        {"animal": animal.pk, "data_hora": "2026-11-01T10:00:00-03:00",
         "anamnese": "X", "diagnostico": "Y"},
        format="json",
    )
    assert r.status_code == 403