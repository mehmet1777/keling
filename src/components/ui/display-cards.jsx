import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const COLORS = {
  text: '#F3F4F6',
  highlight: '#818CF8',
  success: '#34D399',
};

const DisplayCard = ({ 
  className,
  level,
  isCompleted,
  bestTime,
  isUnlocked,
  formatTime,
  onClick
}) => {
  return (
    <motion.div
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 bg-muted/70 backdrop-blur-sm px-6 py-4 transition-all duration-700",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-background after:to-transparent after:content-['']",
        "hover:border-white/20 hover:bg-muted",
        !isUnlocked && "opacity-50 cursor-not-allowed",
        isUnlocked && "cursor-pointer",
        className
      )}
      onClick={isUnlocked ? onClick : undefined}
      whileHover={isUnlocked ? { scale: 1.02 } : {}}
    >
      <div className="flex items-center gap-3">
        <span 
          className="relative inline-block rounded-full bg-blue-800/30 p-2"
          style={{ color: isCompleted ? COLORS.success : COLORS.highlight }}
        >
          {isCompleted ? "✓" : level}
        </span>
        <p className="text-2xl font-bold text-white">Bölüm {level}</p>
      </div>
      
      {isCompleted && bestTime && (
        <div className="flex items-center gap-2">
          <span className="text-white/80">⏰</span>
          <p className="text-lg font-mono text-white/80">{formatTime(bestTime)}</p>
        </div>
      )}
    </motion.div>
  );
};

const DisplayCards = ({ levels, unlockedLevels, completedLevels, bestTimes, formatTime, onLevelSelect }) => {
  const cardVariants = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
    },
  ];

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {levels.map((level, index) => {
        const isUnlocked = index < unlockedLevels;
        const isCompleted = completedLevels.has(level.id);
        const bestTime = bestTimes[level.id];
        const variant = cardVariants[index % cardVariants.length];

        return (
          <DisplayCard
            key={level.id}
            level={level.id}
            isCompleted={isCompleted}
            isUnlocked={isUnlocked}
            bestTime={bestTime}
            formatTime={formatTime}
            onClick={() => onLevelSelect(level)}
            className={variant.className}
          />
        );
      })}
    </div>
  );
};

export default DisplayCards;
