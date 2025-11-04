
import React from 'react';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { XIcon } from './icons/XIcon';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { LocationIcon } from './icons/LocationIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { EmailIcon } from './icons/EmailIcon';


const Footer: React.FC = () => {
    const officeLat = 29.006456480081468;
    const officeLng = 77.01762222665928;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${officeLat},${officeLng}`;
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.crapd.sonipathomeservice";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(playStoreUrl)}`;

  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Sonipat Home Service.com</h3>
            <p className="text-gray-400">Your trusted partner for property rentals in the Sonipat region.</p>
            <div className="flex items-start space-x-3">
                <LocationIcon className="w-5 h-5 mt-1 text-gray-300"/>
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                    128/1, Sainipura, Sonipat, Haryana
                </a>
            </div>
            <div className="flex items-center space-x-3">
                <PhoneIcon className="w-5 h-5 text-gray-300"/>
                <a href="tel:8816014071" className="text-gray-300 hover:text-white transition-colors">8816014071</a>
            </div>
            <div className="flex items-center space-x-3">
                <EmailIcon className="w-5 h-5 text-gray-300"/>
                <a href="mailto:care@sonipathomeservice.com" className="text-gray-300 hover:text-white transition-colors">care@sonipathomeservice.com</a>
            </div>
          </div>

          {/* Service Locations */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Service Locations</h3>
            <ul className="space-y-2 text-gray-400">
                <li>Sonipat City & Sectors</li>
                <li>Murthal</li>
                <li>Bahalgarh</li>
                <li>Kundli</li>
                <li>Rai</li>
                <li>Ganaur</li>
                <li>All Societies</li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://facebook.com/sonipathomeservice" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><FacebookIcon /></a>
              <a href="https://instagram.com/sonipathomeservice" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><InstagramIcon /></a>
              <a href="https://x.com/sonipathome" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><XIcon /></a>
              <a href="https://wa.me/918816014071" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><WhatsappIcon /></a>
            </div>
          </div>
          
          {/* Mobile App */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Download Our App</h3>
            <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg hover:bg-gray-700 transition-colors duration-300">
                <div className="flex items-center space-x-4 p-2">
                    <img src={qrCodeUrl} alt="Download Sonipat Home Service App" className="w-24 h-24 bg-white p-1 rounded-md"/>
                    <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-12"/>
                </div>
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Sonipat Home Service.com. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;