import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LoaderCircle, Wand2 } from 'lucide-react';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Card } from './common/Card';

const defaultPrompt = "epic anime artwork, a girl with glowing headphones, listening to music in a futuristic subway car, reflections on the window show a neon city, cyberpunk aesthetic, masterpiece, best quality";
const defaultImage = "https://placehold.co/1024x1024/24243e/a855f7/png?text=Describe+your%0AAnime+Vision!";

export const ImageGenerate: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(defaultPrompt);
  const [image, setImage] = useState<string | null>(defaultImage);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setLoading(true);
    setError(null);
    setImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      setImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-50 mb-1">AI Art Creation</h2>
          <p className="text-purple-300 mb-6">Describe your vision and bring it to life as a stunning anime-style artwork.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A majestic lion wearing a crown in a futuristic city"
              disabled={loading}
              className="flex-grow"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin" /> : <Wand2 />}
              <span>{loading ? 'Dreaming...' : 'Create'}</span>
            </Button>
          </form>
        </div>
      </Card>

      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

      <div className="mt-8 flex justify-center items-center">
        {loading && (
          <div className="w-full h-96 bg-black/20 rounded-lg flex flex-col justify-center items-center border border-purple-500/30">
            <LoaderCircle size={48} className="animate-spin text-fuchsia-400" />
            <p className="mt-4 text-purple-300">Conjuring your vision...</p>
          </div>
        )}
        {image && (
          <img src={image} alt={prompt} className="rounded-lg shadow-2xl shadow-fuchsia-900/50 max-w-full h-auto" />
        )}
      </div>
    </div>
  );
};