import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_endpoint_saude_responde_ok():
    resposta = APIClient().get("/api/saude/")
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "ok"