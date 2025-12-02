import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../utils/SoundManager';

const WordReview = ({ completedLevels, levels, onBackClick, onReviewComplete }) => {
  const [language] = useState(() => localStorage.getItem('language') || 'tr');
  const [englishMode] = useState(() => localStorage.getItem('englishMode') === 'true');
  const [selectedBox, setSelectedBox] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false); // Çeviri kartı göster
  const [showContinueButton, setShowContinueButton] = useState(false); // Devam Et butonu göster
  const [showCompletionModal, setShowCompletionModal] = useState(false); // Tamamlama geçmişi modal
  const [modalBoxData, setModalBoxData] = useState(null); // Modal için kutu verisi
  const [showCelebrationModal, setShowCelebrationModal] = useState(false); // Kutlama modalı
  const [celebrationBoxNumber, setCelebrationBoxNumber] = useState(null); // Tamamlanan koleksiyon numarası
  const [showTutorial, setShowTutorial] = useState(() => {
    const hasSeenTutorial = localStorage.getItem('wordReviewTutorialSeen');
    return !hasSeenTutorial;
  });
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, inProgress, notStarted
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, mostCompleted
  const [searchTerm, setSearchTerm] = useState(''); // Arama terimi
  const [showFilters, setShowFilters] = useState(false); // Filtreleri göster/gizle
  const [currentPage, setCurrentPage] = useState(1);
  const [layoutMode, setLayoutMode] = useState(() => localStorage.getItem('wordReviewLayoutMode') || 'grid'); // 'grid' or 'list'
  const ITEMS_PER_PAGE = 10;
  const [boxProgress, setBoxProgress] = useState(() => {
    const saved = localStorage.getItem('wordBoxProgress');
    return saved ? JSON.parse(saved) : {};
  });
  const [boxCurrentIndex, setBoxCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('wordBoxCurrentIndex');
    return saved ? JSON.parse(saved) : {};
  });

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('wordReviewTutorialSeen', 'true');
  };

  // Tamamlanan bölümlerin kelimelerini topla
  const allWords = levels
    .filter(level => completedLevels.has(level.id))
    .flatMap(level => level.words);

  // Kelimeleri 15'erli kutulara böl
  const WORDS_PER_BOX = 15;
  const totalBoxes = Math.ceil(allWords.length / WORDS_PER_BOX);
  
  let boxes = Array.from({ length: totalBoxes }, (_, index) => {
    const startIdx = index * WORDS_PER_BOX;
    const endIdx = Math.min(startIdx + WORDS_PER_BOX, allWords.length);
    const boxWords = allWords.slice(startIdx, endIdx);
    const boxId = `box-${index}`;
    const progress = boxProgress[boxId] || { completed: [], total: boxWords.length };
    
    // Kutu tam 15 kelime mi?
    const isFullBox = boxWords.length === WORDS_PER_BOX;
    
    // Kutu tamamlanmış mı? (completionHistory varsa veya completed tam doluysa)
    // AMA sadece tam 15 kelimeli kutular tamamlanabilir
    const hasCompletionHistory = progress.completionHistory && progress.completionHistory.length > 0;
    const isCurrentlyCompleted = progress.completed.length === boxWords.length;
    const isCompleted = isFullBox && (hasCompletionHistory || isCurrentlyCompleted);
    
    return {
      id: boxId,
      number: index + 1,
      words: boxWords,
      completed: progress.completed.length,
      total: boxWords.length,
      isCompleted: isCompleted,
      completedAt: progress.completedAt || null,
      completionHistory: progress.completionHistory || [],
      isFullBox: isFullBox
    };
  });

  // Sadece tam 15 kelimeli koleksiyonları göster
  const incompleteBoxes = boxes.filter(box => !box.isFullBox);
  const incompleteBox = incompleteBoxes.length > 0 ? incompleteBoxes[0] : null;
  const incompleteWordsCount = incompleteBox ? incompleteBox.words.length : 0;
  boxes = boxes.filter(box => box.isFullBox);

  // Koleksiyonlara kilit durumu ekle (önceki koleksiyon tamamlanmadan açılamaz)
  boxes = boxes.map((box, index) => {
    // İlk koleksiyon her zaman açık
    if (index === 0) {
      return { ...box, isLocked: false };
    }
    // Önceki koleksiyon en az 1 kez tamamlanmış mı?
    const previousBox = boxes[index - 1];
    const isPreviousCompleted = previousBox.completionHistory && previousBox.completionHistory.length > 0;
    return { ...box, isLocked: !isPreviousCompleted };
  });

  // Arama filtresi
  if (searchTerm) {
    boxes = boxes.filter(box => 
      box.number.toString().includes(searchTerm) ||
      `koleksiyon ${box.number}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `collection ${box.number}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Durum filtresi
  if (filterStatus !== 'all') {
    boxes = boxes.filter(box => {
      if (filterStatus === 'completed') return box.isCompleted;
      if (filterStatus === 'inProgress') return box.completed > 0 && !box.isCompleted;
      // Başlanmamış: completed 0 VE geçmişi yok
      if (filterStatus === 'notStarted') return box.completed === 0 && box.completionHistory.length === 0;
      return true;
    });
  }

  // Sıralama
  if (sortOrder === 'oldest') {
    boxes = [...boxes].reverse();
  } else if (sortOrder === 'mostCompleted') {
    boxes = [...boxes].sort((a, b) => {
      const aCount = a.completionHistory.length;
      const bCount = b.completionHistory.length;
      return bCount - aCount;
    });
  }

  // En son çalışılan koleksiyonu bul
  const lastWorkedTimes = JSON.parse(localStorage.getItem('boxLastWorkedTimes') || '{}');
  const lastWorkedBox = boxes
    .filter(box => boxCurrentIndex[box.id] > 0 || (box.completed > 0 && !box.isCompleted))
    .sort((a, b) => {
      const aTime = lastWorkedTimes[a.id] || 0;
      const bTime = lastWorkedTimes[b.id] || 0;
      return bTime - aTime; // En yeni önce
    })[0];
  
  const inProgressBox = lastWorkedBox;

  // Sayfalama
  const totalPages = Math.ceil(boxes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBoxes = boxes.slice(startIndex, endIndex);

  // İlk tamamlanmamış koleksiyonu bul (scroll için)
  const firstIncompleteBox = boxes.find(box => !box.isCompleted);
  const firstIncompleteBoxRef = useRef(null);

  // Sayfa yüklendiğinde ilk tamamlanmamış koleksiyona scroll yap
  useEffect(() => {
    if (firstIncompleteBox && firstIncompleteBoxRef.current && !selectedBox) {
      // Koleksiyonun hangi sayfada olduğunu bul
      const boxIndex = boxes.findIndex(b => b.id === firstIncompleteBox.id);
      if (boxIndex !== -1) {
        const targetPage = Math.floor(boxIndex / ITEMS_PER_PAGE) + 1;
        
        // Eğer farklı sayfadaysa, önce o sayfaya geç
        if (currentPage !== targetPage) {
          setCurrentPage(targetPage);
        }
        
        // Kısa bir gecikme ile scroll yap (sayfa geçişi için)
        setTimeout(() => {
          firstIncompleteBoxRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 300);
      }
    }
  }, [firstIncompleteBox?.id, currentPage, selectedBox]);

  const translations = {
    tr: {
      title: "Kelime Tekrarı",
      back: "Geri",
      box: "Koleksiyon",
      words: "Kelime",
      completed: "Tamamlandı",
      inProgress: "Devam Ediyor",
      start: "Başla",
      continue: "Devam Et",
      review: "Tekrar Et",
      typeAnswer: "İngilizce karşılığını yaz",
      typeAnswerReverse: "Türkçe karşılığını yaz",
      check: "Kontrol Et",
      correct: "Doğru!",
      wrong: "Yanlış!",
      correctAnswer: "Doğru cevap",
      fillAnswer: "Doldur ve Kontrol Et",
      next: "Sonraki",
      boxCompleted: "Koleksiyon Tamamlandı!",
      boxCompletedDesc: "Bu koleksiyondaki tüm kelimeleri öğrendin!",
      backToBoxes: "Koleksiyonlara Dön",
      noWords: "Henüz kelime yok",
      noWordsDesc: "Bölümleri tamamlayarak kelime bankanızı doldurun.",
      pronunciation: "Telaffuz",
      listen: "Dinle",
      listenAgain: "Tekrar Dinle",
      great: "Harika!",
      tryAgain: "Tekrar dene",
      typeYourAnswer: "Cevabını yaz...",
      continueButton: "Devam Et →",
      whereYouLeft: "Kaldığın Yer",
      collection: "Koleksiyon",
      wordsCompleted: "kelime tamamlandı",
      showFilters: "Filtrele & Sırala",
      hideFilters: "✕ Kapat",
      applyFilters: "Uygula",
      filterLabel: "Durum",
      sortLabel: "Sıralama",
      filterAll: "📚 Tümü",
      filterCompleted: "✅ Tamamlananlar",
      filterInProgress: "🔄 Devam Edenler",
      filterNotStarted: "▶️ Başlanmamışlar",
      sortNewest: "↓ Yeni → Eski",
      sortOldest: "↑ Eski → Yeni",
      sortMostCompleted: "★ En Çok Tamamlanan",
      collectionsFound: "koleksiyon bulundu",
      searchCollections: "Koleksiyon ara...",
      timesCompleted: "Kez Tamamlandı",
      completionHistory: "Tamamlama Geçmişi",
      close: "Kapat",
      reviewAgain: "Tekrar Başla 🔄",
      last: "Son",
      tutorialTitle: "Kelime Tekrarı",
      tutorialSubtitle: "Öğrendiğin kelimeleri pekiştir!",
      tutorialCollections: "Koleksiyonlar",
      tutorialCollectionsDesc: "Kelimeler 15'erli koleksiyonlara ayrılır. Her koleksiyonu tamamlayarak ilerle!",
      tutorialPractice: "Pratik Yap",
      tutorialPracticeDesc: "Türkçe kelimeyi gör, İngilizce karşılığını yaz. Doğru cevap verince İngilizce telaffuzu dinle!",
      tutorialProgress: "Kaldığın Yerden Devam",
      tutorialProgressDesc: "İlerleme kaydedilir. Çıkıp tekrar girdiğinde kaldığın yerden devam edersin!",
      tutorialRepeat: "Tekrar Tekrar",
      tutorialRepeatDesc: "Tamamladığın koleksiyonları istediğin kadar tekrar edebilirsin. Geçmiş kayıtların saklanır!",
      tutorialButton: "Anladım, Başlayalım! 🚀",
      completedStatus: "Tamamlandı",
      english: "İngilizce",
      turkish: "Türkçe",
      incompleteCollection: "Koleksiyon Hazırlanıyor",
      incompleteCollectionDesc: "kelime daha gerekiyor",
      needMoreWords: "kelime daha ekle",
      completeCollection: "Koleksiyonu tamamlamak için",
      locked: "Kilitli",
      unlockHint: "Önceki koleksiyonu tamamla",
      celebrationTitle: "Tebrikler! 🎉",
      celebrationDesc: "Koleksiyonu başarıyla tamamladın!",
      celebrationNextHint: "Bir sonraki koleksiyon açıldı!",
      celebrationContinue: "Devam Et",
    },
    en: {
      title: "Word Review",
      back: "Back",
      box: "Collection",
      words: "Words",
      completed: "Completed",
      inProgress: "In Progress",
      start: "Start",
      continue: "Continue",
      review: "Review",
      typeAnswer: "Type the English translation",
      typeAnswerReverse: "Type the Turkish translation",
      check: "Check",
      correct: "Correct!",
      wrong: "Wrong!",
      correctAnswer: "Correct answer",
      fillAnswer: "Fill & Check",
      next: "Next",
      boxCompleted: "Collection Completed!",
      boxCompletedDesc: "You learned all words in this collection!",
      backToBoxes: "Back to Collections",
      noWords: "No words yet",
      noWordsDesc: "Complete levels to fill your word bank.",
      pronunciation: "Pronunciation",
      listen: "Listen",
      listenAgain: "Listen Again",
      great: "Great!",
      tryAgain: "Try again",
      typeYourAnswer: "Type your answer...",
      continueButton: "Continue →",
      whereYouLeft: "Where You Left",
      collection: "Collection",
      wordsCompleted: "words completed",
      showFilters: "Filter & Sort",
      hideFilters: "✕ Close",
      applyFilters: "Apply",
      filterLabel: "Status",
      sortLabel: "Sort",
      filterAll: "📚 All",
      filterCompleted: "✅ Completed",
      filterInProgress: "🔄 In Progress",
      filterNotStarted: "▶️ Not Started",
      sortNewest: "↓ Newest → Oldest",
      sortOldest: "↑ Oldest → Newest",
      sortMostCompleted: "★ Most Completed",
      collectionsFound: "collections found",
      searchCollections: "Search collections...",
      timesCompleted: "Times Completed",
      completionHistory: "Completion History",
      close: "Close",
      reviewAgain: "Review Again 🔄",
      last: "Last",
      tutorialTitle: "Word Review",
      tutorialSubtitle: "Reinforce the words you learned!",
      tutorialCollections: "Collections",
      tutorialCollectionsDesc: "Words are divided into collections of 15. Complete each collection to progress!",
      tutorialPractice: "Practice",
      tutorialPracticeDesc: "See the Turkish word, type the English translation. Listen to the English pronunciation when you answer correctly!",
      tutorialProgress: "Continue Where You Left",
      tutorialProgressDesc: "Progress is saved. When you return, you continue where you left off!",
      tutorialRepeat: "Repeat Again",
      tutorialRepeatDesc: "You can repeat completed collections as many times as you want. Your history is saved!",
      tutorialButton: "Got it, Let's Start! 🚀",
      completedStatus: "Completed",
      english: "English",
      turkish: "Turkish",
      incompleteCollection: "Collection in Progress",
      incompleteCollectionDesc: "more words needed",
      needMoreWords: "more words to add",
      completeCollection: "To complete this collection",
      locked: "Locked",
      unlockHint: "Complete previous collection",
      celebrationTitle: "Congratulations! 🎉",
      celebrationDesc: "You completed the collection!",
      celebrationNextHint: "Next collection unlocked!",
      celebrationContinue: "Continue",
    }
  };

  const t = translations[language];

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

  const handleBoxSelect = (box) => {
    // Eğer kutu tamamlanmışsa ve geçmiş varsa modal göster
    if (box.isCompleted && box.completionHistory && box.completionHistory.length > 0) {
      setModalBoxData(box);
      setShowCompletionModal(true);
      return;
    }
    
    // Koleksiyonun hangi sayfada olduğunu bul ve o sayfaya geç
    const boxIndex = boxes.findIndex(b => b.id === box.id);
    if (boxIndex !== -1) {
      const targetPage = Math.floor(boxIndex / ITEMS_PER_PAGE) + 1;
      setCurrentPage(targetPage);
    }
    
    // Normal akış
    setSelectedBox(box);
    
    // Kaldığı yerden devam et
    const savedIndex = boxCurrentIndex[box.id] || 0;
    
    // Index geçersizse baştan başla
    if (savedIndex >= box.words.length) {
      setCurrentWordIndex(0);
    } else {
      setCurrentWordIndex(savedIndex);
    }
    
    setUserAnswer('');
    setShowResult(false);
    setShowTranslation(false);
    setShowContinueButton(false);
  };
  
  const handleStartBox = (box) => {
    setShowCompletionModal(false);
    
    // Koleksiyonun hangi sayfada olduğunu bul ve o sayfaya geç
    const boxIndex = boxes.findIndex(b => b.id === box.id);
    if (boxIndex !== -1) {
      const targetPage = Math.floor(boxIndex / ITEMS_PER_PAGE) + 1;
      setCurrentPage(targetPage);
    }
    
    setSelectedBox(box);
    
    // Tamamlanmış kutuyu tekrar oynarken de kaldığı yerden devam et
    const savedIndex = boxCurrentIndex[box.id] || 0;
    
    // Index geçersizse baştan başla
    if (savedIndex >= box.words.length) {
      setCurrentWordIndex(0);
    } else {
      setCurrentWordIndex(savedIndex);
    }
    
    setUserAnswer('');
    setShowResult(false);
    setShowTranslation(false);
    setShowContinueButton(false);
  };

  const handleCheckAnswer = () => {
    const currentBox = boxes.find(b => b.id === selectedBox.id);
    const currentWord = currentBox.words[currentWordIndex];
    const correctAnswer = englishMode ? currentWord.turkish : currentWord.english;
    const userAnswerTrimmed = userAnswer.trim().toLowerCase();
    const correctAnswerLower = correctAnswer.toLowerCase();
    
    const correct = userAnswerTrimmed === correctAnswerLower;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      // Doğru cevap sesi çal
      playSound('tekrar-doğru-sesi.mp3');
      
      // Doğru cevap - progress'e ekle
      const newProgress = { ...boxProgress };
      if (!newProgress[selectedBox.id]) {
        newProgress[selectedBox.id] = { completed: [], total: currentBox.words.length };
      }
      
      // Total değerini her zaman güncelle (yeni kelimeler eklenmiş olabilir)
      newProgress[selectedBox.id].total = currentBox.words.length;
      
      const wordKey = `${currentWord.turkish}-${currentWord.english}`;
      if (!newProgress[selectedBox.id].completed.includes(wordKey)) {
        newProgress[selectedBox.id].completed.push(wordKey);
        
        // Kutu tamamlandı mı kontrol et ve tarih kaydet
        // AMA sadece tam 15 kelimeli kutular için
        const isFullBox = currentBox.words.length === WORDS_PER_BOX;
        if (isFullBox && newProgress[selectedBox.id].completed.length === currentBox.words.length) {
          const completionDate = new Date().toISOString();
          
          // Tamamlama geçmişini kaydet (array olarak)
          if (!newProgress[selectedBox.id].completionHistory) {
            newProgress[selectedBox.id].completionHistory = [];
          }
          newProgress[selectedBox.id].completionHistory.push(completionDate);
          
          // Son tamamlama tarihini de kaydet (geriye dönük uyumluluk için)
          newProgress[selectedBox.id].completedAt = completionDate;
        }
        
        setBoxProgress(newProgress);
        localStorage.setItem('wordBoxProgress', JSON.stringify(newProgress));
      }
      
      // Doğru cevap verince çeviri kartını göster ve telaffuz
      setTimeout(() => {
        setShowTranslation(true);
        // Cevap olarak yazılan dilde telaffuz yap
        // englishMode false (Türkçe→İngilizce): İngilizce yazdın → İngilizce telaffuz
        // englishMode true (İngilizce→Türkçe): Türkçe yazdın → Türkçe telaffuz
        const textToSpeak = englishMode ? currentWord.turkish : currentWord.english;
        const langToSpeak = englishMode ? 'tr-TR' : 'en-US';
        speak(textToSpeak, langToSpeak);
        
        // 1.5 saniye sonra Devam Et butonu göster
        setTimeout(() => {
          setShowContinueButton(true);
        }, 1500);
      }, 500);
    } else {
      // Yanlış cevap - hata sesi çal
      playSound('tekrar-hata-sesi.mp3');
      
      // Input'u temizle ama doğru cevap gösterilsin
      setUserAnswer('');
    }
  };

  const handleNext = () => {
    const currentBox = boxes.find(b => b.id === selectedBox.id);
    const nextIndex = currentWordIndex + 1;
    
    // Önce tüm state'leri temizle
    setUserAnswer('');
    setShowResult(false);
    setShowTranslation(false);
    setIsCorrect(false);
    setShowContinueButton(false);
    
    if (nextIndex < currentBox.words.length) {
      // Bir sonraki kelimeye geç
      setCurrentWordIndex(nextIndex);
      
      // İlerleyi ve son çalışma zamanını kaydet
      const newBoxCurrentIndex = { ...boxCurrentIndex };
      newBoxCurrentIndex[selectedBox.id] = nextIndex;
      setBoxCurrentIndex(newBoxCurrentIndex);
      localStorage.setItem('wordBoxCurrentIndex', JSON.stringify(newBoxCurrentIndex));
      
      // Son çalışma zamanını kaydet
      const lastWorkedTimes = JSON.parse(localStorage.getItem('boxLastWorkedTimes') || '{}');
      lastWorkedTimes[selectedBox.id] = new Date().getTime();
      localStorage.setItem('boxLastWorkedTimes', JSON.stringify(lastWorkedTimes));
    } else {
      // Kutu tamamlandı mı kontrol et
      const progress = boxProgress[selectedBox.id];
      if (progress && progress.completed.length === currentBox.words.length) {
        // Kutu tamamlandı - index'i sıfırla (yeni tur için)
        const newBoxCurrentIndex = { ...boxCurrentIndex };
        newBoxCurrentIndex[selectedBox.id] = 0;
        setBoxCurrentIndex(newBoxCurrentIndex);
        localStorage.setItem('wordBoxCurrentIndex', JSON.stringify(newBoxCurrentIndex));
        
        // Progress'i sıfırla (yeni tur için)
        const newProgress = { ...boxProgress };
        newProgress[selectedBox.id].completed = [];
        setBoxProgress(newProgress);
        localStorage.setItem('wordBoxProgress', JSON.stringify(newProgress));
        
        // Kutlama modalını göster
        setCelebrationBoxNumber(currentBox.number);
        setShowCelebrationModal(true);
        playSound('tekrar-doğru-sesi.mp3');
        
        setSelectedBox(null);
      } else {
        // Yanlış yapılan kelimeler var, başa dön
        const newBoxCurrentIndex = { ...boxCurrentIndex };
        newBoxCurrentIndex[selectedBox.id] = 0;
        setBoxCurrentIndex(newBoxCurrentIndex);
        localStorage.setItem('wordBoxCurrentIndex', JSON.stringify(newBoxCurrentIndex));
        
        setCurrentWordIndex(0);
      }
    }
  };

  // Kelime yoksa
  if (allWords.length === 0) {
    return (
      <div 
        className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-[#1a1a3e] via-[#2d1b4e] to-[#1a1a3e] p-4 sm:p-8 select-none"
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
        <div className="w-full max-w-md">
          <motion.button
            onClick={() => {
              playSound('telefontıklama.mp3');
              onBackClick();
            }}
            className="mb-6 py-3 px-5 bg-white/5 backdrop-blur-md rounded-xl text-white flex items-center gap-2 shadow-xl border border-white/10 hover:bg-white/10 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.back}
          </motion.button>

          <div className="flex flex-col items-center justify-center h-64 text-center bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-white font-bold text-lg">{t.noWords}</p>
            <p className="text-white/60 text-sm mt-2">{t.noWordsDesc}</p>
          </div>
        </div>
      </div>
    );
  }

  // Kutu seçilmişse - Kelime çalışma ekranı
  if (selectedBox) {
    const currentBox = boxes.find(b => b.id === selectedBox.id);
    const currentWord = currentBox.words[currentWordIndex];
    const progress = ((currentWordIndex + 1) / currentBox.words.length) * 100;
    
    // wordProgress'i güncel total ile al
    const savedProgress = boxProgress[selectedBox.id] || { completed: [], total: currentBox.words.length };
    const wordProgress = {
      ...savedProgress,
      total: currentBox.words.length // Her zaman güncel total kullan
    };

    return (
      <div 
        className="h-screen w-full bg-gradient-to-br from-[#1a1a3e] via-[#2d1b4e] to-[#1a1a3e] flex flex-col overflow-hidden relative select-none"
        style={{
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          userSelect: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* İçerik - Üstte Sabit */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
          <div className="max-w-md w-full relative">
            {/* Kelime Kartı - Animasyonlu 3D Tasarım */}
            <motion.div
              key={currentWordIndex}
              initial={{ opacity: 0, y: 20, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-3 sm:p-6 mb-2 sm:mb-3 shadow-2xl overflow-hidden"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Kapatma Butonu - Kartın İçinde Sağ Üstte */}
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setSelectedBox(null);
                }}
                className="absolute top-2 right-2 z-20 p-2 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-lg transition-colors backdrop-blur-sm touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center shadow-lg"
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* İçerik */}
              <div className="relative z-10">
              {/* Kelime - Kompakt */}
              <div className="text-center mb-3">
                <motion.div 
                  className="text-xl sm:text-2xl mb-1.5"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {englishMode ? '🇬🇧' : '🇹🇷'}
                </motion.div>
                <motion.h2 
                  className="text-xl sm:text-2xl font-bold text-white mb-2"
                  animate={{
                    textShadow: [
                      '0 0 10px rgba(168, 85, 247, 0.5)',
                      '0 0 20px rgba(168, 85, 247, 0.8)',
                      '0 0 10px rgba(168, 85, 247, 0.5)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {englishMode ? currentWord.english : currentWord.turkish}
                </motion.h2>
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    const textToSpeak = englishMode ? currentWord.english : currentWord.turkish;
                    const lang = englishMode ? 'en-US' : 'tr-TR';
                    speak(textToSpeak, lang);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 rounded-lg text-white/90 transition-all text-xs border border-purple-400/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.svg 
                    className="w-3 h-3" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </motion.svg>
                  {t.listen}
                </motion.button>
              </div>

              {/* Input - Kompakt */}
              <div className="space-y-3">
                <div>
                  <label className="block text-white/70 text-xs sm:text-sm font-medium mb-1.5">
                    {englishMode ? t.typeAnswerReverse : t.typeAnswer}
                  </label>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && userAnswer.trim()) {
                        if (!showResult || !isCorrect) {
                          handleCheckAnswer();
                        }
                      }
                    }}
                    disabled={showResult && isCorrect}
                    className="w-full px-3 py-2.5 bg-black/30 border-2 border-white/20 rounded-xl text-white text-base sm:text-lg font-medium placeholder:text-white/40 focus:outline-none focus:border-purple-400 focus:bg-black/40 disabled:opacity-50 transition-colors"
                    placeholder={t.typeYourAnswer}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>

                {/* Sonuç - Kompakt */}
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl ${isCorrect ? 'bg-green-500/20 border border-green-400/50' : 'bg-red-500/20 border border-red-400/50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                      <span className={`text-lg font-bold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                        {isCorrect ? t.great : t.tryAgain}
                      </span>
                    </div>
                    
                    {!isCorrect && (
                      <div className="flex items-center justify-between bg-black/30 rounded-xl p-2.5 border border-white/10">
                        <div className="flex-1 mr-2">
                          <div className="text-white/60 text-[10px] mb-0.5">{t.correctAnswer}</div>
                          <div className="text-white font-bold text-sm sm:text-base">{englishMode ? currentWord.turkish : currentWord.english}</div>
                        </div>
                        <button
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            const correctAnswer = englishMode ? currentWord.turkish : currentWord.english;
                            setUserAnswer(correctAnswer);
                            
                            // Otomatik olarak doğru kabul et ve telaffuz kartını aç
                            setIsCorrect(true);
                            setShowResult(true);
                            
                            // Progress'i güncelle - kelimeyi completed listesine ekle
                            const newProgress = { ...boxProgress };
                            if (!newProgress[selectedBox.id]) {
                              newProgress[selectedBox.id] = { completed: [], total: currentBox.words.length };
                            }
                            newProgress[selectedBox.id].total = currentBox.words.length;
                            
                            const wordKey = `${currentWord.turkish}-${currentWord.english}`;
                            if (!newProgress[selectedBox.id].completed.includes(wordKey)) {
                              newProgress[selectedBox.id].completed.push(wordKey);
                              
                              // Kutu tamamlandı mı kontrol et
                              const isFullBox = currentBox.words.length === WORDS_PER_BOX;
                              if (isFullBox && newProgress[selectedBox.id].completed.length === currentBox.words.length) {
                                const completionDate = new Date().toISOString();
                                if (!newProgress[selectedBox.id].completionHistory) {
                                  newProgress[selectedBox.id].completionHistory = [];
                                }
                                newProgress[selectedBox.id].completionHistory.push(completionDate);
                                newProgress[selectedBox.id].completedAt = completionDate;
                              }
                              
                              setBoxProgress(newProgress);
                              localStorage.setItem('wordBoxProgress', JSON.stringify(newProgress));
                            }
                            
                            // Telaffuz kartını göster ve sesi çal
                            setTimeout(() => {
                              setShowTranslation(true);
                              const textToSpeak = englishMode ? currentWord.turkish : currentWord.english;
                              const langToSpeak = englishMode ? 'tr-TR' : 'en-US';
                              speak(textToSpeak, langToSpeak);
                              
                              // Devam Et butonu göster
                              setTimeout(() => {
                                setShowContinueButton(true);
                              }, 1500);
                            }, 300);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white text-xs font-bold transition-all shadow-lg whitespace-nowrap"
                        >
                          {t.fillAnswer}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* İngilizce Kartı - Kompakt */}
                <AnimatePresence>
                  {showTranslation && isCorrect && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="relative bg-gradient-to-br from-indigo-900/40 via-blue-900/40 to-indigo-900/40 backdrop-blur-xl border border-blue-400/30 rounded-xl p-3 shadow-xl overflow-hidden"
                    >
                      {/* Parıltı Efekti */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      
                      {/* İçerik */}
                      <div className="relative z-10 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1.5">
                          <motion.span
                            className="text-lg"
                            animate={{
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                          >
                            {englishMode ? '🇹🇷' : '🇬🇧'}
                          </motion.span>
                          <span className="text-blue-200 text-xs">{englishMode ? t.turkish : t.english}</span>
                        </div>
                        <motion.h3 
                          className="text-lg sm:text-xl font-bold text-white mb-2"
                          animate={{
                            textShadow: [
                              '0 0 10px rgba(96, 165, 250, 0.5)',
                              '0 0 15px rgba(96, 165, 250, 0.7)',
                              '0 0 10px rgba(96, 165, 250, 0.5)',
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          {englishMode ? currentWord.turkish : currentWord.english}
                        </motion.h3>
                        <motion.button
                          onClick={() => {
                            playSound('telefontıklama.mp3');
                            const textToSpeak = englishMode ? currentWord.turkish : currentWord.english;
                            const langToSpeak = englishMode ? 'tr-TR' : 'en-US';
                            speak(textToSpeak, langToSpeak);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 rounded-lg text-white/90 transition-all text-xs border border-blue-400/30"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                          {t.listenAgain}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Butonlar - Animasyonlu */}
                <AnimatePresence mode="wait">
                  {showResult && isCorrect && showContinueButton ? (
                    <motion.button
                      key="continue"
                      onClick={() => {
                        playSound('telefontıklama.mp3');
                        handleNext();
                      }}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }}
                      className="relative w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-base font-bold shadow-lg overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <span className="relative z-10">{t.continueButton}</span>
                    </motion.button>
                  ) : !showResult || !isCorrect ? (
                    <motion.button
                      key="check"
                      onClick={() => {
                        playSound('telefontıklama.mp3');
                        handleCheckAnswer();
                      }}
                      disabled={!userAnswer.trim()}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-base font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                      whileHover={{ scale: !userAnswer.trim() ? 1 : 1.02 }}
                      whileTap={{ scale: !userAnswer.trim() ? 1 : 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <span className="relative z-10">{t.check}</span>
                    </motion.button>
                  ) : null}
                </AnimatePresence>
              </div>
              </div>
            </motion.div>

            {/* Kompakt İstatistik - Mobil Uyumlu */}
            <motion.div 
              className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-xl p-2.5 shadow-xl border border-purple-400/30 overflow-hidden relative"
              animate={{
                boxShadow: [
                  '0 0 15px rgba(168, 85, 247, 0.2)',
                  '0 0 25px rgba(168, 85, 247, 0.3)',
                  '0 0 15px rgba(168, 85, 247, 0.2)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Arka Plan Parıltısı */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              
              {/* İçerik - Tek Satır */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                {/* Sol: Progress + Yüzde */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-white/60">📊</span>
                    <motion.span 
                      className="text-white font-bold text-sm"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      %{Math.round((wordProgress.completed.length / wordProgress.total) * 100)}
                    </motion.span>
                  </div>
                  <div className="relative h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${(wordProgress.completed.length / wordProgress.total) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
                
                {/* Sağ: Sayılar */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-md border border-green-400/30">
                    <motion.div 
                      className="w-1 h-1 rounded-full bg-green-400"
                      animate={{
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                    <span className="text-green-300 font-bold text-xs">{wordProgress.completed.length}</span>
                  </div>
                  
                  <span className="text-white/40 text-xs">/</span>
                  
                  <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-md border border-purple-400/30">
                    <span className="text-purple-300 font-bold text-xs">{wordProgress.total}</span>
                  </div>
                </div>
              </div>
            </motion.div>


          </div>
        </div>
      </div>
    );
  }

  // Ana sayfa - Kutu listesi
  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-[#1a1a3e] via-[#2d1b4e] to-[#1a1a3e] select-none"
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
      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={handleCloseTutorial}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-gray-900/95 via-indigo-950/95 to-purple-900/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full border border-purple-500/30 shadow-2xl backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Başlık */}
              <div className="text-center mb-4 sm:mb-6">
                <motion.div
                  className="text-5xl sm:text-6xl mb-3 sm:mb-4"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  📚
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">{t.tutorialTitle}</h2>
                <p className="text-purple-300 text-xs sm:text-sm">{t.tutorialSubtitle}</p>
              </div>

              {/* Açıklamalar */}
              <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6 max-h-[50vh] overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-500/30"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">📚</span>
                    <div>
                      <h3 className="text-white font-bold text-xs sm:text-sm mb-1">{t.tutorialCollections}</h3>
                      <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed">{t.tutorialCollectionsDesc}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-pink-500/30"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">✍️</span>
                    <div>
                      <h3 className="text-white font-bold text-xs sm:text-sm mb-1">{t.tutorialPractice}</h3>
                      <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed">{t.tutorialPracticeDesc}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-indigo-500/30"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">💾</span>
                    <div>
                      <h3 className="text-white font-bold text-xs sm:text-sm mb-1">{t.tutorialProgress}</h3>
                      <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed">{t.tutorialProgressDesc}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-500/30"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">🔄</span>
                    <div>
                      <h3 className="text-white font-bold text-xs sm:text-sm mb-1">{t.tutorialRepeat}</h3>
                      <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed">{t.tutorialRepeatDesc}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Buton */}
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  handleCloseTutorial();
                }}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-bold shadow-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t.tutorialButton}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kutlama Modalı */}
      <AnimatePresence>
        {showCelebrationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowCelebrationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-green-900/95 via-emerald-900/95 to-green-900/95 rounded-2xl p-6 max-w-sm w-full border border-green-400/30 shadow-2xl backdrop-blur-xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Konfeti Efekti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6'][i % 5],
                      left: `${Math.random() * 100}%`,
                      top: '-10%',
                    }}
                    animate={{
                      y: ['0vh', '120vh'],
                      x: [0, (Math.random() - 0.5) * 100],
                      rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "linear",
                    }}
                  />
                ))}
              </div>

              {/* İçerik */}
              <div className="relative z-10 text-center">
                {/* Başarı İkonu */}
                <motion.div
                  className="text-7xl mb-4"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🏆
                </motion.div>

                {/* Başlık */}
                <motion.h2
                  className="text-2xl font-bold text-white mb-2"
                  animate={{
                    textShadow: [
                      '0 0 10px rgba(74, 222, 128, 0.5)',
                      '0 0 20px rgba(74, 222, 128, 0.8)',
                      '0 0 10px rgba(74, 222, 128, 0.5)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  {t.celebrationTitle}
                </motion.h2>

                {/* Koleksiyon Numarası */}
                <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-green-400/30">
                  <p className="text-green-200 text-sm mb-1">{t.box} {celebrationBoxNumber}</p>
                  <p className="text-white font-medium">{t.celebrationDesc}</p>
                </div>

                {/* Sonraki Koleksiyon Açıldı */}
                <motion.div
                  className="flex items-center justify-center gap-2 mb-4 text-yellow-300"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                >
                  <span className="text-xl">🔓</span>
                  <span className="text-sm font-medium">{t.celebrationNextHint}</span>
                </motion.div>

                {/* Devam Et Butonu */}
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowCelebrationModal(false);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-bold shadow-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.celebrationContinue}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tamamlama Geçmişi Modal */}
      <AnimatePresence>
        {showCompletionModal && modalBoxData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-purple-900/95 rounded-2xl p-6 max-w-md w-full border border-purple-400/30 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Başlık */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📚</span>
                  <h2 className="text-xl font-bold text-white">{t.box} {modalBoxData.number}</h2>
                </div>
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowCompletionModal(false);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* İstatistik */}
              <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>
                  <span className="text-green-300 font-bold text-lg">{t.completedStatus}!</span>
                </div>
                <div className="text-white/80 text-sm">
                  {language === 'tr' 
                    ? `Bu koleksiyonu ${modalBoxData.completionHistory.length} kez tamamladınız`
                    : `You completed this collection ${modalBoxData.completionHistory.length} times`
                  }
                </div>
              </div>

              {/* Tamamlama Geçmişi */}
              <div className="mb-4">
                <h3 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                  <span>📅</span>
                  {t.completionHistory}
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {modalBoxData.completionHistory.slice().reverse().map((date, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 font-bold text-sm">#{modalBoxData.completionHistory.length - index}</span>
                          <span className="text-white/60 text-xs">•</span>
                          <span className="text-white text-sm">
                            {new Date(date).toLocaleDateString('tr-TR', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <span className="text-white/60 text-xs">
                          {new Date(date).toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3">
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setShowCompletionModal(false);
                  }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors border border-white/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.close}
                </motion.button>
                <motion.button
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    handleStartBox(modalBoxData);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-bold shadow-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* İlerleme varsa Devam Et, yoksa Tekrar Başla */}
                  {(boxCurrentIndex[modalBoxData.id] > 0 || (boxProgress[modalBoxData.id]?.completed?.length > 0 && boxProgress[modalBoxData.id]?.completed?.length < modalBoxData.total))
                    ? t.continue
                    : t.reviewAgain
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      {/* Sticky Üst Butonlar - Geri, Kelime Sayısı, Layout Toggle ve Yardım - Mobile Optimized */}
      <div className="sticky top-0 z-40 w-full bg-gradient-to-b from-[#1a1a3e] via-[#1a1a3e]/95 to-transparent pb-2 pt-3 sm:pt-4 md:pt-8 px-3 sm:px-4 md:px-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center gap-2">
            <motion.button
              onClick={() => {
                playSound('telefontıklama.mp3');
                onBackClick();
              }}
              className="p-1.5 sm:p-2 bg-white/5 backdrop-blur-md rounded-lg text-white shadow-lg border border-white/10 hover:bg-white/10 transition-all flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </motion.button>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="flex items-center justify-center min-w-[32px] sm:min-w-[36px] h-[32px] sm:h-[36px] text-purple-300 font-bold bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-xs sm:text-sm px-1.5 sm:px-2">
                {allWords.length}
              </div>
              {/* Layout Toggle Button - Compact */}
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  const newMode = layoutMode === 'grid' ? 'list' : 'grid';
                  setLayoutMode(newMode);
                  localStorage.setItem('wordReviewLayoutMode', newMode);
                }}
                className="p-1.5 sm:p-2 bg-white/5 backdrop-blur-md rounded-lg text-white shadow-lg border border-white/10 hover:bg-white/10 transition-all flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {layoutMode === 'grid' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
              </motion.button>
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setShowTutorial(true);
                }}
                className="p-1.5 sm:p-2 bg-white/5 backdrop-blur-md rounded-lg text-white shadow-lg border border-white/10 hover:bg-white/10 transition-all flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* İçerik Alanı - Başlık, Arama/Filtre ve Koleksiyonlar - Mobile Optimized */}
      <div className="w-full max-w-4xl px-3 sm:px-4 md:px-8 pb-3 sm:pb-4 md:pb-8">
        {/* 3D Neon Başlık - Ortalanmış ve Büyük - Mobile Optimized */}
        <motion.div 
          className="flex justify-center mb-4 sm:mb-6 md:mb-8 mt-2 sm:mt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative inline-block px-2">
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
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight relative">
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

        {/* Arama, Sonuç Sayısı ve Filtre Butonu - Mobile Optimized */}
        <div className="mb-3 sm:mb-4 flex items-center justify-center gap-1.5 sm:gap-2 px-1">
          {/* Sonuç Sayısı - Kompakt */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-lg border border-purple-500/20 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-white">{boxes.length}</span>
          </div>

          {/* Arama Çubuğu - Ortada */}
          <div className="flex-1 flex items-center bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-500/20 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t.searchCollections}
              className="bg-transparent w-full text-white placeholder-purple-300/50 outline-none text-xs sm:text-sm min-w-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <motion.button
                onClick={() => setSearchTerm('')}
                className="ml-1.5 sm:ml-2 text-purple-400 hover:text-white flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>
          
          {/* Filtre İkon Butonu - Compact */}
          <motion.button
            onClick={() => {
              playSound('telefontıklama.mp3');
              setShowFilters(true);
            }}
            className="p-2 sm:p-2.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-lg text-white border border-purple-500/30 hover:from-purple-600/40 hover:to-indigo-600/40 transition-all shadow-lg flex-shrink-0"
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
                    {/* Durum Filtresi */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-purple-300 mb-1.5 sm:mb-2">{t.filterLabel}</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => {
                          playSound('telefontıklama.mp3');
                          setFilterStatus(e.target.value);
                        }}
                        className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/5 backdrop-blur-md rounded-lg text-white text-xs sm:text-sm border border-white/10 hover:bg-white/10 transition-all cursor-pointer focus:outline-none focus:border-purple-400"
                      >
                        <option value="all" className="bg-gray-900">{t.filterAll}</option>
                        <option value="completed" className="bg-gray-900">{t.filterCompleted}</option>
                        <option value="inProgress" className="bg-gray-900">{t.filterInProgress}</option>
                        <option value="notStarted" className="bg-gray-900">{t.filterNotStarted}</option>
                      </select>
                    </div>

                    {/* Sıralama */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-indigo-300 mb-1.5 sm:mb-2">{t.sortLabel}</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => {
                          playSound('telefontıklama.mp3');
                          setSortOrder(e.target.value);
                        }}
                        className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/5 backdrop-blur-md rounded-lg text-white text-xs sm:text-sm border border-white/10 hover:bg-white/10 transition-all cursor-pointer focus:outline-none focus:border-purple-400"
                      >
                        <option value="newest" className="bg-gray-900">{t.sortNewest}</option>
                        <option value="oldest" className="bg-gray-900">{t.sortOldest}</option>
                        <option value="mostCompleted" className="bg-gray-900">{t.sortMostCompleted}</option>
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

        {/* Devam Eden Koleksiyon - Öne Çıkan - Mobile Optimized */}
        {inProgressBox && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 bg-gradient-to-r from-yellow-900/40 via-orange-900/40 to-yellow-900/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-yellow-400/50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="text-xl sm:text-2xl flex-shrink-0">⭐</span>
                <span className="text-yellow-300 font-bold text-xs sm:text-sm truncate">{t.whereYouLeft}</span>
              </div>
              <span className="text-yellow-400 text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0">{t.collection} {inProgressBox.number}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-white text-xs sm:text-sm flex-shrink-0">
                {inProgressBox.completed}/{inProgressBox.total} {t.wordsCompleted}
              </div>
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  handleBoxSelect(inProgressBox);
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg text-white text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t.continueButton}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Kutu Grid - Animasyonlu Leaderboard Tarzı - Mobile Optimized */}
        <div className={layoutMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4' : 'flex flex-col gap-3 sm:gap-4'}>
          {paginatedBoxes.map((box, index) => (
            <motion.div
              key={box.id}
              ref={box.id === firstIncompleteBox?.id ? firstIncompleteBoxRef : null}
              initial={{ opacity: 0, y: 20, rotateY: layoutMode === 'grid' ? -15 : 0 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              onClick={() => {
                if (box.isLocked) {
                  playSound('tekrar-hata-sesi.mp3');
                  return;
                }
                playSound('telefontıklama.mp3');
                handleBoxSelect(box);
              }}
              className={`relative backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden ${
                layoutMode === 'grid' ? 'p-6' : 'p-4'
              } ${
                box.isLocked 
                  ? 'bg-gradient-to-br from-gray-900/50 via-gray-800/50 to-gray-900/50 border-gray-600/30 cursor-not-allowed opacity-60' 
                  : 'bg-gradient-to-br from-purple-900/30 via-indigo-900/30 to-purple-900/30 border-purple-400/20 cursor-pointer'
              }`}
              whileHover={box.isLocked ? {} : { 
                scale: layoutMode === 'grid' ? 1.05 : 1.02, 
                y: layoutMode === 'grid' ? -8 : -4,
                borderColor: "rgba(168, 85, 247, 0.5)",
                boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)",
              }}
              whileTap={box.isLocked ? {} : { scale: 0.98 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* İçerik */}
              <div className={`relative z-10 ${layoutMode === 'list' ? 'flex items-center gap-4' : ''}`}>
              {/* Koleksiyon Başlığı - Animasyonlu - Mobile Optimized */}
              <div className={`flex items-center ${layoutMode === 'grid' ? 'justify-between mb-3 sm:mb-4' : 'gap-2 sm:gap-3 flex-shrink-0'}`}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <motion.span 
                    className="text-2xl sm:text-3xl flex-shrink-0"
                    animate={{
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.2,
                    }}
                  >
                    📚
                  </motion.span>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">{t.box} {box.number}</h3>
                </div>
                {box.isLocked ? (
                  <motion.span 
                    className="text-2xl"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    🔒
                  </motion.span>
                ) : box.isCompleted && (
                  <motion.span 
                    className="text-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    ✅
                  </motion.span>
                )}
              </div>

              {/* İlerleme - Animasyonlu - Mobile Optimized */}
              <div className={layoutMode === 'grid' ? 'mb-3 sm:mb-4' : 'flex-1 flex flex-col justify-center'}>
                {layoutMode === 'grid' ? (
                  <>
                    <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                      <span className="text-white/80 font-medium">{box.completed}/{box.total} {t.words}</span>
                      <motion.span 
                        className="text-purple-300 font-bold"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {Math.round((box.completed / box.total) * 100)}%
                      </motion.span>
                    </div>
                    <div className="relative w-full h-2.5 sm:h-3 bg-black/30 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className={`h-full ${box.isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(box.completed / box.total) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: "easeOut" }}
                      />
                      {/* Parlayan Efekt */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                      delay: index * 0.5,
                    }}
                  />
                </div>
                  </>
                ) : (
                  /* List Mode - Compact Progress */
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/80 font-medium text-xs sm:text-sm whitespace-nowrap">{box.completed}/{box.total} {t.words}</span>
                      <motion.span 
                        className="text-purple-300 font-bold text-sm sm:text-base"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {Math.round((box.completed / box.total) * 100)}%
                      </motion.span>
                    </div>
                    <div className="relative w-full h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className={`h-full ${box.isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(box.completed / box.total) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                          delay: index * 0.5,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Durum - Animasyonlu */}
              <div className={layoutMode === 'grid' ? 'text-center' : 'flex items-center justify-center flex-shrink-0'}>
                {box.isCompleted ? (
                  <div className={layoutMode === 'grid' ? 'space-y-2' : 'flex flex-col items-center gap-1'}>
                    <motion.span 
                      className={`inline-block text-green-300 font-bold bg-green-500/20 rounded-lg border border-green-400/30 whitespace-nowrap ${
                        layoutMode === 'grid' ? 'text-sm px-4 py-2' : 'text-xs px-2 py-1'
                      }`}
                      animate={{
                        boxShadow: [
                          '0 0 10px rgba(74, 222, 128, 0.3)',
                          '0 0 20px rgba(74, 222, 128, 0.5)',
                          '0 0 10px rgba(74, 222, 128, 0.3)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      ✅ {layoutMode === 'grid' ? `${box.completionHistory.length} ${t.timesCompleted}` : box.completionHistory.length}
                    </motion.span>
                    {layoutMode === 'grid' && box.completedAt && (
                      <div className="text-xs text-white/50">
                        {t.last}: {new Date(box.completedAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })} • {new Date(box.completedAt).toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                ) : box.completed > 0 ? (
                  <motion.span 
                    className={`inline-block text-yellow-300 font-bold bg-yellow-500/20 rounded-lg border border-yellow-400/30 whitespace-nowrap ${
                      layoutMode === 'grid' ? 'text-sm px-4 py-2' : 'text-xs px-2 py-1'
                    }`}
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(250, 204, 21, 0.3)',
                        '0 0 20px rgba(250, 204, 21, 0.5)',
                        '0 0 10px rgba(250, 204, 21, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    🔄 {layoutMode === 'grid' ? t.inProgress : ''}
                  </motion.span>
                ) : box.isLocked ? (
                  <div className={layoutMode === 'grid' ? 'space-y-1' : 'flex flex-col items-center'}>
                    <motion.span 
                      className={`inline-block text-gray-400 font-bold bg-gray-500/20 rounded-lg border border-gray-500/30 whitespace-nowrap ${
                        layoutMode === 'grid' ? 'text-sm px-4 py-2' : 'text-xs px-2 py-1'
                      }`}
                    >
                      🔒 {layoutMode === 'grid' ? t.locked : ''}
                    </motion.span>
                    {layoutMode === 'grid' && <p className="text-gray-500 text-xs">{t.unlockHint}</p>}
                  </div>
                ) : (
                  <motion.span 
                    className="inline-block text-purple-300 text-sm font-bold bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-400/30"
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(168, 85, 247, 0.3)',
                        '0 0 20px rgba(168, 85, 247, 0.5)',
                        '0 0 10px rgba(168, 85, 247, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    ▶️ {t.start}
                  </motion.span>
                )}
              </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tamamlanmamış Koleksiyon Uyarısı - Sadece Son Sayfada */}
        {incompleteBox && currentPage === totalPages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 relative bg-gradient-to-br from-blue-900/50 via-indigo-900/50 to-purple-900/50 backdrop-blur-xl rounded-2xl p-5 border border-blue-400/30 shadow-2xl overflow-hidden"
          >
            {/* İçerik */}
            <div className="relative z-10">
              {/* Başlık */}
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-xl border border-blue-400/40"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className="text-2xl">📦</span>
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-base sm:text-lg">
                    {t.box} {incompleteBox.number}
                  </h3>
                  <p className="text-blue-300 text-xs sm:text-sm">{t.incompleteCollection}</p>
                </div>
              </div>

              {/* Progress Bilgisi */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 mb-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-blue-400"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                    <span className="text-white font-bold text-lg">{incompleteWordsCount}</span>
                    <span className="text-white/60 text-sm">/ 15 {t.words}</span>
                  </div>
                  <motion.span 
                    className="text-blue-300 font-bold text-lg"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    {Math.round((incompleteWordsCount / 15) * 100)}%
                  </motion.span>
                </div>
                
                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(incompleteWordsCount / 15) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  {/* Parlayan Efekt */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>

              {/* Kalan Kelime Bilgisi */}
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg p-3 border border-blue-400/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">🎯</span>
                  <span className="text-white font-bold text-base">
                    {15 - incompleteWordsCount} {t.needMoreWords}
                  </span>
                </div>
                <p className="text-center text-blue-200 text-xs">
                  {t.completeCollection}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <motion.button
              onClick={() => {
                playSound('telefontıklama.mp3');
                setCurrentPage(prev => Math.max(1, prev - 1));
              }}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white/5 backdrop-blur-md rounded-lg text-white text-sm border border-white/10 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
              whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
            >
              ←
            </motion.button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <motion.button
                  key={pageNum}
                  onClick={() => {
                    playSound('telefontıklama.mp3');
                    setCurrentPage(pageNum);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                    currentPage === pageNum
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400'
                      : 'bg-white/5 backdrop-blur-md text-white border-white/10 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {pageNum}
                </motion.button>
              );
            })}

            <motion.button
              onClick={() => {
                playSound('telefontıklama.mp3');
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white/5 backdrop-blur-md rounded-lg text-white text-sm border border-white/10 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
              whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
            >
              →
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordReview;
