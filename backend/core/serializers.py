from rest_framework import serializers

from .models import Tutor, Usuario
from .validators import cpf_valido


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