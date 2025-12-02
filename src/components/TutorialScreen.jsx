import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Character = () => (
  <motion.div
    className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl"
    animate={{
      y: [0, -10, 0],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    🧑‍🎓
  </motion.div>
);

const TutorialScreen = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  
  const tutorialSteps = [
    {
      title: "Hoş Geldin!",
      description: "Ben senin İngilizce öğrenme arkadaşın olacağım! Türkiye'yi birlikte gezerek kelimeler öğreneceğiz.",
    },
    {
      title: "Nasıl Oynanır?",
      description: "Her bölümde birbirine bağlı harflerden kelimeler bulacaksın. Harfleri sürükleyerek kelimeleri seç!",
    },
    {
      title: "Yolculuk Başlıyor!",
      description: "Edirne'den başlayıp Van'a kadar uzanan bir macera bizi bekliyor. Her şehirde yeni kelimeler öğreneceğiz!",
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        {/* Türkiye Haritası Arka Plan */}
        <div className="relative bg-white bg-opacity-10 rounded-xl p-8 backdrop-blur-sm">
          <div className="absolute inset-0 opacity-20">
            {/* Buraya Türkiye haritası SVG'si eklenecek */}
          </div>

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="text-center text-white"
              >
                <Character />
                <h2 className="text-3xl font-bold mt-4 mb-2">
                  {tutorialSteps[step].title}
                </h2>
                <p className="text-xl mb-8">
                  {tutorialSteps[step].description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                className={`text-white px-6 py-2 rounded-full ${
                  step === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:bg-opacity-20'
                }`}
                disabled={step === 0}
              >
                ← Geri
              </button>
              
              {step < tutorialSteps.length - 1 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-yellow-300"
                >
                  İlerle →
                </button>
              ) : (
                <button
                  onClick={onComplete}
                  className="bg-green-500 text-white px-8 py-3 rounded-full font-bold hover:bg-green-400"
                >
                  Oyuna Başla! 🎮
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialScreen;
