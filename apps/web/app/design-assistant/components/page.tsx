'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PageBody } from '@kit/ui/page';
import { Card } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { ArrowLeft, Loader2, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

interface Component {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  selectedVariant: number;
  enabled?: boolean; // Pour la sélection
}

interface Variant {
  id: string;
  imageUrl: string;
  description: string;
}

export default function ComponentsPage() {
  const router = useRouter();
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [currentStep, setCurrentStep] = useState<'loading' | 'decomposed' | 'selecting' | 'variants'>('loading');

  useEffect(() => {
    // Load selected concept from localStorage
    const conceptData = localStorage.getItem('selectedConcept');
    if (!conceptData) {
      router.push('/design-assistant/concepts');
      return;
    }

    const concept = JSON.parse(conceptData);
    setSelectedConcept(concept);

    // Auto-start decomposition with the loaded concept
    decomposeProduct(concept);
  }, [router]);

  const decomposeProduct = async (concept: any) => {
    setIsDecomposing(true);
    setCurrentStep('loading');

    try {
      const response = await fetch('/api/design/decompose-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: concept.imageUrl,
          prompt: concept.prompt,
          style: concept.style,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✓ Decomposition successful, components:', data.components);
        // Mark all components as enabled by default
        const componentsWithSelection = data.components.map((comp: Component) => ({
          ...comp,
          enabled: true, // Tous sélectionnés par défaut
        }));
        setComponents(componentsWithSelection);
        setCurrentStep('selecting'); // Passer à l'étape de sélection
        
        // NE PAS auto-générer les variantes, attendre la sélection de l'utilisateur
        console.log('✓ Components detected, waiting for user selection');
      } else {
        console.error('Decomposition failed:', data.error);
      }
    } catch (error) {
      console.error('Error decomposing product:', error);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleComponentToggle = (componentId: string) => {
    setComponents(prev =>
      prev.map(comp =>
        comp.id === componentId
          ? { ...comp, enabled: !comp.enabled }
          : comp
      )
    );
  };

  const handleGenerateSelectedVariants = async () => {
    // Filtrer seulement les composants sélectionnés
    const selectedComponents = components.filter(comp => comp.enabled);
    
    if (selectedComponents.length === 0) {
      alert('Veuillez sélectionner au moins un composant');
      return;
    }

    console.log('📸 Generating variants for', selectedComponents.length, 'selected components');
    await generateAllVariants(selectedComponents, selectedConcept);
  };

  const generateAllVariants = async (detectedComponents: Component[], concept: any) => {
    console.log('📸 Generating variants for', detectedComponents.length, 'components');
    setIsGeneratingVariants(true);
    setCurrentStep('variants');

    // Récupérer le contexte du produit depuis localStorage
    const productBriefData = localStorage.getItem('productBrief');
    let productContext = null;
    if (productBriefData) {
      productContext = JSON.parse(productBriefData);
      console.log('📦 Using product context:', productContext);
    }

    try {
      const response = await fetch('/api/design/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseImage: concept.imageUrl,
          components: detectedComponents,
          productContext, // Passer le contexte du produit
        }),
      });

      console.log('Variants API response status:', response.status);
      const data = await response.json();
      console.log('Variants API response data:', data);

      if (data.success) {
        console.log('✓ Variants generated successfully');
        // Mettre à jour seulement les composants qui ont été générés
        setComponents(prev => {
          const updatedComponents = [...prev];
          data.componentsWithVariants.forEach((newComp: Component) => {
            const index = updatedComponents.findIndex(c => c.id === newComp.id);
            if (index !== -1) {
              updatedComponents[index] = { ...updatedComponents[index], ...newComp };
            }
          });
          return updatedComponents;
        });
      } else {
        console.error('Variant generation failed:', data.error);
      }
    } catch (error) {
      console.error('Error generating variants:', error);
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const handleVariantSelect = (componentId: string, variantIndex: number) => {
    setComponents(prev =>
      prev.map(comp =>
        comp.id === componentId
          ? { ...comp, selectedVariant: variantIndex }
          : comp
      )
    );
  };

  const handleRegenerateVariant = async (componentId: string, variantIndex: number) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    // Récupérer le contexte du produit depuis localStorage
    const productBriefData = localStorage.getItem('productBrief');
    let productContext = null;
    if (productBriefData) {
      productContext = JSON.parse(productBriefData);
      console.log('📦 Regenerating with product context:', productContext);
    }

    try {
      const response = await fetch('/api/design/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseImage: selectedConcept.imageUrl,
          components: [component],
          regenerateIndex: variantIndex,
          productContext, // IMPORTANT: passer le contexte du produit
        }),
      });

      const data = await response.json();

      if (data.success && data.componentsWithVariants[0]) {
        setComponents(prev =>
          prev.map(comp =>
            comp.id === componentId
              ? data.componentsWithVariants[0]
              : comp
          )
        );
      }
    } catch (error) {
      console.error('Error regenerating variant:', error);
    }
  };

  const handleContinue = () => {
    // Save selected components combination
    localStorage.setItem('selectedComponents', JSON.stringify(components));
    router.push('/design-assistant/3d-model');
  };

  if (!selectedConcept) {
    return (
      <PageBody>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageBody>
    );
  }

  return (
    <PageBody>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/design-assistant/concepts')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux concepts
            </Button>
            <h1 className="text-3xl font-bold">Phase 3 : Décomposition en Composants</h1>
            <p className="text-muted-foreground">
              Personnalisez votre produit en mixant différents composants
            </p>
          </div>
        </div>

        {/* Selected Concept Preview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Concept sélectionné</h2>
          <div className="flex gap-6">
            <div className="relative w-64 h-64 rounded-lg overflow-hidden border">
              <Image
                src={selectedConcept.imageUrl}
                alt="Selected concept"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Style :</span>
                <p className="font-medium">{selectedConcept.style}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Prompt :</span>
                <p className="text-sm">{selectedConcept.prompt}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {isDecomposing && (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Analyse du produit en cours...</h3>
                <p className="text-muted-foreground">
                  Intelligence artificielle détecte les composants du produit
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Generating Variants State */}
        {isGeneratingVariants && (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Sparkles className="w-12 h-12 animate-pulse text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Génération des variantes...</h3>
                <p className="text-muted-foreground">
                  Création de 3 options pour chaque composant détecté
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Component Selection Step */}
        {currentStep === 'selecting' && !isGeneratingVariants && components.length > 0 && (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Composants détectés ({components.length})
                </h2>
                <p className="text-muted-foreground">
                  Sélectionnez les composants pour lesquels vous souhaitez générer des variantes
                </p>
              </div>

              <div className="space-y-3">
                {components.map((component) => (
                  <div
                    key={component.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                      component.enabled
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={component.enabled}
                      onChange={() => handleComponentToggle(component.id)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{component.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {component.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    // Tout sélectionner
                    setComponents(prev => prev.map(c => ({ ...c, enabled: true })));
                  }}
                  variant="outline"
                  size="sm"
                >
                  Tout sélectionner
                </Button>
                <Button
                  onClick={() => {
                    // Tout désélectionner
                    setComponents(prev => prev.map(c => ({ ...c, enabled: false })));
                  }}
                  variant="outline"
                  size="sm"
                >
                  Tout désélectionner
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={handleGenerateSelectedVariants}
                  disabled={components.filter(c => c.enabled).length === 0}
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer les variantes ({components.filter(c => c.enabled).length})
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Components Grid */}
        {!isDecomposing && !isGeneratingVariants && currentStep === 'variants' && components.length > 0 && (
          <>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  Composants générés ({components.filter(c => c.variants && c.variants.length > 0).length})
                </h2>
                <div className="text-sm text-muted-foreground">
                  Cliquez sur une variante pour la sélectionner
                </div>
              </div>

              {components.filter(c => c.variants && c.variants.length > 0).map((component) => (
                <Card key={component.id} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{component.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {component.description}
                      </p>
                    </div>

                    {/* Variants Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {component.variants.map((variant, index) => (
                        <div
                          key={variant.id}
                          className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                            component.selectedVariant === index
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleVariantSelect(component.id, index)}
                        >
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={variant.imageUrl}
                              alt={`${component.name} - Option ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {component.selectedVariant === index && (
                              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                  Sélectionné
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-3 space-y-2">
                            <p className="text-sm font-medium">Option {index + 1}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {variant.description}
                            </p>
                          </div>

                          {/* Regenerate Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateVariant(component.id, index);
                            }}
                            className="absolute top-2 right-2 p-2 bg-background/80 hover:bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
              <Button size="lg" onClick={handleContinue}>
                Continuer vers la 3D
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isDecomposing && !isGeneratingVariants && components.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Aucun composant détecté. Veuillez réessayer.
              </p>
              <Button onClick={() => decomposeProduct(selectedConcept)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PageBody>
  );
}
