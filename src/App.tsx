import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Bed, 
  ShowerHead, 
  SquareSquare, 
  Heart, 
  ArrowRight, 
  Calendar, 
  Mail, 
  Phone, 
  Clock, 
  X, 
  ChevronLeft, 
  ChevronRight,
  MessageCircle,
  Send,
  CheckCircle2
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocFromServer,
  doc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { PROPERTIES, Property } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type Tab = 'Home' | 'Listings' | 'About' | 'Contact';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Real-time Properties
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(docs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'properties');
    });
    return () => unsub();
  }, []);

  // Filter logic
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNeighborhood = selectedNeighborhood === 'All' || p.neighborhood === selectedNeighborhood;
      const matchesType = selectedType === 'All' || p.type === selectedType;
      
      // Basic price filtering logic
      let matchesPrice = true;
      if (selectedPrice === 'Under 1.5 Cr') {
        matchesPrice = parseFloat(p.price.replace(/[^0-9.]/g, '')) < 1.5;
      } else if (selectedPrice === '1.5 Cr - 3 Cr') {
        const val = parseFloat(p.price.replace(/[^0-9.]/g, ''));
        matchesPrice = val >= 1.5 && val <= 3;
      } else if (selectedPrice === 'Above 3 Cr') {
        matchesPrice = parseFloat(p.price.replace(/[^0-9.]/g, '')) > 3;
      }

      return matchesSearch && matchesNeighborhood && matchesType && matchesPrice;
    });
  }, [properties, searchQuery, selectedNeighborhood, selectedType, selectedPrice]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      // Save to Firestore
      await addDoc(collection(db, 'inquiries'), {
        ...data,
        createdAt: serverTimestamp()
      });

      // Also call legacy backend for logging
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      setFormSubmitted(true);
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inquiries');
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body selection:bg-secondary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav h-16">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-full">
          <div 
            className="text-xl font-headline font-extrabold tracking-tighter text-primary cursor-pointer"
            onClick={() => setActiveTab('Home')}
          >
            Dubai <span className="text-on-surface">LUXE</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {(['Home', 'Listings', 'About', 'Contact'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "font-body text-sm font-medium transition-all duration-300",
                  activeTab === tab 
                    ? "text-primary" 
                    : "text-on-surface-variant hover:text-primary"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('Contact')}
              className="bg-primary text-white px-5 py-2 rounded-lg font-body text-sm font-semibold transition-all duration-300 hover:bg-primary-container"
            >
              Account
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-12 px-6 max-w-7xl mx-auto">
        {activeTab === 'Home' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(100px,auto)]">
            {/* Search Bar Bento Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-8 bento-card flex items-center gap-4"
            >
              <div className="flex-grow flex items-center bg-surface rounded-xl px-4 py-2 border border-outline-variant">
                <Search size={18} className="text-on-surface-variant mr-3" />
                <input 
                  type="text" 
                  placeholder="Search Downtown, Palm Jumeirah, or Marina..."
                  className="bg-transparent border-none w-full focus:ring-0 text-sm outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setActiveTab('Listings')}
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-container transition-all shrink-0"
              >
                Find Property
              </button>
            </motion.div>

            {/* Stats Bento Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 bento-card flex justify-around items-center"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2,500+</div>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Elite Units</div>
              </div>
              <div className="w-[1px] h-8 bg-outline-variant"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">15</div>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Global Awards</div>
              </div>
            </motion.div>

            {/* Featured Property Bento Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-8 md:row-span-5 bento-card p-0 flex flex-col"
            >
              <div className="relative flex-grow min-h-[300px]">
                <img 
                  src={properties[0]?.image || PROPERTIES[0].image} 
                  alt="Featured" 
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Featured Listing
                </div>
              </div>
              <div className="p-6 space-y-2">
                <div className="text-2xl font-bold text-primary">{properties[0]?.price || PROPERTIES[0].price}</div>
                <h2 className="text-xl font-bold">{properties[0]?.title || PROPERTIES[0].title}</h2>
                <div className="flex gap-4 text-xs text-on-surface-variant">
                  <span>{properties[0]?.beds || PROPERTIES[0].beds} Beds</span>
                  <span>{properties[0]?.baths || PROPERTIES[0].baths} Baths</span>
                  <span>{properties[0]?.area || PROPERTIES[0].area}</span>
                  <span>{properties[0]?.location || PROPERTIES[0].location}</span>
                </div>
              </div>
            </motion.div>

            {/* Property List Bento Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-4 md:row-span-9 bento-card"
            >
              <h3 className="text-sm font-bold mb-6">Nearby Properties</h3>
              <div className="space-y-4">
                {(properties.length > 1 ? properties : PROPERTIES).slice(1, 6).map((property) => (
                  <div 
                    key={property.id} 
                    className="flex gap-4 p-2 rounded-xl hover:bg-surface transition-colors cursor-pointer border-b border-outline-variant last:border-0 pb-4"
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={property.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="text-sm font-bold leading-tight">{property.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">{property.price} • {property.beds} Beds</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('Listings')}
                className="w-full mt-6 py-3 text-xs font-bold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-all"
              >
                View All Portfolio
              </button>
            </motion.div>

            {/* Contact Form Bento Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-4 md:row-span-4 bento-card"
            >
              <h3 className="text-sm font-bold mb-4">Inquire about this home</h3>
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Your Email</label>
                  <input type="email" placeholder="client@example.com" className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Message</label>
                  <textarea rows={2} placeholder="I would like more information..." className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:border-primary resize-none"></textarea>
                </div>
                <button className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary-container transition-all">
                  Send Inquiry
                </button>
              </form>
            </motion.div>

            {/* WhatsApp Mini Bento Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="md:col-span-4 md:row-span-4 bento-card bg-[#f0fff4] border-2 border-dashed border-[#bbf7d0] flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-secondary/20">
                <MessageCircle size={24} />
              </div>
              <h3 className="text-base font-bold mb-1">Instant Chat</h3>
              <p className="text-xs text-[#166534]">Average response: 2 mins</p>
              <a 
                href="https://wa.me/923000000000" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 text-xs font-bold text-secondary hover:underline"
              >
                Start Conversation →
              </a>
            </motion.div>
          </div>
        )}

        {activeTab === 'Listings' && (
          <section className="max-w-7xl mx-auto px-8 py-32">
            <header className="mb-24 space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-12 bg-secondary"></div>
                <span className="text-secondary font-body text-[10px] font-bold tracking-[0.3em] uppercase">The Portfolio</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-headline font-bold text-primary tracking-tight leading-none">
                {filteredProperties.length} Curated <br/> Opportunities
              </h1>
              
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between pt-12 border-t border-primary/5">
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-4 py-4 bg-transparent border-b border-primary/10 focus:border-primary rounded-none outline-none font-headline text-lg transition-all"
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  {['All', 'Downtown', 'Palm Jumeirah', 'Dubai Marina', 'Emirates Hills', 'Dubai Hills'].map(neighborhood => (
                    <button 
                      key={neighborhood}
                      onClick={() => setSelectedNeighborhood(neighborhood)}
                      className={cn(
                        "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                        selectedNeighborhood === neighborhood 
                          ? "bg-primary text-white" 
                          : "bg-white text-primary/60 border border-primary/10 hover:border-primary/40"
                      )}
                    >
                      {neighborhood}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4">
                  {['All', 'House', 'Flat', 'Plot'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                        selectedType === type 
                          ? "bg-primary text-white" 
                          : "bg-white text-primary/60 border border-primary/10 hover:border-primary/40"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} onClick={() => setSelectedProperty(property)} />
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <div className="text-center py-40 space-y-6">
                <p className="text-2xl font-headline font-light text-primary/40 italic">No properties found matching your criteria.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedType('All'); setSelectedNeighborhood('All'); setSelectedPrice('All'); }}
                  className="text-secondary font-body text-[11px] font-bold uppercase tracking-widest underline underline-offset-8"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'About' && (
          <section className="max-w-7xl mx-auto px-8 py-32 space-y-40">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-12 bg-secondary"></div>
                    <span className="text-secondary font-body text-[10px] font-bold tracking-[0.3em] uppercase">The Visionary</span>
                  </div>
                  <h1 className="font-headline text-6xl md:text-8xl font-bold text-primary tracking-tighter leading-[0.9]">
                    Architectural Excellence in Dubai.
                  </h1>
                </div>
                <p className="text-xl text-primary/60 font-headline font-light leading-relaxed italic max-w-xl">
                  Dubai LUXE has redefined real estate in the UAE by blending architectural appreciation with rigorous market intelligence. Our approach is built on the belief that a home is the ultimate expression of one's legacy.
                </p>
                <div className="flex flex-wrap gap-12">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full border border-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="text-secondary" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-secondary">Certification</p>
                      <p className="font-headline text-xl text-primary">RERA Certified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full border border-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="text-secondary" size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-secondary">Accolade</p>
                      <p className="font-headline text-xl text-primary">Top Agent 2023</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-8 bg-secondary/5 rounded-[50%/30%] transition-transform group-hover:scale-105 duration-1000"></div>
                <div className="rounded-2xl overflow-hidden aspect-[4/5] relative z-10 bento-shadow">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop" 
                    alt="Dubai LUXE Director"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white py-32 px-12 rounded-[50%/5%] border border-primary/5">
              <div className="max-w-5xl mx-auto space-y-20">
                <div className="text-center space-y-4">
                  <span className="text-secondary font-body text-[10px] font-bold tracking-[0.3em] uppercase">Expertise</span>
                  <h2 className="text-5xl font-headline font-light text-primary">Core Specializations</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                  {[
                    { title: "Luxury Residential", desc: "Curating high-end estates and luxury apartments in Dubai's most exclusive neighborhoods." },
                    { title: "Investment Strategy", desc: "Strategic portfolio building focused on high-yield assets and long-term capital appreciation in the UAE." },
                    { title: "Legacy Planning", desc: "Personalized guidance for families making their most significant generational purchases." }
                  ].map((item, i) => (
                    <div key={i} className="space-y-6 group">
                      <div className="h-[1px] w-full bg-primary/10 group-hover:bg-secondary transition-colors duration-500"></div>
                      <h3 className="text-2xl font-headline font-bold text-primary italic">{item.title}</h3>
                      <p className="text-primary/60 font-headline font-light leading-relaxed text-lg">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Contact' && (
          <section className="max-w-7xl mx-auto px-8 py-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
              <div className="lg:col-span-7 space-y-16">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-12 bg-secondary"></div>
                    <span className="text-secondary font-body text-[10px] font-bold tracking-[0.3em] uppercase">Inquiry</span>
                  </div>
                  <h2 className="font-headline text-6xl font-bold text-primary leading-tight">Begin Your Journey.</h2>
                </div>
                
                {formSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-12 rounded-3xl border border-secondary/20 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-3xl font-headline font-bold text-primary">Message Received</h3>
                    <p className="text-primary/60 font-headline text-lg italic max-w-sm">Thank you for your interest. Our senior consultants will personally review your inquiry and respond within 24 hours.</p>
                    <button 
                      onClick={() => setFormSubmitted(false)}
                      className="text-secondary font-body text-[11px] font-bold uppercase tracking-widest underline underline-offset-8 pt-4"
                    >
                      Send Another Inquiry
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Full Name</label>
                        <input name="name" required className="w-full bg-transparent border-b border-primary/10 py-4 focus:border-primary outline-none font-headline text-xl transition-all" placeholder="Enter your name" type="text"/>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Email Address</label>
                        <input name="email" required className="w-full bg-transparent border-b border-primary/10 py-4 focus:border-primary outline-none font-headline text-xl transition-all" placeholder="email@example.com" type="email"/>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Phone Number</label>
                        <input name="phone" required className="w-full bg-transparent border-b border-primary/10 py-4 focus:border-primary outline-none font-headline text-xl transition-all" placeholder="+971 50 000 0000" type="tel"/>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Interest</label>
                        <select name="interest" className="w-full bg-transparent border-b border-primary/10 py-4 focus:border-primary outline-none font-headline text-xl transition-all appearance-none cursor-pointer">
                          <option>Buying</option>
                          <option>Selling</option>
                          <option>Investment</option>
                          <option>Consultation</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Message</label>
                      <textarea name="message" required className="w-full bg-transparent border-b border-primary/10 py-4 focus:border-primary outline-none font-headline text-xl transition-all resize-none" placeholder="How can we assist you?" rows={4}></textarea>
                    </div>
                    <button className="bg-primary text-white px-12 py-6 rounded-full font-body text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-primary-container transition-all shadow-2xl shadow-black/20 flex items-center gap-4" type="submit">
                      Submit Inquiry
                      <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
              
              <div className="lg:col-span-5 space-y-12">
                <div className="bg-white p-12 rounded-3xl border border-primary/5 space-y-12 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="space-y-10 relative z-10">
                    <h3 className="font-headline text-3xl font-bold text-primary italic">Private Office</h3>
                    <div className="space-y-8">
                      <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0">
                          <MapPin className="text-secondary" size={20} />
                        </div>
                        <div className="space-y-1">
                          <p className="font-body text-[10px] font-bold uppercase tracking-widest text-primary/40">Location</p>
                          <p className="font-headline text-xl text-primary leading-relaxed">Level 42, Emirates Towers,<br/>Sheikh Zayed Road, Dubai</p>
                        </div>
                      </div>
                      <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0">
                          <Mail className="text-secondary" size={20} />
                        </div>
                        <div className="space-y-1">
                          <p className="font-body text-[10px] font-bold uppercase tracking-widest text-primary/40">Direct Email</p>
                          <p className="font-headline text-xl text-primary">concierge@dubailuxe.com</p>
                        </div>
                      </div>
                      <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0">
                          <Clock className="text-secondary" size={20} />
                        </div>
                        <div className="space-y-1">
                          <p className="font-body text-[10px] font-bold uppercase tracking-widest text-primary/40">Hours</p>
                          <div className="font-headline text-xl text-primary space-y-1">
                            <p className="flex justify-between gap-12"><span>Mon - Fri</span> <span>09:00 - 18:00</span></p>
                            <p className="flex justify-between gap-12"><span>Saturday</span> <span>10:00 - 14:00</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-2xl overflow-hidden aspect-square border border-primary/5 p-2">
                  <img 
                    className="w-full h-full object-cover rounded-[50%/30%]" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQYuM123A67CG97dJ6K-4mzq9BvK2prcLqdXuL7xJN2NvIs3nxtAo51mmWAgU0Kg9i6gr298KnFIE5JR8LK1HK4Hq62M8PZY69BvzIme_Gg49i_oz9_Jfah1BB0alZ_ib20x5EJTygAUtR8_Uo4NAroM_hpZr_OI_T3OWxka8bGi4C2-BEitxu4rlzj6bntVIlmI5KVTVQEkJwCIQ1oMqKmKZIWKw8c4JZxvtmEMqH8Gv7feGRsIJzPlyss2wOX1hK8t7VU8fF0Qq2" 
                    alt="Office"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-primary/5 py-24">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left space-y-4">
            <div className="text-2xl font-headline font-bold text-primary">Dubai LUXE</div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40">© 2024 Dubai LUXE • Curating Lifestyles in Dubai.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-12">
            {['Privacy', 'Terms', 'Cookie Policy', 'Sitemap'].map(link => (
              <a key={link} href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40 hover:text-secondary transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* Property Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProperty(null)}
              className="absolute inset-0 bg-primary/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative bg-surface w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[50%/5%] shadow-2xl flex flex-col md:flex-row border border-white/10"
            >
              <button 
                onClick={() => setSelectedProperty(null)}
                className="absolute top-8 right-8 z-10 p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white hover:text-primary transition-all border border-white/20"
              >
                <X size={24} />
              </button>
              
              <div className="md:w-1/2 h-80 md:h-auto overflow-hidden">
                <img 
                  src={selectedProperty.image} 
                  alt={selectedProperty.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="md:w-1/2 p-12 md:p-20 overflow-y-auto space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-12 bg-secondary"></div>
                    <span className="text-secondary font-body text-[10px] font-bold tracking-[0.3em] uppercase">{selectedProperty.location}</span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-headline font-light text-primary leading-tight">{selectedProperty.title}</h2>
                  <div className="text-4xl font-headline font-bold text-secondary italic">{selectedProperty.price}</div>
                </div>

                <div className="grid grid-cols-3 gap-8 py-10 border-y border-primary/5">
                  <div className="flex flex-col items-center gap-3">
                    <Bed className="text-secondary" size={28} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{selectedProperty.beds} Beds</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <ShowerHead className="text-secondary" size={28} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{selectedProperty.baths} Baths</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <SquareSquare className="text-secondary" size={28} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{selectedProperty.area}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">The Property</h3>
                  <p className="text-xl font-headline font-light text-primary/70 leading-relaxed italic">
                    {selectedProperty.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-8">
                  <button 
                    onClick={() => { setSelectedProperty(null); setActiveTab('Contact'); }}
                    className="flex-grow bg-primary text-white py-6 rounded-full font-body text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-primary-container transition-all shadow-xl shadow-black/20"
                  >
                    Request Private Tour
                  </button>
                  <button className="p-6 border border-primary/10 rounded-full text-primary hover:bg-white transition-all">
                    <Heart size={24} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Modal */}
      <AnimatePresence>
        {isWhatsAppOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-end md:p-12 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full md:w-96 bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto m-4 border border-primary/5"
            >
              <div className="bg-secondary p-6 text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={28} />
                </div>
                <div>
                  <p className="font-headline font-bold text-lg">Dubai LUXE Concierge</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Online • Elite Service</p>
                </div>
                <button onClick={() => setIsWhatsAppOpen(false)} className="ml-auto hover:rotate-90 transition-transform">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-lg font-headline font-light italic text-primary/70 leading-relaxed">"Welcome to Dubai LUXE. How may we assist you in your property search today?"</p>
                <a 
                  href="https://wa.me/971500000000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-secondary text-white text-center py-4 rounded-xl font-body text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-opacity-90 transition-all"
                >
                  Start WhatsApp Chat
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-8 right-8 z-[90]">
        <button 
          onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
          className="bg-secondary text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 font-bold text-sm hover:scale-105 transition-transform active:scale-95"
        >
          <MessageCircle size={20} />
          Chat with Agent
        </button>
      </div>
    </div>
  );
}

interface PropertyCardProps {
  key?: string | number;
  property: Property;
  onClick: () => void;
}

function PropertyCard({ property, onClick }: PropertyCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card p-0 flex flex-col group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          src={property.image} 
          alt={property.title}
          referrerPolicy="no-referrer"
        />
        {property.status && (
          <div className="absolute top-3 left-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md",
              property.status === 'New' ? "bg-primary/80" : 
              property.status === 'Hot' ? "bg-orange-600/80" : 
              property.status === 'Sold' ? "bg-slate-500/80" : "bg-secondary/80"
            )}>
              {property.status}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-primary leading-tight">{property.title}</h3>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{property.location}</p>
          </div>
          <div className="text-lg font-bold text-primary">{property.price}</div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-on-surface-variant pt-3 border-t border-outline-variant">
          <div className="flex items-center gap-1.5">
            <Bed size={14} className="text-primary" />
            <span>{property.beds}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShowerHead size={14} className="text-primary" />
            <span>{property.baths}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SquareSquare size={14} className="text-primary" />
            <span>{property.area}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
