FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /code

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt 

EXPOSE 8000

COPY ./script.sh /start
RUN sed -i 's/\r$//g' /start
RUN chmod +x /start

COPY . /code/




