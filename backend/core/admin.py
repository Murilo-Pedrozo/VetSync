from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Animal, Atendimento, Organizacao, Tutor, Usuario, Vacina, Vacinacao


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("VetSync", {"fields": ("organizacao", "papel", "registro_profissional")}),
    )


admin.site.register([Organizacao, Tutor, Animal, Atendimento, Vacina, Vacinacao])