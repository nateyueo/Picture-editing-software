import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/fileUtils';
import { LoaderCircle, UploadCloud, WandSparkles } from 'lucide-react';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Card } from './common/Card';

export const ImageEdit: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<{ file: File, dataUrl: string } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      setOriginalImage({ file, dataUrl: URL.createObjectURL(file) });
      setEditedImage(null);
      setError(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalImage || !prompt.trim()) {
      setError('Please upload an image and provide an editing prompt.');
      return;
    }

    setLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const base64Data = await fileToBase64(originalImage.file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: originalImage.file.type } },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const firstPart = response.candidates?.[0]?.content?.parts?.[0];
      if (firstPart?.inlineData) {
        const editedImageUrl = `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
        setEditedImage(editedImageUrl);
      } else {
        throw new Error('No edited image was returned from the API.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [originalImage, prompt]);

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-50 mb-1">Remix Your Art</h2>
          <p className="text-purple-300 mb-6">Use AI to magically edit and transform your artwork.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-500/30 rounded-lg h-64 bg-slate-900/50">
              {originalImage ? (
                <img src={originalImage.dataUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-md" />
              ) : (
                <>
                  <UploadCloud size={48} className="text-slate-500 mb-2" />
                  <label htmlFor="image-upload" className="cursor-pointer text-fuchsia-400 font-semibold hover:underline">
                    Upload an image
                  </label>
                  <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </>
              )}
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 justify-center">
              <Input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Add a retro filter"
                disabled={loading || !originalImage}
                className="w-full"
              />
              <Button type="submit" disabled={loading || !originalImage || !prompt.trim()}>
                {loading ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                <span>{loading ? 'Remixing...' : 'Remix Image'}</span>
              </Button>
            </form>
          </div>
        </div>
      </Card>
      
      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

      <div className="mt-8">
        {loading && (
          <div className="w-full h-96 bg-black/20 rounded-lg flex flex-col justify-center items-center border border-purple-500/30">
            <LoaderCircle size={48} className="animate-spin text-fuchsia-400" />
            <p className="mt-4 text-purple-300">Applying your edits...</p>
          </div>
        )}
        {editedImage && (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold text-center mb-2 text-slate-300">Original</h3>
              {originalImage && <img src={originalImage.dataUrl} alt="Original" className="rounded-lg shadow-lg w-full" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-center mb-2 text-slate-300">Remixed</h3>
              <img src={editedImage} alt="Edited" className="rounded-lg shadow-2xl shadow-fuchsia-900/50 w-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};