# poke/views.py
from rest_framework import viewsets
from rest_framework.response import Response
import requests
from .models import PokemonUsuario, TipoPokemon, Usuario
from .serializers import UsuarioSerializer, TipoPokemonSerializer, PokemonUsuarioSerializer
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework import status


POKEAPI_BASE_URL = "https://pokeapi.co/api/v2"

class PokemonAPIViewSet(viewsets.ViewSet):
    
    def retrieve(self, request, pk=None):
        try:
            response = requests.get(f"{POKEAPI_BASE_URL}/pokemon/{pk.lower()}")
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Pokémon não encontrado ou erro na API externa: {str(e)}"}, 
                            status=status.HTTP_404_NOT_FOUND if response.status_code == 404 else status.HTTP_400_BAD_REQUEST)

        pokemon_data = {
            "nome": data["name"],
            "id": data["id"],
            "tipos": [t["type"]["name"] for t in data["types"]], # 💡 Os tipos estão aqui!
            "imagemUrl": data["sprites"]["other"]["official-artwork"]["front_default"] if data["sprites"]["other"].get("official-artwork") else data["sprites"]["front_default"], # Adicionado campo imagemUrl
        }
        
        return Response(pokemon_data)

    def list(self, request):
        offset = request.query_params.get('offset', 0)
        limit = request.query_params.get('limit', 20)
        
        try:
            # 1. Faz a requisição inicial da lista paginada
            response = requests.get(f"{POKEAPI_BASE_URL}/pokemon/?offset={offset}&limit={limit}")
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Itera sobre cada Pokémon e busca os detalhes completos
        detailed_results = []
        for result in data.get("results", []):
            try:
                # Extrai o ID do Pokémon da URL
                pk_id = result["url"].rstrip("/").split("/")[-1]
                
                # Faz a requisição de DETALHES para cada Pokémon (Lembre-se: INEFFICIENTE)
                detail_response = requests.get(f"{POKEAPI_BASE_URL}/pokemon/{pk_id}")
                detail_response.raise_for_status()
                detail_data = detail_response.json()
                
                # Mapeia para o formato que seu frontend Angular espera
                detailed_results.append({
                    "id": detail_data["id"],
                    "nome": detail_data["name"],
                    "tipos": [t["type"]["name"] for t in detail_data["types"]], # 💡 CORREÇÃO
                    "imagemUrl": detail_data["sprites"]["other"]["official-artwork"]["front_default"] if detail_data["sprites"]["other"].get("official-artwork") else detail_data["sprites"]["front_default"],
                })
            except requests.exceptions.RequestException:
                # Ignora Pokémons que falham ao buscar detalhes
                continue
        
        # 3. Retorna a lista modificada
        return Response({
            "count": data.get("count"),
            "next": data.get("next"),
            "previous": data.get("previous"),
            "results": detailed_results # 💡 Lista COMPLETA
        })
    
    @action(detail=False, methods=["get"], url_path="types")
    def tipos(self, request):
        try:
            response = requests.get(f"{POKEAPI_BASE_URL}/type/")
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        tipos = [
            {
                "id": int(t["url"].rstrip("/").split("/")[-1]), 
                "name": t["name"]
            }
            for t in data["results"]
        ]
        return Response({"tipos": tipos}) 


    @action(detail=False, methods=["get"], url_path="search-name")
    def search_name(self, request):
        name = request.query_params.get('name', None)
        if not name:
            return Response({"error": "Parâmetro 'name' é obrigatório"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        return self.retrieve(request, pk=name)


    @action(detail=False, methods=["get"], url_path="generations")
    def generations(self, request):
        try:
            response = requests.get(f"{POKEAPI_BASE_URL}/generation/?limit=10") 
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        generations = [
            {
                "id": int(g["url"].rstrip("/").split("/")[-1]), 
                "name": g["name"].replace("generation-", "Geração ")
            }
            for g in data["results"]
        ]
        
        return Response({"generations": generations})


    @action(detail=False, methods=["get"], url_path="filter-generation")
    def filter_generation(self, request):
        gen_id = request.query_params.get('id', None)
        if not gen_id or not gen_id.isdigit():
            return Response({"error": "Parâmetro 'id' (da geração) é obrigatório e deve ser numérico"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            response = requests.get(f"{POKEAPI_BASE_URL}/generation/{gen_id}/")
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
             return Response({"error": f"Geração não encontrada ou erro na API externa: {str(e)}"}, 
                             status=status.HTTP_404_NOT_FOUND if response.status_code == 404 else status.HTTP_400_BAD_REQUEST)
        
        pokemons = [
            {
                "id": int(p["url"].rstrip("/").split("/")[-1]), 
                "name": p["name"],
            }
            for p in data["pokemon_species"]
        ]

        return Response({"results": pokemons})
    
    @action(detail=False, methods=["get"], url_path="filter-combined")
    def filter_combined(self, request):
        """Lista Pokémons combinando Geração e Tipo."""
        gen_id = request.query_params.get('gen_id', None)
        type_id = request.query_params.get('type_id', None)
        
        if not gen_id or not type_id:
            return Response({"error": "Os parâmetros 'gen_id' e 'type_id' são obrigatórios para a filtragem combinada."}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        try:
            gen_response = requests.get(f"{POKEAPI_BASE_URL}/generation/{gen_id}/")
            gen_response.raise_for_status()
            gen_data = gen_response.json()
            
            gen_pokemons_urls = {
                p["name"]: p["url"] 
                for p in gen_data.get("pokemon_species", [])
            }
            
            type_response = requests.get(f"{POKEAPI_BASE_URL}/type/{type_id}/")
            type_response.raise_for_status()
            type_data = type_response.json()
            
            type_pokemons_names = {
                p["pokemon"]["name"]
                for p in type_data.get("pokemon", [])
            }
            
            combined_pokemons = []
            for name in type_pokemons_names:
                if name in gen_pokemons_urls:
                    url = gen_pokemons_urls[name]
                    pk_id = int(url.rstrip("/").split("/")[-1]) 
                    
                    combined_pokemons.append({
                        "id": pk_id, 
                        "name": name, 
                        "url": url
                    })

        except requests.exceptions.RequestException as e:
            return Response({"error": f"Erro na requisição à API externa: {str(e)}"}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
        return Response({"results": combined_pokemons})

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
