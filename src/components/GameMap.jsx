import React from 'react';
import { motion } from 'framer-motion';

const GameMap = ({ currentLevel, levels, onLevelComplete }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-white mb-12">
        Kelime Macerası
      </h1>

      {/* Level Göstergesi */}
      <div className="relative w-full max-w-2xl">
        {/* Level Yolu */}
        <div className="absolute top-1/2 left-0 w-full h-4 bg-white/10 rounded-full -translate-y-1/2" />
        
        {/* Tamamlanan Yol */}
        <motion.div
          className="absolute top-1/2 left-0 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full -translate-y-1/2"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentLevel / (levels.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Level Noktaları */}
        {levels.map((level, index) => {
          const isCompleted = index < currentLevel;
          const isCurrent = index === currentLevel;

          return (
            <motion.div
              key={level.id}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${(index / (levels.length - 1)) * 100}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.button
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  font-bold text-lg transform transition-all
                  ${isCompleted ? 'bg-green-400 text-white' :
                    isCurrent ? 'bg-yellow-400 text-gray-800' :
                    'bg-white/20 text-white/50'}
                `}
                whileHover={isCurrent ? { scale: 1.1 } : {}}
                whileTap={isCurrent ? { scale: 0.95 } : {}}
                onClick={() => isCurrent && onLevelComplete()}
              >
                {index + 1}
              </motion.button>

              {/* Level İsmi */}
              <div className={`
                absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                text-sm font-medium
                ${isCompleted ? 'text-green-400' :
                  isCurrent ? 'text-yellow-400' :
                  'text-white/50'}
              `}>
                {level.name}
              </div>

              {/* Animasyonlu Efekt */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-yellow-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.5, 0.2]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Mevcut Seviye Bilgisi */}
      <motion.div
        className="mt-24 px-8 py-4 bg-white/10 backdrop-blur rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          Seviye {currentLevel + 1}: {levels[currentLevel].name}
        </h2>
        <p className="text-white/80">
          Bu seviyede öğrenilecek kelimeler:
        </p>
        <div className="mt-2 flex gap-4">
          {levels[currentLevel].words.map((word, index) => (
            <motion.div
              key={word.turkish}
              className="px-4 py-2 bg-white/10 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <span className="text-yellow-400">{word.turkish}</span>
              <span className="text-white/50 mx-2">→</span>
              <span className="text-blue-400">{word.english}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default GameMap;
