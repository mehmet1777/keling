import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../utils/SoundManager';
import { exampleSentences } from '../data/exampleSentences';

const LEVELS_PER_PAGE = 26;

const LevelSelect = ({ 
  levels, 
  unlockedLevels, 
  completedLevels, 
  bestTimes, 
  lastTimes,
  onLevelSelect,
  lastPlayedLevel,
  onContinueLastLevel,
  onBackToPhoneMenu
}) => {
  const scrollRef = useRef(null);
  const [language] = useState(() => localStorage.getItem('language') || 'tr');

  const translations = {
    tr: {
      title: "BÖLÜMLER",
      progress: "İlerleme",
      level: "Bölüm",
      bestTime: "En İyi Süre",
      lastTime: "Son Süre",
      wordsAndExamples: "Kelimeler ve Örnek Cümleler",
      replayLevel: "🔄 Tekrar Oyna",
      cancel: "İptal",
      continueLevel: "Kaldığın Yerden Devam Et",
      continueDesc: "Bölüm"
    },
    en: {
      title: "LEVELS",
      progress: "Progress",
      level: "Level",
      bestTime: "Best Time",
      lastTime: "Last Time",
      wordsAndExamples: "Words and Example Sentences",
      replayLevel: "🔄 Replay Level",
      cancel: "Cancel",
      continueLevel: "Continue Where You Left",
      continueDesc: "Level"
    }
  };

  const t = translations[language];
  
  const initialPage = useMemo(() => {
    if (lastPlayedLevel) {
      return Math.floor((lastPlayedLevel.id - 1) / LEVELS_PER_PAGE);
    }
    return 0;
  }, [lastPlayedLevel]);
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [highlightedLevelId, setHighlightedLevelId] = useState(null);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionLevel, setTransitionLevel] = useState(null);
  const [layoutMode, setLayoutMode] = useState(() => localStorage.getItem('levelLayoutMode') || 'grid'); // 'grid' or 'list'
  const levelRefs = useRef({});
  
  // Kullanıcının erişebileceği maksimum sayfa (açık bölümlere göre)
  const maxAccessiblePage = useMemo(() => {
    // unlockedLevels kadar bölüm açık, hangi sayfaya kadar gidebilir?
    // Örn: 50 bölüm açıksa -> sayfa 0 (1-26) ve sayfa 1 (27-52) erişilebilir
    return Math.floor((unlockedLevels - 1) / LEVELS_PER_PAGE);
  }, [unlockedLevels]);
  
  const visibleLevels = useMemo(() => {
    const start = currentPage * LEVELS_PER_PAGE;
    const end = start + LEVELS_PER_PAGE;
    return levels.slice(start, end);
  }, [levels, currentPage]);

  const playSoundEffect = useCallback((soundName) => {
    try {
      // Her seferinde localStorage'dan oku (mobil uyumluluk için)
      const effectsVolume = parseFloat(localStorage.getItem('effectsVolume')) || 0.7;
      playSound(soundName, effectsVolume);
    } catch (error) {
      console.error('Ses yükleme hatası:', error);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const progressPercent = Math.round((completedLevels.size / levels.length) * 100);

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative select-none"
      style={{
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        .min-h-screen::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Dark Premium Background with Bokeh */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Glass Header - Mobile Optimized with Colorful Design */}
      <div className="sticky top-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Gradient Back Button */}
            <button
              onClick={() => {
                playSoundEffect('telefontıklama.mp3');
                onBackToPhoneMenu();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all flex-shrink-0 group"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Gradient Title with Icon */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink min-w-0">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500 rounded-full flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-wide truncate">
                {t.title}
              </h1>
            </div>

            {/* Right Side - Stats and Layout Toggle - Colorful */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Neon Stats Badge - Enhanced */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-xl text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-purple-400/40 shadow-lg shadow-purple-500/20">
                <span className="text-xs sm:text-sm">⭐</span>
                <span className="font-bold text-xs sm:text-sm bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">{completedLevels.size}</span>
              </div>
              
              {/* Layout Toggle Button - Gradient */}
              <button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  const newMode = layoutMode === 'grid' ? 'list' : 'grid';
                  setLayoutMode(newMode);
                  localStorage.setItem('levelLayoutMode', newMode);
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all flex-shrink-0 group"
              >
                {layoutMode === 'grid' ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Glass Progress Bar - Mobile Optimized */}
          <div className="mt-3 sm:mt-4 bg-white/5 backdrop-blur-xl rounded-full h-1.5 sm:h-2 overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 sm:mt-2 text-[10px] sm:text-xs">
            <span className="text-white/50">{t.progress}</span>
            <span className="font-semibold text-purple-400">{progressPercent}%</span>
          </div>

          {/* Continue Button - Kaldığın Bölüm - Mobile Optimized */}
          {lastPlayedLevel && (
            <button
              onClick={() => {
                // Ses hemen başlasın (4 saniyelik ses)
                playSoundEffect('hızlı geçiş.mp3');
                
                // Bölümün hangi sayfada olduğunu hesapla
                const targetPage = Math.floor((lastPlayedLevel.id - 1) / LEVELS_PER_PAGE);
                
                // Sayfayı değiştir
                setCurrentPage(targetPage);
                
                // Highlight'ı aktifleştir
                setHighlightedLevelId(lastPlayedLevel.id);
                
                // Sayfa değiştikten sonra scroll ve animasyon
                setTimeout(() => {
                  const levelElement = levelRefs.current[lastPlayedLevel.id];
                  if (levelElement) {
                    levelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  
                  // Highlight animasyonu (800ms) sonra geçiş animasyonunu başlat
                  setTimeout(() => {
                    setHighlightedLevelId(null);
                    setTransitionLevel(lastPlayedLevel);
                    setShowTransition(true);
                    
                    // Geçiş animasyonu bittikten sonra oyuna yönlendir
                    // Toplam: 100ms + 800ms + 3100ms = 4000ms (4 saniye)
                    setTimeout(() => {
                      setShowTransition(false);
                      setTransitionLevel(null);
                      onContinueLastLevel(lastPlayedLevel);
                    }, 3100);
                  }, 800);
                }, 100);
              }}
              className="w-full mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400/50 hover:scale-[1.01] transition-all flex items-center gap-2 sm:gap-3 group"
            >
              {/* Play Icon - Compact */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              
              {/* Text - Responsive */}
              <div className="flex-1 text-left min-w-0">
                <div className="text-white font-semibold text-xs sm:text-sm truncate">{t.continueLevel}</div>
                <div className="text-emerald-400 text-[10px] sm:text-xs">{t.continueDesc} {lastPlayedLevel.id}</div>
              </div>
              
              {/* Arrow - Compact */}
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Liquid Glass Card Level Map - Mobile Optimized */}
      <div ref={scrollRef} className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div key={currentPage} className={layoutMode === 'grid' ? 'grid grid-cols-2 gap-2 sm:gap-3' : 'space-y-2 sm:space-y-3'}>
          {visibleLevels.map((level) => {
            const isUnlocked = level.id <= unlockedLevels;
            const isCompleted = completedLevels.has(level.id);
            const isCurrent = lastPlayedLevel?.id === level.id;

            const isHighlighted = highlightedLevelId === level.id;

            return (
              <motion.button
                key={level.id}
                ref={(el) => levelRefs.current[level.id] = el}
                onClick={() => {
                  if (isUnlocked) {
                    playSoundEffect('telefontıklama.mp3');
                    if (isCompleted) {
                      setSelectedLevel(level);
                    } else {
                      onLevelSelect(level);
                    }
                  }
                }}
                disabled={!isUnlocked}
                animate={isHighlighted ? {
                  scale: [1, 1.05, 1.02, 1.05, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(16, 185, 129, 0)',
                    '0 0 30px 10px rgba(16, 185, 129, 0.6)',
                    '0 0 20px 5px rgba(16, 185, 129, 0.4)',
                    '0 0 30px 10px rgba(16, 185, 129, 0.6)',
                    '0 0 0 0 rgba(16, 185, 129, 0)'
                  ]
                } : {}}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className={`
                  relative w-full p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl
                  flex items-center gap-2 sm:gap-4
                  transition-all duration-300
                  ${isHighlighted
                    ? 'bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 backdrop-blur-2xl border-2 border-emerald-400 z-10'
                    : isCompleted 
                      ? 'bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 backdrop-blur-2xl border border-purple-500/30 hover:border-purple-400/50 hover:scale-[1.02]' 
                      : isUnlocked 
                        ? 'bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]' 
                        : 'bg-white/[0.02] backdrop-blur-xl border border-white/5 opacity-50 cursor-not-allowed'}
                  ${isCurrent && !isHighlighted ? 'ring-2 ring-purple-500/50 ring-offset-2 ring-offset-slate-900' : ''}
                `}
              >
                {/* Glass reflection */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

                {/* Level Number Badge - Compact */}
                <div className={`
                  relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-xl flex-shrink-0
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                    : isUnlocked 
                      ? 'bg-white/10 text-white/90 border border-white/20' 
                      : 'bg-white/5 text-white/30'}
                `}>
                  {isUnlocked ? level.id : '🔒'}
                  {/* Glossy shine */}
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Level Info - Responsive */}
                <div className="flex-1 text-left relative min-w-0">
                  <div className={`font-medium text-xs sm:text-base truncate ${isCompleted ? 'text-white' : isUnlocked ? 'text-white/80' : 'text-white/30'}`}>
                    {t.level} {level.id}
                  </div>
                  
                  {/* Stars - Compact */}
                  {isCompleted && (
                    <div className="flex gap-0.5 mt-0.5 sm:mt-1">
                      {(() => {
                        const time = lastTimes[level.id];
                        if (!time) return <span className="text-xs sm:text-sm">⭐</span>;
                        let stars = 1;
                        if (level.id <= 23) { if (time <= 8) stars = 3; else if (time <= 15) stars = 2; }
                        else if (level.id <= 162) { if (time <= 12) stars = 3; else if (time <= 20) stars = 2; }
                        else if (level.id <= 391) { if (time <= 18) stars = 3; else if (time <= 30) stars = 2; }
                        else if (level.id <= 941) { if (time <= 30) stars = 3; else if (time <= 50) stars = 2; }
                        else if (level.id <= 1368) { if (time <= 40) stars = 3; else if (time <= 65) stars = 2; }
                        else if (level.id <= 1696) { if (time <= 50) stars = 3; else if (time <= 80) stars = 2; }
                        else { if (time <= 60) stars = 3; else if (time <= 100) stars = 2; }
                        return Array(stars).fill('⭐').map((star, i) => (
                          <span key={i} className="text-xs sm:text-sm">{star}</span>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Time Badge - Compact */}
                {isCompleted && bestTimes[level.id] && (
                  <div className="bg-white/10 backdrop-blur-xl px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/10 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-medium text-white/80">
                      {Math.floor(bestTimes[level.id] / 60)}:{String(Math.floor(bestTimes[level.id] % 60)).padStart(2, '0')}
                    </span>
                  </div>
                )}

                {/* Arrow - Compact */}
                {isUnlocked && (
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isCompleted ? 'text-purple-400' : 'text-white/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Glass Pagination - Mobile Optimized */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 pb-6 sm:pb-8">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className={`
              w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all flex-shrink-0
              ${currentPage === 0
                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105'}
            `}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="bg-white/5 backdrop-blur-2xl px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-white/10">
            <span className="text-white font-bold text-sm sm:text-base">{currentPage + 1}</span>
            <span className="text-white/40 text-sm sm:text-base"> / {maxAccessiblePage + 1}</span>
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(maxAccessiblePage, currentPage + 1))}
            disabled={currentPage >= maxAccessiblePage}
            className={`
              w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all flex-shrink-0
              ${currentPage >= maxAccessiblePage
                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105'}
            `}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Transition Overlay - Oyuna Geçiş Animasyonu (4 saniye) */}
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
          
          {/* Arka plan parçacıkları - sabit pozisyonlar */}
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
            {/* Parlayan halka efekti - birden fazla */}
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
              {t.continueLevel}
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
                    duration: 0.5, 
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Level Details Popup */}
      {selectedLevel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedLevel(null)}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 rounded-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-3 sm:mx-4 border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#8b5cf6 #1f2937'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedLevel(null)}
              className="sticky top-0 float-right z-10 text-gray-400 hover:text-white transition-colors bg-gray-800/80 rounded-full p-2 backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Level info */}
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t.level} {selectedLevel.id}</h2>
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                {(() => {
                  const time = lastTimes[selectedLevel.id];
                  if (!time) return '⭐';
                  
                  let stars = 1;
                  
                  if (selectedLevel.id <= 23) {
                    if (time <= 8) stars = 3;
                    else if (time <= 15) stars = 2;
                  } else if (selectedLevel.id <= 162) {
                    if (time <= 12) stars = 3;
                    else if (time <= 20) stars = 2;
                  } else if (selectedLevel.id <= 391) {
                    if (time <= 18) stars = 3;
                    else if (time <= 30) stars = 2;
                  } else if (selectedLevel.id <= 941) {
                    if (time <= 30) stars = 3;
                    else if (time <= 50) stars = 2;
                  } else if (selectedLevel.id <= 1368) {
                    if (time <= 40) stars = 3;
                    else if (time <= 65) stars = 2;
                  } else if (selectedLevel.id <= 1696) {
                    if (time <= 50) stars = 3;
                    else if (time <= 80) stars = 2;
                  } else {
                    if (time <= 60) stars = 3;
                    else if (time <= 100) stars = 2;
                  }
                  
                  return '⭐'.repeat(stars);
                })()}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-purple-300 text-sm sm:text-base">{t.bestTime}</span>
                  <span className="text-white font-bold text-base sm:text-lg">
                    {bestTimes[selectedLevel.id] 
                      ? `${Math.floor(bestTimes[selectedLevel.id] / 60)}:${String(Math.floor(bestTimes[selectedLevel.id] % 60)).padStart(2, '0')}`
                      : '-'}
                  </span>
                </div>
              </div>
              
              {lastTimes[selectedLevel.id] && (
                <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700/30">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300 text-sm sm:text-base">{t.lastTime}</span>
                    <span className="text-white font-bold text-base sm:text-lg">
                      {Math.floor(lastTimes[selectedLevel.id] / 60)}:{String(Math.floor(lastTimes[selectedLevel.id] % 60)).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Words and Example Sentences */}
            {selectedLevel.words && selectedLevel.words.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">📚</span>
                  {t.wordsAndExamples}
                </h3>
                <div className="max-h-60 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2 space-y-3 sm:space-y-4 custom-scrollbar">
                  {selectedLevel.words.map((word, index) => {
                    const example = exampleSentences[word.english.toLowerCase()];
                    return (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 rounded-xl p-3 sm:p-4 border border-purple-500/20 shadow-lg hover:border-purple-500/40 transition-all"
                      >
                        {/* Word pair */}
                        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-900/30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-emerald-500/30 flex-1 min-w-0">
                            <span className="text-emerald-400 font-bold text-sm sm:text-lg truncate">{word.turkish}</span>
                          </div>
                          <div className="flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-pink-900/30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-pink-500/30 flex-1 min-w-0">
                            <span className="text-pink-400 font-bold text-sm sm:text-lg truncate">{word.english}</span>
                          </div>
                        </div>
                        
                        {/* Example sentences */}
                        {example && (
                          <div className="space-y-1.5 sm:space-y-2 bg-indigo-950/30 rounded-lg p-2 sm:p-3 border border-indigo-500/20">
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <span className="text-emerald-400 text-xs mt-0.5 flex-shrink-0">🇹🇷</span>
                              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{example.turkish}</p>
                            </div>
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <span className="text-pink-400 text-xs mt-0.5 flex-shrink-0">🇬🇧</span>
                              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed italic">{example.english}</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 sm:space-y-3">
              <motion.button
                onClick={() => {
                  playSoundEffect('telefontıklama.mp3');
                  setSelectedLevel(null);
                  onLevelSelect(selectedLevel);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 sm:py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg text-sm sm:text-base"
              >
                {t.replayLevel}
              </motion.button>
              
              <motion.button
                onClick={() => {
                  playSoundEffect('telefontıklama.mp3');
                  setSelectedLevel(null);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gray-800/70 text-white font-bold py-3 sm:py-4 rounded-xl hover:bg-gray-700/70 transition-all border border-gray-700/30 text-sm sm:text-base"
              >
                {t.cancel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LevelSelect;
