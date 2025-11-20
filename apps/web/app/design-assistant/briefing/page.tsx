'use client';

import { useState } from 'react';
import { PageBody } from '@kit/ui/page';
import { Card, CardHeader, CardTitle, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { Upload, Send, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sketchImage?: string; // Ajouter l'image du sketch
}

interface ProductBrief {
  productName: string;
  category: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  style: string;
  materials: string[];
  colors: string[];
  dimensions: string;
  usageContext: string;
}

export default function BriefingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Bonjour ! 👋 Je suis votre assistant de design produit.\n\nPour commencer, décrivez-moi le produit que vous souhaitez créer. Vous pouvez aussi uploader un sketch (optionnel).\n\nQuand vous êtes prêt, dites-moi 'génère la fiche' pour créer votre brief structuré !",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [brief, setBrief] = useState<ProductBrief | null>(null);
  const [step, setStep] = useState<'conversation' | 'review'>('conversation');

  const handleSendMessage = async () => {
    if (!inputText.trim() && !sketchFile) return;

    // Convertir le sketch en base64 si présent
    let sketchBase64 = null;
    if (sketchFile) {
      sketchBase64 = await fileToBase64(sketchFile);
    }

    // Add user message with sketch if present
    const userMessage: Message = {
      role: 'user',
      content: inputText || '📎 Sketch uploadé',
      timestamp: new Date(),
      sketchImage: sketchBase64 || undefined, // Sauvegarder l'image
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call new chat API
      const response = await fetch('/api/design/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sketchImage: sketchBase64,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Check if response contains a product brief (JSON)
      let briefData = null;
      try {
        // Essayer d'extraire le JSON de la réponse
        const jsonMatch = data.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          briefData = JSON.parse(jsonMatch[0]);
          console.log('✅ Brief généré:', briefData);
        }
      } catch (e) {
        // Pas de JSON dans la réponse, c'est un message normal
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: briefData 
          ? '✅ Fiche produit générée avec succès ! Consultez le récapitulatif ci-dessous.'
          : data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If brief is complete, save it and switch to review
      if (briefData) {
        setBrief(briefData);
        setStep('review');
      }

      setSketchFile(null);
    } catch (error: any) {
      console.error('❌ Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Désolé, une erreur s'est produite: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSketchFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateConcepts = () => {
    // Store brief in localStorage for next step
    if (brief) {
      localStorage.setItem('productBrief', JSON.stringify(brief));
      router.push('/design-assistant/concepts');
    }
  };

  if (step === 'review' && brief) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <PageBody>
          <div className="mb-8">
            <Link href="/design-assistant">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-2">Fiche de Briefing Complète</h1>
          <p className="text-muted-foreground mb-8">
            Vérifiez les informations avant de passer à la génération des concepts
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Fiche Produit - {brief.productName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-semibold text-sm">Catégorie</label>
                <p className="text-muted-foreground">{brief.category}</p>
              </div>
              <div>
                <label className="font-semibold text-sm">Description</label>
                <p className="text-muted-foreground">{brief.description}</p>
              </div>
              <div>
                <label className="font-semibold text-sm">Public cible</label>
                <p className="text-muted-foreground">{brief.targetAudience}</p>
              </div>
              <div>
                <label className="font-semibold text-sm">
                  Caractéristiques clés
                </label>
                <ul className="list-disc list-inside text-muted-foreground">
                  {brief.keyFeatures.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="font-semibold text-sm">Style visuel</label>
                <p className="text-muted-foreground">{brief.style}</p>
              </div>
              <div>
                <label className="font-semibold text-sm">Matériaux</label>
                <p className="text-muted-foreground">{brief.materials.join(', ')}</p>
              </div>
              <div>
                <label className="font-semibold text-sm">Couleurs</label>
                <p className="text-muted-foreground">{brief.colors.join(', ')}</p>
              </div>
              <div>
                <label className="font-semibold text-sm">Dimensions</label>
                <p className="text-muted-foreground">{brief.dimensions}</p>
              </div>
              <div>
                <label className="font-semibold text-sm">Contexte d'utilisation</label>
                <p className="text-muted-foreground">{brief.usageContext}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep('conversation')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Modifier le briefing
            </Button>
            <Button onClick={handleGenerateConcepts} className="flex-1">
              Générer les concepts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <PageBody>
        <div className="mb-8">
          <Link href="/design-assistant">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          Phase 1: Briefing Intelligent
        </h1>
        <p className="text-muted-foreground mb-8">
          Discutez avec l'IA pour structurer votre idée de produit
        </p>

        {/* Chat Interface */}
        <Card className="mb-4">
          <CardContent className="p-6">
            {/* Messages */}
            <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {/* Afficher le sketch s'il existe */}
                    {msg.sketchImage && (
                      <div className="mb-2">
                        <img
                          src={msg.sketchImage}
                          alt="Sketch"
                          className="max-w-full h-auto rounded-md border"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <p className="text-sm">L'IA réfléchit...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="space-y-3">
              {sketchFile && (
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm flex-1">{sketchFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSketchFile(null)}
                  >
                    ✕
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Décrivez votre produit... (Shift+Enter pour nouvelle ligne)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[60px]"
                  disabled={isLoading}
                />
                <div className="flex flex-col gap-2">
                  <label htmlFor="sketch-upload">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                      onClick={() =>
                        document.getElementById('sketch-upload')?.click()
                      }
                      type="button"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </label>
                  <input
                    id="sketch-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isLoading || (!inputText.trim() && !sketchFile)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-sm">💡 Conseils</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Décrivez la fonction principale de votre produit</li>
              <li>• Mentionnez votre public cible</li>
              <li>• Précisez le style souhaité (moderne, rétro, minimaliste...)</li>
              <li>• Indiquez les contraintes (taille, matériaux, budget...)</li>
            </ul>
          </CardContent>
        </Card>
      </PageBody>
    </div>
  );
}
