# 🚀 PLAN D'ACTION - Intégration Projet Optimisation Topologique dans Makerkit

## ✅ Phase 1: Configuration de Base (TERMINÉ - 30 min)

### Ce qui a été fait:

1. **✅ Navigation ajoutée**
   - Route `/generative-design` configurée dans `paths.config.ts`
   - Menu latéral avec icône "Boxes" dans `navigation.config.tsx`
   - Traduction "Generative Design" dans `common.json`

2. **✅ Interface UI créée**
   - Layout responsive dans `app/generative-design/layout.tsx`
   - Page principale avec 2 phases (Idéation + Optimisation)
   - Composants Shadcn/UI (Card, Tabs, Button, Slider, etc.)

3. **✅ Serveur démarré**
   - Commande: `pnpm run dev`
   - Accessible sur: http://localhost:3000/generative-design

---

## 📋 Phase 2: Backend Python (TODO - 2-3h)

### Objectif: Créer l'API Python pour le traitement

#### Étape 2.1: Structure des dossiers
```
makerkit/
├── apps/
│   ├── web/          (Next.js - déjà fait ✅)
│   └── python-api/   (À créer 🔨)
│       ├── main.py
│       ├── requirements.txt
│       ├── utils/
│       │   ├── brief_parser.py
│       │   ├── gemini_client.py
│       │   └── optimizer.py
│       └── config/
│           └── .env
```

#### Étape 2.2: Technologies à installer
```bash
# Dans apps/python-api/
pip install fastapi uvicorn
pip install google-generativeai
pip install build123d dl4to dl4to4ocp
pip install pyvista numpy trimesh
pip install python-dotenv
```

#### Étape 2.3: Créer `apps/python-api/main.py`
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from utils.brief_parser import parse_brief
from utils.optimizer import run_optimization

app = FastAPI()

# CORS pour Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    description: str

class BriefResponse(BaseModel):
    brief_text: str
    parsed_params: dict

@app.post("/api/generate-brief", response_model=BriefResponse)
async def generate_brief(request: PromptRequest):
    """Génère un brief via Gemini 2.5-flash"""
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    Génère un brief d'optimisation topologique pour:
    {request.description}
    
    Format markdown avec sections:
    1. Contexte
    2. Géométrie (Forme, Dimensions)
    3. Matériau (Type, E, ν, σ_ys)
    4. Conditions limites (Fixations)
    5. Chargements (Force, Direction, Position)
    6. Contraintes (Volume max, Sécurité)
    7. Paramètres optimisation (Résolution, Pénalité)
    """
    
    response = model.generate_content(prompt)
    brief = response.text
    params = parse_brief(brief)
    
    return BriefResponse(brief_text=brief, parsed_params=params)

@app.post("/api/optimize")
async def optimize(params: dict):
    """Lance l'optimisation SIMP"""
    result = run_optimization(params)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### Étape 2.4: Créer `utils/brief_parser.py`
```python
import re

def parse_brief(brief_text: str) -> dict:
    """Parse le brief markdown et extrait paramètres structurés"""
    
    params = {
        "geometry": extract_geometry(brief_text),
        "material": extract_material(brief_text),
        "boundary_conditions": extract_boundary_conditions(brief_text),
        "loads": extract_loads(brief_text),
        "constraints": extract_constraints(brief_text),
        "optimization": extract_optimization(brief_text)
    }
    
    return params

def extract_geometry(text: str) -> dict:
    """Extrait forme, dimensions, etc."""
    shape_match = re.search(r'Forme:\s*(\w+)', text, re.IGNORECASE)
    dim_match = re.search(r'Dimensions:\s*(\d+)x(\d+)x?(\d+)?', text, re.IGNORECASE)
    
    shape_mapping = {
        'cylindre': 'Cylinder',
        'boîte': 'Box',
        'sphère': 'Sphere'
    }
    
    return {
        "shape": shape_mapping.get(shape_match.group(1).lower(), "Cylinder") if shape_match else "Cylinder",
        "dimensions": [int(dim_match.group(1)), int(dim_match.group(2)), int(dim_match.group(3) or 0)] if dim_match else [100, 100, 20]
    }

def extract_material(text: str) -> dict:
    """Extrait propriétés matériau"""
    materials_db = {
        'acier': {'E': 210e9, 'nu': 0.3, 'density': 7850},
        'aluminium': {'E': 70e9, 'nu': 0.33, 'density': 2700},
        'titane': {'E': 110e9, 'nu': 0.34, 'density': 4500},
        'abs': {'E': 2.3e9, 'nu': 0.39, 'density': 1050}
    }
    
    # Détection matériau dans texte
    for mat_name, props in materials_db.items():
        if mat_name in text.lower():
            return props
    
    return materials_db['acier']  # Défaut

# ... (autres fonctions extract_*)
```

#### Étape 2.5: Créer `utils/optimizer.py`
```python
from build123d import Box, Cylinder, export_stl
from dl4to4ocp import voxelize
from dl4to.pde import LinearElasticity
from dl4to.criteria import Compliance
from dl4to.algorithms import SIMP_GD
import pyvista as pv
import numpy as np

def run_optimization(params: dict):
    """Lance l'optimisation topologique SIMP"""
    
    # 1. Créer géométrie initiale
    geometry = create_geometry(params['geometry'])
    
    # 2. Voxeliser
    resolution = params['optimization']['resolution']
    voxels, coords = voxelize(geometry, resolution)
    
    # 3. Configurer PDE
    pde = LinearElasticity(
        young_modulus=params['material']['E'],
        poisson_ratio=params['material']['nu']
    )
    
    # 4. SIMP
    optimizer = SIMP_GD(
        pde=pde,
        criterion=Compliance(),
        volume_fraction=params['constraints']['volume_fraction'],
        penalty=params['optimization']['penalty']
    )
    
    # 5. Optimiser
    density = optimizer.solve(
        voxels=voxels,
        loads=params['loads'],
        fixed_nodes=params['boundary_conditions'],
        max_iterations=params['optimization']['iterations']
    )
    
    # 6. Export STL
    mesh = density_to_mesh(density, coords)
    stl_path = export_stl(mesh, "optimized.stl")
    
    # 7. Métriques
    metrics = compute_metrics(mesh, density, params)
    
    return {
        "stl_url": f"/outputs/{stl_path}",
        "metrics": metrics,
        "density_field": density.tolist()
    }

def create_geometry(geometry_params: dict):
    """Crée géométrie Build123d"""
    shape = geometry_params['shape']
    dims = geometry_params['dimensions']
    
    if shape == 'Cylinder':
        return Cylinder(radius=dims[0]/2, height=dims[2])
    elif shape == 'Box':
        return Box(dims[0], dims[1], dims[2])
    # ...
```

---

## 📋 Phase 3: Connexion Frontend ↔ Backend (TODO - 1h)

### Étape 3.1: Créer API Routes Next.js

**Fichier:** `apps/web/app/api/generative-design/generate-brief/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { description } = await request.json();
  
  // Appeler Python API
  const response = await fetch('http://localhost:8000/api/generate-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

**Fichier:** `apps/web/app/api/generative-design/optimize/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const params = await request.json();
  
  const response = await fetch('http://localhost:8000/api/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

### Étape 3.2: Modifier `page.tsx` pour appeler API

```typescript
// Dans handleGenerateBrief()
const handleGenerateBrief = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/generative-design/generate-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: userDescription })
    });
    
    const data = await response.json();
    setBrief(data.brief_text);
    setParsedParams(data.parsed_params);
  } catch (error) {
    console.error('Erreur génération:', error);
  } finally {
    setLoading(false);
  }
};

// Dans handleRunOptimization()
const handleRunOptimization = async () => {
  setOptimizing(true);
  try {
    const response = await fetch('/api/generative-design/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedParams)
    });
    
    const data = await response.json();
    setStlUrl(data.stl_url);
    setMetrics(data.metrics);
  } catch (error) {
    console.error('Erreur optimisation:', error);
  } finally {
    setOptimizing(false);
  }
};
```

---

## 📋 Phase 4: Visualisation 3D (TODO - 2h)

### Option A: Three.js (dans navigateur)
```bash
pnpm add three @react-three/fiber @react-three/drei
```

**Composant:** `apps/web/components/stl-viewer.tsx`
```typescript
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, STLLoader } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';

export function STLViewer({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  
  return (
    <Canvas camera={{ position: [0, 0, 100] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <mesh geometry={geometry}>
        <meshStandardMaterial color="orange" />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
}
```

### Option B: PyVista via WebSocket (temps réel)
```python
# Dans Python API
import pyvista as pv
from fastapi import WebSocket

@app.websocket("/ws/visualization")
async def websocket_visualization(websocket: WebSocket):
    await websocket.accept()
    plotter = pv.Plotter(off_screen=True)
    # Stream images en PNG
```

---

## 📋 Phase 5: Variables d'environnement (TODO - 10 min)

### Ajouter dans `apps/web/.env.local`
```env
# API Python
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000

# Gemini (à obtenir sur https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_key_here
```

### Ajouter dans `apps/python-api/.env`
```env
GEMINI_API_KEY=your_key_here
SUPABASE_URL=https://rikleltbtfloiotvfvgm.supabase.co
SUPABASE_KEY=your_key_here
```

---

## 📋 Phase 6: Tests & Déploiement (TODO - 1h)

### Tests locaux
1. **Terminal 1:** `pnpm run dev` (Next.js sur :3000)
2. **Terminal 2:** `cd apps/python-api && python main.py` (FastAPI sur :8000)
3. **Navigateur:** http://localhost:3000/generative-design

### Déploiement
- **Frontend (Next.js):** Vercel
- **Backend (Python):** Railway / Render / DigitalOcean
- **Base de données:** Supabase (déjà configuré ✅)

---

## 🎯 RÉSUMÉ - PROCHAINES ÉTAPES

### À faire maintenant:

1. **Tester l'interface actuelle**
   - Aller sur http://localhost:3000
   - Se connecter (créer compte si besoin)
   - Naviguer vers "Generative Design" dans le menu

2. **Créer le dossier Python API**
   ```bash
   mkdir apps/python-api
   cd apps/python-api
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install fastapi uvicorn google-generativeai
   ```

3. **Obtenir clé API Gemini**
   - Aller sur https://makersuite.google.com/app/apikey
   - Créer nouvelle clé
   - Ajouter dans `.env.local`

4. **Implémenter `main.py` et `brief_parser.py`**
   - Utiliser le code ci-dessus comme base

5. **Tester le flux complet**
   - Prompt → Brief → Optimisation → STL

---

## 📚 Ressources

- **Makerkit Docs:** https://makerkit.dev/docs
- **Shadcn/UI:** https://ui.shadcn.com
- **Gemini API:** https://ai.google.dev/gemini-api/docs
- **Build123d:** https://github.com/gumyr/build123d
- **dl4to:** https://github.com/dl4to/dl4to

---

## ⏱️ Timeline Estimée

| Phase | Durée | Statut |
|-------|-------|--------|
| Phase 1: UI Makerkit | 30 min | ✅ FAIT |
| **Étape 1: Prototype Mock** | **30 min** | **✅ FAIT** |
| Étape 2: Gemini Réel | 1h | 🔨 TODO |
| Étape 3: Cloud Backend | 2h | 🔨 TODO |
| Phase 4: Visualisation 3D | 2h | 🔨 TODO |
| Phase 6: Tests | 1h | 🔨 TODO |
| **TOTAL** | **7-8h** | **40% complété** |

---

## ✅ **ÉTAPE 1 TERMINÉE : Prototype Mock**

### **Ce qui a été créé :**

#### 1️⃣ **API Routes Next.js (Mock)**
```
apps/web/app/api/generative-design/
├── generate-brief/route.ts   ✅ Simule Gemini (1.5s délai)
└── optimize/route.ts          ✅ Simule SIMP (3s délai)
```

**Features** :
- ✅ Mode IA : Génère brief détaillé avec 7 sections
- ✅ Mode Manuel : Utilise données du formulaire
- ✅ Parsing automatique → `parsed_params`
- ✅ Optimisation simulée avec métriques réalistes
- ✅ Champ de densité 3D généré (pour visualisation future)

#### 2️⃣ **UI Mise à Jour**
```typescript
apps/web/app/generative-design/page.tsx
```

**Nouvelles fonctionnalités** :
- ✅ États de chargement (`isGenerating`, `isOptimizing`)
- ✅ Spinner animé pendant traitement
- ✅ Affichage des métriques en temps réel
- ✅ Validation (brief requis avant optimisation)
- ✅ Feedback visuel (succès/erreur)

#### 3️⃣ **Données Simulées Réalistes**

**Génération Brief** :
```json
{
  "geometry": { "shape": "Cylinder", "dimensions": [60, 100] },
  "material": { "E": 70e9, "nu": 0.33, "density": 2700 },
  "loads": { "magnitude": 1000, "direction": "-Z" },
  "constraints": { "volume_fraction": 0.4 }
}
```

**Résultats Optimisation** :
```json
{
  "volume_optimized": 113,097 mm³,
  "mass": 67.4 g,
  "safety_factor": 2.1,
  "volume_reduction": 60%,
  "iterations_completed": 40
}
```

---

### **🎮 Comment Tester Maintenant**

1. **Ouvrir** : http://localhost:3000/generative-design

2. **Phase 1 - Mode IA** :
   - Saisir : "Je veux un support cylindrique en aluminium pour 1000N"
   - Cliquer "Générer Brief"
   - Attendre 1.5s → Brief s'affiche ✅

3. **Phase 1 - Mode Manuel** :
   - Sélectionner Cylindre, Aluminium, 1000N
   - Cliquer "Créer Brief"
   - Brief généré instantanément ✅

4. **Phase 2 - Optimisation** :
   - Cliquer "Passer à l'Optimisation"
   - Ajuster résolution (15-40)
   - Cliquer "Lancer Optimisation"
   - Attendre 3s → Métriques s'affichent ✅

**Résultats attendus** :
- Volume : ~113 cm³
- Masse : ~67 g
- Sécurité : 2.1
- Réduction : 60%

---

## � **PROCHAINE ÉTAPE : Gemini Réel**

### **Étape 2 : Intégration Gemini (1h)**

#### Objectif
Remplacer la génération mock par vraie API Gemini

#### Actions
1. **Obtenir clé API**
   - Aller sur https://makersuite.google.com/app/apikey
   - Créer nouvelle clé
   - Copier la clé

2. **Configurer `.env.local`**
   ```env
   GEMINI_API_KEY=AIzaSyC...votre_clé_ici
   ```

3. **Installer SDK Gemini**
   ```bash
   pnpm add @google/generative-ai --filter web
   ```

4. **Modifier API Route**
   ```typescript
   // apps/web/app/api/generative-design/generate-brief/route.ts
   import { GoogleGenerativeAI } from '@google/generative-ai';
   
   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
   const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
   
   const result = await model.generateContent(prompt);
   const brief = result.response.text();
   ```

5. **Tester**
   - Même interface
   - Maintenant avec vraie IA ✨

---

## 📋 **ÉTAPE 3 : Backend Cloud (2h)**

### **Pourquoi Cloud ?**
- ✅ Votre machine : 4GB RAM → seulement Next.js
- ✅ Cloud : 16GB RAM → Python + SIMP complet
- ✅ Gratuit avec Railway/Render

### **Architecture**
```
localhost:3000 (Next.js)  ──HTTP──>  railway.app (Python API)
     4GB RAM ✅                        Build123d + SIMP
                                       16GB RAM ✅
```

### **Déploiement Railway (Gratuit)**

1. **Créer compte** : https://railway.app

2. **Structure Backend**
   ```
   apps/python-api/
   ├── main.py
   ├── requirements.txt
   ├── railway.toml
   └── utils/
       ├── brief_parser.py
       └── optimizer.py
   ```

3. **Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

4. **Connecter Next.js**
   ```env
   # .env.local
   NEXT_PUBLIC_PYTHON_API_URL=https://votre-app.railway.app
   ```

---

**Créé le:** 29 octobre 2025  
**Projet:** Optimisation Topologique IA  
**Stack:** Next.js + Makerkit + Python + Gemini + Build123d + SIMP
