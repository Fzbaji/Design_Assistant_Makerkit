import { NextRequest, NextResponse } from 'next/server';

interface Component {
  id: string;
  name: string;
  description: string;
  suggestions: string[];
  variants?: any[];
  selectedVariant?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { baseImage, components, regenerateIndex, productContext } = await request.json();

    console.log(`🎨 Generating variants for ${components.length} component(s)...`);
    console.log(`📦 Product context:`, productContext);

    // Fonction pour générer un seed stable
    const hashString = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };

    const componentsWithVariants = await Promise.all(
      components.map(async (component: Component) => {
        console.log(`📸 Generating 3 variants for: ${component.name}`);

        const variants = await Promise.all(
          [0, 1, 2].map(async (index) => {
            // If regenerateIndex is specified, only regenerate that variant
            if (regenerateIndex !== undefined && index !== regenerateIndex) {
              return component.variants?.[index] || null;
            }

            const variantDescription = component.suggestions?.[index] || `Option ${index + 1}`;
            
            // Build HIGHLY CONTEXTUALIZED prompt to avoid irrelevant generations
            // Example: "table leg" should generate furniture leg, NOT human leg
            let contextualPrompt: string;
            
            if (productContext) {
              // Construct detailed context with materials, style, and explicit product type
              const productType = productContext.productName || 'product';
              const category = productContext.category || 'furniture';
              const style = productContext.style || 'modern';
              const materials = productContext.materials || '';
              
              // Add negative keywords to avoid common misinterpretations
              const negativeContext = category.toLowerCase().includes('furniture') || category.toLowerCase().includes('meuble')
                ? ', NOT human body parts, NOT anatomy, furniture component only'
                : '';
              
              contextualPrompt = `${component.name} component for ${productType} ${category}, ${style} style${materials ? ', ' + materials : ''}, ${component.description}, ${variantDescription}, isolated product component view, white background, professional industrial design, photorealistic 3D render${negativeContext}`;
              
              console.log(`🎨 Contextual prompt: ${contextualPrompt.substring(0, 100)}...`);
            } else {
              contextualPrompt = `${component.name}, ${variantDescription}, product design component, isolated view, white background, high quality, detailed`;
            }
            
            try {
              // Seed stable basé sur le prompt pour éviter que les images changent
              const stableSeed = hashString(contextualPrompt + `-${component.id}-${index}`);
              
              // Use Pollinations.ai for variant generation
              const encodedPrompt = encodeURIComponent(contextualPrompt);
              const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${stableSeed}&nologo=true`;

              console.log(`🎯 Seed ${stableSeed} for ${component.name} variant ${index + 1}`);

              // Fetch with retry logic (3 attempts)
              let response;
              let retries = 3;
              
              while (retries > 0) {
                response = await fetch(imageUrl);
                
                if (response.ok) {
                  break;
                } else if (retries > 1) {
                  console.log(`⚠️ Retry ${4 - retries}/3 for ${component.name} variant ${index + 1} (status: ${response.status})`);
                  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                  retries--;
                } else {
                  throw new Error(`Pollinations API error after 3 retries: ${response.status}`);
                }
              }
              
              if (response && response.ok) {
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const dataUrl = `data:image/png;base64,${base64}`;

                console.log(`✓ Variant ${index + 1} for ${component.name} generated`);

                return {
                  id: `${component.id}-variant-${index + 1}`,
                  imageUrl: dataUrl,
                  description: variantDescription,
                };
              } else {
                throw new Error('Image generation failed');
              }
            } catch (error) {
              console.error(`Error generating variant ${index + 1}:`, error);
              
              // Fallback placeholder
              return {
                id: `${component.id}-variant-${index + 1}`,
                imageUrl: `https://placehold.co/512x512/6366f1/white?text=${encodeURIComponent(component.name)}+${index + 1}`,
                description: variantDescription,
                demo: true,
              };
            }
          })
        );

        // Filter out null values (from unchanged variants during regeneration)
        const filteredVariants = variants.filter(v => v !== null);

        return {
          ...component,
          variants: filteredVariants,
          selectedVariant: component.selectedVariant || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      componentsWithVariants,
    });
  } catch (error: any) {
    console.error('Error generating variants:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la génération des variantes',
      },
      { status: 500 }
    );
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/png;base64,${base64}`;
}
