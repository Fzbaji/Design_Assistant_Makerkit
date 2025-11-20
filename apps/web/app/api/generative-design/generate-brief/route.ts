import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseBrief } from '~/lib/brief-parser';

export async function POST(request: NextRequest) {
  try {
    const { description, mode } = await request.json();

    let brief = '';
    let parsedParams = {};

    if (mode === 'ai') {
      // Mode IA : Appel réel à Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      // Utiliser gemini-flash-latest (alias stable, gratuit, rapide)
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

      const prompt = `Tu es un expert en ingénierie mécanique et optimisation topologique.

Génère un brief d'optimisation topologique détaillé et technique basé sur cette description :
"${description}"

Le brief doit être au format Markdown avec EXACTEMENT ces 7 sections :

## 1. Contexte
[Expliquer le contexte d'utilisation de la pièce]

## 2. Géométrie
**Forme** : Cylinder | Box | Sphere (choisir la plus appropriée)
**Dimensions** : [dimensions en mm] (format: LxWxH ou Diamètre x Hauteur)
**Volume initial** : [calculer en mm³]

## 3. Matériau
**Type** : [Acier | Aluminium | Titane | ABS | PLA - choisir le plus approprié]
**Module de Young (E)** : [valeur en GPa]
**Coefficient de Poisson (ν)** : [valeur entre 0.2 et 0.4]
**Limite élastique (σ_ys)** : [valeur en MPa]
**Densité** : [valeur en kg/m³]

## 4. Conditions Limites
**Fixation** : [Bottom | Top | Side - spécifier où]
**Type** : Encastrement complet
**Position** : [coordonnée z ou description]

## 5. Chargements
**Force** : [valeur en N]
**Direction** : [+Z | -Z | +X | -X | +Y | -Y]
**Position** : [où s'applique la force]
**Type** : Force distribuée

## 6. Contraintes
**Volume maximal** : [30-50]% du volume initial (recommandé: 40%)
**Facteur de sécurité** : [1.5-3.0] (recommandé: 2.0)
**Contrainte maximale admissible** : [calculer = σ_ys / facteur de sécurité en MPa]

## 7. Paramètres d'Optimisation
**Résolution** : 25 voxels (défaut)
**Pénalité SIMP** : 3.0 (défaut)
**Nombre d'itérations** : 40 (défaut)
**Critère de convergence** : 0.01

---

IMPORTANT : 
- Utilise des valeurs réalistes et cohérentes
- Les dimensions doivent être adaptées à l'application
- Le matériau doit être approprié (ex: aluminium pour aéronautique, acier pour structure lourde)
- Calcule correctement les volumes et contraintes
- Sois précis avec les unités (GPa, MPa, mm, N)`;

      try {
        const result = await model.generateContent(prompt);
        brief = result.response.text();
        
        // Parser le brief généré par Gemini
        parsedParams = parseBrief(brief);
      } catch (error) {
        console.error('Erreur Gemini:', error);
        return NextResponse.json(
          { success: false, error: 'Échec de génération avec Gemini: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else {
      // Mode manuel : Brief basé sur les données du formulaire
      brief = `# Brief d'Optimisation Topologique (Manuel)

## 1. Contexte
Brief créé manuellement via le formulaire

## 2. Géométrie
**Forme** : ${description?.shape || 'Cylinder'}
**Dimensions** : ${description?.dimensions || '100x100x20'} mm

## 3. Matériau
**Type** : ${description?.material || 'Acier'}
**Module de Young (E)** : 210 GPa
**Coefficient de Poisson (ν)** : 0.3

## 4. Conditions Limites
**Fixation** : Face inférieure

## 5. Chargements
**Force** : ${description?.force || '1000'} N
**Direction** : -Z

## 6. Contraintes
**Volume maximal** : 40%
**Facteur de sécurité** : 2.0

## 7. Paramètres d'Optimisation
**Résolution** : 25
**Pénalité SIMP** : 3.0
**Itérations** : 40

---

*Brief créé manuellement*`;

      parsedParams = parseBrief(brief);
    }

    return NextResponse.json({
      success: true,
      brief_text: brief,
      parsed_params: parsedParams,
    });
  } catch (error) {
    console.error('Erreur génération brief:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du brief' },
      { status: 500 }
    );
  }
}
