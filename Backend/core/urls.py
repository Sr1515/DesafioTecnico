from django.contrib import admin
from django.urls import path, include
from poke.urls import urlpatterns as urlpatter

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('poke.auth_urls')),
    path('api/', include(urlpatter)),
]
