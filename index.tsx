

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Removed LiveSession as it is not an exported member of @google/genai.
import { GoogleGenAI, Modality, Blob as GenAIBlob, LiveServerMessage } from "@google/genai";

// =================================================================================
// TYPES
// =================================================================================

export enum PropertyType {
  Room = 'Room',
  Shop = 'Shop',
  House = 'House',
  Villa = 'Villa',
  Factory = 'Factory',
  Godown = 'Godown',
}

export interface Owner {
  name: string;
  phone: string;
}

export interface Property {
  id: number;
  title: string;
  type: PropertyType;
  location: string;
  subLocation: string;
  address?: string;
  rent: number;
  description:string;
  images: string[];
  owner: Owner;
}

export interface User {
  name: string;
  email: string;
  photoUrl?: string;
}

export interface TranscriptionEntry {
  speaker: 'user' | 'model';
  text: string;
}


// =================================================================================
// CONSTANTS
// =================================================================================

export const sonipatLocations = {
  "Sonipat": [
    "4 Marla", "8 Marla", "Adersh Nagar", "Anand Nagar", "Arya Nagar", "Ashok Nagar", "Ashok Vihar", "Baba Colony", "Badwasni Gaon", "Bandepur", "Bara Bagad", "Batra Colony", "Bayanpur", "Bhagat Pura", "Bhagat Singh Colony", "Bharam Colony", "Bharam Nagar", "Bharatpuri", "Bhattan Mohalla", "Bheem Nagar", "Chawla Colony", "Chintpurni Colony", "Chitana Gaon", "Chotu Ram Chowk", "Chouhan Colony", "Davru Gaon", "Davru Road", "Defence Colony", "Deha Basti", "Delhi Camp", "Dev Nagar", "Dhanak Basti", "Dhiya Colony", "Double Story", "Faj Bazar", "Faraz Khana", "Ganj Bazar", "Garh Sahajanpur", "Garhi Bharmana", "Garhi Gasita", "Gokul Nagar", "Govind Nagar", "Hanuman Nagar", "Hem Park", "Hullaheri Gaon", "Indian Colony", "Indra Colony", "Indra Colony, Kailash Pur", "Jamalpura", "Janta Colony", "Jatti Kalan", "Jatwara", "Jawahar Nagar", "Jeevan Nagar", "Kaath Mandi", "Kabir Nagar-Kalupur", "Kabir Pur", "Kachhey Querter", "Kailash Colony", "Kakroi Road", "Kalash Colony", "Kalupur", "Katth Mandi", "Khan Colony", "Khari Kwa", "Kot Mohalla", "Krishan Pura", "Krishana Nagar", "Kriti Nagar", "Kumhar Gate", "Lajpat Nagar", "Lal Darwaja", "Lehrara", "Luxmi Nagar", "Mahabir Colony", "Malviya Nagar", "Mamchand Colony", "Maya Puri", "Mc Colony", "Mirch Mandi", "Mission Road", "Model Town", "Mohalla Kalan", "Mohan Nagar", "Mohanpura", "Nandwani Nagar", "Narender Nagar", "New Jeevan Nagar", "Old Housing Board Colony", "Om Colony", "Omnagar", "Other", "Pancham Nagar", "Parbhu Nagar", "Pargati Nagar", "Patel Nagar", "Prem Nagar", "Prem Nagar- Kakroi Road", "Prem Nagar-Behind Bus Stand", "Pwd Colony", "Railway Colony", "Raj Mohalla", "Rajiv Colony", "Rajiv Nagar", "Ram Nagar", "Rishi Colony", "Rk Colony", "Roop Nagar", "Sabun Darwaja", "Sai Baba Colony", "Sainipura", "Sant Garb Dass Nagar", "Sector 1", "Sector 10", "Sector 11", "Sector 12", "Sector 13", "Sector 14", "Sector 15", "Sector 15 Housing Board", "Sector 16", "Sector 17", "Sector 18", "Sector 19", "Sector 23", "Sector 3", "Sector 7", "Sector 9", "Shadipur", "Shanti Vihar", "Shartri Colony", "Shastri Park", "Shiv Colony", "Sidharth Colony", "Sikka Colony", "Sri Nagar", "Sudama Nagar", "Sujjan Singh Park", "Sundal Mohalla", "Sunder Sawari", "Tara Nagar", "Teacher Colony", "Uttam Nagar", "Vikas Nagar", "Vikas Nagar- Murthal Road", "Vishal Nagar", "West Ram Nagar"
  ],
  "Gannaur": [
    "Anup Nagar", "B.S.T Colony", "Baddi", "Badi leharari", "Barodth", "Baye barodth", "Bega", "Bhakadpur", "Bhuri", "Bigaan", "Chirsmi", "chotti leharari", "Deha", "Dhatoli", "Dhutri", "Gandhi Nagar", "Gannaur Mandi", "Garhi gulama", "Garhi Kashri", "Gayaspur", "Ghasoli", "Hari Nagar", "Hasanpur", "Janta School", "K.D.Nagar", "Kami", "Khera Taga", "Kot Mohalla", "Kurad", "Ladsoli", "lala Garhi", "Maichand Colony", "Namaste Chowk", "Papnera", "Pardhanwas Mohalla", "Patti bharaman", "Peer garhi", "Pelanda garhi", "Pipli khera", "Rajpura", "Ramnagar", "Rashulpur", "Rehda Basti", "Roshanpur", "Shashtri Nagar", "Shehpur", "Sunfeda", "Tandoli", "Umedgarh", "Vasant Nagar"
  ],
  "Kharkhoda": [
    "Badhana", "Bahiyanpur", "Barona", "Bidhallan", "Farmana", "Fathepur", "Firozpur Bangar", "Garhi Sisana", "Gopalpur", "Gorad", "Harshana Kalan", "Jagdishpur", "Jatola", "Jhanjoli", "Jharoth", "Jharothi", "Kakroi", "Katlupur", "Khanda", "Kharkhoda", "Kheri Dhaiya", "Khrumpur", "Kundal", "Leharara", "Livaan", "Mandora", "Mandori", "Matindu", "Mohammdabad", "Mojamnagar", "Nakloi", "Naseebpur Bangar", "Nasirpur Choulka", "Nirthaan", "Nithaan", "Nizampur Khurd", "Nizampur Mazra", "Pai", "Parladpur", "Pipli", "Quali", "Rathdhana", "Redhu", "Rohana", "Rohat", "Shedpur", "Sheri", "Shotti", "Silana", "Sinoli", "Sisana", "Thana Kalan", "Thana Khurd", "Trukhpur"
  ],
  "Kailana": [
    "Agawanpur", "Ahulana", "Attal", "Bajana Kalan", "Bajana Khurd", "Balli", "Bhaver", "Bilindpur", "Chatiya", "Gamdaa", "Ghummad", "Heer Mazra", "Jahri", "Jassi Pur", "Kalana", "Kehri", "Khabru", "Mazra", "Naya Bass", "Panchi", "Pugthalla", "Purkash", "Razlu Garhi", "Sandal Kalan", "Sandal Khurd", "Sardaana", "Sazadpur", "Seeya Khera", "Shekpura", "Tavedi", "Tharu"
  ],
  "Rai Bahalgarh": [
    "Aterna", "Bad Malik", "Badkhalsha", "Badoli", "Bahalgarh", "Barota", "Behra ( Bakipur)", "Chauhan Joshi", "Chetera", "Dadhi Nangal", "Dipalpur", "Garh Marikpur", "Garh Sejhenpur", "Jagdishpur", "Jainpur", "Jakholi", "Jat Joshi", "Jathadi", "Jatti Kalan", "Jhundpur", "Kamaspur", "Kheri", "Khewara", "Khurampur", "Kundli", "Liwaspur", "Makimpur", "Malikpur", "Manoli", "Mazra", "Mehandipur", "Mimarpur", "Murthal", "Nandnaur", "Nangal", "Nathupur", "Nehra", "Nehri", "Orangabad", "Palada", "Paladi", "Peou Manhari", "Rai", "Raipur", "Rasoi", "Revali", "Saberpur", "Seveli", "Shahpur", "Tanda", "Tikola"
  ],
  "Gohana": [
    "Abadi rattangarh", "Adarsh Nagar", "Badota", "Badwasni", "Baggad", "Barota", "Bhaadi", "Bhatana", "Bhatgaon dugran", "Bhatgaon dugran garhi haqiqat", "Bhatgaon maalyan", "Bidghal", "Bohelaa", "Chatiya Deva", "Chitana", "Chopra Colony", "citawali", "Dariyapur Basti", "Dodavaa", "Dubeta", "Gamadi", "Gangser", "Garhi Naamdar Khaa", "Garhi Sarai naamdaar kha", "Garhi Ujala khaa", "Gohana City", "Gohana Mandi", "Grina", "Gudaa", "Hasangarh", "Hullaheri", "Jaji", "Jholly", "Jind Road", "Jolly", "Jua", "Kakaana", "Kalana Khash", "Kashandi", "Kasnada", "Keravedi", "Khandrai", "Khanpur kalan", "Kheri", "Kheri damkan", "Khijrpur jaat mazra", "Kilhond", "Lath", "Lath", "Laxmi Nagar", "Luhari Tibba", "Machri", "Mahalana", "Mahipur", "Mazri", "Mehra", "Mohana", "Nagar", "Nayat", "Nenna", "Pinana", "Punjabi Colony", "Remana", "Rolad", "Sainipura", "Salarpur mazra", "Salimsar mazra", "Silampur trally", "Sonipat Road", "SP Majra", "Surgathal", "Thehad", "Thihaad kalan", "Thihaad khurd", "Vishnu Nagar", "Wazirpur"
  ]
};

export const initialProperties: Property[] = [
  {
    id: 1,
    title: 'Spacious 2BHK House for Rent',
    type: PropertyType.House,
    location: 'Sonipat',
    subLocation: 'Sector 14',
    address: 'House No. 2021, Sector 14, Sonipat, Haryana',
    rent: 15000,
    description: 'A beautiful and spacious 2BHK independent house with a modular kitchen, attached bathrooms, and ample parking space. Located in a prime residential area.',
    images: ['https://picsum.photos/seed/house1/600/400', 'https://picsum.photos/seed/house2/600/400', 'https://picsum.photos/seed/house3/600/400'],
    owner: { name: 'Suresh Verma', phone: '9876543210' },
  },
  {
    id: 2,
    title: 'Main Market Shop on Lease',
    type: PropertyType.Shop,
    location: 'Gohana',
    subLocation: 'Gohana Mandi',
    address: 'Shop No. 5, Main Bazaar, Gohana, Sonipat',
    rent: 25000,
    description: 'Prime location shop available for rent in the heart of Gohana market. High footfall area, suitable for any retail business.',
    images: ['https://picsum.photos/seed/shop1/600/400', 'https://picsum.photos/seed/shop2/600/400', 'https://picsum.photos/seed/shop3/600/400'],
    owner: { name: 'Priya Gupta', phone: '9998887776' },
  },
  {
    id: 3,
    title: 'Industrial Factory Shed in Rai',
    type: PropertyType.Factory,
    location: 'Rai Bahalgarh',
    subLocation: 'Rai',
    address: 'Plot No. 123, Phase 2, Industrial Area, Rai, Sonipat',
    rent: 80000,
    description: 'Large factory shed with 5000 sq. ft. area, 20 ft. height, office space, and power backup. Ideal for manufacturing units.',
    images: ['https://picsum.photos/seed/factory1/600/400', 'https://picsum.photos/seed/factory2/600/400', 'https://picsum.photos/seed/factory3/600/400'],
    owner: { name: 'Amit Singhal', phone: '8816014071' },
  },
    {
    id: 4,
    title: 'Single Room for Students/Bachelors',
    type: PropertyType.Room,
    location: 'Rai Bahalgarh',
    subLocation: 'Murthal',
    address: 'Near DCRUST University Gate No. 2, Murthal',
    rent: 4500,
    description: 'Well-ventilated single room with attached bathroom and kitchen space. Perfect for students and working bachelors. 24/7 water and electricity.',
    images: ['https://picsum.photos/seed/room1/600/400', 'https://picsum.photos/seed/room2/600/400', 'https://picsum.photos/seed/room3/600/400'],
    owner: { name: 'Rajesh Hooda', phone: '7015551234' },
  },
  {
    id: 5,
    title: 'Large Godown in Bahalgarh',
    type: PropertyType.Godown,
    location: 'Rai Bahalgarh',
    subLocation: 'Bahalgarh',
    address: 'Near Bahalgarh Chowk, GT Road, Sonipat',
    rent: 55000,
    description: '10,000 sq. ft. godown with easy access to NH-44. High ceiling, proper ventilation and secure premises. Suitable for storage and logistics.',
    images: ['https://picsum.photos/seed/godown1/600/400', 'https://picsum.photos/seed/godown2/600/400', 'https://picsum.photos/seed/godown3/600/400'],
    owner: { name: 'Vikram Singh', phone: '9050403020' },
  },
  {
    id: 6,
    title: 'Luxury Villa in Model Town',
    type: PropertyType.Villa,
    location: 'Sonipat',
    subLocation: 'Model Town',
    address: 'Villa No. 18, Near Model Town, Sonipat',
    rent: 40000,
    description: 'A modern 4BHK duplex villa in a gated society with all amenities like park, club house, and security. Semi-furnished with elegant interiors.',
    images: ['https://picsum.photos/seed/villa1/600/400', 'https://picsum.photos/seed/villa2/600/400', 'https://picsum.photos/seed/villa3/600/400'],
    owner: { name: 'Sunita Sharma', phone: '8168090807' },
  },
   {
    id: 7,
    title: 'Cozy Room in Gandhi Nagar',
    type: PropertyType.Room,
    location: 'Gannaur',
    subLocation: 'Gandhi Nagar',
    address: 'Near Main Market, Gandhi Nagar, Gannaur',
    rent: 5000,
    description: 'A clean and cozy single room available for rent in a peaceful colony. Ideal for a single person or student.',
    images: ['https://picsum.photos/seed/roomgannaur1/600/400', 'https://picsum.photos/seed/roomgannaur2/600/400', 'https://picsum.photos/seed/roomgannaur3/600/400'],
    owner: { name: 'Deepak Jain', phone: '9123456789' },
  },
];

export const backgroundThemes = [
    "bg-slate-50", "bg-gray-50", "bg-zinc-50", "bg-neutral-50", "bg-stone-50",
    "bg-red-50", "bg-orange-50", "bg-amber-50", "bg-yellow-50", "bg-lime-50",
    "bg-green-50", "bg-emerald-50", "bg-teal-50", "bg-cyan-50", "bg-sky-50",
    "bg-blue-50", "bg-indigo-50", "bg-violet-50", "bg-purple-50", "bg-fuchsia-50",
    "bg-pink-50", "bg-rose-50"
];


// =================================================================================
// ICONS
// =================================================================================

const CartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const FacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.323-1.325z" />
  </svg>
);

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsappIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.357 1.846 6.069l-1.264 4.603 4.759-1.251zM12.062 9.153c-.314-.157-1.852-.915-2.14-.02-.287.098-.496.915-.609 1.034-.112.118-.225.132-.413.049-.188-.083-1.096-.549-2.083-1.289-.781-.595-1.299-1.336-1.465-1.568-.166-.232-.014-.358.099-.465.101-.096.224-.249.336-.373s.149-.198.224-.336c.075-.138.038-.25-.013-.348-.05-.098-.465-1.118-.632-1.523-.166-.406-.336-.348-.465-.357-.118-.01-.261-.01-.405-.01s-.374.049-.562.232c-.188.183-.712.695-.712 1.693s.712 1.965.825 2.103c.112.138 1.465 2.227 3.541 3.126 2.076.899 2.076.602 2.441.565.366-.038 1.137-.465 1.299-.915.161-.449.161-.832.112-.915-.05-.083-.188-.132-.314-.183z" />
    </svg>
);

const LocationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const EmailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 7.5v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0-6 6v1.5m6 7.5h.008v.008H12v-.008Z" />
  </svg>
);


// =================================================================================
// COMPONENTS
// =================================================================================

// --- PropertyCard ---
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

// --- PropertyList ---
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

// --- Header ---
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

// --- Footer ---
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

          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://facebook.com/sonipathomeservice" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><FacebookIcon /></a>
              <a href="https://instagram.com/sonipathomeservice" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><InstagramIcon /></a>
              <a href="https://x.com/sonipathome" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><XIcon /></a>
              <a href="https://wa.me/918816014071" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><WhatsappIcon /></a>
            </div>
          </div>
          
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


// --- InquiryModal ---
interface InquiryModalProps {
  property: Property;
  onClose: () => void;
}

const InquiryModal: React.FC<InquiryModalProps> = ({ property, onClose }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');

  const handlePayment = () => {
    // NOTE: This function simulates a Razorpay payment flow.
    console.log("Initiating payment...");
    
    const options = {
      key: "YOUR_LIVE_API_KEY", // Replace with your actual Razorpay Key ID
      amount: "100", 
      currency: "INR",
      name: "Sonipat Home Service",
      description: `Token for ${property.title}`,
      image: "https://picsum.photos/seed/logo/100/100",
      handler: function (response: any) {
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
        const inquiryData = { name, mobile, email, address, landmark, pincode, propertyId: property.id, paymentId: response.razorpay_payment_id };
        console.log('Inquiry Data with Payment:', inquiryData);
        onClose();
      },
      prefill: { name: name, email: email, contact: mobile },
      notes: { address: `${address}, ${landmark}, ${pincode}` },
      theme: { color: "#3399cc" },
    };
    
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!name || !mobile || !email || !address || !pincode) {
        alert("Please fill all required fields.");
        return;
    }
    handlePayment();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Inquiry for: {property.title}</h2>
          {property.address && <p className="text-sm text-gray-500">{property.address}</p>}
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-center bg-blue-50 text-blue-700 p-3 rounded-md">
            Please fill out your details to proceed with the booking. A small token amount will be charged.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} required maxLength={10} pattern="\d{10}" className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Email ID</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
             </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Full Address</label>
             <input type="text" value={address} onChange={e => setAddress(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Landmark</label>
                <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Pin Code</label>
                <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} required maxLength={6} pattern="\d{6}" className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
             </div>
           </div>
          <div className="pt-4 flex justify-end space-x-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700">Proceed to Pay</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- PropertyFormModal ---
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
            title, type, location, subLocation,
            address: address || undefined,
            rent: Number(rent),
            description, images,
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
                                type="button" onClick={handleGenerateDescription} disabled={isGenerating}
                                className="text-sm text-purple-600 font-semibold hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
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

// --- AIStudioModal ---
interface AIStudioModalProps {
  onClose: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
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

// --- LiveAssistant ---
interface LiveAssistantProps {
  onClose: () => void;
}

// FIX: Define the LiveSession interface locally as it's not exported from @google/genai.
interface LiveSession {
  sendRealtimeInput(input: { media: GenAIBlob }): void;
  close(): void;
}

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

    useEffect(() => {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptionHistory, currentInput, currentOutput]);

    useEffect(() => {
        return () => {
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

            // @ts-ignore
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
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
                    onclose: () => { /* Handled by stopConversation */ },
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
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        audioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        audioContextRef.current = null;
        outputAudioContextRef.current = null;
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


// =================================================================================
// APP COMPONENT
// =================================================================================

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
    }, 60000);

    return () => clearInterval(themeInterval);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
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
          phone: '8816014071',
        },
      };
      setProperties(prev => [propertyWithOwner, ...prev]);
      setIsPropertyFormOpen(false);
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


// =================================================================================
// RENDER APP
// =================================================================================

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);