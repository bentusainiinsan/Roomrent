
import React, { useState } from 'react';
import type { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  isLoggedIn: boolean;
  onInquiry: (property: Property) => void;
}

const maskName = (name: string) => {
  if (!name) return '******';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0]} ${parts[1].charAt(0)}*****`;
  }
  return name.length > 2 ? `${name.substring(0, 2)}*****` : '******';
};

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 4) return '**********';
  return `******${phone.slice(-4)}`;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, isLoggedIn, onInquiry }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + property.images.length) % property.images.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
      <div className="relative">
        <img className="w-full h-56 object-cover" src={property.images[currentImageIndex]} alt={property.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        {property.images.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 text-black rounded-full p-2 hover:bg-white transition">
              &#10094;
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 text-black rounded-full p-2 hover:bg-white transition">
              &#10095;
            </button>
          </>
        )}
         <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-full">{property.type}</div>
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-800">{property.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{property.subLocation}, {property.location}</p>
        {property.address && <p className="text-xs text-gray-400 mt-1 truncate" title={property.address}>{property.address}</p>}
        
        <p className="text-2xl font-bold text-blue-600 my-4">
          ₹{property.rent.toLocaleString('en-IN')} <span className="text-base font-normal text-gray-600">/ month</span>
        </p>

        <p className="text-gray-700 text-sm flex-grow">{property.description}</p>
        
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500">Listed by:</p>
                <p className="font-semibold text-gray-800">{isLoggedIn ? property.owner.name : maskName(property.owner.name)}</p>
                <p className="text-sm text-gray-600">{isLoggedIn ? property.owner.phone : maskPhone(property.owner.phone)}</p>
            </div>
             <button
              onClick={() => onInquiry(property)}
              className="px-4 py-2 bg-green-500 text-white rounded-md font-bold hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Contact Owner
            </button>
          </div>
          {!isLoggedIn && (
              <p className="text-xs text-red-500 mt-2 text-center">Login to see full details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;