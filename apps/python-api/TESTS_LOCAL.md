# 🧪 Guide de Test Local du Backend Python

## Prérequis

- Python 3.11+ installé
- Environnement virtuel créé (`venv`)
- Dépendances installées

## Démarrage du Backend

### Windows PowerShell

```powershell
cd apps\python-api
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
```

Le serveur démarre sur **http://localhost:8000**

## Tests avec curl

### 1. Test du endpoint racine

```powershell
curl http://localhost:8000/
```

**Réponse attendue:**
```json
{
  "status": "online",
  "service": "Topology Optimization API",
  "version": "1.0.0",
  "endpoints": {
    "optimize": "/api/optimize (POST)",
    "download_stl": "/api/download/{filename} (GET)"
  }
}
```

### 2. Test d'optimisation SIMP

```powershell
$body = @{
  geometry = @{
    shape = "box"
    dimensions = @(100, 100, 100)
  }
  material = @{
    name = "acier"
    youngs_modulus = 200e9
    poisson_ratio = 0.3
    density = 7850
  }
  loads = @{
    force_magnitude = 1000
    force_direction = @(0, 0, -1)
  }
  constraints = @{
    volume_fraction = 0.4
    fixed_faces = @("bottom")
  }
  optimization = @{
    resolution = 20
    iterations = 30
  }
} | ConvertTo-Json -Depth 5

curl -X POST http://localhost:8000/api/optimize `
  -H "Content-Type: application/json" `
  -d $body
```

**Temps d'exécution attendu:** 15-30 secondes

**Réponse attendue:**
```json
{
  "success": true,
  "stl_url": "/api/download/optimized_part.stl",
  "metrics": {
    "volume_initial": 1000000,
    "volume_optimized": 400000,
    "volume_reduction": 60,
    "mass_kg": 3.14,
    "final_compliance": 0.0045,
    "iterations_completed": 30
  },
  "message": "Optimisation SIMP terminée avec succès"
}
```

## Test avec le Frontend Next.js

### 1. Configurer l'URL locale

Ajouter dans `apps/web/.env.local`:

```env
PYTHON_API_URL=http://localhost:8000
```

### 2. Démarrer Next.js

```powershell
cd ..\..  # Retour à la racine
pnpm run dev
```

### 3. Tester l'intégration

1. Aller sur http://localhost:3000/generative-design
2. Générer un brief avec Gemini
3. Cliquer "Lancer l'optimisation"
4. **Vérifier les logs du terminal Next.js:**

```
📡 Appel backend Python: http://localhost:8000
📦 Paramètres: {...}
✅ Optimisation terminée: { success: true, ... }
```

5. **Vérifier les logs du backend Python:**

```
🚀 NOUVELLE OPTIMISATION TOPOLOGIQUE
============================================================
Géométrie: box - [100, 100, 100] mm
Matériau: acier (E=200.0 GPa)
Force: 1000 N [0, 0, -1]
Résolution: 20³ voxels
Itérations: 30
============================================================

🔧 Démarrage SIMP: 30 itérations, résolution 20³
  Iter 0: Compliance=0.0123, Volume=40.00%
  Iter 10: Compliance=0.0098, Volume=40.05%
  Iter 20: Compliance=0.0082, Volume=39.98%
✅ Optimisation terminée !

📐 Génération du fichier STL...
✅ STL généré: C:\Users\...\optimized_part.stl

============================================================
✅ OPTIMISATION TERMINÉE
============================================================
Volume initial: 1000000 mm³
Volume optimisé: 400000 mm³
Réduction: 60.0%
Masse: 3140.0 g
```

## Problèmes Fréquents

### 1. "ModuleNotFoundError: No module named 'fastapi'"

**Solution:** Activer l'environnement virtuel avant de démarrer:

```powershell
.\venv\Scripts\Activate.ps1
python main.py
```

### 2. "Port 8000 already in use"

**Solution:** Tuer le processus sur le port 8000:

```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### 3. Backend démarre puis crash immédiatement

**Solution:** Vérifier les imports:

```powershell
python -c "from app.routers import optimize"
```

Si erreur, vérifier que les fichiers `__init__.py` existent dans:
- `app/__init__.py`
- `app/routers/__init__.py`

### 4. "CORS policy error" dans le frontend

**Solution:** Vérifier `apps/python-api/.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Performance Attendue

| Résolution | Voxels | Itérations | Temps (RAM 4GB) |
|------------|--------|------------|-----------------|
| 15³        | 3,375  | 30         | ~5 secondes     |
| 20³        | 8,000  | 30         | ~15 secondes    |
| 25³        | 15,625 | 50         | ~30 secondes    |
| 30³        | 27,000 | 50         | ~60 secondes    |

**⚠️ Avec 4GB RAM, ne pas dépasser 30³ (27k voxels)**

---

**✅ Si tous les tests passent, le backend est prêt pour le déploiement Railway !**
