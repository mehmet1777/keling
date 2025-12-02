// Neon efektli animasyon kodu
{revealedLetters[word.turkish] && revealedLetters[word.turkish].includes(letterIndex) && (
  <>
    {/* Neon glow effect */}
    <motion.div 
      className="absolute inset-0 rounded-lg"
      style={{
        boxShadow: `0 0 15px ${COLORS.highlight}`,
        zIndex: 1
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.7, 0.3] }}
      transition={{ 
        duration: 1.5, 
        delay: letterIndex * 0.08,
        ease: "easeOut"
      }}
    />
    
    {/* Letter */}
    <motion.span
      className="absolute inset-0 flex items-center justify-center text-lg font-bold uppercase"
      style={{
        color: COLORS.highlight,
        textShadow: `0 0 10px ${COLORS.highlight}, 0 0 20px ${COLORS.highlight}`,
        zIndex: 10
      }}
      initial={{ 
        opacity: 0, 
        scale: 1.5,
        filter: 'blur(5px)'
      }}
      animate={{
        opacity: [0, 1],
        scale: [1.5, 1],
        filter: ['blur(5px)', 'blur(0px)'],
      }}
      transition={{
        duration: 0.5,
        delay: letterIndex * 0.08,
        ease: "easeOut"
      }}
    >
      {word.turkish[letterIndex]}
    </motion.span>
  </>
)}
