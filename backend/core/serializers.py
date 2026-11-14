from django.utils import timezone
from rest_framework import serializers

from .models import Animal, Atendimento, Tutor, Usuario, Vacina, Vacinacao
from .services import doses_do_animal, situacao_geral, situacao_vacinal
from .validators import cpf_valido


class DaOrganizacaoField(serializers.PrimaryKeyRelatedField):
    """Só aceita registros da organização do usuário logado."""

    def get_queryset(self):
        organizacao_id = self.context["request"].user.organizacao_id
        return super().get_queryset().filter(organizacao_id=organizacao_id)


def _nome_usuario(usuario):
    return usuario.get_full_name() or usuario.username


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UsuarioSerializer(serializers.ModelSerializer):
    organizacao = serializers.StringRelatedField()

    class Meta:
        model = Usuario
        fields = ["id", "username", "first_name", "last_name", "papel",
                  "registro_profissional", "organizacao"]


class TutorSerializer(serializers.ModelSerializer):
    total_animais = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tutor
        fields = ["id", "nome", "cpf", "telefone", "email", "endereco", "total_animais"]

    def validate_cpf(self, valor):
        if not valor:
            return valor
        if not cpf_valido(valor):
            raise serializers.ValidationError("CPF inválido.")
        organizacao_id = self.context["request"].user.organizacao_id
        existentes = Tutor.objects.filter(organizacao_id=organizacao_id, cpf=valor)
        if self.instance:
            existentes = existentes.exclude(pk=self.instance.pk)
        if existentes.exists():
            raise serializers.ValidationError("Já existe um tutor com este CPF.")
        return valor


class AnimalSerializer(serializers.ModelSerializer):
    tutor = DaOrganizacaoField(queryset=Tutor.objects.all())
    tutor_nome = serializers.CharField(source="tutor.nome", read_only=True)
    situacao_vacinal = serializers.SerializerMethodField()

    class Meta:
        model = Animal
        fields = ["id", "nome", "especie", "raca", "sexo", "data_nascimento",
                  "idade_estimada", "peso_kg", "observacoes", "tutor", "tutor_nome",
                  "situacao_vacinal"]

    def get_situacao_vacinal(self, animal):
        return situacao_geral(doses_do_animal(animal))

    def validate_peso_kg(self, valor):
        if valor is not None and valor <= 0:
            raise serializers.ValidationError("O peso deve ser maior que zero.")
        return valor

    def validate(self, dados):
        nascimento = dados.get("data_nascimento", getattr(self.instance, "data_nascimento", None))
        idade = dados.get("idade_estimada", getattr(self.instance, "idade_estimada", ""))
        if not nascimento and not idade:
            raise serializers.ValidationError("Informe a data de nascimento ou a idade estimada.")
        if nascimento and nascimento > timezone.localdate():
            raise serializers.ValidationError({"data_nascimento": "A data não pode estar no futuro."})
        return dados


class VacinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vacina
        fields = ["id", "nome", "descricao", "intervalo_dias"]

    def validate_nome(self, valor):
        organizacao_id = self.context["request"].user.organizacao_id
        existentes = Vacina.objects.filter(organizacao_id=organizacao_id, nome__iexact=valor)
        if self.instance:
            existentes = existentes.exclude(pk=self.instance.pk)
        if existentes.exists():
            raise serializers.ValidationError("Já existe uma vacina com este nome.")
        return valor

    def validate_intervalo_dias(self, valor):
        if valor is not None and valor < 1:
            raise serializers.ValidationError("O intervalo deve ser de pelo menos 1 dia.")
        return valor


class AtendimentoSerializer(serializers.ModelSerializer):
    animal = DaOrganizacaoField(queryset=Animal.objects.all())
    animal_nome = serializers.CharField(source="animal.nome", read_only=True)
    veterinario_nome = serializers.SerializerMethodField()

    class Meta:
        model = Atendimento
        fields = ["id", "animal", "animal_nome", "veterinario", "veterinario_nome",
                  "data_hora", "anamnese", "sintomas", "diagnostico", "procedimentos",
                  "prescricoes", "observacoes"]
        read_only_fields = ["veterinario"]

    def get_veterinario_nome(self, atendimento):
        return _nome_usuario(atendimento.veterinario)


class VacinacaoSerializer(serializers.ModelSerializer):
    animal = DaOrganizacaoField(queryset=Animal.objects.all())
    vacina = DaOrganizacaoField(queryset=Vacina.objects.all())
    animal_nome = serializers.CharField(source="animal.nome", read_only=True)
    vacina_nome = serializers.CharField(source="vacina.nome", read_only=True)
    veterinario_nome = serializers.SerializerMethodField()
    proxima_dose = serializers.DateField(read_only=True)
    situacao = serializers.SerializerMethodField()

    class Meta:
        model = Vacinacao
        fields = ["id", "animal", "animal_nome", "vacina", "vacina_nome", "veterinario",
                  "veterinario_nome", "data_aplicacao", "lote", "observacoes",
                  "proxima_dose", "situacao"]
        read_only_fields = ["veterinario"]

    def get_veterinario_nome(self, vacinacao):
        return _nome_usuario(vacinacao.veterinario)

    def get_situacao(self, vacinacao):
        return situacao_vacinal(vacinacao.proxima_dose)

    def validate_data_aplicacao(self, valor):
        if valor > timezone.localdate():
            raise serializers.ValidationError("A data da aplicação não pode estar no futuro.")
        return valor