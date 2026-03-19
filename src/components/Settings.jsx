import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, updateBackgroundMusicVolume } from '../utils/SoundManager';
import { playDemoVoice, setVoiceGender as setTTSVoiceGender } from '../utils/ttsService';
import { scheduleMorningReminder, scheduleAfternoonReminder, scheduleEveningReminder, scheduleStreakReminder, cancelNotification, NOTIFICATION_IDS } from '../utils/notificationService';

const Settings = ({ isOpen, onClose, onShowTutorial }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'tr');
  
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('musicVolume');
    return saved ? parseFloat(saved) : 0.5;
  });

  const [voiceGender, setVoiceGender] = useState(() => {
    const saved = localStorage.getItem('voiceGender');
    return saved || 'male';
  });

  const [effectsVolume, setEffectsVolume] = useState(() => {
    const saved = localStorage.getItem('effectsVolume');
    return saved ? parseFloat(saved) : 0.7;
  });

  const [englishMode, setEnglishMode] = useState(() => {
    const saved = localStorage.getItem('englishMode');
    return saved === 'true';
  });

  const [showLanguageInfo, setShowLanguageInfo] = useState(false);
  const [showRestartPopup, setShowRestartPopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [pendingGraphicsQuality, setPendingGraphicsQuality] = useState(null);

  const [graphicsQuality, setGraphicsQuality] = useState(() => {
    const saved = localStorage.getItem('graphicsQuality');
    return saved || 'high';
  });

  const [morningReminderEnabled, setMorningReminderEnabled] = useState(() => {
    const saved = localStorage.getItem('morningReminderEnabled');
    return saved !== 'false';
  });

  const [afternoonReminderEnabled, setAfternoonReminderEnabled] = useState(() => {
    const saved = localStorage.getItem('afternoonReminderEnabled');
    return saved !== 'false';
  });

  const [eveningReminderEnabled, setEveningReminderEnabled] = useState(() => {
    const saved = localStorage.getItem('eveningReminderEnabled');
    return saved !== 'false';
  });

  const [streakReminderEnabled, setStreakReminderEnabled] = useState(() => {
    const saved = localStorage.getItem('streakReminderEnabled');
    return saved !== 'false';
  });

  const [morningTime, setMorningTime] = useState(() => {
    const saved = localStorage.getItem('morningReminderTime');
    return saved ? JSON.parse(saved) : { hour: 10, minute: 0 };
  });

  const [afternoonTime, setAfternoonTime] = useState(() => {
    const saved = localStorage.getItem('afternoonReminderTime');
    return saved ? JSON.parse(saved) : { hour: 17, minute: 0 };
  });

  const [eveningTime, setEveningTime] = useState(() => {
    const saved = localStorage.getItem('eveningReminderTime');
    return saved ? JSON.parse(saved) : { hour: 20, minute: 30 };
  });

  const [showTimePickerFor, setShowTimePickerFor] = useState(null);
  const [tempTime, setTempTime] = useState({ hour: 10, minute: 0 });

  const translations = {
    tr: {
      title: "Ayarlar",
      music: "Müzik",
      effects: "Efekt Sesleri",
      gameLanguage: "Oyun Dili",
      pronunciation: "Telaffuz Sesi",
      maleVoice: "Erkek Ses",
      femaleVoice: "Kadın Ses",
      graphicsQuality: "Grafik Kalitesi",
      high: "Yüksek",
      medium: "Orta",
      low: "Düşük",
      graphicsDesc: "Eski telefonlarda düşük kalite önerilir",
      howToPlay: "Nasıl Oynanır?",
      support: "Destek ve Öneri",
      on: "AÇIK",
      off: "KAPALI",
      turkish: "TÜRKÇE",
      english: "İNGİLİZCE",
      turkishToEnglish: "Türkçe → İngilizce",
      englishToTurkish: "İngilizce → Türkçe",
      understood: "Anladım!",
      restartTitle: "Yeniden Başlatma Gerekli",
      restartMessage: "Grafik ayarlarının geçerli olması için uygulama yeniden başlatılacak.",
      restartDuration: "Bu işlem en fazla 5 saniye sürer.",
      restartButton: "Tamam",
      cancelButton: "İptal",
      notifications: "Bildirimler",
      morningReminder: "☀️ Sabah (10:00)",
      morningReminderDesc: "Güne kelimelerle başla!",
      afternoonReminder: "🌤️ Öğleden Sonra (17:00)",
      afternoonReminderDesc: "Kısa bir mola, birkaç kelime?",
      eveningReminder: "🌙 Akşam (20:30)",
      eveningReminderDesc: "Günü tamamla!",
      streakReminder: "🔥 Seri Koruma",
      streakReminderDesc: "Seriniz kırılmadan önce hatırlat",
      interfaceLanguage: "Arayüz Dili",
      interfaceTurkish: "Türkçe",
      interfaceEnglish: "İngilizce",
    },
    en: {
      title: "Settings",
      music: "Music",
      effects: "Sound Effects",
      gameLanguage: "Game Language",
      pronunciation: "Pronunciation Voice",
      maleVoice: "Male Voice",
      femaleVoice: "Female Voice",
      graphicsQuality: "Graphics Quality",
      high: "High",
      medium: "Medium",
      low: "Low",
      graphicsDesc: "Low quality recommended for older phones",
      howToPlay: "How to Play?",
      support: "Support & Feedback",
      on: "ON",
      off: "OFF",
      turkish: "TURKISH",
      english: "ENGLISH",
      turkishToEnglish: "Turkish → English",
      englishToTurkish: "English → Turkish",
      understood: "Got it!",
      restartTitle: "Restart Required",
      restartMessage: "The app will restart to apply graphics settings.",
      restartDuration: "This will take at most 5 seconds.",
      restartButton: "OK",
      cancelButton: "Cancel",
      notifications: "Notifications",
      morningReminder: "☀️ Morning (10:00)",
      morningReminderDesc: "Start your day with words!",
      afternoonReminder: "🌤️ Afternoon (17:00)",
      afternoonReminderDesc: "Quick break, a few words?",
      eveningReminder: "🌙 Evening (20:30)",
      eveningReminderDesc: "Complete your day!",
      streakReminder: "🔥 Streak Protection",
      streakReminderDesc: "Remind before streak breaks",
      interfaceLanguage: "Interface Language",
      interfaceTurkish: "Turkish",
      interfaceEnglish: "English",
    }
  };

  const t = translations[language];

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

  const handleInterfaceLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    const newEnglishMode = newLang === 'en';
    setEnglishMode(newEnglishMode);
    localStorage.setItem('englishMode', newEnglishMode.toString());
  };

  useEffect(() => {
    localStorage.setItem('englishMode', englishMode);
    window.dispatchEvent(new CustomEvent('englishModeChange', { 
      detail: { enabled: englishMode } 
    }));
  }, [englishMode]);

  useEffect(() => {
    localStorage.setItem('morningReminderEnabled', morningReminderEnabled.toString());
    if (morningReminderEnabled) {
      scheduleMorningReminder();
    } else {
      cancelNotification(NOTIFICATION_IDS.MORNING_REMINDER);
    }
  }, [morningReminderEnabled]);

  useEffect(() => {
    localStorage.setItem('afternoonReminderEnabled', afternoonReminderEnabled.toString());
    if (afternoonReminderEnabled) {
      scheduleAfternoonReminder();
    } else {
      cancelNotification(NOTIFICATION_IDS.AFTERNOON_REMINDER);
    }
  }, [afternoonReminderEnabled]);

  useEffect(() => {
    localStorage.setItem('eveningReminderEnabled', eveningReminderEnabled.toString());
    if (eveningReminderEnabled) {
      scheduleEveningReminder();
    } else {
      cancelNotification(NOTIFICATION_IDS.EVENING_REMINDER);
    }
  }, [eveningReminderEnabled]);

  useEffect(() => {
    localStorage.setItem('streakReminderEnabled', streakReminderEnabled.toString());
    if (streakReminderEnabled) {
      scheduleStreakReminder();
    } else {
      cancelNotification(NOTIFICATION_IDS.STREAK_REMINDER);
    }
  }, [streakReminderEnabled]);

  const handleShowTutorial = () => {
    playSound('telefontıklama.mp3');
    if (onShowTutorial) {
      onClose();
      onShowTutorial();
    }
  };

  return (
    <>
      {/* Grafik Ayarı Yeniden Başlatma Popup */}
      <AnimatePresence>
        {showRestartPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              className="absolute w-20 h-20 bg-gradient-to-br from-stone-700/60 to-neutral-800/60 rounded-2xl border-2 border-amber-500/60 flex items-center justify-center"
              style={{ top: '20%', left: '50%', transform: 'translateX(-50%)' }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
              transition={{ scale: { duration: 1.5, repeat: Infinity }, rotate: { duration: 2, ease: "easeInOut" } }}
            >
              <span className="text-5xl">🔄</span>
            </motion.div>

            <motion.div
              className="absolute left-4 right-4 bottom-24 bg-gradient-to-b from-stone-900 via-neutral-950 to-zinc-950 rounded-2xl p-5 border border-amber-700/40 shadow-2xl"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 20 }}
            >
              <h3 className="text-xl font-bold text-white text-center mb-3">{t.restartTitle}</h3>
              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <p className="text-gray-300 text-sm text-center leading-relaxed">{t.restartMessage}</p>
                <p className="text-amber-400 text-xs text-center mt-2 flex items-center justify-center gap-1">
                  <span>⏱️</span>{t.restartDuration}
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => { playSound('telefontıklama.mp3'); setShowRestartPopup(false); setPendingGraphicsQuality(null); }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-zinc-700/80 border border-zinc-600"
                  whileTap={{ scale: 0.95 }}
                >{t.cancelButton}</motion.button>
                <motion.button
                  onClick={() => { playSound('telefontıklama.mp3'); if (pendingGraphicsQuality) { localStorage.setItem('graphicsQuality', pendingGraphicsQuality); window.location.reload(); } }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg"
                  whileTap={{ scale: 0.95 }}
                >{t.restartButton}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-b from-stone-900 via-neutral-950 to-zinc-950 rounded-2xl overflow-hidden border border-amber-700/40 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#78716c #1c1917' }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-3 border-b border-white/10 sticky top-0 z-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⚙️</span>
                      <h2 className="text-xl font-bold text-white">{t.title}</h2>
                    </div>
                    <motion.button
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">

                  {/* Ses Ayarları - Tek Kart */}
                  <div className="bg-gradient-to-r from-stone-800/70 to-neutral-700/60 rounded-xl p-3 border border-purple-500/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔉</span>
                      <span className="text-white text-sm font-medium">{language === 'tr' ? 'Ses Ayarları' : 'Sound Settings'}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Müzik */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎵</span>
                          <span className="text-gray-300 text-sm">{t.music}</span>
                        </div>
                        <motion.button
                          onClick={() => {
                            const newVolume = musicVolume === 0 ? 0.5 : 0;
                            setMusicVolume(newVolume);
                            localStorage.setItem('musicVolume', newVolume);
                            updateBackgroundMusicVolume();
                          }}
                          className={`w-12 h-6 rounded-full relative transition-colors ${musicVolume > 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-zinc-700'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: musicVolume > 0 ? 'calc(100% - 22px)' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                        </motion.button>
                      </div>

                      {/* Efektler */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔊</span>
                          <span className="text-gray-300 text-sm">{t.effects}</span>
                        </div>
                        <motion.button
                          onClick={() => {
                            const newVolume = effectsVolume === 0 ? 0.7 : 0;
                            setEffectsVolume(newVolume);
                            localStorage.setItem('effectsVolume', newVolume);
                            if (newVolume > 0) playSound('telefontıklama.mp3');
                          }}
                          className={`w-12 h-6 rounded-full relative transition-colors ${effectsVolume > 0 ? 'bg-gradient-to-r from-pink-500 to-orange-500' : 'bg-zinc-700'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: effectsVolume > 0 ? 'calc(100% - 22px)' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                        </motion.button>
                      </div>

                      {/* Telaffuz Sesi */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎙️</span>
                          <span className="text-gray-300 text-sm">{t.pronunciation}</span>
                        </div>
                        <div className="flex gap-1">
                          <motion.button
                            onClick={() => { playSound('telefontıklama.mp3'); setVoiceGender('male'); setTTSVoiceGender('male'); playDemoVoice('male'); }}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${voiceGender === 'male' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-zinc-700 text-gray-400'}`}
                            whileTap={{ scale: 0.95 }}
                          >👨 {language === 'tr' ? 'Erkek' : 'Male'}</motion.button>
                          <motion.button
                            onClick={() => { playSound('telefontıklama.mp3'); setVoiceGender('female'); setTTSVoiceGender('female'); playDemoVoice('female'); }}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${voiceGender === 'female' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-zinc-700 text-gray-400'}`}
                            whileTap={{ scale: 0.95 }}
                          >👩 {language === 'tr' ? 'Kadın' : 'Female'}</motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dil Ayarları - Tek Kart */}
                  <div className="bg-gradient-to-r from-stone-800/70 to-neutral-700/60 rounded-xl p-3 border border-purple-500/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌍</span>
                      <span className="text-white text-sm font-medium">{language === 'tr' ? 'Dil Ayarları' : 'Language Settings'}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Oyun Dili */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎮</span>
                          <div>
                            <span className="text-gray-300 text-sm">{t.gameLanguage}</span>
                            <p className="text-[10px] text-gray-500">{!englishMode ? t.turkishToEnglish : t.englishToTurkish}</p>
                          </div>
                        </div>
                        <div className="relative flex bg-zinc-800 rounded-xl p-1">
                          <motion.div
                            className="absolute top-1 bottom-1 w-[calc(50%-2px)] bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg"
                            animate={{ x: !englishMode ? 0 : 'calc(100% + 4px)' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          />
                          <button
                            onClick={() => { playSound('telefontıklama.mp3'); if (englishMode) setShowLanguageInfo(true); setEnglishMode(false); }}
                            className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${!englishMode ? 'text-white' : 'text-gray-400'}`}
                          >
                            <svg className="w-4 h-3 rounded-sm" viewBox="0 0 16 12">
                              <rect fill="#E30A17" width="16" height="12"/>
                              <circle cx="6" cy="6" r="3" fill="white"/>
                              <circle cx="7" cy="6" r="2.4" fill="#E30A17"/>
                              <polygon fill="white" points="8,6 10.5,5 9,6.5 10.5,7 8,6"/>
                            </svg>
                            TR
                          </button>
                          <button
                            onClick={() => { playSound('telefontıklama.mp3'); if (!englishMode) setShowLanguageInfo(true); setEnglishMode(true); }}
                            className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${englishMode ? 'text-white' : 'text-gray-400'}`}
                          >
                            <svg className="w-4 h-3 rounded-sm" viewBox="0 0 60 30">
                              <rect fill="#012169" width="60" height="30"/>
                              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                              <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/>
                              <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
                            </svg>
                            EN
                          </button>
                        </div>
                      </div>

                      {/* Arayüz Dili */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💬</span>
                          <span className="text-gray-300 text-sm">{t.interfaceLanguage}</span>
                        </div>
                        <div className="relative flex bg-zinc-800 rounded-xl p-1">
                          <motion.div
                            className="absolute top-1 bottom-1 w-[calc(50%-2px)] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg"
                            animate={{ x: language === 'tr' ? 0 : 'calc(100% + 4px)' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          />
                          <button
                            onClick={() => { playSound('telefontıklama.mp3'); handleInterfaceLanguageChange('tr'); }}
                            className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${language === 'tr' ? 'text-white' : 'text-gray-400'}`}
                          >
                            <svg className="w-4 h-3 rounded-sm" viewBox="0 0 16 12">
                              <rect fill="#E30A17" width="16" height="12"/>
                              <circle cx="6" cy="6" r="3" fill="white"/>
                              <circle cx="7" cy="6" r="2.4" fill="#E30A17"/>
                              <polygon fill="white" points="8,6 10.5,5 9,6.5 10.5,7 8,6"/>
                            </svg>
                            TR
                          </button>
                          <button
                            onClick={() => { playSound('telefontıklama.mp3'); handleInterfaceLanguageChange('en'); }}
                            className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${language === 'en' ? 'text-white' : 'text-gray-400'}`}
                          >
                            <svg className="w-4 h-3 rounded-sm" viewBox="0 0 60 30">
                              <rect fill="#012169" width="60" height="30"/>
                              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                              <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/>
                              <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
                            </svg>
                            EN
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grafik Kalitesi */}
                  <div className="bg-gradient-to-r from-stone-800/70 to-neutral-700/60 rounded-xl p-3 border border-purple-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🖥️</span>
                        <span className="text-gray-300 text-sm">{t.graphicsQuality}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <motion.button 
                        className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${graphicsQuality === 'high' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-zinc-800/50 text-gray-400 border border-zinc-700'}`}
                        onClick={() => { playSound('telefontıklama.mp3'); if (graphicsQuality !== 'high') { setPendingGraphicsQuality('high'); onClose(); setShowRestartPopup(true); } }}
                        whileTap={{ scale: 0.98 }}
                      >🎨 {t.high}</motion.button>
                      <motion.button 
                        className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${graphicsQuality === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'bg-zinc-800/50 text-gray-400 border border-zinc-700'}`}
                        onClick={() => { playSound('telefontıklama.mp3'); if (graphicsQuality !== 'medium') { setPendingGraphicsQuality('medium'); onClose(); setShowRestartPopup(true); } }}
                        whileTap={{ scale: 0.98 }}
                      >⚙️ {t.medium}</motion.button>
                      <motion.button 
                        className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${graphicsQuality === 'low' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-zinc-800/50 text-gray-400 border border-zinc-700'}`}
                        onClick={() => { playSound('telefontıklama.mp3'); if (graphicsQuality !== 'low') { setPendingGraphicsQuality('low'); onClose(); setShowRestartPopup(true); } }}
                        whileTap={{ scale: 0.98 }}
                      >⚡ {t.low}</motion.button>
                    </div>
                  </div>

                  {/* Bildirimler Butonu */}
                  <motion.button
                    onClick={() => { playSound('telefontıklama.mp3'); setShowNotificationPopup(true); }}
                    className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-3 border border-amber-500/40 flex items-center justify-between"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔔</span>
                      <span className="text-white text-sm font-medium">{t.notifications}</span>
                    </div>
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>

                  {/* Nasıl Oynanır ve Destek - Yan Yana */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleShowTutorial}
                      className="flex-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl p-3 border border-purple-500/40 flex flex-col items-center gap-1"
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xl">❓</span>
                      <span className="text-white text-xs font-medium">{t.howToPlay}</span>
                    </motion.button>

                    <motion.button
                      onClick={() => {
                        const email = 'kelimegezginleri@gmail.com';
                        const subject = 'Kelime Gezginleri - Destek ve Öneri';
                        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-xl p-3 border border-pink-500/40 flex flex-col items-center gap-1"
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xl">💌</span>
                      <span className="text-white text-xs font-medium">{t.support}</span>
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
                className="bg-gradient-to-b from-stone-900 via-neutral-950 to-zinc-950 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-amber-700/40"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">{englishMode ? '🇬🇧' : '🇹🇷'}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {englishMode ? 'İngilizce Mod' : 'Türkçe Mod'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {englishMode ? (
                      <>Artık <span className="font-bold text-green-400">İngilizce harflerden</span> kelime oluşturacak ve <span className="font-bold text-green-400">Türkçe karşılıklarını</span> öğreneceksiniz!</>
                    ) : (
                      <>Artık <span className="font-bold text-amber-400">Türkçe harflerden</span> kelime oluşturacak ve <span className="font-bold text-amber-400">İngilizce karşılıklarını</span> öğreneceksiniz!</>
                    )}
                  </p>
                  <div className="bg-black/30 rounded-xl p-3 mb-4 border border-white/10">
                    <p className="text-sm text-gray-400">
                      <span className="font-bold text-white">Örnek:</span><br/>
                      {englishMode ? (
                        <>Daireden <span className="font-bold text-green-400">"APPLE"</span> yazarsınız → <span className="font-bold text-white">"Elma"</span> açılır</>
                      ) : (
                        <>Daireden <span className="font-bold text-amber-400">"ELMA"</span> yazarsınız → <span className="font-bold text-white">"Apple"</span> açılır</>
                      )}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => setShowLanguageInfo(false)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium shadow-lg"
                    whileTap={{ scale: 0.98 }}
                  >{t.understood}</motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}

        {/* Bildirim Ayarları Popup */}
        {showNotificationPopup && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationPopup(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[60] p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-b from-stone-900 via-neutral-950 to-zinc-950 rounded-2xl p-4 max-w-sm w-full shadow-2xl border border-amber-700/40 max-h-[85vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                    <span>🔔</span> {t.notifications}
                  </h3>
                  <motion.button
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotificationPopup(false)}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <div className="space-y-3">
                  {/* Sabah */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-amber-300">☀️ {language === 'tr' ? 'Sabah' : 'Morning'}</span>
                        <p className="text-xs text-amber-400/70">{t.morningReminderDesc}</p>
                      </div>
                      <motion.button
                        onClick={() => { playSound('telefontıklama.mp3'); setMorningReminderEnabled(!morningReminderEnabled); }}
                        className={`w-12 h-6 rounded-full relative transition-colors ${morningReminderEnabled ? 'bg-amber-500' : 'bg-zinc-700'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: morningReminderEnabled ? 'calc(100% - 22px)' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                      </motion.button>
                    </div>
                    {morningReminderEnabled && (
                      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { playSound('telefontıklama.mp3'); setTempTime(morningTime); setShowTimePickerFor('morning'); }} className="mt-2 w-full py-2 px-3 bg-amber-500/20 rounded-lg flex items-center justify-center gap-2 text-amber-300 text-sm">
                        <span>🕐</span> {String(morningTime.hour).padStart(2, '0')}:{String(morningTime.minute).padStart(2, '0')}
                      </motion.button>
                    )}
                  </div>

                  {/* Öğleden Sonra */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-sky-900/30 to-blue-900/20 border border-sky-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-sky-300">🌤️ {language === 'tr' ? 'Öğleden Sonra' : 'Afternoon'}</span>
                        <p className="text-xs text-sky-400/70">{t.afternoonReminderDesc}</p>
                      </div>
                      <motion.button
                        onClick={() => { playSound('telefontıklama.mp3'); setAfternoonReminderEnabled(!afternoonReminderEnabled); }}
                        className={`w-12 h-6 rounded-full relative transition-colors ${afternoonReminderEnabled ? 'bg-sky-500' : 'bg-zinc-700'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: afternoonReminderEnabled ? 'calc(100% - 22px)' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                      </motion.button>
                    </div>
                    {afternoonReminderEnabled && (
                      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { playSound('telefontıklama.mp3'); setTempTime(afternoonTime); setShowTimePickerFor('afternoon'); }} className="mt-2 w-full py-2 px-3 bg-sky-500/20 rounded-lg flex items-center justify-center gap-2 text-sky-300 text-sm">
                        <span>🕐</span> {String(afternoonTime.hour).padStart(2, '0')}:{String(afternoonTime.minute).padStart(2, '0')}
                      </motion.button>
                    )}
                  </div>

                  {/* Akşam */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-900/30 to-purple-900/20 border border-indigo-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-indigo-300">🌙 {language === 'tr' ? 'Akşam' : 'Evening'}</span>
                        <p className="text-xs text-indigo-400/70">{t.eveningReminderDesc}</p>
                      </div>
                      <motion.button
                        onClick={() => { playSound('telefontıklama.mp3'); setEveningReminderEnabled(!eveningReminderEnabled); }}
                        className={`w-12 h-6 rounded-full relative transition-colors ${eveningReminderEnabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: eveningReminderEnabled ? 'calc(100% - 22px)' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                      </motion.button>
                    </div>
                    {eveningReminderEnabled && (
                      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { playSound('telefontıklama.mp3'); setTempTime(eveningTime); setShowTimePickerFor('evening'); }} className="mt-2 w-full py-2 px-3 bg-indigo-500/20 rounded-lg flex items-center justify-center gap-2 text-indigo-300 text-sm">
                        <span>🕐</span> {String(eveningTime.hour).padStart(2, '0')}:{String(eveningTime.minute).padStart(2, '0')}
                      </motion.button>
                    )}
                  </div>

                  {/* Seri Koruma */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-orange-900/30 to-red-900/20 border border-orange-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-orange-300">{t.streakReminder}</span>
                        <p className="text-xs text-orange-400/70">{t.streakReminderDesc}</p>
                      </div>
                      <motion.button
                        onClick={() => { playSound('telefontıklama.mp3'); setStreakReminderEnabled(!streakReminderEnabled); }}
                        className={`w-12 h-6 rounded-full relative transition-colors ${streakReminderEnabled ? 'bg-orange-500' : 'bg-zinc-700'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: streakReminderEnabled ? 'calc(100% - 22px)' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                      </motion.button>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => setShowNotificationPopup(false)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-medium mt-2"
                    whileTap={{ scale: 0.98 }}
                  >{t.understood}</motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}

        {/* Saat Ayarlama Popup */}
        {showTimePickerFor && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTimePickerFor(null)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[70] p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-b from-stone-900 via-neutral-950 to-zinc-950 rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-amber-700/40"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-white text-center mb-4">
                  {showTimePickerFor === 'morning' && (language === 'tr' ? '☀️ Sabah Saati' : '☀️ Morning Time')}
                  {showTimePickerFor === 'afternoon' && (language === 'tr' ? '🌤️ Öğleden Sonra Saati' : '🌤️ Afternoon Time')}
                  {showTimePickerFor === 'evening' && (language === 'tr' ? '🌙 Akşam Saati' : '🌙 Evening Time')}
                </h3>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 mb-1">{language === 'tr' ? 'Saat' : 'Hour'}</span>
                    <select
                      value={tempTime.hour}
                      onChange={(e) => setTempTime({ ...tempTime, hour: parseInt(e.target.value) })}
                      className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-xl font-bold text-center appearance-none cursor-pointer"
                      style={{ width: '70px' }}
                    >
                      {showTimePickerFor === 'morning' && [7, 8, 9, 10].map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                      {showTimePickerFor === 'afternoon' && [13, 14, 15, 16, 17, 18].map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                      {showTimePickerFor === 'evening' && [19, 20, 21, 22].map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                    </select>
                  </div>
                  <span className="text-2xl font-bold text-white">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 mb-1">{language === 'tr' ? 'Dakika' : 'Minute'}</span>
                    <select
                      value={tempTime.minute}
                      onChange={(e) => setTempTime({ ...tempTime, minute: parseInt(e.target.value) })}
                      className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-xl font-bold text-center appearance-none cursor-pointer"
                      style={{ width: '70px' }}
                    >
                      {showTimePickerFor === 'morning' && tempTime.hour === 10 
                        ? [0, 5, 10, 15, 20, 25, 30].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)
                        : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)
                      }
                    </select>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center mb-4">
                  {showTimePickerFor === 'morning' && (language === 'tr' ? '07:00 - 10:30 arası' : 'Between 07:00 - 10:30')}
                  {showTimePickerFor === 'afternoon' && (language === 'tr' ? '13:00 - 18:00 arası' : 'Between 13:00 - 18:00')}
                  {showTimePickerFor === 'evening' && (language === 'tr' ? '19:00 - 22:00 arası' : 'Between 19:00 - 22:00')}
                </p>
                
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowTimePickerFor(null)}
                    className="flex-1 py-2 px-4 bg-zinc-700/80 rounded-xl text-white font-medium text-sm border border-zinc-600"
                    whileTap={{ scale: 0.98 }}
                  >{t.cancelButton}</motion.button>
                  <motion.button
                    onClick={() => {
                      playSound('telefontıklama.mp3');
                      if (showTimePickerFor === 'morning') {
                        setMorningTime(tempTime);
                        localStorage.setItem('morningReminderTime', JSON.stringify(tempTime));
                        scheduleMorningReminder();
                      } else if (showTimePickerFor === 'afternoon') {
                        setAfternoonTime(tempTime);
                        localStorage.setItem('afternoonReminderTime', JSON.stringify(tempTime));
                        scheduleAfternoonReminder();
                      } else if (showTimePickerFor === 'evening') {
                        setEveningTime(tempTime);
                        localStorage.setItem('eveningReminderTime', JSON.stringify(tempTime));
                        scheduleEveningReminder();
                      }
                      setShowTimePickerFor(null);
                    }}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium text-sm"
                    whileTap={{ scale: 0.98 }}
                  >{language === 'tr' ? 'Kaydet' : 'Save'}</motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Settings;
