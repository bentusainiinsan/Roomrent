import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PropertyList from './components/PropertyList';
import PropertyFormModal from './components/PropertyFormModal';
import InquiryModal from './components/InquiryModal';
import AIStudioModal from './components/AIStudioModal';
import LiveAssistant from './components/LiveAssistant';
import { initialProperties, backgroundThemes } from './constants';
import type { User, Property } from './types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bgTheme, setBgTheme] = useState(backgroundThemes[0]);
  const [isAIStudioOpen, setIsAIStudioOpen] = useState(false);
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);


  useEffect(() => {
    const themeInterval = setInterval(() => {
      setBgTheme(prevTheme => {
        const currentIndex = backgroundThemes.indexOf(prevTheme);
        const nextIndex = (currentIndex + 1) % backgroundThemes.length;
        return backgroundThemes[nextIndex];
      });
    }, 60000); // Change theme every minute

    return () => clearInterval(themeInterval);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    // In a real app, this data would come from the Google Sign-In response
    setCurrentUser({
      name: 'Ramesh Kumar',
      email: 'ramesh.kumar@example.com',
      photoUrl: 'https://picsum.photos/seed/user/100/100'
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleAddProperty = (newProperty: Omit<Property, 'id' | 'owner'>) => {
    if (currentUser) {
      const propertyWithOwner: Property = {
        ...newProperty,
        id: Date.now(),
        owner: {
          name: currentUser.name,
          phone: '8816014071', // Placeholder, get from user profile in real app
        },
      };
      setProperties(prev => [propertyWithOwner, ...prev]);
      setIsPropertyFormOpen(false);
       // NOTE: Here you would trigger an API call to update the Google Sheet.
      // After the update, an email would be sent from the backend.
      console.log('New property added. In a real app, this would update Google Sheets.', propertyWithOwner);
    } else {
        alert("You must be logged in to add a property.");
    }
  };
  
  const handleInquiry = (property: Property) => {
    setSelectedProperty(property);
    setIsInquiryModalOpen(true);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-1000 ${bgTheme}`}>
      <Header 
        isLoggedIn={isLoggedIn}
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onAddProperty={() => setIsPropertyFormOpen(true)}
        onOpenAIStudio={() => setIsAIStudioOpen(true)}
        onOpenLiveAssistant={() => setIsLiveAssistantOpen(true)}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <PropertyList 
          properties={properties} 
          isLoggedIn={isLoggedIn}
          onInquiry={handleInquiry}
        />
      </main>
      <Footer />
      {isPropertyFormOpen && (
        <PropertyFormModal 
          onClose={() => setIsPropertyFormOpen(false)}
          onSubmit={handleAddProperty}
        />
      )}
      {isInquiryModalOpen && selectedProperty && (
        <InquiryModal 
          property={selectedProperty}
          onClose={() => setIsInquiryModalOpen(false)}
        />
      )}
      {isAIStudioOpen && (
        <AIStudioModal onClose={() => setIsAIStudioOpen(false)} />
      )}
      {isLiveAssistantOpen && (
        <LiveAssistant onClose={() => setIsLiveAssistantOpen(false)} />
      )}
    </div>
  );
}

export default App;