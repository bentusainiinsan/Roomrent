import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob, LiveSession } from '@google/genai';
import { TranscriptionEntry } from '../types';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

interface LiveAssistantProps {
  onClose: () => void;
}

// Audio helper functions
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
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

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose }) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'error'>('idle');
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const conversationEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptionHistory, currentInput, currentOutput]);

    useEffect(() => {
        return () => {
           // Cleanup on unmount
           if(sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session.close());
           }
           mediaStreamRef.current?.getTracks().forEach(track => track.stop());
           audioContextRef.current?.close();
           outputAudioContextRef.current?.close();
        };
    }, []);

    const startConversation = async () => {
        setStatus('connecting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Fix: Suppress TypeScript error for vendor-prefixed webkitAudioContext.
            // @ts-ignore
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            // Fix: Suppress TypeScript error for vendor-prefixed webkitAudioContext.
            // @ts-ignore
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are a friendly and helpful assistant for Sonipat Home Service, a property rental website. Keep your answers concise and helpful.'
                },
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setCurrentInput(prev => prev + message.serverContent.inputTranscription.text);
                        }
                        if (message.serverContent?.outputTranscription) {
                             setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscriptionHistory(prev => [...prev, 
                                { speaker: 'user', text: currentInput + (message.serverContent.inputTranscription?.text || '') },
                                { speaker: 'model', text: currentOutput + (message.serverContent.outputTranscription?.text || '') }
                            ]);
                            setCurrentInput('');
                            setCurrentOutput('');
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audioData && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setStatus('error');
                    },
                    onclose: () => {
                       // Handled by stopConversation
                    },
                }
            });

        } catch (err) {
            console.error('Failed to start conversation:', err);
            setStatus('error');
        }
    };
    
    const stopConversation = () => {
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
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        audioContextRef.current?.close().then(() => audioContextRef.current = null);
        outputAudioContextRef.current?.close().then(() => outputAudioContextRef.current = null);
        setStatus('idle');
    };

    const handleButtonClick = () => {
        if (status === 'listening' || status === 'connecting') {
            stopConversation();
        } else {
            startConversation();
        }
    };

    const getButtonText = () => {
        switch (status) {
            case 'idle': return 'Start Conversation';
            case 'connecting': return 'Connecting...';
            case 'listening': return 'Stop Conversation';
            case 'error': return 'Retry Conversation';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[70vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <MicrophoneIcon className="w-6 h-6 text-teal-500" />
                        <h2 className="text-2xl font-bold text-gray-800">AI Assistant</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
                    {transcriptionHistory.map((entry, index) => (
                        <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="text-sm">{entry.text}</p>
                            </div>
                        </div>
                    ))}
                     {currentInput && <div className="flex justify-end"><div className="max-w-md p-3 rounded-lg bg-blue-200 text-blue-800"><p className="text-sm italic">{currentInput}...</p></div></div>}
                     {currentOutput && <div className="flex justify-start"><div className="max-w-md p-3 rounded-lg bg-gray-100 text-gray-500"><p className="text-sm italic">{currentOutput}...</p></div></div>}
                     <div ref={conversationEndRef} />
                </div>

                <div className="p-4 border-t">
                    <button onClick={handleButtonClick} className="w-full px-4 py-3 bg-teal-500 text-white rounded-md font-semibold hover:bg-teal-600 disabled:bg-teal-300 transition-colors">
                        {getButtonText()}
                    </button>
                    {status === 'error' && <p className="text-red-500 text-sm text-center mt-2">An error occurred. Please check console and permissions.</p>}
                </div>
            </div>
        </div>
    );
};

export default LiveAssistant;
