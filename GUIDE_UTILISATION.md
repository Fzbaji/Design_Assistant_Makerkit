# 🎮 GUIDE UTILISATEUR - Gemini Intégré

## ✅ Statut Actuel : Étape 2 Complétée

**Fonctionnel** :
- ✅ Interface UI complète
- ✅ Génération de brief avec Gemini 2.0-flash (RÉEL ✨)
- ✅ Parser automatique des briefs IA
- ✅ Optimisation (simulé)
- ✅ Affichage métriques en temps réel

**Améliorations de l'Étape 2** :
- ✨ **IA Gemini réelle** au lieu du mock
- ✨ **Briefs intelligents** adaptés au contexte
- ✨ **Parser automatique** extrait tous les paramètres
- ✨ **Valeurs réalistes** basées sur l'ingénierie

**Limitations** :
- ⚠️ Optimisation SIMP encore simulée (Étape 3)
- ⚠️ Pas de visualisation 3D STL (Étape 4)

---

## 📝 Comment Utiliser le Prototype

### **Démarrage**

1. **Ouvrir terminal** :
   ```bash
   cd C:\Users\Dell\Desktop\makerkit
   pnpm run dev
   ```

2. **Ouvrir navigateur** :
   ```
   http://localhost:3000
   ```

3. **Se connecter** :
   - Email : votre_email@example.com
   - Mot de passe : votre_mot_de_passe

4. **Aller au module** :
   - Cliquer sur "Generative Design" dans le menu latéral (icône 📦)

---

### **Phase 1 : Idéation**

#### **Option A : Mode IA (Gemini Simulé)**

1. **Cliquer** sur l'onglet "IA Générative (Gemini)"

2. **Saisir** une description naturelle :
   ```
   Je veux optimiser un support de roue pour un drone. 
   Il doit supporter 50N en compression verticale, 
   être en aluminium, dimensions 100x100x20mm, 
   avec un facteur de sécurité de 2.0
   ```

3. **Cliquer** "Générer Brief avec Gemini 2.5-flash"

4. **Attendre** 1.5 secondes (simulant l'appel API)

5. **Résultat** :
   - Brief markdown complet s'affiche
   - 7 sections : Contexte, Géométrie, Matériau, etc.

#### **Option B : Mode Manuel**

1. **Cliquer** sur l'onglet "Formulaire Manuel"

2. **Remplir** :
   - Forme : Cylindre / Boîte / Sphère
   - Matériau : Acier / Aluminium / Titane / ABS
   - Force : 1000 N (exemple)

3. **Cliquer** "Créer Brief Manuel"

4. **Résultat** :
   - Brief généré avec vos paramètres

---

### **Phase 2 : Optimisation**

1. **Après génération du brief**, cliquer "Passer à l'Optimisation →"

2. **Ajuster les paramètres** :
   - **Résolution** : 15-40 (slider)
     - 15 = rapide mais grossier
     - 40 = lent mais précis
   - **Pénalité SIMP** : 3.0 (défaut)
   - **Itérations** : 40 (défaut)

3. **Cliquer** "Lancer Optimisation"

4. **Attendre** 3 secondes :
   - Spinner animé s'affiche
   - Message "Optimisation SIMP en cours..."

5. **Résultats** :
   - ✅ Volume optimisé : ~113 cm³
   - ✅ Masse : ~67 g
   - ✅ Facteur de sécurité : 2.1
   - ✅ Réduction volume : 60%
   - ✅ Détails (itérations, compliance, contrainte max)

---

## 🔍 Que Faire Si...

### **Erreur : "Module not found"**
```bash
# Réinstaller les dépendances
pnpm install
```

### **Erreur : "Brief requis avant optimisation"**
- Retourner à Phase 1
- Générer un brief d'abord
- Puis revenir à Phase 2

### **Page blanche / erreur 500**
- Vérifier que le serveur tourne : `pnpm run dev`
- Ouvrir console navigateur (F12) pour voir les erreurs
- Vérifier les logs terminal

### **Boutons désactivés**
- **"Générer Brief"** : Entrer du texte d'abord
- **"Lancer Optimisation"** : Générer un brief d'abord

---

## 📊 Exemple Complet de Test

### **Scénario : Support de Drone**

1. **Phase 1 - IA** :
   ```
   Description : 
   "Support cylindrique en aluminium pour roue de drone.
   Doit résister à 1000N en compression verticale.
   Diamètre 60mm, hauteur 100mm.
   Volume max 40% du volume initial.
   Facteur de sécurité : 2.0"
   ```

2. **Génération** → Brief affiché avec :
   - Géométrie : Cylindre 60×100
   - Matériau : Aluminium (E=70 GPa, ν=0.33)
   - Charge : 1000N vertical
   - Contrainte : 40% volume max

3. **Phase 2** :
   - Résolution : 25
   - Pénalité : 3.0
   - Itérations : 40

4. **Optimisation** → Résultats :
   - Volume initial : 282,743 mm³
   - Volume optimisé : 113,097 mm³ (-60%)
   - Masse : 67.4 g
   - Sécurité : 2.1 ✅
   - Contrainte max : 132 MPa (< 138 MPa limite)

---

## 🚀 Prochaines Étapes

### **Pour améliorer le prototype :**

#### **Étape 2 : Gemini Réel (1h)**
- Obtenir clé API Google AI
- Remplacer mock par vraie génération IA
- Brief intelligent basé sur contexte

#### **Étape 3 : Backend Cloud (2h)**
- Déployer Python API sur Railway
- Optimisation SIMP réelle (Build123d + dl4to)
- Export fichiers STL

#### **Étape 4 : Visualisation 3D (2h)**
- Intégrer Three.js
- Afficher modèle STL dans navigateur
- Rotation, zoom, pan

---

## 📞 Support

**Problème technique ?**
1. Vérifier `PLAN_ACTION_INTEGRATION.md`
2. Vérifier console navigateur (F12)
3. Vérifier logs terminal

**Question sur le projet ?**
- Voir `DESCRIPTION_TECHNIQUE_PROJET.md` pour détails techniques
- Voir `PLAN_ACTION_INTEGRATION.md` pour roadmap

---

**Version** : Gemini Intégré v2.0  
**Date** : 29 octobre 2025  
**Statut** : ✅ Étape 2/3 complétée (70%)
