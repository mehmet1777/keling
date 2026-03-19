/**
 * Platform detection utilities for optimizing performance
 */

// Detect if running in Capacitor (native app)
export const isCapacitor = () => {
  return window.Capacitor !== undefined;
};

// Detect if running on Android
export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent) || isCapacitor();
};

// Detect if running on iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Check if device is low-end (for performance optimization)
export const isLowEndDevice = () => {
  // Check if running in Capacitor on Android (typically lower performance than desktop)
  if (isCapacitor() && isAndroid()) {
    return true;
  }
  
  // Check hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return true;
  }
  
  // Check device memory (if available)
  if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
    return true;
  }
  
  return false;
};

// Get optimized animation config based on platform
export const getAnimationConfig = () => {
  if (isLowEndDevice()) {
    return {
      // Reduced animations for low-end devices
      duration: 0.2,
      ease: 'linear',
      enableAnimations: false, // Disable complex animations
      reducedMotion: true
    };
  }
  
  return {
    // Full animations for high-end devices
    duration: 0.3,
    ease: 'easeInOut',
    enableAnimations: true,
    reducedMotion: false
  };
};

// Get optimized scroll config
export const getScrollConfig = () => {
  if (isLowEndDevice()) {
    return {
      smooth: false, // Disable smooth scroll on low-end devices
      behavior: 'auto'
    };
  }
  
  return {
    smooth: true,
    behavior: 'smooth'
  };
};
