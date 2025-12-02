import { motion } from 'framer-motion';
import React from 'react';

const GameCharacter = ({ position, isMoving }) => {
  return (
    <motion.div
      className="absolute z-50 w-20 h-20"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
      animate={{
        rotate: isMoving ? 360 : 0,
        scale: isMoving ? [1, 1.1, 1] : 1,
      }}
      transition={{
        duration: isMoving ? 1 : 0.6,
        repeat: isMoving ? Infinity : 0,
        ease: "linear"
      }}
    >
      {/* Uzay Gemisi SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
      >
        {/* Gemi Gölgesi */}
        <motion.ellipse
          cx="50"
          cy="85"
          rx="20"
          ry="5"
          fill="rgba(255,255,255,0.1)"
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Ana Gövde */}
        <motion.g
          animate={{
            y: isMoving ? [-2, 2, -2] : 0
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Gemi Gövdesi */}
          <path
            d="M20,50 C20,35 40,25 50,25 C60,25 80,35 80,50 C80,65 60,75 50,75 C40,75 20,65 20,50"
            fill="#60A5FA"
            stroke="#2563EB"
            strokeWidth="2"
          />

          {/* Kokpit */}
          <circle
            cx="50"
            cy="45"
            r="15"
            fill="#BFDBFE"
            stroke="#2563EB"
            strokeWidth="2"
          />

          {/* Motor Işıkları */}
          <motion.g
            animate={{
              scale: isMoving ? [1, 1.2, 1] : 1,
              opacity: isMoving ? [0.5, 1, 0.5] : 0.7,
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
            }}
          >
            <circle cx="30" cy="50" r="5" fill="#FCD34D" />
            <circle cx="70" cy="50" r="5" fill="#FCD34D" />
          </motion.g>

          {/* Işık Efektleri */}
          <motion.g
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <circle cx="50" cy="45" r="8" fill="#93C5FD" opacity="0.5" />
            <path
              d="M35,60 Q50,70 65,60"
              stroke="#93C5FD"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
          </motion.g>
        </motion.g>

        {/* İtici Efekti */}
        {isMoving && (
          <motion.g>
            <motion.path
              d="M25,55 L15,50 L25,45"
              stroke="#FCD34D"
              strokeWidth="2"
              fill="none"
              animate={{ opacity: [0, 1, 0], x: [-5, 0, -5] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            <motion.path
              d="M75,55 L85,50 L75,45"
              stroke="#FCD34D"
              strokeWidth="2"
              fill="none"
              animate={{ opacity: [0, 1, 0], x: [5, 0, 5] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          </motion.g>
        )}
      </svg>
    </motion.div>
  );
};

export default GameCharacter;
