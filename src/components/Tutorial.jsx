import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../utils/SoundManager';

const Tutorial = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [language] = useState(() => localStorage.getItem('language') || 'tr');

  const translations = {
    tr: {
      title: "Nasıl Oynanır?",
      step1Title: "Daireden Kelime Bul",
      step1Desc: "Dairenin içindeki harfleri parmağınla birleştirerek kelimeleri oluştur! Harfler birbirine bağlı olmalı. Bulduğun kelimelerin karşılıklarını öğren!",
      step2Title: "Elmas Kazan",
      step2Desc: "Her bölümü tamamladığında elmas kazanırsın! Hızlı bitirirsen bonus elmas! Elmasları joker almak için kullanabilirsin.",
      step3Title: "Jokerler",
      step3Desc: "Takıldığında joker kullan! İpucu, Harf Göster veya Kelime Çöz. Her joker farklı miktarda elmas harcar.",
      step4Title: "Zor Mod",
      step4Desc: "Daha fazla elmas için Zor Mod'u aç! 3 seviye zorluk var: Kolay (+2 harf), Orta (+4 harf), Zor (+6 harf). Daha fazla elmas kazan!",
      step5Title: "Kelime Bankası & Görevler",
      step5Desc: "Öğrendiğin kelimeleri Kelime Bankası'nda sakla ve tekrar et! Görevleri tamamla, ödül kazan. Günlük giriş bonusu al!",
      back: "Geri",
      next: "İleri",
      start: "Başla",
      hint: "İpucu",
      showLetter: "Harf Göster",
      solveWord: "Kelime Çöz",
      hardMode: "ZOR",
      moreGems: "Daha Fazla Elmas!",
      speedBonus: "Hız Bonusu!",
      words: "Kelimeler",
      review: "Tekrar Et",
      quests: "Görevler",
      dailyReward: "Günlük Ödül",
    },
    en: {
      title: "How to Play?",
      step1Title: "Find Words from Circle",
      step1Desc: "Connect letters in the circle with your finger to form words! Letters must be connected. Learn the meanings of the words you find!",
      step2Title: "Earn Diamonds",
      step2Desc: "Earn diamonds when you complete each level! Finish fast for bonus diamonds! Use diamonds to buy jokers.",
      step3Title: "Jokers",
      step3Desc: "Use jokers when stuck! Hint, Show Letter, or Solve Word. Each joker costs different amounts of diamonds.",
      step4Title: "Hard Mode",
      step4Desc: "Turn on Hard Mode for more diamonds! 3 difficulty levels: Easy (+2 letters), Medium (+4 letters), Hard (+6 letters). Earn more diamonds!",
      step5Title: "Word Bank & Quests",
      step5Desc: "Save learned words in Word Bank and review them! Complete quests, earn rewards. Get daily login bonus!",
      back: "Back",
      next: "Next",
      start: "Start",
      hint: "Hint",
      showLetter: "Show Letter",
      solveWord: "Solve Word",
      hardMode: "HARD",
      moreGems: "More Gems!",
      speedBonus: "Speed Bonus!",
      words: "Words",
      review: "Review",
      quests: "Quests",
      dailyReward: "Daily Reward",
    }
  };

  const t = translations[language];
  
  const nextStep = () => {
    playSound('telefontıklama.mp3');
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Tutorial tamamlandı
      onComplete();
      // Tutorial'ı bir daha gösterme
      localStorage.setItem('tutorialCompleted', 'true');
    }
  };

  const prevStep = () => {
    playSound('telefontıklama.mp3');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Animasyon varyantları
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
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gradient-to-br from-gray-900/90 via-indigo-950/90 to-purple-900/90 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl backdrop-blur-sm"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Tutorial Başlık */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="w-1.5 h-8 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">{t.title}</h2>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-purple-500/20 shadow-inner flex items-center">
              <span className="text-purple-400 font-bold">{step}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-300">{totalSteps}</span>
            </div>
          </div>
          
          {/* Tutorial İçerik */}
          <div className="min-h-[220px] flex items-center justify-center mb-6">
            {step === 1 && (
              <motion.div 
                className="text-center px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key="step1"
              >
                <motion.div 
                  className="text-6xl mb-5 inline-block"
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                >
                  ⭕
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {t.step1Title}
                </motion.h3>
                <motion.div
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-purple-500/20 shadow-inner mb-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2 text-2xl mb-2">
                    <span className="text-purple-400">K</span>
                    <span className="text-pink-400">→</span>
                    <span className="text-purple-400">E</span>
                    <span className="text-pink-400">→</span>
                    <span className="text-purple-400">D</span>
                    <span className="text-pink-400">→</span>
                    <span className="text-purple-400">İ</span>
                  </div>
                </motion.div>
                <motion.p 
                  className="text-white/80 leading-relaxed text-sm"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {t.step1Desc}
                </motion.p>
              </motion.div>
            )}
            
            {step === 2 && (
              <motion.div 
                className="text-center px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key="step2"
              >
                <motion.div 
                  className="text-6xl mb-5 inline-block"
                  initial={{ scale: 0.8, rotate: 5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                >
                  💎
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {t.step2Title}
                </motion.h3>
                <motion.div
                  className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-3 border border-yellow-500/20 shadow-lg backdrop-blur-sm mb-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <motion.span 
                      className="text-3xl"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, 0, -10, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity
                      }}
                    >
                      💎
                    </motion.span>
                    <div className="text-yellow-300 font-bold text-lg">+1</div>
                    <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full mx-1"></div>
                    <div className="text-yellow-300 font-medium text-sm">{t.speedBonus}</div>
                  </div>
                </motion.div>
                <motion.p 
                  className="text-white/80 leading-relaxed text-sm"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {t.step2Desc}
                </motion.p>
              </motion.div>
            )}
            
            {step === 3 && (
              <motion.div 
                className="text-center px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key="step3"
              >
                <motion.div 
                  className="text-6xl mb-5 inline-block"
                  initial={{ scale: 0.8, rotate: 5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                >
                  🃏
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {t.step3Title}
                </motion.h3>
                <motion.div
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-purple-500/20 shadow-inner mb-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600/30 border border-purple-500/30">
                      <span className="text-xs font-medium text-purple-300">{t.hint}</span>
                      <span className="text-xs text-yellow-400">💎0.5</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-600/30 border border-pink-500/30">
                      <span className="text-xs font-medium text-pink-300">{t.showLetter}</span>
                      <span className="text-xs text-yellow-400">💎1</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/30">
                      <span className="text-xs font-medium text-indigo-300">{t.solveWord}</span>
                      <span className="text-xs text-yellow-400">💎2</span>
                    </div>
                  </div>
                </motion.div>
                <motion.p 
                  className="text-white/80 leading-relaxed text-sm"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {t.step3Desc}
                </motion.p>
              </motion.div>
            )}
            
            {step === 4 && (
              <motion.div 
                className="text-center px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key="step4"
              >
                <motion.div 
                  className="text-6xl mb-5 inline-block"
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                >
                  🔥
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {t.step4Title}
                </motion.h3>
                <motion.div
                  className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-xl p-3 border border-red-500/20 shadow-lg backdrop-blur-sm mb-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="px-2 py-1 rounded-lg bg-red-600/30 border border-red-500/30">
                        <span className="text-xs font-bold text-red-300">Kolay +2</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-orange-600/30 border border-orange-500/30">
                        <span className="text-xs font-bold text-orange-300">Orta +4</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-yellow-600/30 border border-yellow-500/30">
                        <span className="text-xs font-bold text-yellow-300">Zor +6</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-orange-300 font-medium text-sm">{t.moreGems}</span>
                      <span className="text-2xl">💎</span>
                    </div>
                  </div>
                </motion.div>
                <motion.p 
                  className="text-white/80 leading-relaxed text-sm"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {t.step4Desc}
                </motion.p>
              </motion.div>
            )}
            
            {step === 5 && (
              <motion.div 
                className="text-center px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key="step5"
              >
                <motion.div 
                  className="text-6xl mb-5 inline-block"
                  initial={{ scale: 0.8, rotate: 5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                >
                  📚
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {t.step5Title}
                </motion.h3>
                <motion.div
                  className="space-y-2 mb-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📝</span>
                        <span className="text-white text-sm font-medium">{t.words}</span>
                      </div>
                      <span className="text-xs text-purple-300">{t.review}</span>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-indigo-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎯</span>
                        <span className="text-white text-sm font-medium">{t.quests}</span>
                      </div>
                      <span className="text-xs text-indigo-300">💎</span>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-yellow-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎁</span>
                        <span className="text-white text-sm font-medium">{t.dailyReward}</span>
                      </div>
                      <span className="text-xs text-yellow-300">+3-6💎</span>
                    </div>
                  </div>
                </motion.div>
                <motion.p 
                  className="text-white/80 leading-relaxed text-sm"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {t.step5Desc}
                </motion.p>
              </motion.div>
            )}
          </div>
          
          {/* Tutorial Navigasyon Butonları */}
          <div className="flex justify-between items-center">
            {step > 1 ? (
              <motion.button
                className="px-4 py-2 bg-gray-800/70 backdrop-blur-sm rounded-xl text-white border border-gray-700/30 flex items-center gap-2"
                onClick={prevStep}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(31, 41, 55, 0.8)" }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>{t.back}</span>
              </motion.button>
            ) : (
              <div></div>
            )}
            
            <motion.button
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium shadow-lg flex items-center gap-2"
              onClick={nextStep}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 0 20px rgba(192, 132, 252, 0.5)",
                backgroundImage: "linear-gradient(to right, #9333ea, #ec4899)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{step === totalSteps ? t.start : t.next}</span>
              {step === totalSteps ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </motion.button>
          </div>
          
          {/* İlerleme Çubuğu */}
          <div className="mt-6 bg-gray-800/50 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: `${(step / totalSteps) * 100}%` }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Tutorial; 