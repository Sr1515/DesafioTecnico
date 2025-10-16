# poke/views.py
from rest_framework import viewsets
from rest_framework.response import Response
import requests
from .models import PokemonUsuario, TipoPokemon, Usuario
from .serializers import UsuarioSerializer, TipoPokemonSerializer, PokemonUsuarioSerializer
from rest_framework import permissions
from rest_framework.decorators import action


POKEAPI_BASE_URL = "https://pokeapi.co/api/v2"

class PokemonAPIViewSet(viewsets.ViewSet):
    def retrieve(self, request, pk=None):
        try:
            response = requests.get(f"{POKEAPI_BASE_URL}/pokemon/{pk.lower()}")
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=400)

        pokemon_data = {
            "nome": data["name"],
            "id": data["id"],
            "tipos": [t["type"]["name"] for t in data["types"]],
            "sprites": data["sprites"],
        }
        
        return Response(pokemon_data)
    
    def list(self, request):
        try:
            response = requests.get(f"{POKEAPI_BASE_URL}/pokemon/")
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=400)

        return Response(data)
    

    @action(detail=False, methods=["get"], url_path="types")
    def tipos(self, request):
        try:
            response = requests.get(f"{POKEAPI_BASE_URL}/type/")
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=400)

        tipos = [
            {
                "id": int(t["url"].rstrip("/").split("/")[-1]), 
                "name": t["name"]
            }
            for t in data["results"]
        ]
        return Response({"tipos": tipos})

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'list']: 
            return [permissions.AllowAny()] 
        return super().get_permissions() 

class TipoPokemonViewSet(viewsets.ModelViewSet):
    queryset = TipoPokemon.objects.all()
    serializer_class =  TipoPokemonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
class PokemonUsuarioViewSet(viewsets.ModelViewSet):
    queryset = PokemonUsuario.objects.all()
    serializer_class = PokemonUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(idUsuario=self.request.user)
