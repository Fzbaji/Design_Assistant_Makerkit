import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Endpoint de test pour vérifier si Gemini fonctionne
 * Accès: http://localhost:3000/api/generative-design/test-gemini
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GEMINI_API_KEY non trouvée dans les variables d\'environnement',
          hint: 'Vérifiez que .env.local contient GEMINI_API_KEY=...'
        },
        { status: 500 }
      );
    }

    // Test simple avec Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = 'Réponds en une phrase: es-tu Gemini de Google?';

    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const responseTime = Date.now() - startTime;

    const text = result.response.text();

    return NextResponse.json({
      success: true,
      message: '✅ Gemini fonctionne correctement !',
      data: {
        apiKeyPresent: true,
        apiKeyPrefix: `${apiKey.substring(0, 12)}...`,
        model: 'gemini-2.0-flash-exp',
        testPrompt: prompt,
        geminiResponse: text,
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du test Gemini',
        details: error.message,
        hint: 'Vérifiez que votre clé API est valide sur https://aistudio.google.com/app/apikey',
      },
      { status: 500 }
    );
  }
}
