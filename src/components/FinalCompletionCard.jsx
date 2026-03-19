import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const FinalCompletionCard = ({ onClose, onRestart, onClaimReward }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const FINAL_REWARD = 78000; // Final ödülü

  const finalTexts = [
    "🎊 İNANILMAZ! 🎊",
    "2600 bölümün tamamını bitirdin!",
    "Bu muhteşem bir başarı...",
    "Binlerce kelime öğrendin,",
    "Sayısız bulmaca çözdün,",
    "Ve hiç pes etmedin!",
    "Sen gerçek bir şampiyonsun! 🏆",
    "Tebrikler, bu yolculuk harikaydı!",
    "Ama her son, yeni bir başlangıçtır... ✨"
  ];

  useEffect(() => {
    if (currentTextIndex < finalTexts.length - 1) {
      const timer = setTimeout(() => {
        setCurrentTextIndex(prev => prev + 1);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      // Son metin gösterildikten sonra butonları göster
      const timer = setTimeout(() => {
        setShowButtons(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTextIndex]);

  // Konfeti parçacıkları
  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360
  }));

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Konfeti Animasyonu */}
      {showConfetti && confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute pointer-events-none"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 50,
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}

      {/* Ana İçerik */}
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative max-w-md w-full overflow-hidden"
      >
        {/* Arka Plan */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/30 via-purple-600/20 to-pink-600/30 rounded-3xl" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl rounded-3xl" />
        
        {/* Parlayan Kenar */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(45deg, #FFD700, #FF6B6B, #4ECDC4, #FFD700)',
            backgroundSize: '300% 300%',
            padding: '2px',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="w-full h-full bg-slate-900/95 rounded-3xl" />
        </motion.div>

        {/* İçerik */}
        <div className="relative p-8 rounded-3xl">
          {/* Kupa Animasyonu */}
          <motion.div
            className="text-center mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          >
            <motion.div
              className="text-8xl mb-4"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🏆
            </motion.div>
          </motion.div>

          {/* Metin Animasyonu */}
          <div className="text-center min-h-[120px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTextIndex}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className={`font-bold text-white ${
                  currentTextIndex === 0 ? 'text-3xl' : 
                  currentTextIndex === finalTexts.length - 1 ? 'text-xl text-yellow-300' :
                  'text-2xl'
                }`}
                style={{
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                }}
                >
                  {finalTexts[currentTextIndex]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Yıldızlar */}
          <div className="flex justify-center gap-2 my-6">
            {[...Array(5)].map((_, i) => (
              <motion.span
                key={i}
                className="text-3xl"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.2 }}
              >
                ⭐
              </motion.span>
            ))}
          </div>

          {/* Ödül ve Butonlar */}
          <AnimatePresence>
            {showButtons && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-4 mt-6"
              >
                {/* Ödül Kutusu */}
                {!rewardClaimed ? (
                  <motion.div
                    className="bg-gradient-to-r from-yellow-900/40 to-amber-900/40 rounded-xl p-4 border border-yellow-500/30"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                  >
                    <p className="text-yellow-300 text-center text-sm mb-2">
                      🎁 Final Ödülün Hazır!
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <motion.span 
                        className="text-4xl font-bold text-yellow-400"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {FINAL_REWARD.toLocaleString()}
                      </motion.span>
                      <span className="text-3xl">💎</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setRewardClaimed(true);
                        if (onClaimReward) onClaimReward(FINAL_REWARD);
                      }}
                      className="w-full px-6 py-3 rounded-xl text-white font-bold text-lg"
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      🎉 Ödülü Al
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-4 border border-green-500/30"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                  >
                    <p className="text-green-300 text-center text-lg font-bold mb-2">
                      ✅ {FINAL_REWARD.toLocaleString()} 💎 Kazandın!
                    </p>
                    <p className="text-green-200/80 text-center text-xs">
                      Bu elmaslarla oyunu tekrar başlattığında zorlandığın 1300 bölümü hızlıca geçebilirsin!
                    </p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRestart}
                  className="w-full px-8 py-4 rounded-xl text-white font-bold text-lg transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
                  }}
                >
                  🔄 Baştan Başla
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-full px-8 py-3 rounded-xl text-white font-medium transition-all duration-300"
                  style={{
                    background: 'linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  Ana Sayfa
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default FinalCompletionCard;
