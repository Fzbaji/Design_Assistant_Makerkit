'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { ArrowLeft, Download, Loader2, Package } from 'lucide-react';
import { ThreeDViewer } from '~/components/design/ThreeDViewer';

interface Concept {
  id: string;
  imageUrl: string;
  description: string;
  prompt?: string;
}

interface Component {
  id: string;
  name: string;
  description: string;
  variants: any[];
  selectedVariant: number;
}

export default function ThreeDModelPage() {
  const router = useRouter();
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
  const [productBrief, setProductBrief] = useState<any>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  useEffect(() => {
    // Load data from localStorage
    const conceptData = localStorage.getItem('selectedConcept');
    const componentsData = localStorage.getItem('selectedComponents');
    const briefData = localStorage.getItem('productBrief');

    if (conceptData) {
      const concept = JSON.parse(conceptData);
      setSelectedConcept(concept);
      setSourceImage(concept.imageUrl);
    }

    if (componentsData) {
      setSelectedComponents(JSON.parse(componentsData));
    }

    if (briefData) {
      setProductBrief(JSON.parse(briefData));
    }
  }, []);

  const handleGenerate3D = async () => {
    if (!sourceImage) {
      setError('Aucune image source disponible');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🚀 Lancement génération 3D...');

      // Send base64 image directly to Python backend via Next.js API route
      console.log('📤 Envoi image base64 au backend Python...');
      
      const response = await fetch('/api/design/generate-3d-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: sourceImage,
          productName: productBrief?.productName || 'Produit',
        }),
      });

      const data = await response.json();

      if (data.success && data.modelUrl) {
        console.log('✓ Modèle 3D généré:', data.modelUrl.substring(0, 100) + '...');
        if (data.isDemoMode) {
          console.log('⚠️ Mode démo utilisé');
        } else {
          console.log('✓ Génération réelle TripoSR réussie !');
        }
        setModelUrl(data.modelUrl);
        
        // Save to localStorage
        localStorage.setItem('generated3DModel', JSON.stringify({
          modelUrl: data.modelUrl,
          format: data.format,
          isDemoMode: data.isDemoMode,
          generatedAt: new Date().toISOString(),
        }));
      } else {
        throw new Error(data.error || 'Erreur de génération');
      }
    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message || 'Erreur lors de la génération du modèle 3D');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (modelUrl) {
      const link = document.createElement('a');
      link.href = modelUrl;
      link.download = `${productBrief?.productName || 'model'}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleBack = () => {
    router.push('/design-assistant/components');
  };

  const handleFinish = () => {
    router.push('/design-assistant/final-report');
  };

  if (!selectedConcept) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Aucun concept sélectionné</CardTitle>
            <CardDescription>
              Veuillez d'abord générer et sélectionner un concept.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/design-assistant/concepts')}>
              Retour aux concepts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Phase 4 : Modélisation 3D</h1>
            <p className="text-muted-foreground">
              Générez un modèle 3D à partir de votre concept
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Source Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Image Source
            </CardTitle>
            <CardDescription>
              {productBrief?.productName || 'Concept sélectionné'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={sourceImage || ''}
                alt="Source"
                className="w-full h-full object-contain"
              />
            </div>

            {productBrief && (
              <div className="text-sm space-y-2">
                <p><strong>Catégorie:</strong> {productBrief.category}</p>
                <p><strong>Style:</strong> {productBrief.style}</p>
                {productBrief.materials && (
                  <p><strong>Matériaux:</strong> {productBrief.materials}</p>
                )}
              </div>
            )}

            {!modelUrl && (
              <Button
                onClick={handleGenerate3D}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Générer le modèle 3D
                  </>
                )}
              </Button>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: 3D Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>Modèle 3D Interactif</CardTitle>
            <CardDescription>
              {modelUrl
                ? 'Utilisez la souris pour explorer le modèle'
                : 'Le modèle 3D apparaîtra ici après génération'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {modelUrl ? (
              <div className="space-y-4">
                <ThreeDViewer
                  modelUrl={modelUrl}
                  productName={productBrief?.productName}
                />

                {/* Demo mode warning */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
                  💡 <strong>Mode démo :</strong> Les modèles 3D générés seront prochainement remplacés par des reconstructions générées à partir de votre concept d'image.
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger GLB
                  </Button>
                  <Button onClick={handleFinish} variant="default" className="flex-1">
                    Finaliser le projet →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Modèle 3D en attente de génération</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Components Used (if available) */}
      {selectedComponents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Composants sélectionnés</CardTitle>
            <CardDescription>
              {selectedComponents.length} composant(s) utilisé(s) dans la composition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedComponents.map((comp) => (
                <div key={comp.id} className="space-y-2">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={comp.variants[comp.selectedVariant]?.imageUrl}
                      alt={comp.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-sm font-medium text-center">{comp.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
