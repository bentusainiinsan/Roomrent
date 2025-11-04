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