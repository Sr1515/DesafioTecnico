build:
	docker compose build

run: 
	docker compose up -d

off:
	docker compose down

logs:
	docker compose logs -f api

mk: 
	docker compose exec api python manage.py makemigrations

mg: 
	docker compose exec api python manage.py migrate

create-admin:
	docker compose exec api python manage.py createsuperuser