"""
Générateur de géométrie 3D avec Build123d
Convertit le champ de densité SIMP en STL
"""
import numpy as np
from pathlib import Path
import tempfile
import os

# Build123d pour CAO paramétrique
try:
    from build123d import *
except ImportError:
    print("⚠️ Build123d non installé - fallback vers export brut")


class STLGenerator:
    """
    Convertit un champ de densité 3D en fichier STL
    """
    
    def __init__(self, density_field: np.ndarray, dimensions: tuple):
        """
        Args:
            density_field: Grille 3D numpy (nx, ny, nz) avec densités 0-1
            dimensions: (length, width, height) en mm
        """
        self.density = density_field
        self.dimensions = dimensions
        self.nx, self.ny, self.nz = density_field.shape
        
        # Taille des voxels
        self.voxel_size = (
            dimensions[0] / self.nx,
            dimensions[1] / self.ny,
            dimensions[2] / self.nz,
        )
    
    def generate_stl(self, threshold: float = 0.5, output_path: str = None) -> str:
        """
        Génère un fichier STL à partir du champ de densité
        
        Args:
            threshold: Densité minimale pour considérer un voxel comme solide
            output_path: Chemin de sortie (optionnel)
        
        Returns:
            Chemin du fichier STL généré
        """
        if output_path is None:
            temp_dir = Path(tempfile.gettempdir()) / "topology_optimization"
            temp_dir.mkdir(exist_ok=True)
            output_path = str(temp_dir / "optimized_part.stl")
        
        try:
            # Méthode 1: Avec Build123d (préféré)
            self._generate_with_build123d(threshold, output_path)
        except Exception as e:
            print(f"⚠️ Erreur Build123d: {e}")
            # Méthode 2: Fallback - export simple de voxels
            self._generate_simple_voxels(threshold, output_path)
        
        return output_path
    
    def _generate_with_build123d(self, threshold: float, output_path: str):
        """
        Génère STL avec Build123d (lissage professionnel)
        """
        print("🔧 Génération STL avec Build123d...")
        
        # Créer une collection de boxes pour chaque voxel dense
        boxes = []
        
        for i in range(self.nx):
            for j in range(self.ny):
                for k in range(self.nz):
                    if self.density[i, j, k] >= threshold:
                        # Position du centre du voxel
                        center_x = i * self.voxel_size[0] + self.voxel_size[0] / 2
                        center_y = j * self.voxel_size[1] + self.voxel_size[1] / 2
                        center_z = k * self.voxel_size[2] + self.voxel_size[2] / 2
                        
                        # Créer un cube à cette position
                        with BuildPart() as box_part:
                            Box(
                                self.voxel_size[0],
                                self.voxel_size[1],
                                self.voxel_size[2],
                                align=(Align.CENTER, Align.CENTER, Align.CENTER)
                            )
                            # Déplacer au bon endroit
                            box_part.part.locate(
                                Location((center_x, center_y, center_z))
                            )
                        
                        boxes.append(box_part.part)
        
        # Fusionner tous les voxels en une seule pièce
        if boxes:
            with BuildPart() as final_part:
                for box in boxes:
                    add(box)
            
            # Exporter en STL
            final_part.part.export_stl(output_path)
            print(f"✅ STL généré: {output_path}")
        else:
            raise ValueError("Aucun voxel au-dessus du seuil de densité")
    
    def _generate_simple_voxels(self, threshold: float, output_path: str):
        """
        Fallback: Export STL simple sans Build123d
        Crée un fichier STL ASCII basique avec des cubes
        """
        print("🔧 Génération STL simple (fallback)...")
        
        vertices = []
        faces = []
        
        # Pour chaque voxel dense, créer 8 vertices et 12 triangles (cube)
        vertex_count = 0
        
        for i in range(self.nx):
            for j in range(self.ny):
                for k in range(self.nz):
                    if self.density[i, j, k] >= threshold:
                        # Coins du voxel
                        x0, y0, z0 = (
                            i * self.voxel_size[0],
                            j * self.voxel_size[1],
                            k * self.voxel_size[2],
                        )
                        x1 = x0 + self.voxel_size[0]
                        y1 = y0 + self.voxel_size[1]
                        z1 = z0 + self.voxel_size[2]
                        
                        # 8 vertices du cube
                        cube_verts = [
                            (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),  # Base
                            (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),  # Haut
                        ]
                        vertices.extend(cube_verts)
                        
                        # 12 triangles (6 faces * 2 triangles)
                        base = vertex_count
                        cube_faces = [
                            # Face avant
                            (base+0, base+1, base+2), (base+0, base+2, base+3),
                            # Face arrière
                            (base+4, base+6, base+5), (base+4, base+7, base+6),
                            # Face gauche
                            (base+0, base+4, base+5), (base+0, base+5, base+1),
                            # Face droite
                            (base+2, base+6, base+7), (base+2, base+7, base+3),
                            # Face bas
                            (base+0, base+3, base+7), (base+0, base+7, base+4),
                            # Face haut
                            (base+1, base+5, base+6), (base+1, base+6, base+2),
                        ]
                        faces.extend(cube_faces)
                        vertex_count += 8
        
        # Écrire fichier STL ASCII
        with open(output_path, 'w') as f:
            f.write("solid OptimizedPart\n")
            
            for face in faces:
                v0 = vertices[face[0]]
                v1 = vertices[face[1]]
                v2 = vertices[face[2]]
                
                # Calculer normale (approximation)
                normal = (0, 0, 1)  # Simplifié
                
                f.write(f"  facet normal {normal[0]} {normal[1]} {normal[2]}\n")
                f.write("    outer loop\n")
                f.write(f"      vertex {v0[0]} {v0[1]} {v0[2]}\n")
                f.write(f"      vertex {v1[0]} {v1[1]} {v1[2]}\n")
                f.write(f"      vertex {v2[0]} {v2[1]} {v2[2]}\n")
                f.write("    endloop\n")
                f.write("  endfacet\n")
            
            f.write("endsolid OptimizedPart\n")
        
        print(f"✅ STL simple généré: {output_path}")
    
    def calculate_metrics(self, threshold: float = 0.5):
        """
        Calcule les métriques de la pièce optimisée
        """
        # Volume occupé
        solid_voxels = np.sum(self.density >= threshold)
        total_voxels = self.density.size
        volume_fraction = solid_voxels / total_voxels
        
        # Volume réel
        voxel_volume = self.voxel_size[0] * self.voxel_size[1] * self.voxel_size[2]
        total_volume = self.dimensions[0] * self.dimensions[1] * self.dimensions[2]
        optimized_volume = solid_voxels * voxel_volume
        
        return {
            'volume_initial': total_volume,
            'volume_optimized': optimized_volume,
            'volume_reduction': ((total_volume - optimized_volume) / total_volume) * 100,
            'volume_fraction': volume_fraction,
            'solid_voxels': int(solid_voxels),
            'total_voxels': int(total_voxels),
        }
