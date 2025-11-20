# Dockerfile pour déploiement Railway
FROM python:3.11-slim

# Définir répertoire de travail
WORKDIR /app

# Installer dépendances système pour Build123d
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements
COPY requirements.txt .

# Installer dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier code source
COPY . .

# Exposer port (Railway utilisera $PORT)
EXPOSE 8000

# Commande de démarrage
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
