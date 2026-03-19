// Grafik kalitesi ayarlarını yöneten utility

export const getGraphicsQuality = () => {
  return localStorage.getItem('graphicsQuality') || 'high';
};

export const getAnimationConfig = () => {
  const quality = getGraphicsQuality();
  
  return {
    // Animasyon süreleri
    duration: {
      high: 0.5,
      medium: 0.3,
      low: 0
    }[quality],
    
    // Uzun animasyon süreleri (confetti, elmas yağmuru vs)
    longDuration: {
      high: 2.5,
      medium: 1.5,
      low: 0
    }[quality],
    
    // Parçacık sayıları
    particles: {
      high: 50,
      medium: 20,
      low: 0
    }[quality],
    
    // Confetti sayısı
    confettiCount: {
      high: 100,
      medium: 40,
      low: 0
    }[quality],
    
    // Arka plan animasyonları aktif mi?
    backgroundAnimations: quality === 'high',
    
    // Parıltı efektleri aktif mi?
    glowEffects: quality !== 'low',
    
    // Karmaşık animasyonlar aktif mi?
    complexAnimations: quality === 'high',
    
    // Animasyon aktif mi? (low'da kapalı)
    shouldAnimate: quality !== 'low',
    
    // Kalite seviyesi
    quality: quality
  };
};

// Framer Motion için transition config
export const getTransitionConfig = (type = 'default') => {
  const config = getAnimationConfig();
  
  if (!config.shouldAnimate) {
    return { duration: 0 };
  }
  
  const configs = {
    default: {
      duration: config.duration,
      ease: 'easeInOut'
    },
    spring: {
      type: 'spring',
      stiffness: config.quality === 'high' ? 300 : 200,
      damping: config.quality === 'high' ? 24 : 20
    },
    slow: {
      duration: config.longDuration,
      ease: 'easeInOut'
    }
  };
  
  return configs[type] || configs.default;
};
