'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import { Input } from '@kit/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Slider } from '@kit/ui/slider';
import { Sparkles, Settings, Box, FileText, Cpu, Eye, Loader2 } from 'lucide-react';

export default function GenerativeDesignPage() {
  const [activePhase, setActivePhase] = useState<'ideation' | 'optimization'>('ideation');
  const [inputMode, setInputMode] = useState<'ai' | 'manual'>('ai');
  const [userDescription, setUserDescription] = useState('');
  const [brief, setBrief] = useState('');
  const [parsedParams, setParsedParams] = useState<any>(null);
  const [resolution, setResolution] = useState([25]);
  const [penalty, setPenalty] = useState('3.0');
  const [iterations, setIterations] = useState('40');
  
  // États de chargement
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // États pour les résultats
  const [metrics, setMetrics] = useState<any>(null);
  const [stlUrl, setStlUrl] = useState('');
  
  // États pour le formulaire manuel
  const [shape, setShape] = useState('Cylinder');
  const [material, setMaterial] = useState('Acier');
  const [forceValue, setForceValue] = useState('1000');

  const handleGenerateBrief = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generative-design/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: inputMode === 'ai' ? userDescription : { shape, material, force: forceValue },
          mode: inputMode,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setBrief(data.brief_text);
        setParsedParams(data.parsed_params);
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur génération:', error);
      alert('Erreur lors de la génération du brief');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunOptimization = async () => {
    if (!parsedParams) {
      alert('Veuillez d\'abord générer un brief');
      return;
    }

    setIsOptimizing(true);
    try {
      // Mettre à jour les paramètres d'optimisation
      const optimizationParams = {
        ...parsedParams,
        optimization: {
          ...parsedParams.optimization,
          resolution: resolution[0],
          penalty: parseFloat(penalty),
          iterations: parseInt(iterations),
        },
      };

      const response = await fetch('/api/generative-design/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizationParams),
      });

      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
        setStlUrl(data.stl_url);
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur optimisation:', error);
      alert('Erreur lors de l\'optimisation');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Box className="w-8 h-8 text-primary" />
            Optimisation Topologique IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Transformez une description naturelle en pièce mécanique optimisée
          </p>
        </div>
      </div>

      {/* Sélecteur de Phase */}
      <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ideation" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Phase 1: Idéation
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Phase 2: Optimisation
          </TabsTrigger>
        </TabsList>

        {/* PHASE 1: IDÉATION */}
        <TabsContent value="ideation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Génération du Brief Technique
              </CardTitle>
              <CardDescription>
                Utilisez l'IA ou saisissez manuellement les paramètres de votre pièce
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode sélection */}
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai">IA Générative (Gemini)</TabsTrigger>
                  <TabsTrigger value="manual">Formulaire Manuel</TabsTrigger>
                </TabsList>

                {/* Mode IA */}
                <TabsContent value="ai" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Décrivez votre pièce en langage naturel
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Exemple: Je veux optimiser un support de roue pour un drone. Il doit supporter 50N vertical, être en aluminium, dimensions 100x100x20mm..."
                      rows={6}
                      value={userDescription}
                      onChange={(e) => setUserDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateBrief} 
                    className="w-full"
                    disabled={!userDescription.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Générer Brief avec Gemini 2.5-flash
                      </>
                    )}
                  </Button>
                </TabsContent>

                {/* Mode Manuel */}
                <TabsContent value="manual" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shape">Forme</Label>
                      <Select value={shape} onValueChange={setShape}>
                        <SelectTrigger id="shape">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cylinder">Cylindre</SelectItem>
                          <SelectItem value="Box">Boîte</SelectItem>
                          <SelectItem value="Sphere">Sphère</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material">Matériau</Label>
                      <Select value={material} onValueChange={setMaterial}>
                        <SelectTrigger id="material">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Acier">Acier (E=210 GPa)</SelectItem>
                          <SelectItem value="Aluminium">Aluminium (E=70 GPa)</SelectItem>
                          <SelectItem value="Titane">Titane (E=110 GPa)</SelectItem>
                          <SelectItem value="ABS">ABS (E=2.3 GPa)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="force">Force (N)</Label>
                      <Input
                        id="force"
                        type="number"
                        value={forceValue}
                        onChange={(e) => setForceValue(e.target.value)}
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateBrief} 
                    className="w-full"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Créer Brief Manuel
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Affichage du Brief */}
              {brief && (
                <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Brief Généré:</h3>
                    {inputMode === 'ai' && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Généré par Gemini 2.0
                      </span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{brief}</pre>
                  </div>
                  <Button 
                    onClick={() => setActivePhase('optimization')} 
                    className="w-full"
                  >
                    Passer à l'Optimisation →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PHASE 2: OPTIMISATION */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Panneau de Contrôle */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Paramètres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Résolution: {resolution[0]}</Label>
                  <Slider
                    value={resolution}
                    onValueChange={setResolution}
                    min={15}
                    max={40}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Plus élevé = meilleure qualité mais plus lent
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penalty">Pénalité SIMP</Label>
                  <Input 
                    id="penalty" 
                    type="number" 
                    value={penalty}
                    onChange={(e) => setPenalty(e.target.value)}
                    step="0.1" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iterations">Itérations</Label>
                  <Input 
                    id="iterations" 
                    type="number" 
                    value={iterations}
                    onChange={(e) => setIterations(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleRunOptimization} 
                  className="w-full"
                  size="lg"
                  disabled={!parsedParams || isOptimizing}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Optimisation en cours...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 mr-2" />
                      Lancer Optimisation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Visualisation 3D */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Visualisation 3D
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  {isOptimizing ? (
                    <div className="text-center">
                      <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-lg font-semibold">Optimisation SIMP en cours...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calcul de {iterations} itérations (résolution: {resolution[0]})
                      </p>
                    </div>
                  ) : stlUrl ? (
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-8 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <Box className="w-20 h-20 mx-auto mb-4 text-green-600 dark:text-green-400" />
                        <p className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
                          ✅ Optimisation Terminée !
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Fichier STL généré (simulé)
                        </p>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border text-xs font-mono text-left">
                          📁 {stlUrl}
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-4 flex items-center justify-center gap-2">
                          <span>⚠️</span>
                          <span>Mode simulation - Étape 3 ajoutera la vraie optimisation SIMP</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Box className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p>La visualisation 3D s'affichera ici</p>
                      <p className="text-sm mt-1">Lancez une optimisation pour voir le résultat</p>
                    </div>
                  )}
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-lg font-bold">
                      {metrics ? `${(metrics.volume_optimized / 1000).toFixed(1)} cm³` : '- cm³'}
                    </p>
                    {metrics && (
                      <p className="text-xs text-green-600">
                        -{metrics.volume_reduction}%
                      </p>
                    )}
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Masse</p>
                    <p className="text-lg font-bold">
                      {metrics ? `${metrics.mass} g` : '- g'}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Sécurité</p>
                    <p className="text-lg font-bold">
                      {metrics ? metrics.safety_factor.toFixed(1) : '-'}
                    </p>
                  </div>
                </div>

                {/* Détails supplémentaires */}
                {metrics && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Détails de l'optimisation</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Itérations :</span>{' '}
                        <span className="font-medium">{metrics.iterations_completed}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Compliance :</span>{' '}
                        <span className="font-medium">{metrics.compliance.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contrainte max :</span>{' '}
                        <span className="font-medium">{(metrics.max_stress / 1e6).toFixed(1)} MPa</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Réduction volume :</span>{' '}
                        <span className="font-medium text-green-600">{metrics.volume_reduction}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

