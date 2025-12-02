      <AnimatePresence>
        {showFairyAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Peri ku0131zu0131 animasyonu */}
              <motion.div
                className="relative"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Peri ku0131zu0131 resmi */}
                <div className="w-40 h-40 flex items-center justify-center">
                  <img 
                    src="/assets/fairy.png" 
                    alt="Peri Ku0131zu0131" 
                    className="w-32 h-32 object-contain z-10 relative"
                  />
                </div>
                
                {/* Parlayan u0131u015fu0131k efekti */}
                <motion.div 
                  className="absolute inset-0 rounded-full" 
                  style={{ 
                    background: 'radial-gradient(circle, rgba(255,158,249,0.7) 0%, rgba(255,158,249,0) 70%)',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0
                  }}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 0.9, 0.6] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut" 
                  }}
                />
              </motion.div>

              {/* Harfleri gu00f6ster - Sadece Tu00fcrku00e7e kelimeler */}
              <div className="absolute top-0 left-full ml-6 bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg shadow-lg">
                <h3 className="text-white font-bold mb-2 text-center">Bu00fctu00fcn Harfler</h3>
                <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                  {level.words.map((word, wordIndex) => (
                    <div key={`fairy-word-${wordIndex}`} className="mb-3 w-full">
                      <div className="flex gap-1 justify-center">
                        {word.turkish.split('').map((letter, letterIndex) => (
                          <motion.div 
                            key={`fairy-letter-${wordIndex}-${letterIndex}`}
                            className="w-10 h-10 bg-white/40 rounded-md flex items-center justify-center text-white font-bold shadow-lg"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1,
                              boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 15px rgba(255,255,255,0.9)', '0 0 0px rgba(255,255,255,0)']
                            }}
                            transition={{ 
                              delay: 0.3 + (wordIndex * 0.1) + (letterIndex * 0.05),
                              duration: 0.5,
                              boxShadow: {
                                repeat: 2,
                                duration: 1
                              }
                            }}
                          >
                            {letter.toUpperCase()}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
