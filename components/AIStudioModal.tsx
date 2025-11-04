import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { SparklesIcon } from './icons/SparklesIcon';

interface AIStudioModalProps {
  onClose: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // remove the data url prefix
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const AIStudioModal: React.FC<AIStudioModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('imageGen');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image Gen state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Image Edit state
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  // Video Gen state
  const [videoImage, setVideoImage] = useState<File | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState('');
  
  // Smart Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);


  const handleImageGen = async () => {
    if (!prompt) { setError('Please enter a prompt.'); return; }
    setIsLoading(true); setError(null); setGeneratedImage(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1 },
      });
      const base64Image = response.generatedImages[0].image.imageBytes;
      setGeneratedImage(`data:image/png;base64,${base64Image}`);
    } catch (e: any) { setError(e.message); }
    setIsLoading(false);
  };

  const handleImageEdit = async () => {
    if (!originalImage || !editPrompt) { setError('Please upload an image and enter an edit prompt.'); return; }
    setIsLoading(true); setError(null); setEditedImage(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = await blobToBase64(originalImage);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: originalImage.type } },
            { text: editPrompt },
          ],
        },
        config: { responseModalities: [Modality.IMAGE] },
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setEditedImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (e: any) { setError(e.message); }
    setIsLoading(false);
  };

  const handleVideoGen = async () => {
    if (!videoImage) { setError('Please upload a starting image for the video.'); return; }

    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    
    setIsLoading(true); setError(null); setGeneratedVideo(null);
    setVideoStatus('Starting video generation... This may take a few minutes.');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = await blobToBase64(videoImage);
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt || 'Animate this image.',
        image: { imageBytes: base64Data, mimeType: videoImage.type },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio },
      });

      setVideoStatus('Video is processing. Polling for results every 10 seconds...');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      setVideoStatus('Video generated! Fetching video data...');
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        setGeneratedVideo(URL.createObjectURL(videoBlob));
        setVideoStatus('Video ready to play!');
      } else {
        throw new Error('Video generation finished, but no download link was found.');
      }

    } catch (e: any) {
      if (e.message.includes("Requested entity was not found.")) {
        setError("API key not found or invalid. Please select a valid key.");
        // Reset key state if possible, or prompt user again
        await window.aistudio.openSelectKey();
      } else {
         setError(`Video generation failed: ${e.message}`);
      }
      setVideoStatus('');
    }
    setIsLoading(false);
  };
  
  const handleSmartSearch = async () => {
    if (!searchQuery) { setError('Please enter a search query.'); return; }
    setIsLoading(true); setError(null); setSearchResult(null);
    
    const useMaps = /nearby|near me|restaurant|shop|location|direction/i.test(searchQuery);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const config: any = {
            tools: useMaps ? [{ googleMaps: {} }] : [{ googleSearch: {} }],
        };

        if (useMaps) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                config.toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        }
                    }
                };
            } catch (geoError) {
                console.warn("Geolocation failed, proceeding without it.", geoError);
            }
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: searchQuery,
            config: config,
        });

        setSearchResult({
            text: response.text,
            chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        });

    } catch (e: any) {
        setError(e.message);
    }
    setIsLoading(false);
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'imageGen':
        return (
            <div>
                <h3 className="text-lg font-semibold mb-2">Image Generation (Imagen)</h3>
                <p className="text-sm text-gray-500 mb-4">Describe the image you want to create.</p>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., A futuristic apartment building in Sonipat" className="w-full rounded-md border-gray-300 shadow-sm" rows={3}></textarea>
                <button onClick={handleImageGen} disabled={isLoading} className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                    {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
                {generatedImage && <img src={generatedImage} alt="Generated" className="mt-4 rounded-lg shadow-md w-full" />}
            </div>
        );
      case 'imageEdit':
        return (
             <div>
                <h3 className="text-lg font-semibold mb-2">Image Editing (Gemini)</h3>
                <p className="text-sm text-gray-500 mb-4">Upload an image and tell the AI how to change it.</p>
                <input type="file" accept="image/*" onChange={e => setOriginalImage(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="e.g., Add a swimming pool in the backyard" className="mt-4 w-full rounded-md border-gray-300 shadow-sm" rows={2}></textarea>
                <button onClick={handleImageEdit} disabled={isLoading} className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                    {isLoading ? 'Editing...' : 'Edit Image'}
                </button>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {originalImage && <div><h4 className="text-center font-semibold">Original</h4><img src={URL.createObjectURL(originalImage)} alt="Original" className="rounded-lg shadow-md w-full" /></div>}
                    {editedImage && <div><h4 className="text-center font-semibold">Edited</h4><img src={editedImage} alt="Edited" className="rounded-lg shadow-md w-full" /></div>}
                </div>
            </div>
        );
      case 'videoGen':
        return (
            <div>
                <h3 className="text-lg font-semibold mb-2">Video Generation (Veo)</h3>
                <p className="text-sm text-gray-500 mb-1">Upload a starting image to animate.</p>
                <p className="text-xs text-blue-600 mb-4 p-2 bg-blue-50 rounded-md">Video generation requires a user-selected API key and may incur charges. Please see <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">billing details</a>.</p>
                <input type="file" accept="image/*" onChange={e => setVideoImage(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} placeholder="Prompt (optional), e.g., 'The clouds move slowly'" className="mt-4 w-full rounded-md border-gray-300 shadow-sm" rows={2}></textarea>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} className="mt-2 w-full rounded-md border-gray-300 shadow-sm">
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                </select>
                <button onClick={handleVideoGen} disabled={isLoading} className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                    {isLoading ? 'Generating Video...' : 'Generate Video'}
                </button>
                {videoStatus && <p className="mt-4 text-center text-gray-600">{videoStatus}</p>}
                {generatedVideo && <video src={generatedVideo} controls autoPlay loop className="mt-4 rounded-lg shadow-md w-full" />}
            </div>
        );
      case 'smartSearch':
        return (
             <div>
                <h3 className="text-lg font-semibold mb-2">Smart Search (Gemini)</h3>
                <p className="text-sm text-gray-500 mb-4">Ask anything! Get up-to-date answers from Google Search and Maps.</p>
                <div className="flex gap-2">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g., Best schools near Sector 14, Sonipat" className="flex-grow rounded-md border-gray-300 shadow-sm"/>
                    <button onClick={handleSmartSearch} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                        {isLoading ? '...' : 'Search'}
                    </button>
                </div>
                {searchResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="whitespace-pre-wrap">{searchResult.text}</p>
                        {searchResult.chunks.length > 0 && (
                            <div className="mt-4 border-t pt-2">
                                <h4 className="text-sm font-semibold text-gray-600">Sources:</h4>
                                <ul className="list-disc list-inside text-sm mt-1">
                                    {searchResult.chunks.map((chunk: any, index: number) => {
                                        const source = chunk.web || chunk.maps;
                                        return source ? <li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{source.title}</a></li> : null
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
  };

  const tabs = [
      { id: 'imageGen', label: 'Image Gen' },
      { id: 'imageEdit', label: 'Image Edit' },
      { id: 'videoGen', label: 'Video Gen' },
      { id: 'smartSearch', label: 'Smart Search' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">AI Studio</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`${
                        activeTab === tab.id
                            ? 'border-purple-500 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>

        <div className="p-6 overflow-y-auto">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}
            {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AIStudioModal;