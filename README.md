# 🎨 Design Assistant 

## ✅ Ce qui a été implémenté

### 📁 Structure créée

```
apps/web/
├── app/
│   ├── design-assistant/
│   │   ├── page.tsx                    # Dashboard principal
│   │   ├── layout.tsx
│   │   ├── briefing/
│   │   │   └── page.tsx                # Phase 1: Chat avec IA
│   │   └── concepts/
│   │       └── page.tsx                # Phase 2: Gallery de concepts
│   └── api/
│       └── design/
│           ├── prepare-brief/
│           │   └── route.ts            # API Gemini pour briefing
│           └── generate-concepts/
│               └── route.ts            # API Stable Diffusion
```

### 🎯 Fonctionnalités opérationnelles

#### **Phase 1: Briefing Intelligent** ✅
- Interface conversationnelle avec Gemini
- Upload de sketch (image)
- Questions guidées par l'IA
- Génération de fiche de briefing structurée
- Navigation fluide

#### **Phase 2: Génération de Concepts** ✅
- Intégration Stable Diffusion (via Replicate ou Hugging Face)
- Génération de 4 variantes de design
- Gallery interactive avec sélection
- Mode demo avec placeholders
- Bouton regénération

---

## 🚀 Comment tester

### 1. **Démarrer le serveur Next.js**

```powershell
cd c:\Users\Dell\Desktop\makerkit
pnpm run dev
```

Le serveur démarrera sur **http://localhost:3000**

### 2. **Accéder au Design Assistant**

- Ouvrez http://localhost:3000
- Connectez-vous (si nécessaire)
- Cliquez sur "Design Assistant" dans la navigation
- Ou allez directement sur http://localhost:3000/design-assistant

### 3. **Phase 1: Créer un briefing**

1. Cliquez sur "Commencer le briefing"
2. Décrivez votre produit (ex: "Je veux créer une lampe de bureau moderne pour étudiants")
3. L'IA vous posera des questions pour affiner
4. Répondez jusqu'à avoir la fiche complète
5. Validez pour passer à la Phase 2

### 4. **Phase 2: Générer des concepts**

1. L'IA génère 4 variantes visuelles
2. Sélectionnez votre concept préféré
3. Téléchargez si vous voulez
4. (Phase 3 à venir)

---

## 🔑 Configuration des API (Optionnel)

Pour générer de vraies images (sinon mode demo) :

### Option A: Replicate (Recommandé)

1. Créez un compte sur https://replicate.com
2. Obtenez votre API token: https://replicate.com/account/api-tokens
3. Ajoutez dans `.env.local`:
   ```bash
   REPLICATE_API_TOKEN=r8_xxx...
   ```

### Option B: Hugging Face (Gratuit)

1. Créez un compte sur https://huggingface.co
2. Obtenez votre token: https://huggingface.co/settings/tokens
3. Ajoutez dans `.env.local`:
   ```bash
   HUGGINGFACE_API_TOKEN=hf_xxx...
   ```

**Sans API key** : Le système fonctionne en mode demo avec des placeholders colorés.

---

## 📦 Dépendances installées

```json
{
  "replicate": "^1.3.1",  // Pour Stable Diffusion
  "@google/generative-ai": "^0.24.1"  // Déjà installé
}
```

---

## 🎨 Types de produits suggérés pour tester

- **Électronique**: Écouteurs sans fil, souris ergonomique, chargeur portable
- **Mobilier**: Lampe de bureau, étagère murale, chaise ergonomique
- **Ustensile**: Bouteille réutilisable, lunch box, tasse thermos
- **Accessoire**: Porte-clés, étui téléphone, sac à dos
- **Sport**: Gourde sport, montre connectée, vélo pliable

**Exemple de prompt complet** :
```
Je veux créer une bouteille d'eau réutilisable pour sportifs.
Style moderne et minimaliste.
Avec indicateur de niveau d'eau et isolation thermique.
Pour un public jeune actif (20-35 ans).
Budget moyen, matériau durable (inox ou tritan).
```

---

## 🔄 Prochaines phases (À venir)

### Phase 3: Décomposition en Composants
- Segmentation du concept choisi
- 3 variantes par composant (ex: bouchon, corps, base)
- Mix & Match interactif

### Phase 4: Modèle 3D
- TripoSR (image → 3D)
- Viewer Three.js interactif
- Export GLB/GLTF

### Phase 5: Documentation Finale
- Timeline du processus
- Export PDF
- Spécifications techniques

---

## 🐛 Troubleshooting

### Le chat ne répond pas
- Vérifiez que `GEMINI_API_KEY` est dans `.env.local`
- Rechargez la page
- Vérifiez la console du navigateur

### Les images ne se génèrent pas
- Normal sans API key (mode demo)
- Ajoutez `REPLICATE_API_TOKEN` ou `HUGGINGFACE_API_TOKEN`
- Relancez le serveur après ajout de clé

### Erreur "Product brief not found"
- Complétez d'abord la Phase 1 (briefing)
- Ne naviguez pas directement vers `/concepts`

---

## 📝 État actuel

✅ **PHASE 1 COMPLETE**: Briefing intelligent avec Gemini
✅ **PHASE 2 COMPLETE**: Génération de concepts visuels
⏳ **PHASE 3-5**: À développer

---

Le module `/design-assistant` est maintenant fonctionnel.

**Lancez le serveur et testez** :
```powershell
pnpm run dev
```

Puis ouvrez http://localhost:3000/design-assistant

Bon design ! 🚀
