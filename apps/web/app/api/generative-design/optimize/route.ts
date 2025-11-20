import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Optimisation Topologique SIMP
 * Appelle le backend Python FastAPI pour optimisation réelle
 */

export async function POST(request: NextRequest) {
  let params;
  
  try {
    params = await request.json();

    // URL du backend Python (local ou Railway)
    const PYTHON_BACKEND_URL =
      process.env.PYTHON_API_URL || 'http://localhost:8000';

    console.log('📡 Appel backend Python:', PYTHON_BACKEND_URL);
    console.log('📦 Paramètres:', JSON.stringify(params, null, 2));

    // Appeler le backend Python pour optimisation SIMP
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur backend Python:', response.status, errorText);
      throw new Error(`Backend Python error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log('✅ Optimisation terminée:', {
      success: data.success,
      stl_url: data.stl_url,
      volume_reduction: data.metrics?.volume_reduction,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Erreur optimisation:', error);

    // Fallback: Si backend Python indisponible, utiliser simulation
    if (error.message?.includes('fetch failed') || error.code === 'ECONNREFUSED') {
      console.warn('⚠️ Backend Python indisponible, utilisation du mode simulation');
      return simulatedOptimization(params);
    }

    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'optimisation" },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Simulation si backend Python indisponible
 */
async function simulatedOptimization(params: any) {
  console.log('🎭 Mode simulation activé (backend Python indisponible)');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const initialVolume = 282743;
  const volumeFraction = params.constraints?.volume_fraction || 0.4;
  const density = params.material?.density || 2700;

  const optimizedVolume = initialVolume * volumeFraction;
  const mass = (optimizedVolume / 1e9) * density * 1000;

  const resolution = params.optimization?.resolution || 25;
  const densityField = generateMockDensityField(resolution);

  const metrics = {
    volume_initial: Math.round(initialVolume),
    volume_optimized: Math.round(optimizedVolume),
    volume_reduction: Math.round((1 - volumeFraction) * 100),
    mass: Math.round(mass * 10) / 10,
    mass_kg: Math.round((mass / 1000) * 1000) / 1000,
    safety_factor: 2.1,
    max_stress: 132e6,
    compliance: 0.0045,
    final_compliance: 0.0045,
    final_volume_fraction: volumeFraction,
    iterations_completed: params.optimization?.iterations || 40,
  };

  return NextResponse.json({
    success: true,
    stl_url: '/mock-optimized-part.stl',
    metrics: metrics,
    density_field: densityField,
    message: '⚠️ Mode simulation - Backend Python indisponible',
  });
}

/**
 * Génère un champ de densité simulé
 */
function generateMockDensityField(resolution: number): number[][][] {
  const field: number[][][] = [];

  for (let i = 0; i < resolution; i++) {
    field[i] = [];
    for (let j = 0; j < resolution; j++) {
      field[i][j] = [];
      for (let k = 0; k < resolution; k++) {
        const centerDistance = Math.sqrt(
          Math.pow((i - resolution / 2) / resolution, 2) +
            Math.pow((j - resolution / 2) / resolution, 2) +
            Math.pow(k / resolution, 2)
        );

        const density = Math.max(0, 1 - centerDistance * 1.5 + Math.random() * 0.2);

        field[i][j][k] = density;
      }
    }
  }

  return field;
}
