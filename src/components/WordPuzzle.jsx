import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from "@lottiefiles/react-lottie-player";
// import confetti from 'canvas-confetti';
import CompletionCard from './CompletionCard';
import InGameTutorial from './InGameTutorial';
import { playSound, playHintSound, playFairyJokerSound, playLevelSound, playHomeButtonSound, playShuffleSound, getMusicVolume, getEffectsVolume, updateBackgroundMusicVolume, playHardModeMusic, stopHardModeMusic } from '../utils/SoundManager';

const COLORS = {
  primary: '#8B5CF6',    // Purple
  secondary: '#C084FC',  // Light Purple
  accent: '#EC4899',     // Pink
  success: '#10B981',    // Emerald
  background: '#0F172A', // Deep Dark Blue
  card: '#1E293B',       // Slate
  text: '#F1F5F9',       // Light Slate
  highlight: '#A78BFA',  // Violet
  trail: '#F472B6',      // Pink Trail
  glow: '#C084FC'        // Purple Glow
};

// Türkçe karakterleri doğru büyük harfe çeviren fonksiyon
const toTurkishUpperCase = (str) => {
  return str
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .replace(/ş/g, 'Ş')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç')
    .toUpperCase();
};

const WordPuzzle = ({ level, onComplete, onClose, onNext, diamonds, useDiamond, hardModeActive, hardModeLevel, setHardModeActive, setHardModeLevel }) => {

  const [language] = useState(() => localStorage.getItem('language') || 'tr');
  const [graphicsQuality] = useState(() => localStorage.getItem('graphicsQuality') || 'high');

  // Her bölüm için farklı renk paleti
  const LEVEL_COLORS = [
    { main: '#4a4a6a', glow: '#6a6a9a', light: '#9a9aca' }, // Lacivert
    { main: '#3a5a8a', glow: '#5a8aba', light: '#8abaed' }, // Mavi
    { main: '#5a4a8a', glow: '#8a7aba', light: '#baaa' }, // Mor
    { main: '#4a7a9a', glow: '#6aaaca', light: '#9adafa' }, // Turkuaz
    { main: '#6a3a6a', glow: '#9a6a9a', light: '#ca9aca' }, // Magenta
    { main: '#4a8a7a', glow: '#6ababa', light: '#9aeaea' }, // Yeşil
    { main: '#8a4a4a', glow: '#ba7a7a', light: '#eaaaaa' }, // Kırmızı
    { main: '#7a7a4a', glow: '#aaba7a', light: '#daeaaa' }, // Sarı
  ];
  
  const currentLevelColor = hardModeActive 
    ? { main: '#991b1b', glow: '#ef4444', light: '#fca5a5' }
    : LEVEL_COLORS[(level.id - 1) % LEVEL_COLORS.length];

  const translations = {
    tr: {
      soundSettings: "Ses Ayarları",
      music: "Müzik",
      musicActive: "Müzik aktif",
      musicOff: "Müzik kapalı",
      effects: "Efektler",
      effectsActive: "Efektler aktif",
      effectsOff: "Efektler kapalı",
      on: "AÇIK",
      off: "KAPALI",
      hardMode: "ZOR MOD",
      hardModeSettings: "Zor Mod Ayarları",
      selectDifficulty: "Zorluk seviyesini seçin:",
      easy: "Kolay",
      medium: "Orta",
      hard: "Zor",
      cancel: "İptal",
      ok: "Tamam",
      disableHardMode: "Zor Modu Kapat",
    },
    en: {
      soundSettings: "Sound Settings",
      music: "Music",
      musicActive: "Music active",
      musicOff: "Music off",
      effects: "Effects",
      effectsActive: "Effects active",
      effectsOff: "Effects off",
      on: "ON",
      off: "OFF",
      hardMode: "HARD MODE",
      hardModeSettings: "Hard Mode Settings",
      selectDifficulty: "Select difficulty level:",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      cancel: "Cancel",
      ok: "OK",
      disableHardMode: "Disable Hard Mode",
    }
  };

  const t = translations[language];

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [currentWord, setCurrentWord] = useState('');
  const [dragPath, setDragPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentMousePos, setCurrentMousePos] = useState(null); // Parmak/fare pozisyonu
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorWord, setErrorWord] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [oldPositions, setOldPositions] = useState([]);
  const [showHintAnimation, setShowHintAnimation] = useState(false);
  const [showCenterWord, setShowCenterWord] = useState(null); // Ekran ortasında gösterilecek kelime
  const [hiddenEnglishWords, setHiddenEnglishWords] = useState(new Set()); // Ortadan kaybolan kelimeler (yerine dönmesin)
  
  // Yanlış kelime cezası hesaplama fonksiyonu
  const calculatePenalty = (attemptNumber) => {
    const penalties = [0.05, 0.10, 0.10, 0.15, 0.25, 0.50, 0.70, 0.80, 0.90];
    if (attemptNumber <= 0) return 0;
    if (attemptNumber <= 9) return penalties[attemptNumber - 1];
    return 1.00; // 10+ hatalar için
  };
  
  const [timer, setTimer] = useState(0);
  const [milliseconds, setMilliseconds] = useState(0);
  const [showCompletionCard, setShowCompletionCard] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState({});
  const [showFairyAnimation, setShowFairyAnimation] = useState(false);
  const [showHardModePopup, setShowHardModePopup] = useState(false);
  const [tempHardModeLevel, setTempHardModeLevel] = useState(hardModeLevel);
  const [fairyJokerUsed, setFairyJokerUsed] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [englishMode, setEnglishMode] = useState(() => {
    const saved = localStorage.getItem('englishMode');
    return saved === 'true';
  });
  
  // Oyun içi tutorial state'leri (Level 1-7 için)
  const [showInGameTutorial, setShowInGameTutorial] = useState(() => {
    // Level 1-7 arasındaysa ve bu level için tutorial gösterilmediyse
    if (level.id >= 1 && level.id <= 7) {
      const tutorialKey = `tutorial_level_${level.id}_shown`;
      return !localStorage.getItem(tutorialKey);
    }
    return false;
  });
  const [highlightedButton, setHighlightedButton] = useState(null);
  // Level 5'te zor mod aktif edildi mi? (Level 6 için kontrol)
  const [hardModeActivatedInTutorial, setHardModeActivatedInTutorial] = useState(false);
  // Level 1'de parmak animasyonu göster
  const [showFingerAnimation, setShowFingerAnimation] = useState(false);
  // Level 2-3'te joker kullanıldıktan sonra kutuya odaklanma animasyonu
  const [showWordBoxFocus, setShowWordBoxFocus] = useState(false);
  
  const circleRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const msTimerRef = useRef(null);
  const audioContextRef = useRef(null);

  // Zor mod iu00e7in rastgele harfler oluu015fturan fonksiyon
  const getRandomLetters = useCallback((count, existingLetters) => {
    // Sadece harfleri içeren Türkçe alfabe (rakam yok)
    const turkishAlphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
    let result = [];
    
    // Mevcut harfleri büyük harfe çevirip bir set oluştur (case-insensitive karşılaştırma için)
    const existingLettersSet = new Set();
    existingLetters.forEach(letter => {
      // Sayı değilse ekle
      if (!/^\d+$/.test(letter)) {
        existingLettersSet.add(toTurkishUpperCase(letter));
      }
    });
    
    // Mevcut harfler du0131u015fu0131ndaki harfleri bir diziye al
    const availableLetters = [];
    for (let i = 0; i < turkishAlphabet.length; i++) {
      const letter = turkishAlphabet[i];
      if (!existingLettersSet.has(letter)) {
        availableLetters.push(letter);
      }
    }
    
    // Eger mevcut harfler tu00fcm alfabeyi kapsu0131yorsa (bu pek mumkun degil ama kontrol edelim)
    if (availableLetters.length === 0) {
      return result; // Bou015f dizi du00f6ndu00fcr
    }
    
    // u0130stenilen sayu0131da benzersiz harf seu00e7
    for (let i = 0; i < count; i++) {
      if (availableLetters.length === 0) break; // Tu00fcm harfler kullanu0131ldu0131ysa du00f6ngu00fcyu00fc sonlandu0131r
      
      const randomIndex = Math.floor(Math.random() * availableLetters.length);
      const selectedLetter = availableLetters[randomIndex];
      
      result.push(selectedLetter);
      
      // Seu00e7ilen harfi listeden u00e7u0131kar ki tekrar seu00e7ilmesin
      availableLetters.splice(randomIndex, 1);
    }
    
    return result;
  }, []);

  useEffect(() => {
    // level değiştiğinde state'leri sıfırlayalım
    setFoundWords(new Set());
    setTimer(0);
    setMilliseconds(0);
    setShowCompletionCard(false);
    setSelectedLetters([]);
    setCurrentWord('');
    setDragPath([]);
    setIsDragging(false);
    setWrongAttempts(0); // Yanlış deneme sayacını sıfırla
    
    // Timer'ı başlat
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    
    // Milisaniye timer'ı başlat
    msTimerRef.current = setInterval(() => {
      setMilliseconds(prev => (prev + 1) % 100);
    }, 10);
    
    // AudioContext oluştur
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API desteklenmiyor:', e);
      }
    }
    
    return () => {
      // Component unmount olduğunda timer'ları temizle
      if (timerRef.current) clearInterval(timerRef.current);
      if (msTimerRef.current) clearInterval(msTimerRef.current);
    };
  }, [level.id]);  // level.id değiştiğinde çalışacak

  // İngilizce mod değişikliklerini dinle
  useEffect(() => {
    const handleEnglishModeChange = (event) => {
      setEnglishMode(event.detail.enabled);
    };
    
    window.addEventListener('englishModeChange', handleEnglishModeChange);
    
    return () => {
      window.removeEventListener('englishModeChange', handleEnglishModeChange);
    };
  }, []);

  // Zor mod müziği kontrolü
  useEffect(() => {
    if (hardModeActive) {
      playHardModeMusic();
    } else {
      stopHardModeMusic();
    }
  }, [hardModeActive]);

  useEffect(() => {
    // Önce eski timer'ları temizleyelim
    if (timerRef.current) clearInterval(timerRef.current);
    if (msTimerRef.current) clearInterval(msTimerRef.current);

    // Yeni timer'ları başlatalım
    msTimerRef.current = setInterval(() => {
      setMilliseconds(prev => (prev + 1) % 100);
    }, 10);

    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    // Cleanup
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (msTimerRef.current) clearInterval(msTimerRef.current);
    };
  }, [level.id]); // level.id değiştiğinde timer'ı yeniden başlat

  // Ses efekti çalma fonksiyonu
  const playClickSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    try {
      const currentTime = audioContextRef.current.currentTime;
      
      // Bebek piyano sesleri için notalar (C major scale)
      const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
      
      // Rastgele bir nota seç
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      
      // Oscillator oluştur
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      // Daha yumuşak bir ses için 'sine' dalga formu
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(randomNote, currentTime);
      
      // Sesi yumuşat ve hafif bir reverb efekti ekle
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.3);
      
      // Bağlantıları yap
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Sesi çal
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.3);
    } catch (e) {
      console.error('Ses çalma hatası:', e);
    }
  }, []);

  // Ses u00e7alma fonksiyonu
  const playSound = useCallback((soundName) => {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.play();
  }, []);

  const formatTime = (seconds, ms) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const ms10 = Math.floor(ms / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms10.toString().padStart(2, '0')}`;
  };

  // Level nesnesinden harfleri al
  const baseLetters = typeof level.letters === 'string' ? level.letters.split('') : level.letters;
  
  // Harfleri karu0131u015ftu0131r ve zor modda ek harfler ekle
  const letters = useMemo(() => {
    // İngilizce modda İngilizce kelimelerin harflerini kullan
    let levelLetters;
    if (englishMode) {
      // Tüm İngilizce kelimelerin harflerini birleştir
      levelLetters = level.words.flatMap(word => word.english.toUpperCase().split(''));
    } else {
      // Normal mod: Türkçe harfler
      levelLetters = typeof level.letters === 'string' ? level.letters.split('') : level.letters;
    }
    
    // Sadece harf karakterlerini filtrele (sayıları çıkar)
    levelLetters = levelLetters.filter(letter => {
      // Sayı mı kontrol et
      return !/^\d+$/.test(letter);
    });
    
    if (!hardModeActive) return levelLetters;
    
    let randomLetterCount = 0;
    
    // Zorluk seviyesine gu00f6re eklenecek rastgele harf sayu0131su0131nu0131 belirle
    switch (hardModeLevel) {
      case 1:
        randomLetterCount = 1;
        break;
      case 2:
        randomLetterCount = 2;
        break;
      case 3:
        randomLetterCount = 4;
        break;
      default:
        randomLetterCount = 0;
    }
    
    // Rastgele harfleri ekle
    const randomLetters = getRandomLetters(randomLetterCount, levelLetters);
    return [...levelLetters, ...randomLetters];
  }, [level.letters, level.words, hardModeActive, hardModeLevel, getRandomLetters, englishMode]);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const calculateLetterPositions = () => {
    // Daire çapını artırıyoruz - 10+ harf için daha büyük
    const letterCount = letters.length;
    let radius = 120; // varsayılan
    
    if (letterCount >= 13) radius = 136;
    else if (letterCount >= 11) radius = 130;
    else if (letterCount >= 10) radius = 132;
    
    const centerX = 150;
    const centerY = 150;
    
    // Harfleri karıştır
    const shuffledLetters = shuffleArray([...letters]);
    
    return shuffledLetters.map((letter, index) => {
      const angle = ((index / shuffledLetters.length) * 2 * Math.PI) + (Math.PI / 2);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { letter, x, y };
    });
  };

  const letterPositions = useMemo(() => {
    return calculateLetterPositions();
  }, [letters, shuffleKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrame;
    let rotation = 0;
    
    const drawCircle = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Harf sayısına göre dinamik çember yarıçapı
      const letterCount = letters.length;
      let circleRadius = 120;
      if (letterCount >= 13) circleRadius = 136;
      else if (letterCount >= 11) circleRadius = 130;
      else if (letterCount >= 10) circleRadius = 132;
      
      // Her bölüm için farklı renk (level.id'ye göre) - Zor modda kırmızı
      const levelColors = [
        { main: '#4a4a6a', glow: '#6a6a9a' }, // Lacivert
        { main: '#3a5a8a', glow: '#5a8aba' }, // Mavi
        { main: '#5a4a8a', glow: '#8a7aba' }, // Mor
        { main: '#4a7a9a', glow: '#6aaaca' }, // Turkuaz
        { main: '#6a3a6a', glow: '#9a6a9a' }, // Magenta
        { main: '#4a8a7a', glow: '#6ababa' }, // Yeşil
        { main: '#8a4a4a', glow: '#ba7a7a' }, // Kırmızı
        { main: '#7a7a4a', glow: '#aaba7a' }, // Sarı
      ];
      const colorIndex = (level.id - 1) % levelColors.length;
      const levelColor = hardModeActive 
        ? { main: '#991b1b', glow: '#ef4444' } // Zor modda kırmızı
        : levelColors[colorIndex];
      
      // Dönen ışık halkası - sadece düşük kalite değilse
      if (graphicsQuality !== 'low') {
        rotation += 0.02;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + rotation;
          const startAngle = angle;
          const endAngle = angle + Math.PI / 6;
          
          ctx.beginPath();
          ctx.arc(150, 150, circleRadius, startAngle, endAngle);
          const gradient = ctx.createLinearGradient(
            150 + Math.cos(startAngle) * circleRadius,
            150 + Math.sin(startAngle) * circleRadius,
            150 + Math.cos(endAngle) * circleRadius,
            150 + Math.sin(endAngle) * circleRadius
          );
          gradient.addColorStop(0, `${levelColor.glow}00`);
          gradient.addColorStop(0.5, `${levelColor.glow}bb`);
          gradient.addColorStop(1, `${levelColor.glow}00`);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 6;
          ctx.stroke();
        }
      }
      
      // Daire çizgisi - Bölüm rengine göre
      ctx.beginPath();
      ctx.arc(150, 150, circleRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = levelColor.main;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Dış daire efekti - sadece düşük kalite değilse
      if (graphicsQuality !== 'low') {
        ctx.beginPath();
        ctx.arc(150, 150, circleRadius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = `${COLORS.secondary}11`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // İç daire efekti
        ctx.beginPath();
        ctx.arc(150, 150, circleRadius - 5, 0, 2 * Math.PI);
        ctx.strokeStyle = `${COLORS.secondary}11`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Seçim çizgisi çizimi - Net ve temiz (parmak takipli)
      if (dragPath.length > 0 && isDragging) {
        const firstLetterPos = letterPositions[dragPath[0]];
        if (firstLetterPos) {
          // Tek katman, net çizgi - Level rengine göre
          ctx.beginPath();
          ctx.moveTo(firstLetterPos.x, firstLetterPos.y);
          
          // Seçilen harfler arasında çiz
          for (let i = 1; i < dragPath.length; i++) {
            const letterPos = letterPositions[dragPath[i]];
            if (letterPos) {
              ctx.lineTo(letterPos.x, letterPos.y);
            }
          }
          
          // Son seçilen harften parmak pozisyonuna kadar çiz
          if (currentMousePos && dragPath.length > 0) {
            const lastLetterPos = letterPositions[dragPath[dragPath.length - 1]];
            if (lastLetterPos) {
              ctx.lineTo(currentMousePos.x, currentMousePos.y);
            }
          }
          
          ctx.strokeStyle = levelColor.glow;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
      }
    };

    const animate = () => {
      drawCircle();
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [dragPath, COLORS.primary, COLORS.secondary, COLORS.trail, COLORS.glow, COLORS.highlight, COLORS.accent, letterPositions, graphicsQuality, currentMousePos, isDragging]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !circleRef.current) return;

    const rect = circleRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / 1.2; // scale faktörünü hesaba katıyoruz
    const y = (e.clientY - rect.top) / 1.2;

    // Parmak/fare pozisyonunu güncelle (çizgi için)
    setCurrentMousePos({ x, y });

    // Hassasiyet eşiği (daha küçük = daha hassas, daha büyük = daha az hassas)
    const threshold = 30;

    // Fare pozisyonuna en yakın harfi bul
    const nearestLetterIndex = letterPositions.findIndex(pos => {
      const distance = Math.sqrt(
        Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2)
      );
      return distance < threshold;
    });

    if (nearestLetterIndex !== -1) {
      const letterPos = letterPositions[nearestLetterIndex];
      const isAlreadySelected = selectedLetters.some(
        l => l.position.x === letterPos.x && l.position.y === letterPos.y
      );

      if (!isAlreadySelected) {
        setSelectedLetters(prev => [...prev, { letter: letterPos.letter, position: letterPos }]);
        setCurrentWord(prev => prev + letterPos.letter);
        
        // Seçilen harfi dragPath'e ekle
        setDragPath(prev => {
          if (!prev.includes(nearestLetterIndex)) {
            // Ses efekti çal
            playClickSound();
            return [...prev, nearestLetterIndex];
          }
          return prev;
        });
      }
    }
  }, [isDragging, letterPositions, selectedLetters, playClickSound]);

  const handleMouseDown = useCallback((e, letter, position) => {
    // Eğer bir buton highlight edilmişse (tutorial aktif), harf seçimini engelle
    // ANCAK 'letters' durumunda harf seçimine izin ver (Level 1)
    if (highlightedButton && highlightedButton !== 'letters') return;
    
    e.preventDefault();
    setIsDragging(true);
    setSelectedLetters([{ letter, position }]);
    setCurrentWord(letter);
    
    // Ses efekti çal
    playClickSound();
    
    // Başlangıç harfinin indeksini bul ve dragPath'e ekle
    const startIndex = letterPositions.findIndex(pos => 
      pos.x === position.x && pos.y === position.y
    );
    if (startIndex !== -1) {
      setDragPath([startIndex]);
    }
  }, [letterPositions, playClickSound, highlightedButton]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setCurrentMousePos(null); // Parmak pozisyonunu temizle
    
    const word = currentWord;
    // İngilizce modda İngilizce kelimeyi ara, normal modda Türkçe kelimeyi ara
    const matchingWord = level.words.find(w => 
      englishMode ? w.english.toUpperCase() === word : w.turkish === word
    );

    if (matchingWord && !foundWords.has(matchingWord.turkish)) {
      setShowSuccess(true);
      
      // Önce kutu yerinde görünsün, 500ms sonra ortaya gitsin
      setTimeout(() => {
        setShowCenterWord({
          turkish: matchingWord.turkish,
          english: matchingWord.english
        });
        // 2 saniye ortada kalsın, sonra kaybolsun (yerine dönmesin)
        setTimeout(() => {
          setHiddenEnglishWords(prev => new Set([...prev, matchingWord.turkish]));
          setShowCenterWord(null);
        }, 1500);
      }, 500);
      
      // Level 1'de ilk kelime bulunduğunda parmak animasyonunu ve highlight'ı kaldır
      if (level.id === 1 && highlightedButton === 'letters') {
        setShowFingerAnimation(false);
        setHighlightedButton(null);
      }
      
      // confetti({
      //   particleCount: 50,
      //   spread: 60,
      //   origin: { y: 0.6 },
      //   colors: [COLORS.primary, COLORS.secondary, COLORS.accent]
      // });

      setTimeout(() => setShowSuccess(false), 1000);
      
      setFoundWords(prev => new Set([...prev, matchingWord.turkish]));
      
      if (foundWords.size + 1 === level.words.length) {
        // Stop timers when level is completed
        if (timerRef.current) clearInterval(timerRef.current);
        if (msTimerRef.current) clearInterval(msTimerRef.current);
        
        setTimeout(() => {
          // confetti({
          //   particleCount: 100,
          //   spread: 100,
          //   origin: { y: 0.6 },
          //   colors: [COLORS.primary, COLORS.secondary, COLORS.accent]
          // });
          setShowCompletionCard(true);
          onComplete(level.id, timer + (milliseconds / 100));
        }, 2250); // Kelime animasyonu bittikten sonra aç (2s + 0.25s)
      }
    } else if (word.length >= 2) {
      // Yanlış kelime - hata animasyonu göster ve ceza uygula
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      
      const penalty = calculatePenalty(newWrongAttempts);
      useDiamond(penalty); // Pozitif değer gönder, useDiamond zaten çıkarma yapıyor
      
      setErrorWord(word);
      setShowError(true);
      setTimeout(() => setShowError(false), 700);
    }

    setSelectedLetters([]);
    setCurrentWord('');
    setDragPath([]);
  }, [currentWord, foundWords, level, onComplete, timer, milliseconds]);

  const handleTouchStart = useCallback((e, letter, position) => {
    // Eğer bir buton highlight edilmişse (tutorial aktif), harf seçimini engelle
    // ANCAK 'letters' durumunda harf seçimine izin ver (Level 1)
    if (highlightedButton && highlightedButton !== 'letters') return;
    
    try {
      // Varsayilan davranisi engelle
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      setSelectedLetters([{ letter, position }]);
      setCurrentWord(letter);
      
      // Ses efekti çal
      playClickSound();
      
      // Baslangic harfinin indeksini bul ve dragPath'e ekle
      const startIndex = letterPositions.findIndex(pos => 
        pos.x === position.x && pos.y === position.y
      );
      if (startIndex !== -1) {
        setDragPath([startIndex]);
      }
    } catch (error) {
      console.error('Touch start error:', error);
      // Hata durumunda state'i temizle
      setIsDragging(false);
      setSelectedLetters([]);
      setCurrentWord('');
      setDragPath([]);
    }
  }, [letterPositions, playClickSound, highlightedButton]);

  const handleTouchEnd = useCallback((e) => {
    try {
      // Varsayilan davranisi engelle
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      setIsDragging(false);
      setCurrentMousePos(null); // Parmak pozisyonunu temizle
      
      const word = currentWord;
      // İngilizce modda İngilizce kelimeyi ara, normal modda Türkçe kelimeyi ara
      const matchingWord = level.words.find(w => 
        englishMode ? w.english.toUpperCase() === word : w.turkish === word
      );

      if (matchingWord && !foundWords.has(matchingWord.turkish)) {
        setShowSuccess(true);
        
        // Önce kutu yerinde görünsün, 500ms sonra ortaya gitsin
        setTimeout(() => {
          setShowCenterWord({
            turkish: matchingWord.turkish,
            english: matchingWord.english
          });
          // 2 saniye ortada kalsın, sonra kaybolsun (yerine dönmesin)
          setTimeout(() => {
            setHiddenEnglishWords(prev => new Set([...prev, matchingWord.turkish]));
            setShowCenterWord(null);
          }, 1500);
        }, 500);
        
        // Level 1'de ilk kelime bulunduğunda parmak animasyonunu ve highlight'ı kaldır
        if (level.id === 1 && highlightedButton === 'letters') {
          setShowFingerAnimation(false);
          setHighlightedButton(null);
        }
        
        // confetti({
        //   particleCount: 50,
        //   spread: 60,
        //   origin: { y: 0.6 },
        //   colors: [COLORS.primary, COLORS.secondary, COLORS.accent]
        // });

        setTimeout(() => setShowSuccess(false), 1000);
        
        setFoundWords(prev => new Set([...prev, matchingWord.turkish]));
        
        if (foundWords.size + 1 === level.words.length) {
          // Stop timers when level is completed
          if (timerRef.current) clearInterval(timerRef.current);
          if (msTimerRef.current) clearInterval(msTimerRef.current);
          
          setTimeout(() => {
            // confetti({
            //   particleCount: 100,
            //   spread: 100,
            //   origin: { y: 0.6 },
            //   colors: [COLORS.primary, COLORS.secondary, COLORS.accent]
            // });
            setShowCompletionCard(true);
            onComplete(level.id, timer + (milliseconds / 100));
          }, 2250); // Kelime animasyonu bittikten sonra aç (2s + 0.25s)
        }
      } else if (word.length >= 2) {
        // Yanlış kelime - hata animasyonu göster ve ceza uygula
        const newWrongAttempts = wrongAttempts + 1;
        setWrongAttempts(newWrongAttempts);
        
        const penalty = calculatePenalty(newWrongAttempts);
        useDiamond(penalty); // Pozitif değer gönder, useDiamond zaten çıkarma yapıyor
        
        setErrorWord(word);
        setShowError(true);
        setTimeout(() => setShowError(false), 700);
      }

      setSelectedLetters([]);
      setCurrentWord('');
      setDragPath([]);
    } catch (error) {
      console.error('Touch end error:', error);
      // Hata durumunda state'i temizle
      setIsDragging(false);
      setSelectedLetters([]);
      setCurrentWord('');
      setDragPath([]);
    }
  }, [currentWord, foundWords, level, onComplete, timer, milliseconds]);

  const handleTouchMove = useCallback((e) => {
    // Varsayilan davranisi engelle
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (!isDragging || !circleRef.current) return;
      
      // Dokunmatik olayda birden fazla dokunma noktası olabilir, ilkini alıyoruz
      const touch = e.touches[0];
      
      const rect = circleRef.current.getBoundingClientRect();
      // Dokunmatik koordinat hesaplamasını iyileştirdim
      const x = (touch.clientX - rect.left); 
      const y = (touch.clientY - rect.top);

      // Parmak pozisyonunu güncelle (çizgi için) - scale faktörü ile
      const scaledX = x / (rect.width / 300);
      const scaledY = y / (rect.height / 300);
      setCurrentMousePos({ x: scaledX, y: scaledY });

      // Dokunmatik ekranlarda daha yüksek hassasiyet eşiği (daha küçük = daha hassas)
      const threshold = 50;

      // Dokunulan noktaya en yakın harfi bul
      const nearestLetterIndex = letterPositions.findIndex(pos => {
        // Harfin gerçek ekran koordinatlarını hesapla
        const letterScreenX = pos.x * (rect.width / 300);
        const letterScreenY = pos.y * (rect.height / 300);
        
        const distance = Math.sqrt(
          Math.pow(letterScreenX - x, 2) + Math.pow(letterScreenY - y, 2)
        );
        return distance < threshold;
      });

      if (nearestLetterIndex !== -1) {
        const letterPos = letterPositions[nearestLetterIndex];
        const isAlreadySelected = selectedLetters.some(
          l => l.position.x === letterPos.x && l.position.y === letterPos.y
        );

        if (!isAlreadySelected) {
          // Performans için state güncellemelerini birleştirdim
          const newSelectedLetters = [...selectedLetters, { letter: letterPos.letter, position: letterPos }];
          const newWord = currentWord + letterPos.letter;
          const newDragPath = dragPath.includes(nearestLetterIndex) ? dragPath : [...dragPath, nearestLetterIndex];
          
          // Ses efekti çal
          playClickSound();
          
          setSelectedLetters(newSelectedLetters);
          setCurrentWord(newWord);
          setDragPath(newDragPath);
        }
      }
    } catch (error) {
      console.error('Touch move error:', error);
      // Hata durumunda iu015flemi iptal et ama state'i temizleme
      // Bu u015fekilde kullancu0131 seu00e7ime devam edebilir
    }
  }, [isDragging, letterPositions, selectedLetters, dragPath, currentWord, playClickSound]);

  // Dokunmatik olaylar için sayfa kaydırmasını engelleme
  useEffect(() => {
    const preventDefaultTouchMove = (e) => {
      // Oyun alanında dokunmatik kaydırma olayını engelle
      if (circleRef.current && circleRef.current.contains(e.target)) {
        e.preventDefault();
      }
    };

    // Sayfa genelinde dokunmatik kaydırma olayını dinle
    document.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefaultTouchMove);
    };
  }, []);

  // İpucu fonksiyonu
  const handleHint = useCallback(() => {
    if (diamonds < 20) return; // Yeterli elmas yoksa ipucu verme
    
    // İpucu animasyonunu başlat
    setShowHintAnimation(true);
    setTimeout(() => setShowHintAnimation(false), 1200);
    
    // İpucu sesini çal
    playHintSound();
    
    // Rastgele bir kelime seç (henüz bulunmamış olanlardan)
    const unsolvedWords = level.words.filter(word => !foundWords.has(word.turkish));
    
    if (unsolvedWords.length === 0) return; // Tüm kelimeler bulunmuşsa ipucu verme
    
    const randomWord = unsolvedWords[Math.floor(Math.random() * unsolvedWords.length)];
    
    // Kelimede henüz açılmamış bir harf bul
    let revealedForWord = revealedLetters[randomWord.turkish] || [];
    let availableIndices = [];
    
    // İngilizce modda İngilizce kelimenin uzunluğunu kullan
    const wordLength = englishMode ? randomWord.english.length : randomWord.turkish.length;
    
    for (let i = 0; i < wordLength; i++) {
      if (!revealedForWord.includes(i)) {
        availableIndices.push(i);
      }
    }
    
    if (availableIndices.length === 0) return; // Tüm harfler zaten açılmışsa ipucu verme
    
    // Rastgele bir harf seç ve aç
    const indexToReveal = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    setRevealedLetters(prev => ({
      ...prev,
      [randomWord.turkish]: [...(prev[randomWord.turkish] || []), indexToReveal]
    }));
    
    // Elmas sayısını azalt
    useDiamond(20);
    
    // Ses efekti çal
    playClickSound();
    
    // Geliştirilmiş ışık efekti animasyonu
    const letterElement = document.querySelector(`[data-word="${randomWord.turkish}"][data-index="${indexToReveal}"]`);
    if (letterElement) {
      // Güçlü parlama efekti
      const glowAnimation = {
        boxShadow: [
          `0 0 10px ${COLORS.highlight}`,
          `0 0 30px ${COLORS.primary}, 0 0 60px ${COLORS.accent}`,
          `0 0 50px ${COLORS.primary}, 0 0 80px ${COLORS.accent}`,
          `0 0 30px ${COLORS.primary}, 0 0 60px ${COLORS.accent}`,
          `0 0 10px ${COLORS.highlight}`
        ],
        scale: [1, 1.3, 1.4, 1.3, 1],
        backgroundColor: [
          'transparent',
          `${COLORS.primary}44`,
          `${COLORS.accent}66`,
          `${COLORS.primary}44`,
          'transparent'
        ]
      };
      
      // Animasyonu uygula - sadece düşük kalite değilse
      if (graphicsQuality !== 'low') {
        letterElement.animate(glowAnimation, {
          duration: 2000,
          easing: 'ease-in-out'
        });
      }
      
      // Parçacık efekti ekle - sadece düşük kalite değilse
      if (graphicsQuality !== 'low') {
        const rect = letterElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const particleCount = graphicsQuality === 'high' ? 12 : 6; // Orta kalitede yarısı
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: ${COLORS.accent};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${centerX}px;
            top: ${centerY}px;
            box-shadow: 0 0 10px ${COLORS.accent};
          `;
          document.body.appendChild(particle);
          
          const angle = (i / particleCount) * Math.PI * 2;
          const distance = 50 + Math.random() * 30;
          
          particle.animate([
            {
              transform: 'translate(0, 0) scale(1)',
              opacity: 1
            },
            {
              transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
              opacity: 0
            }
          ], {
            duration: 800,
            easing: 'ease-out'
          }).onfinish = () => particle.remove();
        }
      }
    }
    
    // Level 2 tutorial için: joker kullanıldıktan sonra kutuya odaklanma animasyonu
    if (level.id === 2 && highlightedButton === null) {
      setTimeout(() => {
        setShowWordBoxFocus(true);
        setTimeout(() => setShowWordBoxFocus(false), 3000);
      }, 1500);
    }
  }, [diamonds, foundWords, level.words, level.id, revealedLetters, useDiamond, playClickSound, playHintSound, highlightedButton]);

  // Peri jokeri fonksiyonu
  const handleFairyJoker = useCallback(() => {
    if (diamonds < 60 || fairyJokerUsed) return;
    
    // Tüm harflerin zaten açık olup olmadığını kontrol et
    const allWords = level.words;
    let totalLetters = 0;
    let revealedCount = 0;
    
    allWords.forEach(word => {
      // İngilizce modda İngilizce kelimenin uzunluğunu kullan
      const wordLength = englishMode ? word.english.length : word.turkish.length;
      totalLetters += wordLength;
      if (revealedLetters[word.turkish]) {
        revealedCount += revealedLetters[word.turkish].length;
      }
    });
    
    // Eğer tüm harfler zaten açıksa, peri jokerini kullanma
    if (totalLetters === revealedCount) {
      return; // Elmas düşmeden çık
    }
    
    playFairyJokerSound();
    
    const newRevealedLetters = { ...revealedLetters };
    
    // Peri pozisyonunu al (sağ üst köşedeki peri konumu)
    const fairyPosition = {
      x: window.innerWidth * 0.63 + 220,
      y: window.innerHeight * 0.14 + 10
    };
    
    // Bölüm renkleri - diğer kutularla aynı
    const levelColors = [
      { bg: '#1a1a2e', border: '#4a4a6a', text: '#c0c0d0' },
      { bg: '#16213e', border: '#3a5a8a', text: '#a0c0e0' },
      { bg: '#1a1a2e', border: '#5a4a8a', text: '#c0b0e0' },
      { bg: '#162a2e', border: '#4a7a9a', text: '#a0d0e0' },
      { bg: '#2a1a2a', border: '#6a3a6a', text: '#d0a0d0' },
      { bg: '#1a2a2a', border: '#4a8a7a', text: '#a0e0d0' },
      { bg: '#2a1a1a', border: '#8a4a4a', text: '#e0a0a0' },
      { bg: '#2a2a1a', border: '#7a7a4a', text: '#e0e0a0' },
    ];
    const colorIndex = (level.id - 1) % levelColors.length;
    const levelColor = hardModeActive 
      ? { bg: '#3a1a1a', border: '#991b1b', text: '#fca5a5' }
      : levelColors[colorIndex];
    
    allWords.forEach((word, wordIndex) => {
      // İngilizce modda İngilizce kelimenin harflerini kullan
      const wordText = englishMode ? word.english : word.turkish;
      const wordLetters = wordText.split('');
      
      wordLetters.forEach((letter, letterIndex) => {
        if (!newRevealedLetters[word.turkish]) {
          newRevealedLetters[word.turkish] = [];
        }
        
        if (!newRevealedLetters[word.turkish].includes(letterIndex)) {
          newRevealedLetters[word.turkish].push(letterIndex);
          
          // Her harf için uçan element oluştur - bölüm renginde kutu
          const flyingLetter = document.createElement('div');
          flyingLetter.className = 'flying-letter';
          flyingLetter.style.cssText = `
            position: fixed;
            z-index: 9999;
            font-size: 28px;
            font-weight: bold;
            color: #FFFFFF;
            background: ${levelColor.bg}f5;
            border: 3px solid ${levelColor.border};
            border-radius: 8px;
            padding: 8px 12px;
            min-width: 40px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 25px ${levelColor.border}88;
            pointer-events: none;
            top: ${fairyPosition.y}px;
            left: ${fairyPosition.x}px;
          `;
          flyingLetter.textContent = englishMode ? letter.toUpperCase() : toTurkishUpperCase(letter);
          document.body.appendChild(flyingLetter);
          
          // Hedef kutuyu bul
          const targetBox = document.querySelector(`[data-word="${word.turkish}"][data-index="${letterIndex}"]`);
          if (targetBox) {
            // Hedef kutudaki harf elementini bul
            const letterElement = targetBox.querySelector('span');
            if (letterElement) {
              // Harfi gizleme - artık harfi gizlemiyoruz çünkü zaten görünmez durumda
              letterElement.style.display = 'block';
              letterElement.style.opacity = '1';
              letterElement.style.transform = 'scale(1)';
              letterElement.textContent = englishMode ? letter.toUpperCase() : toTurkishUpperCase(letter);
            }
            
            const targetRect = targetBox.getBoundingClientRect();
            const targetX = targetRect.left + (targetRect.width / 2);
            const targetY = targetRect.top + (targetRect.height / 2);
            
            // Rastgele ara noktalar oluştur (daha doğal bir yol için)
            const controlPoint1 = {
              x: fairyPosition.x + (Math.random() * 150 - 75),
              y: fairyPosition.y + (Math.random() * 150 - 75)
            };
            const controlPoint2 = {
              x: targetX + (Math.random() * 150 - 75),
              y: targetY + (Math.random() * 150 - 75)
            };
            
            // Bezier eğrisi animasyonu
            const animation = flyingLetter.animate([
              {
                transform: 'translate(0, 0) scale(1) rotate(0deg)',
                opacity: 1
              },
              {
                transform: `translate(
                  ${controlPoint1.x - fairyPosition.x}px, 
                  ${controlPoint1.y - fairyPosition.y}px
                ) scale(1.2) rotate(${Math.random() * 360}deg)`,
                opacity: 0.8,
                offset: 0.3
              },
              {
                transform: `translate(
                  ${controlPoint2.x - fairyPosition.x}px, 
                  ${controlPoint2.y - fairyPosition.y}px
                ) scale(0.8) rotate(${Math.random() * 360}deg)`,
                opacity: 0.6,
                offset: 0.6
              },
              {
                transform: `translate(
                  ${targetX - fairyPosition.x}px, 
                  ${targetY - fairyPosition.y}px
                ) scale(0.5) rotate(${Math.random() * 360}deg)`,
                opacity: 0
              }
            ], {
              duration: 3000 + (Math.random() * 1500),
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              delay: (wordIndex * 300) + (letterIndex * 400)
            });
            
            // Animasyon bittiğinde elementi kaldır ve hedef harfi göster
            animation.onfinish = () => {
              document.body.removeChild(flyingLetter);
              
              // Sihir tozu efektini başlat
              createSparkles(targetX, targetY);
              
              // Kısa bir gecikme sonra harfi göster
              setTimeout(() => {
                // Hedef kutudaki harfi göster ve varış animasyonunu uygula
                const letterElement = targetBox.querySelector('span');
                if (letterElement) {
                  letterElement.style.display = 'block';
                  
                  // Basit ve temiz harf görünme animasyonu
                  const appearAnimation = letterElement.animate([
                    {
                      transform: 'scale(0)',
                      opacity: 0
                    },
                    {
                      transform: 'scale(1.3)',
                      opacity: 1,
                      offset: 0.6
                    },
                    {
                      transform: 'scale(1)',
                      opacity: 1
                    }
                  ], {
                    duration: 500,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  });
                  
                  appearAnimation.onfinish = () => {
                    letterElement.style.opacity = '1';
                    letterElement.style.transform = 'scale(1)';
                  };
                }
              }, 500); // Sihir tozu efektinden sonra harfi göster
            };
          }
        }
      });
    });
    
    setRevealedLetters(newRevealedLetters);
    useDiamond(60);
    setShowFairyAnimation(true);
    
    setTimeout(() => {
      setShowFairyAnimation(false);
    }, 5000); // Peri animasyonu süresini artırdık
    
    setFairyJokerUsed(true);
    
    // Level 3 tutorial için: joker kullanıldıktan sonra kutuya odaklanma animasyonu
    if (level.id === 3 && highlightedButton === null) {
      setTimeout(() => {
        setShowWordBoxFocus(true);
        setTimeout(() => setShowWordBoxFocus(false), 3000);
      }, 2000);
    }
    
  }, [diamonds, level.words, level.id, revealedLetters, useDiamond, playFairyJokerSound, fairyJokerUsed, highlightedButton]);

  // Peri tozu efekti için fonksiyon - Sadece yüksek kalitede
  const createSparkles = useCallback((x, y) => {
    // Düşük grafik kalitesinde sparkle efektini atla
    if (graphicsQuality === 'low') return;
    
    const sparkleCount = graphicsQuality === 'high' ? 20 : 10; // Orta kalitede yarısı
    const colors = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'];
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 0 10px currentColor;
        left: ${x}px;
        top: ${y}px;
      `;
      
      document.body.appendChild(sparkle);
      
      const angle = (Math.random() * Math.PI * 2);
      const velocity = 1 + Math.random() * 2;
      const size = 2 + Math.random() * 3;
      const lifetime = 1000 + Math.random() * 1500;
      
      sparkle.animate([
        {
          transform: `translate(0px, 0px) scale(${size})`,
          opacity: 1
        },
        {
          transform: `translate(
            ${Math.cos(angle) * 50 * velocity}px,
            ${Math.sin(angle) * 50 * velocity}px
          ) scale(0)`,
          opacity: 0
        }
      ], {
        duration: lifetime,
        easing: 'cubic-bezier(0, .9, .57, 1)',
        fill: 'forwards'
      }).onfinish = () => sparkle.remove();
    }
  }, [graphicsQuality]);

  // Harf karıştırma fonksiyonu (ücretsiz)
  const handleShuffle = useCallback(() => {
    if (isShuffling) return; // Animasyon sırasında tekrar tıklamayı engelle
    
    // Karıştır sesini çal
    playShuffleSound();
    
    // Mevcut pozisyonları kaydet
    setOldPositions(letterPositions.map(pos => ({ x: pos.x, y: pos.y })));
    
    setIsShuffling(true);
    
    // Önce merkeze toplama animasyonunu başlat
    // Sonra yeni pozisyonları hesapla
    setTimeout(() => {
      setShuffleKey(prev => prev + 1);
    }, 500); // Merkeze toplanma ve karışma tamamlandıktan sonra
    
    // Animasyon bitince state'i temizle
    setTimeout(() => {
      setIsShuffling(false);
      setOldPositions([]);
    }, 900);
  }, [isShuffling, letterPositions]);

  const canvasSize = 300; // Canvas boyutunu tanimlayalim - component seviyesinde

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        background: hardModeActive 
          ? `linear-gradient(135deg, #1a0000 0%, #4a0000 25%, #8b0000 50%, #4a0000 75%, #1a0000 100%)`
          : `linear-gradient(135deg, ${COLORS.background} 0%, #1E1B4B 50%, #312E81 100%)`,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.5s ease-in-out'
      }}
    >
      {/* Arka Plan Resmi */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(/backgrounds/game_bg_${((level.id - 1) % 52) + 1}.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'repeat-y',
          opacity: 0.9
        }}
      />
      
      {/* Ekran Ortasında gösterim için arka plan karartma */}
      <AnimatePresence>
        {showCenterWord && (
          <motion.div 
            className="fixed inset-0 z-[90] pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      
      <div className="relative z-10 w-full max-w-md px-4 flex flex-col min-h-screen"> 
        {/* Level Title with Timer and Diamond Counter - Fixed at top */}
        <div className="fixed top-0 left-0 right-0 flex items-center justify-between w-full py-3 px-3 z-50" 
          style={{
            background: hardModeActive ? 'rgba(127, 29, 29, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(6px)',
            borderBottom: hardModeActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)'
          }}> 
          <div className="flex items-center gap-2">
            {/* Level Badge */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`relative flex items-center backdrop-blur-md rounded-md px-2 py-1 shadow-lg ${hardModeActive ? 'bg-red-900/30 border border-red-500/40' : 'bg-white/10 border border-white/20'}`}>
                {/* Seviye İkonu */}
                <div className="mr-1">
                  {level.id <= 10 && <span className="text-sm">📚</span>}
                  {level.id > 10 && level.id <= 20 && <span className="text-sm">🎯</span>}
                  {level.id > 20 && level.id <= 30 && <span className="text-sm">🏆</span>}
                  {level.id > 30 && <span className="text-sm">👑</span>}
                </div>
                
                {/* Seviye Numarası */}
                <motion.span 
                  className="text-sm font-bold text-white"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {level.id}
                </motion.span>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Diamond Counter */}
            <motion.div
              className="px-2 py-1 rounded-md flex items-center gap-1" 
              style={{
                background: hardModeActive ? 'rgba(127, 29, 29, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: hardModeActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: hardModeActive ? '0 4px 16px rgba(239, 68, 68, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              <motion.div
                animate={graphicsQuality !== 'low' ? {
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={graphicsQuality !== 'low' ? {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
                style={{
                  filter: graphicsQuality !== 'low' ? 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.3))' : 'none'
                }}
              >
                <span className="text-sm">💎</span>
              </motion.div>
              <span className="text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
                {diamonds.toFixed(1)}
              </span>
            </motion.div>
            
            {/* Timer */}
            <motion.div
              className="px-2 py-1 rounded-md text-center" 
              style={{
                background: hardModeActive ? 'rgba(127, 29, 29, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: hardModeActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
                color: hardModeActive ? '#FCA5A5' : COLORS.accent,
                fontFamily: 'monospace',
                boxShadow: hardModeActive ? '0 4px 16px rgba(239, 68, 68, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              <span className="text-xs font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>{formatTime(timer, milliseconds)}</span>
            </motion.div>

            {/* Ses Ayarları */}
            <motion.button
              className={`w-7 h-7 rounded-md flex items-center justify-center backdrop-blur-md relative ${highlightedButton === 'sound' ? 'z-[200]' : ''}`}
              style={{
                background: hardModeActive ? 'rgba(127, 29, 29, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: highlightedButton === 'sound' ? '2px solid #8B5CF6' : hardModeActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: highlightedButton === 'sound' 
                  ? '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.5)' 
                  : hardModeActive ? '0 4px 16px rgba(239, 68, 68, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.1)',
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: `0 4px 12px rgba(99, 102, 241, 0.3)`,
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowSoundSettings(true);
                // Level 7 tutorial'ında ses ayarları açıldığında highlight'ı kaldır
                if (highlightedButton === 'sound') {
                  setHighlightedButton(null);
                }
              }}
              animate={highlightedButton === 'sound' ? {
                scale: [1, 1.15, 1],
                boxShadow: [
                  '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.5)',
                  '0 0 30px rgba(139, 92, 246, 1), 0 0 60px rgba(139, 92, 246, 0.7)',
                  '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.5)'
                ]
              } : {}}
              transition={highlightedButton === 'sound' ? {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.24 5.76C19.9509 7.47097 20.9067 9.76022 20.9067 12.145C20.9067 14.5298 19.9509 16.819 18.24 18.53" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              {/* Highlight parmak animasyonu */}
              {highlightedButton === 'sound' && (
                <motion.div
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-2xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  👆
                </motion.div>
              )}
            </motion.button>
          </div>
        </div>
        
        {/* Empty space to prevent content from being hidden under fixed header */}
        <div className="h-16" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}></div>
        
        {/* Main content container - Using flex-grow to take remaining space */}
        <div className="flex-grow flex flex-col justify-center items-center px-4">
          {/* Word Boxes - Centered in available space */}
          <motion.div 
            className="flex flex-wrap gap-1.5 justify-center w-full max-w-full mb-6 relative"
            style={{ maxWidth: 'calc(100vw - 32px)', minHeight: `${level.words.length > 4 ? 180 : 120}px` }}
            animate={showWordBoxFocus ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={showWordBoxFocus ? {
              duration: 1.5,
              repeat: 2,
              ease: "easeInOut"
            } : {}}
          >
            {/* Kutuya odaklanma animasyonu - parlama efekti */}
            {showWordBoxFocus && (
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  boxShadow: [
                    '0 0 0px rgba(139, 92, 246, 0)',
                    '0 0 40px rgba(139, 92, 246, 0.8), 0 0 80px rgba(236, 72, 153, 0.6)',
                    '0 0 0px rgba(139, 92, 246, 0)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: 2 }}
                style={{
                  border: '3px solid rgba(139, 92, 246, 0.6)',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
                }}
              />
            )}
            {/* Parmak animasyonu - kutuları göster */}
            {showWordBoxFocus && (
              <motion.div
                className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-3xl z-20"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                👇
              </motion.div>
            )}
            {level.words.map((word, index) => {
              // Kelime uzunluğuna göre kutucuk boyutu hesapla
              const wordText = englishMode ? word.english : word.turkish;
              const letterCount = wordText.replace(/ /g, '').length; // Boşlukları sayma
              
              // Kısa kelimeler için büyük, uzun kelimeler için küçük kutucuk
              let boxSize = 36; // varsayılan
              if (letterCount <= 4) boxSize = 40;
              else if (letterCount <= 8) boxSize = 38;
              else if (letterCount <= 9) boxSize = 36;
              else {
                // 10+ harf için ekrana sığacak şekilde hesapla
                const screenWidth = window.innerWidth - 20;
                const gapTotal = (letterCount - 1) * 2;
                const calculatedSize = Math.floor((screenWidth - gapTotal) / letterCount);
                boxSize = Math.max(20, Math.min(36, calculatedSize));
              }
              
              const fontSize = boxSize >= 36 ? 'text-lg' : boxSize >= 30 ? 'text-base' : boxSize >= 24 ? 'text-sm' : 'text-xs';
              
              return (
              <motion.div 
                key={index}
                className="flex flex-col items-center"
                style={{ minHeight: `${boxSize + 28}px` }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex gap-0.5 justify-center mb-1">
                  {Array(englishMode ? word.english.length : word.turkish.length).fill('').map((_, letterIndex) => {
                    const currentLetter = englishMode ? word.english[letterIndex] : word.turkish[letterIndex];
                    const isSpace = currentLetter === ' ';
                    
                    // Boşluk karakteri için sadece boşluk göster (kutucuk yok)
                    if (isSpace) {
                      return (
                        <div 
                          key={letterIndex} 
                          style={{ width: '12px', height: `${boxSize}px` }}
                          data-word={word.turkish}
                          data-index={letterIndex}
                        />
                      );
                    }
                    
                    return (
                    <motion.div
                      key={letterIndex}
                      className="relative"
                      style={{
                        width: `${boxSize}px`,
                        height: `${boxSize}px`,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + letterIndex * 0.1 }}
                      data-word={word.turkish}
                      data-index={letterIndex}
                    >
                      {(() => {
                        // Her bölüm için farklı koyu renk (level.id'ye göre)
                        const levelColors = [
                          { bg: '#1a1a2e', border: '#4a4a6a' }, // Koyu lacivert
                          { bg: '#16213e', border: '#3a5a8a' }, // Koyu mavi
                          { bg: '#1a1a3a', border: '#5a4a8a' }, // Koyu mor
                          { bg: '#0f3460', border: '#4a7a9a' }, // Koyu turkuaz
                          { bg: '#2d132c', border: '#6a3a6a' }, // Koyu magenta
                          { bg: '#1e3a3a', border: '#4a8a7a' }, // Koyu yeşil
                          { bg: '#3a1a1a', border: '#8a4a4a' }, // Koyu kırmızı
                          { bg: '#2a2a1a', border: '#7a7a4a' }, // Koyu sarı
                        ];
                        const colorIndex = (level.id - 1) % levelColors.length;
                        const levelColor = hardModeActive 
                          ? { bg: '#3a1a1a', border: '#991b1b' }
                          : levelColors[colorIndex];
                        
                        return (
                      <motion.div
                        className="absolute inset-0 rounded-lg flex items-center justify-center uppercase"
                        style={{
                          background: foundWords.has(word.turkish)
                            ? `linear-gradient(135deg, ${levelColor.border} 0%, ${levelColor.bg} 100%)`
                            : `linear-gradient(135deg, ${levelColor.bg} 0%, ${levelColor.bg}ee 100%)`,
                          border: `2px solid ${levelColor.border}`,
                          boxShadow: foundWords.has(word.turkish)
                            ? `0 0 20px ${levelColor.border}66, inset 0 2px 4px rgba(255,255,255,0.2)`
                            : `0 4px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)`,
                          userSelect: 'none',
                        }}
                        animate={graphicsQuality !== 'low' ? { 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, -2, 0],
                          transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        } : {}}
                        whileHover={graphicsQuality !== 'low' ? { scale: 1.1 } : {}}
                        transition={graphicsQuality !== 'low' ? { type: "spring", stiffness: 300 } : { duration: 0 }}
                      >
                        <motion.span 
                          className={`${fontSize} font-bold tracking-wide uppercase`}
                          style={{ 
                            display: foundWords.has(word.turkish) || revealedLetters[word.turkish]?.includes(letterIndex)
                              ? 'block'
                              : 'none',
                            color: COLORS.text,
                            textShadow: foundWords.has(word.turkish)
                              ? '0 0 10px rgba(255,255,255,0.5)'
                              : 'none',
                            userSelect: 'none',
                          }}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ 
                            scale: 1, 
                            rotate: 0,
                            transition: {
                              type: "spring",
                              stiffness: 200,
                              damping: 15
                            }
                          }}
                        >
                          {englishMode ? word.english.toUpperCase()[letterIndex] : toTurkishUpperCase(word.turkish[letterIndex])}
                        </motion.span>
                      </motion.div>
                        );
                      })()}
                    </motion.div>
                    );
                  })}
                </div>
                {foundWords.has(word.turkish) && (() => {
                  // Her bölüm için farklı koyu renk (level.id'ye göre)
                  const levelColors = [
                    { bg: '#1a1a2e', border: '#4a4a6a', text: '#8a8aaa' }, // Koyu lacivert
                    { bg: '#16213e', border: '#3a5a8a', text: '#7a9aba' }, // Koyu mavi
                    { bg: '#1a1a3a', border: '#5a4a8a', text: '#9a8aba' }, // Koyu mor
                    { bg: '#0f3460', border: '#4a7a9a', text: '#7abaca' }, // Koyu turkuaz
                    { bg: '#2d132c', border: '#6a3a6a', text: '#aa7aaa' }, // Koyu magenta
                    { bg: '#1e3a3a', border: '#4a8a7a', text: '#7acaba' }, // Koyu yeşil
                    { bg: '#3a1a1a', border: '#8a4a4a', text: '#ca8a8a' }, // Koyu kırmızı
                    { bg: '#2a2a1a', border: '#7a7a4a', text: '#baba8a' }, // Koyu sarı
                  ];
                  const colorIndex = (level.id - 1) % levelColors.length;
                  const levelColor = hardModeActive 
                    ? { bg: '#3a1a1a', border: '#991b1b', text: '#fca5a5' }
                    : levelColors[colorIndex];
                  
                  // Eğer bu kelime ortadan kaybolmuşsa, hiç gösterme
                  if (hiddenEnglishWords.has(word.turkish)) return null;
                  
                  // Eğer bu kelime şu an ortada gösteriliyorsa, ortada göster
                  const isShowingInCenter = showCenterWord && showCenterWord.turkish === word.turkish;
                  
                  return (
                  <motion.div 
                    layoutId={`english-word-${word.turkish}`}
                    className="flex items-center justify-center px-3 py-1 rounded-full"
                    style={{ 
                      color: levelColor.text,
                      backgroundColor: levelColor.bg,
                      border: `2px solid ${levelColor.border}`,
                      boxShadow: `0 4px 8px rgba(0,0,0,0.4)`,
                      // Ortada gösteriliyorsa fixed pozisyon - çemberin merkezine
                      ...(isShowingInCenter ? (() => {
                        // Kelime uzunluğuna göre left offset hesapla (scale 1.2 ile)
                        const wordLength = (englishMode ? word.turkish : word.english).length;
                        // Her karakter yaklaşık 10px genişliğinde, scale 1.2 ile çarpılıyor
                        const wordWidth = wordLength * 10 * 1.2;
                        const paddingWidth = 24 * 2 * 1.2; // padding left + right
                        const totalWidth = wordWidth + paddingWidth;
                        const leftOffset = totalWidth / 2;
                        return {
                          position: 'fixed',
                          top: '50%',
                          left: `calc(50% - ${leftOffset}px)`,
                          transform: 'translateY(-50%)',
                          zIndex: 100,
                          padding: '12px 24px',
                          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 60px ${levelColor.border}66`
                        };
                      })() : {})
                    }}
                    initial={{ opacity: 0, x: -20, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      scale: isShowingInCenter ? 1.2 : 1,
                      transition: {
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    whileHover={!isShowingInCenter ? { 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    } : {}}
                  >
                    <motion.span
                      className="font-medium uppercase"
                      style={{
                        fontSize: isShowingInCenter ? '1.5rem' : '1rem',
                        color: isShowingInCenter ? '#FFFFFF' : levelColor.text,
                        fontFamily: isShowingInCenter ? "'Poppins', sans-serif" : 'inherit',
                        fontWeight: isShowingInCenter ? 700 : 500,
                        letterSpacing: isShowingInCenter ? '0.05em' : 'normal'
                      }}
                    >
                      {englishMode ? toTurkishUpperCase(word.turkish) : toTurkishUpperCase(word.english)}
                    </motion.span>
                  </motion.div>
                  );
                })()}
              </motion.div>
            );
            })}
          </motion.div>

          {/* Word Display Boxes - Centered */}
          <div 
            className="flex justify-center mb-3 w-full"
            style={{ height: '40px' }}
          >
            {(() => {
              // Her bölüm için farklı koyu renk (level.id'ye göre)
              const levelColors = [
                { bg: '#1a1a2e', border: '#4a4a6a' }, // Koyu lacivert
                { bg: '#16213e', border: '#3a5a8a' }, // Koyu mavi
                { bg: '#1a1a3a', border: '#5a4a8a' }, // Koyu mor
                { bg: '#0f3460', border: '#4a7a9a' }, // Koyu turkuaz
                { bg: '#2d132c', border: '#6a3a6a' }, // Koyu magenta
                { bg: '#1e3a3a', border: '#4a8a7a' }, // Koyu yeşil
                { bg: '#3a1a1a', border: '#8a4a4a' }, // Koyu kırmızı
                { bg: '#2a2a1a', border: '#7a7a4a' }, // Koyu sarı
              ];
              const colorIndex = (level.id - 1) % levelColors.length;
              const levelColor = hardModeActive 
                ? { bg: '#3a1a1a', border: '#991b1b' }
                : levelColors[colorIndex];
              
              // Harf sayısına göre dinamik boyut hesapla - ekranı tam kullan
              const letterCount = currentWord.length || 1;
              const screenWidth = window.innerWidth;
              const totalGap = (letterCount - 1) * 2; // 2px gap
              const availableForBoxes = screenWidth - 16 - totalGap; // 8px padding her yandan
              const boxSize = Math.floor(availableForBoxes / letterCount);
              const finalBoxSize = Math.max(16, Math.min(36, boxSize)); // 16-36px arası
              const fontSize = finalBoxSize <= 20 ? 'text-xs' : finalBoxSize <= 28 ? 'text-sm' : 'text-base';
              
              return currentWord.split('').map((letter, index) => (
              <motion.div
                key={index}
                className={`flex items-center justify-center rounded-md ${fontSize} font-bold uppercase`}
                style={{
                  width: `${finalBoxSize}px`,
                  height: `${finalBoxSize}px`,
                  marginRight: index < letterCount - 1 ? '2px' : '0',
                  background: `linear-gradient(135deg, ${levelColor.bg} 0%, ${levelColor.bg}ee 100%)`,
                  color: COLORS.text,
                  border: `1.5px solid ${levelColor.border}`,
                  boxShadow: `0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)`
                }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: [1, 1.05, 1], 
                  rotate: 0,
                  boxShadow: [
                    `0 0 12px ${COLORS.primary}44, 0 0 20px ${COLORS.accent}22`,
                    `0 0 16px ${COLORS.primary}66, 0 0 28px ${COLORS.accent}44`,
                    `0 0 12px ${COLORS.primary}44, 0 0 20px ${COLORS.accent}22`
                  ],
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    duration: 0.3,
                    scale: {
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut"
                    },
                    boxShadow: {
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut"
                    }
                  }
                }}
                exit={{ 
                  scale: 0,
                  rotate: 180,
                  transition: { duration: 0.2 } 
                }}
              >
                {letter === ' ' ? <span className="opacity-60">␣</span> : letter}
              </motion.div>
            ));
            })()}
          
          </div>
          
          {/* Letter Circle - Centered */}
          <div 
            ref={circleRef} 
            className="relative mx-auto mb-20" 
            style={{ 
              transform: 'scale(1.2)',
              width: '280px', 
              height: '280px',
              touchAction: 'none',
              marginTop: letters.length >= 12 ? '64px' : '32px'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd} 
          >
            {/* Blur arka plan dairesi - Canvas merkezi (150,150) */}
            {(() => {
              // Harf sayısına göre dinamik blur boyutu (circleRadius ile aynı mantık)
              const letterCount = letters.length;
              let blurRadius = 120;
              if (letterCount >= 13) blurRadius = 136;
              else if (letterCount >= 11) blurRadius = 130;
              else if (letterCount >= 10) blurRadius = 132;
              const blurSize = blurRadius * 2 - 4;
              
              return (
                <div 
                  className="absolute rounded-full"
                  style={{
                    top: '150px',
                    left: '150px',
                    transform: 'translate(-50%, -50%)',
                    width: `${blurSize}px`,
                    height: `${blurSize}px`,
                    background: hardModeActive ? 'rgba(127, 29, 29, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(2px)',
                    border: hardModeActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              );
            })()}
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="absolute inset-0"
              style={{ touchAction: 'none' }} 
            />
            
            {/* Level 1 Parmak Animasyonu - EK kelimesini göster */}
            {showFingerAnimation && level.id === 1 && letterPositions.length >= 2 && (
              <motion.div
                className="absolute z-50 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {(() => {
                  // E ve K harflerinin pozisyonlarını bul (büyük veya küçük harf)
                  const eIndex = letterPositions.findIndex(p => p.letter.toUpperCase() === 'E');
                  const kIndex = letterPositions.findIndex(p => p.letter.toUpperCase() === 'K');
                  
                  // Eğer E ve K bulunamazsa, ilk iki harfi kullan
                  const firstPos = eIndex !== -1 ? letterPositions[eIndex] : letterPositions[0];
                  const secondPos = kIndex !== -1 ? letterPositions[kIndex] : letterPositions[1];
                  
                  if (!firstPos || !secondPos) return null;
                  
                  return (
                    <motion.div
                      className="text-4xl"
                      style={{ position: 'absolute' }}
                      animate={{
                        left: [firstPos.x - 15, firstPos.x - 15, secondPos.x - 15, secondPos.x - 15],
                        top: [firstPos.y - 40, firstPos.y - 20, secondPos.y - 20, secondPos.y - 40],
                        scale: [1, 1.2, 1.2, 1]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.3, 0.7, 1]
                      }}
                    >
                      👆
                    </motion.div>
                  );
                })()}
              </motion.div>
            )}
            
            {/* Merkeze çekilen parçacıklar */}
            {isDragging && [...Array(8)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-2 h-2 rounded-full pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  backgroundColor: COLORS.accent,
                  boxShadow: `0 0 8px ${COLORS.accent}`
                }}
                animate={{
                  x: [Math.cos((i / 8) * Math.PI * 2) * 120, 0],
                  y: [Math.sin((i / 8) * Math.PI * 2) * 120, 0],
                  scale: [1, 0],
                  opacity: [0.8, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeIn",
                  delay: i * 0.1
                }}
              />
            ))}
            {letterPositions.map((pos, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  left: pos.x - 25,
                  top: pos.y - 25,
                }}
              >
                {(() => {
                  // Her bölüm için farklı koyu renk (level.id'ye göre)
                  const levelColors = [
                    { bg: '#1a1a2e', border: '#4a4a6a', selected: '#6a6a9a' }, // Koyu lacivert
                    { bg: '#16213e', border: '#3a5a8a', selected: '#5a8aba' }, // Koyu mavi
                    { bg: '#1a1a3a', border: '#5a4a8a', selected: '#8a7aba' }, // Koyu mor
                    { bg: '#0f3460', border: '#4a7a9a', selected: '#6aaaca' }, // Koyu turkuaz
                    { bg: '#2d132c', border: '#6a3a6a', selected: '#9a6a9a' }, // Koyu magenta
                    { bg: '#1e3a3a', border: '#4a8a7a', selected: '#6ababa' }, // Koyu yeşil
                    { bg: '#3a1a1a', border: '#8a4a4a', selected: '#ba7a7a' }, // Koyu kırmızı
                    { bg: '#2a2a1a', border: '#7a7a4a', selected: '#aaba7a' }, // Koyu sarı
                  ];
                  const colorIndex = (level.id - 1) % levelColors.length;
                  const levelColor = hardModeActive 
                    ? { bg: '#3a1a1a', border: '#991b1b', selected: '#ef4444' }
                    : levelColors[colorIndex];
                  
                  return (
                <motion.button
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold uppercase
                    ${isDragging && dragPath.includes(index) ? 'scale-90' : 'scale-100'}
                    transition-transform duration-200`} 
                  style={{
                    background: dragPath.includes(index) 
                      ? (hardModeActive 
                          ? `linear-gradient(135deg, #DC2626 0%, #991B1B 100%)`
                          : `linear-gradient(135deg, ${levelColor.selected} 0%, ${levelColor.border} 100%)`)
                      : (hardModeActive
                          ? `linear-gradient(135deg, #450a0a 0%, #1a0000 100%)`
                          : `linear-gradient(135deg, ${levelColor.bg} 0%, ${levelColor.bg}cc 100%)`),
                    color: dragPath.includes(index) ? '#FFFFFF' : (hardModeActive ? '#FCA5A5' : COLORS.text),
                    cursor: 'pointer',
                    boxShadow: dragPath.includes(index) 
                      ? (hardModeActive
                          ? `0 0 25px #DC2626AA, 0 0 40px #991B1B66, inset 0 2px 8px rgba(255,255,255,0.3)`
                          : `0 0 25px ${levelColor.selected}AA, 0 0 40px ${levelColor.border}66, inset 0 2px 8px rgba(255,255,255,0.3)`)
                      : `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.1)`,
                    border: dragPath.includes(index)
                      ? (hardModeActive ? `2px solid #DC262688` : `2px solid ${levelColor.selected}`)
                      : (hardModeActive ? `2px solid #7f1d1d22` : `2px solid ${levelColor.border}44`),
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  animate={isShuffling ? (() => {
                    // Eski pozisyonu kullan (eğer varsa), yoksa mevcut pozisyonu kullan
                    const startPos = oldPositions[index] || pos;
                    const centerX = 150;
                    const centerY = 150;
                    
                    return {
                      // Merkeze toplama -> Karıştırma -> Dağılma
                      x: [
                        0,                                              // Başlangıç (eski pozisyon)
                        (centerX - startPos.x),                        // Merkeze git
                        (centerX - startPos.x) + (Math.random() - 0.5) * 60, // Merkezde karış
                        (pos.x - startPos.x)                           // Yeni pozisyona git
                      ],
                      y: [
                        0,                                              // Başlangıç (eski pozisyon)
                        (centerY - startPos.y),                        // Merkeze git
                        (centerY - startPos.y) + (Math.random() - 0.5) * 60, // Merkezde karış
                        (pos.y - startPos.y)                           // Yeni pozisyona git
                      ],
                      scale: [1, 0.3, 0.5, 1],                         // Küçül -> Biraz büyü -> Normal
                      rotate: [0, 180, 540, 720],                      // Sürekli dön
                      opacity: [1, 0.4, 0.6, 1],                       // Soluklaş -> Geri gel
                      background: [
                        hardModeActive 
                          ? `linear-gradient(135deg, #450a0a 0%, #1a0000 100%)`
                          : `linear-gradient(135deg, ${COLORS.card} 0%, #0F172A 100%)`,
                        hardModeActive
                          ? `linear-gradient(135deg, #DC2626 0%, #991B1B 100%)`
                          : `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
                        hardModeActive
                          ? `linear-gradient(135deg, #DC2626 0%, #991B1B 100%)`
                          : `linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)`,
                        hardModeActive
                          ? `linear-gradient(135deg, #450a0a 0%, #1a0000 100%)`
                          : `linear-gradient(135deg, ${COLORS.card} 0%, #0F172A 100%)`
                      ],
                      boxShadow: [
                        `0 2px 8px rgba(0,0,0,0.3)`,
                        `0 0 20px #10B98166, 0 0 30px #05966966`,
                        `0 0 20px #EC489966, 0 0 30px #8B5CF666`,
                        `0 2px 8px rgba(0,0,0,0.3)`
                      ]
                    };
                  })() : {
                    scale: isDragging && dragPath.includes(index) ? 0.9 : 1,
                    rotate: isDragging && dragPath.includes(index) ? [0, -5, 5, 0] : 0
                  }}
                  transition={isShuffling ? {
                    duration: 0.9,
                    ease: [0.43, 0.13, 0.23, 0.96],
                    times: [0, 0.4, 0.55, 1]
                  } : {
                    rotate: { duration: 0.3 }
                  }}
                  whileHover={!isShuffling ? { scale: 1.1, boxShadow: `0 0 15px ${COLORS.highlight}66` } : {}}
                  onMouseDown={(e) => !isShuffling && handleMouseDown(e, pos.letter, pos)}
                  onTouchStart={(e) => !isShuffling && handleTouchStart(e, pos.letter, pos)}
                >
                  {pos.letter === ' ' ? (
                    <span className="text-base opacity-60">␣</span>
                  ) : pos.letter}
                </motion.button>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom buttons - Fixed at bottom */}
        {(() => {
          // Butonlar için levelColor tanımı - çember harfleriyle aynı
          const levelColors = [
            { bg: '#1a1a2e', border: '#4a4a6a', selected: '#6a6a9a' }, // Koyu lacivert
            { bg: '#16213e', border: '#3a5a8a', selected: '#5a8aba' }, // Koyu mavi
            { bg: '#1a1a3a', border: '#5a4a8a', selected: '#8a7aba' }, // Koyu mor
            { bg: '#0f3460', border: '#4a7a9a', selected: '#6aaaca' }, // Koyu turkuaz
            { bg: '#2d132c', border: '#6a3a6a', selected: '#9a6a9a' }, // Koyu magenta
            { bg: '#1e3a3a', border: '#4a8a7a', selected: '#6ababa' }, // Koyu yeşil
            { bg: '#3a1a1a', border: '#8a4a4a', selected: '#ba7a7a' }, // Koyu kırmızı
            { bg: '#2a2a1a', border: '#7a7a4a', selected: '#aaba7a' }, // Koyu sarı
          ];
          const colorIndex = (level.id - 1) % levelColors.length;
          const levelColor = hardModeActive 
            ? { bg: '#3a1a1a', border: '#991b1b', selected: '#ef4444' }
            : levelColors[colorIndex];
          
          return (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center gap-6 mb-4 z-50">
          <motion.button
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: hardModeActive ? `#450a0aAA` : `${COLORS.card}AA`,
              backdropFilter: 'blur(8px)',
              border: hardModeActive ? `2px solid #7f1d1d33` : `2px solid ${COLORS.secondary}33`,
              color: hardModeActive ? '#FCA5A5' : COLORS.text,
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              fontFamily: 'monospace',
              transition: 'all 0.3s ease',
              opacity: highlightedButton ? 0.3 : 1
            }}
            whileHover={!highlightedButton ? { scale: 1.05 } : {}}
            whileTap={!highlightedButton ? { scale: 0.95 } : {}}
            onClick={() => {
              if (highlightedButton) return; // Tutorial sırasında ana sayfaya dönmeyi engelle
              playHomeButtonSound();
              onClose();
            }}
          >
            <span>🏠</span>
          </motion.button>
          
          <motion.button
            className={`w-14 h-14 rounded-full flex items-center justify-center relative ${highlightedButton === 'hint' ? 'z-50' : ''}`}
            style={{
              background: diamonds >= 20 ? 
                (hardModeActive 
                  ? `linear-gradient(135deg, #DC2626 0%, #991B1B 100%)`
                  : `linear-gradient(135deg, ${levelColor.border} 0%, ${levelColor.selected} 100%)`)
                : 'linear-gradient(135deg, #555 0%, #333 100%)',
              boxShadow: highlightedButton === 'hint' 
                ? '0 0 30px #FCD34D, 0 0 60px #F59E0B, 0 0 90px #FCD34D'
                : (diamonds >= 20 ? 
                  '0 4px 10px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)' : 
                  '0 2px 5px rgba(0,0,0,0.2)'),
              border: highlightedButton === 'hint'
                ? '3px solid #FCD34D'
                : (diamonds >= 20 ? 
                  '2px solid rgba(255,255,255,0.2)' : 
                  '2px solid rgba(255,255,255,0.1)'),
              opacity: (highlightedButton && highlightedButton !== 'hint') ? 0.3 : (diamonds >= 20 ? 1 : 0.5),
              transition: 'all 0.3s ease'
            }}
            animate={highlightedButton === 'hint' ? {
              scale: [1, 1.2, 1.1, 1.2, 1],
              boxShadow: [
                '0 0 30px #FCD34D, 0 0 60px #F59E0B',
                '0 0 50px #FCD34D, 0 0 80px #F59E0B',
                '0 0 30px #FCD34D, 0 0 60px #F59E0B'
              ]
            } : showHintAnimation ? {
              scale: [1, 1.15, 1.05, 1.15, 1],
              boxShadow: [
                '0 4px 10px rgba(0,0,0,0.3)',
                '0 0 25px #FCD34D, 0 0 40px #F59E0B',
                '0 0 30px #FCD34D, 0 0 50px #F59E0B',
                '0 0 25px #FCD34D, 0 0 40px #F59E0B',
                '0 4px 10px rgba(0,0,0,0.3)'
              ]
            } : {}}
            transition={highlightedButton === 'hint' ? {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            } : showHintAnimation ? {
              duration: 1.2,
              ease: "easeInOut"
            } : {}}
            whileHover={diamonds >= 20 && !showHintAnimation && !highlightedButton ? { 
              scale: 1.05,
              boxShadow: '0 6px 15px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)'
            } : {}}
            whileTap={diamonds >= 20 && !showHintAnimation && (!highlightedButton || highlightedButton === 'hint') ? { scale: 0.95 } : {}}
            onClick={() => {
              // Başka bir buton highlight edilmişse tıklamayı engelle
              if (highlightedButton && highlightedButton !== 'hint') return;
              handleHint();
              if (highlightedButton === 'hint') setHighlightedButton(null);
            }}
            disabled={diamonds < 20 || (highlightedButton && highlightedButton !== 'hint')}
          >
            <div className="flex flex-col items-center justify-center">
              {/* Elmas simgesi */}
              <motion.div 
                className="mb-1"
                animate={showHintAnimation ? {
                  rotate: [0, -15, 15, -10, 10, 0],
                  scale: [1, 1.2, 1.1, 1.2, 1]
                } : {}}
                transition={showHintAnimation ? {
                  duration: 1.2,
                  ease: "easeInOut"
                } : {}}
              >
                <motion.span
                  className="text-3xl"
                  animate={showHintAnimation ? {
                    scale: [1, 1.3, 1],
                    filter: [
                      'drop-shadow(0 0 0px #FCD34D)',
                      'drop-shadow(0 0 8px #FCD34D)',
                      'drop-shadow(0 0 12px #F59E0B)',
                      'drop-shadow(0 0 8px #FCD34D)',
                      'drop-shadow(0 0 0px #FCD34D)'
                    ]
                  } : {}}
                  transition={showHintAnimation ? {
                    duration: 1.2,
                    ease: "easeInOut"
                  } : {}}
                  style={{ opacity: diamonds >= 20 ? 1 : 0.5 }}
                >
                  💡
                </motion.span>
              </motion.div>
              
              {/* Sayı göstergesi */}
              <div className="flex items-center" style={{ fontSize: '13px', marginTop: '-8px', marginLeft: '2px' }}>
                <span className="font-bold">20</span>
                <span style={{ fontSize: '10px' }}>💎</span>
              </div>
            </div>
            {/* Highlight parmak animasyonu */}
            {highlightedButton === 'hint' && (
              <motion.div
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-2xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                👆
              </motion.div>
            )}
          </motion.button>
          <motion.button
            className={`w-14 h-14 rounded-full flex items-center justify-center relative ${highlightedButton === 'hard' ? 'z-50' : ''}`}
            style={{
              background: hardModeActive ? '#DC2626' : '#333',
              color: hardModeActive ? '#fff' : '#777',
              // Level 6'da yeşil parlama, Level 5'te kırmızı parlama
              boxShadow: (highlightedButton === 'hard' && level.id === 6)
                ? '0 0 30px #10B981, 0 0 60px #059669, 0 0 90px #10B981'
                : highlightedButton === 'hard'
                ? '0 0 30px #DC2626, 0 0 60px #991B1B, 0 0 90px #DC2626'
                : (hardModeActive ? '0 4px 8px rgba(220, 38, 38, 0.5)' : 'none'),
              border: (highlightedButton === 'hard' && level.id === 6)
                ? '3px solid #10B981'
                : highlightedButton === 'hard'
                ? '3px solid #DC2626'
                : (hardModeActive ? '2px solid #DC2626' : '2px solid #333'),
              // Level 5'te zor mod aktif edildikten sonra butonu kilitle
              opacity: (highlightedButton && highlightedButton !== 'hard') ? 0.3 
                : (hardModeActivatedInTutorial && level.id === 5) ? 0.5 
                : (hardModeActive ? 1 : 0.8),
              transition: 'all 0.3s ease'
            }}
            // Level 6'da yeşil parlama animasyonu, Level 5'te kırmızı
            animate={(highlightedButton === 'hard' && level.id === 6) ? {
              scale: [1, 1.2, 1.1, 1.2, 1],
              boxShadow: [
                '0 0 30px #10B981, 0 0 60px #059669',
                '0 0 50px #10B981, 0 0 80px #059669',
                '0 0 30px #10B981, 0 0 60px #059669'
              ]
            } : highlightedButton === 'hard' ? {
              scale: [1, 1.2, 1.1, 1.2, 1],
              boxShadow: [
                '0 0 30px #DC2626, 0 0 60px #991B1B',
                '0 0 50px #DC2626, 0 0 80px #991B1B',
                '0 0 30px #DC2626, 0 0 60px #991B1B'
              ]
            } : hardModeActive ? {
              boxShadow: [
                '0 4px 8px rgba(220, 38, 38, 0.5)',
                '0 0 20px rgba(220, 38, 38, 0.8), 0 0 30px rgba(153, 27, 27, 0.6)',
                '0 0 25px rgba(220, 38, 38, 0.9), 0 0 40px rgba(153, 27, 27, 0.7)',
                '0 0 20px rgba(220, 38, 38, 0.8), 0 0 30px rgba(153, 27, 27, 0.6)',
                '0 4px 8px rgba(220, 38, 38, 0.5)'
              ],
              scale: [1, 1.05, 1.08, 1.05, 1]
            } : {}}
            transition={highlightedButton === 'hard' ? {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            } : hardModeActive ? {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            whileHover={hardModeActive && !highlightedButton && !(hardModeActivatedInTutorial && level.id === 5) ? { 
              scale: 1.1,
              boxShadow: '0 6px 12px rgba(0,0,0,0.4)'
            } : {}}
            whileTap={(!highlightedButton || highlightedButton === 'hard') && !(hardModeActivatedInTutorial && level.id === 5) ? { scale: 0.95 } : {}}
            onClick={() => {
              // Başka bir buton highlight edilmişse tıklamayı engelle
              if (highlightedButton && highlightedButton !== 'hard') return;
              // Level 5'te zor mod aktif edildikten sonra tekrar tıklamayı engelle
              if (hardModeActivatedInTutorial && level.id === 5) return;
              setShowHardModePopup(true);
              setTempHardModeLevel(hardModeLevel);
              playSound('tıklama');
              // NOT: highlight'ı burada kaldırmıyoruz, popup'ta Tamam'a basıldığında kalkacak
            }}
          >
            <div className="flex flex-col items-center justify-center">
              {/* Zor mod simgesi */}
              <motion.div 
                className="mb-1"
                animate={hardModeActive ? {
                  rotate: [0, -5, 5, -5, 5, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                } : {}}
                transition={hardModeActive ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <motion.svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  animate={hardModeActive ? {
                    filter: [
                      'drop-shadow(0 0 0px #DC2626)',
                      'drop-shadow(0 0 6px #DC2626)',
                      'drop-shadow(0 0 10px #DC2626)',
                      'drop-shadow(0 0 6px #DC2626)',
                      'drop-shadow(0 0 0px #DC2626)'
                    ]
                  } : {}}
                  transition={hardModeActive ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {}}
                >
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-5h10v10H7z" fill={hardModeActive ? "white" : "#777"}/>
                </motion.svg>
              </motion.div>
              
              {/* Sayı göstergesi */}
              <div className="flex items-center">
                <motion.span 
                  className="text-xs font-bold"
                  animate={hardModeActive ? {
                    scale: [1, 1.05, 1]
                  } : {}}
                  transition={hardModeActive ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {}}
                >
                  {t.hardMode}
                </motion.span>
                {hardModeActive && (
                  <motion.span 
                    className="text-xs ml-1 font-bold"
                    animate={{
                      scale: [1, 1.2, 1],
                      color: ['#ffffff', '#FCA5A5', '#ffffff']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {hardModeLevel}
                  </motion.span>
                )}
              </div>
            </div>
            {/* Highlight parmak animasyonu */}
            {highlightedButton === 'hard' && (
              <motion.div
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-2xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                👆
              </motion.div>
            )}
          </motion.button>
          <motion.button
            className={`w-14 h-14 rounded-full flex items-center justify-center relative ${highlightedButton === 'fairy' ? 'z-50' : ''}`}
            style={{
              background: diamonds >= 60 ? 
                (hardModeActive
                  ? `linear-gradient(135deg, #DC2626 0%, #991B1B 100%)`
                  : `linear-gradient(135deg, ${levelColor.border} 0%, ${levelColor.selected} 100%)`)
                : 'linear-gradient(135deg, #555 0%, #333 100%)',
              boxShadow: highlightedButton === 'fairy'
                ? '0 0 30px #FF69B4, 0 0 60px #FFB6C1, 0 0 90px #FF69B4'
                : (diamonds >= 60 ? 
                  '0 4px 10px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)' : 
                  '0 2px 5px rgba(0,0,0,0.2)'),
              border: highlightedButton === 'fairy'
                ? '3px solid #FF69B4'
                : (diamonds >= 60 ? 
                  '2px solid rgba(255,255,255,0.2)' : 
                  '2px solid rgba(255,255,255,0.1)'),
              opacity: (highlightedButton && highlightedButton !== 'fairy') ? 0.3 : (diamonds >= 60 ? 1 : 0.5),
              transition: 'all 0.3s ease'
            }}
            animate={highlightedButton === 'fairy' ? {
              scale: [1, 1.2, 1.1, 1.2, 1],
              boxShadow: [
                '0 0 30px #FF69B4, 0 0 60px #FFB6C1',
                '0 0 50px #FF69B4, 0 0 80px #FFB6C1',
                '0 0 30px #FF69B4, 0 0 60px #FFB6C1'
              ]
            } : showFairyAnimation ? {
              scale: [1, 1.3, 1.1, 1],
              rotate: [0, -10, 10, -10, 10, 0],
              boxShadow: [
                '0 4px 10px rgba(0,0,0,0.3)',
                '0 0 30px #FFB6C1, 0 0 50px #FF69B4',
                '0 0 40px #FFB6C1, 0 0 60px #FF69B4',
                '0 4px 10px rgba(0,0,0,0.3)'
              ]
            } : {}}
            transition={highlightedButton === 'fairy' ? {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            } : showFairyAnimation ? {
              duration: 1.5,
              ease: "easeInOut"
            } : {}}
            whileHover={diamonds >= 60 && !showFairyAnimation && !highlightedButton ? { 
              scale: 1.05,
              boxShadow: '0 6px 15px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)'
            } : {}}
            whileTap={diamonds >= 60 && !showFairyAnimation && (!highlightedButton || highlightedButton === 'fairy') ? { scale: 0.95 } : {}}
            onClick={() => {
              // Başka bir buton highlight edilmişse tıklamayı engelle
              if (highlightedButton && highlightedButton !== 'fairy') return;
              handleFairyJoker();
              if (highlightedButton === 'fairy') setHighlightedButton(null);
            }}
            disabled={diamonds < 60 || fairyJokerUsed || (highlightedButton && highlightedButton !== 'fairy')}
          >
            <div className="flex flex-col items-center justify-center">
              {/* Peri kızı simgesi */}
              <motion.div 
                className="mb-1"
                animate={showFairyAnimation ? {
                  y: [0, -5, 0, -3, 0],
                  rotate: [0, 5, -5, 3, 0]
                } : {}}
                transition={showFairyAnimation ? {
                  duration: 1.5,
                  ease: "easeInOut"
                } : {}}
              >
                <motion.span
                  className="text-3xl"
                  animate={showFairyAnimation ? {
                    scale: [1, 1.2, 1, 1.1, 1],
                    filter: [
                      'drop-shadow(0 0 0px #FFB6C1)',
                      'drop-shadow(0 0 10px #FFB6C1)',
                      'drop-shadow(0 0 15px #FF69B4)',
                      'drop-shadow(0 0 10px #FFB6C1)',
                      'drop-shadow(0 0 0px #FFB6C1)'
                    ]
                  } : {}}
                  transition={showFairyAnimation ? {
                    duration: 1.5,
                    ease: "easeInOut"
                  } : {}}
                  style={{ opacity: diamonds >= 60 ? 1 : 0.5 }}
                >
                  🧚
                </motion.span>
              </motion.div>
              
              {/* Sayı göstergesi */}
              <div className="flex items-center" style={{ marginTop: '-8px', marginLeft: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', marginRight: '1px' }}>60</span>
                <motion.span 
                  style={{ fontSize: '10px' }}
                  animate={showFairyAnimation ? {
                    scale: [1, 1.3, 1, 1.2, 1],
                    rotate: [0, 10, -10, 5, 0]
                  } : {}}
                  transition={showFairyAnimation ? {
                    duration: 1.5,
                    ease: "easeInOut"
                  } : {}}
                >
                  💎
                </motion.span>
              </div>
            </div>
            {/* Highlight parmak animasyonu */}
            {highlightedButton === 'fairy' && (
              <motion.div
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-2xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                👆
              </motion.div>
            )}
          </motion.button>

          {/* Harf Karıştır Butonu */}
          <motion.button
            className={`w-14 h-14 rounded-full flex items-center justify-center relative ${highlightedButton === 'shuffle' ? 'z-50' : ''}`}
            style={{
              background: hardModeActive 
                ? `linear-gradient(135deg, #DC2626 0%, #991B1B 100%)`
                : `linear-gradient(135deg, ${levelColor.border} 0%, ${levelColor.selected} 100%)`,
              boxShadow: highlightedButton === 'shuffle'
                ? '0 0 30px #10B981, 0 0 60px #059669, 0 0 90px #10B981'
                : '0 4px 10px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)',
              border: highlightedButton === 'shuffle'
                ? '3px solid #10B981'
                : '2px solid rgba(255,255,255,0.2)',
              opacity: (highlightedButton && highlightedButton !== 'shuffle') ? 0.3 : 1,
              transition: 'all 0.3s ease'
            }}
            animate={highlightedButton === 'shuffle' ? {
              scale: [1, 1.2, 1.1, 1.2, 1],
              boxShadow: [
                '0 0 30px #10B981, 0 0 60px #059669',
                '0 0 50px #10B981, 0 0 80px #059669',
                '0 0 30px #10B981, 0 0 60px #059669'
              ]
            } : isShuffling ? {
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            } : {}}
            transition={highlightedButton === 'shuffle' ? {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            } : isShuffling ? {
              duration: 0.9,
              ease: "easeInOut"
            } : {}}
            whileHover={!isShuffling && !highlightedButton ? { 
              scale: 1.05,
              boxShadow: '0 6px 15px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              rotate: 180
            } : {}}
            whileTap={!isShuffling && (!highlightedButton || highlightedButton === 'shuffle') ? { scale: 0.95 } : {}}
            onClick={() => {
              // Başka bir buton highlight edilmişse tıklamayı engelle
              if (highlightedButton && highlightedButton !== 'shuffle') return;
              handleShuffle();
              if (highlightedButton === 'shuffle') setHighlightedButton(null);
            }}
            disabled={isShuffling || (highlightedButton && highlightedButton !== 'shuffle')}
          >
            <motion.svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              animate={isShuffling ? {
                rotate: [0, 360, 720]
              } : {}}
              transition={isShuffling ? {
                duration: 0.9,
                ease: "easeInOut"
              } : {}}
            >
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
            {/* Highlight parmak animasyonu */}
            {highlightedButton === 'shuffle' && (
              <motion.div
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-2xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                👆
              </motion.div>
            )}
          </motion.button>
        </div>
          );
        })()}

        {/* Empty space at bottom */}
        <div className="h-24"></div>
      </div>

      {/* Success Animation */}
      {/* Success Animation - Kaldırıldı, yeni kelime animasyonu kullanılıyor */}

      {/* Error Animation - Titreyen Harfler */}
      <AnimatePresence>
        {showError && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-4">
              {/* Titreyen harfler */}
              <motion.div
                className="flex gap-2"
                animate={{
                  x: [0, -10, 10, -10, 10, -5, 5, 0],
                }}
                transition={{
                  duration: 0.7,
                  ease: "easeInOut"
                }}
              >
                {errorWord.split('').map((letter, index) => (
                  <motion.div
                    key={index}
                    className="text-6xl font-bold uppercase"
                    style={{
                      color: '#EF4444',
                      textShadow: '0 0 20px rgba(239, 68, 68, 1), 0 0 40px rgba(239, 68, 68, 0.8)',
                    }}
                    initial={{ 
                      scale: 1,
                      rotate: 0,
                      y: 0
                    }}
                    animate={{
                      scale: [1, 1.2, 0.9, 1.1, 1],
                      rotate: [0, -15, 15, -10, 10, 0],
                      y: [0, -10, 5, -5, 0],
                    }}
                    transition={{
                      duration: 0.7,
                      delay: index * 0.05,
                      ease: "easeInOut"
                    }}
                  >
                    {letter}
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Düşen elmas animasyonu */}
              <motion.div
                className="flex items-center gap-2 text-3xl font-bold"
                initial={{ opacity: 0, y: -20, scale: 0.5 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  y: [-20, 0, 0, 20],
                  scale: [0.5, 1.2, 1, 0.8]
                }}
                transition={{
                  duration: 0.7,
                  times: [0, 0.3, 0.7, 1]
                }}
              >
                <span style={{ 
                  color: '#EF4444',
                  textShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                }}>
                  -{calculatePenalty(wrongAttempts)}
                </span>
                <span>💎</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red Flash Effect */}
      <AnimatePresence>
        {showError && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.3, 0],
              backgroundColor: ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0)']
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompletionCard && (
          <CompletionCard
            level={level}
            onClose={onClose}
            onNext={onNext}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFairyAnimation && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Peri etrafında hafif arka plan ışığı - mevcut ışıklardan biraz daha geniş */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: `radial-gradient(circle at 77% 14%, ${currentLevelColor.glow}40 0%, ${currentLevelColor.glow}20 15%, transparent 25%)`
              }}
            />
            
            {/* Kelime kutusunun sağında beliren peri */}
            <motion.div
              className="absolute"
              style={{ 
                top: '22%', 
                left: '77%',
                transform: 'translate(30px, 10px)',
              }}
              initial={{ scale: 0, opacity: 0, x: -50, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, x: -50, rotate: 180 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            >
              <div className="flex items-center justify-center relative">
                <motion.img 
                  src="/assets/joker.png" 
                  alt="Joker" 
                  className="w-20 h-20 object-contain relative z-10"
                  animate={{
                    y: [0, -8, 0],
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Dönen yıldızlar */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`star-${i}`}
                    className="absolute text-base"
                    style={{
                      left: '50%',
                      top: '50%'
                    }}
                    animate={{
                      x: Math.cos((i / 8) * Math.PI * 2) * 32,
                      y: Math.sin((i / 8) * Math.PI * 2) * 32,
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>
              
              {/* Çoklu parlayan ışık efektleri - Bölüm rengine göre (küçültülmüş) */}
              <motion.div 
                className="absolute inset-0 rounded-full" 
                style={{ 
                  background: `radial-gradient(circle, ${currentLevelColor.light} 0%, ${currentLevelColor.glow} 50%, ${currentLevelColor.glow}00 70%)`,
                  width: '120%',
                  height: '120%',
                  top: '-10%',
                  left: '-10%',
                  zIndex: -1
                }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.9, 1, 0.9],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  ease: "easeInOut" 
                }}
              />
              
              {/* İkinci ışık katmanı - Bölüm rengine göre (küçültülmüş) */}
              <motion.div 
                className="absolute inset-0 rounded-full" 
                style={{ 
                  background: `radial-gradient(circle, ${currentLevelColor.glow} 0%, ${currentLevelColor.main}cc 50%, ${currentLevelColor.main}00 70%)`,
                  width: '100%',
                  height: '100%',
                  top: '0%',
                  left: '0%',
                  zIndex: -2
                }}
                animate={{ 
                  scale: [1.1, 1, 1.1],
                  opacity: [0.8, 1, 0.8],
                  rotate: [360, 180, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4,
                  ease: "easeInOut" 
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ses Ayarları Popup */}
      <AnimatePresence>
        {showSoundSettings && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSoundSettings(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-b from-indigo-950 to-purple-950 rounded-2xl p-6 max-w-xs w-full shadow-2xl border border-indigo-500/20"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Başlık */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-indigo-300">{t.soundSettings}</h2>
                  <motion.button
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-700/50 text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSoundSettings(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Ses Ayarları */}
                <div className="space-y-6">
                  {/* Müzik Ses Ayarı - Epic Animated Button */}
                  <div className="space-y-3">
                    <label className="text-lg font-medium text-indigo-200 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      {t.music}
                    </label>
                    
                    <motion.button
                      onClick={() => {
                        const currentVolume = getMusicVolume();
                        const newVolume = currentVolume === 0 ? 0.5 : 0;
                        localStorage.setItem('musicVolume', newVolume);
                        updateBackgroundMusicVolume();
                      }}
                      className="relative w-full h-20 rounded-2xl overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Animated Background */}
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          background: getMusicVolume() > 0
                            ? [
                                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              ]
                            : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                        }}
                        transition={{
                          duration: 3,
                          repeat: getMusicVolume() > 0 ? Infinity : 0,
                          ease: 'linear'
                        }}
                      />
                      
                      {/* Glow Effect */}
                      {getMusicVolume() > 0 && (
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
                            scale: getMusicVolume() > 0 ? [1, 1.2, 1] : 1,
                            rotate: getMusicVolume() > 0 ? [0, 10, -10, 0] : 0
                          }}
                          transition={{
                            duration: 2,
                            repeat: getMusicVolume() > 0 ? Infinity : 0,
                            ease: 'easeInOut'
                          }}
                        >
                          {getMusicVolume() > 0 ? (
                            <span className="text-5xl">🎵</span>
                          ) : (
                            <span className="text-5xl opacity-50">🔇</span>
                          )}
                        </motion.div>
                        
                        {/* Text */}
                        <div className="flex flex-col items-start">
                          <motion.span
                            className="text-2xl font-bold text-white"
                            animate={{
                              scale: getMusicVolume() > 0 ? [1, 1.05, 1] : 1
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: getMusicVolume() > 0 ? Infinity : 0
                            }}
                          >
                            {getMusicVolume() > 0 ? t.on : t.off}
                          </motion.span>
                          <span className="text-sm text-white/70">
                            {getMusicVolume() > 0 ? t.musicActive : t.musicOff}
                          </span>
                        </div>
                      </div>
                      
                      {/* Particles */}
                      {getMusicVolume() > 0 && (
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
                  <div className="space-y-3">
                    <label className="text-lg font-medium text-indigo-200 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0l-2.828 2.828m0 0a9 9 0 010-12.728m2.828 2.828a5 5 0 00-1.414 1.414m0 0L3.757 8.464" />
                      </svg>
                      {t.effects}
                    </label>
                    
                    <motion.button
                      onClick={() => {
                        const currentVolume = getEffectsVolume();
                        const newVolume = currentVolume === 0 ? 0.7 : 0;
                        localStorage.setItem('effectsVolume', newVolume);
                        if (newVolume > 0) playSound('telefontıklama');
                      }}
                      className="relative w-full h-20 rounded-2xl overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Animated Background */}
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          background: getEffectsVolume() > 0
                            ? [
                                'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                                'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
                                'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                              ]
                            : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                        }}
                        transition={{
                          duration: 3,
                          repeat: getEffectsVolume() > 0 ? Infinity : 0,
                          ease: 'linear'
                        }}
                      />
                      
                      {/* Glow Effect */}
                      {getEffectsVolume() > 0 && (
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
                            scale: getEffectsVolume() > 0 ? [1, 1.2, 1] : 1,
                            rotate: getEffectsVolume() > 0 ? [0, 10, -10, 0] : 0
                          }}
                          transition={{
                            duration: 2,
                            repeat: getEffectsVolume() > 0 ? Infinity : 0,
                            ease: 'easeInOut'
                          }}
                        >
                          {getEffectsVolume() > 0 ? (
                            <span className="text-5xl">🔊</span>
                          ) : (
                            <span className="text-5xl opacity-50">🔇</span>
                          )}
                        </motion.div>
                        
                        {/* Text */}
                        <div className="flex flex-col items-start">
                          <motion.span
                            className="text-2xl font-bold text-white"
                            animate={{
                              scale: getEffectsVolume() > 0 ? [1, 1.05, 1] : 1
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: getEffectsVolume() > 0 ? Infinity : 0
                            }}
                          >
                            {getEffectsVolume() > 0 ? t.on : t.off}
                          </motion.span>
                          <span className="text-sm text-white/70">
                            {getEffectsVolume() > 0 ? t.effectsActive : t.effectsOff}
                          </span>
                        </div>
                      </div>
                      
                      {/* Sound Waves */}
                      {getEffectsVolume() > 0 && (
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
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Zor Mod Popup */}
      <AnimatePresence>
        {showHardModePopup && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHardModePopup(false)}
            />
            
            {/* Modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-br from-gray-900/95 via-red-950/95 to-gray-900/95 rounded-2xl p-8 w-96 max-w-[90vw] border border-red-500/30 shadow-2xl backdrop-blur-sm pointer-events-auto"
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Başlık */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-red-500 to-orange-600 rounded-full mr-3"></div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500">
                      {t.hardModeSettings}
                    </h2>
                  </div>
                  <motion.button
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-red-900/50 text-white border border-red-500/30"
                    whileHover={!highlightedButton ? { scale: 1.1, backgroundColor: "rgba(127, 29, 29, 0.7)" } : {}}
                    whileTap={!highlightedButton ? { scale: 0.95 } : {}}
                    onClick={() => {
                      // Tutorial sırasında popup'ı kapatmayı engelle
                      if (highlightedButton === 'hard') return;
                      setShowHardModePopup(false);
                    }}
                    style={{ opacity: highlightedButton === 'hard' ? 0.3 : 1 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Açıklama */}
                <p className="text-gray-300 text-sm mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.selectDifficulty}
                </p>

                {/* Zorluk Seviyeleri */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { diffLevel: 1, label: t.easy, emoji: '😊', color: 'from-green-600 to-emerald-600', borderColor: 'border-green-500/50', glowColor: 'rgba(16, 185, 129, 0.6)' },
                    { diffLevel: 2, label: t.medium, emoji: '😐', color: 'from-yellow-600 to-orange-600', borderColor: 'border-yellow-500/50', glowColor: 'rgba(245, 158, 11, 0.6)' },
                    { diffLevel: 3, label: t.hard, emoji: '😤', color: 'from-red-600 to-rose-600', borderColor: 'border-red-500/50', glowColor: 'rgba(239, 68, 68, 0.6)' }
                  ].map(({ diffLevel, label, emoji, color, borderColor, glowColor }) => (
                    <motion.button
                      key={diffLevel}
                      className={`relative py-4 px-3 rounded-xl transition-all duration-300 ${
                        tempHardModeLevel === diffLevel
                          ? `bg-gradient-to-br ${color} text-white border-2 ${borderColor} shadow-lg`
                          : 'bg-gray-800/50 text-gray-400 border-2 border-gray-700/30 hover:border-gray-600/50'
                      }`}
                      style={{
                        // Level 6'da zorluk seviyesi butonlarını kilitle
                        opacity: (highlightedButton === 'hard' && level.id === 6) ? 0.3 : 1
                      }}
                      whileHover={(highlightedButton === 'hard' && level.id === 6) ? {} : { scale: 1.05 }}
                      whileTap={(highlightedButton === 'hard' && level.id === 6) ? {} : { scale: 0.95 }}
                      onClick={() => {
                        // Level 6 tutorial sırasında seviye değiştirmeyi engelle
                        if (highlightedButton === 'hard' && level.id === 6) return;
                        setTempHardModeLevel(diffLevel);
                        playSound('tıklama');
                      }}
                      // Tutorial sırasında (Level 5) tüm seçenekleri parlatma efekti
                      animate={(highlightedButton === 'hard' && level.id === 5) ? {
                        boxShadow: [
                          `0 0 10px ${glowColor}`,
                          `0 0 25px ${glowColor}`,
                          `0 0 10px ${glowColor}`
                        ]
                      } : {}}
                      transition={(highlightedButton === 'hard' && level.id === 5) ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: diffLevel * 0.2
                      } : {}}
                    >
                      {/* Tutorial sırasında parlama efekti (Level 5) */}
                      {(highlightedButton === 'hard' && level.id === 5) && (
                        <motion.div
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          animate={{
                            boxShadow: [
                              `0 0 10px ${glowColor}`,
                              `0 0 20px ${glowColor}`,
                              `0 0 10px ${glowColor}`
                            ]
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: diffLevel * 0.15
                          }}
                        />
                      )}
                      {/* Glow effect when selected */}
                      {tempHardModeLevel === diffLevel && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          animate={{
                            boxShadow: [
                              '0 0 20px rgba(239, 68, 68, 0.3)',
                              '0 0 30px rgba(239, 68, 68, 0.5)',
                              '0 0 20px rgba(239, 68, 68, 0.3)',
                            ]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        />
                      )}
                      
                      <div className="relative flex flex-col items-center gap-2">
                        <span className="text-3xl">{emoji}</span>
                        <span className="text-2xl font-bold">{diffLevel}</span>
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    className="flex-1 bg-gray-800/70 text-white py-3 px-4 rounded-xl font-medium border border-gray-700/30 hover:bg-gray-700/70 transition-all"
                    style={{ opacity: highlightedButton === 'hard' ? 0.3 : 1 }}
                    whileHover={!highlightedButton ? { scale: 1.02 } : {}}
                    whileTap={!highlightedButton ? { scale: 0.98 } : {}}
                    onClick={() => {
                      // Tutorial sırasında iptal etmeyi engelle
                      if (highlightedButton === 'hard') return;
                      setShowHardModePopup(false);
                      playSound('tıklama');
                    }}
                  >
                    {t.cancel}
                  </motion.button>

                  <motion.button
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:from-red-700 hover:to-orange-700 transition-all"
                    style={{ 
                      // Level 6'da Tamam butonunu kilitle (soluk yap)
                      opacity: (highlightedButton === 'hard' && level.id === 6) ? 0.3 : 1 
                    }}
                    whileHover={(highlightedButton === 'hard' && level.id === 6) ? {} : { 
                      scale: 1.02,
                      boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)"
                    }}
                    whileTap={(highlightedButton === 'hard' && level.id === 6) ? {} : { scale: 0.98 }}
                    // Tutorial sırasında (Level 5) Tamam butonunu parlatma
                    animate={(highlightedButton === 'hard' && level.id === 5) ? {
                      boxShadow: [
                        '0 0 10px rgba(239, 68, 68, 0.5)',
                        '0 0 25px rgba(239, 68, 68, 0.8)',
                        '0 0 10px rgba(239, 68, 68, 0.5)'
                      ],
                      scale: [1, 1.03, 1]
                    } : {}}
                    transition={(highlightedButton === 'hard' && level.id === 5) ? {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    } : {}}
                    onClick={() => {
                      // Level 6 tutorial sırasında Tamam'a tıklamayı engelle
                      if (highlightedButton === 'hard' && level.id === 6) return;
                      
                      setHardModeActive(true);
                      setHardModeLevel(tempHardModeLevel);
                      setShowHardModePopup(false);
                      playSound('tıklama');
                      // Level 5 tutorial için: zor mod aktif edildiğinde highlight'ı kaldır
                      if (highlightedButton === 'hard' && level.id === 5) {
                        setHighlightedButton(null);
                        setHardModeActivatedInTutorial(true);
                      }
                    }}
                  >
                    {t.ok}
                  </motion.button>
                </div>

                {/* Disable Hard Mode Button */}
                {hardModeActive && (
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <motion.button
                      className="w-full bg-gray-800/50 text-red-400 py-3 px-4 rounded-xl font-medium border border-red-500/30 hover:bg-gray-700/50 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      // Level 6 tutorial sırasında parlama efekti
                      animate={highlightedButton === 'hard' && level.id === 6 ? {
                        boxShadow: [
                          '0 0 10px rgba(239, 68, 68, 0.4)',
                          '0 0 25px rgba(239, 68, 68, 0.7)',
                          '0 0 10px rgba(239, 68, 68, 0.4)'
                        ],
                        scale: [1, 1.02, 1]
                      } : {}}
                      transition={highlightedButton === 'hard' && level.id === 6 ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      } : {}}
                      onClick={() => {
                        setHardModeActive(false);
                        setShowHardModePopup(false);
                        playSound('tıklama');
                        // Level 6 tutorial için: zor mod kapatıldığında highlight'ı kaldır
                        if (highlightedButton === 'hard' && level.id === 6) {
                          setHighlightedButton(null);
                        }
                      }}
                    >
                      🔓 {t.disableHardMode}
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Oyun İçi Tutorial (Level 1-6) */}
      {showInGameTutorial && (
        <InGameTutorial
          levelId={level.id}
          language={language}
          onDismiss={() => {
            setShowInGameTutorial(false);
            const tutorialKey = `tutorial_level_${level.id}_shown`;
            localStorage.setItem(tutorialKey, 'true');
          }}
          onHighlightButton={(buttonType) => {
            setHighlightedButton(buttonType);
            // Level 1'de parmak animasyonunu başlat
            if (buttonType === 'letters' && level.id === 1) {
              setShowFingerAnimation(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default WordPuzzle;
