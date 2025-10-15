from django.contrib import admin
from .models import Usuario, TipoPokemon, PokemonUsuario

@admin.register(TipoPokemon)
class TipoPokemonAdmin(admin.ModelAdmin):
    list_display = ('idTipoPokemon', 'descricao')
    search_fields = ('descricao',)
    list_per_page = 20

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('idUsuario', 'nome', 'login', 'email', 'is_active', 'is_staff', 'dtInclusao')
    search_fields = ('nome', 'login', 'email')
    list_filter = ('is_active', 'is_staff', 'dtInclusao')
    list_per_page = 20

@admin.register(PokemonUsuario)
class PokemonUsuarioAdmin(admin.ModelAdmin):
    list_display = ('idPokemonUsuario', 'nome', 'idUsuario', 'codigo', 'grupoBatalha', 'favorito')
    search_fields = ('nome', 'codigo', 'idUsuario__nome', 'idUsuario__login')
    list_filter = ('grupoBatalha', 'favorito')
    filter_horizontal = ('tipos',) 
    list_per_page = 20
