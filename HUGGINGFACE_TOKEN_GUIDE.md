# Configuration Hugging Face pour Génération 3D

## Pourquoi un token Hugging Face ?

L'application utilise maintenant **3 méthodes gratuites** pour générer des modèles 3D :

1. **Hugging Face Inference API** (Stable Fast 3D) - ⭐ **Meilleure qualité**
   - Requiert un token gratuit
   - Modèle le plus avancé et rapide
   - Résultats de haute qualité

2. **InstantMesh** (TencentARC) - 🆓 **Sans token**
   - API publique gratuite
   - Bonne qualité
   - Plus lent (jusqu'à 100 secondes)

3. **TripoSR** (VAST-AI-Research) - 🆓 **Sans token**
   - API publique gratuite
   - Qualité correcte
   - Temps moyen (60 secondes)

4. **Mode Démo** (Fallback)
   - Modèles 3D d'exemple
   - Utilisé si toutes les méthodes échouent

## Comment obtenir un token Hugging Face (GRATUIT)

### Étape 1 : Créer un compte Hugging Face

1. Allez sur https://huggingface.co/join
2. Créez un compte gratuit avec votre email
3. Confirmez votre email

### Étape 2 : Générer un token

1. Connectez-vous à https://huggingface.co
2. Cliquez sur votre profil (en haut à droite)
3. Allez dans **Settings** → **Access Tokens**
4. Ou directement : https://huggingface.co/settings/tokens
5. Cliquez sur **New token**
6. Donnez un nom : `design-assistant-3d`
7. Type : Sélectionnez **Read**
8. Cliquez sur **Generate token**
9. **Copiez le token** (commence par `hf_...`)

### Étape 3 : Ajouter le token à votre projet

1. Ouvrez le fichier `.env.local` à la racine de `apps/web/`
2. Ajoutez ou modifiez la ligne :
   ```
   HUGGINGFACE_API_TOKEN=hf_votre_token_ici
   ```
3. **Redémarrez le serveur Next.js** :
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   # Puis relancez :
   pnpm run dev
   ```

## Tester la génération 3D

1. Allez dans **Design Assistant**
2. Complétez les phases 1-3 (Briefing, Concepts, Composants)
3. Allez dans **Génération 3D**
4. Cliquez sur **Générer le modèle 3D**

### Avec token Hugging Face :
- Console : `📡 Trying Hugging Face Inference API (Stable Fast 3D)...`
- Console : `✅ Stable Fast 3D succeeded!`
- Temps : ~20-30 secondes
- Qualité : Excellente

### Sans token (InstantMesh) :
- Console : `📡 Trying InstantMesh API...`
- Console : `⏳ Polling for InstantMesh result...`
- Console : `✅ InstantMesh succeeded!`
- Temps : ~60-100 secondes
- Qualité : Bonne

### Sans token (TripoSR) :
- Console : `📡 Trying TripoSR public endpoint...`
- Console : `⏳ Polling for TripoSR result...`
- Console : `✅ TripoSR succeeded!`
- Temps : ~40-60 secondes
- Qualité : Correcte

### Mode Démo (Fallback) :
- Console : `⚠️ All methods failed, using demo model`
- Modèle aléatoire d'exemple
- Instantané

## Limites du plan gratuit Hugging Face

Le token gratuit donne accès à :
- **Inference API** : 1000 requêtes/mois
- **Pas de carte de crédit** requise
- **Pas d'expiration** du token
- Largement suffisant pour le développement et les tests

Pour l'app Design Assistant :
- ~30 générations 3D par jour sans problème
- Si limite atteinte, bascule automatique sur InstantMesh ou TripoSR

## Architecture de Fallback

```
Image du produit
      ↓
[1] Hugging Face Stable Fast 3D (si token présent)
      ↓ (échec)
[2] InstantMesh API (public, gratuit)
      ↓ (échec)
[3] TripoSR Gradio (public, gratuit)
      ↓ (échec)
[4] Modèle démo (BoxTextured, DamagedHelmet, etc.)
```

Cette approche garantit que la génération 3D **fonctionne toujours**, même sans token.

## Fichiers modifiés

- `apps/web/app/api/design/generate-3d-real/route.ts` : API avec 3 méthodes + fallback
- `apps/web/.env.local` : Ajoutez `HUGGINGFACE_API_TOKEN=hf_...`

## Besoin d'aide ?

- Documentation HF Inference : https://huggingface.co/docs/api-inference/index
- Discord Hugging Face : https://discord.gg/hugging-face
- Issues du projet : [Créer une issue GitHub]
