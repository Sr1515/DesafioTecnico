from django.contrib import admin
from .models import Usuario, TipoPokemon, PokemonUsuario

from django.utils.translation import gettext_lazy as _

from django.contrib.auth.admin import UserAdmin


@admin.register(TipoPokemon)
class TipoPokemonAdmin(admin.ModelAdmin):
    list_display = ("idTipoPokemon", "descricao")
    search_fields = ("descricao",)
    list_per_page = 20


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = (
        "idUsuario",
        "nome",
        "login",
        "email",
        "is_active",
        "is_staff",
        "dtInclusao",
    )
    list_filter = ("is_active", "is_staff", "dtInclusao")
    search_fields = ("nome", "login", "email")
    ordering = ("login",)

    fieldsets = (
        (
            _("Informações"),
            {
                "fields": (
                    "idUsuario",
                    "nome",
                    "email",
                    "dtInclusao",
                    "dtAlteracao",
                )
            },
        ),
        (
            _("Credenciais"),
            {
                "fields": (
                    "login",
                    "password",
                )
            },
        ),
        (
            _("Grupos e Permissões"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "nome",
                    "login",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )

    readonly_fields = (
        "idUsuario",
        "dtInclusao",
        "dtAlteracao",
    )


@admin.register(PokemonUsuario)
class PokemonUsuarioAdmin(admin.ModelAdmin):
    list_display = (
        "idPokemonUsuario",
        "nome",
        "idUsuario",
        "codigo",
        "grupoBatalha",
        "favorito",
    )
    search_fields = ("nome", "codigo", "idUsuario__nome", "idUsuario__login")
    list_filter = ("grupoBatalha", "favorito")
    filter_horizontal = ("tipos",)
    list_per_page = 20