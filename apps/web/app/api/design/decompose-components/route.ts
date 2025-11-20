import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, style } = await request.json();

    // Use Gemini Flash (same model as briefing)
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const systemPrompt = `Tu es un expert en design industriel et décomposition de produits.

Analyse cette image de produit et identifie TOUS les composants distincts qui peuvent être personnalisés séparément.

Pour chaque composant détecté, fournis :
1. Un nom court et descriptif
2. Une description détaillée de sa fonction
3. Des suggestions de variations possibles

Exemples de composants selon le type de produit :
- Lampe : base, pied/support, abat-jour, interrupteur, câble
- Chaise : dossier, assise, pieds, accoudoirs, coussins
- Bouteille : bouchon, corps, étiquette, base
- Téléphone : écran, boîtier arrière, boutons, caméras, ports

Retourne un JSON structuré avec ce format :
{
  "components": [
    {
      "id": "component-1",
      "name": "Nom du composant",
      "description": "Description détaillée de ce composant",
      "suggestions": ["variation 1", "variation 2", "variation 3"]
    }
  ]
}

Contexte du produit :
- Style : ${style}
- Description : ${prompt}

IMPORTANT : Détecte au minimum 3 composants et au maximum 6 composants principaux.
Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

    // For now, we'll use text analysis since we're using a URL
    // In production, you'd fetch the image and convert to base64
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Transform to match our component structure
    const components = parsed.components.map((comp: any, index: number) => ({
      id: comp.id || `component-${index + 1}`,
      name: comp.name,
      description: comp.description,
      suggestions: comp.suggestions || [
        `${comp.name} - style moderne`,
        `${comp.name} - style classique`,
        `${comp.name} - style minimaliste`,
      ],
      variants: [], // Will be filled by generate-variants API
      selectedVariant: 0,
    }));

    console.log(`✓ Detected ${components.length} components:`, components.map(c => c.name));

    return NextResponse.json({
      success: true,
      components,
    });
  } catch (error: any) {
    console.error('Error decomposing product:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la décomposition du produit',
      },
      { status: 500 }
    );
  }
}
