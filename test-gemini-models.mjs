import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyC0iKNiPEpZfj3-blanGMMWraTd7LoQeh8';

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    
    console.log('\n=== MODELES GEMINI DISPONIBLES ===\n');
    
    if (data.models) {
      const generateModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      console.log(`Total: ${generateModels.length} modèles supportent generateContent\n`);
      
      generateModels.forEach(model => {
        console.log(`✓ ${model.name.replace('models/', '')}`);
        console.log(`  Description: ${model.description || 'N/A'}`);
        console.log(`  Version: ${model.version || 'N/A'}`);
        console.log('');
      });
    } else if (data.error) {
      console.error('Erreur API:', data.error.message);
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

listModels();
