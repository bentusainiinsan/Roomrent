import React from 'react';
import type { User } from '../types';
import { CartIcon } from './icons/CartIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';


interface HeaderProps {
  isLoggedIn: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onAddProperty: () => void;
  onOpenAIStudio: () => void;
  onOpenLiveAssistant: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, user, onLogin, onLogout, onAddProperty, onOpenAIStudio, onOpenLiveAssistant }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <a href="https://www.sonipathomeservice.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
            <img src="https://picsum.photos/seed/logo/40/40" alt="Sonipat Home Service Logo" className="h-10 w-10 rounded-full" />
            <span className="text-xl md:text-2xl font-bold text-gray-800 hidden sm:block">Sonipat Home Service</span>
          </a>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={onAddProperty}
              className="px-3 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              List Property
            </button>
            <button
              onClick={onOpenAIStudio}
              className="px-3 py-2 bg-purple-600 text-white rounded-md font-semibold text-sm hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center space-x-2"
            >
              <SparklesIcon className="w-5 h-5" />
              <span className="hidden sm:inline">AI Studio</span>
            </button>
             <button
              onClick={onOpenLiveAssistant}
              className="px-3 py-2 bg-teal-500 text-white rounded-md font-semibold text-sm hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center space-x-2"
            >
              <MicrophoneIcon className="w-5 h-5" />
               <span className="hidden sm:inline">AI Assistant</span>
            </button>
            {isLoggedIn && user ? (
              <div className="flex items-center space-x-3">
                <img src={user.photoUrl} alt={user.name} className="h-10 w-10 rounded-full border-2 border-gray-300" />
                <button onClick={onLogout} className="px-3 py-2 bg-red-500 text-white rounded-md font-semibold text-sm hover:bg-red-600 transition-colors">Logout</button>
              </div>
            ) : (
              <button onClick={onLogin} className="px-3 py-2 bg-green-500 text-white rounded-md font-semibold text-sm hover:bg-green-600 transition-colors flex items-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                <span>Login</span>
              </button>
            )}
            <div className="relative p-2 cursor-pointer">
              <CartIcon />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">0</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;