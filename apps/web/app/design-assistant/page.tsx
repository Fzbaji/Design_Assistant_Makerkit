import { PageBody } from '@kit/ui/page';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Design Assistant - AI Product Design',
  description: 'Créez des produits innovants avec l\'IA générative',
};

export default function DesignAssistantPage() {
  return (
    <div className="container mx-auto py-8">
      <PageBody>
        {/* Header */}
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            🎨 Design Assistant
          </h1>
          <p className="text-lg text-muted-foreground">
            De l'idée au produit 3D en 5 étapes assistées par IA
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Phase 1: Briefing */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <CardTitle>Briefing Intelligent</CardTitle>
              </div>
              <CardDescription className="mt-2">
                L'IA vous aide à structurer votre idée de produit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Description textuelle</li>
                <li>✓ Upload de sketch</li>
                <li>✓ Questions guidées</li>
                <li>✓ Fiche de briefing</li>
              </ul>
              <Link href="/design-assistant/briefing">
                <Button className="mt-4 w-full">
                  Commencer le briefing →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Phase 2: Concepts */}
          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">
                  2
                </div>
                <CardTitle>Génération de Concepts</CardTitle>
              </div>
              <CardDescription className="mt-2">
                L'IA génère plusieurs variantes de design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 4-6 concepts différents</li>
                <li>✓ Stable Diffusion</li>
                <li>✓ Sélection interactive</li>
                <li>✓ Regénération possible</li>
              </ul>
              <Button className="mt-4 w-full" disabled>
                Débloquer après Phase 1
              </Button>
            </CardContent>
          </Card>

          {/* Phase 3: Components */}
          <Card className="hover:shadow-lg transition-shadow border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <CardTitle>Décomposition Composants</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Personnalisez chaque partie du produit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Détection automatique (Gemini Vision)</li>
                <li>✓ 3 variantes par composant</li>
                <li>✓ Mix & Match interactif</li>
                <li>✓ Régénération individuelle</li>
              </ul>
              <Link href="/design-assistant/components">
                <Button className="mt-4 w-full">
                  Voir les composants
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Phase 4: 3D */}
          <Card className="hover:shadow-lg transition-shadow border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  4
                </div>
                <CardTitle>Modèle 3D Interactif</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Visualisation 3D photoréaliste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Image → 3D (TripoSR)</li>
                <li>✓ Vue 360° interactive</li>
                <li>✓ Rendu photoréaliste</li>
                <li>✓ Export GLB/GLTF</li>
              </ul>
              <Link href="/design-assistant/3d-model">
                <Button className="mt-4 w-full">
                  Générer modèle 3D →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Phase 5: Report */}
          <Card className="hover:shadow-lg transition-shadow border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  5
                </div>
                <CardTitle>Fiche Technique Finale</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Documentation complète du projet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Historique des étapes</li>
                <li>✓ Tous les visuels</li>
                <li>✓ Spécifications</li>
                <li>✓ Export PDF</li>
              </ul>
              <Link href="/design-assistant/final-report">
                <Button className="mt-4 w-full">
                  Générer le rapport →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div>
                <h3 className="font-semibold mb-2">Comment ça marche ?</h3>
                <p className="text-sm text-muted-foreground">
                  Ce système vous accompagne de l'idée initiale jusqu'au modèle 3D final. 
                  Commencez par décrire votre produit en langage naturel, l'IA vous aidera 
                  à structurer votre concept, générera des visuels, et créera un modèle 3D interactif.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Astuce :</strong> Plus votre description est détaillée au départ, 
                  meilleurs seront les résultats générés par l'IA.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects (placeholder) */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Vos projets récents</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun projet pour le moment</p>
                <p className="text-sm mt-2">Commencez votre premier design ci-dessus</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </div>
  );
}
