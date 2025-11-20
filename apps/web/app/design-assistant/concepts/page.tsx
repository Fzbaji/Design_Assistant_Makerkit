'use client';

import { useState, useEffect } from 'react';
import { PageBody } from '@kit/ui/page';
import { Card, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { ArrowLeft, Sparkles, Check, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Concept {
  id: string;
  imageUrl: string;
  style: string;
  prompt: string;
  demo?: boolean;
  error?: boolean;
}

export default function ConceptsPage() {
  const router = useRouter();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [brief, setBrief] = useState<any>(null);

  useEffect(() => {
    // Load brief from localStorage
    const storedBrief = localStorage.getItem('productBrief');
    if (!storedBrief) {
      router.push('/design-assistant/briefing');
      return;
    }

    const parsedBrief = JSON.parse(storedBrief);
    setBrief(parsedBrief);

    // Generate concepts
    generateConcepts(parsedBrief);
  }, [router]);

  const generateConcepts = async (briefData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/design/generate-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: briefData }),
      });

      const data = await response.json();

      if (data.success) {
        setConcepts(data.concepts);
      } else {
        console.error('Error:', data.error);
        // Show demo concepts on error
        setConcepts(generateDemoConcepts());
      }
    } catch (error) {
      console.error('Error generating concepts:', error);
      setConcepts(generateDemoConcepts());
    } finally {
      setIsLoading(false);
    }
  };

  const generateDemoConcepts = (): Concept[] => {
    return [
      {
        id: 'demo-1',
        imageUrl: 'https://placehold.co/1024x1024/6366f1/white?text=Concept+1',
        style: 'Photoréaliste',
        prompt: 'Demo concept 1',
        demo: true,
      },
      {
        id: 'demo-2',
        imageUrl: 'https://placehold.co/1024x1024/8b5cf6/white?text=Concept+2',
        style: 'Rendu industriel',
        prompt: 'Demo concept 2',
        demo: true,
      },
      {
        id: 'demo-3',
        imageUrl: 'https://placehold.co/1024x1024/ec4899/white?text=Concept+3',
        style: 'Minimaliste',
        prompt: 'Demo concept 3',
        demo: true,
      },
      {
        id: 'demo-4',
        imageUrl: 'https://placehold.co/1024x1024/14b8a6/white?text=Concept+4',
        style: 'Futuriste',
        prompt: 'Demo concept 4',
        demo: true,
      },
    ];
  };

  const handleSelectConcept = (conceptId: string) => {
    setSelectedConcept(conceptId);
  };

  const handleContinue = () => {
    if (selectedConcept) {
      const concept = concepts.find((c) => c.id === selectedConcept);
      if (concept) {
        localStorage.setItem('selectedConcept', JSON.stringify(concept));
        router.push('/design-assistant/components');
      }
    }
  };

  const handleSkipTo3D = () => {
    if (selectedConcept) {
      const concept = concepts.find((c) => c.id === selectedConcept);
      if (concept) {
        localStorage.setItem('selectedConcept', JSON.stringify(concept));
        // Passer directement à la 3D sans décomposition
        router.push('/design-assistant/3d-model');
      }
    }
  };

  const handleRegenerate = () => {
    if (brief) {
      generateConcepts(brief);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <PageBody>
          <div className="text-center py-20">
            <Sparkles className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">
              Génération des concepts en cours...
            </h2>
            <p className="text-muted-foreground">
              L'IA crée 4 variantes de design pour votre produit
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-3/4"></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Cela peut prendre 30-60 secondes...
              </p>
            </div>
          </div>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <PageBody>
        <div className="mb-8">
          <Link href="/design-assistant/briefing">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au briefing
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Phase 2: Concepts Générés
          </h1>
          <p className="text-muted-foreground">
            Sélectionnez le concept qui vous plaît le plus
          </p>
        </div>

        {/* Brief Summary */}
        {brief && (
          <Card className="mb-8 bg-muted">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">📝</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Votre briefing</h3>
                  <p className="text-sm text-muted-foreground">
                    {brief.category} • {brief.style} • {brief.targetAudience}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Concepts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {concepts.map((concept) => (
            <Card
              key={concept.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedConcept === concept.id
                  ? 'ring-2 ring-primary'
                  : ''
              }`}
              onClick={() => handleSelectConcept(concept.id)}
            >
              <CardContent className="p-4">
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                  {concept.imageUrl.startsWith('data:') ? (
                    <img
                      src={concept.imageUrl}
                      alt={concept.style}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={concept.imageUrl}
                      alt={concept.style}
                      fill
                      className="object-cover"
                    />
                  )}
                  {selectedConcept === concept.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-2">
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                  {concept.demo && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Demo
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{concept.style}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {concept.prompt.substring(0, 50)}...
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleRegenerate}>
              <Sparkles className="mr-2 h-4 w-4" />
              Regénérer
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedConcept}
              onClick={handleContinue}
            >
              Continuer avec décomposition →
            </Button>
          </div>
          
          <Button
            variant="secondary"
            disabled={!selectedConcept}
            onClick={handleSkipTo3D}
            className="w-full"
          >
            Passer directement à la modélisation 3D (sans variantes)
          </Button>
        </div>

        {/* Info */}
        {concepts.some((c) => c.demo) && (
          <Card className="mt-6 border-yellow-500">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                ⚠️ <strong>Mode Demo:</strong> Pour générer de vraies images avec
                Stable Diffusion, ajoutez votre clé API Replicate ou Hugging Face
                dans le fichier <code className="bg-muted px-1">.env.local</code>
              </p>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </div>
  );
}
