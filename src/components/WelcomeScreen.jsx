import React from 'react';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            Kelimelerle İngilizce
          </h1>
          <p className="text-xl text-white mb-8 opacity-90">
            Eğlenceli bir şekilde İngilizce öğrenmeye hazır mısın?
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.button
            onClick={onStart}
            className="bg-yellow-400 text-gray-900 px-12 py-4 rounded-full text-xl font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Maceraya Başla! 🚀
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
