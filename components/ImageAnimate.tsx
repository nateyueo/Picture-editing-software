import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { fileToBase64 } from '../utils/fileUtils';
import { LoaderCircle, UploadCloud, PlayCircle, KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Card } from './common/Card';

type AspectRatio = '16:9' | '9:16';

export const ImageAnimate: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [sourceImage, setSourceImage] = useState<{ file: File, dataUrl: string } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
      setIsKeySelected(true);
      return true;
    }
    setIsKeySelected(false);
    return false;
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume key selection is successful to avoid race conditions.
      setIsKeySelected(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSourceImage({ file, dataUrl: URL.createObjectURL(file) });
      setVideoUrl(null);
      setError(null);
    } else {
      setError('Please select a valid image file.');
    }
  };

  const pollOperation = async (operation: any) => {
    let currentOperation = operation;
    while (!currentOperation.done) {
      setStatusMessage('Polling for video status...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      try {
        currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
      } catch(err) {
        if(err instanceof Error && err.message.includes("Requested entity was not found")) {
            // Key might be invalid, prompt user to select again.
            setIsKeySelected(false);
            setError("Your API key seems invalid. Please re-select your key and try again.");
            return null;
        }
        throw err;
      }
    }
    return currentOperation;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceImage) {
      setError('Please upload an image to animate.');
      return;
    }
    if (!await checkApiKey()) {
        setError("Please select an API key to generate videos.");
        return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage('Preparing your animation...');

    try {
      const base64Data = await fileToBase64(sourceImage.file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      setStatusMessage('Sending request to Veo...');
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: {
          imageBytes: base64Data,
          mimeType: sourceImage.file.type,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio,
        }
      });

      setStatusMessage('Generation in progress. This may take a few minutes...');
      const completedOperation = await pollOperation(operation);

      if(!completedOperation) return; // Error handled inside pollOperation

      const downloadLink = completedOperation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatusMessage('Fetching your video...');
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        setVideoUrl(URL.createObjectURL(videoBlob));
      } else {
        throw new Error('Video generation failed or returned no link.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during video generation.');
      console.error(err);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };
  
  if (!isKeySelected) {
    return (
        <Card>
            <div className="p-6 text-center">
                <KeyRound size={48} className="mx-auto text-yellow-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-50 mb-2">API Key Required</h2>
                <p className="text-purple-300 mb-4">Video generation with Veo requires you to select your own API key. Billing is associated with your project.</p>
                <p className="text-sm text-slate-500 mb-6">Learn more about billing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
                <Button onClick={handleSelectKey}>Select API Key</Button>
            </div>
        </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-50 mb-1">Animate Your Art</h2>
          <p className="text-purple-300 mb-6">Transform static art into captivating video with Veo.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-500/30 rounded-lg h-64 bg-slate-900/50">
              {sourceImage ? (
                <img src={sourceImage.dataUrl} alt="Source" className="max-h-full max-w-full object-contain rounded-md" />
              ) : (
                <>
                  <UploadCloud size={48} className="text-slate-500 mb-2" />
                  <label htmlFor="image-upload-animate" className="cursor-pointer text-fuchsia-40al font-semibold hover:underline">
                    Upload an image
                  </label>
                  <input id="image-upload-animate" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </>
              )}
            </div>
            
            <Input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Optional: Describe the animation (e.g., a gentle breeze)"
              disabled={loading || !sourceImage}
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
              <div className="flex gap-4">
                {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                  <label key={ratio} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="aspectRatio" value={ratio} checked={aspectRatio === ratio} onChange={() => setAspectRatio(ratio)} className="form-radio bg-slate-700 border-slate-600 text-fuchsia-500 focus:ring-fuchsia-600" disabled={loading} />
                    <span className="text-slate-200">{ratio} ({ratio === '16:9' ? 'Landscape' : 'Portrait'})</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading || !sourceImage} className="w-full">
              {loading ? <LoaderCircle className="animate-spin" /> : <PlayCircle />}
              <span>{loading ? 'Animating...' : 'Animate Image'}</span>
            </Button>
          </form>
        </div>
      </Card>
      
      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-3">
          <AlertTriangle className="text-red-400" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {(loading || videoUrl) && (
        <div className="mt-8">
          {loading && (
            <div className="w-full aspect-video bg-black/20 rounded-lg flex flex-col justify-center items-center border border-purple-500/30">
              <LoaderCircle size={48} className="animate-spin text-fuchsia-400" />
              <p className="mt-4 text-purple-300">{statusMessage}</p>
            </div>
          )}
          {videoUrl && (
            <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-2xl shadow-fuchsia-900/50" />
          )}
        </div>
      )}
    </div>
  );
};