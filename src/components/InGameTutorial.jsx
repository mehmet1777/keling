import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Typewriter efekti için component - Hızlı ve sessiz
const TypewriterText = ({ text, delay = 0, speed = 15, className = "", onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Başlangıç gecikmesi
    const startTimeout = setTimeout(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
          
          // Sadece bazı harflerde çok hafif ses (her 3 harfte bir)
          if (currentIndex % 3 === 0) {
            const audio = new Audio();
            audio.volume = 0.02; // Çok daha düşük ses
            // Daha yumuşak bir tıklama sesi
            audio.src = 'data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU4AAAA=';
            audio.play().catch(() => {}); // Ses çalmazsa hata vermesin
          }
        }, speed);
        return () => clearTimeout(timeout);
      } else if (onComplete) {
        onComplete();
      }
    }, delay);
    
    return () => clearTimeout(startTimeout);
  }, [currentIndex, text, delay, speed, onComplete]);

  return <span className={className}>{displayedText}<span className="animate-pulse">|</span></span>;
};

const InGameTutorial = ({ levelId, onDismiss, onHighlightButton, language = 'tr' }) => {
  const tutorials = {
    1: {
      tr: {
        title: "Hoş Geldin!",
        desc: "Harfleri parmağınla birleştirerek kelimeleri bul. Şimdi 'EK' kelimesini yap!",
        visual: "swipe",
        highlightButton: "letters"
      },
      en: {
        title: "Welcome!",
        desc: "Connect letters with your finger to find words. Now make the word 'EK'!",
        visual: "swipe",
        highlightButton: "letters"
      }
    },
    2: {
      tr: {
        title: "İpucu Jokeri",
        desc: "Takıldığında rastgele bir kelimenin bir harfini açar",
        cost: "5",
        visual: "hint",
        highlightButton: "hint"
      },
      en: {
        title: "Hint Joker",
        desc: "Reveals one letter of a random word when stuck",
        cost: "5",
        visual: "hint",
        highlightButton: "hint"
      }
    },
    3: {
      tr: {
        title: "Peri Jokeri",
        desc: "Tüm kelimelerin tüm harflerini açar! En güçlü joker",
        cost: "15",
        visual: "fairy",
        highlightButton: "fairy"
      },
      en: {
        title: "Fairy Joker",
        desc: "Reveals all letters of all words! Most powerful joker",
        cost: "15",
        visual: "fairy",
        highlightButton: "fairy"
      }
    },
    4: {
      tr: {
        title: "Karıştır",
        desc: "Harfleri karıştırarak farklı açıdan bak",
        cost: "Ücretsiz",
        visual: "shuffle",
        highlightButton: "shuffle"
      },
      en: {
        title: "Shuffle",
        desc: "Shuffle letters for a new perspective",
        cost: "Free",
        visual: "shuffle",
        highlightButton: "shuffle"
      }
    },
    5: {
      tr: {
        title: "Zor Mod",
        desc: "Butona tıkla, bir zorluk seviyesi seç ve Tamam'a bas. Daha fazla harf eklenir ama daha fazla elmas kazanırsın!",
        visual: "hard",
        highlightButton: "hard"
      },
      en: {
        title: "Hard Mode",
        desc: "Tap the button, select a difficulty level and press OK. More letters added but you earn more diamonds!",
        visual: "hard",
        highlightButton: "hard"
      }
    },
    6: {
      tr: {
        title: "Zor Modu Kapat",
        desc: "Zor mod aktifken butona tıkla ve 'Zor Modu Kapat' seçeneğini kullan. Normal moda dönebilirsin!",
        visual: "hardOff",
        highlightButton: "hard"
      },
      en: {
        title: "Disable Hard Mode",
        desc: "When hard mode is active, tap the button and use 'Disable Hard Mode' option. You can return to normal mode!",
        visual: "hardOff",
        highlightButton: "hard"
      }
    },
    7: {
      tr: {
        title: "Ses Ayarları",
        desc: "Bu butonla müzik ve efekt seslerini açıp kapatabilirsin. Sessiz oynamak istersen buradan ayarla!",
        visual: "sound",
        highlightButton: "sound"
      },
      en: {
        title: "Sound Settings",
        desc: "Use this button to toggle music and sound effects on/off. Adjust here if you want to play silently!",
        visual: "sound",
        highlightButton: "sound"
      }
    }
  };

  const tutorial = tutorials[levelId];
  if (!tutorial) return null;

  const content = tutorial[language];

  // Görsel animasyonlar
  const renderVisual = () => {
    switch(content.visual) {
      case 'swipe':
        return (
          <div className="relative w-28 h-28 mx-auto mb-4">
            {/* Daire */}
            <div className="absolute inset-0 rounded-full border-4 border-purple-400/50" />
            {/* Harfler */}
            {['K', 'E', 'D', 'İ'].map((letter, i) => {
              const angle = (i * 90 - 45) * (Math.PI / 180);
              const x = 50 + 30 * Math.cos(angle);
              const y = 50 + 30 * Math.sin(angle);
              return (
                <motion.div
                  key={letter}
                  className="absolute w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  animate={i < 3 ? { scale: [1, 1.3, 1], backgroundColor: ['#8B5CF6', '#EC4899', '#8B5CF6'] } : {}}
                  transition={{ delay: i * 0.3, duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
                >
                  {letter}
                </motion.div>
              );
            })}
            {/* Parmak animasyonu */}
            <motion.div
              className="absolute text-2xl"
              initial={{ left: '25%', top: '25%' }}
              animate={{ 
                left: ['25%', '50%', '75%'],
                top: ['25%', '75%', '25%']
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              👆
            </motion.div>
          </div>
        );
      
      case 'hint':
        return (
          <div className="flex flex-col items-center mb-4">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-2"
              animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 0 rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.6)', '0 0 0 rgba(99,102,241,0)'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {/* Güneş/Işık ikonu */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2"/>
                <line x1="12" y1="4" x2="12" y2="2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="22" x2="12" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4" y1="12" x2="2" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="22" y1="12" x2="20" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.div>
            <span className="text-white/60 text-xs">İpucu Butonu</span>
          </div>
        );
      
      case 'fairy':
        return (
          <div className="flex flex-col items-center mb-4">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mb-2"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-3xl">🧚</span>
            </motion.div>
            <span className="text-white/60 text-xs">Peri Jokeri</span>
          </div>
        );
      
      case 'shuffle':
        return (
          <div className="flex flex-col items-center mb-4">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-2"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-3xl">🔄</span>
            </motion.div>
            <span className="text-white/60 text-xs">Karıştır Butonu</span>
          </div>
        );
      
      case 'hard':
        return (
          <div className="flex flex-col items-center mb-4">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mb-2"
              animate={{ 
                scale: [1, 1.15, 1],
                boxShadow: ['0 0 0 rgba(220,38,38,0)', '0 0 25px rgba(220,38,38,0.8)', '0 0 0 rgba(220,38,38,0)']
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-3xl">🔥</span>
            </motion.div>
            <span className="text-white/60 text-xs">Zor Mod</span>
          </div>
        );
      
      case 'hardOff':
        return (
          <div className="flex flex-col items-center mb-4">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center mb-2 relative"
              animate={{ 
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-3xl">🔥</span>
              {/* Çarpı işareti */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="w-12 h-1 bg-red-500 rotate-45 absolute rounded-full" />
                <div className="w-12 h-1 bg-red-500 -rotate-45 absolute rounded-full" />
              </motion.div>
            </motion.div>
            <span className="text-white/60 text-xs">Zor Modu Kapat</span>
          </div>
        );
      
      case 'sound':
        return (
          <div className="flex flex-col items-center mb-4">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-2"
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: ['0 0 0 rgba(99,102,241,0)', '0 0 25px rgba(99,102,241,0.8)', '0 0 0 rgba(99,102,241,0)']
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.24 5.76C19.9509 7.47097 20.9067 9.76022 20.9067 12.145C20.9067 14.5298 19.9509 16.819 18.24 18.53" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </motion.div>
            <span className="text-white/60 text-xs">{language === 'tr' ? 'Ses Ayarları' : 'Sound Settings'}</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        {/* Arka plan */}
        <div className="absolute inset-0 bg-black/85" />
        
        {/* Kart - Yeni Modern Tasarım */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[340px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ana Kart Container */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-1 shadow-2xl">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[22px] p-6">
              
              {/* Üst Kısım - Karakter ve Badge */}
              <div className="flex items-start justify-between mb-4">
                {/* Büyük Karakter - Sol tarafta */}
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -5, 0],
                      rotate: [0, -3, 3, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    {/* Parlama efekti */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity
                      }}
                      className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-2xl"
                    />
                    
                    {/* Karakter */}
                    <div className="relative text-7xl filter drop-shadow-2xl">
                      🎓
                    </div>
                    
                    {/* Yıldız efekti */}
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute -top-2 -right-2 text-2xl"
                    >
                      ✨
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Badge - Sağ üstte */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-full shadow-lg"
                >
                  <span className="text-white text-xs font-bold">{levelId}/7</span>
                </motion.div>
              </div>

              {/* Başlık - Typewriter efekti */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white text-2xl font-bold mb-3 leading-tight min-h-[2.5rem]"
              >
                <TypewriterText 
                  text={content.title} 
                  delay={100}
                  speed={1}
                />
              </motion.h2>
              
              {/* Açıklama - Typewriter efekti - Ultra hızlı ve renkli */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent text-base mb-4 leading-relaxed min-h-[4rem] font-medium"
              >
                <TypewriterText 
                  text={content.desc} 
                  delay={30 + (content.title.length * 1)}
                  speed={0.3}
                />
              </motion.p>

              {/* Görsel - Kompakt */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-4"
              >
                {renderVisual()}
              </motion.div>
          
              {/* Maliyet */}
              {content.cost && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-2 mb-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl py-3 border border-yellow-500/30"
                >
                  <span className="text-2xl">💎</span>
                  <span className="text-white font-bold text-lg">{content.cost}</span>
                </motion.div>
              )}
              
              {/* Buton - Daha büyük ve etkileyici */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={() => {
                  // Eğer highlight edilecek buton varsa, callback'i çağır
                  if (content.highlightButton && onHighlightButton) {
                    onHighlightButton(content.highlightButton);
                  }
                  onDismiss();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white font-bold rounded-2xl text-base shadow-lg relative overflow-hidden"
              >
                {/* Parlama animasyonu */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
                <span className="relative">
                  {content.highlightButton 
                    ? (language === 'tr' ? '✨ Dene!' : '✨ Try it!') 
                    : (language === 'tr' ? '👍 Anladım!' : '👍 Got it!')}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InGameTutorial;
