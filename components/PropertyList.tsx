
import React, { useState, useMemo } from 'react';
import type { Property } from '../types';
import PropertyCard from './PropertyCard';
import { sonipatLocations } from '../constants';
import { PropertyType } from '../types';

interface PropertyListProps {
  properties: Property[];
  isLoggedIn: boolean;
  onInquiry: (property: Property) => void;
}

const PropertyList: React.FC<PropertyListProps> = ({ properties, isLoggedIn, onInquiry }) => {
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [subLocationFilter, setSubLocationFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');

  const handleLocationFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocationFilter(e.target.value);
    setSubLocationFilter('All'); // Reset sub-location when main location changes
  };

  const sortedAndFilteredProperties = useMemo(() => {
    const filtered = properties.filter(property => {
      const locationMatch = locationFilter === 'All' || property.location === locationFilter;
      const subLocationMatch = subLocationFilter === 'All' || property.subLocation === subLocationFilter;
      const typeMatch = typeFilter === 'All' || property.type === typeFilter;
      return locationMatch && subLocationMatch && typeMatch;
    });

    // Create a mutable copy before sorting
    const sortableProperties = [...filtered];

    switch (sortBy) {
      case 'rent_asc':
        sortableProperties.sort((a, b) => a.rent - b.rent);
        break;
      case 'rent_desc':
        sortableProperties.sort((a, b) => b.rent - a.rent);
        break;
      case 'newest':
      default:
        // Assuming higher ID means newer
        sortableProperties.sort((a, b) => b.id - a.id);
        break;
    }

    return sortableProperties;
  }, [properties, locationFilter, subLocationFilter, typeFilter, sortBy]);

  return (
    <div>
      <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-8 sticky top-20 z-40 flex flex-col sm:flex-row gap-4 items-center">
        <h2 className="text-2xl font-bold text-gray-700 whitespace-nowrap">Find Your Space</h2>
        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div>
            <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700">Location</label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={handleLocationFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>All</option>
              {Object.keys(sonipatLocations).map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sub-location-filter" className="block text-sm font-medium text-gray-700">Area / Sector</label>
            <select
              id="sub-location-filter"
              value={subLocationFilter}
              onChange={(e) => setSubLocationFilter(e.target.value)}
              disabled={locationFilter === 'All'}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option>All</option>
              {locationFilter !== 'All' && sonipatLocations[locationFilter as keyof typeof sonipatLocations].map(subLoc => (
                <option key={subLoc} value={subLoc}>{subLoc}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">Property Type</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>All</option>
              {Object.values(PropertyType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700">Sort By</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="newest">Newest First</option>
              <option value="rent_asc">Rent: Low to High</option>
              <option value="rent_desc">Rent: High to Low</option>
            </select>
          </div>
        </div>
      </div>
      
      {sortedAndFilteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedAndFilteredProperties.map(property => (
            <PropertyCard 
                key={property.id} 
                property={property} 
                isLoggedIn={isLoggedIn}
                onInquiry={onInquiry}
            />
            ))}
        </div>
        ) : (
        <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-600">No properties found.</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or check back later!</p>
        </div>
        )}
    </div>
  );
};

export default PropertyList;
