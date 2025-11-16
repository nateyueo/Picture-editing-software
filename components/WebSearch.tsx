import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LoaderCircle, SendHorizontal, Link as LinkIcon } from 'lucide-react';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Card } from './common/Card';

interface Message {
  sender: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}

export const WebSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map(chunk => chunk.web)
        .filter(web => web?.uri && web.title)
        .map(web => ({ uri: web!.uri!, title: web!.title! }));

      const modelMessage: Message = {
        sender: 'model',
        text: response.text,
        sources: sources.length > 0 ? sources : undefined,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      const errorMessage: Message = {
        sender: 'model',
        text: err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[85vh]">
      <Card className="flex-grow flex flex-col">
        <div className="p-6 border-b border-purple-500/30">
          <h2 className="text-2xl font-bold text-slate-50 mb-1">Data Dive</h2>
          <p className="text-purple-300">Explore the web with AI-powered, grounded search.</p>
        </div>
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-xl p-4 rounded-lg ${msg.sender === 'user' ? 'bg-fuchsia-600/50 text-slate-100' : 'bg-slate-800 text-slate-200'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.sources && (
                <div className="max-w-xl mt-2">
                  <h4 className="text-sm font-semibold text-slate-400 mb-1">Sources:</h4>
                  <ul className="space-y-1">
                    {msg.sources.map((source, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <LinkIcon size={14} className="text-slate-500 mt-1 flex-shrink-0"/>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 text-sm hover:underline truncate">
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start">
              <div className="max-w-xl p-4 rounded-lg bg-slate-800 flex items-center gap-2">
                <LoaderCircle size={16} className="animate-spin text-fuchsia-400" />
                <span className="text-slate-400">Searching the web...</span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-purple-500/30">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-grow"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              <SendHorizontal />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};