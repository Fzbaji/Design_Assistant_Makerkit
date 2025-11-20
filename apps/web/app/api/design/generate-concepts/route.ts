import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

interface ProductBrief {
  category: string;
  targetAudience: string;
  mainFunction: string;
  keyFeatures: string[];
  style: string;
  constraints: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { brief }: { brief: ProductBrief } = await request.json();

    // Build optimized prompt for product design
    const basePrompt = buildProductPrompt(brief);

    // Generate 4 different concepts with varied styles
    const concepts = [];
    const styleVariations = [
      'photorealistic product photography',
      'professional industrial design render',
      'minimalist clean design',
      'futuristic innovative concept',
    ];

    // Force using Hugging Face (FREE alternative to Replicate)
    // Replicate requires payment, HF is free with rate limits
    const useHuggingFace = true;

    if (!useHuggingFace && process.env.REPLICATE_API_TOKEN) {
      // Replicate code (disabled because account has no credits)
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
      // Use Replicate's Stable Diffusion with rate limiting
      console.log('Generating concepts with Replicate (with rate limiting)...');
      
      for (let i = 0; i < 4; i++) {
        const enhancedPrompt = `${basePrompt}, ${styleVariations[i]}, high quality, detailed, 8k`;

        try {
          console.log(`Generating concept ${i + 1}/4...`);
          
          const output = await replicate.run(
            'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            {
              input: {
                prompt: enhancedPrompt,
                negative_prompt:
                  'blurry, low quality, distorted, ugly, bad proportions, text, watermark',
                width: 1024,
                height: 1024,
                num_outputs: 1,
                guidance_scale: 7.5,
                num_inference_steps: 30,
                seed: Math.floor(Math.random() * 1000000),
              },
            }
          );

          concepts.push({
            id: `concept-${i + 1}`,
            imageUrl: Array.isArray(output) ? output[0] : output,
            style: styleVariations[i],
            prompt: enhancedPrompt,
          });
          
          console.log(`✓ Concept ${i + 1} generated successfully`);
          
          // Wait 12 seconds between requests to respect free tier rate limit (6 req/min = 1 req/10s)
          // Adding 2s buffer for safety
          if (i < 3) {
            console.log(`Waiting 12 seconds before next generation...`);
            await new Promise(resolve => setTimeout(resolve, 12000));
          }
        } catch (error: any) {
          console.error(`Error generating concept ${i + 1}:`, error);
          
          // If rate limited, wait and retry once
          if (error.message?.includes('429') || error.message?.includes('throttled')) {
            console.log(`Rate limited, waiting 15 seconds and retrying concept ${i + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            try {
              const output = await replicate.run(
                'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
                {
                  input: {
                    prompt: enhancedPrompt,
                    negative_prompt:
                      'blurry, low quality, distorted, ugly, bad proportions, text, watermark',
                    width: 1024,
                    height: 1024,
                    num_outputs: 1,
                    guidance_scale: 7.5,
                    num_inference_steps: 30,
                    seed: Math.floor(Math.random() * 1000000),
                  },
                }
              );

              concepts.push({
                id: `concept-${i + 1}`,
                imageUrl: Array.isArray(output) ? output[0] : output,
                style: styleVariations[i],
                prompt: enhancedPrompt,
              });
              
              console.log(`✓ Concept ${i + 1} generated after retry`);
            } catch (retryError) {
              console.error(`Retry failed for concept ${i + 1}:`, retryError);
              // Add placeholder after failed retry
              concepts.push({
                id: `concept-${i + 1}`,
                imageUrl: `https://placehold.co/1024x1024/6366f1/white?text=Concept+${i + 1}+%0A${styleVariations[i].split(' ')[0]}`,
                style: styleVariations[i],
                prompt: enhancedPrompt,
                error: true,
              });
            }
          } else {
            // Other error - use placeholder
            concepts.push({
              id: `concept-${i + 1}`,
              imageUrl: `https://placehold.co/1024x1024/6366f1/white?text=Concept+${i + 1}+%0A${styleVariations[i].split(' ')[0]}`,
              style: styleVariations[i],
              prompt: enhancedPrompt,
              error: true,
            });
          }
        }
      }
    } else {
      // Use Pollinations.ai (FREE - no signup, no token, no limits!)
      console.log('🎨 Generating concepts with Pollinations.ai (free & unlimited)...');
      
      // Fonction pour générer un seed stable basé sur le texte
      const hashString = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
      };
      
      for (let i = 0; i < 4; i++) {
        const enhancedPrompt = `${basePrompt}, ${styleVariations[i]}, high quality, detailed, 8k`;
        console.log(`📸 Generating concept ${i + 1}/4...`);
        
        try {
          // Pollinations.ai - completely free image generation
          // Seed stable basé sur le prompt + index pour éviter que les images changent
          const stableSeed = hashString(enhancedPrompt + `-concept-${i}`);
          
          // Encode prompt for URL
          const encodedPrompt = encodeURIComponent(enhancedPrompt);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${stableSeed}&nologo=true`;
          
          console.log(`🎲 Using stable seed: ${stableSeed} for concept ${i + 1}`);

          // Fetch and convert to base64 with retry
          let response;
          let retries = 3;
          
          while (retries > 0) {
            response = await fetch(imageUrl);
            
            if (response.ok) {
              break;
            } else if (retries > 1) {
              console.log(`⚠️ Retry ${4 - retries}/3 for concept ${i + 1} (status: ${response.status})`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
              retries--;
            } else {
              throw new Error(`Pollinations API error after 3 retries: ${response.status}`);
            }
          }
          
          if (response && response.ok) {
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            
            concepts.push({
              id: `concept-${i + 1}`,
              imageUrl: base64,
              style: styleVariations[i],
              prompt: enhancedPrompt,
            });
            
            console.log(`✓ Concept ${i + 1} generated successfully`);
            
            // Small delay between requests (optional, Pollinations has no rate limit)
            if (i < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            throw new Error(`Pollinations API error: ${response.status}`);

          }
        } catch (error) {
          console.error(`Error with HF concept ${i + 1}:`, error);
          // Use placeholder image as fallback
          concepts.push({
            id: `concept-${i + 1}`,
            imageUrl: `https://placehold.co/1024x1024/6366f1/white?text=Concept+${i + 1}+%0A${styleVariations[i].split(' ')[0]}`,
            style: styleVariations[i],
            prompt: enhancedPrompt,
            demo: true,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      concepts,
      brief,
    });
  } catch (error: any) {
    console.error('Error generating concepts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la génération des concepts',
      },
      { status: 500 }
    );
  }
}

function buildProductPrompt(brief: ProductBrief): string {
  return `product design of ${brief.category}, ${brief.style} style, ${brief.mainFunction}, 
    key features: ${brief.keyFeatures.join(', ')}, 
    for ${brief.targetAudience}, 
    professional product shot, white background, studio lighting`;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/png;base64,${base64}`;
}
