export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  neighborhood: string;
  beds: number;
  baths: number;
  area: string;
  image: string;
  type: 'House' | 'Flat' | 'Plot' | 'Commercial';
  status?: 'New' | 'Hot' | 'Sold' | 'Exclusive';
  description: string;
}

export const PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'The Burj Vista Penthouse',
    price: 'AED 15,500,000',
    location: 'Downtown Dubai',
    neighborhood: 'Downtown',
    beds: 4,
    baths: 5,
    area: '4,500 Sq.Ft',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070&auto=format&fit=crop',
    type: 'Flat',
    status: 'New',
    description: 'A breathtaking penthouse with direct views of the Burj Khalifa and Dubai Fountain. Features floor-to-ceiling windows and ultra-luxury finishes.'
  },
  {
    id: '2',
    title: 'Palm Jumeirah Signature Villa',
    price: 'AED 45,000,000',
    location: 'Frond G, Palm Jumeirah',
    neighborhood: 'Palm Jumeirah',
    beds: 6,
    baths: 7,
    area: '7,000 Sq.Ft',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
    type: 'House',
    status: 'Hot',
    description: 'An architectural masterpiece on the iconic Palm Jumeirah. Private beach access, infinity pool, and bespoke Italian interiors.'
  },
  {
    id: '3',
    title: 'Marina Gate Sky Villa',
    price: 'AED 8,200,000',
    location: 'Dubai Marina',
    neighborhood: 'Dubai Marina',
    beds: 3,
    baths: 4,
    area: '3,200 Sq.Ft',
    image: 'https://images.unsplash.com/photo-1582653280643-e79c79219b19?q=80&w=2070&auto=format&fit=crop',
    type: 'Flat',
    status: 'Sold',
    description: 'Contemporary living in the heart of the Marina. This sky villa offers panoramic views of the yacht club and the Arabian Gulf.'
  },
  {
    id: '4',
    title: 'Emirates Hills Mansion',
    price: 'AED 120,000,000',
    location: 'Sector E, Emirates Hills',
    neighborhood: 'Emirates Hills',
    beds: 8,
    baths: 10,
    area: '25,000 Sq.Ft',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop',
    type: 'House',
    status: 'Exclusive',
    description: 'The Beverly Hills of Dubai. A sprawling mansion overlooking the Montgomerie Golf Club, featuring a private cinema and 12-car garage.'
  },
  {
    id: '5',
    title: 'Dubai Hills Estate Plot',
    price: 'AED 12,000,000',
    location: 'Parkway Vistas, Dubai Hills',
    neighborhood: 'Dubai Hills',
    beds: 0,
    baths: 0,
    area: '15,000 Sq.Ft',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop',
    type: 'Plot',
    description: 'A prime residential plot in the prestigious Dubai Hills Estate. Build your dream home overlooking the championship golf course.'
  },
  {
    id: '6',
    title: 'Business Bay Executive Suite',
    price: 'AED 2,400,000',
    location: 'The Opus by Zaha Hadid',
    neighborhood: 'Business Bay',
    beds: 1,
    baths: 2,
    area: '1,100 Sq.Ft',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1935&auto=format&fit=crop',
    type: 'Flat',
    description: 'Ultra-modern living in an architectural icon designed by Zaha Hadid. Fully furnished with smart home technology.'
  }
];
