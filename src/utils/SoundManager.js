// Ses yu00f6netimi iu00e7in merkezi modu00fcl

// Ses seviyesi ayarlaru0131nu0131 localStorage'dan alma
const getMusicVolume = () => {
  const saved = localStorage.getItem('musicVolume');
  return saved ? parseFloat(saved) : 0.5; // Varsayu0131lan deu011fer: 0.5
};

const getEffectsVolume = () => {
  const saved = localStorage.getItem('effectsVolume');
  return saved ? parseFloat(saved) : 0.7; // Varsayu0131lan deu011fer: 0.7
};

// iOS tespit fonksiyonu
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Arka plan mu00fczik kontrolu00fc
let backgroundMusic = null;
let hardModeMusic = null;
let isHardModeActive = false;

// Ses efekti u00f6nbelleu011fi
const soundCache = {};

// Arka plan mu00fczik yu00f6netimi
const playBackgroundMusic = () => {
  try {
    if (!backgroundMusic) {
      backgroundMusic = new Audio('/sounds/oyunmuzik.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.id = 'backgroundMusic';
    }
    
    // Mu00fczik ses seviyesini ayarla (her seferinde localStorage'dan oku)
    const currentVolume = getMusicVolume();
    backgroundMusic.volume = currentVolume;
    
    // Eğer volume 0 ise müziği başlatma
    if (currentVolume === 0) {
      console.log('Music volume is 0, not playing');
      return;
    }
    
    // Mu00fczik u00e7al
    const playPromise = backgroundMusic.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Arka plan mu00fczik hatasu0131:', error);
        // Kullancu0131 etkileu015fimi ile mu00fczik u00e7alma (tarayu0131cu0131 politikasu0131 gerekliliu011fi)
        const startMusic = () => {
          backgroundMusic.play().catch(e => console.error('Mu00fczik u00e7alma hatasu0131:', e));
          document.removeEventListener('click', startMusic);
        };
        document.addEventListener('click', startMusic);
      });
    }
  } catch (error) {
    console.error('Mu00fczik u00e7alma hatasu0131:', error);
  }
};

const pauseBackgroundMusic = () => {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
  if (hardModeMusic) {
    hardModeMusic.pause();
    hardModeMusic.currentTime = 0;
  }
};

// Zor mod müziğini başlat
const playHardModeMusic = () => {
  try {
    // Normal müziği durdur
    if (backgroundMusic && !backgroundMusic.paused) {
      backgroundMusic.pause();
    }
    
    // Zor mod müziğini oluştur veya kullan
    if (!hardModeMusic) {
      hardModeMusic = new Audio('/sounds/zormodmusic.mp3');
      hardModeMusic.loop = true;
      hardModeMusic.id = 'hardModeMusic';
    }
    
    const currentVolume = getMusicVolume();
    hardModeMusic.volume = currentVolume;
    
    if (currentVolume === 0) {
      console.log('Music volume is 0, not playing hard mode music');
      return;
    }
    
    isHardModeActive = true;
    
    const playPromise = hardModeMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Zor mod müzik hatası:', error);
        const startMusic = () => {
          hardModeMusic.play().catch(e => console.error('Zor mod müzik çalma hatası:', e));
          document.removeEventListener('click', startMusic);
        };
        document.addEventListener('click', startMusic);
      });
    }
  } catch (error) {
    console.error('Zor mod müzik çalma hatası:', error);
  }
};

// Normal müziğe geri dön
const stopHardModeMusic = () => {
  try {
    // Zor mod müziğini durdur
    if (hardModeMusic && !hardModeMusic.paused) {
      hardModeMusic.pause();
      hardModeMusic.currentTime = 0;
    }
    
    isHardModeActive = false;
    
    // Normal müziği başlat
    if (backgroundMusic) {
      const currentVolume = getMusicVolume();
      backgroundMusic.volume = currentVolume;
      
      if (currentVolume > 0) {
        backgroundMusic.play().catch(e => console.error('Normal müzik çalma hatası:', e));
      }
    }
  } catch (error) {
    console.error('Normal müziğe dönüş hatası:', error);
  }
};

const updateBackgroundMusicVolume = () => {
  const newVolume = getMusicVolume();
  
  // Zor mod aktifse zor mod müziğinin sesini ayarla
  if (isHardModeActive && hardModeMusic) {
    hardModeMusic.volume = newVolume;
    
    if (newVolume > 0 && hardModeMusic.paused) {
      hardModeMusic.play().catch(e => console.log('Hard mode play error:', e));
    } else if (newVolume === 0 && !hardModeMusic.paused) {
      hardModeMusic.pause();
    }
  }
  // Normal mod aktifse normal müziğin sesini ayarla
  else if (backgroundMusic) {
    backgroundMusic.volume = newVolume;
    
    if (newVolume > 0 && backgroundMusic.paused) {
      backgroundMusic.play().catch(e => console.log('Play error:', e));
    } else if (newVolume === 0 && !backgroundMusic.paused) {
      backgroundMusic.pause();
    }
  }
};

// Ses efekti u00e7alma fonksiyonu
const playSound = (soundName, customVolume = null) => {
  try {
    // Ses adu0131ndan .mp3 uzantu0131su0131nu0131 kaldur
    if (soundName.endsWith('.mp3')) {
      soundName = soundName.substring(0, soundName.length - 4);
    }
    
    // Özel ses dosyaları için kontrol
    if (soundName === 'peri jekori') {
      soundName = 'perijokeri';
    }
    
    // Efekt ses seviyesini al (her seferinde localStorage'dan oku - mobil uyumluluk için)
    const effectsVolume = customVolume !== null ? customVolume : getEffectsVolume();
    
    // Eğer volume 0 ise, sesi hiç çalma
    if (effectsVolume === 0) {
      console.log('Effects volume is 0, not playing sound');
      return;
    }
    
    // iOS için: Her seferinde yeni Audio nesnesi oluştur (cache kullanma)
    // iOS Safari cache'lenmiş audio nesnelerinin volume değişikliklerini görmezden gelebilir
    let audio;
    if (isIOS()) {
      // iOS: Her seferinde yeni nesne
      audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = effectsVolume;
    } else {
      // Diğer platformlar: Cache kullan
      if (soundCache[soundName]) {
        audio = soundCache[soundName];
        audio.currentTime = 0;
        audio.volume = effectsVolume;
      } else {
        audio = new Audio(`/sounds/${soundName}.mp3`);
        audio.volume = effectsVolume;
        soundCache[soundName] = audio;
      }
    }
    
    // Sesi u00e7al
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error(`${soundName} sesi u00e7alma hatasu0131:`, err);
        // Kullancu0131 etkileu015fimi gerekiyorsa, bir sonraki tu0131klamada u00e7al
        const playSoundOnce = () => {
          audio.volume = effectsVolume;
          audio.play().catch(e => console.error(`${soundName} sesi u00e7alma hatasu0131:`, e));
          document.removeEventListener('click', playSoundOnce);
        };
        document.addEventListener('click', playSoundOnce, { once: true });
      });
    }
  } catch (error) {
    console.error(`${soundName} sesi yu00fckleme hatasu0131:`, error);
  }
};

// Belirli ses efektlerini çalan yöntemler
const playLevelSound = () => playSound('level');
const playHintSound = () => playSound('ipucu');
const playFairyJokerSound = () => playSound('perijokeri');
const playClickSound = () => playSound('click');
const playHomeButtonSound = () => playSound('telefontıklama');
const playShuffleSound = () => playSound('karistir');

export {
  playSound,
  playBackgroundMusic,
  pauseBackgroundMusic,
  updateBackgroundMusicVolume,
  getMusicVolume,
  getEffectsVolume,
  playLevelSound,
  playHintSound,
  playFairyJokerSound,
  playClickSound,
  playHomeButtonSound,
  playShuffleSound,
  playHardModeMusic,
  stopHardModeMusic
};
