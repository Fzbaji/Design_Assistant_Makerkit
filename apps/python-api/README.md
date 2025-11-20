# Backend Python - Optimisation Topologique SIMP

Backend FastAPI pour l'optimisation topologique de pièces mécaniques.

## 🚀 Technologies

- **FastAPI**: Framework web Python moderne
- **NumPy + SciPy**: Calcul scientifique pour SIMP
- **Build123d**: Génération de géométries 3D et export STL
- **Railway**: Déploiement cloud (free tier)

## 📦 Installation Locale

```bash
# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer dépendances
pip install -r requirements.txt

# Configurer variables d'environnement
cp .env.example .env

# Lancer serveur
python main.py
```

Le serveur démarre sur http://localhost:8000

## 🌐 Déploiement Railway

1. Créer compte sur [Railway.app](https://railway.app)
2. Installer Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```
3. Login et déployer:
   ```bash
   railway login
   railway init
   railway up
   ```
4. Configurer variables d'environnement dans Railway Dashboard:
   - `ALLOWED_ORIGINS`: URL de votre frontend Next.js

## 📡 API Endpoints

### POST /api/optimize
Optimise une pièce avec SIMP et retourne un fichier STL.

**Request Body:**
```json
{
  "geometry": {
    "shape": "box",
    "dimensions": [100, 100, 100]
  },
  "material": {
    "name": "acier",
    "youngs_modulus": 200e9,
    "poisson_ratio": 0.3,
    "density": 7850
  },
  "loads": {
    "force_magnitude": 1000,
    "force_direction": [0, 0, -1]
  },
  "constraints": {
    "volume_fraction": 0.4,
    "fixed_faces": ["bottom"]
  },
  "optimization": {
    "resolution": 25,
    "iterations": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "stl_url": "/api/download/optimized_part.stl",
  "metrics": {
    "volume_initial": 1000000,
    "volume_optimized": 400000,
    "volume_reduction": 60,
    "mass_kg": 3.14,
    "compliance_history": [...]
  }
}
```

### GET /api/download/{filename}
Télécharge un fichier STL généré.

## 🧮 Algorithme SIMP

**Solid Isotropic Material with Penalization** - méthode standard pour l'optimisation topologique.

**Principe:**
1. Discrétiser la pièce en grille 3D de voxels
2. Assigner densité initiale (0=vide, 1=plein)
3. Pour chaque itération:
   - Simuler comportement mécanique (FEA)
   - Calculer sensibilités (gradient de compliance)
   - Mettre à jour densités (méthode OC)
   - Filtrer pour éviter damier
4. Exporter zones denses (>threshold) en STL

**Optimisé pour 4GB RAM:** Résolution 25³ = 15,625 voxels max

## 📊 Métriques Retournées

- `volume_reduction`: % de matière économisée
- `mass_kg`: Masse finale de la pièce
- `compliance`: Flexibilité (plus bas = plus rigide)
- `compliance_history`: Évolution sur itérations

## 🔧 Configuration

Voir `.env.example` pour les variables d'environnement.

## 📝 Licence

Projet personnel - Optimisation topologique avec IA générative
