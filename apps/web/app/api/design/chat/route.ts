import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { messages, sketchImage } = await request.json();

    console.log('💬 Chat request:', { 
      messageCount: messages.length, 
      hasSketch: !!sketchImage 
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    // Filtrer les messages pour garder seulement les messages utilisateur et modèle (exclure le premier message d'accueil)
    const userMessages = messages.filter((msg: any) => msg.role === 'user');
    const modelMessages = messages.filter((msg: any) => msg.role === 'assistant' && msg.content !== messages[0].content);

    // Construire l'historique de conversation pour Gemini (exclure le dernier message user)
    const historyMessages = messages.slice(1, -1); // Ignorer le premier (accueil) et le dernier (à envoyer)
    
    const chat = model.startChat({
      history: historyMessages
        .filter((msg: any) => msg.role !== 'assistant' || msg.content !== messages[0].content) // Exclure message d'accueil
        .map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
      generationConfig: {
        temperature: 0.7,
        topK: 20,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Dernier message de l'utilisateur
    const lastMessage = messages[messages.length - 1];
    let prompt = lastMessage.content;

    // Ajouter le contexte système au premier message utilisateur
    const isFirstUserMessage = userMessages.length === 1;
    
    if (isFirstUserMessage && !sketchImage) {
      // Premier message sans sketch : ajouter le contexte
      prompt = `[RÈGLE STRICTE : Réponds en MAXIMUM 20 mots. UNE question courte, pas de tableaux, pas d'explications.]

Message : ${prompt}

Ta réponse (max 20 mots) :`;
    }

    // Si c'est une demande de génération de fiche
    if (prompt.toLowerCase().includes('génère') || prompt.toLowerCase().includes('fiche')) {
      prompt = `${prompt}

Génère une fiche produit structurée au format JSON avec cette structure EXACTE :
{
  "productName": "Nom du produit",
  "category": "Catégorie (mobilier/électronique/accessoire/etc.)",
  "description": "Description détaillée du produit (2-3 phrases)",
  "targetAudience": "Public cible",
  "keyFeatures": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"],
  "style": "Style visuel (moderne/classique/minimaliste/industriel/etc.)",
  "materials": ["Matériau 1", "Matériau 2"],
  "colors": ["Couleur primaire", "Couleur secondaire"],
  "dimensions": "Dimensions approximatives",
  "usageContext": "Contexte d'utilisation"
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
    } else if (!isFirstUserMessage && !prompt.toLowerCase().includes('génère') && !prompt.toLowerCase().includes('fiche')) {
      // Messages intermédiaires : forcer la brièveté
      prompt = `[RÈGLE : Max 25 mots. UNE question courte. Pas de tableaux, pas de listes.]

${prompt}

Ta réponse (max 25 mots) :`;
    }

    let result;

    // Si sketch fourni, l'inclure dans l'analyse avec le contexte complet
    if (sketchImage && lastMessage.role === 'user') {
      // Convertir base64 en format Gemini
      const imageData = sketchImage.split(',')[1]; // Retirer "data:image/...;base64,"
      
      // Construire un prompt contextualisé pour l'analyse du sketch
      const sketchPrompt = `[RÈGLE : Réponds en MAXIMUM 25 mots. Analyse rapide + UNE question courte. Pas de tableaux.]

Sketch du produit : ${prompt}

Ta réponse (max 25 mots) :`;

      result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageData,
          },
        },
        { text: sketchPrompt },
      ]);
    } else {
      // Dialogue texte uniquement
      result = await chat.sendMessage(prompt);
    }

    const response = result.response;
    const text = response.text();

    console.log('✅ Gemini response:', text.substring(0, 200) + '...');

    return NextResponse.json({
      success: true,
      message: text,
    });

  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process chat message' 
      },
      { status: 500 }
    );
  }
}
