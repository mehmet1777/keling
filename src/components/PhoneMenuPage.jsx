import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Settings from './Settings';
import LeaderboardPage from './LeaderboardPage';
import { playSound } from '../utils/SoundManager';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Browser } from '@capacitor/browser';
// Google Play Billing - cordova-plugin-purchase kullanılıyor
import { fetchUserData, saveUserData, getLocalGameData, applyCloudData, compareProgress } from '../lib/userSync';
import { getAnimationConfig, getTransitionConfig } from '../utils/graphicsConfig';
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
import { 
  getInventory, 
  getSkipLevelTokenCount, 
  getBadgeInfo, 
  getInventoryStats,
  addSkipLevelTokens,
  addBadge,
  activateFeature,
  updateSupportLevel
} from '../utils/inventoryManager';
import { levels } from '../data/levels';
import { speakWord } from '../utils/ttsService';
import confetti from 'canvas-confetti';

// Avatar listesi - PNG dosyaları
const avatarList = [
  { type: 'image', src: '/avatars/avatar_1.png', bg: 'from-yellow-400 to-orange-400' },
  { type: 'image', src: '/avatars/avatar_2.png', bg: 'from-blue-400 to-cyan-400' },
  { type: 'image', src: '/avatars/avatar_3.png', bg: 'from-pink-400 to-purple-400' },
  { type: 'image', src: '/avatars/avatar_4.png', bg: 'from-sky-300 to-blue-400' },
  { type: 'image', src: '/avatars/avatar_5.png', bg: 'from-amber-400 to-yellow-300' },
  { type: 'image', src: '/avatars/avatar_6.png', bg: 'from-orange-400 to-red-400' },
  { type: 'image', src: '/avatars/avatar_7.png', bg: 'from-orange-500 to-amber-400' },
  { type: 'image', src: '/avatars/avatar_8.png', bg: 'from-gray-300 to-gray-400' },
  { type: 'image', src: '/avatars/avatar_9.png', bg: 'from-yellow-500 to-orange-500' },
  { type: 'image', src: '/avatars/avatar_10.png', bg: 'from-green-400 to-emerald-400' },
  { type: 'image', src: '/avatars/avatar_11.png', bg: 'from-purple-400 to-pink-400' },
  { type: 'image', src: '/avatars/avatar_12.png', bg: 'from-red-500 to-orange-500' },
];

// Çerçeve stilleri ve resimleri
const frameStyles = {
  none: { 
    image: null, 
    gradient: 'from-gray-600 to-gray-700', 
    scale: '1', 
    scaleY: '1',
    cardBg: 'from-indigo-500/30 via-purple-500/20 to-pink-500/30',
    shimmer: 'via-white/10'
  },
  coffee: { 
    image: '/frames/coffee_frame.png', 
    gradient: 'from-amber-500 to-orange-600', 
    scale: '1.3', 
    scaleY: '1.55',
    cardBg: 'from-amber-600/40 via-orange-500/30 to-amber-700/40',
    shimmer: 'via-amber-300/30',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    sparkleColor: '#fbbf24'
  },
  gold: { 
    image: '/frames/gold_frame.png', 
    gradient: 'from-yellow-400 to-amber-500', 
    scale: '1.4', 
    scaleY: '1.7',
    cardBg: 'from-yellow-500/40 via-amber-400/30 to-yellow-600/40',
    shimmer: 'via-yellow-200/40',
    glowColor: 'rgba(250, 204, 21, 0.7)',
    sparkleColor: '#fef08a'
  },
  diamond: { 
    image: '/frames/diamond_frame.png', 
    gradient: 'from-cyan-400 to-blue-500', 
    scale: '1.5', 
    scaleY: '1.7',
    cardBg: 'from-cyan-500/40 via-blue-400/30 to-cyan-600/40',
    shimmer: 'via-cyan-200/40',
    glowColor: 'rgba(34, 211, 238, 0.7)',
    sparkleColor: '#67e8f9'
  },
  legend: { 
    image: '/frames/legend_frame.png', 
    gradient: 'from-purple-500 to-pink-500', 
    scale: '1.5', 
    scaleY: '1.7',
    cardBg: 'from-purple-600/40 via-pink-500/30 to-fuchsia-600/40',
    shimmer: 'via-pink-300/40',
    glowColor: 'rgba(217, 70, 239, 0.7)',
    sparkleColor: '#f0abfc'
  },
};

// Destek Rehberi Modal - 2 Sayfalı
const SupportGuideModal = ({ language, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl p-5 max-w-sm w-full border border-purple-500/30 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sayfa 1 - Profil Kartı Önizleme */}
        {currentPage === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Başlık */}
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">✨</div>
              <h3 className="text-xl font-bold text-white">
                {language === 'tr' ? 'Profilini Özelleştir!' : 'Customize Your Profile!'}
              </h3>
              <p className="text-purple-200 text-sm mt-1">
                {language === 'tr' ? 'Destekçilere özel çerçeveler' : 'Exclusive frames for supporters'}
              </p>
            </div>
            
            {/* Örnek Profil Kartı */}
            <div className="flex justify-center mb-4">
              <div className="relative overflow-hidden rounded-2xl" style={{ maxWidth: '220px' }}>
                {/* Glow efekti */}
                <div 
                  className="absolute inset-0 pointer-events-none blur-xl opacity-50"
                  style={{ 
                    background: 'radial-gradient(ellipse at center, rgba(217, 70, 239, 0.6) 0%, transparent 70%)',
                    zIndex: 0
                  }}
                />
                
                {/* Çerçeve PNG - Arka plan olarak */}
                <img 
                  src="/frames/legend_frame.png" 
                  alt="Frame" 
                  className="w-full h-auto relative"
                  style={{ 
                    display: 'block',
                    minHeight: '80px',
                    zIndex: 1
                  }}
                />
                
                {/* Peri tozu parçacıkları - Sabit pozisyonlar */}
                {[
                  { top: 20, left: 15 },
                  { top: 35, left: 75 },
                  { top: 50, left: 25 },
                  { top: 65, left: 85 },
                  { top: 25, left: 55 },
                  { top: 70, left: 40 },
                  { top: 40, left: 90 },
                  { top: 55, left: 10 },
                ].map((pos, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                    style={{
                      background: '#f0abfc',
                      boxShadow: '0 0 6px #f0abfc',
                      top: `${pos.top}%`,
                      left: `${pos.left}%`,
                      zIndex: 30
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.2, 0],
                      y: [0, -10, -20],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeOut'
                    }}
                  />
                ))}
                
                {/* Kart İçeriği - Çerçevenin ortasında */}
                <div className="absolute inset-0 flex items-center justify-center p-4" style={{ zIndex: 20 }}>
                  {/* Shimmer efekti */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-300/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  <div className="relative flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <img 
                        src="/avatars/avatar_1.png" 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        style={{ transform: 'scale(1.3)' }}
                      />
                    </div>
                    
                    {/* İsim ve Unvan */}
                    <div>
                      <p className="text-white font-bold text-base leading-tight drop-shadow-lg">Keling</p>
                      <p className="text-purple-100 text-[11px] drop-shadow">👑 Efsane</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Çerçeve Örnekleri */}
            <div className="bg-black/30 rounded-xl p-4 mb-5">
              <p className="text-center text-gray-400 text-xs mb-4">
                {language === 'tr' ? '4 Farklı Çerçeve Seçeneği' : '4 Different Frame Options'}
              </p>
              <div className="flex justify-center gap-6">
                {[
                  { frame: '/frames/coffee_frame.png', gradient: 'from-amber-500 to-orange-600', scale: '1.3', scaleY: '1.7' },
                  { frame: '/frames/gold_frame.png', gradient: 'from-yellow-500 to-amber-600', scale: '1.4', scaleY: '1.7' },
                  { frame: '/frames/diamond_frame.png', gradient: 'from-cyan-500 to-blue-600', scale: '1.5', scaleY: '1.7' },
                  { frame: '/frames/legend_frame.png', gradient: 'from-purple-500 to-pink-600', scale: '1.5', scaleY: '1.7' },
                ].map((item, i) => (
                  <div key={i} className="relative w-12 h-12 flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                      <img 
                        src="/avatars/avatar_1.png" 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        style={{ transform: 'scale(1.3)' }}
                      />
                    </div>
                    <img 
                      src={item.frame} 
                      alt="Frame" 
                      className="absolute pointer-events-none"
                      style={{ 
                        width: '100%',
                        height: '100%',
                        transform: `scale(${item.scale}) scaleY(${item.scaleY})`,
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* İleri Butonu */}
            <motion.button
              onClick={() => setCurrentPage(1)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {language === 'tr' ? 'Devam Et' : 'Continue'}
              <span>→</span>
            </motion.button>
            
            {/* Sayfa göstergesi */}
            <div className="flex justify-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
            </div>
          </motion.div>
        )}
        
        {/* Sayfa 2 - Ödül Açıklamaları */}
        {currentPage === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Başlık */}
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">❤️</div>
              <h3 className="text-xl font-bold text-white">
                {language === 'tr' ? 'Destekçi Ödülleri' : 'Supporter Rewards'}
              </h3>
              <p className="text-purple-200 text-sm mt-1">
                {language === 'tr' ? 'Desteğin karşılıksız kalmaz!' : 'Your support is always rewarded!'}
              </p>
            </div>
            
            {/* Ödül Açıklamaları */}
            <div className="space-y-3 mb-4">
              {/* Çerçeve */}
              <div className="bg-black/30 rounded-xl p-3 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🖼️</div>
                  <div>
                    <p className="text-amber-300 font-bold text-sm">
                      {language === 'tr' ? 'Özel Çerçeve' : 'Special Frame'}
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      {language === 'tr' 
                        ? 'Profil fotoğrafının etrafında kullan!' 
                        : 'Use it around your profile photo!'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Rozet */}
              <div className="bg-black/30 rounded-xl p-3 border border-pink-500/20">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🏅</div>
                  <div>
                    <p className="text-pink-300 font-bold text-sm">
                      {language === 'tr' ? 'Koleksiyon Rozeti' : 'Collection Badge'}
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      {language === 'tr' 
                        ? 'Envanterindeki koleksiyona eklenir!' 
                        : 'Added to your inventory collection!'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 4 Rozet Bonusu */}
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-3 border border-purple-400/30">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💎</div>
                  <div>
                    <p className="text-purple-300 font-bold text-sm">
                      {language === 'tr' ? '4 Rozet = 2x Elmas!' : '4 Badges = 2x Diamonds!'}
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      {language === 'tr' 
                        ? 'Dört rozeti topla, kalıcı 2x bonus kazan!' 
                        : 'Collect all four, get permanent 2x bonus!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rozet İkonları */}
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center overflow-hidden shadow-lg">
                <img src="/badges/coffee_badge.png" alt="Coffee" className="w-full h-full object-cover" style={{ transform: 'scale(1.15)' }} />
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center overflow-hidden shadow-lg">
                <img src="/badges/gold_badge.png" alt="Gold" className="w-full h-full object-cover" style={{ transform: 'scale(1.15)' }} />
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden shadow-lg">
                <img src="/badges/diamond_badge.png" alt="Diamond" className="w-full h-full object-cover" style={{ transform: 'scale(1.15)' }} />
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center overflow-hidden shadow-lg">
                <img src="/badges/legend_badge.png" alt="Legend" className="w-full h-full object-cover" style={{ transform: 'scale(1.15)' }} />
              </div>
              <div className="text-white font-bold text-lg ml-1">=</div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-lg shadow-lg font-bold text-white">2x</div>
            </div>
            
            {/* Butonlar */}
            <div className="flex gap-2">
              <motion.button
                onClick={() => setCurrentPage(0)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold shadow-lg flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>←</span>
                {language === 'tr' ? 'Geri' : 'Back'}
              </motion.button>
              <motion.button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {language === 'tr' ? 'Anladım!' : 'Got it!'}
              </motion.button>
            </div>
            
            {/* Sayfa göstergesi */}
            <div className="flex justify-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Animasyonlu arka plan bileşeni
const AnimatedBackground = ({ quality }) => {
  // quality prop'unu doğrudan kullan (localStorage yerine)
  const showBackgroundAnimations = quality === 'high';
  
  console.log('🎨 AnimatedBackground render - quality:', quality, 'backgroundAnimations:', showBackgroundAnimations);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Ana arka plan - Kelime Bankası'nın arka plan renkleri */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-indigo-950/20 to-black" />
      
      {/* Animasyonlu ızgara */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Parıltı efektleri - Sadece yüksek kalitede */}
      {showBackgroundAnimations && (
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
      )}
    </div>
  );
};

// Oyun kartı bileşeni - Kelime Bankası'ndaki kart tasarımına benzer
const GameCard = ({ onClick, title, icon, emoji, delay = 0, detailText, layoutMode, quality }) => {
  // quality prop'unu doğrudan kullan (localStorage yerine)
  const shouldAnimate = quality !== 'low';
  
  const variants = {
    hidden: { opacity: 0, y: shouldAnimate ? 20 : 0 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldAnimate ? { 
        type: "spring", 
        stiffness: quality === 'high' ? 300 : 200, 
        damping: quality === 'high' ? 24 : 20,
        delay: delay * (quality === 'high' ? 0.15 : 0.05)
      } : { duration: 0 }
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

  // Parlayan efekt gösterilsin mi?
  const showShineEffect = quality === 'high';

  // Grid modunda kompakt tasarım
  if (layoutMode === 'grid') {
    return (
      <motion.div
        onClick={onClick}
        className="w-full"
        variants={variants}
        initial="hidden"
        animate="visible"
        whileHover={shouldAnimate ? { scale: 1.05 } : {}}
        whileTap={shouldAnimate ? { scale: 0.95 } : {}}
      >
        <div className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} rounded-xl p-4 border-2 ${colors.border} shadow-lg backdrop-blur-sm transition-all duration-300 h-full flex flex-col items-center justify-center text-center gap-2`}>
          {/* Parlayan efekt - Sadece yüksek kalitede */}
          {showShineEffect && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          )}
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
      whileHover={shouldAnimate ? { scale: 1.02 } : {}}
      whileTap={shouldAnimate ? { scale: 0.98 } : {}}
    >
      <div className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl p-5 border-2 ${colors.border} shadow-lg backdrop-blur-sm transition-all duration-300`}>
        {/* Parlayan Efekt - Sadece yüksek kalitede */}
        {showShineEffect && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
        
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
const MarketModal = ({ isOpen, onClose, diamonds, setDiamonds, graphicsQuality = 'high' }) => {
  const [language] = useState(() => localStorage.getItem('language') || 'tr');
  const [selectedTab, setSelectedTab] = useState('diamonds'); // 'diamonds', 'features', 'support'
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [showSupportGuide, setShowSupportGuide] = useState(false); // Destek rehberi popup
  const [hasSeenSupportGuide, setHasSeenSupportGuide] = useState(() => {
    return localStorage.getItem('hasSeenSupportGuide') === 'true';
  });
  const [framePreview, setFramePreview] = useState(null); // Çerçeve önizleme popup { frameImage, packName, gradient }

  // Google Play Billing başlatma
  useEffect(() => {
    const initStore = async () => {
      try {
        if (Capacitor.isNativePlatform() && window.CdvPurchase) {
          const { store, ProductType, Platform } = window.CdvPurchase;
          
          // Ürünleri kaydet
          store.register([
            // Elmas paketleri
            { id: 'small', type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            { id: 'medium', type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            { id: 'large', type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            { id: 'xlarge', type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            { id: 'mega', type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            // Destek paketleri
            { id: 'coffee', type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            { id: 'gold', type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            { id: 'diamond', type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            { id: 'legend', type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
            // Özellikler
            { id: 'removeads', type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
          ]);
          
          // Satın alma onaylandığında
          store.when().approved(transaction => {
            console.log('Satın alma onaylandı:', transaction.products[0]?.id);
            transaction.finish();
          });
          
          // Store'u başlat
          await store.initialize([Platform.GOOGLE_PLAY]);
          await store.update();
          
          console.log('Google Play Billing başlatıldı');
        }
      } catch (error) {
        console.error('Store başlatma hatası:', error);
      }
    };
    
    initStore();
  }, []);

  // Bildirim otomatik kapanma
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // 5 saniye sonra kapat
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
      id: 'removeads', 
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
      price: 60, 
      icon: '👑',
      iconBg: 'from-blue-500 to-cyan-500',
      type: t.singleUse,
      currency: 'diamond'
    },
    { 
      id: 'skipLevel5', 
      title: t.skipLevel + ' (5x)', 
      desc: t.skipLevelDesc, 
      price: 250,
      icon: '👑', 
      iconBg: 'from-purple-500 to-pink-500',
      type: t.singleUse,
      currency: 'diamond'
    },
    { 
      id: 'skipLevel10', 
      title: t.skipLevel + ' (10x)', 
      desc: t.skipLevelDesc, 
      price: 450, 
      icon: '👑',
      iconBg: 'from-orange-500 to-red-500',
      type: t.singleUse,
      currency: 'diamond',
      tag: t.mostPopular
    },
    { 
      id: 'skipLevel25', 
      title: t.skipLevel + ' (25x)', 
      desc: t.skipLevelDesc, 
      price: 1000, 
      icon: '👑',
      iconBg: 'from-yellow-500 to-amber-500',
      type: t.singleUse,
      currency: 'diamond'
    },
    { 
      id: 'skipLevel50', 
      title: t.skipLevel + ' (50x)', 
      desc: t.skipLevelDesc, 
      price: 1800, 
      icon: '👑',
      iconBg: 'from-pink-500 to-rose-500',
      type: t.singleUse,
      currency: 'diamond',
      tag: t.bestValue
    },
  ];

  // Destek paketleri
  const supportPacks = [
    { 
      id: 'coffee', 
      title: '☕ Kahve', 
      price: '19,99 TL', 
      desc: language === 'tr' ? 'Bir kahve ısmarla, gülümset' : 'Buy a coffee, make us smile',
      badge: '🏅 Destekçi',
      frame: language === 'tr' ? '☕ Kahve Çerçevesi' : '☕ Coffee Frame'
    },
    { 
      id: 'gold', 
      title: '🥇 Altın', 
      price: '39,99 TL', 
      desc: language === 'tr' ? 'Altın kalpli destekçi' : 'Golden-hearted supporter',
      badge: '🥇 Altın Destekçi',
      frame: language === 'tr' ? '🥇 Altın Çerçevesi' : '🥇 Gold Frame'
    },
    { 
      id: 'diamond', 
      title: '💎 Elmas', 
      price: '79,99 TL', 
      desc: language === 'tr' ? 'Pırıl pırıl bir kalp' : 'A sparkling heart',
      badge: '💎 Elmas Destekçi',
      frame: language === 'tr' ? '💎 Elmas Çerçevesi' : '💎 Diamond Frame'
    },
    { 
      id: 'legend', 
      title: '👑 Efsane', 
      price: '149,99 TL', 
      desc: language === 'tr' ? 'Efsaneler unutulmaz' : 'Legends never fade',
      badge: '👑 Efsane Destekçi',
      frame: language === 'tr' ? '👑 Efsane Çerçevesi' : '👑 Legend Frame'
    },
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

  // Google Play Billing entegrasyonu
  const handleGooglePlayPurchase = async (itemId, type) => {
    try {
      // Debug bilgisi
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform();
      const hasCdvPurchase = !!window.CdvPurchase;
      console.log('Platform kontrol:', { isNative, platform, hasCdvPurchase, itemId, type });
      
      // Native platform kontrolü - android veya ios ise native
      const isReallyNative = platform === 'android' || platform === 'ios';
      
      if (!isReallyNative) {
        // Web'de test modu
        console.log('Web ortamında satın alma simülasyonu:', itemId);
        handleSuccessfulPurchase(itemId, type);
        return;
      }
      
      if (!hasCdvPurchase) {
        console.error('CdvPurchase bulunamadı - Native modda ama plugin yok');
        // Plugin yüklenemedi, kullanıcıya bildir ama yine de devam et
        setNotification({ type: 'error', message: `Plugin yok! Platform: ${platform}` });
        return;
      }
      
      const { store } = window.CdvPurchase;
      const product = store.get(itemId);
      
      if (!product) {
        console.error('Ürün bulunamadı:', itemId);
        const message = language === 'tr' 
          ? 'Ürün bulunamadı. Lütfen tekrar deneyin.'
          : 'Product not found. Please try again.';
        setNotification({ type: 'error', message });
        return;
      }
      
      // Satın alma başlat
      const offer = product.getOffer();
      if (offer) {
        // Satın alma sonucunu dinle
        store.when().approved(transaction => {
          if (transaction.products.some(p => p.id === itemId)) {
            handleSuccessfulPurchase(itemId, type);
            transaction.finish();
          }
        });
        
        await offer.order();
      }
    } catch (error) {
      console.error('Satın alma hatası:', error);
      
      // Kullanıcı iptal etti
      if (error.code === 'USER_CANCELLED' || error.message?.includes('cancel')) {
        return;
      }
      
      // Hata mesajı göster
      const message = language === 'tr' 
        ? 'Satın alma işlemi başarısız oldu. Lütfen tekrar deneyin.'
        : 'Purchase failed. Please try again.';
      setNotification({ type: 'error', message });
    }
  };

  // Başarılı satın alma sonrası işlemler
  const handleSuccessfulPurchase = (itemId, type) => {
    playSound('ödül-kazanma-sesi.mp3');
    
    if (type === 'support') {
      // Destek paketleri
      const badgeMap = {
        'coffee': 'supporter',
        'gold': 'gold_supporter', 
        'diamond': 'diamond_supporter',
        'legend': 'legend_supporter'
      };
      
      addBadge(badgeMap[itemId]);
      updateSupportLevel(itemId, 0);
      
      const message = language === 'tr' 
        ? `🎉 ${itemId === 'coffee' ? 'Kahve' : itemId === 'gold' ? 'Altın' : itemId === 'diamond' ? 'Elmas' : 'Efsane'} paketi aktif edildi!`
        : `🎉 ${itemId.charAt(0).toUpperCase() + itemId.slice(1)} pack activated!`;
      setNotification({ type: 'success', message });
      
    } else if (type === 'feature') {
      // Özellikler
      if (itemId === 'removeads') {
        activateFeature('removeAds');
        const message = language === 'tr' ? '🎉 Reklamlar kaldırıldı!' : '🎉 Ads removed!';
        setNotification({ type: 'success', message });
      }
      
    } else if (type === 'diamond') {
      // Elmas paketleri
      const diamondAmounts = {
        'small': 50 + 0,
        'medium': 150 + 20,
        'large': 350 + 50,
        'xlarge': 800 + 100,
        'mega': 2200 + 300
      };
      
      const amount = diamondAmounts[itemId];
      if (amount) {
        setDiamonds(prev => prev + amount);
        const message = language === 'tr' 
          ? `🎉 ${amount} elmas eklendi!`
          : `🎉 ${amount} diamonds added!`;
        setNotification({ type: 'success', message, diamonds: amount });
      }
    }
  };

  const handlePurchase = (itemId) => {
    playSound('telefontıklama.mp3');
    
    // Seviye atlama paketleri - Envantere ekle
    if (itemId.startsWith('skipLevel')) {
      const amounts = {
        'skipLevel1': { tokens: 1, price: 60 },
        'skipLevel5': { tokens: 5, price: 250 },
        'skipLevel10': { tokens: 10, price: 450 },
        'skipLevel25': { tokens: 25, price: 1000 },
        'skipLevel50': { tokens: 50, price: 1800 }
      };
      
      const pack = amounts[itemId];
      if (pack) {
        // Elmas kontrolü
        if (diamonds >= pack.price) {
          // Elmas düş
          setDiamonds(prev => prev - pack.price);
          // Envantere ekle
          addSkipLevelTokens(pack.tokens, pack.price);
          // Başarı sesi
          playSound('ödül-kazanma-sesi.mp3');
          // Başarı mesajı
          const message = language === 'tr' 
            ? `${pack.tokens}x Seviye Atlama hakkı envanterine eklendi!`
            : `${pack.tokens}x Skip Level tokens added to inventory!`;
          setNotification({ type: 'success', message, tokens: pack.tokens });
        } else {
          // Hata sesi
          playSound('tekrar-hata-sesi.mp3');
          const message = language === 'tr'
            ? 'Yetersiz elmas!'
            : 'Insufficient diamonds!';
          const needMore = pack.price - diamonds;
          setNotification({ type: 'error', message, needMore, price: pack.price });
        }
        return;
      }
    }
    
    // Google Play Billing entegrasyonu aktif
    const TEST_MODE = false;
    
    // Destek paketleri - Rozet ekle
    if (itemId === 'coffee' || itemId === 'gold' || itemId === 'diamond' || itemId === 'legend') {
      const badgeMap = {
        'coffee': 'supporter',
        'gold': 'gold_supporter',
        'diamond': 'diamond_supporter',
        'legend': 'legend_supporter'
      };
      
      if (TEST_MODE) {
        // Test modu - bedava ver
        addBadge(badgeMap[itemId]);
        updateSupportLevel(itemId, 0);
        playSound('ödül-kazanma-sesi.mp3');
        const message = language === 'tr' 
          ? `🎉 ${itemId === 'coffee' ? 'Kahve' : itemId === 'gold' ? 'Altın' : itemId === 'diamond' ? 'Elmas' : 'Efsane'} paketi aktif edildi! (Test Modu)`
          : `🎉 ${itemId.charAt(0).toUpperCase() + itemId.slice(1)} pack activated! (Test Mode)`;
        setNotification({ type: 'success', message });
        return;
      }
      
      // Google Play Billing ile satın alma
      handleGooglePlayPurchase(itemId, 'support');
      return;
    }
    
    // Özellikler (Reklamları kaldır vb.)
    if (itemId === 'removeads') {
      if (TEST_MODE) {
        activateFeature('removeAds');
        playSound('ödül-kazanma-sesi.mp3');
        const message = language === 'tr' ? '🎉 Reklamlar kaldırıldı! (Test Modu)' : '🎉 Ads removed! (Test Mode)';
        setNotification({ type: 'success', message });
        return;
      }
      
      // Google Play Billing ile satın alma
      handleGooglePlayPurchase(itemId, 'feature');
      return;
    }
    
    // Elmas paketleri (miktar + bonus)
    const diamondAmounts = {
      'small': 50 + 0,      // 50 elmas, bonus yok
      'medium': 150 + 20,   // 150 + 20 bonus = 170
      'large': 350 + 50,    // 350 + 50 bonus = 400
      'xlarge': 800 + 100,  // 800 + 100 bonus = 900
      'mega': 2200 + 300    // 2200 + 300 bonus = 2500
    };
    
    if (TEST_MODE && diamondAmounts[itemId]) {
      const amount = diamondAmounts[itemId];
      setDiamonds(prev => prev + amount);
      playSound('ödül-kazanma-sesi.mp3');
      const message = language === 'tr' 
        ? `🎉 ${amount} elmas eklendi! (Test Modu)`
        : `🎉 ${amount} diamonds added! (Test Mode)`;
      setNotification({ type: 'success', message, diamonds: amount });
      return;
    }
    
    // Elmas paketleri için Google Play Billing
    if (diamondAmounts[itemId]) {
      handleGooglePlayPurchase(itemId, 'diamond');
      return;
    }
    
    console.log('Bilinmeyen ürün:', itemId);
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
                  // İlk kez destek sekmesine basıyorsa rehberi göster
                  if (!hasSeenSupportGuide) {
                    setShowSupportGuide(true);
                    setHasSeenSupportGuide(true);
                    localStorage.setItem('hasSeenSupportGuide', 'true');
                  }
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
                  {/* Glow Effect for special packs - Sadece yüksek kalitede */}
                  {pack.tag && graphicsQuality === 'high' && (
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
                          <span className="text-white font-black text-2xl sm:text-3xl">{pack.amount}</span>
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
                      whileHover={graphicsQuality !== 'low' ? { scale: 1.02 } : {}}
                      whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                    >
                      {graphicsQuality === 'high' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{ x: ['-200%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
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
                      {/* Glow Effect - Sadece yüksek kalitede */}
                      {graphicsQuality === 'high' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-xl"
                          animate={{ 
                            opacity: [0.5, 0.8, 0.5],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-2xl p-4 sm:p-5 border border-purple-500/30 shadow-2xl">
                        {/* Sparkle Effects - Sadece yüksek kalitede */}
                        {graphicsQuality === 'high' && (
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
                        )}
                        
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
                              whileHover={graphicsQuality !== 'low' ? { scale: 1.02 } : {}}
                              whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                            >
                              {graphicsQuality === 'high' && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                  animate={{ x: ['-200%', '200%'] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                              )}
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
                      {/* Parlayan efekt - Sadece yüksek kalitede */}
                      {graphicsQuality === 'high' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl sm:rounded-2xl overflow-hidden"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                      
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
                              animate={graphicsQuality === 'high' ? { scale: [1, 1.2, 1] } : {}}
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
                        whileHover={graphicsQuality !== 'low' ? { scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" } : {}}
                        whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                      >
                        {graphicsQuality === 'high' && (
                          <motion.div
                            className="absolute inset-0 bg-white/20"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.5 }}
                          />
                        )}
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
                      return { gradient: 'from-amber-500 to-orange-600', bg: 'via-amber-900/30', border: 'border-amber-400/40', badgeImage: '/badges/coffee_badge.png', frameImage: '/frames/coffee_frame.png', textColor: 'text-amber-200' };
                    case 'gold':
                      return { gradient: 'from-yellow-500 to-amber-600', bg: 'via-yellow-900/30', border: 'border-yellow-400/40', badgeImage: '/badges/gold_badge.png', frameImage: '/frames/gold_frame.png', textColor: 'text-yellow-200' };
                    case 'diamond':
                      return { gradient: 'from-cyan-500 to-blue-600', bg: 'via-cyan-900/30', border: 'border-cyan-400/40', badgeImage: '/badges/diamond_badge.png', frameImage: '/frames/diamond_frame.png', textColor: 'text-cyan-200' };
                    case 'legend':
                      return { gradient: 'from-purple-500 to-pink-600', bg: 'via-purple-900/30', border: 'border-purple-400/40', badgeImage: '/badges/legend_badge.png', frameImage: '/frames/legend_frame.png', textColor: 'text-purple-200' };
                    default:
                      return { gradient: 'from-pink-500 to-red-600', bg: 'via-pink-900/30', border: 'border-pink-400/40', badgeImage: null, frameImage: null, textColor: 'text-pink-200' };
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
                      {/* Çerçeve Önizleme İkonu - Sağ üst köşe */}
                      <motion.button
                        onClick={() => setFramePreview({ 
                          frameImage: style.frameImage, 
                          packName: pack.title,
                          gradient: style.gradient,
                          textColor: style.textColor
                        })}
                        className="absolute top-2 right-2 z-10"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <motion.div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} border-2 border-white/40 flex items-center justify-center shadow-xl`}
                          animate={{ 
                            y: [0, -3, 0],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <motion.span 
                            className="text-lg"
                            animate={{ 
                              scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            🔍
                          </motion.span>
                        </motion.div>
                      </motion.button>
                      
                      {/* Header with badge image */}
                      <div className="text-center mb-3 sm:mb-4">
                        <motion.div
                          className={`inline-flex w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br ${style.gradient} items-center justify-center shadow-xl sm:shadow-2xl mb-2 sm:mb-3 overflow-hidden`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <img 
                            src={style.badgeImage} 
                            alt={pack.badge} 
                            className="w-full h-full object-cover"
                            style={{ transform: 'scale(1.15)' }}
                          />
                        </motion.div>
                        <p className={`${style.textColor} text-sm sm:text-base font-bold`}>{pack.badge}</p>
                      </div>
                      
                      {/* Description */}
                      <p className={`${style.textColor} text-xs sm:text-sm text-center italic mb-3`}>"{pack.desc}"</p>
                      
                      {/* Kazanımlar */}
                      <div className="bg-black/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                        <p className="text-white/60 text-[10px] sm:text-xs font-semibold mb-2.5 uppercase tracking-wider">
                          {language === 'tr' ? '🎁 Kazanımlar' : '🎁 Rewards'}
                        </p>
                        <div className="space-y-2.5">
                          <div className={`flex items-center gap-2.5 bg-gradient-to-r ${style.bg} rounded-lg p-2`}>
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-md overflow-hidden`}>
                              <img 
                                src={style.badgeImage} 
                                alt={pack.badge} 
                                className="w-full h-full object-cover"
                                style={{ transform: 'scale(1.15)' }}
                              />
                            </div>
                            <div>
                              <p className="text-white text-xs sm:text-sm font-bold">{pack.badge} Rozeti</p>
                              <p className="text-gray-400 text-[9px] sm:text-[10px]">{language === 'tr' ? 'Koleksiyona eklenir' : 'Added to collection'}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2.5 bg-gradient-to-r ${style.bg} rounded-lg p-2`}>
                            <div className="relative w-12 h-10 flex items-center justify-center">
                              {/* Mini avatar */}
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                <img 
                                  src="/avatars/avatar_1.png" 
                                  alt="Avatar" 
                                  className="w-full h-full object-cover"
                                  style={{ transform: 'scale(1.3)' }}
                                />
                              </div>
                              {/* Çerçeve üstte */}
                              <img 
                                src={style.frameImage} 
                                alt={pack.frame} 
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                style={{ transform: 'scale(1.8)' }}
                              />
                            </div>
                            <div>
                              <p className="text-white text-xs sm:text-sm font-bold">{pack.frame}</p>
                              <p className="text-gray-400 text-[9px] sm:text-[10px]">{language === 'tr' ? 'Profilde kullanılır' : 'Use on profile'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-gray-600/30 flex items-center justify-between">
                          <span className="text-gray-400 text-[10px] sm:text-xs">{language === 'tr' ? 'Destek Tutarı' : 'Support Amount'}</span>
                          <span className={`${style.textColor} font-bold text-sm sm:text-base`}>{pack.price}</span>
                        </div>
                      </div>
                      
                      {/* Button */}
                      <motion.button
                        onClick={() => handlePurchase(pack.id)}
                        className={`relative w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-bold shadow-lg sm:shadow-xl overflow-hidden bg-gradient-to-r ${style.gradient}`}
                        whileHover={graphicsQuality !== 'low' ? { scale: 1.02 } : {}}
                        whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                      >
                        {graphicsQuality === 'high' && (
                          <motion.div
                            className="absolute inset-0 bg-white/20"
                            animate={{ x: ['-200%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                        <span className="relative">{language === 'tr' ? '❤️ Destek Ol' : '❤️ Support'}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* 4 Rozet Bonus Bilgi Kutusu */}
              {selectedTab === 'support' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 rounded-xl p-4 border border-purple-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🎁</div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm mb-1">
                        {language === 'tr' ? '4 Rozeti Topla → 2x Elmas!' : 'Collect 4 Badges → 2x Diamonds!'}
                      </p>
                      <p className="text-purple-200 text-xs">
                        {language === 'tr' 
                          ? 'Tüm destek rozetlerini topla, bölüm başına 2 kat elmas kazan!' 
                          : 'Collect all support badges, earn 2x diamonds per level!'}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setShowSupportGuide(true)}
                      className="text-purple-300 hover:text-white text-xl"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ℹ️
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Destek Rehberi Popup */}
      <AnimatePresence>
        {showSupportGuide && (
          <SupportGuideModal 
            language={language} 
            onClose={() => setShowSupportGuide(false)} 
          />
        )}
      </AnimatePresence>

      {/* Çerçeve Önizleme Popup */}
      <AnimatePresence>
        {framePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setFramePreview(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 max-w-xs w-full border border-white/20 shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Başlık */}
              <div className="text-center mb-4">
                <h3 className={`text-lg font-bold ${framePreview.textColor}`}>
                  {framePreview.packName} {language === 'tr' ? 'Çerçevesi' : 'Frame'}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  {language === 'tr' ? 'Profilinde böyle görünecek' : 'This is how it will look on your profile'}
                </p>
              </div>
              
              {/* Çerçeve Önizleme */}
              <div className="flex justify-center mb-4">
                <div className="relative overflow-hidden rounded-2xl" style={{ maxWidth: '220px' }}>
                  {/* Glow efekti */}
                  <div 
                    className="absolute inset-0 pointer-events-none blur-xl opacity-50"
                    style={{ 
                      background: `radial-gradient(ellipse at center, ${framePreview.gradient.includes('amber') ? 'rgba(245, 158, 11, 0.6)' : framePreview.gradient.includes('yellow') ? 'rgba(250, 204, 21, 0.6)' : framePreview.gradient.includes('cyan') ? 'rgba(34, 211, 238, 0.6)' : 'rgba(217, 70, 239, 0.6)'} 0%, transparent 70%)`,
                      zIndex: 0
                    }}
                  />
                  
                  {/* Çerçeve PNG */}
                  <img 
                    src={framePreview.frameImage} 
                    alt="Frame" 
                    className="w-full h-auto relative"
                    style={{ 
                      display: 'block',
                      minHeight: '80px',
                      zIndex: 1
                    }}
                  />
                  
                  {/* Peri tozu parçacıkları */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                      style={{
                        background: framePreview.gradient.includes('amber') ? '#fbbf24' : framePreview.gradient.includes('yellow') ? '#fef08a' : framePreview.gradient.includes('cyan') ? '#67e8f9' : '#f0abfc',
                        boxShadow: `0 0 6px ${framePreview.gradient.includes('amber') ? '#fbbf24' : framePreview.gradient.includes('yellow') ? '#fef08a' : framePreview.gradient.includes('cyan') ? '#67e8f9' : '#f0abfc'}`,
                        top: `${15 + Math.random() * 70}%`,
                        left: `${10 + Math.random() * 80}%`,
                        zIndex: 30
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.2, 0],
                        y: [0, -10, -20],
                      }}
                      transition={{
                        duration: 1.5 + Math.random(),
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeOut'
                      }}
                    />
                  ))}
                  
                  {/* Kart İçeriği */}
                  <div className="absolute inset-0 flex items-center justify-center p-4" style={{ zIndex: 20 }}>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                    
                    <div className="relative flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <img 
                          src="/avatars/avatar_1.png" 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          style={{ transform: 'scale(1.3)' }}
                        />
                      </div>
                      
                      <div>
                        <p className="text-white font-bold text-base leading-tight drop-shadow-lg">Keling</p>
                        <p className="text-purple-100 text-[11px] drop-shadow">{framePreview.packName.split(' ')[0]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Kapat Butonu */}
              <motion.button
                onClick={() => setFramePreview(null)}
                className={`w-full py-3 rounded-xl bg-gradient-to-r ${framePreview.gradient} text-white font-bold shadow-lg`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {language === 'tr' ? 'Kapat' : 'Close'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Style Notification Modal */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative overflow-visible max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow Effect - Sadece yüksek kalitede */}
              {graphicsQuality === 'high' && (
                <motion.div
                  className={`absolute inset-0 rounded-2xl blur-xl ${
                    notification.type === 'success'
                      ? 'bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30'
                      : 'bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30'
                  }`}
                  animate={{ 
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              <div className={`relative rounded-2xl p-5 shadow-2xl ${
                notification.type === 'success'
                  ? 'bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 border border-purple-500/30'
                  : 'bg-gradient-to-br from-gray-900 via-red-900/50 to-gray-900 border border-red-500/30'
              }`}>
                {/* Sparkle Effect - Sadece yüksek kalitede */}
                {graphicsQuality === 'high' && (
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
                )}
                
                {/* Header Section */}
                <div className="flex items-start gap-3 mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative"
                  >
                    <div className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center shadow-xl border-2 border-white/20 ${
                      notification.type === 'success'
                        ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500'
                        : 'bg-gradient-to-br from-red-500 via-orange-500 to-red-500'
                    }`}>
                      {notification.type === 'success' ? (
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                        </svg>
                      )}
                    </div>
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-black text-lg">
                        {notification.type === 'success' 
                          ? (language === 'tr' ? 'Başarılı!' : 'Success!') 
                          : (language === 'tr' ? 'Yetersiz Bakiye' : 'Insufficient Balance')
                        }
                      </h3>
                      <span className="text-xs">⭐</span>
                    </div>
                    <p className={`text-sm ${
                      notification.type === 'success' ? 'text-purple-200' : 'text-red-200'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
                
                {/* Details Section */}
                {notification.type === 'success' && notification.tokens && (
                  <div className="bg-black/30 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-4xl">👑</span>
                      <div className="text-center">
                        <div className="text-yellow-300 font-black text-2xl">{notification.tokens}x</div>
                        <div className="text-yellow-200 text-xs">
                          {language === 'tr' ? 'Envantere Eklendi' : 'Added to Inventory'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {notification.type === 'error' && notification.needMore && (
                  <div className="bg-black/30 rounded-xl p-3 mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-200">{language === 'tr' ? 'Gerekli' : 'Required'}:</span>
                      <span className="text-white font-bold flex items-center gap-1">
                        {notification.price} <span className="text-lg">💎</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-200">{language === 'tr' ? 'Eksik' : 'Missing'}:</span>
                      <span className="text-red-300 font-bold flex items-center gap-1">
                        {notification.needMore} <span className="text-lg">💎</span>
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Button */}
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setNotification(null);
                  }}
                  className={`relative w-full py-3 rounded-xl text-white font-bold shadow-xl overflow-hidden ${
                    notification.type === 'success'
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600'
                      : 'bg-gradient-to-r from-red-600 via-orange-600 to-red-600'
                  }`}
                  whileHover={graphicsQuality !== 'low' ? { scale: 1.02 } : {}}
                  whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                >
                  {graphicsQuality === 'high' && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  <span className="relative">{language === 'tr' ? 'Tamam' : 'OK'}</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

// Envanter Modal
const InventoryModal = ({ isOpen, onClose, onOpenMarket, graphicsQuality = 'high', onLevelSkipped }) => {
  const [language] = useState(() => localStorage.getItem('language') || 'tr');
  const [inventory, setInventory] = useState(getInventory());
  const [selectedTab, setSelectedTab] = useState('items'); // 'items', 'badges', 'stats'
  
  // Seviye Atlama Modal State'leri
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipMode, setSkipMode] = useState('single');
  const [skipCount, setSkipCount] = useState(1);
  const [skippedWords, setSkippedWords] = useState([]);
  const [showResult, setShowResult] = useState(false);

  // Envanter güncellendiğinde yenile
  useEffect(() => {
    if (isOpen) {
      setInventory(getInventory());
      setShowSkipModal(false);
      setShowResult(false);
      setSkippedWords([]);
    }
  }, [isOpen]);

  // Seviye Atlama Modal Aç
  const openSkipModal = (mode) => {
    setSkipMode(mode);
    setSkipCount(mode === 'single' ? 1 : Math.min(inventory.skipLevelTokens, 100));
    setShowSkipModal(true);
    setShowResult(false);
    setSkippedWords([]);
    playSound('telefontıklama.mp3');
  };

  // Seviye Atlama Onayla
  const confirmSkip = () => {
    // lastPlayedLevel'dan güncel seviyeyi al
    const savedLastPlayed = localStorage.getItem('lastPlayedLevel');
    const lastPlayed = savedLastPlayed ? JSON.parse(savedLastPlayed) : null;
    const currentLevelNum = lastPlayed ? lastPlayed.id : parseInt(localStorage.getItem('currentLevel') || '1');
    console.log('🎯 Seviye Atlama - Mevcut Seviye:', currentLevelNum);
    console.log('🎯 Atlanacak Seviye Sayısı:', skipCount);
    const words = [];
    
    // Kelime bankasını al
    const wordBank = JSON.parse(localStorage.getItem('wordBank') || '[]');
    
    // Tamamlanan seviyeleri al
    const completedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[]');
    
    for (let i = 0; i < skipCount; i++) {
      const levelNumber = currentLevelNum + i;
      console.log('🎯 Atlanan Seviye:', levelNumber);
      const levelData = levels.find(l => l.id === levelNumber);
      if (levelData && levelData.words && levelData.words.length > 0) {
        const word = levelData.words[0];
        words.push({
          level: levelNumber,
          turkish: word.turkish,
          english: word.english
        });
        
        // Kelimeyi kelime bankasına ekle (eğer yoksa)
        const wordExists = wordBank.some(w => 
          w.turkish.toLowerCase() === word.turkish.toLowerCase() && 
          w.english.toLowerCase() === word.english.toLowerCase()
        );
        
        if (!wordExists) {
          wordBank.push({
            turkish: word.turkish,
            english: word.english,
            level: levelNumber,
            addedAt: new Date().toISOString()
          });
        }
        
        // Seviyeyi tamamlanmış olarak işaretle
        if (!completedLevels.includes(levelNumber)) {
          completedLevels.push(levelNumber);
        }
      }
    }
    
    // Kelime bankasını kaydet
    localStorage.setItem('wordBank', JSON.stringify(wordBank));
    
    // Tamamlanan seviyeleri kaydet
    localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
    
    // Güncel seviyeyi kaydet
    localStorage.setItem('currentLevel', String(currentLevelNum + skipCount));
    
    // lastPlayedLevel'ı da güncelle
    const newLevel = levels.find(l => l.id === currentLevelNum + skipCount);
    if (newLevel) {
      localStorage.setItem('lastPlayedLevel', JSON.stringify(newLevel));
    }
    
    // Token'ları güncelle
    const currentTokens = getSkipLevelTokenCount();
    const newTokens = Math.max(0, currentTokens - skipCount);
    const currentInventory = getInventory();
    localStorage.setItem('inventory', JSON.stringify({
      ...currentInventory,
      skipLevelTokens: newTokens,
      stats: {
        ...currentInventory.stats,
        totalSkipsUsed: (currentInventory.stats?.totalSkipsUsed || 0) + skipCount
      }
    }));
    
    setSkippedWords(words);
    setShowResult(true);
    setInventory(getInventory());
    
    // Parent component'e haber ver
    if (onLevelSkipped) {
      onLevelSkipped();
    }
    
    playSound('ödül-kazanma-sesi.mp3');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const inventoryTranslations = {
    tr: {
      title: "Envanter",
      items: "Eşyalar",
      badges: "Rozetler",
      stats: "İstatistikler",
      skipLevelTokens: "Seviye Atlama Hakları",
      skipLevelDesc: "Zorlandığın bölümleri atlamak için kullan",
      use: "Kullan",
      inGame: "Oyunda Kullan",
      noBadges: "Henüz rozet yok",
      noBadgesDesc: "Destek paketleri satın alarak rozet kazanabilirsin",
      activeFeatures: "Aktif Özellikler",
      noFeatures: "Aktif özellik yok",
      removeAdsActive: "Reklamlar Kaldırıldı",
      totalSkipsUsed: "Kullanılan Seviye Atlama",
      totalSkipsPurchased: "Satın Alınan Seviye Atlama",
      totalDiamondsSpent: "Harcanan Elmas",
      supportLevel: "Destek Seviyesi",
      none: "Yok",
      badgeCount: "Rozet Sayısı",
      empty: "Envanter boş",
      emptyDesc: "Market'ten eşya satın alabilirsin",
      goToMarket: "Market'e Git",
    },
    en: {
      title: "Inventory",
      items: "Items",
      badges: "Badges",
      stats: "Statistics",
      skipLevelTokens: "Skip Level Tokens",
      skipLevelDesc: "Use to skip difficult levels",
      use: "Use",
      inGame: "Use in Game",
      noBadges: "No badges yet",
      noBadgesDesc: "Purchase support packs to earn badges",
      activeFeatures: "Active Features",
      noFeatures: "No active features",
      removeAdsActive: "Ads Removed",
      totalSkipsUsed: "Skip Levels Used",
      totalSkipsPurchased: "Skip Levels Purchased",
      totalDiamondsSpent: "Diamonds Spent",
      supportLevel: "Support Level",
      none: "None",
      badgeCount: "Badge Count",
      empty: "Inventory is empty",
      emptyDesc: "You can purchase items from the Market",
      goToMarket: "Go to Market",
    }
  };

  const t = inventoryTranslations[language];

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

  const supportLevelNames = {
    coffee: { tr: '☕ Kahve', en: '☕ Coffee' },
    gold: { tr: '🥇 Altın', en: '🥇 Gold' },
    diamond: { tr: '💎 Elmas', en: '💎 Diamond' },
    legend: { tr: '👑 Efsane', en: '👑 Legend' }
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
              boxShadow: '0 0 60px rgba(99, 102, 241, 0.3), 0 0 100px rgba(168, 85, 247, 0.2)'
            }}
          >
            {/* Static neon border */}
            <div 
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.05)'
              }}
            />
            
            {/* Başlık */}
            <div className="relative flex justify-between items-center mb-4 z-10">
              <div className="flex items-center">
                <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">🎒 {t.title}</h2>
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
                  setSelectedTab('items');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTab === 'items'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🎒 {t.items}
              </motion.button>
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setSelectedTab('badges');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTab === 'badges'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🏅 {t.badges}
              </motion.button>
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setSelectedTab('stats');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTab === 'stats'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                📊 {t.stats}
              </motion.button>
            </div>

            {/* İçerik */}
            <style>{`
              .inventory-scroll::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div 
              className="inventory-scroll relative flex-1 overflow-y-auto space-y-3 px-1 select-none z-10" 
              style={{ 
                touchAction: 'pan-y',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Eşyalar Sekmesi */}
              {selectedTab === 'items' && (
                <>
                  {/* Seviye Atlama Hakları */}
                  {inventory.skipLevelTokens > 0 ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-2xl p-4 border-2 border-yellow-400/40 shadow-xl"
                    >
                      {graphicsQuality === 'high' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl blur-xl"
                          animate={{ 
                            opacity: [0.4, 0.7, 0.4],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      <div className="relative flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
                          <span className="text-3xl">👑</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg mb-1">{t.skipLevelTokens}</h3>
                          <p className="text-yellow-200 text-xs">{t.skipLevelDesc}</p>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-300 font-black text-3xl">{inventory.skipLevelTokens}x</div>
                        </div>
                      </div>
                      
                      <div className="relative flex gap-2">
                        <motion.button
                          onClick={() => openSkipModal('single')}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {language === 'tr' ? '1 Kullan' : 'Use 1'}
                        </motion.button>
                        {inventory.skipLevelTokens > 1 && (
                          <motion.button
                            onClick={() => openSkipModal('multiple')}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {language === 'tr' ? 'Çoklu Kullan' : 'Use Multiple'}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-white font-bold text-lg mb-2">{t.empty}</p>
                      <p className="text-gray-400 text-sm mb-4">{t.emptyDesc}</p>
                      <motion.button
                        onClick={() => {
                          playSound('telefontıklama.mp3');
                          onClose();
                          // Market'i aç
                          if (onOpenMarket) {
                            setTimeout(() => onOpenMarket(), 300);
                          }
                        }}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-xl font-bold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {t.goToMarket}
                      </motion.button>
                    </div>
                  )}

                  {/* Aktif Özellikler */}
                  {(inventory.features.removeAds || Object.values(inventory.features).some(v => v)) && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl p-4 border border-purple-400/30"
                    >
                      <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                        <span>⚡</span>
                        {t.activeFeatures}
                      </h3>
                      <div className="space-y-2">
                        {inventory.features.removeAds && (
                          <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
                            <span className="text-xl">🚫📺</span>
                            <span className="text-purple-200 text-sm">{t.removeAdsActive}</span>
                            <span className="ml-auto text-green-400 text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {/* Rozetler Sekmesi */}
              {selectedTab === 'badges' && (
                <div className="space-y-4">
                  {/* Destek Rozetleri Koleksiyonu */}
                  <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-3 sm:p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                        <span>❤️</span>
                        {language === 'tr' ? 'Destekçi Koleksiyonu' : 'Supporter Collection'}
                      </h3>
                      <span className="text-purple-300 text-xs sm:text-sm font-medium">
                        {inventory.badges.filter(b => ['supporter', 'gold_supporter', 'diamond_supporter', 'legend_supporter'].includes(b)).length}/4
                      </span>
                    </div>
                    
                    {/* 4 Rozet Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { id: 'supporter', image: '/badges/coffee_badge.png', name: language === 'tr' ? 'Kahve' : 'Coffee', gradient: 'from-amber-500 to-orange-600' },
                        { id: 'gold_supporter', image: '/badges/gold_badge.png', name: language === 'tr' ? 'Altın' : 'Gold', gradient: 'from-yellow-500 to-amber-600' },
                        { id: 'diamond_supporter', image: '/badges/diamond_badge.png', name: language === 'tr' ? 'Elmas' : 'Diamond', gradient: 'from-cyan-500 to-blue-600' },
                        { id: 'legend_supporter', image: '/badges/legend_badge.png', name: language === 'tr' ? 'Efsane' : 'Legend', gradient: 'from-purple-500 to-pink-600' }
                      ].map((badge, index) => {
                        const owned = inventory.badges.includes(badge.id);
                        return (
                          <div key={badge.id} className="flex flex-col items-center">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className={`relative aspect-square rounded-xl flex items-center justify-center p-1 overflow-hidden w-full ${
                                owned 
                                  ? `bg-gradient-to-br ${badge.gradient} shadow-lg` 
                                  : 'bg-gray-800/50 border border-gray-700/50'
                              }`}
                            >
                              <img 
                                src={badge.image} 
                                alt={badge.name} 
                                className={`w-full h-full object-cover ${owned ? '' : 'grayscale opacity-30'}`}
                                style={{ transform: 'scale(1.15)' }}
                              />
                              {owned && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-[8px]">✓</span>
                                </div>
                              )}
                            </motion.div>
                            <span className={`text-[8px] sm:text-[10px] mt-1 font-medium ${owned ? 'text-white' : 'text-gray-500'}`}>{badge.name}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* 2x Bonus Durumu */}
                    {inventory.badges.filter(b => ['supporter', 'gold_supporter', 'diamond_supporter', 'legend_supporter'].includes(b)).length === 4 ? (
                      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-lg p-2.5 border border-green-500/30">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🎉</span>
                          <div>
                            <p className="text-green-300 font-bold text-xs sm:text-sm">
                              {language === 'tr' ? '2x Elmas Bonusu Aktif!' : '2x Diamond Bonus Active!'}
                            </p>
                            <p className="text-green-200/70 text-[10px] sm:text-xs">
                              {language === 'tr' ? 'Her bölümde 2 kat elmas kazanıyorsun' : 'You earn 2x diamonds per level'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/20 rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💡</span>
                          <p className="text-gray-300 text-[10px] sm:text-xs">
                            {language === 'tr' 
                              ? `4 rozeti topla → Kalıcı 2x elmas bonusu! (${4 - inventory.badges.filter(b => ['supporter', 'gold_supporter', 'diamond_supporter', 'legend_supporter'].includes(b)).length} rozet kaldı)`
                              : `Collect 4 badges → Permanent 2x diamond bonus! (${4 - inventory.badges.filter(b => ['supporter', 'gold_supporter', 'diamond_supporter', 'legend_supporter'].includes(b)).length} badges left)`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Diğer Rozetler */}
                  {inventory.badges.filter(b => !['supporter', 'gold_supporter', 'diamond_supporter', 'legend_supporter'].includes(b)).length > 0 && (
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-3 sm:p-4 border border-gray-700/30">
                      <h3 className="text-white font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                        <span>🏆</span>
                        {language === 'tr' ? 'Diğer Rozetler' : 'Other Badges'}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {inventory.badges.filter(b => !['supporter', 'gold_supporter', 'diamond_supporter', 'legend_supporter'].includes(b)).map((badgeId, index) => {
                          const badgeInfo = getBadgeInfo(badgeId);
                          if (!badgeInfo) return null;
                          
                          return (
                            <motion.div
                              key={badgeId}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className={`bg-gradient-to-br ${badgeInfo.color} rounded-xl p-3 text-center`}
                            >
                              <div className="text-2xl mb-1">{badgeInfo.name[language].split(' ')[0]}</div>
                              <p className="text-white text-[10px] font-medium">{badgeInfo.name[language].split(' ').slice(1).join(' ')}</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Rozet Yoksa */}
                  {inventory.badges.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">🏅</div>
                      <p className="text-white font-bold text-base mb-1">{t.noBadges}</p>
                      <p className="text-gray-400 text-xs mb-4">{t.noBadgesDesc}</p>
                      <motion.button
                        onClick={() => {
                          playSound('telefontıklama.mp3');
                          onClose();
                          if (onOpenMarket) {
                            setTimeout(() => onOpenMarket(), 300);
                          }
                        }}
                        className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-5 py-2 rounded-xl font-bold text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {language === 'tr' ? '❤️ Destek Ol' : '❤️ Support'}
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {/* İstatistikler Sekmesi */}
              {selectedTab === 'stats' && (
                <div className="space-y-3">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{t.skipLevelTokens}</span>
                      <span className="text-white font-bold text-lg">{inventory.skipLevelTokens}x</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{t.totalSkipsUsed}</span>
                      <span className="text-white font-bold text-lg">{inventory.stats.totalSkipsUsed}</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{t.totalSkipsPurchased}</span>
                      <span className="text-white font-bold text-lg">{inventory.stats.totalSkipsPurchased}</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-xl p-4 border border-yellow-400/30"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-200 text-sm">{t.totalDiamondsSpent}</span>
                      <span className="text-yellow-300 font-bold text-lg flex items-center gap-1">
                        {inventory.stats.totalDiamondsSpent} <span className="text-xl">💎</span>
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-4 border border-purple-400/30"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200 text-sm">{t.supportLevel}</span>
                      <span className="text-purple-300 font-bold text-lg">
                        {inventory.stats.supportLevel 
                          ? supportLevelNames[inventory.stats.supportLevel][language]
                          : t.none
                        }
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{t.badgeCount}</span>
                      <span className="text-white font-bold text-lg">{inventory.badges.length}</span>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Seviye Atlama Modal */}
      <AnimatePresence>
        {showSkipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowSkipModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl backdrop-blur-2xl border border-purple-500/30 max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3 flex-shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                  {language === 'tr' ? '👑 Seviye Atla' : '👑 Skip Level'}
                </h2>
                <motion.button
                  onClick={() => setShowSkipModal(false)}
                  className="text-gray-400 hover:text-white bg-gray-800/70 rounded-full p-2"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {!showResult && skipMode === 'multiple' && (
                <div className="mb-4">
                  <div className="bg-black/30 rounded-xl p-4 mb-4">
                    <label className="text-white font-bold text-sm mb-2 block">
                      {language === 'tr' ? 'Kaç seviye atlamak istersin?' : 'How many levels to skip?'}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={Math.min(inventory.skipLevelTokens, 100)}
                      value={skipCount}
                      onChange={(e) => setSkipCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-yellow-300 font-black text-3xl">{skipCount}</span>
                      <span className="text-gray-400 text-sm">{language === 'tr' ? 'seviye' : 'levels'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded-xl p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">{language === 'tr' ? 'Mevcut hak:' : 'Available:'}</span>
                      <span className="text-white font-bold">{inventory.skipLevelTokens}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">{language === 'tr' ? 'Kullanılacak:' : 'Will use:'}</span>
                      <span className="text-yellow-400 font-bold">{skipCount}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">{language === 'tr' ? 'Kalacak:' : 'Remaining:'}</span>
                      <span className="text-green-400 font-bold">{inventory.skipLevelTokens - skipCount}x</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <motion.button
                      onClick={() => setShowSkipModal(false)}
                      className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {language === 'tr' ? 'İptal' : 'Cancel'}
                    </motion.button>
                    <motion.button
                      onClick={confirmSkip}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-bold"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {language === 'tr' ? 'Kullan' : 'Use'}
                    </motion.button>
                  </div>
                </div>
              )}

              {!showResult && skipMode === 'single' && (
                <div>
                  <div className="bg-black/20 rounded-xl p-4 mb-4">
                    <p className="text-gray-300 text-sm text-center mb-3">
                      {language === 'tr' ? 'Şu anki seviyeyi atlamak istediğine emin misin?' : 'Are you sure you want to skip the current level?'}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{language === 'tr' ? 'Kalan hak:' : 'Remaining:'}</span>
                      <span className="text-yellow-300 font-bold">{inventory.skipLevelTokens}x → {inventory.skipLevelTokens - 1}x</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setShowSkipModal(false)}
                      className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {language === 'tr' ? 'İptal' : 'Cancel'}
                    </motion.button>
                    <motion.button
                      onClick={confirmSkip}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-bold"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {language === 'tr' ? 'Atla' : 'Skip'}
                    </motion.button>
                  </div>
                </div>
              )}

              {showResult && skippedWords.length > 0 && (
                <div className="flex flex-col h-full">
                  {/* Çoklu açılış - Kompakt başlık */}
                  {skipCount > 1 ? (
                    <>
                      <div className="text-center mb-2">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-2xl">🎉</span>
                          <h3 className="text-white font-bold text-lg">
                            {language === 'tr' ? `${skipCount} Seviye Atlandı!` : `${skipCount} Levels Skipped!`}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-xs">
                          {language === 'tr' ? `(Seviye ${skippedWords[0].level}-${skippedWords[skippedWords.length-1].level})` : `(Level ${skippedWords[0].level}-${skippedWords[skippedWords.length-1].level})`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">📚</span>
                        <h4 className="text-yellow-300 font-bold text-xs">
                          {language === 'tr' ? 'Öğrenilen Kelimeler:' : 'Learned Words:'}
                        </h4>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-1 mb-2 pr-1" style={{ maxHeight: '45vh' }}>
                        {skippedWords.map((word, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.01 }}
                            className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg py-1 px-1.5 border border-blue-400/20 flex items-center gap-1"
                          >
                            <span className="text-[9px] text-yellow-400 font-bold flex-shrink-0 w-4">{word.level}</span>
                            <div className="flex items-center gap-0.5 flex-1 min-w-0">
                              <span className="text-[10px]">🇹🇷</span>
                              <span className="text-white font-semibold text-[11px] truncate">{word.turkish}</span>
                            </div>
                            <motion.button
                              onClick={() => {
                                playSound('telefontıklama.mp3');
                                speakWord(word.turkish, word.turkish, 'tr-TR');
                              }}
                              className="w-5 h-5 bg-red-500/30 rounded-full flex items-center justify-center flex-shrink-0"
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="text-[9px]">🔊</span>
                            </motion.button>
                            <div className="w-px h-3.5 bg-white/20"></div>
                            <div className="flex items-center gap-0.5 flex-1 min-w-0">
                              <span className="text-[10px]">🇬🇧</span>
                              <span className="text-blue-200 text-[11px] truncate">{word.english}</span>
                            </div>
                            <motion.button
                              onClick={() => {
                                playSound('telefontıklama.mp3');
                                speakWord(word.turkish, word.english, 'en-US');
                              }}
                              className="w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0"
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="text-[9px]">🔊</span>
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>

                      <div className="bg-black/20 rounded-lg p-2 mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-xs">{language === 'tr' ? 'Kalan hak:' : 'Remaining:'}</span>
                          <span className="text-yellow-300 font-bold text-sm">{inventory.skipLevelTokens}x</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Tekli açılış - Rahat tasarım */
                    <>
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-2">🎉</div>
                        <h3 className="text-white font-bold text-xl mb-1">
                          {language === 'tr' ? `Seviye ${skippedWords[0].level} Atlandı!` : `Level ${skippedWords[0].level} Skipped!`}
                        </h3>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-yellow-300 font-bold text-sm mb-2 flex items-center gap-2">
                          <span>📚</span>
                          {language === 'tr' ? 'Öğrenilen Kelimeler:' : 'Learned Words:'}
                        </h4>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1" style={{ maxHeight: '50vh' }}>
                        {skippedWords.map((word, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-2.5 border border-blue-400/30 flex items-center gap-2"
                          >
                            <span className="text-xs text-yellow-400 font-bold flex-shrink-0 bg-yellow-500/20 px-1.5 py-0.5 rounded">{word.level}</span>
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-sm">🇹🇷</span>
                              <span className="text-white font-semibold text-sm truncate">{word.turkish}</span>
                            </div>
                            <motion.button
                              onClick={() => {
                                playSound('telefontıklama.mp3');
                                speakWord(word.turkish, word.turkish, 'tr-TR');
                              }}
                              className="w-7 h-7 bg-red-500/40 rounded-full flex items-center justify-center flex-shrink-0"
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="text-xs">🔊</span>
                            </motion.button>
                            <div className="w-px h-5 bg-white/20"></div>
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-sm">🇬🇧</span>
                              <span className="text-blue-200 text-sm truncate">{word.english}</span>
                            </div>
                            <motion.button
                              onClick={() => {
                                playSound('telefontıklama.mp3');
                                speakWord(word.turkish, word.english, 'en-US');
                              }}
                              className="w-7 h-7 bg-blue-500/40 rounded-full flex items-center justify-center flex-shrink-0"
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="text-xs">🔊</span>
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>

                      <div className="bg-black/20 rounded-xl p-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{language === 'tr' ? 'Kalan hak:' : 'Remaining:'}</span>
                          <span className="text-yellow-300 font-bold text-lg">{inventory.skipLevelTokens}x</span>
                        </div>
                      </div>
                    </>
                  )}

                  <motion.button
                    onClick={() => {
                      setShowSkipModal(false);
                      setSkippedWords([]);
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {language === 'tr' ? 'Tamam' : 'OK'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

// Performans İpucu Modal - Mobil Uyumlu Yeni Tasarım
const PerformanceTipModal = ({ isOpen, onClose }) => {
  const [language] = useState(() => localStorage.getItem('language') || 'tr');
  const [isChecked, setIsChecked] = useState(false);

  const translations = {
    tr: {
      title: "Faydalı Bilgi",
      subtitle: "Oyuna başlamadan önce bilmen gereken bir şey var",
      infoTitle: "📱 Grafik Ayarları Hakkında",
      infoDesc: "Bu oyun güzel animasyonlar içeriyor. Eğer oynarken yavaşlama veya takılma hissedersen, grafik kalitesini düşürebilirsin.",
      whereTitle: "📍 Nerede bulunur?",
      whereDesc: "Ayarlar menüsünde 'Grafik Kalitesi' seçeneğini göreceksin.",
      qualityHigh: "Yüksek",
      qualityHighDesc: "En güzel görünüm",
      qualityMedium: "Orta",
      qualityMediumDesc: "Dengeli",
      qualityLow: "Düşük",
      qualityLowDesc: "En hızlı",
      tipTitle: "💡 İpucu",
      tipDesc: "Şimdilik yüksek kalitede başla. Eğer sorun yaşarsan istediğin zaman değiştirebilirsin!",
      restartNote: "Kalite değiştirince uygulama yeniden başlar (~5 sn)",
      checkbox: "Anladım!",
      button: "Oyuna Başla 🎮"
    },
    en: {
      title: "Helpful Info",
      subtitle: "Something you should know before starting",
      infoTitle: "📱 About Graphics Settings",
      infoDesc: "This game has beautiful animations. If you feel slowdown while playing, you can lower the graphics quality.",
      whereTitle: "📍 Where to find it?",
      whereDesc: "You'll see 'Graphics Quality' option in the Settings menu.",
      qualityHigh: "High",
      qualityHighDesc: "Best visuals",
      qualityMedium: "Medium",
      qualityMediumDesc: "Balanced",
      qualityLow: "Low",
      qualityLowDesc: "Fastest",
      tipTitle: "💡 Tip",
      tipDesc: "Start with high quality for now. You can change it anytime if you have issues!",
      restartNote: "App restarts when quality changes (~5 sec)",
      checkbox: "Got it!",
      button: "Start Playing 🎮"
    }
  };

  const t = translations[language];

  const handleClose = () => {
    if (isChecked) {
      localStorage.setItem('performanceTipShown', 'true');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3"
        >
          {/* Ana Kart - Mobil Uyumlu */}
          <motion.div
            className="w-full max-w-[340px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Üst Başlık - Kompakt */}
            <div className="relative bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-xl">💜</span>
                </motion.div>
                <div>
                  <h2 className="text-base font-bold text-white">{t.title}</h2>
                  <p className="text-white/70 text-[11px]">{t.subtitle}</p>
                </div>
              </div>
            </div>

            {/* İçerik - Scroll edilebilir */}
            <div className="p-3 space-y-2.5 max-h-[55vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {/* Bilgi Kartı */}
              <motion.div 
                className="bg-indigo-500/15 border border-indigo-400/30 rounded-xl p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-indigo-300 font-bold text-sm mb-1">{t.infoTitle}</h3>
                <p className="text-gray-300 text-xs leading-relaxed">{t.infoDesc}</p>
              </motion.div>

              {/* Nerede Bulunur */}
              <motion.div 
                className="bg-slate-700/40 rounded-xl p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-white font-medium text-sm mb-1.5">{t.whereTitle}</h3>
                <p className="text-gray-400 text-xs mb-2">{t.whereDesc}</p>
                
                {/* Kalite Seçenekleri - Kompakt */}
                <div className="flex gap-1.5">
                  <div className="flex-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg py-1.5 px-1 text-center">
                    <span className="text-emerald-400 text-[11px] font-bold block">🎨 {t.qualityHigh}</span>
                    <span className="text-gray-500 text-[9px]">{t.qualityHighDesc}</span>
                  </div>
                  <div className="flex-1 bg-amber-500/20 border border-amber-500/40 rounded-lg py-1.5 px-1 text-center">
                    <span className="text-amber-400 text-[11px] font-bold block">⚙️ {t.qualityMedium}</span>
                    <span className="text-gray-500 text-[9px]">{t.qualityMediumDesc}</span>
                  </div>
                  <div className="flex-1 bg-orange-500/20 border border-orange-500/40 rounded-lg py-1.5 px-1 text-center">
                    <span className="text-orange-400 text-[11px] font-bold block">⚡ {t.qualityLow}</span>
                    <span className="text-gray-500 text-[9px]">{t.qualityLowDesc}</span>
                  </div>
                </div>
              </motion.div>

              {/* İpucu */}
              <motion.div 
                className="bg-emerald-500/15 border border-emerald-400/30 rounded-xl p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-emerald-300 font-bold text-sm mb-1">{t.tipTitle}</h3>
                <p className="text-gray-300 text-xs leading-relaxed">{t.tipDesc}</p>
              </motion.div>

              {/* Yeniden Başlatma Notu - Küçük */}
              <motion.div 
                className="flex items-center gap-2 bg-slate-700/30 rounded-lg px-3 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-sm">🔄</span>
                <p className="text-gray-400 text-[10px]">{t.restartNote}</p>
              </motion.div>
            </div>

            {/* Alt Buton Alanı - Kompakt */}
            <div className="p-3 pt-2 border-t border-white/5">
              {/* Checkbox */}
              <motion.label 
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all mb-2.5 ${
                  isChecked 
                    ? 'bg-emerald-500/25 border-2 border-emerald-400/50' 
                    : 'bg-slate-700/40 border-2 border-slate-600/40'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  isChecked ? 'bg-emerald-500 border-emerald-400' : 'border-gray-500'
                }`}>
                  {isChecked && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="hidden"
                />
                <span className="text-white text-sm font-medium">{t.checkbox}</span>
              </motion.label>

              {/* Button */}
              <motion.button
                onClick={handleClose}
                disabled={!isChecked}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all text-sm ${
                  isChecked
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-purple-500/30'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
                whileHover={isChecked ? { scale: 1.02 } : {}}
                whileTap={isChecked ? { scale: 0.98 } : {}}
              >
                {t.button}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Menü Rehberi Modal - Hamburger menü ve layout butonunu öğretir
const MenuGuideModal = ({ isOpen, onClose }) => {
  const [language] = useState(() => localStorage.getItem('language') || 'tr');
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const translations = {
    tr: {
      step1Title: "Ana Menü",
      step1Desc: "Bu butona tıklayarak menüyü açabilirsin. Ayarlar, envanter ve daha fazlasına buradan ulaşabilirsin!",
      step2Title: "Kaydırarak Aç",
      step2Desc: "Ekranın sol kenarından sağa doğru kaydırarak da menüyü açabilirsin!",
      step3Title: "Görünüm Değiştir",
      step3Desc: "Bu butonla liste ve grid görünümü arasında geçiş yapabilirsin!",
      next: "İleri",
      back: "Geri",
      done: "Anladım!"
    },
    en: {
      step1Title: "Main Menu",
      step1Desc: "Tap this button to open the menu. Access settings, inventory and more from here!",
      step2Title: "Swipe to Open",
      step2Desc: "You can also swipe from the left edge of the screen to open the menu!",
      step3Title: "Change View",
      step3Desc: "Use this button to switch between list and grid view!",
      next: "Next",
      back: "Back",
      done: "Got it!"
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  const handleNext = () => {
    playSound('telefontıklama.mp3');
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      localStorage.setItem('menuGuideShown', 'true');
      onClose();
    }
  };

  const handleBack = () => {
    playSound('telefontıklama.mp3');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return { title: t.step1Title, desc: t.step1Desc };
      case 2:
        return { title: t.step2Title, desc: t.step2Desc };
      case 3:
        return { title: t.step3Title, desc: t.step3Desc };
      default:
        return { title: '', desc: '' };
    }
  };

  const content = getStepContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
        >
          {/* Adım 1: Hamburger Menü Butonu */}
          {step === 1 && (
            <>
              {/* Hamburger Menü Butonu Kopyası */}
              <motion.div
                className="absolute p-2 bg-purple-600/40 rounded-lg border-2 border-purple-400/60"
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                  left: '16px'
                }}
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.div>
              
              {/* Parmak animasyonu */}
              <motion.div
                className="absolute text-5xl"
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 70px)',
                  left: '20px'
                }}
                animate={{
                  y: [0, -10, 0],
                  rotate: [-10, 0, -10]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                👆
              </motion.div>
            </>
          )}

          {/* Adım 2: Swipe Animasyonu */}
          {step === 2 && (
            <>
              {/* Sol kenar vurgusu */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-cyan-400 to-transparent"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              {/* Swipe parmak animasyonu */}
              <motion.div
                className="absolute text-5xl"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
                initial={{ left: '10px', opacity: 1 }}
                animate={{ 
                  left: ['10px', '150px', '10px'],
                  opacity: [1, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                👉
              </motion.div>
              
              {/* Swipe çizgisi */}
              <motion.div
                className="absolute h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                style={{ top: '50%', left: '30px' }}
                initial={{ width: 0 }}
                animate={{ width: ['0px', '120px', '0px'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}

          {/* Adım 3: Layout Butonu */}
          {step === 3 && (
            <>
              {/* Layout Butonu Kopyası - Grid/List ikonu */}
              <motion.div
                className="absolute w-10 h-10 bg-gradient-to-br from-pink-600/40 to-purple-600/40 rounded-full border-2 border-pink-400/60 flex items-center justify-center"
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                  right: '16px'
                }}
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Grid ikonu */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </motion.div>
              
              {/* Parmak animasyonu */}
              <motion.div
                className="absolute text-5xl"
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 70px)',
                  right: '20px'
                }}
                animate={{
                  y: [0, -10, 0],
                  rotate: [10, 0, 10]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                👆
              </motion.div>
            </>
          )}

          {/* Açıklama Kartı */}
          <motion.div
            className="absolute left-4 right-4 bottom-24 bg-gradient-to-br from-indigo-900/95 to-purple-900/95 rounded-2xl p-5 border border-purple-400/30 shadow-2xl backdrop-blur-xl"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", damping: 20 }}
          >
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  className={`w-2 h-2 rounded-full ${s === step ? 'bg-cyan-400' : 'bg-gray-600'}`}
                  animate={s === step ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              ))}
            </div>

            {/* İçerik */}
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-white text-center mb-2">
                {content.title}
              </h3>
              <p className="text-gray-300 text-center text-sm mb-4">
                {content.desc}
              </p>
            </motion.div>

            {/* Butonlar */}
            <div className="flex gap-3">
              {step > 1 && (
                <motion.button
                  onClick={handleBack}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gray-700 hover:bg-gray-600"
                  whileTap={{ scale: 0.95 }}
                >
                  {t.back}
                </motion.button>
              )}
              <motion.button
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                {step === totalSteps ? t.done : t.next}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PhoneMenuPage = ({ onLevelsClick, lastPlayedLevel, onContinueLastLevel, onWordBankClick, onShowTutorial, onWordReviewClick, completedLevels, diamonds, setDiamonds, onLevelSkipped }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDailyQuests, setShowDailyQuests] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPerformanceTip, setShowPerformanceTip] = useState(false);
  const [showMenuGuide, setShowMenuGuide] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Redirect result'ı kontrol et
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Redirect auth başarılı:', result.user?.email);
          setGoogleUser(result.user);
          setGoogleLoading(false);
        }
      } catch (error) {
        console.error('Redirect result hatası:', error);
        setGoogleLoading(false);
      }
    };
    
    checkRedirectResult();
  }, []);

  // Google Auth durumunu dinle
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setGoogleUser(user);
      if (user) {
        localStorage.setItem('googleUser', JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        }));
      }
    });
    return () => unsubscribe();
  }, []);
  

  
  // Profil state'leri
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      name: '',
      avatarIndex: 0,
      selectedFrame: 'none'
    };
  });
  const [graphicsQuality, setGraphicsQuality] = useState(() => localStorage.getItem('graphicsQuality') || 'high');
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'tr';
  });
  const [currentLevel, setCurrentLevel] = useState(() => parseInt(localStorage.getItem('currentLevel') || '1'));
  const [localCompletedLevels, setLocalCompletedLevels] = useState(() => JSON.parse(localStorage.getItem('completedLevels') || '[]'));

  // lastPlayedLevel prop değiştiğinde currentLevel'i güncelle
  useEffect(() => {
    if (lastPlayedLevel && lastPlayedLevel.id) {
      setCurrentLevel(lastPlayedLevel.id);
    }
  }, [lastPlayedLevel]);

  // localStorage değişikliklerini dinle
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentLevel(parseInt(localStorage.getItem('currentLevel') || '1'));
      setLocalCompletedLevels(JSON.parse(localStorage.getItem('completedLevels') || '[]'));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Debug: Graphics quality değişikliğini logla
  useEffect(() => {
    console.log('🎨 Graphics Quality Changed:', graphicsQuality);
  }, [graphicsQuality]);
  
  // Layout modu için state - 'grid' veya 'list'
  const [layoutMode, setLayoutMode] = useState(() => {
    return localStorage.getItem('menuLayoutMode') || 'list';
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
  
  // Günlük önerilen koleksiyon (tek tek önerilir, günde max 3)
  const [dailySuggestedCollections, setDailySuggestedCollections] = useState(() => {
    const saved = localStorage.getItem('dailySuggestedCollections');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === getTodayDate()) {
        return data.current ? [data.current] : [];
      }
    }
    // Yeni gün - ilk öneriyi hesapla
    const currentBoxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
    const savedUnlockedLevels = parseInt(localStorage.getItem('unlockedLevels') || '1');
    const unlockedCollectionCount = Math.floor(savedUnlockedLevels / 15);
    const allBoxes = Array.from({ length: Math.max(unlockedCollectionCount, 1) }, (_, i) => ({ id: `box-${i}`, number: i + 1 }));
    const suggested = getSuggestedCollections(currentBoxProgress, allBoxes, []);
    const current = suggested.length > 0 ? suggested[0] : null;
    // Kaydet
    localStorage.setItem('dailySuggestedCollections', JSON.stringify({
      date: getTodayDate(),
      current: current,
      claimed: [],
      claimCount: 0
    }));
    return current ? [current] : [];
  });
  
  // Modal açıldığında verileri güncelle
  useEffect(() => {
    if (showDailyQuests) {
      const currentBoxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
      setBoxProgress(currentBoxProgress);
      setTodayRepeatCount(getTodayRepeatCount());
      
      // Öneriler: localStorage'dan kontrol et
      const saved = localStorage.getItem('dailySuggestedCollections');
      const savedData = saved ? JSON.parse(saved) : null;
      const isNewDay = !savedData || savedData.date !== getTodayDate();
      
      // Yeni gün - sıfırla
      if (isNewDay) {
        const savedUnlockedLevels = parseInt(localStorage.getItem('unlockedLevels') || '1');
        const unlockedCollectionCount = Math.floor(savedUnlockedLevels / 15);
        const allBoxes = Array.from({ length: Math.max(unlockedCollectionCount, 1) }, (_, i) => ({ id: `box-${i}`, number: i + 1 }));
        const suggested = getSuggestedCollections(currentBoxProgress, allBoxes, []);
        const current = suggested.length > 0 ? suggested[0] : null;
        
        setDailySuggestedCollections(current ? [current] : []);
        localStorage.setItem('dailySuggestedCollections', JSON.stringify({
          date: getTodayDate(),
          current: current,
          claimed: [],
          claimCount: 0
        }));
      } else if (savedData) {
        // Aynı gün - mevcut öneriyi yükle
        setDailySuggestedCollections(savedData.current ? [savedData.current] : []);
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
    // Günlük öneri verisini al
    const saved = localStorage.getItem('dailySuggestedCollections');
    const savedData = saved ? JSON.parse(saved) : { date: getTodayDate(), claimed: [], claimCount: 0 };
    
    // Günde max 3 öneri kontrolü
    if (savedData.claimCount >= 3) {
      return; // Günlük limit doldu
    }
    
    setAnimatedReward(2);
    setDiamondAnimation(true);
    setDiamonds(prev => prev + 2);
    
    // Claimed listesine ekle
    const newClaimed = [...(savedData.claimed || []), boxId];
    const newClaimCount = (savedData.claimCount || 0) + 1;
    
    // Yeni öneri hesapla (max 3'e ulaşmadıysa)
    let newCurrent = null;
    if (newClaimCount < 3) {
      const currentBoxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
      const savedUnlockedLevels = parseInt(localStorage.getItem('unlockedLevels') || '1');
      const unlockedCollectionCount = Math.floor(savedUnlockedLevels / 15);
      const allBoxes = Array.from({ length: Math.max(unlockedCollectionCount, 1) }, (_, i) => ({ id: `box-${i}`, number: i + 1 }));
      const suggested = getSuggestedCollections(currentBoxProgress, allBoxes, newClaimed);
      newCurrent = suggested.length > 0 ? suggested[0] : null;
    }
    
    // State ve localStorage güncelle
    setDailySuggestedCollections(newCurrent ? [newCurrent] : []);
    localStorage.setItem('dailySuggestedCollections', JSON.stringify({
      date: getTodayDate(),
      current: newCurrent,
      claimed: newClaimed,
      claimCount: newClaimCount
    }));
    
    // claimedSuggested'ı da güncelle (UI için)
    const newClaimedSuggested = {
      date: getTodayDate(),
      claimed: newClaimed
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

  // Tutorial tamamlandığında menü rehberini göster
  useEffect(() => {
    const handleTutorialComplete = () => {
      const menuGuideShown = localStorage.getItem('menuGuideShown');
      
      if (!menuGuideShown) {
        // 500ms bekle, sonra göster
        setTimeout(() => {
          setShowMenuGuide(true);
        }, 500);
      }
    };

    // Tutorial complete event'ini dinle
    window.addEventListener('tutorialComplete', handleTutorialComplete);
    
    // Sayfa yüklendiğinde de kontrol et (uygulama yeniden açıldığında)
    const menuGuideShown = localStorage.getItem('menuGuideShown');
    const performanceTipShown = localStorage.getItem('performanceTipShown');
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    
    if (tutorialCompleted === 'true' && !menuGuideShown) {
      setTimeout(() => {
        setShowMenuGuide(true);
      }, 1000);
    } else if (tutorialCompleted === 'true' && menuGuideShown && !performanceTipShown) {
      // Menü rehberi gösterilmiş ama performans ipucu gösterilmemişse
      setTimeout(() => {
        setShowPerformanceTip(true);
      }, 500);
    }

    return () => {
      window.removeEventListener('tutorialComplete', handleTutorialComplete);
    };
  }, []);

  // Menü rehberi kapandığında performans ipucunu göster
  useEffect(() => {
    if (!showMenuGuide) {
      const menuGuideShown = localStorage.getItem('menuGuideShown');
      const performanceTipShown = localStorage.getItem('performanceTipShown');
      
      if (menuGuideShown && !performanceTipShown) {
        setTimeout(() => {
          setShowPerformanceTip(true);
        }, 300);
      }
    }
  }, [showMenuGuide]);

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
    
    const handleGraphicsQualityChange = (e) => {
      setGraphicsQuality(e.detail?.quality || localStorage.getItem('graphicsQuality') || 'high');
    };
    
    window.addEventListener('storage', handleLanguageChange);
    window.addEventListener('graphicsQualityChange', handleGraphicsQualityChange);
    const interval = setInterval(handleLanguageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
      window.removeEventListener('graphicsQualityChange', handleGraphicsQualityChange);
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
      inventory: "Envanter",
      dailyQuests: "Görevler",
      leaderboard: "Sıralama",
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
      inventory: "Inventory",
      dailyQuests: "Quests",
      leaderboard: "Leaderboard",
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
      {/* Animated Background */}
      <AnimatedBackground quality={graphicsQuality} />
      
      {/* Top Bar - Sabit Üst Çubuk */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-neutral-900/95 via-indigo-950/95 to-neutral-900/95 backdrop-blur-xl border-b border-purple-500/20 shadow-lg"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
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
              animate={graphicsQuality === 'high' ? { 
                backgroundPosition: ['0%', '100%', '0%'],
              } : {}}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ 
                backgroundSize: '200% auto',
                filter: graphicsQuality === 'high' ? 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.6))' : 'none',
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
              whileHover={graphicsQuality === 'high' ? { scale: 1.05 } : {}}
            >
              {/* Parlayan Arka Plan Efekti - Sadece yüksek kalitede */}
              {graphicsQuality === 'high' && (
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
              )}
              
              {/* Elmas İkonu */}
              <motion.div
                className="relative w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center"
                animate={graphicsQuality === 'high' ? { 
                  boxShadow: [
                    '0 0 10px rgba(34, 211, 238, 0.5)',
                    '0 0 20px rgba(34, 211, 238, 0.8)',
                    '0 0 10px rgba(34, 211, 238, 0.5)',
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  className="text-sm"
                  animate={graphicsQuality === 'high' ? { 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
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
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowSidebar(false)}
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 bottom-0 w-[300px] bg-gradient-to-b from-gray-900 via-indigo-950 to-purple-900 border-r border-purple-500/30 shadow-2xl z-50 overflow-y-auto"
              style={{
                top: 'calc(env(safe-area-inset-top, 0px) + 56px)',
                paddingTop: '16px'
              }}
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
                
                {/* Profil Kartı */}
                <motion.div 
                  className="relative cursor-pointer mx-auto"
                  style={{ overflow: 'visible', margin: '65px auto 25px auto', maxWidth: '195px' }}
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowProfileEdit(true);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Çerçeve PNG - Kartın üstünde, scale ile büyütülmüş */}
                  {userProfile.selectedFrame !== 'none' && frameStyles[userProfile.selectedFrame]?.image && (
                    <>
                      {/* Glow efekti */}
                      <div 
                        className="absolute inset-0 z-5 pointer-events-none blur-xl opacity-60"
                        style={{ 
                          transform: `scale(${frameStyles[userProfile.selectedFrame]?.scale || '1.4'}) scaleY(${frameStyles[userProfile.selectedFrame]?.scaleY || '1.7'})`,
                          background: `radial-gradient(ellipse at center, ${frameStyles[userProfile.selectedFrame]?.glowColor || 'transparent'} 0%, transparent 70%)`
                        }}
                      />

                      {/* Peri tozu parçacıkları - Her zaman aktif */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full z-20 pointer-events-none"
                          style={{
                            background: frameStyles[userProfile.selectedFrame]?.sparkleColor || '#fff',
                            boxShadow: `0 0 6px ${frameStyles[userProfile.selectedFrame]?.sparkleColor || '#fff'}`,
                            top: `${15 + Math.random() * 70}%`,
                            left: `${10 + Math.random() * 80}%`,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.2, 0],
                            y: [0, -10, -20],
                          }}
                          transition={{
                            duration: 1.5 + Math.random(),
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: 'easeOut'
                          }}
                        />
                      ))}
                      <img 
                        src={frameStyles[userProfile.selectedFrame].image} 
                        alt="Frame" 
                        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                        style={{ 
                          transform: `scale(${frameStyles[userProfile.selectedFrame]?.scale || '1.4'}) scaleY(${frameStyles[userProfile.selectedFrame]?.scaleY || '1.7'})`,
                          objectFit: 'fill'
                        }}
                      />
                    </>
                  )}
                  
                  {/* Kart İçeriği - Çerçeveye göre renk değişir */}
                  <div className={`relative bg-gradient-to-br ${frameStyles[userProfile.selectedFrame]?.cardBg || 'from-indigo-500/30 via-purple-500/20 to-pink-500/30'} rounded-2xl p-4 pb-5 border-2 ${userProfile.selectedFrame !== 'none' ? 'border-transparent' : 'border-purple-400/40'} backdrop-blur-sm`} style={{ marginTop: '-8px' }}>
                    <div className="relative flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br ${avatarList[userProfile.avatarIndex]?.bg || 'from-purple-400 to-pink-400'} border-2 border-purple-400/50 flex items-center justify-center`}>
                          {avatarList[userProfile.avatarIndex]?.type === 'image' ? (
                            <img src={avatarList[userProfile.avatarIndex].src} alt="Avatar" className="w-full h-full object-cover" style={{ transform: 'scale(1.3)' }} />
                          ) : (
                            <span className="text-3xl">{avatarList[userProfile.avatarIndex]?.emoji || '😊'}</span>
                          )}
                        </div>
                        {/* Düzenle ikonu */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                          <span className="text-xs">✏️</span>
                        </div>
                      </div>
                      
                      {/* İsim ve Bilgi */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">
                          {userProfile.name || (language === 'tr' ? 'İsim Gir' : 'Enter Name')}
                        </p>
                        {/* Elmas Bakiyesi */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-sm">💎</span>
                          <span className="text-cyan-300 font-bold text-sm">{Math.floor(diamonds)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Sidebar Menu Items - Kompakt Tasarım */}
              <div className="p-3 space-y-2">
                {/* Market */}
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowSidebar(false);
                    setShowMarket(true);
                  }}
                  className="w-full relative overflow-hidden"
                  whileHover={graphicsQuality !== 'low' ? { scale: 1.02, x: 5 } : {}}
                  whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                >
                  <div className="relative flex items-center gap-2.5 p-3 bg-gradient-to-br from-yellow-500/30 via-amber-500/20 to-orange-500/30 rounded-lg border border-yellow-400/40 hover:border-yellow-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt - Sadece yüksek kalitede */}
                    {graphicsQuality === 'high' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">🛒</span>
                    </div>
                    <div className="relative flex-1 text-left min-w-0">
                      <h3 className="text-white font-bold text-base leading-tight">{language === 'tr' ? 'Market' : 'Store'}</h3>
                      <p className="text-yellow-100/80 text-[11px] font-medium leading-tight">{language === 'tr' ? 'Elmas satın al' : 'Buy diamonds'}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-4 w-4 text-yellow-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
                
                {/* Envanter */}
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowSidebar(false);
                    setShowInventory(true);
                  }}
                  className="w-full relative overflow-hidden"
                  whileHover={graphicsQuality !== 'low' ? { scale: 1.02, x: 5 } : {}}
                  whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                >
                  <div className="relative flex items-center gap-2.5 p-3 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 rounded-lg border border-indigo-400/40 hover:border-indigo-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt - Sadece yüksek kalitede */}
                    {graphicsQuality === 'high' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-300/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">🎒</span>
                    </div>
                    <div className="relative flex-1 text-left min-w-0">
                      <h3 className="text-white font-bold text-base leading-tight">{t.inventory}</h3>
                      <p className="text-indigo-100/80 text-[11px] font-medium leading-tight">{language === 'tr' ? 'Eşyalarını gör' : 'View your items'}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-4 w-4 text-indigo-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  whileHover={graphicsQuality !== 'low' ? { scale: 1.02, x: 5 } : {}}
                  whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                >
                  <div className="relative flex items-center gap-2.5 p-3 bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-lg border border-emerald-400/40 hover:border-emerald-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt - Sadece yüksek kalitede */}
                    {graphicsQuality === 'high' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">🎁</span>
                    </div>
                    <div className="relative flex-1 text-left min-w-0">
                      <h3 className="text-white font-bold text-base leading-tight">{language === 'tr' ? 'Görevler' : 'Quests'}</h3>
                      <p className="text-emerald-100/80 text-[11px] font-medium leading-tight">{language === 'tr' ? 'Ödüller kazan' : 'Earn rewards'}</p>
                    </div>
                    {claimableCount > 0 && (
                      <motion.div
                        className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg border-2 border-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {claimableCount}
                      </motion.div>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-4 w-4 text-emerald-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  whileHover={graphicsQuality !== 'low' ? { scale: 1.02, x: 5 } : {}}
                  whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                >
                  <div className="relative flex items-center gap-2.5 p-3 bg-gradient-to-br from-purple-500/30 via-indigo-500/20 to-blue-500/30 rounded-lg border border-purple-400/40 hover:border-purple-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt - Sadece yüksek kalitede */}
                    {graphicsQuality === 'high' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">⚙️</span>
                    </div>
                    <div className="relative flex-1 text-left min-w-0">
                      <h3 className="text-white font-bold text-base leading-tight">{language === 'tr' ? 'Ayarlar' : 'Settings'}</h3>
                      <p className="text-purple-100/80 text-[11px] font-medium leading-tight">{language === 'tr' ? 'Uygulama ayarları' : 'App settings'}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-4 w-4 text-purple-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  whileHover={graphicsQuality !== 'low' ? { scale: 1.02, x: 5 } : {}}
                  whileTap={graphicsQuality !== 'low' ? { scale: 0.98 } : {}}
                >
                  <div className="relative flex items-center gap-2.5 p-3 bg-gradient-to-br from-slate-500/30 via-gray-500/20 to-zinc-500/30 rounded-lg border border-slate-400/40 hover:border-slate-300/60 transition-all backdrop-blur-sm">
                    {/* Parlayan efekt - Sadece yüksek kalitede */}
                    {graphicsQuality === 'high' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">ℹ️</span>
                    </div>
                    <div className="relative flex-1 text-left min-w-0">
                      <h3 className="text-white font-bold text-base leading-tight">{language === 'tr' ? 'Hakkında' : 'About'}</h3>
                      <p className="text-slate-100/80 text-[11px] font-medium leading-tight">{language === 'tr' ? 'Uygulama bilgisi' : 'App info'}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="relative h-4 w-4 text-slate-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div 
        className="w-full h-full flex flex-col items-center pb-4 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)'
        }}
      >
      


      {/* Günlük Ödül Özel Animasyonu */}
      <AnimatePresence>
        {dailyRewardAnimation && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {/* Patlama Efekti - Merkezden Dışarı */}
            {(() => {
              const currentAnimConfig = getAnimationConfig();
              const burstCount = currentAnimConfig.quality === 'low' ? 0 : (currentAnimConfig.quality === 'medium' ? dailyRewardAmount * 4 : dailyRewardAmount * 8);
              return [...Array(burstCount)].map((_, i) => {
              const angle = (360 / burstCount) * i;
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
                    duration: currentAnimConfig.longDuration || 3.5,
                    delay: i * (currentAnimConfig.shouldAnimate ? 0.02 : 0),
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  💎
                </motion.div>
              );
            });
            })()}
            
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
        {diamondAnimation && (() => {
          const currentAnimConfig = getAnimationConfig();
          const diamondCount = currentAnimConfig.particles || 25;
          
          return (
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              {[...Array(diamondCount)].map((_, i) => {
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
                    duration: currentAnimConfig.longDuration || 2.5,
                    delay: i * (currentAnimConfig.shouldAnimate ? 0.1 : 0),
                    ease: "easeIn"
                  }}
                >
                  💎
                </motion.div>
              );
            })}
          </div>
        );
        })()}
      </AnimatePresence>

      {/* Scrollable Content Wrapper */}
      <div className="w-full flex-1 overflow-y-auto flex flex-col items-center">
        {/* Son oynanan bölüm - Özel Büyük Kart */}
        <AnimatePresence>
        {currentLevel > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md mb-6"
          >
            <div className="relative bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-2xl p-5 border-2 border-emerald-400/40 shadow-2xl backdrop-blur-sm overflow-hidden">
              {/* Parlayan Arka Plan Efekti - Sadece yüksek kalitede */}
              {graphicsQuality === 'high' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              )}
              
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
                      {currentLevel}
                    </h3>
                  </div>
                </div>
                
                {/* Alt Kısım - Devam Butonu */}
                <motion.button
                  onClick={() => {
                    playSound('hızlı geçiş.mp3');
                    const levelData = levels.find(l => l.id === currentLevel);
                    if (levelData) {
                      setTransitionLevel(levelData);
                      setShowTransition(true);
                      setTimeout(() => {
                        setShowTransition(false);
                        setTransitionLevel(null);
                        onContinueLastLevel(levelData);
                      }, 3100);
                    }
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
          quality={graphicsQuality}
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
          quality={graphicsQuality}
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
          quality={graphicsQuality}
        />
        
        {/* Sıralama butonu */}
        <GameCard
          onClick={() => {
            playSound('telefontıklama');
            setShowLeaderboard(true);
          }}
          title={t.leaderboard}
          emoji="🏆"
          delay={4}
          detailText={t.clickForDetails}
          layoutMode={layoutMode}
          quality={graphicsQuality}
        />
        </motion.div>
      </div>
      {/* End Scrollable Content Wrapper */}
      
      {/* Ayarlar Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} onShowTutorial={onShowTutorial} />
      
      {/* Market Modal */}
      <MarketModal 
        isOpen={showMarket} 
        onClose={() => setShowMarket(false)} 
        diamonds={diamonds}
        setDiamonds={setDiamonds}
        graphicsQuality={graphicsQuality} 
      />
      
      {/* Envanter Modal */}
      <InventoryModal 
        isOpen={showInventory} 
        onClose={() => setShowInventory(false)} 
        onOpenMarket={() => setShowMarket(true)}
        graphicsQuality={graphicsQuality}
        onLevelSkipped={() => {
          setCurrentLevel(parseInt(localStorage.getItem('currentLevel') || '1'));
          setLocalCompletedLevels(JSON.parse(localStorage.getItem('completedLevels') || '[]'));
          // Parent'a da haber ver (App.jsx)
          if (onLevelSkipped) {
            onLevelSkipped();
          }
        }}
      />
      
      {/* Hakkında Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      
      {/* Sıralama Modal */}
      <LeaderboardPage 
        isOpen={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)}
        currentLevel={currentLevel}
        collectionStats={{
          uniqueCount: (() => {
            const boxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
            return Object.values(boxProgress).filter(p => p.reviewCount && p.reviewCount > 0).length;
          })(),
          totalReviews: (() => {
            const boxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
            return Object.values(boxProgress).reduce((sum, p) => sum + (p.reviewCount || 0), 0);
          })()
        }}
        userProfile={userProfile}
        language={language}
      />
      
      {/* Performans İpucu Modal */}
      <PerformanceTipModal isOpen={showPerformanceTip} onClose={() => setShowPerformanceTip(false)} />
      
      {/* Profil Düzenleme Modal */}
      <AnimatePresence>
        {showProfileEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowProfileEdit(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="w-[96%] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 rounded-t-2xl border-t border-purple-500/20 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Başlık - Kompakt */}
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  👤 {language === 'tr' ? 'Profil Düzenle' : 'Edit Profile'}
                </h2>
                <motion.button
                  onClick={() => setShowProfileEdit(false)}
                  className="text-gray-400 p-1.5"
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              
              {/* Scrollable İçerik */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'none' }}>
                
                {/* Önizleme - Büyük ve Üstte */}
                <div className="flex justify-center pt-1 pb-2">
                  <div className="relative mx-auto my-4" style={{ overflow: 'visible', maxWidth: '260px' }}>
                    {/* Çerçeve PNG */}
                    {userProfile.selectedFrame !== 'none' && frameStyles[userProfile.selectedFrame]?.image && (
                      <img 
                        src={frameStyles[userProfile.selectedFrame].image} 
                        alt="Frame" 
                        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                        style={{ 
                          transform: `scale(${frameStyles[userProfile.selectedFrame]?.scale || '1.4'}) scaleY(${frameStyles[userProfile.selectedFrame]?.scaleY || '1.7'})`, 
                          objectFit: 'fill' 
                        }}
                      />
                    )}
                    
                    {/* Kart İçeriği */}
                    <div className={`relative bg-gradient-to-br ${frameStyles[userProfile.selectedFrame]?.cardBg || 'from-indigo-500/30 via-purple-500/20 to-pink-500/30'} rounded-xl p-3 border-2 ${userProfile.selectedFrame !== 'none' ? 'border-transparent' : 'border-purple-400/40'}`}>
                      <div className="flex items-center gap-3">
                        {/* Avatar - Daha büyük */}
                        <div className={`w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br ${avatarList[userProfile.avatarIndex]?.bg || 'from-purple-400 to-pink-400'} border-2 border-purple-400/50 flex-shrink-0 flex items-center justify-center ml-1`}>
                          {avatarList[userProfile.avatarIndex]?.type === 'image' ? (
                            <img src={avatarList[userProfile.avatarIndex].src} alt="Avatar" className="w-full h-full object-cover" style={{ transform: 'scale(1.3)' }} />
                          ) : (
                            <span className="text-xl">{avatarList[userProfile.avatarIndex]?.emoji || '😊'}</span>
                          )}
                        </div>
                        {/* İsim ve Elmas */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">
                            {userProfile.name || (language === 'tr' ? 'İsim Gir' : 'Enter Name')}
                          </p>
                          <p className="text-purple-200 text-[10px] flex items-center gap-1">💎 {Math.floor(diamonds)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* İsim + Google yan yana - Eşit genişlik */}
                <div className="flex gap-2">
                  {/* İsim Girişi */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => {
                        const newName = e.target.value.slice(0, 12);
                        setUserProfile(prev => ({ ...prev, name: newName }));
                      }}
                      placeholder={language === 'tr' ? 'İsim gir...' : 'Enter name...'}
                      maxLength={12}
                      className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  {/* Google Butonu - Eşit genişlik */}
                  {googleUser ? (
                    <div className="flex-1 flex items-center justify-between bg-green-900/30 border border-green-500/40 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-green-400 text-xs">{language === 'tr' ? 'Bağlı' : 'Linked'}</span>
                      </div>
                      <button
                        onClick={async () => {
                          await signOut(auth);
                          setGoogleUser(null);
                          localStorage.removeItem('googleUser');
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        setGoogleLoading(true);
                        try {
                          let user;
                          const platform = Capacitor.getPlatform();
                          const isNative = platform === 'android' || platform === 'ios';
                          console.log('Google Sign-In başlatılıyor:', { platform, isNative });
                          
                          if (isNative) {
                            console.log('Native Google Sign-In deneniyor...');
                            
                            // Network kontrolü
                            if (!navigator.onLine) {
                              throw new Error('İnternet bağlantısı yok');
                            }
                            
                            try {
                              // Plugin kontrolü
                              if (!FirebaseAuthentication || !FirebaseAuthentication.signInWithGoogle) {
                                throw new Error('FirebaseAuthentication plugin yüklenmemiş!');
                              }
                              
                              let result = await FirebaseAuthentication.signInWithGoogle();
                              console.log('FirebaseAuthentication sonucu:', result);
                              
                              if (!result || !result.credential?.idToken) {
                                throw new Error('Token alınamadı');
                              }
                              
                              const credential = GoogleAuthProvider.credential(result.credential.idToken);
                              const userCredential = await signInWithCredential(auth, credential);
                              user = userCredential.user;
                              
                            } catch (nativeError) {
                              console.error('Native auth hatası, web auth\'a geçiliyor:', nativeError);
                              
                              // Kullanıcı iptal ettiyse çık
                              if (nativeError.message?.includes('cancel') || nativeError.code === 'auth/popup-closed-by-user') {
                                setGoogleLoading(false);
                                return;
                              }
                              
                              // Native başarısız olursa browser auth dene
                              console.log('Browser auth kullanılıyor...');
                              
                              // Custom auth URL oluştur
                              const authUrl = `https://accounts.google.com/oauth/authorize?` +
                                `client_id=914621538684-dke8dmn875d916ekgprhb35jougml3rd.apps.googleusercontent.com&` +
                                `redirect_uri=https://keling-baed0.firebaseapp.com/__/auth/handler&` +
                                `response_type=code&` +
                                `scope=openid%20email%20profile&` +
                                `state=mobile_auth`;
                              
                              console.log('Auth URL:', authUrl);
                              
                              // Browser'da aç ve sonucu bekle
                              const browserResult = await Browser.open({ 
                                url: authUrl,
                                windowName: '_blank',
                                toolbarColor: '#1e1b4b',
                                presentationStyle: 'popover'
                              });
                              
                              console.log('Browser result:', browserResult);
                              
                              // Fallback: Normal popup dene
                              try {
                                console.log('Fallback popup deneniyor...');
                                const result = await signInWithPopup(auth, googleProvider);
                                user = result.user;
                              } catch (popupError) {
                                console.error('Popup da başarısız:', popupError);
                                throw new Error('Google authentication başarısız. Lütfen tekrar deneyin.');
                              }
                            }
                          } else {
                            console.log('Web Google Sign-In kullanılıyor...');
                            const result = await signInWithPopup(auth, googleProvider);
                            user = result.user;
                          }
                          
                          if (!user) {
                            console.log('User alınamadı');
                            setGoogleLoading(false);
                            return;
                          }
                          
                          console.log('Google Sign-In başarılı:', user?.email);
                          setGoogleUser(user);
                          const cloudData = await fetchUserData(user.uid);
                          const localData = getLocalGameData();
                          if (cloudData) {
                            const winner = compareProgress(localData, cloudData);
                            if (winner === 'cloud') {
                              applyCloudData(cloudData);
                            } else {
                              await saveUserData(user.uid, localData);
                            }
                            if (cloudData.userProfile) {
                              setUserProfile(cloudData.userProfile);
                              localStorage.setItem('userProfile', JSON.stringify(cloudData.userProfile));
                            }
                          } else {
                            await saveUserData(user.uid, localData);
                          }
                          const finalProfile = cloudData?.userProfile || userProfile;
                          if (user.displayName && !finalProfile.name) {
                            const newProfile = { ...finalProfile, name: user.displayName.slice(0, 12) };
                            setUserProfile(newProfile);
                            localStorage.setItem('userProfile', JSON.stringify(newProfile));
                          }
                          playSound('ödül-kazanma-sesi.mp3');
                        } catch (error) {
                          console.error('Google giriş hatası:', error);
                          // Kullanıcıya hata göster
                          alert(`Google giriş hatası: ${error.message || JSON.stringify(error)}`);
                        }
                        setGoogleLoading(false);
                      }}
                      disabled={googleLoading}
                      className="flex-1 bg-white rounded-lg px-3 py-2.5 flex items-center justify-center gap-2"
                    >
                      {googleLoading ? (
                        <span className="text-sm">⏳</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span className="text-gray-700 text-xs font-medium">{language === 'tr' ? 'Google Bağla' : 'Link Google'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Avatar Seçimi - Kompakt */}
                <div>
                  <p className="text-gray-400 text-xs mb-1.5">🎭 {language === 'tr' ? 'Avatar' : 'Avatar'}</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {avatarList.map((avatar, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          playSound('telefontıklama.mp3');
                          setUserProfile(prev => ({ ...prev, avatarIndex: index }));
                        }}
                        className={`relative w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br ${avatar.bg} flex items-center justify-center ${userProfile.avatarIndex === index ? 'ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900' : 'opacity-60'}`}
                        whileTap={{ scale: 0.9 }}
                      >
                        {avatar.type === 'image' ? (
                          <img src={avatar.src} alt="Avatar" className="w-full h-full object-cover" style={{ transform: 'scale(1.3)' }} />
                        ) : (
                          <span className="text-lg">{avatar.emoji}</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              
                {/* Çerçeve Seçimi - Önizlemeli */}
                <div>
                  <p className="text-gray-400 text-xs mb-2">🖼️ {language === 'tr' ? 'Çerçeve' : 'Frame'}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {/* Çerçeve Yok */}
                    <div 
                      onClick={() => {
                        playSound('telefontıklama.mp3');
                        setUserProfile(prev => ({ ...prev, selectedFrame: 'none' }));
                      }}
                      className={`relative aspect-square rounded-xl bg-gray-800/80 border-2 flex items-center justify-center cursor-pointer transition-all ${userProfile.selectedFrame === 'none' ? 'border-purple-500 shadow-lg shadow-purple-500/30' : 'border-gray-700 opacity-60 hover:opacity-100'}`}
                    >
                      <span className="text-gray-500 text-xl">⊘</span>
                    </div>
                    
                    {/* Çerçeveler */}
                    {[
                      { key: 'coffee', emoji: '☕', bg: 'from-amber-500 to-orange-600', name: 'Kahve' },
                      { key: 'gold', emoji: '🥇', bg: 'from-yellow-400 to-amber-500', name: 'Altın' },
                      { key: 'diamond', emoji: '💎', bg: 'from-cyan-400 to-blue-500', name: 'Elmas' },
                      { key: 'legend', emoji: '👑', bg: 'from-purple-500 to-pink-500', name: 'Efsane' }
                    ].map(frame => {
                      // Çerçeve kilidi kontrolü - satın alınan çerçevelere göre
                      const inventory = getInventory();
                      const isUnlocked = inventory?.unlockedFrames?.includes(frame.key) || false;
                      
                      return (
                      <div 
                        key={frame.key}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          !isUnlocked 
                            ? 'border-gray-700 opacity-40 cursor-not-allowed' 
                            : userProfile.selectedFrame === frame.key 
                              ? 'border-purple-500 shadow-lg shadow-purple-500/30 cursor-pointer' 
                              : 'border-gray-700 opacity-60 hover:opacity-100 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isUnlocked) {
                            playSound('tekrar-hata-sesi.mp3');
                            return;
                          }
                          playSound('telefontıklama.mp3');
                          setUserProfile(prev => ({ ...prev, selectedFrame: frame.key }));
                        }}
                      >
                        {/* Çerçeve Önizleme */}
                        {frameStyles[frame.key]?.image ? (
                          <img 
                            src={frameStyles[frame.key].image} 
                            alt={frame.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${frame.bg} flex items-center justify-center`}>
                            <span className="text-2xl">{frame.emoji}</span>
                          </div>
                        )}
                        {/* Seçili işareti */}
                        {userProfile.selectedFrame === frame.key && isUnlocked && (
                          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <span className="text-white text-[8px]">✓</span>
                          </div>
                        )}
                        {/* Kilit ikonu */}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-xl">🔒</span>
                          </div>
                        )}
                      </div>
                    );})}
                  </div>
                </div>
              
              </div>{/* Scrollable İçerik Sonu */}
              
              {/* Kaydet Butonu - Kompakt */}
              <div className="px-4 py-3 border-t border-gray-800">
                <motion.button
                  onClick={async () => {
                    playSound('ödül-kazanma-sesi.mp3');
                    localStorage.setItem('userProfile', JSON.stringify(userProfile));
                    if (auth.currentUser) {
                      await saveUserData(auth.currentUser.uid, { userProfile });
                    }
                    setShowProfileEdit(false);
                  }}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-1.5"
                  whileTap={{ scale: 0.98 }}
                >
                  ✓ {language === 'tr' ? 'Kaydet' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
                    {inProgressLevelAchievements.filter(a => !a.isFinal).map((achievement, index) => {
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

                    {/* 🎊 BÜYÜK FİNAL GÖREVİ - Özel Tasarım */}
                    {inProgressLevelAchievements.filter(a => a.isFinal).map((achievement, index) => {
                      const progress = (completedLevelsCount / achievement.target) * 100;
                      return (
                        <motion.div 
                          key={achievement.id}
                          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 mt-4"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 140, 0, 0.15) 50%, rgba(255, 69, 0, 0.15) 100%)',
                            border: '2px solid rgba(255, 215, 0, 0.4)',
                            boxShadow: '0 0 30px rgba(255, 215, 0, 0.2), inset 0 0 30px rgba(255, 215, 0, 0.05)'
                          }}
                          initial={{ y: 50, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          {/* Parlayan arka plan efekti */}
                          <motion.div
                            className="absolute inset-0 opacity-30"
                            style={{
                              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.3) 50%, transparent 70%)',
                              backgroundSize: '200% 200%'
                            }}
                            animate={{
                              backgroundPosition: ['0% 0%', '200% 200%']
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                          
                          {/* Üst kısım - Başlık ve ikon */}
                          <div className="relative flex items-center justify-center mb-3">
                            <motion.div 
                              className="text-5xl sm:text-6xl"
                              animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, -5, 5, 0]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              {achievement.icon}
                            </motion.div>
                          </div>
                          
                          <div className="relative text-center mb-3">
                            <h3 className="text-yellow-300 font-black text-lg sm:text-xl mb-1" style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                              {achievement.title[language]}
                            </h3>
                            {achievement.description && (
                              <p className="text-yellow-200/70 text-xs sm:text-sm">
                                {achievement.description[language]}
                              </p>
                            )}
                          </div>
                          
                          {/* Ödül gösterimi */}
                          <div className="relative flex items-center justify-center gap-2 mb-4">
                            <span className="text-yellow-200 text-sm">{language === 'tr' ? 'Büyük Ödül:' : 'Grand Prize:'}</span>
                            <motion.span 
                              className="text-2xl sm:text-3xl font-black text-yellow-400"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }}
                            >
                              {achievement.reward.toLocaleString()}
                            </motion.span>
                            <span className="text-2xl sm:text-3xl">💎</span>
                          </div>
                          
                          {/* İlerleme çubuğu */}
                          <div className="relative w-full h-3 sm:h-4 bg-gray-900/50 rounded-full overflow-hidden mb-2">
                            <motion.div 
                              className="h-full"
                              style={{
                                background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF8C00, #FFD700)',
                                backgroundSize: '200% 100%'
                              }}
                              initial={{ width: 0 }}
                              animate={{ 
                                width: `${progress}%`,
                                backgroundPosition: ['0% 0%', '200% 0%']
                              }}
                              transition={{ 
                                width: { duration: 1, delay: 0.5 },
                                backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
                              }}
                            />
                          </div>
                          
                          <div className="relative text-center">
                            <span className="text-yellow-300 font-bold text-sm sm:text-base">
                              {completedLevelsCount} / {achievement.target}
                            </span>
                            <span className="text-yellow-200/60 text-xs sm:text-sm ml-2">
                              ({Math.round(progress)}%)
                            </span>
                          </div>
                          
                          {/* Alt bilgi */}
                          <div className="relative mt-3 pt-3 border-t border-yellow-500/20 text-center">
                            <p className="text-yellow-200/50 text-xs">
                              {language === 'tr' 
                                ? '🏆 Finalde ödülünü al butonuyla ödülü alabilirsin' 
                                : '🏆 Claim your reward with the button in the final'}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Tamamlanmış Bölüm Başarımları */}
                    {claimedLevelAchievementsList.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h3 className="text-gray-400 text-sm font-bold mb-3">✅ {language === 'tr' ? 'Tamamlanan Görevler' : 'Completed Quests'} ({claimedLevelAchievementsList.length})</h3>
                        {claimedLevelAchievementsList.map((achievement) => (
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
                        {claimedCollectionAchievementsList.map((achievement) => (
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

                    {/* Önerilen Koleksiyon */}
                    {(() => {
                      const saved = localStorage.getItem('dailySuggestedCollections');
                      const savedData = saved ? JSON.parse(saved) : { claimCount: 0 };
                      const claimCount = savedData.date === getTodayDate() ? (savedData.claimCount || 0) : 0;
                      const hasReachedLimit = claimCount >= 3;
                      
                      return (dailySuggestedCollections.length > 0 || hasReachedLimit) && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h3 className="text-yellow-300 text-sm font-bold mb-3 flex items-center gap-2">
                          <span>💡</span>
                          {language === 'tr' ? 'Önerilen Koleksiyon' : 'Suggested Collection'}
                          <span className="text-xs text-yellow-400/70">({claimCount}/3) +2💎</span>
                        </h3>
                        {hasReachedLimit ? (
                          <p className="text-green-400 text-xs mb-3">
                            ✅ {language === 'tr' 
                              ? 'Bugünkü tüm önerileri tamamladın! Yarın yeni öneriler gelecek.' 
                              : 'You completed all suggestions today! New ones tomorrow.'}
                          </p>
                        ) : (
                        <>
                        <p className="text-gray-400 text-xs mb-3">
                          {language === 'tr' 
                            ? 'Bu koleksiyonu daha az tekrar ettin. Tekrar edersen bonus kazan!' 
                            : 'You repeated this collection less. Repeat it for bonus!'}
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
                        </>
                        )}
                      </div>
                    );
                    })()}
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
      
      {/* Menü Rehberi Modal */}
      <MenuGuideModal 
        isOpen={showMenuGuide} 
        onClose={() => setShowMenuGuide(false)} 
      />
    </div>
  );
};

export default PhoneMenuPage;
