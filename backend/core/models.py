from django.contrib.auth.models import AbstractUser


class Usuario(AbstractUser):
    """Usuário do sistema. Organização e papel entram na modelagem."""