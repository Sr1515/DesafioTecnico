from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, UserManager


class UsuarioManager(UserManager):
    def create_user(self, email=None, login=None, password=None, **extra_fields):
        if not email:
            raise ValueError("O campo 'email' é obrigatório.")
        email = self.normalize_email(email)
        user = self.model(email=email, login=login, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if not email:
            raise ValueError("O campo 'email' é obrigatório para superusuário.")

        return self.create_user(email=email, login=login, password=password, **extra_fields)



class Usuario(AbstractBaseUser, PermissionsMixin):
    idUsuario = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    login = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    senha = models.CharField(max_length=180)
    dtInclusao = models.DateTimeField(auto_now_add=True)
    dtAlteracao = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = "login"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        db_table = "Usuario"

    def __str__(self):
        return self.nome or self.login


class TipoPokemon(models.Model):
    idTipoPokemon = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "TipoPokemon"

    def __str__(self):
        return self.descricao


class PokemonUsuario(models.Model):
    idPokemonUsuario = models.AutoField(primary_key=True)
    idUsuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="pokemons"
    )
    codigo = models.CharField(max_length=100)
    imagemUrl = models.URLField(max_length=255, blank=True, null=True)
    nome = models.CharField(max_length=100)
    grupoBatalha = models.BooleanField(default=False)
    favorito = models.BooleanField(default=False)

    tipos = models.ManyToManyField(
        TipoPokemon,
        related_name="pokemons"
    )

    class Meta:
        db_table = "PokemonUsuario"

    def __str__(self):
        return f"{self.nome} ({self.idUsuario.nome})"
