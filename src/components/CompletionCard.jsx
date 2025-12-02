import React from 'react';
import { motion } from 'framer-motion';

const CompletionCard = ({ level, onClose, onNext }) => {
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative max-w-md w-full overflow-hidden"
      >
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl rounded-3xl" />
        
        {/* Content Container */}
        <div className="relative p-8 rounded-3xl border border-white/10">
          {/* Success Icon with Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.2
            }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center"
          >
            <span className="text-4xl">🎉</span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Tebrikler!
            </h2>
            <p className="text-indigo-200 text-lg">
              Bölüm {level.id} tamamlandı
            </p>
          </motion.div>

          {/* Words List */}
          <div className="space-y-3 mb-8">
            {level.words.map((word, index) => (
              <motion.div
                key={word.turkish}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.5 }}
                className="group flex justify-between items-center p-4 rounded-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex flex-col gap-2 text-center">
                  <div className="text-2xl font-bold uppercase tracking-wider">
                    {word.turkish}
                  </div>
                  <div className="text-lg text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-2">
                    {word.english}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(word.english);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                      title="Telaffuzu dinle"
                    >
                      🔊
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-8 py-3 rounded-xl text-white font-medium transition-all duration-300"
              style={{
                background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              }}
            >
              Ana Sayfa
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNext}
              className="px-8 py-3 rounded-xl text-white font-medium transition-all duration-300"
              style={{
                background: 'linear-gradient(to right, rgb(99, 102, 241), rgb(168, 85, 247))',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
              }}
            >
              Devam Et
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CompletionCard;
