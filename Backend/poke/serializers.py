from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Usuario, TipoPokemon, PokemonUsuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {
            'senha': {'write_only': True} 
        }

    def create(self, validated_data):
        password = validated_data.pop('senha', None)
        if password:
            validated_data['senha'] = make_password(password)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('senha', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance


class TipoPokemonSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPokemon
        fields = ['idTipoPokemon', 'descricao']

class PokemonUsuarioSerializer(serializers.ModelSerializer):
    tipos = TipoPokemonSerializer(many=True, read_only=True)
    idUsuario = serializers.StringRelatedField()  

    class Meta:
        model = PokemonUsuario
        fields = ['idPokemonUsuario', 'idUsuario', 'nome', 'codigo', 'grupoBatalha', 'favorito', 'tipos', 'imagemUrl']
