import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import LevelSelect from './components/LevelSelect';
import WordPuzzle from './components/WordPuzzle';
import WelcomePage from './components/WelcomePage';
import PhoneMenuPage from './components/PhoneMenuPage';
import WordBank from './components/WordBank';
import WordReview from './components/WordReview';
import Tutorial from './components/Tutorial';
import { levels } from './data/levels';
import { playBackgroundMusic, pauseBackgroundMusic, updateBackgroundMusicVolume, getEffectsVolume } from './utils/SoundManager';

const COLORS = {
  background: '#1F2937', // Dark Gray
  card: '#374151',      // Medium Gray
  text: '#F3F4F6',      // Light Gray
  highlight: '#6366F1', // Indigo
  success: '#34D399',   // Emerald
  time: '#F472B6',       // Pink
  accent: '#F472B6'      // Pink
};

function App() {
  const [showWelcome, setShowWelcome] = useState(true); 
  const [showPhoneMenu, setShowPhoneMenu] = useState(false);
  const [showWordBank, setShowWordBank] = useState(false);
  const [showWordReview, setShowWordReview] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showReplayDialog, setShowReplayDialog] = useState(false);
  const [lastCompletionTime, setLastCompletionTime] = useState(null);
  const [completedLevelDetails, setCompletedLevelDetails] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastPlayedLevel, setLastPlayedLevel] = useState(() => {
    const saved = localStorage.getItem('lastPlayedLevel');
    // Eğer kaydedilmiş bir bölüm yoksa, ilk bölümü varsayılan olarak ayarla
    return saved ? JSON.parse(saved) : levels[0];
  });
  const audioRef = useRef(null);
  const [diamonds, setDiamonds] = useState(() => {
    const saved = localStorage.getItem('diamonds');
    return saved ? parseInt(saved) : 1000;
  });

// Kelime telaffuz fonksiyonu
const speak = (text, language = 'en-US') => {
  // Sesler yüklenene kadar bekle
  const speakWithVoices = () => {
    let voices = window.speechSynthesis.getVoices();
    
    // Sesler hala yüklenmediyse, kısa bir süre sonra tekrar dene
    if (voices.length === 0) {
      setTimeout(() => speakWithVoices(), 100);
      return;
    }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  
  // Türkçe için konuşma hızını yavaşlat
  if (language === 'tr-TR') {
    utterance.rate = 0.6; // Türkçe için çok daha yavaş (0.6x hız)
  } else {
    utterance.rate = 0.85; // İngilizce için normal hız
  }
  
  // localStorage'dan ses cinsiyeti tercihini al
  const voiceGender = localStorage.getItem('voiceGender') || 'male';
  
  if (voices.length > 0) {
    let selectedVoice = null;
    
    // Dil bazlı sesleri filtrele
    const languageVoices = voices.filter(voice => 
      voice.lang.includes(language.split('-')[0])
    );
    
    if (voiceGender === 'female') {
      // Kadın sesi ara
      selectedVoice = languageVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.includes('Zira') ||
        voice.name.includes('Susan') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Filiz') || // Türkçe kadın sesi
        voice.name.includes('Selin')
      );
    } else {
      // Erkek sesi ara - daha geniş arama
      selectedVoice = languageVoices.find(voice => 
        voice.name.toLowerCase().includes('male') ||
        voice.name.includes('David') ||
        voice.name.includes('Mark') ||
        voice.name.includes('Daniel') ||
        voice.name.includes('James') ||
        voice.name.includes('George') ||
        voice.name.includes('Tolga') || // Türkçe erkek sesi
        voice.name.includes('Cem')
      );
      
      // Hala bulunamadıysa, pitch'i düşürerek erkek sesi simüle et
      if (!selectedVoice && languageVoices.length > 0) {
        selectedVoice = languageVoices[0];
        utterance.pitch = 0.8; // Daha derin ses
      }
    }
    
    // Eğer cinsiyete göre bir ses bulunduysa, kullan
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }
  
  window.speechSynthesis.speak(utterance);
  };
  
  // Sesler yüklenene kadar bekle ve sonra konuş
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      speakWithVoices();
    };
  } else {
    speakWithVoices();
  }
};


// Zor mod için state değişkenleri
  const [hardModeActive, setHardModeActive] = useState(() => {
    const saved = localStorage.getItem('hardModeActive');
    return saved ? JSON.parse(saved) : false;
  });

  // SpeechSynthesis'i unlock et (tarayıcı kısıtlaması için)
  useEffect(() => {
    const unlockAudio = () => {
      // Sessiz bir ses çal (tarayıcı izni için)
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      
      // Event listener'ı kaldır
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    
    // İlk tıklama veya dokunmada unlock et
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const [hardModeLevel, setHardModeLevel] = useState(() => {
    const saved = localStorage.getItem('hardModeLevel');
    return saved ? parseInt(saved) : 1;
  });

  // Arka plan müziği kontrolü
  useEffect(() => {
    if (selectedLevel) {
      // Eğer bir bölüm seçilmişse (oyun başlamışsa) müziği çal
      playBackgroundMusic();
    } else {
      // Eğer oyun durduysa müziği dursun
      pauseBackgroundMusic();
    }
    
    // Temizleme fonksiyonu
    return () => {
      pauseBackgroundMusic();
    };
  }, [selectedLevel]); // selectedLevel değiştiğinde çalış

  // Müzik ve efekt ses seviyesi değiştiğinde güncelle
  useEffect(() => {
    const handleVolumeChange = (event) => {
      console.log('Volume change event:', event.detail);
      
      if (event.detail?.type === 'music') {
        // Arka plan müziği ses seviyesini güncelle
        updateBackgroundMusicVolume();
      } else if (event.detail?.type === 'effects') {
        // Efekt sesi seviyesini güncelle (audioRef için)
        if (audioRef.current) {
          audioRef.current.volume = getEffectsVolume();
        }
      }
    };

    // Custom event listener ekle (aynı pencerede çalışır)
    window.addEventListener('volumeChange', handleVolumeChange);
    
    // Temizleme fonksiyonu
    return () => {
      window.removeEventListener('volumeChange', handleVolumeChange);
    };
  }, []);

  const [unlockedLevels, setUnlockedLevels] = useState(() => {
    const saved = localStorage.getItem('unlockedLevels');
    return saved ? parseInt(saved) : 1;
  });
  
  const [completedLevels, setCompletedLevels] = useState(() => {
    const saved = localStorage.getItem('completedLevels');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [bestTimes, setBestTimes] = useState(() => {
    const saved = localStorage.getItem('bestTimes');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [lastTimes, setLastTimes] = useState(() => {
    const saved = localStorage.getItem('lastTimes');
    return saved ? JSON.parse(saved) : {};
  });
  
  useEffect(() => {
    localStorage.setItem('unlockedLevels', unlockedLevels);
  }, [unlockedLevels]);
  
  useEffect(() => {
    localStorage.setItem('completedLevels', JSON.stringify([...completedLevels]));
  }, [completedLevels]);
  
  useEffect(() => {
    localStorage.setItem('bestTimes', JSON.stringify(bestTimes));
  }, [bestTimes]);
  
  useEffect(() => {
    localStorage.setItem('lastTimes', JSON.stringify(lastTimes));
  }, [lastTimes]);
  
  useEffect(() => {
    localStorage.setItem('diamonds', diamonds);
  }, [diamonds]);
  
  useEffect(() => {
    localStorage.setItem('lastPlayedLevel', JSON.stringify(lastPlayedLevel));
  }, [lastPlayedLevel]);
  
  useEffect(() => {
    localStorage.setItem('hardModeActive', hardModeActive);
  }, [hardModeActive]);

  useEffect(() => {
    localStorage.setItem('hardModeLevel', hardModeLevel);
  }, [hardModeLevel]);
  
  // Ses dosyasını uygulama başladığında yükleyip hazır tutacak şekilde kodu güncelliyorum.
  useEffect(() => {
    // Ses dosyasını uygulama başladığında yükleyip hazır tut
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.src = '/sounds/level.mp3';
      audioRef.current.volume = getEffectsVolume(); // Efekt ses seviyesini kullan
      audioRef.current.load(); // Önceden yükle
      
      // Hata durumunda
      audioRef.current.addEventListener('error', (e) => {
        console.error('Ses yükleme hatası:', e);
      });
    }
    
    // Temizleme fonksiyonu
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('error', () => {});
      }
    };
  }, []); // Sadece uygulama başladığında çalış
  
  // Bölüm tamamlandığında sesi çal (sadece her 15 bölümde bir)
  useEffect(() => {
    if (completedLevelDetails && audioRef.current) {
      try {
        // Sadece 15'in katı olan bölümlerde ses çal (15, 30, 45, 60, vb.)
        const levelId = completedLevelDetails.level;
        if (levelId % 15 !== 0) {
          console.log(`Level ${levelId} is not a multiple of 15, skipping sound`);
          return;
        }
        
        // Ses seviyesini localStorage'dan tekrar oku (mobil için)
        const currentVolume = getEffectsVolume();
        
        // Eğer efekt sesleri kapalıysa, sesi çalma
        if (currentVolume === 0) {
          console.log('Effects volume is 0, not playing level completion sound');
          return;
        }
        
        audioRef.current.volume = currentVolume;
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Ses başarıyla çalınıyor');
              setIsPlaying(true);
            })
            .catch(error => {
              console.error('Ses çalma hatası:', error);
              // Kullanıcı etkileşimi ile sesi çalma
              document.addEventListener('click', function playAudioOnce() {
                audioRef.current.volume = getEffectsVolume();
                audioRef.current.play().catch(e => console.error('Yine hata:', e));
                document.removeEventListener('click', playAudioOnce);
              }, { once: true });
            });
        }
      } catch (error) {
        console.error('Ses çalma sırasında hata:', error);
      }
    }
  }, [completedLevelDetails]);
  
  const handleStartGame = () => {
    setShowWelcome(false);
    setShowPhoneMenu(true);
  };
  
  const handleShowLevels = () => {
    setShowPhoneMenu(false);
  };
  
  const handleLevelSelect = (level) => {
    // SpeechSynthesis'i unlock et (oyun başladığında)
    try {
      const unlockUtterance = new SpeechSynthesisUtterance('');
      unlockUtterance.volume = 0;
      window.speechSynthesis.speak(unlockUtterance);
      console.log('SpeechSynthesis unlocked on level start');
    } catch (error) {
      console.error('SpeechSynthesis unlock error:', error);
    }
    
    // Bölümünü doğrudan başlat, tamamlanmış olsa bile
    setSelectedLevel(level);
    
    // lastPlayedLevel'i sadece daha yüksek bir bölüm numarası varsa güncelle
    if (!lastPlayedLevel || level.id > lastPlayedLevel.id) {
      setLastPlayedLevel(level);
    }
  };
  
  const handleLevelComplete = useCallback((levelId, timeInSeconds) => {
    // Bölümün daha önce tamamlanıp tamamlanmadığını kontrol et
    const wasAlreadyCompleted = completedLevels.has(levelId);
    
    const newCompletedLevels = new Set(completedLevels);
    newCompletedLevels.add(levelId);
    setCompletedLevels(newCompletedLevels);
    
    const newBestTimes = { ...bestTimes };
    if (!newBestTimes[levelId] || timeInSeconds < newBestTimes[levelId]) {
      newBestTimes[levelId] = timeInSeconds;
      setBestTimes(newBestTimes);
    }
    
    const newLastTimes = { ...lastTimes };
    newLastTimes[levelId] = timeInSeconds;
    setLastTimes(newLastTimes);
    
    if (levelId + 1 > unlockedLevels) {
      setUnlockedLevels(levelId + 1);
    }
    
    // Bölüm ilk kez tamamlandığında elmas ödülü hesaplama
    if (!wasAlreadyCompleted) {
      // Temel elmas ödülü
      let diamondReward = 1; // Normal mod için temel ödül
      
      // Zor mod aktifse ekstra ödül
      if (hardModeActive) {
        switch (hardModeLevel) {
          case 1:
            diamondReward = 1.25;
            break;
          case 2:
            diamondReward = 1.5;
            break;
          case 3:
            diamondReward = 2;
            break;
          default:
            diamondReward = 1;
        }
      }
      
      // Hız bonusu hesaplama
      const completionTime = newLastTimes[levelId];
      
      // 2 harfli kelimeler için hız bonusu (1-23 aralığındaki bölümler)
      if (levelId >= 1 && levelId <= 23 && completionTime <= 10) {
        diamondReward += 0.3;
      }
      // 3 harfli kelimeler için hız bonusu (24-162 aralığındaki bölümler)
      else if (levelId >= 24 && levelId <= 162 && completionTime <= 15) {
        diamondReward += 0.5;
      }
      // 4 harfli kelimeler için hız bonusu (163-458 aralığındaki bölümler)
      else if (levelId >= 163 && levelId <= 458 && completionTime <= 20) {
        diamondReward += 0.7;
      }
      // 5 harfli kelimeler için hız bonusu (459-731 aralığındaki bölümler)
      else if (levelId >= 459 && levelId <= 731 && completionTime <= 25) {
        diamondReward += 0.9;
      }
      // 6 harfli kelimeler için hız bonusu (732-1202 aralığındaki bölümler)
      else if (levelId >= 732 && levelId <= 1202 && completionTime <= 30) {
        diamondReward += 1.2;
      }
      // 7 harfli kelimeler için hız bonusu (1203-1400 aralığındaki bölümler)
      else if (levelId >= 1203 && levelId <= 1400 && completionTime <= 35) {
        diamondReward += 1.5;
      }
      // 8 harfli kelimeler için hız bonusu (1401-2045 aralığındaki bölümler)
      else if (levelId >= 1401 && levelId <= 2045 && completionTime <= 40) {
        diamondReward += 1.8;
      }
      // 9+ harfli kelimeler için hız bonusu (2046+ aralığındaki bölümler)
      else if (levelId >= 2046 && completionTime <= 45) {
        diamondReward += 2.0;
      }
      
      // Toplam ödülü ekle
      setDiamonds(prev => prev + diamondReward);
      
      // 15'in katı bölümlerde sesi hemen çal (kart açılmadan önce)
      if (levelId % 15 === 0 && !wasAlreadyCompleted && audioRef.current) {
        const currentVolume = getEffectsVolume();
        if (currentVolume > 0) {
          audioRef.current.volume = currentVolume;
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(error => {
            console.error('Ses çalma hatası:', error);
          });
        }
      }
      
      // diamondReward değerini completedLevelDetails'e ekle
      setCompletedLevelDetails({
        level: levelId,
        bestTime: newBestTimes[levelId],
        lastTime: newLastTimes[levelId],
        firstTime: !wasAlreadyCompleted,
        diamondReward: diamondReward // Kazanılan elmas miktarını ekle
      });
    } else {
      setCompletedLevelDetails({
        level: levelId,
        bestTime: newBestTimes[levelId],
        lastTime: newLastTimes[levelId],
        firstTime: !wasAlreadyCompleted
      });
    }
    
    // Tamamlanan bölümün seviyesi, lastPlayedLevel'dan daha yüksekse lastPlayedLevel'i güncelle
    const currentLevel = levels.find(level => level.id === levelId);
    if (currentLevel && (!lastPlayedLevel || levelId > lastPlayedLevel.id)) {
      setLastPlayedLevel(currentLevel);
    }
    
    setSelectedLevel(null);
  }, [completedLevels, bestTimes, lastTimes, unlockedLevels, lastPlayedLevel, levels, hardModeActive, hardModeLevel]);
  
  const handleReplay = () => {
    setShowReplayDialog(false);
  };
  
  const handleNextLevel = () => {
    // Safari için SpeechSynthesis'i unlock et (sessiz)
    // Bu kullanıcı etkileşimi içinde olduğu için Safari'nin kısıtlamasını aşar
    // Sonraki bölümde otomatik telaffuz çalışabilir hale gelir
    try {
      const unlockUtterance = new SpeechSynthesisUtterance('');
      unlockUtterance.volume = 0;
      window.speechSynthesis.speak(unlockUtterance);
      console.log('🔓 Safari SpeechSynthesis unlocked via Next Level button');
    } catch (error) {
      console.error('SpeechSynthesis unlock error:', error);
    }
    
    if (selectedLevel && selectedLevel.id < levels.length) {
      const nextLevelId = selectedLevel.id + 1;
      const nextLevel = levels.find(level => level.id === nextLevelId);
      if (nextLevel && nextLevelId <= unlockedLevels) {
        setSelectedLevel(nextLevel);
        // lastPlayedLevel'i sadece daha yüksek bir bölüm numarası varsa güncelle
        if (!lastPlayedLevel || nextLevel.id > lastPlayedLevel.id) {
          setLastPlayedLevel(nextLevel);
        }
        setCompletedLevelDetails(null);
      }
    }
    setShowReplayDialog(false);
  };
  
  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setShowReplayDialog(false);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const useDiamond = useCallback((amount) => {
    setDiamonds(prev => Math.max(0, prev - amount));
  }, []);

  const CompletedLevelDialog = () => {
    if (!completedLevelDetails) return null;
    
    const { level, bestTime, lastTime } = completedLevelDetails;
    
    // Seviyeye ait kelime bilgilerini al
    const currentLevel = levels.find(l => l.id === level);
    const words = currentLevel?.words || [];
    
    // Bu bölümün daha önce tamamlanıp tamamlanmadığını kontrol et
    const wasAlreadyCompleted = completedLevels.has(level) && completedLevelDetails.firstTime !== true;
    
    // Yeni koleksiyon açıldı mı kontrol et (her 15 bölümde bir)
    const isNewCollectionUnlocked = level % 15 === 0 && !wasAlreadyCompleted;
    const collectionNumber = Math.floor(level / 15);
    
    // İngilizce mod kontrolü - öğrenilen dili belirle
    const englishMode = localStorage.getItem('englishMode') === 'true';
    
    // Dil ayarı
    const language = localStorage.getItem('language') || 'tr';
    
    // Otomatik telaffuz - Safari dahil tüm tarayıcılarda çalışır
    // (Sonraki Bölüm butonuna basıldığında SpeechSynthesis unlock edilmiş olur)
    React.useEffect(() => {
      if (words.length > 0) {
        let initialDelay = 1500;
        
        if (isNewCollectionUnlocked) {
          initialDelay = 4500; // Level sesi için bekle
        }
        
        const timer = setTimeout(() => {
          console.log('🔊 Otomatik telaffuz başlıyor');
          words.forEach((word, index) => {
            setTimeout(() => {
              const textToSpeak = englishMode ? word.turkish : word.english;
              const langToUse = englishMode ? 'tr-TR' : 'en-US';
              
              try {
                speak(textToSpeak, langToUse);
              } catch (error) {
                console.error('❌ Telaffuz hatası:', error);
              }
            }, index * 2000);
          });
        }, initialDelay);
        
        return () => clearTimeout(timer);
      }
    }, [words, englishMode, isNewCollectionUnlocked]);
    
    // Çeviriler
    const translations = {
      tr: {
        congratulations: 'Tebrikler! Kelime bankanıza yeni kelime eklediniz',
        alreadyCompleted: 'Bu bölümü daha önce tamamladınız!',
        pronunciationInfo: englishMode 
          ? 'Türkçe kelimelerin telaffuzunu duymak için ses butonuna tıklayın.'
          : 'İngilizce kelimelerin telaffuzunu duymak için ses butonuna tıklayın.',
        levelCompleted: 'Bu bölümü geçtiniz!',
        earned: 'Kazandınız!',
        completedBefore: 'Bu bölümü daha önce tamamladınız.',
        replayLevel: 'Tekrar Oyna',
        nextLevel: 'Sonraki Bölüm',
        goBack: 'Geri Dön',
        newCollectionUnlocked: '🎉 Yeni Koleksiyon Kilidi Açıldı!',
        collectionNumber: 'Koleksiyon'
      },
      en: {
        congratulations: 'Congratulations! New words added to your word bank',
        alreadyCompleted: 'You have already completed this level!',
        pronunciationInfo: englishMode 
          ? 'Click the sound button to hear Turkish pronunciation.'
          : 'Click the sound button to hear English pronunciation.',
        levelCompleted: 'Level completed!',
        earned: 'Earned!',
        completedBefore: 'You have already completed this level.',
        replayLevel: 'Replay',
        nextLevel: 'Next Level',
        goBack: 'Go Back',
        newCollectionUnlocked: '🎉 New Collection Unlocked!',
        collectionNumber: 'Collection'
      }
    };
    
    const t = translations[language];
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border-2 border-white/10 p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            {words.length > 0 ? t.congratulations : t.alreadyCompleted}
          </h2>
          
          {words.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg p-4 border border-white/10 shadow-lg overflow-hidden">
              <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-center w-full px-3 py-2 mb-4 rounded-lg bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 shadow-md">
  <p className="text-indigo-300 text-sm flex items-center justify-center gap-1">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
    {t.pronunciationInfo}
  </p>
</div>
                {words.map((word, index) => (
                  <motion.div 
                    key={index} 
                    className="w-full"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: index * 0.2,
                      type: "spring",
                      stiffness: 100,
                      damping: 10
                    }}
                  >
                    <div className="relative flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border border-white/10 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
                      {/* Parlama efekti */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                      
                      {/* İngilizce mod: İngilizce sol, Türkçe sağ (öğrenilen) */}
                      {/* Türkçe mod: Türkçe sol, İngilizce sağ (öğrenilen) */}
                      
                      {englishMode ? (
                        <>
                          {/* Sol: İngilizce (bilinen) */}
                          <motion.div 
                            className="relative z-10 px-4 py-2 rounded-md bg-gradient-to-br from-pink-900/60 to-pink-700/40 border border-pink-500/30 shadow-lg"
                            whileHover={{ 
                              scale: 1.05,
                              boxShadow: "0 0 15px rgba(244, 114, 182, 0.5)"
                            }}
                          >
                            <span className="text-lg font-bold text-pink-400">{word.english}</span>
                          </motion.div>
                          
                          {/* Bağıntı çizgisi */}
                          <motion.div 
                            className="relative z-10 h-0.5 w-10 bg-gradient-to-r from-pink-500/50 to-emerald-500/50"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: index * 0.2 + 0.3, duration: 0.3 }}
                          />
                          
                          {/* Sağ: Türkçe (öğrenilen) + Hoparlör */}
                          <motion.div 
                            className="relative z-10 px-4 py-2 rounded-md bg-gradient-to-br from-emerald-900/60 to-emerald-700/40 border border-emerald-500/30 shadow-lg"
                            whileHover={{ 
                              scale: 1.05,
                              boxShadow: "0 0 15px rgba(52, 211, 153, 0.5)"
                            }}
                          >
                            <span className="text-lg font-bold text-emerald-400">{word.turkish}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speak(word.turkish, 'tr-TR');
                              }}
                              className="ml-2 p-1.5 rounded-full bg-gradient-to-r from-indigo-600/30 to-indigo-800/30 hover:from-indigo-600/40 hover:to-indigo-800/40 border border-indigo-500/30 transition-all duration-300 shadow-md"
                              title="Telaffuzu dinle"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            </button>
                          </motion.div>
                        </>
                      ) : (
                        <>
                          {/* Sol: Türkçe (bilinen) */}
                          <motion.div 
                            className="relative z-10 px-4 py-2 rounded-md bg-gradient-to-br from-emerald-900/60 to-emerald-700/40 border border-emerald-500/30 shadow-lg"
                            whileHover={{ 
                              scale: 1.05,
                              boxShadow: "0 0 15px rgba(52, 211, 153, 0.5)"
                            }}
                          >
                            <span className="text-lg font-bold text-emerald-400">{word.turkish}</span>
                          </motion.div>
                          
                          {/* Bağıntı çizgisi */}
                          <motion.div 
                            className="relative z-10 h-0.5 w-10 bg-gradient-to-r from-emerald-500/50 to-pink-500/50"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: index * 0.2 + 0.3, duration: 0.3 }}
                          />
                          
                          {/* Sağ: İngilizce (öğrenilen) + Hoparlör */}
                          <motion.div 
                            className="relative z-10 px-4 py-2 rounded-md bg-gradient-to-br from-pink-900/60 to-pink-700/40 border border-pink-500/30 shadow-lg"
                            whileHover={{ 
                              scale: 1.05,
                              boxShadow: "0 0 15px rgba(244, 114, 182, 0.5)"
                            }}
                          >
                            <span className="text-lg font-bold text-pink-400">{word.english}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speak(word.english, 'en-US');
                              }}
                              className="ml-2 p-1.5 rounded-full bg-gradient-to-r from-indigo-600/30 to-indigo-800/30 hover:from-indigo-600/40 hover:to-indigo-800/40 border border-indigo-500/30 transition-all duration-300 shadow-md"
                              title="Telaffuzu dinle"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <motion.div 
              className="text-center p-4 rounded-lg bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 15,
                delay: 0.2
              }}
            >
              <p className="text-lg font-medium text-white mb-2">{t.levelCompleted}</p>
              
              {!wasAlreadyCompleted ? (
                <motion.div 
                  className="flex items-center justify-center gap-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.span 
                    className="text-2xl font-bold text-yellow-400"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, 0, -5, 0]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: 1,
                      repeatDelay: 0.5
                    }}
                  >
                    {completedLevelDetails.diamondReward}
                  </motion.span>
                  <motion.span 
                    className="text-3xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, 0, -10, 0]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: 1,
                      repeatDelay: 0.5
                    }}
                  >
                    💎
                  </motion.span>
                  <motion.span 
                    className="text-lg font-medium text-yellow-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {t.earned}
                  </motion.span>
                </motion.div>
              ) : (
                <p className="text-gray-400 italic">{t.completedBefore}</p>
              )}
            </motion.div>
          </div>
          
          {/* Yeni Koleksiyon Açıldı Bildirimi */}
          {isNewCollectionUnlocked && (
            <motion.div 
              className="mb-6"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.8
              }}
            >
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-600/30 via-orange-600/30 to-pink-600/30 border-2 border-yellow-400/50 p-4 shadow-2xl">
                {/* Parlama animasyonu */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                />
                
                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                    className="text-4xl mb-2"
                  >
                    📚
                  </motion.div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-1">
                    {t.newCollectionUnlocked}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {t.collectionNumber} {collectionNumber}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              className="px-6 py-3 rounded-xl font-medium transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                // Seviye ID'sini kullanarak seviye nesnesini bul
                const levelObj = levels.find(l => l.id === level);
                if (levelObj) {
                  setSelectedLevel(levelObj);
                  setCompletedLevelDetails(null);
                }
              }}
            >
              {t.replayLevel}
            </button>
            
            {/* Sonraki Bölüm Butonu */}
            {level < levels.length && (
              <button
                className="px-6 py-3 rounded-xl font-medium transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  // Safari için SpeechSynthesis'i unlock et (sessiz)
                  // Sonraki bölümde otomatik telaffuz çalışabilir hale gelir
                  try {
                    const unlockUtterance = new SpeechSynthesisUtterance('');
                    unlockUtterance.volume = 0;
                    window.speechSynthesis.speak(unlockUtterance);
                    console.log('🔓 Safari SpeechSynthesis unlocked via Next Level button (card)');
                  } catch (error) {
                    console.error('SpeechSynthesis unlock error:', error);
                  }
                  
                  // Bir sonraki seviyeyi bul ve başlat
                  const nextLevelId = typeof level === 'object' ? level.id + 1 : level + 1;
                  const nextLevel = levels.find(l => l.id === nextLevelId);
                  
                  if (nextLevel && nextLevelId <= unlockedLevels) {
                    setSelectedLevel(nextLevel);
                    // lastPlayedLevel'i sadece daha yüksek bir bölüm numarası varsa güncelle
                    if (!lastPlayedLevel || nextLevel.id > lastPlayedLevel.id) {
                      setLastPlayedLevel(nextLevel);
                    }
                    setCompletedLevelDetails(null);
                  }
                }}
              >
                {t.nextLevel}
              </button>
            )}
            
            <button
              className="px-6 py-3 rounded-xl font-medium transition-all bg-neutral-700 hover:bg-neutral-800 text-white"
              onClick={() => setCompletedLevelDetails(null)}
            >
              {t.goBack}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleContinueLastLevel = (level) => {
    // level veya level.id yoksa ilk bölümü kullan
    if (!level || !level.id) {
      setSelectedLevel(levels[0]);
      setShowPhoneMenu(false);
      return;
    }
    // levels array'inden güncel level nesnesini al (localStorage'daki eski veri sorunlarını önlemek için)
    const currentLevel = levels.find(l => l.id === level.id);
    if (!currentLevel) {
      console.error('Level bulunamadı:', level.id);
      setSelectedLevel(levels[0]);
      setShowPhoneMenu(false);
      return;
    }
    setSelectedLevel(currentLevel);
    setShowPhoneMenu(false);
  };

  const handleWordBankClick = () => {
    setShowPhoneMenu(false);
    setShowWordBank(true);
  };

  const handleWordBankBack = () => {
    setShowWordBank(false);
    setShowPhoneMenu(true);
  };

  const handleWordReviewClick = () => {
    setShowPhoneMenu(false);
    setShowWordReview(true);
  };

  const handleWordReviewBack = () => {
    setShowWordReview(false);
    setShowPhoneMenu(true);
  };

  const handleReviewComplete = (totalWords, knownWords) => {
    // Kelime tekrarı tamamlandığında elmas ödülü ver
    const reward = 30;
    setDiamonds(prev => prev + reward);
    console.log(`Review completed: ${knownWords}/${totalWords} words known. Reward: ${reward} diamonds`);
  };

  const [showTutorial, setShowTutorial] = useState(() => {
    // İlk kez giriş yapan kullanıcılar için tutorial'ı göster
    return localStorage.getItem('tutorialCompleted') !== 'true';
  });
  
  // PhoneMenuPage'e geçildiğinde Tutorial'ı otomatik aç
  useEffect(() => {
    if (showPhoneMenu && localStorage.getItem('tutorialCompleted') !== 'true') {
      setShowTutorial(true);
    }
  }, [showPhoneMenu]);
  
  const handleShowTutorial = () => {
    setShowTutorial(true);
  };
  
  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center" style={{ backgroundColor: COLORS.background }}>
      {showWelcome ? (
        <WelcomePage onStart={handleStartGame} />
      ) : selectedLevel && selectedLevel.words ? (
        <WordPuzzle 
          level={selectedLevel} 
          onComplete={handleLevelComplete}
          onClose={handleBackToLevels}
          onNext={handleNextLevel}
          diamonds={diamonds}
          useDiamond={useDiamond}
          hardModeActive={hardModeActive}
          hardModeLevel={hardModeLevel}
          setHardModeActive={setHardModeActive}
          setHardModeLevel={setHardModeLevel}
        />
      ) : (
        <>
          {!showPhoneMenu && !showWordBank && !showWordReview ? (
            <LevelSelect
              levels={levels}
              unlockedLevels={unlockedLevels}
              completedLevels={completedLevels}
              bestTimes={bestTimes}
              lastTimes={lastTimes}
              formatTime={formatTime}
              onLevelSelect={handleLevelSelect}
              lastPlayedLevel={lastPlayedLevel}
              onContinueLastLevel={handleContinueLastLevel}
              onBackToPhoneMenu={() => setShowPhoneMenu(true)}
            />
          ) : showWordBank ? (
            <WordBank 
              completedLevels={completedLevels} 
              levels={levels} 
              onBackClick={handleWordBankBack} 
            />
          ) : showWordReview ? (
            <WordReview 
              completedLevels={completedLevels} 
              levels={levels} 
              onBackClick={handleWordReviewBack}
              onReviewComplete={handleReviewComplete}
            />
          ) : (
            <>
              <PhoneMenuPage 
                onLevelsClick={handleShowLevels} 
                lastPlayedLevel={lastPlayedLevel}
                onContinueLastLevel={handleContinueLastLevel}
                onWordBankClick={handleWordBankClick}
                onWordReviewClick={handleWordReviewClick}
                onShowTutorial={handleShowTutorial}
                completedLevels={completedLevels}
                diamonds={diamonds}
                setDiamonds={setDiamonds}
              />
              {showTutorial && (
                <Tutorial onComplete={handleCloseTutorial} />
              )}
            </>
          )}
          {completedLevelDetails && <CompletedLevelDialog />}
        </>
      )}
    </div>
  );
}

export default App;
