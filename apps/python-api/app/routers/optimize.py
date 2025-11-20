"""
Router FastAPI pour l'optimisation topologique
Endpoint: POST /api/optimize
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
import os
from pathlib import Path

from app.simp_optimizer import SIMPOptimizer
from app.stl_generator import STLGenerator


router = APIRouter()


# Modèles Pydantic pour validation
class GeometryParams(BaseModel):
    shape: str = "box"
    dimensions: List[float]  # [length, width, height] en mm


class MaterialParams(BaseModel):
    name: str = "acier"
    # Accepter les deux formats : E/youngs_modulus et nu/poisson_ratio
    E: Optional[float] = None  # Pa (format frontend)
    youngs_modulus: Optional[float] = None  # Pa (format complet)
    nu: Optional[float] = None  # Format frontend
    poisson_ratio: Optional[float] = None  # Format complet
    density: float  # kg/m³
    sigma_ys: Optional[float] = None  # Pa (format frontend)
    yield_strength: Optional[float] = None  # Pa (format complet)
    
    def get_youngs_modulus(self) -> float:
        return self.E if self.E is not None else self.youngs_modulus
    
    def get_poisson_ratio(self) -> float:
        return self.nu if self.nu is not None else self.poisson_ratio
    
    def get_yield_strength(self) -> Optional[float]:
        return self.sigma_ys if self.sigma_ys is not None else self.yield_strength


class LoadParams(BaseModel):
    # Accepter les deux formats
    magnitude: Optional[float] = None  # Format frontend
    force_magnitude: Optional[float] = None  # Format complet
    direction: Optional[str] = None  # Format frontend (ex: "-Y")
    force_direction: List[float] = [0, 0, -1]  # Vecteur unitaire
    position: Optional[str] = None  # Format frontend
    application_zone: str = "top_center"
    
    def get_force_magnitude(self) -> float:
        return self.magnitude if self.magnitude is not None else self.force_magnitude
    
    def get_force_direction(self) -> List[float]:
        # Convertir direction string en vecteur si nécessaire
        if self.direction:
            direction_map = {
                "+X": [1, 0, 0], "-X": [-1, 0, 0],
                "+Y": [0, 1, 0], "-Y": [0, -1, 0],
                "+Z": [0, 0, 1], "-Z": [0, 0, -1]
            }
            return direction_map.get(self.direction, self.force_direction)
        return self.force_direction


class ConstraintParams(BaseModel):
    fixed_faces: List[str] = ["bottom"]
    volume_fraction: float = 0.4  # 40% du volume initial
    safety_factor: float = 2.0


class OptimizationParams(BaseModel):
    resolution: int = 25  # Grille 3D (25x25x25 = 15k voxels)
    iterations: int = 50
    density_threshold: float = 0.5  # Pour export STL


class OptimizationRequest(BaseModel):
    geometry: GeometryParams
    material: MaterialParams
    loads: LoadParams
    constraints: ConstraintParams
    optimization: OptimizationParams


class OptimizationResponse(BaseModel):
    success: bool
    stl_url: str
    metrics: dict
    density_field: Optional[List] = None
    message: str


@router.post("/optimize", response_model=OptimizationResponse)
async def optimize_topology(request: OptimizationRequest):
    """
    Optimise la topologie d'une pièce avec l'algorithme SIMP
    
    Flow:
    1. Initialiser SIMP avec paramètres
    2. Appliquer charges et contraintes
    3. Exécuter optimisation (50 itérations)
    4. Générer STL avec Build123d
    5. Retourner URL du fichier + métriques
    """
    try:
        print(f"\n{'='*60}")
        print(f"🚀 NOUVELLE OPTIMISATION TOPOLOGIQUE")
        print(f"{'='*60}")
        print(f"Géométrie: {request.geometry.shape} - {request.geometry.dimensions} mm")
        youngs_mod = request.material.get_youngs_modulus()
        print(f"Matériau: {request.material.name} (E={youngs_mod/1e9:.1f} GPa)")
        force_mag = request.loads.get_force_magnitude()
        force_dir = request.loads.get_force_direction()
        print(f"Force: {force_mag} N {force_dir}")
        print(f"Résolution: {request.optimization.resolution}³ voxels")
        print(f"Itérations: {request.optimization.iterations}")
        print(f"{'='*60}\n")
        
        # Étape 1: Initialiser SIMP
        optimizer = SIMPOptimizer(
            dimensions=tuple(request.geometry.dimensions),
            resolution=request.optimization.resolution,
            volume_fraction=request.constraints.volume_fraction,
            penal=3.0,
            rmin=1.5,
        )
        
        # Étape 2: Appliquer charges et contraintes
        optimizer.apply_loads_and_constraints(
            force_magnitude=force_mag,
            force_direction=force_dir,
            fixed_faces=request.constraints.fixed_faces,
        )
        
        # Étape 3: Optimisation SIMP
        density_field, simp_metrics = optimizer.optimize(
            iterations=request.optimization.iterations
        )
        
        # Étape 4: Générer STL
        print("\n📐 Génération du fichier STL...")
        stl_gen = STLGenerator(
            density_field=density_field,
            dimensions=tuple(request.geometry.dimensions)
        )
        
        stl_path = stl_gen.generate_stl(
            threshold=request.optimization.density_threshold
        )
        
        # Étape 5: Calculer métriques finales
        geo_metrics = stl_gen.calculate_metrics(
            threshold=request.optimization.density_threshold
        )
        
        # Calculer masse
        volume_m3 = geo_metrics['volume_optimized'] / 1e9  # mm³ -> m³
        mass_kg = volume_m3 * request.material.density
        
        # Combiner toutes les métriques
        final_metrics = {
            **geo_metrics,
            **simp_metrics,
            'mass_kg': round(mass_kg, 3),
            'mass_g': round(mass_kg * 1000, 1),
        }
        
        # URL publique du fichier STL
        filename = os.path.basename(stl_path)
        stl_url = f"/api/download/{filename}"
        
        print(f"\n{'='*60}")
        print(f"✅ OPTIMISATION TERMINÉE")
        print(f"{'='*60}")
        print(f"Volume initial: {geo_metrics['volume_initial']:.0f} mm³")
        print(f"Volume optimisé: {geo_metrics['volume_optimized']:.0f} mm³")
        print(f"Réduction: {geo_metrics['volume_reduction']:.1f}%")
        print(f"Masse: {mass_kg*1000:.1f} g")
        print(f"Fichier STL: {stl_path}")
        print(f"{'='*60}\n")
        
        return OptimizationResponse(
            success=True,
            stl_url=stl_url,
            metrics=final_metrics,
            density_field=optimizer.get_density_field(),  # Optionnel
            message="Optimisation SIMP terminée avec succès"
        )
        
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}\n")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'optimisation: {str(e)}"
        )


@router.get("/download/{filename}")
async def download_stl(filename: str):
    """
    Télécharge un fichier STL généré
    """
    temp_dir = Path(os.path.expanduser("~")) / "temp" / "topology_optimization"
    file_path = temp_dir / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier STL introuvable")
    
    return FileResponse(
        path=str(file_path),
        media_type="application/octet-stream",
        filename=filename
    )
