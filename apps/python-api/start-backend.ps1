# Script de démarrage du backend Python FastAPI
# Usage: .\start-backend.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Démarrage du backend Python FastAPI..." -ForegroundColor Cyan

# Naviguer vers le répertoire du backend
Set-Location "$PSScriptRoot"

# Vérifier que venv existe
if (!(Test-Path ".\venv")) {
    Write-Host "❌ Environnement virtuel introuvable. Créez-le d'abord avec: python -m venv venv" -ForegroundColor Red
    exit 1
}

# Activer l'environnement virtuel et démarrer uvicorn
Write-Host "Demarrage sur http://localhost:8000" -ForegroundColor Green
Write-Host "Endpoints:" -ForegroundColor Yellow
Write-Host "  - GET  http://localhost:8000/" -ForegroundColor Gray
Write-Host "  - POST http://localhost:8000/api/optimize" -ForegroundColor Gray
Write-Host ""

& ".\venv\Scripts\uvicorn.exe" main:app --host 127.0.0.1 --port 8000
