import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const WelcomePage = ({ onStart }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'tr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const translations = {
    tr: {
      subtitle: "Oyun oynayarak İngilizce öğren. 2500+ bölüm, 2500+ kelime ve sınırsız eğlence seni bekliyor! 🚀",
      levels: "Bölüm",
      words: "Kelime",
      reward: "Ödül",
      rewardSystem: "Sistemi",
      startButton: "Hemen Başla",
      free: "Ücretsiz",
      noRegistration: "Kayıt gerektirmez",
      feature1Title: "Eğlenceli Kelime Bulmacaları",
      feature1Desc: "Harflerden kelime oluştur, bölümleri tamamla ve elmas kazan",
      feature2Title: "Sesli Telaffuz",
      feature2Desc: "Her kelimenin doğru telaffuzunu dinle ve öğren",
      feature3Title: "Hız Bonusu & Zor Modlar",
      feature3Desc: "Hızlı tamamla, bonus kazan ve zor modları açarak daha fazla elmas kazan",
      feature4Title: "Kelime Bankası & Tekrar",
      feature4Desc: "Öğrendiğin kelimeleri kaydet, 15'erli koleksiyonlarla pratik yap ve günlük görevlerle ödül kazan",
    },
    en: {
      subtitle: "Learn English by playing games. 2500+ levels, 2500+ words and unlimited fun await you! 🚀",
      levels: "Levels",
      words: "Words",
      reward: "Reward",
      rewardSystem: "System",
      startButton: "Start Now",
      free: "Free",
      noRegistration: "No registration required",
      feature1Title: "Fun Word Puzzles",
      feature1Desc: "Create words from letters, complete levels and earn diamonds",
      feature2Title: "Voice Pronunciation",
      feature2Desc: "Listen and learn the correct pronunciation of each word",
      feature3Title: "Speed Bonus & Hard Modes",
      feature3Desc: "Complete fast, earn bonuses and unlock hard modes for more diamonds",
      feature4Title: "Word Bank & Review",
      feature4Desc: "Save learned words, practice with 15-word collections and earn rewards with daily quests",
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Language Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20"
      >
        <div className="flex gap-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full p-1">
          <button
            onClick={() => setLanguage('tr')}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              language === 'tr'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🇹🇷 TR
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              language === 'en'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </motion.div>

      {/* Animated grid background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Glowing orbs - responsive sizes */}
        <motion.div
          className="absolute top-10 left-5 sm:top-20 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 right-5 sm:bottom-20 sm:right-20 w-56 h-56 sm:w-96 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-pink-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl w-full mx-auto">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-12 items-center">
          
          {/* Left side - Hero content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-3 sm:space-y-4 lg:space-y-6"
          >
            {/* Main title - Logo Style with 3D, Neon & Sparkles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative inline-block"
            >
              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
              
              {/* Text Logo - Bigger */}
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-tight relative">
                <span className="inline-flex items-baseline relative">
                  {/* 3D shadow layers for text */}
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent blur-sm translate-x-1 translate-y-1 opacity-50">
                    Keli
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 bg-clip-text text-transparent blur-md translate-x-2 translate-y-2 opacity-30">
                    Keli
                  </span>
                  
                  {/* Main text with neon glow */}
                  <motion.span 
                    className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ['0%', '100%', '0%'],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ 
                      backgroundSize: '200% auto',
                      filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 40px rgba(236, 72, 153, 0.6))',
                    }}
                  >
                    Keli
                  </motion.span>
                  
                  {/* 3D shadow layers for NG */}
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent blur-sm translate-x-1 translate-y-1 opacity-50" style={{ left: '3.2em' }}>
                    NG
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-700 to-cyan-800 bg-clip-text text-transparent blur-md translate-x-2 translate-y-2 opacity-30" style={{ left: '3.2em' }}>
                    NG
                  </span>
                  
                  {/* NG with neon glow */}
                  <motion.span 
                    className="relative bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent"
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ 
                      filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.6))',
                    }}
                  >
                    NG
                    {/* Glowing dot */}
                    <motion.span
                      className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1],
                        boxShadow: [
                          '0 0 10px rgba(34, 211, 238, 0.8)',
                          '0 0 20px rgba(34, 211, 238, 1)',
                          '0 0 10px rgba(34, 211, 238, 0.8)',
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.span>
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-lg mx-auto lg:mx-0"
            >
              {t.subtitle}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 sm:gap-4 lg:gap-6 flex-wrap justify-center lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-purple-500/50">
                  📚
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">2500+</div>
                  <div className="text-xs text-gray-500">{t.levels}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-cyan-500/50">
                  ✍️
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">2500+</div>
                  <div className="text-xs text-gray-500">{t.words}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-pink-500/50">
                  💎
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">{t.reward}</div>
                  <div className="text-xs text-gray-500">{t.rewardSystem}</div>
                </div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStart}
                className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-base sm:text-lg text-white shadow-2xl shadow-purple-500/50 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t.startButton}
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>
              
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                <div className="font-semibold text-white">{t.free}</div>
                <div>{t.noRegistration}</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Feature cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-2 sm:space-y-3 lg:space-y-4 mt-6 lg:mt-0"
          >
            {/* Feature card 1 */}
            <motion.div
              whileHover={{ scale: 1.02, x: 10 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-xl border border-purple-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-lg flex-shrink-0">
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-0.5 sm:mb-1 lg:mb-2">{t.feature1Title}</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm leading-tight">{t.feature1Desc}</p>
                </div>
              </div>
            </motion.div>

            {/* Feature card 2 */}
            <motion.div
              whileHover={{ scale: 1.02, x: 10 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 backdrop-blur-xl border border-cyan-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/0 via-cyan-600/10 to-cyan-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-lg flex-shrink-0">
                  🔊
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-0.5 sm:mb-1 lg:mb-2">{t.feature2Title}</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm leading-tight">{t.feature2Desc}</p>
                </div>
              </div>
            </motion.div>

            {/* Feature card 3 */}
            <motion.div
              whileHover={{ scale: 1.02, x: 10 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-gradient-to-br from-pink-900/40 to-pink-800/20 backdrop-blur-xl border border-pink-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600/0 via-pink-600/10 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-lg flex-shrink-0">
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-0.5 sm:mb-1 lg:mb-2">{t.feature3Title}</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm leading-tight">{t.feature3Desc}</p>
                </div>
              </div>
            </motion.div>

            {/* Feature card 4 - NEW */}
            <motion.div
              whileHover={{ scale: 1.02, x: 10 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 backdrop-blur-xl border border-emerald-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/10 to-emerald-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-lg flex-shrink-0">
                  📚
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-0.5 sm:mb-1 lg:mb-2">{t.feature4Title}</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm leading-tight">{t.feature4Desc}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
