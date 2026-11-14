from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Q


class Organizacao(models.Model):
    """Clínica ou ONG. Toda informação pertence a uma organização."""

    nome = models.CharField(max_length=150)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "organização"
        verbose_name_plural = "organizações"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Usuario(AbstractUser):
    class Papel(models.TextChoices):
        VETERINARIO = "veterinario", "Veterinário"
        RECEPCAO = "recepcao", "Recepção"
        ADMIN = "admin", "Administrador"

    organizacao = models.ForeignKey(
        Organizacao, on_delete=models.PROTECT, null=True, blank=True,
        related_name="usuarios",
    )
    papel = models.CharField(max_length=20, choices=Papel.choices, default=Papel.VETERINARIO)
    registro_profissional = models.CharField(max_length=30, blank=True)


def _mesma_organizacao(organizacao_id, *objetos):
    for obj in objetos:
        if obj is not None and obj.organizacao_id != organizacao_id:
            raise ValidationError("Os registros relacionados pertencem a outra organização.")


class Tutor(models.Model):
    organizacao = models.ForeignKey(Organizacao, on_delete=models.PROTECT, related_name="tutores")
    nome = models.CharField(max_length=150)
    cpf = models.CharField(
        "CPF", max_length=11, blank=True,
        validators=[RegexValidator(r"^\d{11}$", "O CPF deve ter 11 números.")],
    )
    telefone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    endereco = models.CharField("endereço", max_length=255, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nome"]
        constraints = [
            models.UniqueConstraint(
                fields=["organizacao", "cpf"], condition=~Q(cpf=""),
                name="tutor_cpf_unico_por_organizacao",
            ),
        ]
        indexes = [models.Index(fields=["organizacao", "nome"])]

    def __str__(self):
        return self.nome


class Animal(models.Model):
    class Especie(models.TextChoices):
        CAO = "cao", "Cão"
        GATO = "gato", "Gato"
        OUTRA = "outra", "Outra"

    class Sexo(models.TextChoices):
        FEMEA = "femea", "Fêmea"
        MACHO = "macho", "Macho"

    organizacao = models.ForeignKey(Organizacao, on_delete=models.PROTECT, related_name="animais")
    tutor = models.ForeignKey(Tutor, on_delete=models.PROTECT, related_name="animais")
    nome = models.CharField(max_length=100)
    especie = models.CharField("espécie", max_length=10, choices=Especie.choices)
    raca = models.CharField("raça", max_length=80, blank=True)
    sexo = models.CharField(max_length=10, choices=Sexo.choices)
    data_nascimento = models.DateField(null=True, blank=True)
    idade_estimada = models.CharField(max_length=30, blank=True)
    peso_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    observacoes = models.TextField("observações", blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nome"]
        verbose_name_plural = "animais"
        constraints = [
            models.CheckConstraint(
                condition=Q(peso_kg__isnull=True) | Q(peso_kg__gt=0),
                name="animal_peso_positivo",
            ),
        ]
        indexes = [models.Index(fields=["organizacao", "nome"])]

    def clean(self):
        if self.tutor_id:
            _mesma_organizacao(self.organizacao_id, self.tutor)

    def __str__(self):
        return self.nome


class Vacina(models.Model):
    """Catálogo de vacinas. Sem intervalo = próxima dose não é calculada."""

    organizacao = models.ForeignKey(Organizacao, on_delete=models.PROTECT, related_name="vacinas")
    nome = models.CharField(max_length=100)
    descricao = models.TextField("descrição", blank=True)
    intervalo_dias = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["nome"]
        constraints = [
            models.UniqueConstraint(fields=["organizacao", "nome"], name="vacina_nome_unico_por_organizacao"),
            models.CheckConstraint(
                condition=Q(intervalo_dias__isnull=True) | Q(intervalo_dias__gt=0),
                name="vacina_intervalo_positivo",
            ),
        ]

    def __str__(self):
        return self.nome


class Atendimento(models.Model):
    organizacao = models.ForeignKey(Organizacao, on_delete=models.PROTECT, related_name="atendimentos")
    animal = models.ForeignKey(Animal, on_delete=models.PROTECT, related_name="atendimentos")
    veterinario = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name="atendimentos")
    data_hora = models.DateTimeField()
    anamnese = models.TextField()
    sintomas = models.TextField(blank=True)
    diagnostico = models.CharField("diagnóstico", max_length=255)
    procedimentos = models.TextField(blank=True)
    prescricoes = models.TextField("prescrições", blank=True)
    observacoes = models.TextField("observações clínicas", blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-data_hora"]
        indexes = [models.Index(fields=["animal", "-data_hora"])]

    def clean(self):
        if self.animal_id and self.veterinario_id:
            _mesma_organizacao(self.organizacao_id, self.animal, self.veterinario)

    def __str__(self):
        return f"{self.animal} em {self.data_hora:%d/%m/%Y}"


class Vacinacao(models.Model):
    organizacao = models.ForeignKey(Organizacao, on_delete=models.PROTECT, related_name="vacinacoes")
    animal = models.ForeignKey(Animal, on_delete=models.PROTECT, related_name="vacinacoes")
    vacina = models.ForeignKey(Vacina, on_delete=models.PROTECT, related_name="aplicacoes")
    veterinario = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name="vacinacoes")
    data_aplicacao = models.DateField("data da aplicação")
    lote = models.CharField(max_length=50)
    observacoes = models.TextField("observações", blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-data_aplicacao"]
        verbose_name = "vacinação"
        verbose_name_plural = "vacinações"
        indexes = [models.Index(fields=["animal", "-data_aplicacao"])]

    @property
    def proxima_dose(self):
        """Data da aplicação somada ao intervalo da vacina (ou None)."""
        if self.vacina.intervalo_dias:
            return self.data_aplicacao + timedelta(days=self.vacina.intervalo_dias)
        return None

    def clean(self):
        if self.animal_id and self.vacina_id and self.veterinario_id:
            _mesma_organizacao(self.organizacao_id, self.animal, self.vacina, self.veterinario)

    def __str__(self):
        return f"{self.vacina} em {self.animal}"