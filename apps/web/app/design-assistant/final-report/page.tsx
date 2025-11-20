'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { ArrowLeft, Download, FileText, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';

interface ProductBrief {
  productName: string;
  category: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  style: string;
  materials?: string;
  colors?: string;
  dimensions?: string;
  usageContext?: string;
}

interface Concept {
  id: string;
  imageUrl: string;
  description?: string;
}

interface Component {
  id: string;
  name: string;
  description: string;
  variants: any[];
  selectedVariant: number;
}

export default function FinalReportPage() {
  const router = useRouter();
  const [productBrief, setProductBrief] = useState<ProductBrief | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
  const [model3D, setModel3D] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Load all data from localStorage
    const briefData = localStorage.getItem('productBrief');
    const conceptData = localStorage.getItem('selectedConcept');
    const componentsData = localStorage.getItem('selectedComponents');
    const modelData = localStorage.getItem('generated3DModel');

    if (briefData) setProductBrief(JSON.parse(briefData));
    if (conceptData) setSelectedConcept(JSON.parse(conceptData));
    if (componentsData) setSelectedComponents(JSON.parse(componentsData));
    if (modelData) setModel3D(JSON.parse(modelData));
  }, []);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      console.log('🚀 Début export PDF haute qualité...');
      
      const element = document.getElementById('report-content');
      if (!element) {
        console.error('❌ Élément report-content non trouvé');
        alert('❌ Erreur : contenu du rapport non trouvé');
        setIsExporting(false);
        return;
      }

      console.log('📸 Capture haute résolution avec pixelRatio 3...');
      
      // Obtenir les dimensions réelles de l'élément
      const rect = element.getBoundingClientRect();
      const pixelRatio = 3; // 3x la résolution pour haute qualité
      
      const dataUrl = await domtoimage.toPng(element, {
        width: rect.width,
        height: rect.height,
        style: {
          margin: '0',
          padding: '0',
        },
        // Options pour haute qualité
        pixelRatio: pixelRatio,
        quality: 1.0,
        cacheBust: true,
      });

      console.log('✅ Image haute résolution capturée');

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false,
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      
      // Créer une image pour obtenir les dimensions
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = pdfWidth;
      const imgHeight = (img.height * imgWidth) / img.width;
      
      let position = 0;
      let heightLeft = imgHeight;

      console.log('📄 Ajout de l\'image haute qualité au PDF...');
      
      // Ajouter la première page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const filename = `${productBrief?.productName || 'design-report'}-rapport.pdf`;
      console.log('💾 Sauvegarde du PDF:', filename);
      
      pdf.save(filename);
      
      console.log('✅ PDF haute qualité exporté !');
      
      setTimeout(() => {
        alert(`✅ PDF haute qualité téléchargé !\n\n📁 Fichier : ${filename}\n📂 Dossier : Téléchargements\n\n✨ Résolution ${pixelRatio}x (${rect.width * pixelRatio}x${rect.height * pixelRatio} pixels)\n🎨 Qualité maximale préservée`);
      }, 500);
      
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      alert(`❌ Erreur lors de l'export PDF :\n\n${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nVérifiez la console (F12) pour plus de détails.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBack = () => {
    router.push('/design-assistant/3d-model');
  };

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
            <h1 className="text-3xl font-bold">Phase 5 : Rapport Final</h1>
            <p className="text-muted-foreground">
              Synthèse complète du projet de conception
            </p>
          </div>
        </div>
        <Button onClick={handleExportPDF} disabled={isExporting} size="lg" className="min-w-[200px]">
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? '⏳ Export en cours...' : '📥 Exporter en PDF'}
        </Button>
      </div>

      {/* Notification d'export en cours */}
      {isExporting && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <div>
                <p className="font-semibold text-blue-900">Export PDF en cours...</p>
                <p className="text-sm text-blue-700">Veuillez patienter quelques secondes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      <div id="report-content" className="space-y-6 bg-white p-8">
        {/* Title Page */}
        <Card className="border-none shadow-none bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-12 pb-12">
            <h2 className="text-4xl font-bold mb-4">{productBrief?.productName || 'Produit'}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rapport de conception - {new Date().toLocaleDateString('fr-FR')}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Catégorie</p>
                <p className="text-muted-foreground">{productBrief?.category}</p>
              </div>
              <div>
                <p className="font-semibold">Style</p>
                <p className="text-muted-foreground">{productBrief?.style}</p>
              </div>
              <div>
                <p className="font-semibold">Public Cible</p>
                <p className="text-muted-foreground">{productBrief?.targetAudience}</p>
              </div>
              <div>
                <p className="font-semibold">Matériaux</p>
                <p className="text-muted-foreground">{productBrief?.materials || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Brief Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fiche Produit
            </CardTitle>
            <CardDescription>Caractéristiques et spécifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{productBrief?.description}</p>
            </div>

            {productBrief?.keyFeatures && productBrief.keyFeatures.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Caractéristiques principales</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {productBrief.keyFeatures.map((feature, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              {productBrief?.colors && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">COULEURS</p>
                  <p className="text-sm">{productBrief.colors}</p>
                </div>
              )}
              {productBrief?.dimensions && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">DIMENSIONS</p>
                  <p className="text-sm">{productBrief.dimensions}</p>
                </div>
              )}
              {productBrief?.usageContext && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground">CONTEXTE D'UTILISATION</p>
                  <p className="text-sm">{productBrief.usageContext}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Concept Section */}
        {selectedConcept && (
          <Card>
            <CardHeader>
              <CardTitle>Concept Sélectionné</CardTitle>
              <CardDescription>Design principal validé</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={selectedConcept.imageUrl}
                  alt="Concept sélectionné"
                  className="w-full h-full object-contain"
                />
              </div>
              {selectedConcept.description && (
                <p className="text-sm text-muted-foreground">{selectedConcept.description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Components Section */}
        {selectedComponents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Décomposition Composants
              </CardTitle>
              <CardDescription>
                {selectedComponents.length} composant(s) avec variantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedComponents.map((component) => (
                  <div key={component.id} className="border-b pb-6 last:border-b-0">
                    <h4 className="font-semibold mb-2">{component.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{component.description}</p>

                    {component.variants && component.variants.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          VARIANTES
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {component.variants.map((variant, idx) => (
                            <div
                              key={idx}
                              className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                                idx === component.selectedVariant
                                  ? 'border-primary'
                                  : 'border-transparent'
                              }`}
                            >
                              <img
                                src={variant.imageUrl}
                                alt={`Variant ${idx + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                        </div>
                        {component.variants[component.selectedVariant] && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ✓ Sélectionné :{' '}
                            {component.variants[component.selectedVariant].description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3D Model Section */}
        {model3D && (
          <Card>
            <CardHeader>
              <CardTitle>Modèle 3D</CardTitle>
              <CardDescription>Rendu trois dimensions interactif</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <strong>Format :</strong> {model3D.format?.toUpperCase() || 'GLB'}
              </p>
              <p className="text-sm">
                <strong>Généré :</strong>{' '}
                {new Date(model3D.generatedAt).toLocaleDateString('fr-FR')}
              </p>
              {model3D.isDemoMode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                  💡 Mode démo : Modèle illustratif pour aperçu du workflow
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Résumé du Projet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Phases complétées :</strong> 5/5
              (Briefing → Concepts → Décomposition → 3D → Rapport)
            </p>
            <p>
              <strong>Composants utilisés :</strong> {selectedComponents.length}
            </p>
            <p>
              <strong>Total variantes :</strong>{' '}
              {selectedComponents.reduce((acc, c) => acc + (c.variants?.length || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground pt-2">
              Ce rapport synthétise l'intégralité du processus de conception assisté par IA.
              Tous les assets générés sont disponibles pour utilisation en production.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleBack} variant="outline" className="flex-1">
          Retour au 3D
        </Button>
        <Button
          onClick={() => router.push('/design-assistant')}
          className="flex-1"
        >
          Nouveau projet
        </Button>
      </div>
    </div>
  );
}
