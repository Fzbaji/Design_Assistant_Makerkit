# 🚀 Guide de Déploiement Railway

## Étape 1: Créer un compte Railway

1. Aller sur [Railway.app](https://railway.app)
2. Cliquer sur "Start a New Project"
3. Se connecter avec GitHub

## Étape 2: Déployer le Backend Python

### Option A: Via Interface Web (Recommandé)

1. Dans Railway Dashboard, cliquer "New Project"
2. Sélectionner "Deploy from GitHub repo"
3. Autoriser Railway à accéder à votre repo GitHub
4. Sélectionner votre repo `makerkit`
5. Configurer:
   - **Root Directory**: `apps/python-api`
   - **Build Command**: (vide - Dockerfile sera utilisé)
   - **Start Command**: (vide - CMD du Dockerfile sera utilisé)

6. Ajouter variables d'environnement:
   - `ALLOWED_ORIGINS`: URL de votre frontend Next.js
     - Exemple: `https://votre-app.vercel.app,http://localhost:3000`

7. Cliquer "Deploy"

### Option B: Via Railway CLI

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser projet
cd apps/python-api
railway init

# Déployer
railway up

# Configurer variables d'environnement
railway variables set ALLOWED_ORIGINS=https://votre-app.vercel.app
```

## Étape 3: Obtenir l'URL du Backend

Après déploiement, Railway génère une URL publique:

```
https://your-app-production.up.railway.app
```

**Copiez cette URL** - vous en aurez besoin pour le frontend Next.js.

## Étape 4: Configurer le Frontend Next.js

1. Ouvrir `apps/web/.env.local`
2. Ajouter la variable d'environnement:

```env
PYTHON_API_URL=https://your-app-production.up.railway.app
```

3. **Sur Vercel** (si vous déployez le frontend):
   - Aller dans Settings > Environment Variables
   - Ajouter `PYTHON_API_URL` avec l'URL Railway

## Étape 5: Tester

1. Redémarrer le serveur Next.js local:
   ```bash
   pnpm run dev
   ```

2. Aller sur http://localhost:3000/generative-design

3. Générer un brief avec Gemini

4. Lancer l'optimisation

5. **Vérifier les logs** dans le terminal Next.js:
   ```
   📡 Appel backend Python: https://your-app-production.up.railway.app
   ✅ Optimisation terminée
   ```

## 🆓 Limites du Plan Gratuit Railway

- **500 heures d'exécution/mois** (suffisant pour développement)
- **1GB RAM** par service
- **1GB stockage**
- **Timeout 5min** par requête

**Note:** L'optimisation SIMP prend 10-30 secondes, bien sous la limite.

## 🐛 Dépannage

### Erreur: "Backend Python indisponible"

Vérifiez:
1. Le backend Railway est bien déployé (vert dans Railway Dashboard)
2. L'URL `PYTHON_API_URL` est correcte dans `.env.local`
3. Les CORS sont configurés avec votre domaine frontend

### Erreur: "Build failed"

- Vérifiez que `Dockerfile` et `requirements.txt` sont présents
- Regardez les logs de build dans Railway Dashboard

### Backend se lance mais crash

- Vérifiez les logs d'exécution dans Railway
- Assurez-vous que toutes les dépendances sont dans `requirements.txt`

## 📊 Monitoring

Railway Dashboard affiche:
- **Logs en temps réel**
- **Métriques (CPU, RAM, Network)**
- **Deployments history**

## 🔄 Redéploiement

Chaque `git push` sur votre branche principale redéploie automatiquement sur Railway.

---

**✅ Une fois déployé, votre backend SIMP sera accessible 24/7 !**
