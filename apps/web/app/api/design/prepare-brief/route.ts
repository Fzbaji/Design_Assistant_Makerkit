import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, sketchFile } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    // Build conversation context
    const conversationHistory = messages
      .map((msg: Message) => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // System prompt for briefing assistant
    const systemPrompt = `Tu es un assistant de design produit expert. Ton rôle est d'aider l'utilisateur à structurer son idée de produit en posant des questions pertinentes.

OBJECTIF: Collecter toutes les informations nécessaires pour créer une fiche de briefing complète avec:
- Catégorie du produit (électronique, mobilier, ustensile, accessoire, etc.)
- Public cible (âge, profession, contexte d'usage)
- Fonction principale
- Caractéristiques clés (3-5 éléments)
- Style visuel souhaité (moderne, vintage, minimaliste, industriel, etc.)
- Contraintes (taille, matériaux, budget, etc.)

COMPORTEMENT:
- Pose UNE question à la fois
- Reste concis et amical
- Valide la compréhension en reformulant
- Quand tu as toutes les infos, propose un résumé
- Si l'utilisateur confirme le résumé, réponds avec "BRIEFING_COMPLETE" suivi de la fiche au format JSON

FORMAT JSON du briefing complet:
{
  "category": "...",
  "targetAudience": "...",
  "mainFunction": "...",
  "keyFeatures": ["...", "...", "..."],
  "style": "...",
  "constraints": ["...", "..."]
}

Conversation actuelle:
${conversationHistory}

Réponds maintenant:`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Check if briefing is complete
    if (responseText.includes('BRIEFING_COMPLETE')) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const brief = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          message: 'Parfait ! Voici votre fiche de briefing complète.',
          brief,
          complete: true,
        });
      }
    }

    return NextResponse.json({
      message: responseText,
      brief: null,
      complete: false,
    });
  } catch (error: any) {
    console.error('Error in prepare-brief:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la préparation du briefing',
      },
      { status: 500 }
    );
  }
}
