/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wine, 
  Utensils, 
  Coffee, 
  ChevronRight, 
  X, 
  Sparkles, 
  Leaf,
  History,
  Heart,
  ShoppingBag,
  Trash2,
  Play,
  Plus,
  Minus,
  Share2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  COCKTAILS, 
  SNACKS, 
  RESTO_BEBIDAS, 
  MenuItem, 
  DrinkCategory 
} from './constants';
import { getPairingRecommendation } from './services/geminiService';

type Tab = 'cocktails' | 'snacks' | 'drinks';
type CocktailCategory = 'ALL' | 'CON ALCOHOL' | 'SIN ALCOHOL' | 'LOW ALCOHOL';
type Language = 'es' | 'en';

const TRANSLATIONS = {
  es: {
    cocktails: 'Cócteles',
    snacks: 'Snacks',
    drinks: 'Bebidas',
    all: 'Todos',
    withAlcohol: 'Con Alcohol',
    withoutAlcohol: 'Sin Alcohol',
    lowAlcohol: 'Low Alcohol',
    mySelection: 'Mi Selección',
    viewDetails: 'Ver detalles',
    ingredients: 'Ingredientes',
    history: 'Nuestra Historia',
    pairing: 'Recomendación del Sumiller',
    addFavorite: 'Añadir a mi selección',
    removeFavorite: 'Quitar de mi selección',
    orderInstruction: 'Muestra esta pantalla a tu camarero para realizar el pedido',
    close: 'Cerrar',
    swipeMore: 'Desliza para ver más',
    iva: 'IVA Incluido',
    sommelierReason: '¿Por qué este maridaje?',
    suggested: 'Sugerencia',
    tryWith: 'Prueba con:',
    reason: 'Razón:',
    share: 'Compartir',
    shareText: 'Mira lo que me voy a tomar en la terraza del hotel Vincci Consulado Bilbao',
    shareSelectionText: 'Esta es mi selección en la terraza del hotel Vincci Consulado Bilbao:',
    viewVideo: 'Ver Video',
    viewInfo: 'Ver Info'
  },
  en: {
    cocktails: 'Cocktails',
    snacks: 'Snacks',
    drinks: 'Drinks',
    all: 'All',
    withAlcohol: 'With Alcohol',
    withoutAlcohol: 'Alcohol Free',
    lowAlcohol: 'Low Alcohol',
    mySelection: 'My Selection',
    viewDetails: 'View details',
    ingredients: 'Ingredients',
    history: 'Our History',
    pairing: 'Sommelier Recommendation',
    addFavorite: 'Add to my selection',
    removeFavorite: 'Remove from my selection',
    orderInstruction: 'Show this screen to your waiter to place the order',
    close: 'Close',
    swipeMore: 'Swipe for more',
    iva: 'VAT Included',
    sommelierReason: 'Why this pairing?',
    suggested: 'Suggestion',
    tryWith: 'Try with:',
    reason: 'Reason:',
    share: 'Share',
    shareText: 'Look what I\'m having at the terrace of Vincci Consulado Bilbao hotel!',
    shareSelectionText: 'This is my selection at the terrace of Vincci Consulado Bilbao hotel:',
    viewVideo: 'View Video',
    viewInfo: 'View Info'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('cocktails');
  const [cocktailFilter, setCocktailFilter] = useState<CocktailCategory>('ALL');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalMode, setModalMode] = useState<'video' | 'info'>('info');
  const [isVideoVertical, setIsVideoVertical] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [favorites, setFavorites] = useState<(MenuItem & { quantity: number })[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [lang, setLang] = useState<Language>('es');

  const t = TRANSLATIONS[lang];

  const handleItemClick = async (item: MenuItem, mode: 'video' | 'info' = 'info') => {
    setSelectedItem(item);
    setModalMode(mode);
    setIsVideoVertical(false); // Reset orientation on new item
    setRecommendation(null);
    if (activeTab !== 'drinks') {
      setLoadingRec(true);
      const rec = await getPairingRecommendation(item, activeTab === 'cocktails', lang);
      setRecommendation(rec);
      setLoadingRec(false);
    }
  };

  const addToSelection = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    setFavorites(prev => {
      const existing = prev.find(f => f.id === item.id);
      if (existing) {
        return prev.map(f => f.id === item.id ? { ...f, quantity: f.quantity + 1 } : f);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setFavorites(prev => {
      return prev.map(f => {
        if (f.id === id) {
          const newQty = Math.max(1, f.quantity + delta);
          return { ...f, quantity: newQty };
        }
        return f;
      });
    });
  };

  const removeFromSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const isFavorite = (id: string) => favorites.some(f => f.id === id);
  const getItemQuantity = (id: string) => favorites.find(f => f.id === id)?.quantity || 0;
  const getTotalItems = () => favorites.reduce((sum, item) => sum + item.quantity, 0);

  const shareItem = async (item: MenuItem) => {
    const name = lang === 'es' ? item.name : (item.nameEn || item.name);
    const text = `${t.shareText}\n\n*${name}*\n${item.price}\n\n📍 Vincci Consulado Bilbao - Lobby Y Terraza`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vincci Consulado Bilbao - Lobby Y Terraza',
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const shareSelection = async () => {
    const itemsText = favorites.map(f => {
      const name = lang === 'es' ? f.name : (f.nameEn || f.name);
      return `- ${f.quantity}x ${name}`;
    }).join('\n');
    
    const text = `${t.shareSelectionText}\n\n${itemsText}\n\n📍 Vincci Consulado Bilbao - Lobby Y Terraza`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi selección en Vincci Consulado Bilbao - Lobby Y Terraza',
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const filteredCocktails = cocktailFilter === 'ALL' 
    ? COCKTAILS 
    : COCKTAILS.filter(c => c.category === cocktailFilter);

  return (
    <div className="min-h-screen botanical-bg pb-32 overflow-x-hidden">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center relative">
        <div className="absolute top-4 right-6">
          <button 
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-sm border border-botanical/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-botanical hover:bg-white transition-all shadow-sm"
          >
            <span className={lang === 'es' ? 'text-gold' : 'opacity-40'}>ES</span>
            <span className="opacity-20">|</span>
            <span className={lang === 'en' ? 'text-gold' : 'opacity-40'}>EN</span>
          </button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-botanical/60 font-medium">Vincci Hoteles</span>
          <h1 className="text-5xl md:text-6xl font-light text-botanical tracking-tight">
            Vincci <span className="italic">Consulado</span> Bilbao
          </h1>
          <span className="text-sm md:text-base tracking-[0.4em] uppercase text-gold font-medium mt-2">
            Lobby Y Terraza
          </span>
          <div className="w-12 h-[1px] bg-gold mt-4" />
        </motion.div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-cream/80 backdrop-blur-md py-4 mb-8 border-b border-botanical/5">
        <div className="max-w-md mx-auto px-4 flex justify-between gap-2">
          <NavButton 
            active={activeTab === 'cocktails'} 
            onClick={() => setActiveTab('cocktails')}
            icon={<Wine size={18} />}
            label={t.cocktails}
          />
          <NavButton 
            active={activeTab === 'snacks'} 
            onClick={() => setActiveTab('snacks')}
            icon={<Utensils size={18} />}
            label={t.snacks}
          />
          <NavButton 
            active={activeTab === 'drinks'} 
            onClick={() => setActiveTab('drinks')}
            icon={<Coffee size={18} />}
            label={t.drinks}
          />
        </div>

        {/* Cocktail Sub-filters */}
        <AnimatePresence>
          {activeTab === 'cocktails' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center gap-2 mt-4 px-4 overflow-x-auto no-scrollbar"
            >
              <FilterButton active={cocktailFilter === 'ALL'} onClick={() => setCocktailFilter('ALL')} label={t.all} />
              <FilterButton active={cocktailFilter === 'CON ALCOHOL'} onClick={() => setCocktailFilter('CON ALCOHOL')} label={t.withAlcohol} />
              <FilterButton active={cocktailFilter === 'LOW ALCOHOL'} onClick={() => setCocktailFilter('LOW ALCOHOL')} label={t.lowAlcohol} />
              <FilterButton active={cocktailFilter === 'SIN ALCOHOL'} onClick={() => setCocktailFilter('SIN ALCOHOL')} label={t.withoutAlcohol} />
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + cocktailFilter}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'cocktails' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCocktails.map((item) => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    lang={lang}
                    onClick={(mode) => handleItemClick(item, mode)} 
                    onFavorite={(e) => addToSelection(e, item)}
                    isFavorite={isFavorite(item.id)}
                    quantity={getItemQuantity(item.id)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'snacks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {SNACKS.map((item) => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    lang={lang}
                    onClick={(mode) => handleItemClick(item, mode)} 
                    onFavorite={(e) => addToSelection(e, item)}
                    isFavorite={isFavorite(item.id)}
                    quantity={getItemQuantity(item.id)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'drinks' && (
              <div className="max-w-3xl mx-auto space-y-12">
                {RESTO_BEBIDAS.map((category) => (
                  <CategoryList 
                    key={category.name} 
                    category={category} 
                    lang={lang}
                    onFavorite={addToSelection}
                    isFavorite={isFavorite}
                    quantity={getItemQuantity}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {favorites.length > 0 && (
          <motion.button
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-8 right-8 z-50 bg-botanical text-cream p-4 rounded-full shadow-2xl flex items-center gap-3 group"
          >
            <div className="relative">
              <ShoppingBag size={24} />
              <span className="absolute -top-2 -right-2 bg-gold text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-botanical">
                {getTotalItems()}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">
              {t.mySelection}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="absolute inset-0 bg-botanical/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-cream rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-botanical/5 flex justify-between items-center bg-white">
                <h2 className="text-2xl font-light text-botanical">{t.mySelection}</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={shareSelection}
                    className="p-2 hover:bg-botanical/5 rounded-full transition-colors text-botanical/60"
                  >
                    <Share2 size={20} />
                  </button>
                  <button onClick={() => setShowCart(false)} className="p-2 hover:bg-botanical/5 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {favorites.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-botanical/5 group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image || 'https://picsum.photos/200'} alt={lang === 'es' ? item.name : (item.nameEn || item.name)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-botanical font-medium truncate">{lang === 'es' ? item.name : (item.nameEn || item.name)}</h4>
                      <p className="text-gold text-sm">{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-botanical/5 rounded-full px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-botanical/10 rounded-full transition-colors text-botanical/60"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold text-botanical min-w-[1.5rem] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-botanical/10 rounded-full transition-colors text-botanical/60"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={(e) => removeFromSelection(e, item.id)}
                      className="p-2 text-botanical/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-botanical/5">
                <p className="text-center text-xs text-botanical/40 uppercase tracking-widest mb-4">
                  {t.orderInstruction}
                </p>
                <button 
                  onClick={() => setShowCart(false)}
                  className="w-full bg-botanical text-cream py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-botanical/90 transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-botanical/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] bg-cream md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full text-botanical shadow-lg border border-botanical/10"
              >
                <X size={24} />
              </button>

              <button 
                onClick={() => shareItem(selectedItem)}
                className="absolute top-4 left-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full text-botanical shadow-lg border border-botanical/10"
              >
                <Share2 size={24} />
              </button>

              {/* Image Section - Fixed height on mobile, auto on desktop. Vertical videos take 60% height on mobile to ensure content is visible. */}
              <div className={`w-full md:w-1/2 relative bg-black shrink-0 transition-all duration-700 ${
                selectedItem.video && modalMode === 'video' && isVideoVertical ? 'h-[60vh]' : 'h-[40vh]'
              } md:h-auto`}>
                {selectedItem.video && modalMode === 'video' ? (
                  <div className="relative w-full h-full">
                    <video 
                      key={selectedItem.video}
                      src={selectedItem.video} 
                      poster={selectedItem.image}
                      autoPlay 
                      loop 
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        if (video.videoHeight > video.videoWidth) {
                          setIsVideoVertical(true);
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="absolute bottom-4 left-4 z-50 p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/40 transition-all"
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                ) : (
                  <img 
                    key={selectedItem.image}
                    src={selectedItem.image} 
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-botanical/60 to-transparent md:hidden" />
                
                {/* Mode Toggle Button */}
                {selectedItem.video && (
                  <button 
                    onClick={() => setModalMode(modalMode === 'video' ? 'info' : 'video')}
                    className="absolute bottom-4 right-4 z-50 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-botanical text-[10px] font-bold uppercase tracking-widest shadow-lg border border-botanical/10 flex items-center gap-2 hover:bg-gold hover:text-white transition-all"
                  >
                    {modalMode === 'video' ? <History size={14} /> : <Play size={14} fill="currentColor" />}
                    {modalMode === 'video' ? t.viewInfo : t.viewVideo}
                  </button>
                )}
              </div>

              {/* Content Section - Scrollable on mobile */}
              <div className="w-full md:w-1/2 md:overflow-y-auto bg-cream">
                <div className="p-8 md:p-12 space-y-8">
                  {selectedItem.video && modalMode === 'video' && isVideoVertical && (
                    <div className="md:hidden flex flex-col items-center justify-center py-2 text-botanical/40 animate-bounce">
                      <span className="text-[10px] uppercase tracking-widest font-bold">{t.swipeMore}</span>
                      <ChevronRight size={16} className="rotate-90" />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
                      <h2 className="text-4xl font-light text-botanical leading-tight">{lang === 'es' ? selectedItem.name : (selectedItem.nameEn || selectedItem.name)}</h2>
                      <span className="text-2xl font-serif text-gold whitespace-nowrap">{selectedItem.price}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(lang === 'es' ? selectedItem.tags : (selectedItem.tagsEn || selectedItem.tags))?.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-botanical/5 text-botanical/70 text-[10px] uppercase tracking-widest rounded-full border border-botanical/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                {(lang === 'es' ? selectedItem.ingredients : (selectedItem.ingredientsEn || selectedItem.ingredients)) && (
                  <section>
                    <h3 className="flex items-center gap-2 text-sm uppercase tracking-widest text-gold mb-3 font-semibold">
                      <Leaf size={14} /> {t.ingredients}
                    </h3>
                    <p className="text-botanical/80 leading-relaxed font-light italic">
                      {(lang === 'es' ? selectedItem.ingredients : (selectedItem.ingredientsEn || selectedItem.ingredients))?.join(", ")}
                    </p>
                  </section>
                )}

                {(lang === 'es' ? selectedItem.history : (selectedItem.historyEn || selectedItem.history)) && (
                  <section>
                    <h3 className="flex items-center gap-2 text-sm uppercase tracking-widest text-gold mb-3 font-semibold">
                      <History size={14} /> {t.history}
                    </h3>
                    <p className="text-botanical/80 leading-relaxed font-light">
                      {lang === 'es' ? selectedItem.history : (selectedItem.historyEn || selectedItem.history)}
                    </p>
                  </section>
                )}

                {/* AI Recommendation */}
                {activeTab !== 'drinks' && (
                  <section className="p-6 bg-botanical/5 rounded-2xl border border-botanical/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles size={48} className="text-gold" />
                    </div>
                    <h3 className="flex items-center gap-2 text-sm uppercase tracking-widest text-botanical mb-4 font-bold">
                      <Sparkles size={14} className="text-gold" /> {t.pairing}
                    </h3>
                    
                    {loadingRec ? (
                      <div className="flex items-center gap-3 text-botanical/50 italic py-2">
                        <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                        {lang === 'es' ? 'Consultando a nuestro experto...' : 'Consulting our expert...'}
                      </div>
                    ) : recommendation ? (
                      <div className="space-y-3">
                        <p className="text-botanical font-medium">
                          {t.tryWith} <span className="text-gold underline decoration-gold/30 underline-offset-4">{recommendation.suggestedItem}</span>
                        </p>
                        <p className="text-sm text-botanical/70 leading-relaxed italic">
                          "{recommendation.recommendation}"
                        </p>
                        <p className="text-[11px] text-botanical/50 uppercase tracking-tighter">
                          {t.reason} {recommendation.reason}
                        </p>
                      </div>
                    ) : null}
                  </section>
                )}

                <button 
                  onClick={(e) => {
                    addToSelection(e, selectedItem);
                    setSelectedItem(null);
                  }}
                  className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-botanical text-cream hover:bg-gold hover:text-white"
                >
                  <Heart size={18} fill={isFavorite(selectedItem.id) ? "currentColor" : "none"} />
                  {t.addFavorite} {getItemQuantity(selectedItem.id) > 0 ? `(${getItemQuantity(selectedItem.id)})` : ''}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-botanical/5 text-center px-6">
        <p className="text-xs text-botanical/40 uppercase tracking-[0.2em]">
          {t.iva} • Vincci Hoteles
        </p>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all duration-500
        ${active 
          ? 'bg-botanical text-cream shadow-lg shadow-botanical/20' 
          : 'text-botanical/60 hover:bg-botanical/5'
        }
      `}
    >
      {icon}
      <span className="text-xs font-semibold uppercase tracking-widest hidden sm:inline">{label}</span>
    </button>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap
        ${active 
          ? 'bg-gold text-white shadow-md' 
          : 'bg-botanical/5 text-botanical/60 hover:bg-botanical/10 border border-botanical/10'
        }
      `}
    >
      {label}
    </button>
  );
}

function ItemCard({ item, onClick, onFavorite, isFavorite, lang, quantity }: { item: MenuItem, onClick: (mode: 'video' | 'info') => void | Promise<void>, onFavorite: (e: React.MouseEvent) => void, isFavorite: boolean, lang: Language, quantity: number, key?: string | number }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-botanical/5 relative"
    >
      <button 
        onClick={onFavorite}
        className={`absolute top-4 left-4 z-10 p-2 rounded-full backdrop-blur-md transition-all flex items-center gap-1 ${
          isFavorite ? 'bg-gold text-white scale-110' : 'bg-white/80 text-botanical hover:scale-110'
        }`}
      >
        <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        {quantity > 0 && <span className="text-[10px] font-bold">{quantity}</span>}
      </button>

      <div className="h-64 overflow-hidden relative bg-botanical/10">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${item.image})` }}
          aria-label={lang === 'es' ? item.name : (item.nameEn || item.name)}
          onClick={() => onClick('info')}
        />
        {item.video && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onClick('video'); }}
          >
            <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/50 shadow-lg group-hover:scale-110 transition-transform">
              <Play size={24} fill="white" />
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-serif text-botanical shadow-sm pointer-events-none">
          {item.price}
        </div>
      </div>
      <div className="p-6" onClick={() => onClick('info')}>
        <div className="flex flex-wrap gap-2 mb-3">
          {(lang === 'es' ? item.tags : (item.tagsEn || item.tags))?.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] uppercase tracking-widest text-gold font-bold">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-2xl font-light text-botanical mb-2 group-hover:text-gold transition-colors">{lang === 'es' ? item.name : (item.nameEn || item.name)}</h3>
        <p className="text-sm text-botanical/60 line-clamp-2 font-light italic">
          {lang === 'es' ? item.description : (item.descriptionEn || item.description)}
        </p>
        <div className="mt-6 flex items-center text-[10px] uppercase tracking-[0.2em] text-botanical/40 font-bold group-hover:text-botanical transition-colors">
          {lang === 'es' ? 'Ver detalles' : 'View details'} <ChevronRight size={12} className="ml-1" />
        </div>
      </div>
    </motion.div>
  );
}

function CategoryList({ category, onFavorite, isFavorite, lang, quantity }: { category: DrinkCategory, onFavorite: (e: React.MouseEvent, item: MenuItem) => void, isFavorite: (id: string) => boolean, lang: Language, quantity: (id: string) => number, key?: string | number }) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-light text-botanical whitespace-nowrap">{lang === 'es' ? category.name : (category.nameEn || category.name)}</h2>
        <div className="flex-1 h-[1px] bg-botanical/10" />
      </div>
      <div className="space-y-4">
        {category.items.map((item) => {
          const qty = quantity(item.id);
          return (
            <div 
              key={item.id} 
              className="flex justify-between items-center group py-2 border-b border-botanical/5 hover:border-gold/30 transition-colors gap-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={(e) => onFavorite(e, item)}
                  className={`p-1.5 rounded-full transition-all shrink-0 flex items-center gap-1 ${
                    isFavorite(item.id) ? 'text-gold' : 'text-botanical/20 hover:text-botanical/40'
                  }`}
                >
                  <Heart size={16} fill={isFavorite(item.id) ? "currentColor" : "none"} />
                  {qty > 0 && <span className="text-[10px] font-bold">{qty}</span>}
                </button>
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-light text-botanical group-hover:text-gold transition-colors truncate">{lang === 'es' ? item.name : (item.nameEn || item.name)}</span>
                  {(lang === 'es' ? item.description : (item.descriptionEn || item.description)) && <span className="text-xs text-botanical/40 italic truncate">{lang === 'es' ? item.description : (item.descriptionEn || item.description)}</span>}
                </div>
              </div>
              <div className="flex-1 border-b border-dotted border-botanical/10 h-0 mb-1 min-w-[20px]" />
              <span className="font-serif text-gold shrink-0">{item.price}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
