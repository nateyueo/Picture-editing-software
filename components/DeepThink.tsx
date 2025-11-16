import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LoaderCircle, BrainCircuit } from 'lucide-react';
import { Button } from './common/Button';
import { Card } from './common/Card';

export const DeepThink: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
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
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
        },
      });

      setResponse(result.text);
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
          <h2 className="text-2xl font-bold text-slate-50 mb-1">Cognito Drive</h2>
          <p className="text-purple-300 mb-6">Engage Gemini's advanced reasoning for your most complex problems.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a complex prompt, e.g., 'Write Python code for a web application that visualizes real-time stock market data'"
              disabled={loading}
              rows={8}
              className="w-full bg-slate-900/70 border border-purple-500/30 rounded-md p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition"
            />
            <Button type="submit" disabled={loading || !prompt.trim()} className="self-start">
              {loading ? <LoaderCircle className="animate-spin" /> : <BrainCircuit />}
              <span>{loading ? 'Engaging...' : 'Generate Response'}</span>
            </Button>
          </form>
        </div>
      </Card>

      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

      {(loading || response) && (
        <Card className="mt-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-slate-200">Response</h3>
            {loading && (
              <div className="w-full h-48 bg-black/20 rounded-lg flex flex-col justify-center items-center border border-purple-500/30">
                <LoaderCircle size={48} className="animate-spin text-fuchsia-400" />
                <p className="mt-4 text-purple-300">Processing your complex query...</p>
              </div>
            )}
            {response && (
              <div className="prose prose-invert max-w-none bg-black/30 p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-slate-200"><code>{response}</code></pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};