from datetime import date

from django.utils import timezone

LIMITE_VENCE_EM_BREVE = 15  # dias antes da data prevista
PRIORIDADE = {"atrasada": 4, "vence_em_breve": 3, "em_dia": 2, "sem_previsao": 1}


def situacao_vacinal(proxima_dose, hoje=None):
    """atrasada, vence_em_breve, em_dia ou sem_previsao."""
    if proxima_dose is None:
        return "sem_previsao"
    hoje = hoje or timezone.localdate()
    dias = (proxima_dose - hoje).days
    if dias < 0:
        return "atrasada"
    if dias <= LIMITE_VENCE_EM_BREVE:
        return "vence_em_breve"
    return "em_dia"


def doses_do_animal(animal, hoje=None):
    """Última aplicação de cada vacina, com próxima dose e situação."""
    ultimas = {}
    aplicacoes = animal.vacinacoes.select_related("vacina").order_by("data_aplicacao", "id")
    for aplicacao in aplicacoes:
        ultimas[aplicacao.vacina_id] = aplicacao
    doses = []
    for aplicacao in ultimas.values():
        proxima = aplicacao.proxima_dose
        doses.append({
            "vacina_id": aplicacao.vacina_id,
            "vacina": aplicacao.vacina.nome,
            "ultima_aplicacao": aplicacao.data_aplicacao,
            "proxima_dose": proxima,
            "situacao": situacao_vacinal(proxima, hoje),
        })
    doses.sort(key=lambda d: (-PRIORIDADE[d["situacao"]], d["proxima_dose"] or date.max))
    return doses


def situacao_geral(doses):
    """Pior situação entre as vacinas do animal."""
    if not doses:
        return "sem_vacinas"
    return max(doses, key=lambda d: PRIORIDADE[d["situacao"]])["situacao"]