import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { Mic, MicOff, Bot, User } from 'lucide-react';
import { Button } from './common/Button';
import { Card } from './common/Card';

interface Transcript {
    speaker: 'user' | 'model';
    text: string;
}

export const VoiceChat: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();
    
    const stopRecording = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const startRecording = async () => {
        setIsRecording(true);
        setTranscripts([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
        nextStartTime = 0;
        sources.clear();
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Fix: Cast window to 'any' to handle vendor-prefixed webkitAudioContext for cross-browser compatibility.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                            if (fullInput) {
                                setTranscripts(prev => [...prev, { speaker: 'user', text: fullInput }]);
                            }
                            if (fullOutput) {
                                setTranscripts(prev => [...prev, { speaker: 'model', text: fullOutput }]);
                            }
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current!.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current!.destination);
                            source.addEventListener('ended', () => sources.delete(source));
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        stopRecording();
                    },
                    onclose: () => {
                        // This may be called when user stops, which is fine.
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: 'You are a friendly and helpful AI assistant.',
                },
            });
        } catch (error) {
            console.error('Failed to start recording:', error);
            setIsRecording(false);
        }
    };
    
    const createBlob = (data: Float32Array): GenAIBlob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[80vh]">
            <Card className="flex-grow flex flex-col">
                <div className="p-6 border-b border-purple-500/30">
                    <h2 className="text-2xl font-bold text-slate-50 mb-1">AI Companion</h2>
                    <p className="text-purple-300">Chat with your friendly AI companion in real-time.</p>
                </div>
                <div className="flex-grow p-6 overflow-y-auto space-y-4">
                    {transcripts.length === 0 && (
                        <div className="text-center text-slate-500 h-full flex flex-col justify-center items-center">
                            <Mic size={48} className="mb-4" />
                            <p>Press the button below to start the conversation.</p>
                        </div>
                    )}
                    {transcripts.map((t, i) => (
                        <div key={i} className={`flex items-start gap-3 ${t.speaker === 'user' ? 'justify-end' : ''}`}>
                            {t.speaker === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center"><Bot size={18} className="text-fuchsia-400" /></div>}
                            <div className={`max-w-md p-3 rounded-lg ${t.speaker === 'user' ? 'bg-purple-800 text-slate-100' : 'bg-slate-800 text-slate-200'}`}>
                                <p>{t.text}</p>
                            </div>
                            {t.speaker === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/50 flex items-center justify-center"><User size={18} className="text-slate-300" /></div>}
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t border-purple-500/30 flex justify-center">
                    <Button onClick={handleToggleRecording} className={`w-20 h-20 rounded-full !p-0 flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-fuchsia-600 hover:bg-fuchsia-700'}`}>
                        {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                    </Button>
                </div>
            </Card>
        </div>
    );
};