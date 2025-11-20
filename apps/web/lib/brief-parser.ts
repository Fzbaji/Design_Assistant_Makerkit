/**
 * Parser pour extraire les paramètres d'un brief markdown
 */

interface ParsedParams {
  geometry: {
    shape: string;
    dimensions: number[];
    volume?: number;
  };
  material: {
    name: string;
    E: number;
    nu: number;
    sigma_ys?: number;
    density: number;
  };
  boundary_conditions: {
    position: string;
    type: string;
    z?: number;
  };
  loads: {
    magnitude: number;
    direction: string;
    position?: string;
  };
  constraints: {
    volume_fraction: number;
    safety_factor: number;
    max_stress?: number;
  };
  optimization: {
    resolution: number;
    penalty: number;
    iterations: number;
    convergence?: number;
  };
}

export function parseBrief(briefText: string): ParsedParams {
  // Extraire la forme
  const shapeMatch = briefText.match(/\*\*Forme\*\*\s*:\s*(\w+)/i);
  const shape = shapeMatch ? shapeMatch[1] : 'Cylinder';

  // Extraire les dimensions
  const dimMatch = briefText.match(
    /\*\*Dimensions\*\*\s*:\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)(?:\s*[xX×]\s*(\d+(?:\.\d+)?))?/i
  );
  const dimensions = dimMatch
    ? [parseFloat(dimMatch[1]!), parseFloat(dimMatch[2]!), parseFloat(dimMatch[3] || '0')]
    : [100, 100, 20];

  // Extraire le matériau
  const materialMatch = briefText.match(/\*\*Type\*\*\s*:\s*([^\n]+)/i);
  const materialName = materialMatch ? materialMatch[1]!.trim() : 'Aluminium';

  // Base de données des matériaux
  const materials: { [key: string]: any } = {
    acier: { E: 210e9, nu: 0.3, density: 7850, sigma_ys: 250e6 },
    steel: { E: 210e9, nu: 0.3, density: 7850, sigma_ys: 250e6 },
    aluminium: { E: 70e9, nu: 0.33, density: 2700, sigma_ys: 276e6 },
    aluminum: { E: 70e9, nu: 0.33, density: 2700, sigma_ys: 276e6 },
    titane: { E: 110e9, nu: 0.34, density: 4500, sigma_ys: 880e6 },
    titanium: { E: 110e9, nu: 0.34, density: 4500, sigma_ys: 880e6 },
    abs: { E: 2.3e9, nu: 0.39, density: 1050, sigma_ys: 40e6 },
    pla: { E: 3.5e9, nu: 0.36, density: 1250, sigma_ys: 50e6 },
  };

  // Trouver le matériau correspondant
  const materialKey = Object.keys(materials).find((key) =>
    materialName.toLowerCase().includes(key)
  );
  const materialProps = materialKey ? materials[materialKey] : materials.aluminium;

  // Extraire Module de Young si spécifié
  const eMatch = briefText.match(/\*\*Module de Young.*?\*\*\s*:\s*(\d+(?:\.\d+)?)\s*GPa/i);
  const E = eMatch ? parseFloat(eMatch[1]!) * 1e9 : materialProps.E;

  // Extraire coefficient de Poisson
  const nuMatch = briefText.match(/\*\*Coefficient de Poisson.*?\*\*\s*:\s*(\d+(?:\.\d+)?)/i);
  const nu = nuMatch ? parseFloat(nuMatch[1]!) : materialProps.nu;

  // Extraire densité
  const densityMatch = briefText.match(/\*\*Densité\*\*\s*:\s*(\d+(?:\.\d+)?)/i);
  const density = densityMatch ? parseFloat(densityMatch[1]!) : materialProps.density;

  // Extraire force
  const forceMatch = briefText.match(/\*\*Force\*\*\s*:\s*(\d+(?:\.\d+)?)\s*N/i);
  const force = forceMatch ? parseFloat(forceMatch[1]!) : 1000;

  // Extraire direction
  const dirMatch = briefText.match(/\*\*Direction\*\*\s*:\s*([+-]?[XYZ])/i);
  const direction = dirMatch ? dirMatch[1]!.toUpperCase() : '-Z';

  // Extraire volume maximal (en %)
  const volumeMatch = briefText.match(/\*\*Volume maximal\*\*\s*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const volumeFraction = volumeMatch ? parseFloat(volumeMatch[1]!) / 100 : 0.4;

  // Extraire facteur de sécurité
  const safetyMatch = briefText.match(/\*\*Facteur de sécurité\*\*\s*:\s*(\d+(?:\.\d+)?)/i);
  const safetyFactor = safetyMatch ? parseFloat(safetyMatch[1]!) : 2.0;

  // Extraire résolution
  const resolutionMatch = briefText.match(/\*\*Résolution\*\*\s*:\s*(\d+)/i);
  const resolution = resolutionMatch ? parseInt(resolutionMatch[1]!) : 25;

  // Extraire pénalité SIMP
  const penaltyMatch = briefText.match(/\*\*Pénalité SIMP\*\*\s*:\s*(\d+(?:\.\d+)?)/i);
  const penalty = penaltyMatch ? parseFloat(penaltyMatch[1]!) : 3.0;

  // Extraire nombre d'itérations
  const iterMatch = briefText.match(/\*\*Nombre d'itérations\*\*\s*:\s*(\d+)/i);
  const iterations = iterMatch ? parseInt(iterMatch[1]!) : 40;

  // Calculer le volume (si cylindre)
  let volume = 0;
  if (shape && shape.toLowerCase().includes('cylind')) {
    const radius = dimensions[0]! / 2;
    const height = dimensions[1]!;
    volume = Math.PI * radius * radius * height;
  } else if (shape && shape.toLowerCase().includes('box')) {
    volume = dimensions[0]! * dimensions[1]! * (dimensions[2] || dimensions[1]!);
  }

  return {
    geometry: {
      shape,
      dimensions: dimensions.filter((d) => d > 0),
      volume: Math.round(volume),
    },
    material: {
      name: materialName,
      E,
      nu,
      sigma_ys: materialProps.sigma_ys,
      density,
    },
    boundary_conditions: {
      position: 'bottom',
      type: 'fixed',
      z: 0,
    },
    loads: {
      magnitude: force,
      direction,
      position: 'top',
    },
    constraints: {
      volume_fraction: volumeFraction,
      safety_factor: safetyFactor,
      max_stress: materialProps.sigma_ys / safetyFactor,
    },
    optimization: {
      resolution,
      penalty,
      iterations,
      convergence: 0.01,
    },
  };
}
