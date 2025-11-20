"""
Algorithme SIMP (Solid Isotropic Material with Penalization)
pour l'optimisation topologique
"""
import numpy as np
from scipy.ndimage import gaussian_filter


class SIMPOptimizer:
    """
    Implémentation simplifiée de l'algorithme SIMP
    Contrainte: 4GB RAM - optimisé pour résolutions moyennes (30x30x30 max)
    """
    
    def __init__(
        self,
        dimensions: tuple,  # (length, width, height) en mm
        resolution: int = 25,  # Grille 3D
        volume_fraction: float = 0.4,  # 40% du volume initial
        penal: float = 3.0,  # Pénalité SIMP
        rmin: float = 1.5,  # Rayon du filtre
    ):
        self.dimensions = dimensions
        self.resolution = resolution
        self.volume_fraction = volume_fraction
        self.penal = penal
        self.rmin = rmin
        
        # Grille 3D de densité (0=vide, 1=plein)
        self.nx, self.ny, self.nz = resolution, resolution, resolution
        self.density = np.ones((self.nx, self.ny, self.nz)) * volume_fraction
        
    def apply_loads_and_constraints(
        self,
        force_magnitude: float,
        force_direction: list,
        fixed_faces: list = ['bottom']
    ):
        """
        Applique les charges et contraintes au modèle
        """
        # Identifier les zones fixes (conditions limites)
        self.fixed_nodes = np.zeros((self.nx, self.ny, self.nz), dtype=bool)
        
        if 'bottom' in fixed_faces:
            self.fixed_nodes[:, :, 0] = True  # Base fixée
        if 'top' in fixed_faces:
            self.fixed_nodes[:, :, -1] = True
        if 'left' in fixed_faces:
            self.fixed_nodes[0, :, :] = True
        if 'right' in fixed_faces:
            self.fixed_nodes[-1, :, :] = True
            
        # Zone de chargement (centre du dessus par défaut)
        self.load_nodes = np.zeros((self.nx, self.ny, self.nz), dtype=bool)
        center_x, center_y = self.nx // 2, self.ny // 2
        self.load_nodes[center_x-2:center_x+2, center_y-2:center_y+2, -1] = True
        
        self.force_magnitude = force_magnitude
        self.force_direction = np.array(force_direction)
        
    def optimize(self, iterations: int = 50):
        """
        Exécute l'algorithme SIMP
        Retourne: champ de densité final + métriques
        """
        print(f"🚀 Démarrage SIMP: {iterations} itérations, résolution {self.resolution}³")
        
        compliance_history = []
        volume_history = []
        
        for iteration in range(iterations):
            # 1. Analyse par éléments finis (FEA simplifiée)
            compliance, sensitivity = self._simplified_fea()
            
            # 2. Filtrer les sensibilités (éviter le damier)
            sensitivity_filtered = gaussian_filter(sensitivity, sigma=self.rmin)
            
            # 3. Mise à jour des densités (OC - Optimality Criteria)
            self.density = self._update_density(sensitivity_filtered)
            
            # 4. Appliquer les contraintes (zones fixes toujours pleines)
            self.density[self.fixed_nodes] = 1.0
            
            # 5. Métriques
            current_volume = np.sum(self.density) / self.density.size
            compliance_history.append(compliance)
            volume_history.append(current_volume)
            
            if iteration % 10 == 0:
                print(f"  Iter {iteration}: Compliance={compliance:.4f}, Volume={current_volume:.2%}")
        
        print(f"✅ Optimisation terminée !")
        
        metrics = {
            'final_compliance': float(compliance_history[-1]),
            'final_volume_fraction': float(volume_history[-1]),
            'iterations_completed': iterations,
            'compliance_history': [float(c) for c in compliance_history],
        }
        
        return self.density, metrics
    
    def _simplified_fea(self):
        """
        Analyse par éléments finis simplifiée
        Remplace un vrai FEA complet (trop lourd pour 4GB RAM)
        """
        # Compliance: mesure de flexibilité (à minimiser)
        # C = F^T * u (force × déplacement)
        # Approximation: compliance proportionnelle à l'inverse de la rigidité
        # Rigidité d'un élément: E * density^penal
        compliance = np.sum(1.0 / (self.density ** self.penal + 1e-9))
        
        # Sensibilité: gradient de compliance par rapport à la densité
        # IMPORTANT: doit être NÉGATIF pour l'algorithme OC
        # Plus une zone est sollicitée, plus sa sensibilité (en valeur absolue) est élevée
        sensitivity = np.zeros_like(self.density)
        
        # Simuler sensibilité élevée près des charges et zones fixes
        for i in range(self.nx):
            for j in range(self.ny):
                for k in range(self.nz):
                    # Distance aux nœuds chargés
                    if self.load_nodes[i, j, k]:
                        sensitivity[i, j, k] = -1.0  # NÉGATIF
                    elif self.fixed_nodes[i, j, k]:
                        sensitivity[i, j, k] = -0.8  # Zones fixes importantes
                    else:
                        # Propagation de contrainte (approximation)
                        dist_to_load = np.sqrt(
                            (i - self.nx/2)**2 + 
                            (j - self.ny/2)**2 + 
                            (k - self.nz)**2
                        )
                        
                        # Sensibilité diminue avec distance (valeurs négatives)
                        sensitivity[i, j, k] = -max(0.1, 1 / (1 + dist_to_load * 0.1))
        
        # Pondérer par la densité actuelle et la pénalité SIMP
        # Protection contre division par zéro avec densités très faibles
        density_safe = np.maximum(self.density, 1e-6)
        sensitivity *= -self.penal * (density_safe ** (self.penal - 1))
        
        return compliance, sensitivity
    
    def _update_density(self, sensitivity):
        """
        Mise à jour OC (Optimality Criteria)
        """
        # Paramètres OC
        move = 0.2
        
        # Calculer le multiplicateur de Lagrange (bisection method)
        l1, l2 = 1e-10, 1e9  # Éviter l1=0 pour éviter division par zéro
        
        # Protection contre boucle infinie
        max_iterations = 100
        iteration = 0
        
        while (l2 - l1) / (l1 + l2) > 1e-3 and iteration < max_iterations:
            iteration += 1
            lmid = 0.5 * (l2 + l1)
            
            # Protection contre division par zéro
            if lmid < 1e-10:
                lmid = 1e-10
            
            # Calculer nouvelle densité avec multiplicateur actuel
            Be = -sensitivity / (lmid + 1e-10)  # Protection division par zéro
            density_new = np.maximum(
                0.001,
                np.maximum(
                    self.density - move,
                    np.minimum(
                        1.0,
                        np.minimum(
                            self.density + move,
                            self.density * np.sqrt(np.maximum(Be, 1e-6))  # Éviter racine négative
                        )
                    )
                )
            )
            
            # Vérifier contrainte de volume
            current_volume = np.mean(density_new)
            
            if current_volume > self.volume_fraction:
                l1 = lmid
            else:
                l2 = lmid
        
        return np.clip(density_new, 0.001, 1.0)
    
    def get_density_field(self):
        """Retourne le champ de densité final"""
        return self.density.tolist()
