from rest_framework.routers import DefaultRouter
from .views import PokemonAPIViewSet, UsuarioViewSet, TipoPokemonViewSet, PokemonUsuarioViewSet

router = DefaultRouter()
router.register(r'pokemon', PokemonAPIViewSet, basename='pokemon')
router.register(r'usuarios', UsuarioViewSet)
router.register(r'tipo-pokemon', TipoPokemonViewSet)
router.register(r'pokemon-usuario', PokemonUsuarioViewSet)

urlpatterns = router.urls
