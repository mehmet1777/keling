import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Settings from './Settings';
import { playSound } from '../utils/SoundManager';
import { 
  levelAchievements,
  collectionAchievements,
  checkLevelAchievements, 
  checkCollectionAchievements,
  getInProgressLevelAchievements,
  getInProgressCollectionAchievements,
  getClaimedLevelAchievements,
  getClaimedCollectionAchievements,
  dailyRepeatQuests,
  getTodayDate,
  getTodayRepeatCount,
  checkDailyRepeatQuests,
  getSuggestedCollections
} from '../data/achievements';
import confetti from 'canvas-confetti';

// Animasyonlu arka plan bileşeni
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Ana arka plan - Kelime Bankası'nın arka plan renkleri */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-indigo-950/20 to-black" />
      
      {/* Animasyonlu ızgara */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Parıltı efektleri */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Oyun kartı bileşeni - Kelime Bankası'ndaki kart tasarımına benzer
const GameCard = ({ onClick, title, icon, emoji, delay = 0, detailText, layoutMode }) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24,
        delay: delay * 0.15
      }
    }
  };

  // Her kart için farklı renk paleti
  const getCardColors = () => {
    if (title.includes('Bölüm') || title.includes('Level')) {
      return {
        bg: 'from-rose-500/30 via-pink-500/20 to-fuchsia-500/30',
        border: 'border-rose-400/40 hover:border-rose-300/60',
        iconBg: 'from-rose-400 to-pink-500',
        text: 'text-rose-100/80',
        arrow: 'text-rose-200'
      };
    } else if (title.includes('Tekrar') || title.includes('Review')) {
      return {
        bg: 'from-violet-500/30 via-purple-500/20 to-indigo-500/30',
        border: 'border-violet-400/40 hover:border-violet-300/60',
        iconBg: 'from-violet-400 to-purple-500',
        text: 'text-violet-100/80',
        arrow: 'text-violet-200'
      };
    } else if (title.includes('Banka') || title.includes('Bank')) {
      return {
        bg: 'from-blue-500/30 via-cyan-500/20 to-teal-500/30',
        border: 'border-blue-400/40 hover:border-blue-300/60',
        iconBg: 'from-blue-400 to-cyan-500',
        text: 'text-blue-100/80',
        arrow: 'text-blue-200'
      };
    } else {
      return {
        bg: 'from-amber-500/30 via-orange-500/20 to-yellow-500/30',
        border: 'border-amber-400/40 hover:border-amber-300/60',
        iconBg: 'from-amber-400 to-orange-500',
        text: 'text-amber-100/80',
        arrow: 'text-amber-200'
      };
    }
  };

  const colors = getCardColors();

  // Grid modunda kompakt tasarım
  if (layoutMode === 'grid') {
    return (
      <motion.div
        onClick={onClick}
        className="w-full"
        variants={variants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} rounded-xl p-4 border-2 ${colors.border} shadow-lg backdrop-blur-sm transition-all duration-300 h-full flex flex-col items-center justify-center text-center gap-2`}>
          {/* Parlayan efekt */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center shadow-lg`}>
            {emoji ? (
              <span className="text-3xl">{emoji}</span>
            ) : (
              icon
            )}
          </div>
          <h3 className="relative text-sm font-bold text-white font-serif tracking-wide leading-tight">{title}</h3>
        </div>
      </motion.div>
    );
  }

  // List modunda premium tasarım
  return (
    <motion.div
      onClick={onClick}
      className="w-full relative overflow-hidden"
      variants={variants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl p-5 border-2 ${colors.border} shadow-lg backdrop-blur-sm transition-all duration-300`}>
        {/* Parlayan Efekt */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        <div className="relative flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            {emoji ? (
              <span className="text-4xl">{emoji}</span>
            ) : (
              icon
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white font-serif tracking-wide mb-1">{title}</h3>
            <div className="flex items-center">
              <div className={`w-1 h-5 bg-gradient-to-b ${colors.iconBg} rounded-full mr-2`}></div>
              <p className={`${colors.text} text-sm font-medium truncate`}>{detailText}</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${colors.arrow}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Market Modal
const MarketModal = ({ isOpen, onClose }) => {
  const [language] = useState(() => localStorage.getItem('language') || 'tr');
  const [selectedTab, setSelectedTab] = useState('diamonds'); // 'diamonds', 'features', 'support'

  const marketTranslations = {
    tr: {
      title: "Market",
      diamonds: "Elmas Paketleri",
      features: "Özellikler",
      support: "Destek",
      removeAds: "Reklamları Kaldır",
      removeAdsDesc: "Tüm reklamları kalıcı olarak kaldır",
      skipLevel: "Seviye Atlama",
      skipLevelDesc: "Zorlandığın bölümü atla",
      supportDev: "Geliştiriciyi Destekle",
      supportDevDesc: "Bize destek ol, özel rozetler kazan",
      buy: "Satın Al",
      mostPopular: "EN POPÜLER",
      bestValue: "EN İYİ DEĞER",
      bonus: "Bonus",
      permanent: "Kalıcı",
      singleUse: "Tek Kullanım",
      comingSoon: "Yakında",
    },
    en: {
      title: "Store",
      diamonds: "Diamond Packs",
      features: "Features",
      support: "Support",
      removeAds: "Remove Ads",
      removeAdsDesc: "Remove all ads permanently",
      skipLevel: "Skip Level",
      skipLevelDesc: "Skip difficult levels",
      supportDev: "Support Developer",
      supportDevDesc: "Support us, earn special badges",
      buy: "Buy",
      mostPopular: "MOST POPULAR",
      bestValue: "BEST VALUE",
      bonus: "Bonus",
      permanent: "Permanent",
      singleUse: "Single Use",
      comingSoon: "Coming Soon",
    }
  };

  const t = marketTranslations[language];

  // Elmas paketleri
  const diamondPacks = [
    { id: 'small', amount: 50, price: '19,99 TL', bonus: 0 },
    { id: 'medium', amount: 150, price: '49,99 TL', bonus: 20, tag: t.mostPopular },
    { id: 'large', amount: 350, price: '99,99 TL', bonus: 50 },
    { id: 'xlarge', amount: 800, price: '199,99 TL', bonus: 100 },
    { id: 'mega', amount: 2200, price: '499,99 TL', bonus: 300, tag: t.bestValue },
  ];

  // Özellikler (Gerçek Para)
  const features = [
    { 
      id: 'removeAds', 
      title: t.removeAds, 
      desc: t.removeAdsDesc, 
      price: '79,99 TL', 
      icon: '🚫📺',
      type: t.permanent,
      currency: 'TL'
    },
  ];

  // Seviye Atlama Paketleri (Elmas ile)
  const skipLevelPacks = [
    { 
      id: 'skipLevel1', 
      title: t.skipLevel + ' (1x)', 
      desc: t.skipLevelDesc, 
      price: 10, 
      icon: '👑',
      iconBg: 'from-blue-500 to-cyan-500',
      type: t.singleUse,
      currency: 'diamond'
    },
    { 
      id: 'skipLevel3', 
      title: t.skipLevel + ' (3x)', 
      desc: t.skipLevelDesc, 
      price: 25,
      icon: '👑', 
      
      iconBg: 'from-purple-500 to-pink-500',
      type: t.singleUse,
      currency: 'diamond'
    },
    { 
      id: 'skipLevel5', 
      title: t.skipLevel + ' (5x)', 
      desc: t.skipLevelDesc, 
      price: 40, 
      icon: '👑',
      iconBg: 'from-orange-500 to-red-500',
      type: t.singleUse,
      currency: 'diamond',
      tag: t.mostPopular
    },
    { 
      id: 'skipLevel10', 
      title: t.skipLevel + ' (10x)', 
      desc: t.skipLevelDesc, 
      price: 70, 
      icon: '👑',
      iconBg: 'from-yellow-500 to-amber-500',
      type: t.singleUse,
      currency: 'diamond',
      tag: t.bestValue
    },
  ];

  // Destek paketleri
  const supportPacks = [
    { id: 'coffee', title: '☕ Kahve', price: '19,99 TL', badge: '🏅 Destekçi', bonus: 0 },
    { id: 'gold', title: '🥇 Altın', price: '39,99 TL', badge: '🏅 Altın Destekçi', bonus: 20 },
    { id: 'diamond', title: '💎 Elmas', price: '79,99 TL', badge: '🏅 Elmas Destekçi', bonus: 50 },
    { id: 'legend', title: '👑 Efsane', price: '149,99 TL', badge: '🏅 Efsane Destekçi', bonus: 100 },
  ];

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const handlePurchase = (itemId) => {
    playSound('telefontıklama.mp3');
    // TODO: Google Play satın alma entegrasyonu buraya gelecek
    console.log('Satın alma:', itemId);
    alert(t.comingSoon + ' - Google Play entegrasyonu eklenecek');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-hidden flex flex-col border border-white/20"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 0 60px rgba(234, 179, 8, 0.3), 0 0 100px rgba(168, 85, 247, 0.2)'
            }}
          >
            {/* Static neon border */}
            <div 
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                boxShadow: '0 0 20px rgba(234, 179, 8, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.05)'
              }}
            />
            
            {/* Static neon grid lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-pink-500 to-transparent"></div>
              <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
            </div>
            
            {/* Static neon orbs */}
            <div
              className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-60"
              style={{ 
                top: '-20%', 
                right: '-20%',
                background: 'radial-gradient(circle, rgba(234, 179, 8, 0.12) 0%, transparent 70%)'
              }}
            />
            <div
              className="absolute w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-60"
              style={{ 
                bottom: '-10%', 
                left: '-10%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)'
              }}
            />
            {/* Başlık */}
            <div className="relative flex justify-between items-center mb-4 z-10">
              <div className="flex items-center">
                <div className="w-1.5 h-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">{t.title}</h2>
              </div>
              <motion.button 
                className="text-gray-400 hover:text-white bg-gray-800/70 backdrop-blur-sm rounded-full p-2 transition-all border border-gray-700/30 shadow-lg"
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  onClose();
                }}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(31, 41, 55, 0.9)" }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Sekmeler */}
            <div className="relative flex gap-2 mb-4 z-10">
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setSelectedTab('diamonds');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTab === 'diamonds'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                💎 {t.diamonds}
              </motion.button>
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setSelectedTab('features');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTab === 'features'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ⚡ {t.features}
              </motion.button>
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setSelectedTab('support');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTab === 'support'
                    ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ❤️ {t.support}
              </motion.button>
            </div>

            {/* İçerik */}
            <style>{`
              .market-scroll::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div 
              className="market-scroll relative flex-1 overflow-y-auto space-y-3 px-1 select-none z-10" 
              style={{ 
                touchAction: 'pan-y',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Elmas Paketleri - Kompakt Tasarım */}
              {selectedTab === 'diamonds' && diamondPacks.map((pack, index) => (
                <motion.div
                  key={pack.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                  className="relative overflow-visible"
                >
                  {/* Glow Effect for special packs */}
                  {pack.tag && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 rounded-2xl blur-2xl"
                      animate={{ 
                        opacity: [0.4, 0.7, 0.4],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  
                  <div className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 ${
                    pack.tag ? 'border-yellow-400/60 mt-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80' : 'border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80'
                  } shadow-xl backdrop-blur-sm`}>
                    {pack.tag && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg z-10 whitespace-nowrap">
                        {pack.tag}
                      </div>
                    )}
                    
                    {/* Horizontal Layout */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Diamond Icon - Simple */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-4xl sm:text-5xl">💎</span>
                      </div>
                      
                      {/* Amount and Bonus */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-white font-black text-2xl sm:text-3xl">{pack.amount + pack.bonus}</span>
                          <span className="text-yellow-400 text-sm font-medium">{language === 'tr' ? 'Elmas' : 'Diamonds'}</span>
                        </div>
                        {pack.bonus > 0 && (
                          <div className="text-green-400 text-xs sm:text-sm font-semibold">
                            🎁 +{pack.bonus} {t.bonus}
                          </div>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-yellow-300 font-black text-lg sm:text-xl">{pack.price}</div>
                      </div>
                    </div>
                    
                    {/* Buy Button */}
                    <motion.button
                      onClick={() => handlePurchase(pack.id)}
                      className="relative w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white font-bold shadow-lg overflow-hidden bg-gradient-to-r from-yellow-600 to-orange-600"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                      <span className="relative text-sm sm:text-base">{t.buy}</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}

              {/* Özellikler */}
              {selectedTab === 'features' && (
                <>
                  {/* Reklamları Kaldır - Premium Özellik */}
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                      className="relative overflow-visible"
                    >
                      {/* Glow Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-xl"
                        animate={{ 
                          opacity: [0.5, 0.8, 0.5],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      
                      <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-2xl p-4 sm:p-5 border border-purple-500/30 shadow-2xl">
                        {/* Sparkle Effects */}
                        <div className="absolute top-2 right-2">
                          <motion.span
                            className="text-xl"
                            animate={{ 
                              rotate: [0, 360],
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            ✨
                          </motion.span>
                        </div>
                        
                        {/* Header Section */}
                        <div className="flex items-start gap-3 mb-4">
                          <motion.div
                            className="relative"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500 flex flex-col items-center justify-center shadow-xl border-2 border-white/20">
                              <span className="text-2xl sm:text-3xl mb-0.5">{feature.icon}</span>
                              <span className="text-white font-black text-[10px] sm:text-xs tracking-wide">NO ADS</span>
                            </div>
                          </motion.div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-black text-lg sm:text-xl">{feature.title}</h3>
                              <span className="text-xs">⭐</span>
                            </div>
                            <p className="text-purple-200 text-xs sm:text-sm mb-2">{feature.desc}</p>
                            <div className="inline-flex items-center gap-1 bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs px-2 py-1 rounded-full">
                              <span>🔒</span>
                              <span className="font-semibold">{feature.type}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Benefits List */}
                        <div className="bg-black/30 rounded-xl p-3 mb-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                            <span className="text-green-400">✓</span>
                            <span>{language === 'tr' ? 'Hiç reklam görmeden oyna' : 'Play without any ads'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                            <span className="text-green-400">✓</span>
                            <span>{language === 'tr' ? 'Kesintisiz oyun deneyimi' : 'Uninterrupted gameplay'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                            <span className="text-green-400">✓</span>
                            <span>{language === 'tr' ? 'Tek seferlik ödeme' : 'One-time payment'}</span>
                          </div>
                        </div>
                        
                        {/* Price & Button */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <motion.button
                              onClick={() => handlePurchase(feature.id)}
                              className="relative w-full py-3 rounded-xl text-white font-bold shadow-xl overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              />
                              <span className="relative text-sm sm:text-base">{t.buy}</span>
                            </motion.button>
                          </div>
                          <div className="text-right">
                            <div className="text-purple-300 text-xs">{language === 'tr' ? 'Sadece' : 'Only'}</div>
                            <div className="text-white font-black text-xl sm:text-2xl">{feature.price}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Başlık - Seviye Atlama */}
                  <div className="mt-4 mb-2">
                    <h3 className="text-blue-300 text-sm font-bold flex items-center gap-2">
                      <span>💎</span>
                      {language === 'tr' ? 'Seviye Atlama (Elmas ile)' : 'Skip Level (With Diamonds)'}
                    </h3>
                  </div>

                  {/* Elmas ile Satın Alınabilenler */}
                  {skipLevelPacks.map((pack, index) => (
                    <motion.div
                      key={pack.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: (features.length + index) * 0.1 }}
                      className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 ${
                        pack.tag ? 'border-yellow-400/60 shadow-xl mt-3' : 'border-gray-700/50'
                      } backdrop-blur-sm bg-gradient-to-br from-gray-800/80 to-gray-900/80 overflow-visible`}
                    >
                      {/* Parlayan efekt */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl sm:rounded-2xl overflow-hidden"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                      
                      {pack.tag && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg z-10 whitespace-nowrap">
                          {pack.tag}
                        </div>
                      )}
                      
                      <div className="relative flex items-center gap-2 sm:gap-3 mb-3">
                        {/* Icon with gradient background */}
                        <motion.div 
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${pack.iconBg} flex items-center justify-center shadow-lg flex-shrink-0`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <span className="text-2xl sm:text-3xl">{pack.icon}</span>
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-sm sm:text-base mb-0.5 sm:mb-1 truncate">{pack.title}</h3>
                          <p className="text-gray-300 text-[10px] sm:text-xs mb-1 sm:mb-2 line-clamp-1">{pack.desc}</p>
                          <span className="inline-block bg-gray-700/50 text-gray-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                            {pack.type}
                          </span>
                        </div>
                        
                        {/* Price badge - Mobil uyumlu */}
                        <div className="flex flex-col items-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-yellow-500/30 flex-shrink-0">
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <span className="text-yellow-300 font-black text-base sm:text-lg">{pack.price}</span>
                            <motion.span 
                              className="text-lg sm:text-xl"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              💎
                            </motion.span>
                          </div>
                        </div>
                      </div>
                      
                      <motion.button
                        onClick={() => handlePurchase(pack.id)}
                        className={`relative w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-bold shadow-lg overflow-hidden bg-gradient-to-r ${pack.iconBg}`}
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.5 }}
                        />
                        <span className="relative flex items-center justify-center gap-1.5 sm:gap-2">
                          <span className="text-base sm:text-lg">💎</span>
                          <span>{t.buy}</span>
                        </span>
                      </motion.button>
                    </motion.div>
                  ))}
                </>
              )}

              {/* Destek Paketleri - Her biri özel tasarım */}
              {selectedTab === 'support' && supportPacks.map((pack, index) => {
                // Her paket için özel renkler ve icon
                const getPackStyle = () => {
                  switch(pack.id) {
                    case 'coffee':
                      return { gradient: 'from-amber-500 to-orange-600', bg: 'via-amber-900/30', border: 'border-amber-400/40', icon: '☕', textColor: 'text-amber-200' };
                    case 'gold':
                      return { gradient: 'from-yellow-500 to-amber-600', bg: 'via-yellow-900/30', border: 'border-yellow-400/40', icon: '🥇', textColor: 'text-yellow-200' };
                    case 'diamond':
                      return { gradient: 'from-cyan-500 to-blue-600', bg: 'via-cyan-900/30', border: 'border-cyan-400/40', icon: '💎', textColor: 'text-cyan-200' };
                    case 'legend':
                      return { gradient: 'from-purple-500 to-pink-600', bg: 'via-purple-900/30', border: 'border-purple-400/40', icon: '👑', textColor: 'text-purple-200' };
                    default:
                      return { gradient: 'from-pink-500 to-red-600', bg: 'via-pink-900/30', border: 'border-pink-400/40', icon: '❤️', textColor: 'text-pink-200' };
                  }
                };
                const style = getPackStyle();
                
                return (
                  <motion.div
                    key={pack.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    <div className={`relative bg-gradient-to-br from-gray-900 ${style.bg} to-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${style.border} shadow-xl`}>
                      {/* Header with icon and badge */}
                      <div className="text-center mb-3 sm:mb-4">
                        <motion.div
                          className={`inline-flex w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br ${style.gradient} items-center justify-center shadow-xl sm:shadow-2xl mb-2 sm:mb-3`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <span className="text-4xl sm:text-5xl">{style.icon}</span>
                        </motion.div>
                        <p className={`${style.textColor} text-sm sm:text-base font-bold`}>{pack.badge}</p>
                      </div>
                      
                      {/* Benefits */}
                      <div className="bg-black/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4 space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-300">{language === 'tr' ? 'Destek' : 'Support'}</span>
                          <span className="text-white font-bold">{pack.price}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-green-400 pt-1.5 sm:pt-2 border-t border-gray-700">
                          <span>✓</span>
                          <span>{language === 'tr' ? 'Özel rozet kazanırsın' : 'Get special badge'}</span>
                        </div>
                      </div>
                      
                      {/* Button */}
                      <motion.button
                        onClick={() => handlePurchase(pack.id)}
                        className={`relative w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-bold shadow-lg sm:shadow-xl overflow-hidden bg-gradient-to-r ${style.gradient}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          animate={{ x: ['-200%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        <span className="relative">{language === 'tr' ? '❤️ Destek Ol' : '❤️ Support'}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hakkında modal - Kelime Bankası tutorial tasarımına benzer
const AboutModal = ({ isOpen, onClose }) => {
  const [language] = useState(() => localStorage.getItem('language') || 'tr');

  const aboutTranslations = {
    tr: {
      title: "Oyun Hakkında",
      gameName: "KeliNG",
      description: ", İngilizce kelime öğrenmeyi eğlenceli hale getiren interaktif bir oyundur.",
      feature1Title: "2500+ Bölüm & Kelime",
      feature1: "Daireden harfleri birleştirerek kelimeleri bul! Her bölümde yeni kelimeler öğren.",
      feature2Title: "Elmas Kazan",
      feature2: "Bölümleri tamamla, hız bonusu kazan! Jokerler al, Zor Mod'u aç, daha fazla elmas kazan!",
      feature3Title: "Kelime Bankası",
      feature3: "Öğrendiğin tüm kelimeleri kelime bankasında sakla. İstediğin zaman tekrar et ve pekiştir!",
      feature4Title: "Görevler & Ödüller",
      feature4: "Günlük görevleri tamamla, başarımları aç! Her gün giriş yap, bonus elmas kazan!",
      version: "Versiyon",
      rights: "Tüm Hakları Saklıdır",
    },
    en: {
      title: "About the Game",
      gameName: "KeliNG",
      description: " is an interactive game that makes learning English words fun.",
      feature1Title: "2500+ Levels & Words",
      feature1: "Connect letters in the circle to find words! Learn new words in each level.",
      feature2Title: "Earn Diamonds",
      feature2: "Complete levels, earn speed bonus! Buy jokers, activate Hard Mode, earn more diamonds!",
      feature3Title: "Word Bank",
      feature3: "Save all learned words in the word bank. Review and reinforce them anytime!",
      feature4Title: "Quests & Rewards",
      feature4: "Complete daily quests, unlock achievements! Login daily, earn bonus diamonds!",
      version: "Version",
      rights: "All Rights Reserved",
    }
  };

  const t = aboutTranslations[language];

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gradient-to-br from-gray-900/90 via-indigo-950/90 to-purple-900/90 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-1.5 h-8 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">{t.title}</h2>
              </div>
              <motion.button 
                className="text-gray-400 hover:text-white bg-gray-800/70 backdrop-blur-sm rounded-full p-2 transition-all border border-gray-700/30 shadow-lg"
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  onClose();
                }}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(31, 41, 55, 0.9)" }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            <div className="space-y-4 text-white/90">
              <p>
                <span className="font-medium">{t.gameName}</span>{t.description}
              </p>
              
              <motion.div 
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30 shadow-inner mb-3"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🎯</span>
                  <div>
                    <h3 className="font-bold text-purple-300 mb-1">{t.feature1Title}</h3>
                    <p className="text-sm text-white/80">{t.feature1}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30 shadow-inner mb-3"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💎</span>
                  <div>
                    <h3 className="font-bold text-yellow-300 mb-1">{t.feature2Title}</h3>
                    <p className="text-sm text-white/80">{t.feature2}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30 shadow-inner mb-3"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📚</span>
                  <div>
                    <h3 className="font-bold text-indigo-300 mb-1">{t.feature3Title}</h3>
                    <p className="text-sm text-white/80">{t.feature3}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30 shadow-inner mb-3"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🎁</span>
                  <div>
                    <h3 className="font-bold text-pink-300 mb-1">{t.feature4Title}</h3>
                    <p className="text-sm text-white/80">{t.feature4}</p>
                  </div>
                </div>
              </motion.div>
              
              <div className="pt-4 text-center">
                <div className="inline-block bg-gray-800/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-purple-500/20 shadow-inner">
                  <span className="text-purple-400 font-medium">{t.version} 1.0.0</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-300">{t.rights}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Animasyonlu ayarlar ikonu
const SettingsIcon = () => (
  <div className="w-6 h-6 text-purple-300">
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M10.325 4.317C10.751 2.561 13.249 2.561 13.675 4.317C13.7389 4.5808 13.8642 4.82578 14.0407 5.032C14.2172 5.23822 14.4399 5.39985 14.6907 5.50375C14.9414 5.60764 15.2132 5.65085 15.4838 5.62987C15.7544 5.60889 16.0162 5.5243 16.248 5.383C17.791 4.443 19.558 6.209 18.618 7.753C18.4769 7.98466 18.3924 8.24634 18.3715 8.51677C18.3506 8.78721 18.3938 9.05877 18.4975 9.30938C18.6013 9.55999 18.7627 9.78258 18.9687 9.95905C19.1747 10.1355 19.4194 10.2609 19.683 10.325C21.439 10.751 21.439 13.249 19.683 13.675C19.4192 13.7389 19.1742 13.8642 18.968 14.0407C18.7618 14.2172 18.6001 14.4399 18.4963 14.6907C18.3924 14.9414 18.3491 15.2132 18.3701 15.4838C18.3911 15.7544 18.4757 16.0162 18.617 16.248C19.557 17.791 17.791 19.558 16.247 18.618C16.0153 18.4769 15.7537 18.3924 15.4832 18.3715C15.2128 18.3506 14.9412 18.3938 14.6906 18.4975C14.44 18.6013 14.2174 18.7627 14.0409 18.9687C13.8645 19.1747 13.7391 19.4194 13.675 19.683C13.249 21.439 10.751 21.439 10.325 19.683C10.2611 19.4192 10.1358 19.1742 9.95929 18.968C9.7828 18.7618 9.56011 18.6001 9.30935 18.4963C9.05859 18.3924 8.78683 18.3491 8.51621 18.3701C8.24559 18.3911 7.98375 18.4757 7.752 18.617C6.209 19.557 4.442 17.791 5.382 16.247C5.5231 16.0153 5.60755 15.7537 5.62848 15.4832C5.64942 15.2128 5.60624 14.9412 5.50247 14.6906C5.3987 14.44 5.23726 14.2174 5.03127 14.0409C4.82529 13.8645 4.58056 13.7391 4.317 13.675C2.561 13.249 2.561 10.751 4.317 10.325C4.5808 10.2611 4.82578 10.1358 5.032 9.95929C5.23822 9.7828 5.39985 9.56011 5.50375 9.30935C5.60764 9.05859 5.65085 8.78683 5.62987 8.51621C5.60889 8.24559 5.5243 7.98375 5.383 7.752C4.443 6.209 6.209 4.442 7.753 5.382C8.753 5.99 10.049 5.452 10.325 4.317Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

// Yardım ikonu
const HelpIcon = () => (
  <div className="w-6 h-6 text-purple-300">
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  </div>
);

const PhoneMenuPage = ({ onLevelsClick, lastPlayedLevel, onContinueLastLevel, onWordBankClick, onShowTutorial, onWordReviewClick, completedLevels, diamonds, setDiamonds }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDailyQuests, setShowDailyQuests] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'tr';
  });
  
  // Layout modu için state - 'grid' veya 'list'
  const [layoutMode, setLayoutMode] = useState(() => {
    return localStorage.getItem('menuLayoutMode') || 'grid';
  });
  
  // Hamburger menü için state
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Swipe gesture için state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Geçiş animasyonu için state'ler
  const [showTransition, setShowTransition] = useState(false);
  const [transitionLevel, setTransitionLevel] = useState(null);
  
  // Elmas animasyonu için state
  const [diamondAnimation, setDiamondAnimation] = useState(false);
  const [animatedReward, setAnimatedReward] = useState(0);
  
  // Başarımlar için state
  const [claimedAchievements, setClaimedAchievements] = useState(() => {
    const saved = localStorage.getItem('claimedAchievements');
    return saved ? JSON.parse(saved) : [];
  });

  // Günlük giriş ödülü için state
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardAnimation, setDailyRewardAnimation] = useState(false);
  const [dailyRewardAmount, setDailyRewardAmount] = useState(0);
  const [dailyRewardData, setDailyRewardData] = useState(() => {
    const saved = localStorage.getItem('dailyRewardData');
    return saved ? JSON.parse(saved) : {
      currentDay: 0,
      lastClaimTime: null,
      weekCompleted: false
    };
  });

  // Görevler sekmesi için state
  const [questTab, setQuestTab] = useState('levels'); // 'levels', 'collections' veya 'repeats'

  // Geri sayım sayacı için state
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Günlük tekrar görevleri için state
  const [claimedDailyRepeats, setClaimedDailyRepeats] = useState(() => {
    const saved = localStorage.getItem('claimedDailyRepeats');
    if (saved) {
      const data = JSON.parse(saved);
      // Eğer farklı bir günse sıfırla
      if (data.date !== getTodayDate()) {
        return { date: getTodayDate(), claimed: [] };
      }
      return data;
    }
    return { date: getTodayDate(), claimed: [] };
  });

  // Tamamlanan bölüm sayısı
  const completedLevelsCount = completedLevels ? completedLevels.size : 0;

  // Tamamlanan koleksiyon sayısını hesapla
  const getCompletedCollectionsCount = () => {
    const boxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
    let count = 0;
    Object.values(boxProgress).forEach(progress => {
      if (progress.completionHistory && progress.completionHistory.length > 0) {
        count++;
      }
    });
    return count;
  };
  const completedCollectionsCount = getCompletedCollectionsCount();

  // Bölüm başarımlarını kontrol et
  const availableLevelAchievements = checkLevelAchievements(completedLevelsCount, claimedAchievements);
  const inProgressLevelAchievements = getInProgressLevelAchievements(completedLevelsCount, claimedAchievements);
  const claimedLevelAchievementsList = getClaimedLevelAchievements(claimedAchievements);

  // Koleksiyon başarımlarını kontrol et
  const availableCollectionAchievements = checkCollectionAchievements(completedCollectionsCount, claimedAchievements);
  const inProgressCollectionAchievements = getInProgressCollectionAchievements(completedCollectionsCount, claimedAchievements);
  const claimedCollectionAchievementsList = getClaimedCollectionAchievements(claimedAchievements);

  // Önerilen koleksiyonları hesapla - modal açıldığında güncellenir
  const [boxProgress, setBoxProgress] = useState(() => 
    JSON.parse(localStorage.getItem('wordBoxProgress') || '{}')
  );
  
  // Günlük tekrar sayısını state olarak tut
  const [todayRepeatCount, setTodayRepeatCount] = useState(() => getTodayRepeatCount());
  
  // Günlük önerilen koleksiyonları sabitle (gün boyunca değişmez)
  const [dailySuggestedCollections, setDailySuggestedCollections] = useState(() => {
    const saved = localStorage.getItem('dailySuggestedCollections');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === getTodayDate()) {
        return data.collections;
      }
    }
    // Yeni gün - yeni öneriler hesapla
    const currentBoxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
    const allBoxes = Array.from({ length: 173 }, (_, i) => ({ id: `box-${i}`, number: i + 1 }));
    const suggested = getSuggestedCollections(currentBoxProgress, allBoxes);
    // Kaydet
    localStorage.setItem('dailySuggestedCollections', JSON.stringify({
      date: getTodayDate(),
      collections: suggested
    }));
    return suggested;
  });
  
  // Modal açıldığında verileri güncelle
  useEffect(() => {
    if (showDailyQuests) {
      setBoxProgress(JSON.parse(localStorage.getItem('wordBoxProgress') || '{}'));
      setTodayRepeatCount(getTodayRepeatCount());
      
      // Önerilen koleksiyonlar boşsa yeniden hesapla
      if (dailySuggestedCollections.length === 0) {
        const currentBoxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
        const allBoxes = Array.from({ length: 173 }, (_, i) => ({ id: `box-${i}`, number: i + 1 }));
        const suggested = getSuggestedCollections(currentBoxProgress, allBoxes);
        if (suggested.length > 0) {
          setDailySuggestedCollections(suggested);
          localStorage.setItem('dailySuggestedCollections', JSON.stringify({
            date: getTodayDate(),
            collections: suggested
          }));
        }
      }
    }
  }, [showDailyQuests]);

  // Geri sayım sayacı - gece yarısına kalan süre
  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // İlk hesaplama
    setTimeUntilReset(calculateTimeUntilMidnight());

    // Her saniye güncelle (sadece modal açıkken)
    let interval;
    if (showDailyQuests) {
      interval = setInterval(() => {
        setTimeUntilReset(calculateTimeUntilMidnight());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showDailyQuests]);

  // Günlük tekrar görevlerini kontrol et
  const dailyRepeatQuestsStatus = checkDailyRepeatQuests(claimedDailyRepeats.claimed);
  const claimableDailyRepeats = dailyRepeatQuestsStatus.filter(q => q.canClaim).length;

  // Bugün önerilen koleksiyon tamamlandı mı kontrol et
  const [claimedSuggested, setClaimedSuggested] = useState(() => {
    const saved = localStorage.getItem('claimedSuggestedCollections');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date !== getTodayDate()) {
        return { date: getTodayDate(), claimed: [] };
      }
      return data;
    }
    return { date: getTodayDate(), claimed: [] };
  });

  // Alınabilir başarım sayısı (badge için) - tüm kategorilerden toplam
  const claimableCount = availableLevelAchievements.length + availableCollectionAchievements.length + claimableDailyRepeats;

  // Başarım ödülünü al
  const claimAchievement = (achievementId, reward) => {
    // Elmas yağmuru animasyonunu başlat
    setAnimatedReward(reward);
    setDiamondAnimation(true);
    
    // Elmas ekle
    setDiamonds(prev => prev + reward);
    
    // Başarımı claimed olarak işaretle
    const newClaimed = [...claimedAchievements, achievementId];
    setClaimedAchievements(newClaimed);
    localStorage.setItem('claimedAchievements', JSON.stringify(newClaimed));
    
    // Ödül kazanma sesi
    playSound('ödül-kazanma-sesi.mp3');
    
    // Animasyonu 5 saniye sonra kapat (son elmas düşene kadar bekle)
    setTimeout(() => {
      setDiamondAnimation(false);
    }, 5000);
  };

  // Günlük tekrar görevi ödülünü al
  const claimDailyRepeat = (questId, reward) => {
    setAnimatedReward(reward);
    setDiamondAnimation(true);
    setDiamonds(prev => prev + reward);
    
    const newClaimedDailyRepeats = {
      date: getTodayDate(),
      claimed: [...claimedDailyRepeats.claimed, questId]
    };
    setClaimedDailyRepeats(newClaimedDailyRepeats);
    localStorage.setItem('claimedDailyRepeats', JSON.stringify(newClaimedDailyRepeats));
    
    playSound('ödül-kazanma-sesi.mp3');
    
    setTimeout(() => {
      setDiamondAnimation(false);
    }, 5000);
  };

  // Önerilen koleksiyon bonusunu al
  const claimSuggestedBonus = (boxId) => {
    setAnimatedReward(2);
    setDiamondAnimation(true);
    setDiamonds(prev => prev + 2);
    
    const newClaimedSuggested = {
      date: getTodayDate(),
      claimed: [...claimedSuggested.claimed, boxId]
    };
    setClaimedSuggested(newClaimedSuggested);
    localStorage.setItem('claimedSuggestedCollections', JSON.stringify(newClaimedSuggested));
    
    playSound('ödül-kazanma-sesi.mp3');
    
    setTimeout(() => {
      setDiamondAnimation(false);
    }, 5000);
  };

  // Günlük ödül sistemi
  const dailyRewards = [3, 4, 4, 5, 5, 6, 3]; // 7 günlük ödüller (toplam 30)

  const checkDailyReward = () => {
    const now = new Date().getTime();
    const { lastClaimTime, currentDay } = dailyRewardData;

    // İlk giriş veya 24 saat geçmiş
    if (!lastClaimTime || now - lastClaimTime >= 24 * 60 * 60 * 1000) {
      setShowDailyReward(true);
    }
  };

  const claimDailyReward = () => {
    const now = new Date().getTime();
    const { currentDay, lastClaimTime } = dailyRewardData;

    // Ardışık gün kontrolü (48 saatten fazla geçmişse sıfırla)
    let newDay = currentDay;
    if (lastClaimTime && now - lastClaimTime > 48 * 60 * 60 * 1000) {
      newDay = 0; // Sıfırla
    }

    const reward = dailyRewards[newDay];
    const nextDay = (newDay + 1) % 7; // 7. günden sonra sıfırla

    // Önce modalı kapat
    setShowDailyReward(false);

    // Kısa bir gecikme sonra özel elmas animasyonu başlat
    setTimeout(() => {
      // Ödülü ver
      setDiamonds(prev => prev + reward);
      
      // Günlük ödül özel animasyonu
      setDailyRewardAmount(reward);
      setDailyRewardAnimation(true);
      playSound('ödül-kazanma-sesi.mp3');
      
      setTimeout(() => {
        setDailyRewardAnimation(false);
      }, 4000);
    }, 300);

    // Veriyi kaydet
    const newData = {
      currentDay: nextDay,
      lastClaimTime: now,
      weekCompleted: nextDay === 0
    };
    setDailyRewardData(newData);
    localStorage.setItem('dailyRewardData', JSON.stringify(newData));
  };

  // Sayfa yüklendiğinde günlük ödülü kontrol et
  useEffect(() => {
    checkDailyReward();
  }, []);

  // Swipe gesture handlers - Daha hassas
  const minSwipeDistance = 30; // 50'den 30'a düşürdük

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Soldan sağa swipe - menüyü aç (daha geniş alan)
    if (isRightSwipe && touchStart < 80) { // 50'den 80'e çıkardık
      playSound('telefontıklama.mp3');
      setShowSidebar(true);
    }
    
    // Sağdan sola swipe - menüyü kapat
    if (isLeftSwipe && showSidebar) {
      playSound('telefontıklama.mp3');
      setShowSidebar(false);
    }
  };

  // Body scroll'u engelle
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(localStorage.getItem('language') || 'tr');
    };
    
    window.addEventListener('storage', handleLanguageChange);
    const interval = setInterval(handleLanguageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
      clearInterval(interval);
    };
  }, []);

  const translations = {
    tr: {
      title: "KeliNG",
      lastPlayed: "Son Kaldığın Yer",
      level: "Bölüm",
      continue: "Devam Et",
      levels: "Bölümler",
      wordBank: "Kelime Bankası",
      wordReview: "Kelime Tekrarı",
      dailyQuests: "Görevler",
      howToPlay: "Nasıl Oynanır?",
      settings: "Ayarlar",
      about: "Hakkında",
      help: "Yardım",
      clickForDetails: "Detay için tıklayın",
      completeLevels: "Bölüm Tamamla",
      reviewWords: "Kelime Tekrar Et",
      questsCompleted: "görev tamamlandı",
      claimReward: "Ödülü Al",
      claimed: "Alındı",
      dailyRewardTitle: "Günlük Giriş Ödülü",
      dailyRewardSubtitle: "Her gün giriş yap, ödül kazan!",
      day: "Gün",
      claimDailyReward: "Ödülü Al",
      comeBackTomorrow: "Yarın Tekrar Gel",
      streakBonus: "Ardışık Gün Bonusu",
      weekCompleted: "Hafta Tamamlandı!",
      newWeekStarts: "Yeni hafta başlıyor",
    },
    en: {
      title: "KeliNG",
      lastPlayed: "Last Played",
      level: "Level",
      continue: "Continue",
      levels: "Levels",
      wordBank: "Word Bank",
      wordReview: "Word Review",
      dailyQuests: "Quests",
      howToPlay: "How to Play?",
      settings: "Settings",
      about: "About",
      help: "Help",
      clickForDetails: "Click for details",
      completeLevels: "Complete Levels",
      reviewWords: "Review Words",
      questsCompleted: "quests completed",
      claimReward: "Claim Reward",
      claimed: "Claimed",
      dailyRewardTitle: "Daily Login Reward",
      dailyRewardSubtitle: "Login every day, earn rewards!",
      day: "Day",
      claimDailyReward: "Claim Reward",
      comeBackTomorrow: "Come Back Tomorrow",
      streakBonus: "Streak Bonus",
      weekCompleted: "Week Completed!",
      newWeekStarts: "New week starts",
    }
  };

  const t = translations[language];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  return (
    <div 
      className="h-screen w-full flex flex-col items-center bg-gradient-to-b from-neutral-900 via-indigo-950/20 to-black overflow-hidden relative select-none"
      style={{
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none'
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Bar - Sabit Üst Çubuk */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-neutral-900/95 via-indigo-950/95 to-neutral-900/95 backdrop-blur-xl border-b border-purple-500/20 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          {/* Sol - Hamburger Menü */}
          <motion.button
            onClick={() => {
              playSound('telefontıklama.mp3');
              setShowSidebar(true);
            }}
            className="p-2 bg-purple-600/20 rounded-lg hover:bg-purple-600/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
          
          {/* Orta - Logo (Tam Ortalanmış) */}
          <div className="flex-1 flex justify-center">
            <motion.h1 
              className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ 
                backgroundSize: '200% auto',
                filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.6))',
              }}
            >
              KeliNG
            </motion.h1>
          </div>
          
          {/* Sağ - Elmas Bakiyesi + Layout Butonu */}
          <div className="flex items-center gap-1.5">
            {/* Elmas Bakiyesi - Modern Tasarım */}
            <motion.div
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-indigo-600/20 rounded-full border border-cyan-400/30 overflow-hidden"
              whileHover={{ scale: 1.05 }}
            >
              {/* Parlayan Arka Plan Efekti */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              
              {/* Elmas İkonu */}
              <motion.div
                className="relative w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center"
                animate={{ 
                  boxShadow: [
                    '0 0 10px rgba(34, 211, 238, 0.5)',
                    '0 0 20px rgba(34, 211, 238, 0.8)',
                    '0 0 10px rgba(34, 211, 238, 0.5)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  className="text-sm"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  💎
                </motion.span>
              </motion.div>
              
              {/* Sayı */}
              <span className="relative text-cyan-100 font-black text-sm tracking-tight">{Math.floor(diamonds)}</span>
            </motion.div>
            
            {/* Layout Değiştirme Butonu - Kompakt */}
            <motion.button
              onClick={() => {
                playSound('telefontıklama.mp3');
                const newMode = layoutMode === 'grid' ? 'list' : 'grid';
                setLayoutMode(newMode);
                localStorage.setItem('menuLayoutMode', newMode);
              }}
              className="w-9 h-9 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-full border border-pink-500/30 flex items-center justify-center hover:from-pink-600/30 hover:to-purple-600/30 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: layoutMode === 'grid' ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {layoutMode === 'grid' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Sidebar - Hamburger Menü */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowSidebar(false)}
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-gray-900/98 via-indigo-950/98 to-purple-900/98 backdrop-blur-xl border-r border-purple-500/30 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {language === 'tr' ? 'Menü' : 'Menu'}
                  </h2>
                  <motion.button
                    onClick={() => {
                      playSound('telefontıklama.mp3');
                      setShowSidebar(false);
                    }}
                    className="p-2 bg-gray-800/70 rounded-lg hover:bg-gray-700/70 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
                
                {/* Elmas Bakiyesi - Premium */}
                <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-indigo-500/30 rounded-2xl p-5 border-2 border-cyan-400/40 backdrop-blur-sm">
                  {/* Parlayan Arka Plan Efekti */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  {/* Dekoratif Köşe Süsleri */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-bl-full"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-tr-full"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
                        <p className="text-cyan-100 text-xs font-bold uppercase tracking-wider">{language === 'tr' ? 'Elmas Bakiyesi' : 'Diamond Balance'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"
                          animate={{ 
                            boxShadow: [
                              '0 0 15px rgba(34, 211, 238, 0.5)',
                              '0 0 25px rgba(34, 211, 238, 0.8)',
                              '0 0 15px rgba(34, 211, 238, 0.5)',
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <motion.span
                            className="text-2xl"
                            animate={{ 
                              rotate: [0, 10, -10, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            💎
                          </motion.span>
                        </motion.div>
                        <p className="text-cyan-50 text-4xl font-black tracking-tight">{Math.floor(diamonds)}</p>
                      </div>
                    </div>
                    
                    {/* Büyük Dekoratif Elmas */}
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-7xl opacity-20"
                    >
                      💎
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Sidebar Menu Items */}
              <div className="p-4 space-y-3">
                {/* Market */}
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowSidebar(false);
                    setShowMarket(true);
                  }}
                  className="w-full relative overflow-hidden"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-yellow-500/30 via-amber-500/20 to-orange-500/30 rounded-xl border border-yellow-400/40 hover:border-yellow-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🛒</span>
                    </div>
                    <div className="relative flex-1 text-left">
                      <h3 className="text-white font-bold text-lg">{language === 'tr' ? 'Market' : 'Store'}</h3>
                      <p className="text-yellow-100/80 text-xs font-medium">{language === 'tr' ? 'Elmas satın al' : 'Buy diamonds'}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-5 w-5 text-yellow-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
                
                {/* Görevler */}
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowSidebar(false);
                    setShowDailyQuests(true);
                  }}
                  className="w-full relative overflow-hidden"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-xl border border-emerald-400/40 hover:border-emerald-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🎁</span>
                    </div>
                    <div className="relative flex-1 text-left">
                      <h3 className="text-white font-bold text-lg">{language === 'tr' ? 'Görevler' : 'Quests'}</h3>
                      <p className="text-emerald-100/80 text-xs font-medium">{language === 'tr' ? 'Ödüller kazan' : 'Earn rewards'}</p>
                    </div>
                    {claimableCount > 0 && (
                      <motion.div
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {claimableCount}
                      </motion.div>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-5 w-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
                
                {/* Ayarlar */}
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowSidebar(false);
                    setShowSettings(true);
                  }}
                  className="w-full relative overflow-hidden"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-purple-500/30 via-indigo-500/20 to-blue-500/30 rounded-xl border border-purple-400/40 hover:border-purple-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg">
                      <span className="text-3xl">⚙️</span>
                    </div>
                    <div className="relative flex-1 text-left">
                      <h3 className="text-white font-bold text-lg">{language === 'tr' ? 'Ayarlar' : 'Settings'}</h3>
                      <p className="text-purple-100/80 text-xs font-medium">{language === 'tr' ? 'Uygulama ayarları' : 'App settings'}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-5 w-5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
                
                {/* Hakkında */}
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowSidebar(false);
                    setShowAbout(true);
                  }}
                  className="w-full relative overflow-hidden"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-slate-500/30 via-gray-500/20 to-zinc-500/30 rounded-xl border border-slate-400/40 hover:border-slate-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-lg">
                      <span className="text-3xl">ℹ️</span>
                    </div>
                    <div className="relative flex-1 text-left">
                      <h3 className="text-white font-bold text-lg">{language === 'tr' ? 'Hakkında' : 'About'}</h3>
                      <p className="text-slate-100/80 text-xs font-medium">{language === 'tr' ? 'Uygulama bilgisi' : 'App info'}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-5 w-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ana İçerik - Top Bar için padding */}
      <div className="w-full h-full flex flex-col items-center pt-20 pb-4 px-4 sm:px-6 lg:px-8 overflow-hidden">
      


      {/* Günlük Ödül Özel Animasyonu */}
      <AnimatePresence>
        {dailyRewardAnimation && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {/* Patlama Efekti - Merkezden Dışarı */}
            {[...Array(dailyRewardAmount * 8)].map((_, i) => {
              const angle = (360 / (dailyRewardAmount * 8)) * i;
              const distance = 150 + Math.random() * 200;
              const endX = Math.cos(angle * Math.PI / 180) * distance;
              const endY = Math.sin(angle * Math.PI / 180) * distance;
              
              return (
                <motion.div
                  key={i}
                  className="absolute text-3xl"
                  style={{
                    left: '50%',
                    top: '40%',
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 0,
                    rotate: 0
                  }}
                  animate={{
                    x: [0, endX, endX],
                    y: [0, endY, endY + 300],
                    opacity: [1, 1, 0],
                    scale: [0, 1.5, 0.5],
                    rotate: [0, 360, 720]
                  }}
                  transition={{
                    duration: 3.5,
                    delay: i * 0.02,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  💎
                </motion.div>
              );
            })}
            
            {/* Büyük Ödül Gösterimi - Yeni Tasarım */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1, 1, 0], 
                opacity: [0, 1, 1, 1, 0]
              }}
              transition={{ 
                duration: 4, 
                times: [0, 0.3, 0.4, 0.85, 1]
              }}
            >
              <div className="relative">
                {/* Glow Ring */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: 3
                  }}
                  className="absolute inset-0 bg-yellow-500/50 rounded-full blur-3xl"
                />
                
                {/* Ana Kart */}
                <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 rounded-full w-48 h-48 flex flex-col items-center justify-center border-4 border-yellow-300 shadow-2xl">
                  <motion.div
                    animate={{ 
                      y: [-5, 5, -5]
                    }}
                    transition={{ 
                      duration: 0.8,
                      repeat: 4
                    }}
                    className="text-center"
                  >
                    <div className="text-yellow-200 text-xl font-bold mb-2">+{dailyRewardAmount}</div>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, 15, -15, 0]
                      }}
                      transition={{ 
                        duration: 0.6,
                        repeat: 5
                      }}
                      className="text-8xl"
                    >
                      💎
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Görevler Elmas Yağmuru */}
      <AnimatePresence>
        {diamondAnimation && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(25)].map((_, i) => {
              const randomX = 10 + Math.random() * 80;
              return (
                <motion.div
                  key={i}
                  className="absolute text-3xl"
                  initial={{
                    x: `${randomX}%`,
                    y: -50,
                    opacity: 1,
                    rotate: 0
                  }}
                  animate={{
                    y: ['0vh', '100vh'],
                    rotate: [0, 360],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 2.5,
                    delay: i * 0.1,
                    ease: "easeIn"
                  }}
                >
                  💎
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Son oynanan bölüm - Özel Büyük Kart */}
      <AnimatePresence>
        {lastPlayedLevel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md mb-6"
          >
            <div className="relative bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-2xl p-5 border-2 border-emerald-400/40 shadow-2xl backdrop-blur-sm overflow-hidden">
              {/* Parlayan Arka Plan Efekti */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Dekoratif Köşe Süsleri */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-teal-400/20 to-transparent rounded-tr-full"></div>
              
              {/* Ana İçerik */}
              <div className="relative">
                {/* Üst Kısım - Başlık */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
                  <span className="text-emerald-200 text-xs font-medium">{t.lastPlayed}</span>
                </div>
                
                {/* Orta Kısım - Bölüm Bilgisi */}
                <div className="flex items-center gap-3 mb-3">
                  <motion.div 
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg"
                    animate={{ 
                      y: [0, -6, 0],
                      rotate: [0, -5, 5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <motion.span 
                      className="text-3xl"
                      animate={{ 
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🏆
                    </motion.span>
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-emerald-100/70 text-xs font-medium mb-1">{t.level}</p>
                    <h3 className="text-4xl font-black text-white leading-none">
                      {lastPlayedLevel.id}
                    </h3>
                  </div>
                </div>
                
                {/* Alt Kısım - Devam Butonu */}
                <motion.button
                  onClick={() => {
                    playSound('hızlı geçiş.mp3');
                    setTransitionLevel(lastPlayedLevel);
                    setShowTransition(true);
                    setTimeout(() => {
                      setShowTransition(false);
                      setTransitionLevel(null);
                      onContinueLastLevel(lastPlayedLevel);
                    }, 3100);
                  }}
                  className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl text-white text-sm font-bold border border-white/20 flex items-center justify-center gap-2"
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: "rgba(255, 255, 255, 0.15)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{t.continue}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Menü kartları */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`w-full max-w-md mb-24 ${
          layoutMode === 'grid' 
            ? 'grid grid-cols-2 gap-3' 
            : 'grid grid-cols-1 gap-4'
        }`}
        key={layoutMode}
      >
        <GameCard
          onClick={() => {
            playSound('telefontıklama');
            onLevelsClick();
          }}
          title={t.levels}
          emoji="🎮"
          delay={0}
          detailText={t.clickForDetails}
          layoutMode={layoutMode}
        />
        
        <GameCard
          onClick={() => {
            playSound('telefontıklama');
            onWordReviewClick && onWordReviewClick();
          }}
          title={t.wordReview}
          emoji="🔁"
          delay={1}
          detailText={t.clickForDetails}
          layoutMode={layoutMode}
        />
        
        <GameCard
          onClick={() => {
            playSound('telefontıklama');
            onWordBankClick();
          }}
          title={t.wordBank}
          emoji="💼"
          delay={2}
          detailText={t.clickForDetails}
          layoutMode={layoutMode}
        />
        
        {/* Nasıl Oynanır butonu */}
        <GameCard
          onClick={() => {
            playSound('telefontıklama');
            onShowTutorial && onShowTutorial();
          }}
          title={t.howToPlay}
          emoji="💡"
          delay={3}
          detailText={t.clickForDetails}
          layoutMode={layoutMode}
        />
      </motion.div>
      
      {/* Ayarlar Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} onShowTutorial={onShowTutorial} />
      
      {/* Market Modal */}
      <MarketModal isOpen={showMarket} onClose={() => setShowMarket(false)} />
      
      {/* Hakkında Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      
      {/* Günlük Görevler Modal - Mobil Uyumlu */}
      <AnimatePresence>
        {showDailyQuests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowDailyQuests(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-gradient-to-br from-gray-900/95 via-amber-950/95 to-orange-900/95 rounded-3xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full border-2 border-amber-500/30 shadow-2xl backdrop-blur-sm max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Elmas Yağmuru Animasyonu */}
              <AnimatePresence>
                {diamondAnimation && (
                  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                    {/* Elmaslar - Yukarıdan aşağıya yağıyor */}
                    {[...Array(25)].map((_, i) => {
                      const randomX = 10 + Math.random() * 80;
                      return (
                        <motion.div
                          key={i}
                          className="absolute text-3xl"
                          initial={{
                            x: `${randomX}%`,
                            y: -50,
                            opacity: 1,
                            rotate: 0,
                            scale: 0.8
                          }}
                          animate={{
                            y: ['0vh', '90vh', '95vh'],
                            rotate: [0, 360, 360],
                            scale: [0.8, 1.2, 0.8, 0.3],
                            opacity: [1, 1, 0.8, 0]
                          }}
                          transition={{
                            duration: 2.5,
                            delay: i * 0.1,
                            ease: [0.4, 0, 0.6, 1],
                            times: [0, 0.85, 1]
                          }}
                        >
                          💎
                        </motion.div>
                      );
                    })}
                    
                    {/* Ödül Gösterimi - Şeffaf & Minimal */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.1, 1, 1, 0], 
                        opacity: [0, 1, 1, 1, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        times: [0, 0.2, 0.3, 0.85, 1],
                        ease: 'easeInOut'
                      }}
                    >
                      {/* Şeffaf Arka Plan */}
                      <div className="relative backdrop-blur-md bg-black/20 rounded-3xl px-16 py-10 border border-white/10 shadow-2xl">
                        {/* Yumuşak Glow */}
                        <motion.div
                          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20"
                          animate={{
                            opacity: [0.3, 0.5, 0.3]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        />
                        
                        {/* İçerik */}
                        <div className="relative flex flex-col items-center gap-4">
                          {/* Elmas */}
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          >
                            <span className="text-7xl drop-shadow-2xl">💎</span>
                          </motion.div>
                          
                          {/* Ödül Sayısı */}
                          <motion.div
                            animate={{
                              scale: [1, 1.05, 1]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          >
                            <span className="text-6xl font-black text-white drop-shadow-2xl">
                              +{animatedReward}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
              {/* Başlık - Mobil için kompakt */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <span className="text-2xl sm:text-3xl mr-2">🎯</span>
                  <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">{t.dailyQuests}</h2>
                </div>
                <motion.button 
                  className="text-gray-400 hover:text-white bg-gray-800/70 backdrop-blur-sm rounded-full p-1.5 sm:p-2 transition-all border border-gray-700/30 shadow-lg"
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowDailyQuests(false);
                  }}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(31, 41, 55, 0.9)" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>



              {/* Sekme Butonları */}
              <div className="flex gap-1.5 mb-4">
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setQuestTab('levels');
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                    questTab === 'levels'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🎯</span>
                  <span>{language === 'tr' ? 'Bölümler' : 'Levels'}</span>
                  {availableLevelAchievements.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-full">{availableLevelAchievements.length}</span>
                  )}
                </motion.button>
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setQuestTab('collections');
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                    questTab === 'collections'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>📚</span>
                  <span>{language === 'tr' ? 'Koleksiyonlar' : 'Collections'}</span>
                  {availableCollectionAchievements.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-full">{availableCollectionAchievements.length}</span>
                  )}
                </motion.button>
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setQuestTab('repeats');
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                    questTab === 'repeats'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🔁</span>
                  <span>{language === 'tr' ? 'Tekrarlar' : 'Repeats'}</span>
                  {claimableDailyRepeats > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-full">{claimableDailyRepeats}</span>
                  )}
                </motion.button>
              </div>

              {/* Başarımlar - Scroll edilebilir, Mobil Uyumlu */}
              <div 
                className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-4 sm:mb-6 px-1" 
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <style>{`
                  .flex-1.overflow-y-auto::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {/* Bölüm Görevleri */}
                {questTab === 'levels' && (
                  <>
                    {/* Alınabilir Bölüm Başarımları */}
                    {availableLevelAchievements.map((achievement, index) => (
                      <motion.div 
                        key={achievement.id}
                        className="bg-green-900/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-green-500/30 shadow-inner"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="text-2xl sm:text-3xl">{achievement.icon}</div>
                            <div>
                              <h3 className="text-white font-bold text-base sm:text-lg">{achievement.title[language]}</h3>
                              <p className="text-green-300 text-xs sm:text-sm">{completedLevelsCount}/{achievement.target} ✅</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-green-900/40 px-2 sm:px-3 py-1 rounded-full">
                            <span className="text-green-400 font-bold text-xs sm:text-sm">+{achievement.reward}</span>
                            <span className="text-lg sm:text-xl">💎</span>
                          </div>
                        </div>
                        <div className="w-full h-2 sm:h-3 bg-gray-700 rounded-full overflow-hidden mb-2 sm:mb-3">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                          />
                        </div>
                        <motion.button 
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            claimAchievement(achievement.id, achievement.reward);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white text-xs sm:text-sm font-bold shadow-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          🎁 {t.claimReward}
                        </motion.button>
                      </motion.div>
                    ))}

                    {/* Devam Eden Bölüm Başarımları */}
                    {inProgressLevelAchievements.map((achievement, index) => {
                      const progress = (completedLevelsCount / achievement.target) * 100;
                      return (
                        <motion.div 
                          key={achievement.id}
                          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-amber-500/20 shadow-inner"
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: (availableLevelAchievements.length + index) * 0.1 }}
                        >
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="text-2xl sm:text-3xl">{achievement.icon}</div>
                              <div>
                                <h3 className="text-white font-bold text-base sm:text-lg">{achievement.title[language]}</h3>
                                <p className="text-gray-400 text-xs sm:text-sm">{completedLevelsCount}/{achievement.target}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-900/40 px-2 sm:px-3 py-1 rounded-full">
                              <span className="text-amber-400 font-bold text-xs sm:text-sm">+{achievement.reward}</span>
                              <span className="text-lg sm:text-xl">💎</span>
                            </div>
                          </div>
                          <div className="w-full h-2 sm:h-3 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5, delay: (availableLevelAchievements.length + index) * 0.1 + 0.2 }}
                            />
                          </div>
                          <div className="mt-2 sm:mt-3 w-full py-1.5 sm:py-2 bg-gray-700/50 rounded-lg text-gray-400 text-xs sm:text-sm font-medium text-center">
                            {Math.round(progress)}% {language === 'tr' ? 'Tamamlandı' : 'Completed'}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Tamamlanmış Bölüm Başarımları */}
                    {claimedLevelAchievementsList.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h3 className="text-gray-400 text-sm font-bold mb-3">✅ {language === 'tr' ? 'Tamamlanan Görevler' : 'Completed Quests'} ({claimedLevelAchievementsList.length})</h3>
                        {claimedLevelAchievementsList.slice(0, 3).map((achievement) => (
                          <div key={achievement.id} className="bg-gray-800/30 rounded-lg p-3 mb-2 border border-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{achievement.icon}</span>
                                <span className="text-gray-400 text-sm">{achievement.title[language]}</span>
                              </div>
                              <span className="text-green-400 text-xs">✅ {language === 'tr' ? 'Alındı' : 'Claimed'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Koleksiyon Görevleri */}
                {questTab === 'collections' && (
                  <>
                    {/* Alınabilir Koleksiyon Başarımları */}
                    {availableCollectionAchievements.map((achievement, index) => (
                      <motion.div 
                        key={achievement.id}
                        className="bg-green-900/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-green-500/30 shadow-inner"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="text-2xl sm:text-3xl">{achievement.icon}</div>
                            <div>
                              <h3 className="text-white font-bold text-base sm:text-lg">{achievement.title[language]}</h3>
                              <p className="text-green-300 text-xs sm:text-sm">{completedCollectionsCount}/{achievement.target} ✅</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-green-900/40 px-2 sm:px-3 py-1 rounded-full">
                            <span className="text-green-400 font-bold text-xs sm:text-sm">+{achievement.reward}</span>
                            <span className="text-lg sm:text-xl">💎</span>
                          </div>
                        </div>
                        <div className="w-full h-2 sm:h-3 bg-gray-700 rounded-full overflow-hidden mb-2 sm:mb-3">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                          />
                        </div>
                        <motion.button 
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            claimAchievement(achievement.id, achievement.reward);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white text-xs sm:text-sm font-bold shadow-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          🎁 {t.claimReward}
                        </motion.button>
                      </motion.div>
                    ))}

                    {/* Devam Eden Koleksiyon Başarımları */}
                    {inProgressCollectionAchievements.map((achievement, index) => {
                      const progress = (completedCollectionsCount / achievement.target) * 100;
                      return (
                        <motion.div 
                          key={achievement.id}
                          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-500/20 shadow-inner"
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: (availableCollectionAchievements.length + index) * 0.1 }}
                        >
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="text-2xl sm:text-3xl">{achievement.icon}</div>
                              <div>
                                <h3 className="text-white font-bold text-base sm:text-lg">{achievement.title[language]}</h3>
                                <p className="text-gray-400 text-xs sm:text-sm">{completedCollectionsCount}/{achievement.target}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-purple-900/40 px-2 sm:px-3 py-1 rounded-full">
                              <span className="text-purple-400 font-bold text-xs sm:text-sm">+{achievement.reward}</span>
                              <span className="text-lg sm:text-xl">💎</span>
                            </div>
                          </div>
                          <div className="w-full h-2 sm:h-3 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5, delay: (availableCollectionAchievements.length + index) * 0.1 + 0.2 }}
                            />
                          </div>
                          <div className="mt-2 sm:mt-3 w-full py-1.5 sm:py-2 bg-gray-700/50 rounded-lg text-gray-400 text-xs sm:text-sm font-medium text-center">
                            {Math.round(progress)}% {language === 'tr' ? 'Tamamlandı' : 'Completed'}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Tamamlanmış Koleksiyon Başarımları */}
                    {claimedCollectionAchievementsList.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h3 className="text-gray-400 text-sm font-bold mb-3">✅ {language === 'tr' ? 'Tamamlanan Görevler' : 'Completed Quests'} ({claimedCollectionAchievementsList.length})</h3>
                        {claimedCollectionAchievementsList.slice(0, 3).map((achievement) => (
                          <div key={achievement.id} className="bg-gray-800/30 rounded-lg p-3 mb-2 border border-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{achievement.icon}</span>
                                <span className="text-gray-400 text-sm">{achievement.title[language]}</span>
                              </div>
                              <span className="text-green-400 text-xs">✅ {language === 'tr' ? 'Alındı' : 'Claimed'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Tekrar Görevleri */}
                {questTab === 'repeats' && (
                  <>
                    {/* Günlük Tekrar Görevleri */}
                    <div className="mb-4">
                      <h3 className="text-green-300 text-sm font-bold mb-3 flex items-center gap-2">
                        <span>📅</span>
                        {language === 'tr' ? 'Günlük Tekrar Görevleri' : 'Daily Repeat Quests'}
                      </h3>
                      {dailyRepeatQuestsStatus.map((quest, index) => (
                        <motion.div 
                          key={quest.id}
                          className={`rounded-xl p-3 sm:p-4 mb-2 border shadow-inner ${
                            quest.canClaim 
                              ? 'bg-green-900/30 border-green-500/30' 
                              : quest.claimed 
                                ? 'bg-gray-800/30 border-gray-700/30' 
                                : 'bg-gray-800/50 border-green-500/20'
                          }`}
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{quest.icon}</span>
                              <div>
                                <h4 className="text-white font-bold text-sm">{quest.title[language]}</h4>
                                <p className={`text-xs ${quest.completed ? 'text-green-300' : 'text-gray-400'}`}>
                                  {quest.current}/{quest.target} {quest.completed ? '✅' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 bg-green-900/40 px-2 py-1 rounded-full">
                                <span className="text-green-400 font-bold text-xs">+{quest.reward}</span>
                                <span className="text-sm">💎</span>
                              </div>
                              {/* Geri Sayım Sayacı - Her kutucukta */}
                              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                <span>⏰</span>
                                <span className="font-mono">{timeUntilReset}</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                            <motion.div 
                              className={`h-full ${quest.claimed ? 'bg-gray-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(quest.current / quest.target) * 100}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                            />
                          </div>
                          {quest.canClaim ? (
                            <motion.button 
                              onClick={() => {
                                playSound('telefontıklama.mp3');
                                claimDailyRepeat(quest.id, quest.reward);
                              }}
                              className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white text-xs font-bold shadow-lg"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              🎁 {language === 'tr' ? 'Ödülü Al' : 'Claim Reward'}
                            </motion.button>
                          ) : quest.claimed ? (
                            <div className="w-full py-2 bg-gray-700/50 rounded-lg text-gray-400 text-xs font-medium text-center">
                              ✅ {language === 'tr' ? 'Alındı' : 'Claimed'}
                            </div>
                          ) : (
                            <div className="w-full py-2 bg-gray-700/50 rounded-lg text-gray-400 text-xs font-medium text-center">
                              {Math.round((quest.current / quest.target) * 100)}% {language === 'tr' ? 'Tamamlandı' : 'Completed'}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Önerilen Koleksiyonlar */}
                    {dailySuggestedCollections.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h3 className="text-yellow-300 text-sm font-bold mb-3 flex items-center gap-2">
                          <span>💡</span>
                          {language === 'tr' ? 'Önerilen Koleksiyonlar' : 'Suggested Collections'}
                          <span className="text-xs text-yellow-400/70">+2💎 bonus</span>
                        </h3>
                        <p className="text-gray-400 text-xs mb-3">
                          {language === 'tr' 
                            ? 'Bu koleksiyonları daha az tekrar ettin. Tekrar edersen bonus kazan!' 
                            : 'You repeated these collections less. Repeat them for bonus!'}
                        </p>
                        {dailySuggestedCollections.map((collection, index) => {
                          const todayCompleted = boxProgress[collection.id]?.completionHistory?.some(
                            date => date.startsWith(getTodayDate())
                          );
                          const alreadyClaimed = claimedSuggested.claimed.includes(collection.id);
                          const canClaimBonus = todayCompleted && !alreadyClaimed;
                          
                          return (
                            <motion.div 
                              key={collection.id}
                              className={`rounded-xl p-3 mb-2 border ${
                                canClaimBonus 
                                  ? 'bg-yellow-900/30 border-yellow-500/30' 
                                  : alreadyClaimed
                                    ? 'bg-gray-800/30 border-gray-700/30'
                                    : 'bg-gray-800/50 border-yellow-500/20'
                              }`}
                              initial={{ x: -50, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">⭐</span>
                                  <div>
                                    <h4 className="text-white font-bold text-sm">
                                      {language === 'tr' ? 'Koleksiyon' : 'Collection'} {collection.number}
                                    </h4>
                                    <p className="text-gray-400 text-xs">
                                      {collection.repeatCount} {language === 'tr' ? 'kez tekrar edildi' : 'times repeated'}
                                    </p>
                                  </div>
                                </div>
                                {canClaimBonus ? (
                                  <motion.button 
                                    onClick={() => {
                                      playSound('telefontıklama.mp3');
                                      claimSuggestedBonus(collection.id);
                                    }}
                                    className="px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg text-white text-xs font-bold"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    🎁 {language === 'tr' ? 'Ödülü Al' : 'Claim'} +2💎
                                  </motion.button>
                                ) : alreadyClaimed ? (
                                  <span className="text-green-400 text-xs">✅ {language === 'tr' ? 'Alındı' : 'Claimed'}</span>
                                ) : (
                                  <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-900/30 rounded-lg">
                                    +2💎
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Toplam İstatistik - Mobil Uyumlu */}
              <div className="text-center p-3 sm:p-4 bg-gray-800/30 rounded-xl border border-amber-500/10">
                <div className="text-amber-300 text-xs sm:text-sm mb-1">📊 {language === 'tr' ? 'İstatistikler' : 'Statistics'}</div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <div className="text-white text-lg sm:text-xl font-bold">{claimableCount}</div>
                    <div className="text-gray-400 text-[10px] sm:text-xs">{language === 'tr' ? 'Alınabilir' : 'Claimable'}</div>
                  </div>
                  <div>
                    <div className="text-white text-lg sm:text-xl font-bold">{questTab === 'levels' ? inProgressLevelAchievements.length : inProgressCollectionAchievements.length}</div>
                    <div className="text-gray-400 text-[10px] sm:text-xs">{language === 'tr' ? 'Devam Eden' : 'In Progress'}</div>
                  </div>
                  <div>
                    <div className="text-white text-lg sm:text-xl font-bold">{questTab === 'levels' ? claimedLevelAchievementsList.length : claimedCollectionAchievementsList.length}</div>
                    <div className="text-gray-400 text-[10px] sm:text-xs">{language === 'tr' ? 'Tamamlanan' : 'Completed'}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Günlük Giriş Ödülü Modal - Ultra Premium */}
      <AnimatePresence>
        {showDailyReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: -90 }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
              className="relative max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow Efekti */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 rounded-3xl blur-3xl"></div>
              
              {/* Ana Kart */}
              <div className="relative bg-gradient-to-br from-yellow-600 via-orange-600 to-yellow-700 rounded-3xl p-1 shadow-2xl">
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6">
                  
                  {/* Üst Kısım - Hediye ve Başlık */}
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="inline-block mb-4"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500/50 rounded-full blur-2xl"></div>
                        <span className="relative text-8xl">🎁</span>
                      </div>
                    </motion.div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent mb-2">
                      {t.dailyRewardTitle}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {t.dailyRewardSubtitle}
                    </p>
                  </div>

                  {/* Haftalık Takvim - Circular Design */}
                  <div className="mb-6">
                    <div className="flex justify-center gap-1.5">
                      {dailyRewards.map((reward, index) => {
                        const isToday = index === dailyRewardData.currentDay;
                        const isPast = index < dailyRewardData.currentDay;
                        
                        return (
                          <motion.div
                            key={index}
                            whileHover={{ y: -5 }}
                            className="relative"
                          >
                            {isToday && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-yellow-500/50 rounded-2xl blur-lg"
                              />
                            )}
                            <div className={`relative w-12 h-16 rounded-2xl flex flex-col items-center justify-center ${
                              isToday
                                ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/50'
                                : isPast
                                ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                                : 'bg-gray-800 border border-gray-700'
                            }`}>
                              <div className={`text-[10px] font-bold ${
                                isToday ? 'text-yellow-900' : isPast ? 'text-white' : 'text-gray-600'
                              }`}>
                                D{index + 1}
                              </div>
                              <div className={`text-lg font-black ${
                                isToday ? 'text-yellow-900' : isPast ? 'text-white' : 'text-gray-600'
                              }`}>
                                {reward}
                              </div>
                              <div className="text-xs">
                                {isPast ? '✓' : '💎'}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bugünkü Ödül - Hero Section */}
                  <motion.div
                    className="relative mb-6 overflow-hidden rounded-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-yellow-600/20"></div>
                    <div className="relative bg-gradient-to-br from-yellow-900/50 to-orange-900/50 p-8 border-2 border-yellow-600/50">
                      <div className="text-center">
                        <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-3">
                          {language === 'tr' ? '⭐ Bugünkü Ödülün ⭐' : '⭐ Today\'s Reward ⭐'}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-7xl font-black text-yellow-300"
                          >
                            {dailyRewards[dailyRewardData.currentDay]}
                          </motion.div>
                          <motion.div
                            animate={{ 
                              rotate: [0, 15, -15, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-7xl"
                          >
                            💎
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Ödül Al Butonu - Glow Effect */}
                  <motion.button
                    onClick={() => {
                      playSound('telefontıklama.mp3');
                      claimDailyReward();
                    }}
                    className="relative w-full py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-2xl text-gray-900 text-xl font-black shadow-2xl overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      <span className="text-3xl">🎁</span>
                      <span>{t.claimDailyReward}</span>
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition Overlay - Oyuna Geçiş Animasyonu */}
      {showTransition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
        >
          {/* Kararan arka plan */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950"
          />
          
          {/* Arka plan parçacıkları */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 15, 25, 35, 45, 55, 65, 75, 85, 95, 5, 95].map((pos, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
                y: [0, -100 - (i * 10)]
              }}
              transition={{ 
                duration: 2 + (i % 3),
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute w-2 h-2 rounded-full bg-emerald-400"
              style={{ left: `${pos}%`, top: `${(i * 5) % 100}%` }}
            />
          ))}
          
          {/* Zoom efekti ile merkeze gelen içerik */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Parlayan halka efekti */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 2, 3],
                  opacity: [0, 0.6, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  delay: i * 0.5,
                  ease: "easeOut",
                  repeat: 1
                }}
                className="absolute w-32 h-32 rounded-full border-2 border-emerald-400"
              />
            ))}
            
            {/* Bölüm numarası */}
            <motion.div
              initial={{ scale: 0, rotate: -360 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 150, damping: 15 }}
              className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50"
            >
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-5xl font-bold text-white"
              >
                {transitionLevel?.id}
              </motion.span>
            </motion.div>
            
            {/* Bölüm yazısı */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-6 text-2xl font-bold text-white"
            >
              {t.level} {transitionLevel?.id}
            </motion.p>
            
            {/* Alt yazı */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-2 text-emerald-400 text-sm"
            >
              {t.continue}
            </motion.p>
            
            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 200 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="mt-6 h-1.5 bg-white/20 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.8, duration: 2, ease: "linear" }}
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full"
              />
            </motion.div>
            
            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex gap-2 mt-4"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1,
                    delay: i * 0.2,
                    repeat: Infinity
                  }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      </div>
    </div>
  );
};

export default PhoneMenuPage;
