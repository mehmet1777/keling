import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exampleSentences } from '../data/exampleSentences';
import { playSound } from '../utils/SoundManager';

const WordBank = ({ completedLevels, levels, onBackClick }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'az', 'za'
  const [letterCount, setLetterCount] = useState('all'); // 'all', '2-3', '4-5', '6-7', '8+'
  const [showFilters, setShowFilters] = useState(false); // Filtre popup'ı göster/gizle
  const [currentPage, setCurrentPage] = useState(1);
  const [layoutMode, setLayoutMode] = useState(() => localStorage.getItem('wordBankLayoutMode') || 'grid'); // 'grid' or 'list'
  const ITEMS_PER_PAGE = 20;
  const [showTutorial, setShowTutorial] = useState(() => {
    // İlk kez kelime bankasını açan kullanıcılar için tutorial'ı göster
    return localStorage.getItem('wordBankTutorialSeen') !== 'true';
  });
  const [tutorialStep, setTutorialStep] = useState(1);
  const totalTutorialSteps = 4;
  const [language] = useState(() => localStorage.getItem('language') || 'tr');

  const translations = {
    tr: {
      title: "Kelime Bankası",
      back: "Geri",
      search: "Kelime ara...",
      noResults: "Arama sonucu bulunamadı.",
      noWords: "Henüz kelime bankanızda kelime bulunmuyor.",
      tryDifferent: "Farklı bir arama terimi deneyin.",
      completeLevel: "Bölümleri tamamlayarak kelime bankanızı doldurun.",
      tutorialTitle: "Kelime Bankası Rehberi",
      step1Title: "Kelime Bankası Nedir?",
      step1Desc: "Kelime Bankası, tamamladığınız bölümlerdeki tüm kelimeleri saklayan ve istediğiniz zaman tekrar edebilmenizi sağlayan özel bir alandır. Öğrendiğiniz her kelime burada saklanır ve kolayca erişebilirsiniz.",
      step2Title: "Arama ve Filtreleme",
      step2Desc: "Üst kısımdaki arama çubuğunu kullanarak kelimelerinizi arayabilir, dil filtreleri ve sıralama seçenekleri ile kelimeleri düzenleyebilirsiniz.",
      step3Title: "Kelime Detayları",
      step3Desc: "Bir kelimeye tıklayarak detaylı bilgilerini görebilir, örnek cümleleri inceleyebilir ve telaffuzunu dinleyebilirsiniz.",
      step4Title: "Düzenli Tekrar",
      step4Desc: "Kelime Bankası'nı ve Kelime Tekrar sayfasını düzenli olarak ziyaret ederek öğrendiğiniz kelimeleri pekiştirin. Ana menüden 'Kelime Tekrar' seçeneğiyle tüm kelimelerinizi gözden geçirebilirsiniz. Düzenli tekrar, kelimeleri uzun süreli hafızanıza yerleştirmenin en etkili yoludur.",
      next: "İleri",
      start: "Başla",
      understood: "Anladım",
      all: "Tümü",
      turkish: "Türkçe",
      english: "İngilizce",
      recent: "En Son",
      az: "A-Z",
      za: "Z-A",
      help: "Yardım",
      showFilters: "Filtrele",
      applyFilters: "Uygula",
      searchLabel: "Kelime Ara",
      sortLabel: "Sıralama",
      letterCountLabel: "Harf Sayısı",
      allLetters: "Tümü",
      letters23: "2-3 Harf",
      letters45: "4-5 Harf",
      letters67: "6-7 Harf",
      letters8plus: "8+ Harf",
      wordsFound: "kelime bulundu",
      searched: "Aranan",
      clickDetails: "Detay için tıklayın",
      exampleSentences: "Örnek Cümleler",
      wordUsage: "Kelime Kullanımı",
      turkishExample: "Türkçe Örnek",
      ok: "Tamam",
    },
    en: {
      title: "Word Bank",
      back: "Back",
      search: "Search words...",
      noResults: "No search results found.",
      noWords: "You don't have any words in your word bank yet.",
      tryDifferent: "Try a different search term.",
      completeLevel: "Complete levels to fill your word bank.",
      tutorialTitle: "Word Bank Guide",
      step1Title: "What is Word Bank?",
      step1Desc: "Word Bank is a special area that stores all the words from the levels you've completed and allows you to review them anytime. Every word you learn is saved here and easily accessible.",
      step2Title: "Search and Filter",
      step2Desc: "Use the search bar at the top to find your words, and organize them with language filters and sorting options.",
      step3Title: "Word Details",
      step3Desc: "Click on a word to see detailed information, review example sentences, and listen to pronunciation.",
      step4Title: "Regular Review",
      step4Desc: "Visit Word Bank and Word Review page regularly to reinforce the words you've learned. You can review all your words by selecting 'Word Review' from the main menu. Regular review is the most effective way to commit words to long-term memory.",
      next: "Next",
      start: "Start",
      understood: "Got it",
      all: "All",
      turkish: "Turkish",
      english: "English",
      recent: "Recent",
      az: "A-Z",
      za: "Z-A",
      help: "Help",
      showFilters: "Filter",
      applyFilters: "Apply",
      searchLabel: "Search Words",
      sortLabel: "Sort",
      letterCountLabel: "Letter Count",
      allLetters: "All",
      letters23: "2-3 Letters",
      letters45: "4-5 Letters",
      letters67: "6-7 Letters",
      letters8plus: "8+ Letters",
      wordsFound: "words found",
      searched: "Search",
      clickDetails: "Click for details",
      exampleSentences: "Example Sentences",
      wordUsage: "Word Usage",
      turkishExample: "Turkish Example",
      ok: "OK",
    }
  };

  const t = translations[language];
  
  // Tamamlanan bölümlerin kelimelerini topla
  const completedLevelWords = levels
    .filter(level => completedLevels.has(level.id))
    .flatMap(level => level.words);
    
  // Filtrelenmiş ve sıralanmış kelimeleri hesapla
  const filteredWords = React.useMemo(() => {
    let result = [...completedLevelWords];
    
    // Arama terimine göre filtrele (hem Türkçe hem İngilizce)
    if (searchTerm) {
      result = result.filter(word => 
        word.turkish.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.english.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Harf sayısına göre filtrele
    if (letterCount !== 'all') {
      result = result.filter(word => {
        const length = word.turkish.length;
        if (letterCount === '2-3') return length >= 2 && length <= 3;
        if (letterCount === '4-5') return length >= 4 && length <= 5;
        if (letterCount === '6-7') return length >= 6 && length <= 7;
        if (letterCount === '8+') return length >= 8;
        return true;
      });
    }
    
    // Sıralama
    if (sortBy === 'az') {
      result.sort((a, b) => a.turkish.localeCompare(b.turkish));
    } else if (sortBy === 'za') {
      result.sort((a, b) => b.turkish.localeCompare(a.turkish));
    }
    
    return result;
  }, [completedLevelWords, searchTerm, letterCount, sortBy]);

  // Sayfalama
  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWords = filteredWords.slice(startIndex, endIndex);

  // Filtre değiştiğinde sayfayı sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, letterCount, sortBy]);

  // Tutorial'ı kapat ve localStorage'a kaydet
  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('wordBankTutorialSeen', 'true');
  };

  // Tutorial'ın sonraki adımına geç
  const nextTutorialStep = () => {
    if (tutorialStep < totalTutorialSteps) {
      setTutorialStep(tutorialStep + 1);
    } else {
      closeTutorial();
    }
  };

  // Tutorial'ın önceki adımına dön
  const prevTutorialStep = () => {
    if (tutorialStep > 1) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  // Telaffuz fonksiyonu - voiceGender ayarını kullan
  const speak = (text, lang) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = lang === 'tr-TR' ? 0.75 : 0.85;
    
    // Ayarlardan ses cinsiyetini al
    const voiceGender = localStorage.getItem('voiceGender') || 'male';
    
    // Pitch ayarı - sadece Türkçe için değiştir, İngilizce David'i olduğu gibi bırak
    if (lang === 'tr-TR') {
      utterance.pitch = voiceGender === 'male' ? 0.5 : 1.3;
    } else {
      utterance.pitch = 1.0; // İngilizce için normal pitch (David'in orijinal sesi)
    }
    
    // Uygun sesi seç
    const allVoices = window.speechSynthesis.getVoices();
    
    if (lang === 'tr-TR') {
      const turkishVoices = allVoices.filter(voice => voice.lang.startsWith('tr'));
      const turkishVoice = voiceGender === 'male' 
        ? turkishVoices[0] 
        : turkishVoices[turkishVoices.length > 1 ? 1 : 0];
      if (turkishVoice) utterance.voice = turkishVoice;
    } else {
      const englishVoice = allVoices.find(voice => 
        voice.lang.startsWith('en') && 
        (voiceGender === 'male' 
          ? (voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('Mark') || voice.name.includes('Daniel'))
          : (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Victoria') || voice.name.includes('Karen') || voice.name.includes('Zira'))
        )
      ) || allVoices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Kelime için örnek cümleleri getir
  const getExampleSentences = (word) => {
    // İngilizce kelime ile tam eşleşme kontrolü
    if (exampleSentences[word.english]) {
      return exampleSentences[word.english];
    }
    
    // Türkçe kelime ile eşleşme kontrolü
    // Tüm exampleSentences içinde dolaşıp Türkçe kelimeleri kontrol et
    for (const key in exampleSentences) {
      const sentence = exampleSentences[key];
      // Türkçe cümle içinde Türkçe kelime geçiyorsa
      if (sentence.turkish.toLowerCase().includes(word.turkish.toLowerCase())) {
        return sentence;
      }
    }
    
    // Küçük harfe çevirip kontrol et
    const lowerCaseEnglish = word.english.toLowerCase();
    if (exampleSentences[lowerCaseEnglish]) {
      return exampleSentences[lowerCaseEnglish];
    }
    
    // Çoğul/tekil form kontrolü (basit s eklentisi için)
    if (word.english.endsWith('s') && exampleSentences[word.english.slice(0, -1)]) {
      return exampleSentences[word.english.slice(0, -1)];
    }
    
    // Tekil kelimeyi çoğul yaparak kontrol et
    if (exampleSentences[word.english + 's']) {
      return exampleSentences[word.english + 's'];
    }
    
    // Özel örnek cümle bulunamadıysa şablon cümle kullan
    // Örnek cümle şablonları
    const turkishTemplates = [
      `${word.turkish} kelimesini günlük hayatta sık kullanırız.`,
      `Bu kitapta ${word.turkish} kavramı detaylı anlatılmış.`,
      `${word.turkish} olmadan bu işi tamamlayamayız.`,
      `Öğretmen bize ${word.turkish} hakkında bilgi verdi.`,
      `${word.turkish} konusunda daha fazla çalışmalıyım.`
    ];
    
    const englishTemplates = [
      `We often use the word ${word.english} in daily conversations.`,
      `I need to understand the concept of ${word.english} better.`,
      `Without ${word.english}, we cannot complete this task.`,
      `She explained the importance of ${word.english} in her presentation.`,
      `Let's discuss more about ${word.english} tomorrow.`
    ];
    
    // Kelimeye göre rastgele bir cümle seç
    const turkishIndex = Math.floor(Math.random() * turkishTemplates.length);
    const englishIndex = Math.floor(Math.random() * englishTemplates.length);
    
    return {
      turkish: turkishTemplates[turkishIndex],
      english: englishTemplates[englishIndex]
    };
  };

  // Animasyon varyantları
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

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

  const handleCardClick = (word) => {
    setSelectedWord(word);
  };

  const closeModal = () => {
    setSelectedWord(null);
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-neutral-900 via-indigo-950/20 to-black overflow-auto select-none"
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
        .min-h-screen.overflow-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Fixed Üst Butonlar - Geri, Layout Toggle ve Yardım */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-transparent pb-2 pt-3 sm:pt-4 px-3 sm:px-4 md:px-8">
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          <motion.button
            onClick={() => {
              playSound('telefontıklama.mp3');
              onBackClick();
            }}
            className="p-2 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-lg text-white shadow-lg border border-purple-500/30 hover:from-purple-600/30 hover:to-indigo-600/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </motion.button>
          
          <div className="flex items-center gap-2">
            {/* Layout Toggle Button */}
            <motion.button
              onClick={() => {
                playSound('telefontıklama.mp3');
                const newMode = layoutMode === 'grid' ? 'list' : 'grid';
                setLayoutMode(newMode);
                localStorage.setItem('wordBankLayoutMode', newMode);
              }}
              className="p-2 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 backdrop-blur-md rounded-lg text-white shadow-lg border border-indigo-500/30 hover:from-indigo-600/30 hover:to-blue-600/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {layoutMode === 'grid' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
            </motion.button>
            
            <motion.button
              onClick={() => {
                playSound('telefontıklama.mp3');
                setTutorialStep(1); // Her açılışta 1. adımdan başla
                setShowTutorial(true);
              }}
              className="p-2 bg-gradient-to-br from-pink-600/20 to-purple-600/20 backdrop-blur-md rounded-lg text-white shadow-lg border border-pink-500/30 hover:from-pink-600/30 hover:to-purple-600/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Spacer - Fixed header için boşluk */}
      <div className="h-14 sm:h-16"></div>

      {/* İçerik Alanı */}
      <div className="w-full max-w-md px-3 sm:px-4 md:px-8 pb-3 sm:pb-4 md:pb-8">
        {/* 3D Neon Başlık - Ortalanmış ve Büyük */}
        <motion.div 
          className="flex justify-center mb-4 sm:mb-6 md:mb-8 mt-2 px-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative inline-block">
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
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight relative">
              <span className="inline-flex items-baseline relative">
                {/* 3D shadow layers */}
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent blur-sm translate-x-1 translate-y-1 opacity-50">
                  {t.title}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 bg-clip-text text-transparent blur-md translate-x-2 translate-y-2 opacity-30">
                  {t.title}
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
                    filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 30px rgba(236, 72, 153, 0.6))',
                  }}
                >
                  {t.title}
                </motion.span>
              </span>
            </h1>
          </div>
        </motion.div>

        {/* Arama, Sonuç Sayısı ve Filtre Butonu */}
        <div className="w-full mb-3 sm:mb-4 flex items-center justify-center gap-1.5 sm:gap-2 px-1">
        {/* Sonuç Sayısı - Kompakt */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-lg border border-purple-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-xs sm:text-sm font-semibold text-white">{filteredWords.length}</span>
        </div>

        {/* Arama Çubuğu - Ortada */}
        <div className="flex-1 flex items-center bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t.search}
            className="bg-transparent w-full text-white placeholder-purple-300/50 outline-none text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <motion.button
              onClick={() => setSearchTerm('')}
              className="ml-2 text-purple-400 hover:text-white flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>
        
        {/* Filtre İkon Butonu */}
        <motion.button
          onClick={() => {
            playSound('telefontıklama.mp3');
            setShowFilters(true);
          }}
          className="p-2 sm:p-2.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-lg text-white border border-purple-500/30 hover:from-purple-600/40 hover:to-indigo-600/40 transition-all shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </motion.button>
      </div>

      {/* Filtre Popup Modal */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowFilters(false)}
            />
            
            {/* Modal Container - Mobil Uyumlu */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-br from-gray-900/95 via-indigo-950/95 to-purple-900/95 rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-2xl backdrop-blur-md">
                  {/* Başlık */}
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <h3 className="text-lg sm:text-xl font-bold text-white">{t.showFilters}</h3>
                    </div>
                    <motion.button
                      onClick={() => setShowFilters(false)}
                      className="p-1.5 sm:p-2 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Filtreler */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Harf Sayısı Filtresi */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-pink-300 mb-1.5 sm:mb-2">{t.letterCountLabel}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${letterCount === 'all' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            setLetterCount('all');
                          }}
                        >
                          {t.allLetters}
                        </button>
                        <button 
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${letterCount === '2-3' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            setLetterCount('2-3');
                          }}
                        >
                          {t.letters23}
                        </button>
                        <button 
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${letterCount === '4-5' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            setLetterCount('4-5');
                          }}
                        >
                          {t.letters45}
                        </button>
                        <button 
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${letterCount === '6-7' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            setLetterCount('6-7');
                          }}
                        >
                          {t.letters67}
                        </button>
                        <button 
                          className={`col-span-2 px-2 py-2 rounded-lg text-xs font-medium transition-all ${letterCount === '8+' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            setLetterCount('8+');
                          }}
                        >
                          {t.letters8plus}
                        </button>
                      </div>
                    </div>

                    {/* Sıralama */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-indigo-300 mb-1.5 sm:mb-2">{t.sortLabel}</label>
                      <select 
                        className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/5 backdrop-blur-md rounded-lg text-white text-xs sm:text-sm border border-white/10 hover:bg-white/10 transition-all cursor-pointer focus:outline-none focus:border-purple-400"
                        value={sortBy}
                        onChange={(e) => {
                          playSound('telefontıklama.mp3');
                          setSortBy(e.target.value);
                        }}
                      >
                        <option value="recent" className="bg-gray-900">{t.recent}</option>
                        <option value="az" className="bg-gray-900">{t.az}</option>
                        <option value="za" className="bg-gray-900">{t.za}</option>
                      </select>
                    </div>
                  </div>

                  {/* Uygula Butonu */}
                  <motion.button
                    onClick={() => {
                      playSound('telefontıklama.mp3');
                      setShowFilters(false);
                    }}
                    className="w-full mt-4 sm:mt-6 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white text-sm sm:text-base font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t.applyFilters}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {filteredWords.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/30 w-full max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-gray-300 font-medium text-lg font-sans">
            {searchTerm ? t.noResults : t.noWords}
          </p>
          <p className="text-gray-400 text-sm mt-2 font-sans">
            {searchTerm ? t.tryDifferent : t.completeLevel}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`w-full max-w-md ${layoutMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4' : 'flex flex-col gap-2.5 sm:gap-3'} px-1`}
        >
          {paginatedWords.map((word, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                playSound('telefontıklama.mp3');
                handleCardClick(word);
              }}
            >
              {/* Kart Arka Plan - Layout moduna göre */}
              <div className={`relative bg-gradient-to-br from-gray-900/95 via-indigo-950/95 to-purple-900/95 rounded-xl sm:rounded-2xl border border-purple-500/30 shadow-2xl backdrop-blur-md overflow-hidden h-full ${
                layoutMode === 'grid' ? 'p-3 sm:p-4 md:p-5' : 'p-3 sm:p-4'
              }`}>
                {/* Hover Gradient Overlay */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                
                {/* Üst Köşe - Numara Badge */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-[10px] sm:text-xs font-bold">{startIndex + index + 1}</span>
                </div>

                {/* İçerik - Layout moduna göre */}
                <div className={`relative ${
                  layoutMode === 'grid' 
                    ? 'space-y-2 sm:space-y-3 md:space-y-4' 
                    : 'flex items-center gap-3 sm:gap-4'
                }`}>
                  {/* Türkçe Kelime Bölümü - Bayrak Renkleri */}
                  <div className={`relative text-center bg-gradient-to-br from-red-600/30 via-red-700/30 to-red-800/30 rounded-lg sm:rounded-xl border border-red-500/30 overflow-hidden ${
                    layoutMode === 'grid' 
                      ? 'space-y-1.5 sm:space-y-2 p-3 sm:p-4' 
                      : 'flex-1 p-2 sm:p-3'
                  }`}>
                    
                    <div className={`relative flex items-center justify-center gap-1.5 sm:gap-2 ${layoutMode === 'list' ? 'flex-col' : ''}`}>
                      <span className={layoutMode === 'grid' ? 'text-xl sm:text-2xl md:text-3xl' : 'text-lg sm:text-xl'}>🇹🇷</span>
                      {layoutMode === 'grid' && (
                        <span className="text-[9px] sm:text-[10px] md:text-xs text-red-200 uppercase tracking-widest font-bold">Türkçe</span>
                      )}
                    </div>
                    <motion.h3 
                      className={`relative font-black text-white leading-tight group-hover:text-red-100 transition-all duration-300 ${
                        layoutMode === 'grid' 
                          ? 'text-xl sm:text-2xl md:text-3xl' 
                          : 'text-base sm:text-lg mt-1'
                      }`}
                      style={{
                        textShadow: "0 0 20px rgba(220, 38, 38, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)"
                      }}
                    >
                      {word.turkish}
                    </motion.h3>
                  </div>

                  {/* Ayırıcı - Layout moduna göre */}
                  {layoutMode === 'grid' ? (
                    <div className="flex items-center gap-2 sm:gap-3 py-0.5 sm:py-1">
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-purple-500/60 to-purple-500/60 rounded-full"></div>
                      <motion.div
                        animate={{ rotate: [0, 180, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </motion.div>
                      <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent via-indigo-500/60 to-indigo-500/60 rounded-full"></div>
                    </div>
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </motion.div>
                  )}

                  {/* İngilizce Kelime Bölümü - Bayrak Renkleri */}
                  <div className={`relative text-center bg-gradient-to-br from-blue-700/30 via-blue-800/30 to-blue-900/30 rounded-lg sm:rounded-xl border border-blue-500/30 overflow-hidden ${
                    layoutMode === 'grid' 
                      ? 'space-y-1.5 sm:space-y-2 p-3 sm:p-4' 
                      : 'flex-1 p-2 sm:p-3'
                  }`}>
                    
                    <div className={`relative flex items-center justify-center gap-1.5 sm:gap-2 ${layoutMode === 'list' ? 'flex-col' : ''}`}>
                      <span className={layoutMode === 'grid' ? 'text-xl sm:text-2xl md:text-3xl' : 'text-lg sm:text-xl'}>🇬🇧</span>
                      {layoutMode === 'grid' && (
                        <span className="text-[9px] sm:text-[10px] md:text-xs text-blue-200 uppercase tracking-widest font-bold">English</span>
                      )}
                    </div>
                    <motion.p 
                      className={`relative font-black text-white leading-tight group-hover:text-blue-100 transition-all duration-300 ${
                        layoutMode === 'grid' 
                          ? 'text-lg sm:text-xl md:text-2xl' 
                          : 'text-base sm:text-lg mt-1'
                      }`}
                      style={{
                        textShadow: "0 0 20px rgba(29, 78, 216, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)"
                      }}
                    >
                      {word.english}
                    </motion.p>
                  </div>

                  {/* Alt - Aksiyon Butonları */}
                  <div className={`flex items-center justify-between border-purple-500/20 ${
                    layoutMode === 'grid' ? 'pt-2 sm:pt-3 border-t' : 'ml-auto gap-2'
                  }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Telaffuz Butonu */}
                      <motion.div 
                        className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center group-hover:bg-purple-600/50 transition-colors"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </motion.div>
                      
                      {/* Örnek Cümle Butonu */}
                      <motion.div 
                        className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-pink-600/30 border border-pink-500/40 flex items-center justify-center group-hover:bg-pink-600/50 transition-colors"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </motion.div>
                    </div>

                    {/* İlgi Çekici Çağrı Metni - Sağda */}
                    <motion.div 
                      className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 border border-purple-400/40"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          "0 0 0px rgba(168, 85, 247, 0.4)",
                          "0 0 20px rgba(168, 85, 247, 0.6)",
                          "0 0 0px rgba(168, 85, 247, 0.4)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-purple-200 font-bold">
                        👆 Tıkla!
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <motion.div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    boxShadow: "0 0 40px rgba(168, 85, 247, 0.4), inset 0 0 40px rgba(168, 85, 247, 0.1)"
                  }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Sayfalama - Modern ve Kompakt */}
      {totalPages > 1 && (
        <div className="w-full max-w-md flex justify-center items-center mt-4 sm:mt-6 px-2">
          <div className="flex items-center gap-2 bg-gradient-to-r from-gray-900/80 via-indigo-950/80 to-purple-900/80 backdrop-blur-md rounded-full px-3 py-2 border border-purple-500/30 shadow-2xl">
            {/* Önceki */}
            <motion.button
              onClick={() => {
                playSound('telefontıklama.mp3');
                setCurrentPage(prev => Math.max(1, prev - 1));
              }}
              disabled={currentPage === 1}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-600/30 text-white text-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-600/50 transition-all"
              whileHover={currentPage !== 1 ? { scale: 1.1 } : {}}
              whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            {/* Sayfa Göstergesi */}
            <div className="flex items-center gap-1.5 px-2">
              <span className="text-white font-bold text-sm sm:text-base">{currentPage}</span>
              <span className="text-gray-400 text-xs">/</span>
              <span className="text-gray-300 text-sm sm:text-base">{totalPages}</span>
            </div>

            {/* Sonraki */}
            <motion.button
              onClick={() => {
                playSound('telefontıklama.mp3');
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
              }}
              disabled={currentPage === totalPages}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-600/30 text-white text-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-600/50 transition-all"
              whileHover={currentPage !== totalPages ? { scale: 1.1 } : {}}
              whileTap={currentPage !== totalPages ? { scale: 0.9 } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </div>
      )}

      </div>

      {/* Kelime Bankası Tutorial */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900/95 via-indigo-950/95 to-purple-900/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full border border-purple-500/30 shadow-2xl backdrop-blur-md"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tutorial Başlık */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                  <h2 className="text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 truncate">{t.tutorialTitle}</h2>
                </div>
                <div className="bg-gray-800/70 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border border-purple-500/20 shadow-inner flex items-center ml-2 flex-shrink-0">
                  <span className="text-purple-400 font-bold">{tutorialStep}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-gray-300">{totalTutorialSteps}</span>
                </div>
              </div>
              
              {/* Tutorial İçerik */}
              <div className="min-h-[180px] sm:min-h-[220px] flex items-center justify-center mb-4 sm:mb-6">
                {tutorialStep === 1 && (
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
                      📚
                    </motion.div>
                    <motion.h3 
                      className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {t.step1Title}
                    </motion.h3>
                    <motion.p 
                      className="text-white/80 leading-relaxed"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {t.step1Desc}
                    </motion.p>
                  </motion.div>
                )}
                
                {tutorialStep === 2 && (
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
                      🔍
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
                      className="space-y-2 mb-3"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {/* Arama Çubuğu Örneği */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-lg border border-purple-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-[10px] font-semibold text-white">25</span>
                        </div>
                        <div className="flex-1 flex items-center bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-lg px-2 py-1 border border-purple-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span className="text-[10px] text-purple-300/50">{t.search}</span>
                        </div>
                        <div className="p-1.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-lg border border-purple-500/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Sayfalama Örneği */}
                      <div className="flex justify-center">
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-gray-900/80 via-indigo-950/80 to-purple-900/80 backdrop-blur-md rounded-full px-2 py-1 border border-purple-500/30">
                          <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </div>
                          <span className="text-white font-bold text-[10px]">1</span>
                          <span className="text-gray-400 text-[8px]">/</span>
                          <span className="text-gray-300 text-[10px]">3</span>
                          <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
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
                
                {tutorialStep === 3 && (
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
                      initial={{ scale: 0.8, rotate: -5 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                    >
                      👆
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
                      className="bg-gradient-to-br from-gray-900/90 via-indigo-950/90 to-purple-900/90 rounded-xl p-3 border border-purple-500/30 shadow-lg backdrop-blur-sm mb-3 space-y-2"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {/* Türkçe - Kırmızı Bayrak */}
                      <div className="bg-gradient-to-br from-red-600/30 via-red-700/30 to-red-800/30 rounded-lg p-2 border border-red-500/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-lg">🇹🇷</span>
                          <span className="text-[8px] text-red-200 uppercase tracking-wider font-bold">Türkçe</span>
                        </div>
                        <h3 className="text-base font-black text-white">kitap</h3>
                      </div>
                      
                      {/* Ayırıcı */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-purple-500/40"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <div className="flex-1 h-px bg-purple-500/40"></div>
                      </div>
                      
                      {/* İngilizce - Mavi Bayrak */}
                      <div className="bg-gradient-to-br from-blue-700/30 via-blue-800/30 to-blue-900/30 rounded-lg p-2 border border-blue-500/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-lg">🇬🇧</span>
                          <span className="text-[8px] text-blue-200 uppercase tracking-wider font-bold">English</span>
                        </div>
                        <p className="text-base font-black text-white">book</p>
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
                
                {tutorialStep === 4 && (
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
                      initial={{ scale: 0.8, rotate: 5 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                    >
                      🎯
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
                      className="space-y-2 mb-4"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {/* Kelime Bankası */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl"></div>
                        <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-2.5 border border-purple-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white text-lg">📚</span>
                              </div>
                              <span className="text-white font-medium text-sm">Kelime Bankası</span>
                            </div>
                            <span className="text-xs text-purple-300">25 kelime</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Kelime Tekrar */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl blur-xl"></div>
                        <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-2.5 border border-pink-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                                <span className="text-white text-lg">🔄</span>
                              </div>
                              <span className="text-white font-medium text-sm">Kelime Tekrar</span>
                            </div>
                            <span className="text-xs text-pink-300">Tekrar et</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    <motion.p 
                      className="text-white/80 leading-relaxed"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {t.step4Desc}
                    </motion.p>
                  </motion.div>
                )}
              </div>
              
              {/* Tutorial Navigasyon Butonları */}
              <div className="flex justify-between items-center gap-2">
                {tutorialStep > 1 ? (
                  <motion.button
                    className="px-3 sm:px-4 py-2 bg-gray-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl text-white text-sm sm:text-base border border-gray-700/30 flex items-center gap-1.5 sm:gap-2"
                    onClick={() => {
                      playSound('telefontıklama.mp3');
                      prevTutorialStep();
                    }}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(31, 41, 55, 0.8)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">{t.back}</span>
                  </motion.button>
                ) : (
                  <div></div>
                )}
                
                <motion.button
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-medium shadow-lg flex items-center gap-1.5 sm:gap-2"
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    nextTutorialStep();
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 0 20px rgba(192, 132, 252, 0.5)",
                    backgroundImage: "linear-gradient(to right, #9333ea, #ec4899)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{tutorialStep === totalTutorialSteps ? t.start : t.next}</span>
                  {tutorialStep === totalTutorialSteps ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </motion.button>
              </div>
              
              {/* İlerleme Çubuğu */}
              <div className="mt-4 sm:mt-6 bg-gray-800/50 h-1 sm:h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  initial={{ width: `${(tutorialStep / totalTutorialSteps) * 100}%` }}
                  animate={{ width: `${(tutorialStep / totalTutorialSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                ></motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kelime detay modal */}
      <AnimatePresence>
        {selectedWord && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900/90 via-indigo-950/90 to-purple-900/90 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl backdrop-blur-sm"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Kapatma Butonu */}
              <motion.button 
                className="text-gray-400 hover:text-white bg-gray-800/70 backdrop-blur-sm rounded-full p-1.5 sm:p-2 transition-colors border border-gray-700/30 shadow-lg absolute top-2 right-2 sm:top-4 sm:right-4 z-10"
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  closeModal();
                }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Kelime Kartları - Optimize Edilmiş */}
              <div className="space-y-3 mb-4">
                {/* Türkçe Kelime */}
                <div className="bg-gradient-to-br from-pink-900/40 to-purple-900/40 rounded-2xl p-4 border border-pink-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🇹🇷</span>
                        <span className="text-xs text-pink-300 font-medium uppercase tracking-wider">Türkçe</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white">{selectedWord.turkish}</h2>
                    </div>
                    <motion.button
                      onClick={() => {
                        playSound('telefontıklama.mp3');
                        speak(selectedWord.turkish, 'tr-TR');
                      }}
                      className="p-3 bg-pink-600/30 hover:bg-pink-600/50 rounded-xl border border-pink-400/30 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-5 h-5 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* İngilizce Kelime */}
                <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-2xl p-4 border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🇬🇧</span>
                        <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">English</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white">{selectedWord.english}</h2>
                    </div>
                    <motion.button
                      onClick={() => {
                        playSound('telefontıklama.mp3');
                        speak(selectedWord.english, 'en-US');
                      }}
                      className="p-3 bg-blue-600/30 hover:bg-blue-600/50 rounded-xl border border-blue-400/30 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Örnek Cümleler Başlık */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs uppercase tracking-wider text-purple-300 font-medium">{t.exampleSentences}</h3>
                </div>
              </div>
              
              {/* Örnek Cümleler */}
              <div className="space-y-3">
                {/* Türkçe Örnek */}
                <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 p-3 rounded-xl border border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-purple-600/40 flex items-center justify-center mr-2">
                        <span className="text-purple-300 text-xs font-bold">TR</span>
                      </div>
                      <h3 className="text-xs uppercase tracking-wider text-purple-300 font-medium">{t.turkishExample}</h3>
                    </div>
                    <motion.button
                      onClick={() => {
                        playSound('telefontıklama.mp3');
                        speak(getExampleSentences(selectedWord).turkish, 'tr-TR');
                      }}
                      className="p-1.5 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg border border-purple-400/30 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </motion.button>
                  </div>
                  <p className="text-gray-200 font-serif italic pl-7 leading-relaxed text-sm">{getExampleSentences(selectedWord).turkish}</p>
                </div>
                
                {/* İngilizce Örnek */}
                <div className="bg-gradient-to-r from-indigo-900/30 to-indigo-800/20 p-3 rounded-xl border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-indigo-600/40 flex items-center justify-center mr-2">
                        <span className="text-indigo-300 text-xs font-bold">EN</span>
                      </div>
                      <h3 className="text-xs uppercase tracking-wider text-indigo-300 font-medium">English Example</h3>
                    </div>
                    <motion.button
                      onClick={() => {
                        playSound('telefontıklama.mp3');
                        speak(getExampleSentences(selectedWord).english.replace(/^:\s*/, ''), 'en-US');
                      }}
                      className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 rounded-lg border border-indigo-400/30 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </motion.button>
                  </div>
                  <p className="text-gray-200 font-serif italic pl-7 leading-relaxed text-sm">{getExampleSentences(selectedWord).english.replace(/^:\s*/, '')}</p>
                </div>
              </div>
              
              {/* Kapat Butonu */}
              <div className="mt-4">
                <motion.button
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-sm sm:text-base font-medium shadow-lg"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    closeModal();
                  }}
                >
                  {t.ok}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordBank;
