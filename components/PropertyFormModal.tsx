import React, { useState } from 'react';
import type { Property } from '../types';
import { PropertyType } from '../types';
import { sonipatLocations } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon } from './icons/SparklesIcon';

interface PropertyFormModalProps {
  onClose: () => void;
  onSubmit: (propertyData: Omit<Property, 'id' | 'owner'>) => void;
}

const PropertyFormModal: React.FC<PropertyFormModalProps> = ({ onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState(PropertyType.Room);
    const [location, setLocation] = useState(Object.keys(sonipatLocations)[0]);
    const [subLocation, setSubLocation] = useState(sonipatLocations[location as keyof typeof sonipatLocations][0]);
    const [address, setAddress] = useState('');
    const [rent, setRent] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLocation = e.target.value;
        setLocation(newLocation);
        setSubLocation(sonipatLocations[newLocation as keyof typeof sonipatLocations][0]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).slice(0, 3);
            setImages(Array(files.length).fill(null).map((_, i) => `https://picsum.photos/seed/${Date.now()+i}/600/400`));
        }
    };

    const handleGenerateDescription = async () => {
        if (!type || !location || !subLocation || !rent) {
            alert('Please fill in property type, location, and rent first to generate a description.');
            return;
        }
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate a compelling and friendly property description for a ${type} located in ${subLocation}, ${location} with a monthly rent of ₹${rent}. The description should be around 40-60 words.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setDescription(response.text);
        } catch (error) {
            console.error('Error generating description:', error);
            alert('Failed to generate description. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!title || !rent || !description || images.length === 0){
            alert("Please fill all required fields and upload at least one image.");
            return;
        }
        onSubmit({
            title,
            type,
            location,
            subLocation,
            address: address || undefined,
            rent: Number(rent),
            description,
            images,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">List Your Property</h2>
                    <p className="text-sm text-gray-500">Fill in the details below to put your property on rent.</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Property Title</label>
                            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Property Type</label>
                            <select id="type" value={type} onChange={e => setType(e.target.value as PropertyType)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Main Location</label>
                            <select id="location" value={location} onChange={handleLocationChange} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                {Object.keys(sonipatLocations).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="subLocation" className="block text-sm font-medium text-gray-700">Area / Sector</label>
                            <select id="subLocation" value={subLocation} onChange={e => setSubLocation(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                {sonipatLocations[location as keyof typeof sonipatLocations].map(sl => <option key={sl} value={sl}>{sl}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Full Address (Optional)</label>
                        <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="rent" className="block text-sm font-medium text-gray-700">Monthly Rent (INR)</label>
                        <input type="number" id="rent" value={rent} onChange={e => setRent(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
                    </div>
                     <div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <button
                                type="button"
                                onClick={handleGenerateDescription}
                                disabled={isGenerating}
                                className="text-sm text-purple-600 font-semibold hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                <SparklesIcon className="w-4 h-4 mr-1" />
                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                            </button>
                        </div>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="images" className="block text-sm font-medium text-gray-700">Upload Photos (up to 3)</label>
                        <input type="file" id="images" onChange={handleImageUpload} accept="image/*" multiple className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        <p className="text-xs text-gray-500 mt-1">First image will be the main cover photo.</p>
                    </div>
                     <div className="pt-4 flex justify-end space-x-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">Submit Listing</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PropertyFormModal;