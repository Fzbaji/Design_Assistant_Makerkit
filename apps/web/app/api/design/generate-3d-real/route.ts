import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate 3D model from image using multiple fallback options
 * 1. Hugging Face Inference API (Stable Fast 3D)
 * 2. Gradio API (TripoSR Space)
 * 3. Demo models fallback
 */
export async function POST(request: NextRequest) {
  try {
    const { imageBase64, productName } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Missing imageBase64' },
        { status: 400 }
      );
    }

    console.log('🎨 Starting 3D generation for:', productName);

    // Try Method 1: Hugging Face Inference API with stabilityai/stable-fast-3d
    try {
      console.log('� Trying Hugging Face Inference API (Stable Fast 3D)...');
      
      const binaryString = atob(imageBase64.split(',')[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const imageBlob = new Blob([bytes], { type: 'image/png' });

      const hfToken = process.env.HUGGINGFACE_API_TOKEN;
      
      if (hfToken) {
        const hfResponse = await fetch(
          'https://api-inference.huggingface.co/models/stabilityai/stable-fast-3d',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfToken}`,
            },
            body: imageBlob,
          }
        );

        if (hfResponse.ok) {
          const glbData = await hfResponse.arrayBuffer();
          
          // Convert to base64
          const glbBase64 = Buffer.from(glbData).toString('base64');
          const glbDataUrl = `data:model/gltf-binary;base64,${glbBase64}`;

          console.log('✅ Stable Fast 3D succeeded!');
          
          return NextResponse.json({
            success: true,
            glbUrl: glbDataUrl,
            isDemoMode: false,
            method: 'Hugging Face Stable Fast 3D',
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Hugging Face Inference failed, trying next method...');
    }

    // Try Method 2: Public Gradio TripoSR endpoint
    try {
      console.log('📡 Trying TripoSR public endpoint...');
      
      const binaryString = atob(imageBase64.split(',')[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });

      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      const response = await fetch(
        'https://vast-ai-research-triposr.hf.space/call/predict',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const taskId = data.event_id;

        console.log('⏳ Polling for TripoSR result...');

        // Poll for results (max 15 attempts)
        for (let i = 0; i < 15; i++) {
          await new Promise(resolve => setTimeout(resolve, 4000));

          const statusResponse = await fetch(
            `https://vast-ai-research-triposr.hf.space/call/predict_2/${taskId}`
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

            if (statusData.status === 'COMPLETE' && statusData.data?.[2]?.url) {
              const glbUrl = statusData.data[2].url;
              console.log('✅ TripoSR succeeded!');

              return NextResponse.json({
                success: true,
                glbUrl,
                isDemoMode: false,
                method: 'TripoSR Gradio',
              });
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ TripoSR failed, trying InstantMesh...');
    }

    // Try Method 3: InstantMesh (TencentARC) - newer model
    try {
      console.log('📡 Trying InstantMesh API...');
      
      const formData2 = new FormData();
      formData2.append('image', imageBlob, 'image.png');

      const response2 = await fetch(
        'https://tencentarc-instantmesh.hf.space/call/generate',
        {
          method: 'POST',
          body: formData2,
        }
      );

      if (response2.ok) {
        const data2 = await response2.json();
        const taskId2 = data2.event_id;

        console.log('⏳ Polling for InstantMesh result...');

        for (let i = 0; i < 20; i++) {
          await new Promise(resolve => setTimeout(resolve, 5000));

          const statusResponse2 = await fetch(
            `https://tencentarc-instantmesh.hf.space/call/generate/${taskId2}`
          );

          if (statusResponse2.ok) {
            const statusData2 = await statusResponse2.json();

            if (statusData2.status === 'COMPLETE' && statusData2.data) {
              // InstantMesh returns multiple outputs, we want the GLB mesh
              const meshOutput = Array.isArray(statusData2.data) 
                ? statusData2.data.find((item: any) => 
                    item?.url && item.url.endsWith('.glb')
                  )
                : null;

              if (meshOutput?.url) {
                console.log('✅ InstantMesh succeeded!');
                
                return NextResponse.json({
                  success: true,
                  modelUrl: meshOutput.url,
                  format: 'glb',
                  isDemoMode: false,
                  method: 'InstantMesh',
                });
              }
            }
          }
        }
      }
      
      console.log('⚠️ InstantMesh timeout or failed');
    } catch (error) {
      console.log('⚠️ InstantMesh failed, using demo fallback...');
    }

    // Fallback: Use demo models
    console.log('⚠️ All methods failed, using demo model');
    
    const demoModels = [
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BoxTextured/glTF-Binary/BoxTextured.glb',
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Avocado/glTF-Binary/Avocado.glb',
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
    ];
    
    const randomModel = demoModels[Math.floor(Math.random() * demoModels.length)];
    
    return NextResponse.json({
      success: true,
      modelUrl: randomModel,
      format: 'glb',
      isDemoMode: true,
      message: 'Mode démo - Ajoutez HUGGINGFACE_API_TOKEN dans .env.local pour de meilleurs résultats',
    });

  } catch (error) {
    console.error('❌ Error generating 3D:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
