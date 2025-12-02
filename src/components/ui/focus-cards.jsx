import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const COLORS = {
  text: '#F3F4F6',
  highlight: '#818CF8',
  success: '#34D399',
  card: '#1A1D23', 
};

const Card = React.memo(({
  level,
  index,
  isUnlocked,
  isCompleted,
  bestTime,
  lastTime,
  formatTime,
  hovered,
  setHovered,
  onClick
}) => (
  <motion.div
    onMouseEnter={() => setHovered(index)}
    onMouseLeave={() => setHovered(null)}
    onClick={() => isUnlocked && onClick()}
    className={cn(
      "rounded-xl relative overflow-hidden h-48 sm:h-52 md:h-60 w-full transition-all duration-300 ease-out cursor-pointer",
      "bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur-sm",
      "border-2 border-white/10",
      !isUnlocked && "opacity-50 cursor-not-allowed",
      hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
    )}
    whileHover={isUnlocked ? { scale: 1.02 } : {}}
    style={{
      width: '100%',
      maxWidth: '100%'
    }}
  >
    {/* Background gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
    
    {/* Content */}
    <div className="relative h-full flex flex-col items-center justify-center p-4 sm:p-6">
      {isCompleted ? (
        <div className="relative">
          <motion.div
            className="absolute -inset-4 opacity-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0.3, 0.6, 0.3],
              rotate: 360
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: "loop"
            }}
            style={{
              background: 'radial-gradient(circle, rgba(52, 211, 153, 0.8) 0%, rgba(52, 211, 153, 0) 70%)',
              borderRadius: '50%'
            }}
          />
          <motion.span 
            className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 sm:mb-4 text-green-400"
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1, 
              rotate: [0, 15, 0, -15, 0],
              y: [0, -5, 0]
            }}
            transition={{ 
              scale: { duration: 0.5, ease: "backOut" },
              rotate: { duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "loop" },
              y: { duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1 }
            }}
            whileHover={{ 
              scale: 1.3,
              rotate: 360,
              transition: { duration: 0.5, ease: "easeOut" }
            }}
          >
            🌟
          </motion.span>
        </div>
      ) : !isUnlocked ? (
        <div className="relative">
          <motion.div
            className="absolute -inset-4 opacity-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0.3, 0.6, 0.3],
              rotate: 360
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: "loop"
            }}
            style={{
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.8) 0%, rgba(234, 179, 8, 0) 70%)',
              borderRadius: '50%'
            }}
          />
          <motion.span 
            className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 sm:mb-4 text-yellow-500"
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1, 
              y: [0, -5, 0],
              rotateY: [0, 180, 360]
            }}
            transition={{ 
              scale: { duration: 0.5, ease: "backOut" },
              y: { duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
              rotateY: { duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }
            }}
            whileHover={{ 
              scale: 1.3,
              rotateY: 180,
              transition: { duration: 0.5 }
            }}
          >
            🔒
          </motion.span>
        </div>
      ) : (
        <motion.span 
          className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 sm:mb-4 text-white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            textShadow: [
              "0 0 5px rgba(255,255,255,0.1)",
              "0 0 15px rgba(255,255,255,0.3)",
              "0 0 5px rgba(255,255,255,0.1)"
            ]
          }}
          transition={{ 
            duration: 0.8, 
            ease: "backOut",
            textShadow: { duration: 2, repeat: Infinity, repeatType: "loop" }
          }}
          whileHover={{ 
            scale: 1.2,
            textShadow: "0 0 15px rgba(255,255,255,0.5)",
            transition: { duration: 0.3 }
          }}
        >
          {level}
        </motion.span>
      )}
      <motion.h3 
        className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Bölüm {level}
      </motion.h3>
    </div>

    {/* Hover overlay */}
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent flex items-end py-6 sm:py-8 px-4 sm:px-6 transition-opacity duration-300",
        hovered === index ? "opacity-100" : "opacity-0"
      )}
    />
  </motion.div>
));

Card.displayName = "Card";

// Constants for virtualization
const ITEMS_PER_PAGE = 24; 
const CARD_HEIGHT = 240; 

const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  goToPage, 
  goToFirstPage, 
  goToPreviousPage, 
  goToNextPage, 
  goToLastPage,
  handlePageInputChange
}) => {
  const [inputValue, setInputValue] = React.useState(currentPage.toString());

  React.useEffect(() => {
    setInputValue(currentPage.toString());
  }, [currentPage]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    handlePageInputChange(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageInputChange(inputValue);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          className={cn(
            "px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
            currentPage === 1
              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600/80 hover:bg-indigo-500 text-white"
          )}
        >
          İlk
        </button>
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={cn(
            "px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
            currentPage === 1
              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600/80 hover:bg-indigo-500 text-white"
          )}
        >
          Önceki
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm text-gray-300">
          Sayfa
        </span>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-12 sm:w-16 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-center text-white text-xs sm:text-sm"
        />
        <span className="text-xs sm:text-sm text-gray-300">
          / {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={cn(
            "px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
            currentPage === totalPages
              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600/80 hover:bg-indigo-500 text-white"
          )}
        >
          Sonraki
        </button>
        <button
          onClick={goToLastPage}
          disabled={currentPage === totalPages}
          className={cn(
            "px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
            currentPage === totalPages
              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600/80 hover:bg-indigo-500 text-white"
          )}
        >
          Son
        </button>
      </div>
    </div>
  );
};

export function FocusCards({ 
  levels, 
  unlockedLevels, 
  completedLevels, 
  bestTimes, 
  lastTimes,
  formatTime, 
  onLevelSelect 
}) {
  const containerRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [visibleLevels, setVisibleLevels] = React.useState([]);
  // Otomatik sayfa geu00e7iu015fi iu00e7in bir bayrak ekleyelim
  const [autoPageChangeEnabled, setAutoPageChangeEnabled] = React.useState(true);
  // Son bu00f6lu00fcm tamamlama durumunu izlemek iu00e7in bir ref
  const lastCompletedLevelRef = React.useRef(0);

  const totalPages = Math.ceil(levels.length / ITEMS_PER_PAGE);

  React.useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, levels.length);
    setVisibleLevels(levels.slice(startIndex, endIndex));
    
    // Scroll to top when page changes
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Sayfa manuel olarak deu011fiu015ftirilirse, otomatik geu00e7iu015fi devre du0131u015fu0131 bu0131rak
    setAutoPageChangeEnabled(false);
  }, [currentPage, levels]);

  // Bu00f6lu00fcm tamamlandu0131u011fu0131nda otomatik sayfa geu00e7iu015fi iu00e7in useEffect
  React.useEffect(() => {
    // En son tamamlanan bu00f6lu00fcm numarasu0131nu0131 bul
    if (completedLevels.size === 0) return;
    
    const lastCompletedLevel = Math.max(...Array.from(completedLevels).map(Number));
    
    // Eu011fer yeni bir bu00f6lu00fcm tamamlandu0131ysa ve bu bir sayfa sonuysa
    if (lastCompletedLevel > lastCompletedLevelRef.current && 
        lastCompletedLevel % ITEMS_PER_PAGE === 0) {
      
      // Hedef sayfayu0131 hesapla
      const targetPage = Math.ceil(lastCompletedLevel / ITEMS_PER_PAGE) + 1;
      
      // Eu011fer hedef sayfa geu00e7erli bir sayfaysa
      if (targetPage <= totalPages) {
        // Otomatik geu00e7iu015fi etkinleu015ftir
        setAutoPageChangeEnabled(true);
        
        // Ku0131sa bir gecikme ekleyerek kullanu0131cu0131nu0131n tamamlama ekranu0131nu0131 gu00f6rmesini sau011fla
        const timer = setTimeout(() => {
          // Sadece otomatik geu00e7iu015f etkinse sayfa deu011fiu015fimi yap
          if (autoPageChangeEnabled) {
            setCurrentPage(targetPage);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
    
    // Son tamamlanan bu00f6lu00fcmu00fc gu00fcncelle
    lastCompletedLevelRef.current = lastCompletedLevel;
  }, [completedLevels, totalPages, autoPageChangeEnabled]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      // Kullanu0131cu0131 manuel olarak sayfa deu011fiu015ftirdiyu011finde otomatik geu00e7iu015fi devre du0131u015fu0131 bu0131rak
      setAutoPageChangeEnabled(false);
      setCurrentPage(page);
    }
  };

  const handlePageInputChange = (value) => {
    const newPage = parseInt(value);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      // Kullanu0131cu0131 manuel olarak sayfa deu011fiu015ftirdiyu011finde otomatik geu00e7iu015fi devre du0131u015fu0131 bu0131rak
      setAutoPageChangeEnabled(false);
      setCurrentPage(newPage);
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {visibleLevels.map((level) => {
          const isUnlocked = level.id <= unlockedLevels;
          const isCompleted = completedLevels.has(level.id);
          const bestTime = bestTimes[level.id];
          const lastTime = lastTimes[level.id];
          
          return (
            <Card
              key={level.id}
              level={level.id}
              index={level.id}
              isUnlocked={isUnlocked}
              isCompleted={isCompleted}
              bestTime={bestTime}
              lastTime={lastTime}
              formatTime={formatTime}
              hovered={hovered}
              setHovered={setHovered}
              onClick={() => onLevelSelect(level)}
            />
          );
        })}
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          goToPage={handlePageChange}
          goToFirstPage={() => handlePageChange(1)}
          goToPreviousPage={() => handlePageChange(currentPage - 1)}
          goToNextPage={() => handlePageChange(currentPage + 1)}
          goToLastPage={() => handlePageChange(totalPages)}
          handlePageInputChange={handlePageInputChange}
        />
      )}
    </div>
  );
}
