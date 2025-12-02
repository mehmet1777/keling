import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, updateBackgroundMusicVolume } from '../utils/SoundManager';

const Settings = ({ isOpen, onClose, onShowTutorial }) => {
  const [language] = useState(() => localStorage.getItem('language') || 'tr');
  
  // Ses ayarları için state'ler
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('musicVolume');
    return saved ? parseFloat(saved) : 0.5; // Varsayılan değer: 0.5
  });

  const [voiceGender, setVoiceGender] = useState(() => {
    const saved = localStorage.getItem('voiceGender');
    return saved || 'male';
  });

  const [effectsVolume, setEffectsVolume] = useState(() => {
    const saved = localStorage.getItem('effectsVolume');
    return saved ? parseFloat(saved) : 0.7; // Varsayılan değer: 0.7
  });

  const [englishMode, setEnglishMode] = useState(() => {
    const saved = localStorage.getItem('englishMode');
    return saved === 'true';
  });

  const [showLanguageInfo, setShowLanguageInfo] = useState(false);

  const translations = {
    tr: {
      title: "Ayarlar",
      music: "Müzik",
      effects: "Efekt Sesleri",
      gameLanguage: "Oyun Dili",
      pronunciation: "Telaffuz Sesi",
      maleVoice: "Erkek Ses",
      femaleVoice: "Kadın Ses",
      howToPlay: "Nasıl Oynanır?",
      support: "Destek ve Öneri",
      on: "AÇIK",
      off: "KAPALI",
      musicPlaying: "Müzik çalıyor",
      musicOff: "Müzik kapalı",
      effectsActive: "Efektler aktif",
      effectsOff: "Efektler kapalı",
      turkish: "TÜRKÇE",
      english: "İNGİLİZCE",
      turkishToEnglish: "Türkçe → İngilizce",
      englishToTurkish: "İngilizce → Türkçe",
      understood: "Anladım!",
    },
    en: {
      title: "Settings",
      music: "Music",
      effects: "Sound Effects",
      gameLanguage: "Game Language",
      pronunciation: "Pronunciation Voice",
      maleVoice: "Male Voice",
      femaleVoice: "Female Voice",
      howToPlay: "How to Play?",
      support: "Support & Feedback",
      on: "ON",
      off: "OFF",
      musicPlaying: "Music playing",
      musicOff: "Music off",
      effectsActive: "Effects active",
      effectsOff: "Effects off",
      turkish: "TURKISH",
      english: "ENGLISH",
      turkishToEnglish: "Turkish → English",
      englishToTurkish: "English → Turkish",
      understood: "Got it!",
    }
  };

  const t = translations[language];

  // Ses ayarları değiştiğinde custom event tetikle (App.jsx için)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('volumeChange', { 
      detail: { type: 'music', volume: musicVolume } 
    }));
  }, [musicVolume]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('volumeChange', { 
      detail: { type: 'effects', volume: effectsVolume } 
    }));
  }, [effectsVolume]);

  useEffect(() => {
    localStorage.setItem('voiceGender', voiceGender);
  }, [voiceGender]);

  useEffect(() => {
    localStorage.setItem('englishMode', englishMode);
    window.dispatchEvent(new CustomEvent('englishModeChange', { 
      detail: { enabled: englishMode } 
    }));
  }, [englishMode]);

  // Ses seviyesini yüzde olarak göster
  const formatVolume = (volume) => {
    return Math.round(volume * 100);
  };

  // Tutorial'ı göster ve ayarlar penceresini kapat
  const handleShowTutorial = () => {
    playSound('telefontıklama.mp3');
    if (onShowTutorial) {
      onClose();
      onShowTutorial();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Arkaplan overlay */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Ayarlar popup */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-indigo-950 to-purple-950 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-indigo-500/20 my-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#6366F1 #1E293B'
              }}
            >
              {/* Başlık */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-300">{t.title}</h2>
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-700/50 text-white"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(79, 70, 229, 0.7)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Ses Ayarları */}
              <div className="space-y-4">
                {/* Müzik Ses Ayarı - Epic Animated Button */}
                <div className="space-y-2">
                  <label className="text-lg font-medium text-indigo-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    {t.music}
                  </label>
                  
                  <motion.button
                    onClick={() => {
                      const newVolume = musicVolume === 0 ? 0.5 : 0;
                      setMusicVolume(newVolume);
                      localStorage.setItem('musicVolume', newVolume);
                      updateBackgroundMusicVolume();
                    }}
                    className="relative w-full h-16 rounded-2xl overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Animated Background */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        background: musicVolume > 0
                          ? [
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            ]
                          : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                      }}
                      transition={{
                        duration: 3,
                        repeat: musicVolume > 0 ? Infinity : 0,
                        ease: 'linear'
                      }}
                    />
                    
                    {/* Glow Effect */}
                    {musicVolume > 0 && (
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(139, 92, 246, 0.5)',
                            '0 0 40px rgba(139, 92, 246, 0.8)',
                            '0 0 20px rgba(139, 92, 246, 0.5)',
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 h-full flex items-center justify-center gap-4">
                      {/* Icon */}
                      <motion.div
                        animate={{
                          scale: musicVolume > 0 ? [1, 1.2, 1] : 1,
                          rotate: musicVolume > 0 ? [0, 10, -10, 0] : 0
                        }}
                        transition={{
                          duration: 2,
                          repeat: musicVolume > 0 ? Infinity : 0,
                          ease: 'easeInOut'
                        }}
                      >
                        {musicVolume > 0 ? (
                          <span className="text-4xl">🎵</span>
                        ) : (
                          <span className="text-4xl opacity-50">🔇</span>
                        )}
                      </motion.div>
                      
                      {/* Text */}
                      <div className="flex flex-col items-start">
                        <motion.span
                          className="text-2xl font-bold text-white"
                          animate={{
                            scale: musicVolume > 0 ? [1, 1.05, 1] : 1
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: musicVolume > 0 ? Infinity : 0
                          }}
                        >
                          {musicVolume > 0 ? t.on : t.off}
                        </motion.span>
                        <span className="text-sm text-white/70">
                          {musicVolume > 0 ? t.musicPlaying : t.musicOff}
                        </span>
                      </div>
                    </div>
                    
                    {/* Particles */}
                    {musicVolume > 0 && (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-white rounded-full"
                            style={{
                              left: `${20 + i * 15}%`,
                              top: '50%'
                            }}
                            animate={{
                              y: [-20, -40, -20],
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: 'easeInOut'
                            }}
                          />
                        ))}
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Efekt Sesleri Ayarı - Epic Animated Button */}
                <div className="space-y-2">
                  <label className="text-lg font-medium text-indigo-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0l-2.828 2.828m0 0a9 9 0 010-12.728m2.828 2.828a5 5 0 00-1.414 1.414m0 0L3.757 8.464" />
                    </svg>
                    {t.effects}
                  </label>
                  
                  <motion.button
                    onClick={() => {
                      const newVolume = effectsVolume === 0 ? 0.7 : 0;
                      setEffectsVolume(newVolume);
                      localStorage.setItem('effectsVolume', newVolume);
                      if (newVolume > 0) playSound('telefontıklama.mp3');
                    }}
                    className="relative w-full h-16 rounded-2xl overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Animated Background */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        background: effectsVolume > 0
                          ? [
                              'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                              'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
                              'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                            ]
                          : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                      }}
                      transition={{
                        duration: 3,
                        repeat: effectsVolume > 0 ? Infinity : 0,
                        ease: 'linear'
                      }}
                    />
                    
                    {/* Glow Effect */}
                    {effectsVolume > 0 && (
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(236, 72, 153, 0.5)',
                            '0 0 40px rgba(236, 72, 153, 0.8)',
                            '0 0 20px rgba(236, 72, 153, 0.5)',
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 h-full flex items-center justify-center gap-4">
                      {/* Icon */}
                      <motion.div
                        animate={{
                          scale: effectsVolume > 0 ? [1, 1.2, 1] : 1,
                          rotate: effectsVolume > 0 ? [0, 10, -10, 0] : 0
                        }}
                        transition={{
                          duration: 2,
                          repeat: effectsVolume > 0 ? Infinity : 0,
                          ease: 'easeInOut'
                        }}
                      >
                        {effectsVolume > 0 ? (
                          <span className="text-4xl">🔊</span>
                        ) : (
                          <span className="text-4xl opacity-50">🔇</span>
                        )}
                      </motion.div>
                      
                      {/* Text */}
                      <div className="flex flex-col items-start">
                        <motion.span
                          className="text-2xl font-bold text-white"
                          animate={{
                            scale: effectsVolume > 0 ? [1, 1.05, 1] : 1
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: effectsVolume > 0 ? Infinity : 0
                          }}
                        >
                          {effectsVolume > 0 ? t.on : t.off}
                        </motion.span>
                        <span className="text-sm text-white/70">
                          {effectsVolume > 0 ? t.effectsActive : t.effectsOff}
                        </span>
                      </div>
                    </div>
                    
                    {/* Sound Waves */}
                    {effectsVolume > 0 && (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 bg-white rounded-full"
                            style={{
                              left: `${20 + i * 15}%`,
                              bottom: '30%',
                              height: '20%'
                            }}
                            animate={{
                              scaleY: [1, 2, 0.5, 1.5, 1],
                              opacity: [0.5, 1, 0.7, 1, 0.5]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: 'easeInOut'
                            }}
                          />
                        ))}
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Oyun Dili */}
                <div className="space-y-2">
                  <label className="text-lg font-medium text-indigo-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    {t.gameLanguage}
                  </label>
                  
                  <div className="flex justify-around gap-2">
                    <div 
                      className={`flex-1 p-3 rounded-xl cursor-pointer transition-all ${!englishMode ? 'bg-indigo-600/50 border-2 border-indigo-500' : 'bg-indigo-900/30 border-2 border-indigo-900/30 hover:bg-indigo-800/30'}`}
                      onClick={() => {
                        if (englishMode) setShowLanguageInfo(true);
                        setEnglishMode(false);
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-3xl mb-1">🇹🇷</span>
                        <span className="text-sm font-medium text-indigo-300">{t.turkish}</span>
                        <span className="text-xs text-indigo-400 mt-1">{t.turkishToEnglish}</span>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex-1 p-3 rounded-xl cursor-pointer transition-all ${englishMode ? 'bg-green-600/50 border-2 border-green-500' : 'bg-indigo-900/30 border-2 border-indigo-900/30 hover:bg-indigo-800/30'}`}
                      onClick={() => {
                        if (!englishMode) setShowLanguageInfo(true);
                        setEnglishMode(true);
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-3xl mb-1">🇬🇧</span>
                        <span className="text-sm font-medium text-green-300">{t.english}</span>
                        <span className="text-xs text-green-400 mt-1">{t.englishToTurkish}</span>
                      </div>
                    </div>
                  </div>
                </div>

{/* Telaffuz Ses Ayarı */}
<div className="space-y-2">
  <div className="flex justify-between items-center">
    <label className="text-lg font-medium text-indigo-200 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      {t.pronunciation}
    </label>
  </div>
  
  <div className="mt-2 flex justify-around gap-2">
    <motion.div 
      className={`flex-1 p-3 rounded-xl cursor-pointer transition-all ${voiceGender === 'male' ? 'bg-indigo-600/50 border-2 border-indigo-500' : 'bg-indigo-900/30 border-2 border-indigo-900/30 hover:bg-indigo-800/30'}`}
      onClick={() => {
        playSound('telefontıklama.mp3');
        setVoiceGender('male');
        
        const allVoices = window.speechSynthesis.getVoices();
        
        // Tüm Türkçe sesleri listele
        const turkishVoices = allVoices.filter(voice => voice.lang.startsWith('tr'));
        console.log('📋 Tüm Türkçe Sesler:', turkishVoices.map(v => ({
          name: v.name,
          lang: v.lang
        })));
        
        // Önce Türkçe
        const turkishUtterance = new SpeechSynthesisUtterance('Selam! Keling ile dil öğrenmeye hazır mısın?');
        turkishUtterance.lang = 'tr-TR';
        turkishUtterance.rate = 0.8; // Biraz daha hızlı
        turkishUtterance.pitch = 0.5; // Çok düşük pitch = çok erkeksi, David gibi
        
        const turkishVoice = turkishVoices[0]; // İlk Türkçe ses
        if (turkishVoice) {
          turkishUtterance.voice = turkishVoice;
          console.log('✅ Seçilen Türkçe Ses:', turkishVoice.name);
        } else {
          console.log('❌ Türkçe ses bulunamadı!');
        }
        
        // Sonra İngilizce
        const englishUtterance = new SpeechSynthesisUtterance('Hello! Are you ready to learn languages with Keling?');
        englishUtterance.lang = 'en-US';
        englishUtterance.rate = 0.85;
        englishUtterance.pitch = 0.5; // Çok düşük pitch = çok erkeksi, David gibi
        
        const englishMaleVoice = allVoices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('Mark') || voice.name.includes('Daniel'))
        ) || allVoices.find(voice => voice.lang.startsWith('en'));
        
        if (englishMaleVoice) {
          englishUtterance.voice = englishMaleVoice;
          console.log('🇬🇧 İngilizce Erkek Ses:', {
            name: englishMaleVoice.name,
            lang: englishMaleVoice.lang,
            localService: englishMaleVoice.localService,
            default: englishMaleVoice.default
          });
        }
        
        // Türkçe bitince İngilizce başlasın
        turkishUtterance.onend = () => {
          setTimeout(() => {
            window.speechSynthesis.speak(englishUtterance);
          }, 300);
        };
        
        window.speechSynthesis.speak(turkishUtterance);
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="mt-1 text-sm font-medium text-indigo-300">{t.maleVoice}</span>
        {voiceGender === 'male' && (
          <motion.span 
            className="mt-1 text-xs text-indigo-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🔊 {language === 'tr' ? 'Dinle' : 'Listen'}
          </motion.span>
        )}
      </div>
    </motion.div>
    
    <motion.div 
      className={`flex-1 p-3 rounded-xl cursor-pointer transition-all ${voiceGender === 'female' ? 'bg-pink-600/50 border-2 border-pink-500' : 'bg-indigo-900/30 border-2 border-indigo-900/30 hover:bg-indigo-800/30'}`}
      onClick={() => {
        playSound('telefontıklama.mp3');
        setVoiceGender('female');
        
        const allVoices = window.speechSynthesis.getVoices();
        
        // Önce Türkçe
        const turkishUtterance = new SpeechSynthesisUtterance('Selam! Keling ile dil öğrenmeye hazır mısın?');
        turkishUtterance.lang = 'tr-TR';
        turkishUtterance.rate = 0.75;
        turkishUtterance.pitch = 1.3; // Daha yüksek pitch = daha kadınsı ses
        
        const turkishVoices = allVoices.filter(voice => voice.lang.startsWith('tr'));
        const turkishVoice = turkishVoices[turkishVoices.length > 1 ? 1 : 0]; // İkinci Türkçe ses varsa onu kullan
        if (turkishVoice) {
          turkishUtterance.voice = turkishVoice;
          console.log('🇹🇷 Türkçe Kadın Ses:', {
            name: turkishVoice.name,
            lang: turkishVoice.lang,
            localService: turkishVoice.localService,
            default: turkishVoice.default
          });
        }
        
        // Sonra İngilizce
        const englishUtterance = new SpeechSynthesisUtterance('Hello! Are you ready to learn languages with Keling?');
        englishUtterance.lang = 'en-US';
        englishUtterance.rate = 0.85;
        englishUtterance.pitch = 1.3; // Daha yüksek pitch = daha kadınsı ses
        
        const englishFemaleVoice = allVoices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Victoria') || voice.name.includes('Karen') || voice.name.includes('Zira'))
        ) || allVoices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Google'));
        
        if (englishFemaleVoice) {
          englishUtterance.voice = englishFemaleVoice;
          console.log('🇬🇧 İngilizce Kadın Ses:', {
            name: englishFemaleVoice.name,
            lang: englishFemaleVoice.lang,
            localService: englishFemaleVoice.localService,
            default: englishFemaleVoice.default
          });
        }
        
        // Türkçe bitince İngilizce başlasın
        turkishUtterance.onend = () => {
          setTimeout(() => {
            window.speechSynthesis.speak(englishUtterance);
          }, 300);
        };
        
        window.speechSynthesis.speak(turkishUtterance);
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="mt-1 text-sm font-medium text-pink-300">{t.femaleVoice}</span>
        {voiceGender === 'female' && (
          <motion.span 
            className="mt-1 text-xs text-pink-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🔊 {language === 'tr' ? 'Dinle' : 'Listen'}
          </motion.span>
        )}
      </div>
    </motion.div>
  </div>
</div>

                {/* Nasıl Oynanır Butonu */}
                <div className="mt-4">
                  <motion.button
                    onClick={handleShowTutorial}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium flex items-center justify-center"
                    whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
                      <path d="M12 17h.01" strokeLinecap="round" />
                    </svg>
                    {t.howToPlay}
                  </motion.button>
                </div>

                {/* Destek ve Öneri Butonu */}
                <div className="mt-4">
                  <motion.button
                    onClick={() => {
                      const email = 'kelimegezginleri@gmail.com';
                      const subject = 'Kelime Gezginleri - Destek ve Öneri';
                      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium flex items-center justify-center"
                    whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(192, 132, 252, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t.support}
                  </motion.button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        </>
      )}
      
      {/* Dil Bilgilendirme Popup */}
      {showLanguageInfo && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLanguageInfo(false)}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[60] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-indigo-950 to-purple-950 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-indigo-500/20"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {englishMode ? '🇬🇧' : '🇹🇷'}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {englishMode ? 'İngilizce Mod' : 'Türkçe Mod'}
                </h3>
                <p className="text-indigo-200 mb-4">
                  {englishMode ? (
                    <>
                      Artık <span className="font-bold text-green-300">İngilizce harflerden</span> kelime oluşturacak ve <span className="font-bold text-green-300">Türkçe karşılıklarını</span> öğreneceksiniz!
                    </>
                  ) : (
                    <>
                      Artık <span className="font-bold text-indigo-300">Türkçe harflerden</span> kelime oluşturacak ve <span className="font-bold text-indigo-300">İngilizce karşılıklarını</span> öğreneceksiniz!
                    </>
                  )}
                </p>
                <div className="bg-indigo-900/50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-indigo-300">
                    <span className="font-bold">Örnek:</span><br/>
                    {englishMode ? (
                      <>Daireden <span className="font-bold text-green-300">"APPLE"</span> yazarsınız → <span className="font-bold">"Elma"</span> açılır</>
                    ) : (
                      <>Daireden <span className="font-bold text-indigo-300">"ELMA"</span> yazarsınız → <span className="font-bold">"Apple"</span> açılır</>
                    )}
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowLanguageInfo(false)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.understood}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Settings;
