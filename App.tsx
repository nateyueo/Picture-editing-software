import React, { useState, useMemo } from 'react';
import { ImageGenerate } from './components/ImageGenerate';
import { ImageEdit } from './components/ImageEdit';
import { ImageAnimate } from './components/ImageAnimate';
import { VoiceChat } from './components/VoiceChat';
import { WebSearch } from './components/WebSearch';
import { DeepThink } from './components/DeepThink';
import { Paintbrush, Wand2, Film, Mic, Search, BrainCircuit, Bot } from 'lucide-react';

type Feature = 'generate' | 'edit' | 'animate' | 'voice' | 'search' | 'think';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('generate');

  const features = useMemo(() => [
    { id: 'generate', name: 'Create Art', icon: Paintbrush },
    { id: 'edit', name: 'Remix Art', icon: Wand2 },
    { id: 'animate', name: 'Animate Art', icon: Film },
    { id: 'voice', name: 'AI Companion', icon: Mic },
    { id: 'search', name: 'Data Dive', icon: Search },
    { id: 'think', name: 'Cognito Drive', icon: BrainCircuit },
  ], []);

  const renderFeature = () => {
    switch (activeFeature) {
      case 'generate': return <ImageGenerate />;
      case 'edit': return <ImageEdit />;
      case 'animate': return <ImageAnimate />;
      case 'voice': return <VoiceChat />;
      case 'search': return <WebSearch />;
      case 'think': return <DeepThink />;
      default: return <ImageGenerate />;
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col md:flex-row">
      <nav className="bg-black/20 backdrop-blur-lg md:w-64 p-4 md:p-6 border-b md:border-r border-purple-500/20 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Bot size={32} className="text-fuchsia-400" />
          <h1 className="text-xl font-bold text-slate-50">Cyber Dream</h1>
        </div>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature.id}>
              <button
                onClick={() => setActiveFeature(feature.id as Feature)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeFeature === feature.id
                    ? 'bg-fuchsia-500/20 text-fuchsia-400 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <feature.icon size={20} />
                <span>{feature.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {renderFeature()}
      </main>
    </div>
  );
};

export default App;