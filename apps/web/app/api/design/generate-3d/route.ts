import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, productName } = await request.json();

    console.log('🎨 Starting 3D model generation...');
    console.log('📸 Image URL type:', imageUrl.startsWith('data:') ? 'base64' : 'URL');
    console.log('📦 Product:', productName);

    // TEMPORARY: Use a demo GLB model for testing the viewer
    // TODO: Implement real 3D generation with TripoSR or similar
    
    // For now, return a publicly hosted demo model
    // You can replace this with actual generation later
    const demoModels = [
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
    ];
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const modelUrl = demoModels[Math.floor(Math.random() * demoModels.length)];
    
    console.log('✓ Demo 3D model ready');
    console.log('📦 Model URL:', modelUrl);

    return NextResponse.json({
      success: true,
      modelUrl: modelUrl,
      format: 'glb',
      demo: true,
      message: 'Version démo - Intégration TripoSR à venir',
    });

    /* REAL IMPLEMENTATION (to be enabled later):
    
    if (imageUrl.startsWith('data:')) {
      // Use Python backend with TripoSR
      const pythonBackendUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';
      
      const response = await fetch(`${pythonBackendUrl}/generate-3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: imageUrl,
          product_name: productName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Python backend error: ${response.status}`);
      }

      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        modelUrl: data.model_url || data.glb_url,
        format: 'glb',
      });
    }

    // If it's a public URL, use Replicate
    const output = await replicate.run(
      "stability-ai/triposr" as any,
      {
        input: {
          image_path: imageUrl,
          foreground_ratio: 0.85,
          mc_resolution: 256,
        }
      }
    );

    let modelUrl = output;
    if (typeof output === 'object') {
      modelUrl = (output as any).glb || (output as any).model || output;
    }

    return NextResponse.json({
      success: true,
      modelUrl: modelUrl,
      format: 'glb',
    });
    */
    
  } catch (error: any) {
    console.error('❌ Error generating 3D model:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la génération du modèle 3D',
      },
      { status: 500 }
    );
  }
}
