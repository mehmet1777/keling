// Text-to-Speech Service - Web ve Android için
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

// Platform kontrolü
const isNative = Capacitor.isNativePlatform();

// Cloudflare R2 base URL
const R2_BASE_URL = 'https://pub-3f4d5f2b56eb455b86aa02a3a3155795.r2.dev';

// Ses dosyası yolu oluştur - Cloudflare R2'den
const getAudioPath = (relativePath) => {
  // URL encode - Türkçe karakterler ve boşluklar için
  const encodedPath = encodeURIComponent(relativePath).replace(/%2F/g, '/');
  return `${R2_BASE_URL}/${encodedPath}`;
};

// Ses ayarları
let voiceGender = localStorage.getItem('voiceGender') || 'female';

// Aktif audio elementi (durdurma için)
let currentAudio = null;

export const setVoiceGender = (gender) => {
  voiceGender = gender;
  localStorage.setItem('voiceGender', gender);
};

export const getVoiceGender = () => voiceGender;

// Metni normalize et - büyük harfli kelimeleri düzelt
const normalizeText = (text, lang) => {
  if (lang === 'tr-TR') {
    // Türkçe için: Büyük harfli kelimeleri tamamen küçük harfe çevir
    // SPA -> spa, OTEL -> otel gibi
    return text.replace(/\b([A-ZÇĞİÖŞÜ]{2,})\b/g, (match) => {
      return match.toLowerCase();
    });
  }
  return text;
};

// MP3 dosyası çal (erkek sesi için)
const playMaleAudio = async (audioPath) => {
  return new Promise((resolve, reject) => {
    // Önceki sesi durdur
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    
    const audio = new Audio(audioPath);
    currentAudio = audio;
    
    audio.onended = () => {
      currentAudio = null;
      resolve();
    };
    
    audio.onerror = (e) => {
      console.warn('MP3 yüklenemedi:', audioPath, e);
      currentAudio = null;
      reject(e);
    };
    
    audio.play().catch(reject);
  });
};

// Kelime için MP3 yolu oluştur (Türkçe kelime adı ile)
const getWordAudioPath = (turkishWord, lang) => {
  const prefix = lang === 'tr-TR' ? 'TR' : 'EN';
  // Kadın klasörleri "Kelime", Erkek klasörleri "Kelimeler"
  const folder = lang === 'tr-TR' 
    ? (voiceGender === 'male' ? 'Türkçe Erkek Kelimeler' : 'Türkçe Kadın Kelime')
    : (voiceGender === 'male' ? 'İngilizce Erkek Kelimeler' : 'İngilizce Kadın Kelime');
  const fileName = `${prefix}-${turkishWord.toLowerCase()}.mp3`;
  return getAudioPath(`${folder}/${fileName}`);
};

// Cümle için MP3 yolu oluştur (İngilizce kelime key ile)
const getSentenceAudioPath = (englishKey, lang) => {
  const prefix = lang === 'tr-TR' ? 'TR' : 'EN';
  const genderFolder = voiceGender === 'male' ? 'Erkek' : 'Kadın';
  const folder = lang === 'tr-TR' 
    ? `Türkçe ${genderFolder} Cümleler` 
    : `İngilizce ${genderFolder} Cümleler`;
  const fileName = `${prefix}-${englishKey.toLowerCase()}_example.mp3`;
  return getAudioPath(`${folder}/${fileName}`);
};

// Kelime telaffuzu (MP3 desteği - erkek ve kadın)
// turkishWord: Türkçe kelime (MP3 dosya adı için)
// textToSpeak: Telaffuz edilecek metin (TTS fallback için)
// lang: Dil kodu ('tr-TR' veya 'en-US')
export const speakWord = async (turkishWord, textToSpeak, lang = 'en-US') => {
  if (!turkishWord && !textToSpeak) return;
  
  // MP3 çalmayı dene (hem erkek hem kadın için)
  if (turkishWord) {
    try {
      const audioPath = getWordAudioPath(turkishWord, lang);
      console.log('🔊 MP3 yolu:', audioPath);
      await playMaleAudio(audioPath);
      return;
    } catch (error) {
      console.error('❌ MP3 hatası:', error);
      console.warn('MP3 bulunamadı, TTS kullanılıyor:', turkishWord);
      // MP3 yoksa TTS'e fallback
    }
  }
  
  // MP3 yoksa TTS kullan
  await speak(textToSpeak || turkishWord, lang);
};

// Cümle telaffuzu (MP3 desteği - erkek ve kadın)
// englishKey: İngilizce kelime key (MP3 dosya adı için)
// sentenceText: Cümle metni (TTS fallback için)
// lang: Dil kodu ('tr-TR' veya 'en-US')
export const speakSentence = async (englishKey, sentenceText, lang = 'en-US') => {
  if (!englishKey && !sentenceText) return;
  
  // MP3 çalmayı dene (hem erkek hem kadın için)
  if (englishKey) {
    try {
      const audioPath = getSentenceAudioPath(englishKey, lang);
      await playMaleAudio(audioPath);
      return;
    } catch (error) {
      console.warn('Cümle MP3 bulunamadı, TTS kullanılıyor:', englishKey);
      // MP3 yoksa TTS'e fallback
    }
  }
  
  // MP3 yoksa TTS kullan
  if (sentenceText) {
    await speak(sentenceText, lang);
  }
};

// Ana speak fonksiyonu
export const speak = async (text, lang = 'en-US') => {
  if (!text) return;
  
  // Metni normalize et
  const normalizedText = normalizeText(text, lang);
  
  try {
    if (isNative) {
      // Native platform (Android/iOS) - Capacitor TTS kullan
      await TextToSpeech.speak({
        text: normalizedText,
        lang: lang,
        rate: 1.0, // Normal hız
        pitch: voiceGender === 'male' ? 0.8 : 1.0, // Erkek için daha doğal pitch
        volume: 1.0,
        category: 'playback'
      });
    } else {
      // Web platform - Web Speech API kullan
      if (!window.speechSynthesis) {
        console.warn('Speech Synthesis API not available');
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.lang = lang;
      utterance.rate = 1.0; // Normal hız
      
      // Ses seçimi
      const voices = window.speechSynthesis.getVoices();
      
      if (lang === 'tr-TR') {
        // Türkçe sesler
        const turkishVoices = voices.filter(v => v.lang.startsWith('tr'));
        let turkishVoice;
        
        if (voiceGender === 'male') {
          // Erkek Türkçe sesi ara - önce gerçek erkek seslerini dene
          turkishVoice = turkishVoices.find(v => 
            v.name.includes('Tolga') || 
            v.name.includes('Cem') ||
            v.name.includes('Ahmet') ||
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('erkek')
          ) || turkishVoices[turkishVoices.length > 1 ? 1 : 0]; // İkinci sesi dene
          utterance.pitch = 0.85; // Daha doğal erkek sesi
        } else {
          // Kadın Türkçe sesi ara
          turkishVoice = turkishVoices.find(v => 
            v.name.includes('Filiz') || 
            v.name.includes('Selin') ||
            v.name.includes('Emel') ||
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('kadın')
          ) || turkishVoices[0]; // İlk sesi kullan
          utterance.pitch = 1.0; // Normal kadın sesi
        }
        
        if (turkishVoice) utterance.voice = turkishVoice;
      } else {
        // İngilizce sesler
        let englishVoice;
        
        if (voiceGender === 'male') {
          // Erkek İngilizce sesi ara - Microsoft David öncelikli
          englishVoice = voices.find(v => 
            v.lang.startsWith('en') && v.name.includes('David')
          ) || voices.find(v => 
            v.lang.startsWith('en') && (
              v.name.includes('Male') ||
              v.name.includes('Mark') ||
              v.name.includes('Daniel') ||
              v.name.includes('James') ||
              v.name.includes('George')
            )
          ) || voices.find(v => v.lang.startsWith('en'));
          utterance.pitch = 0.85; // Daha doğal erkek sesi
        } else {
          // Kadın İngilizce sesi ara
          englishVoice = voices.find(v => 
            v.lang.startsWith('en') && (
              v.name.includes('Samantha') ||
              v.name.includes('Female') ||
              v.name.includes('Victoria') ||
              v.name.includes('Karen') ||
              v.name.includes('Zira')
            )
          ) || voices.find(v => v.lang.startsWith('en'));
          utterance.pitch = 1.0; // Normal kadın sesi
        }
        
        if (englishVoice) utterance.voice = englishVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    console.error('TTS Error:', error);
  }
};

// Türkçe telaffuz
export const speakTurkish = (text) => speak(text, 'tr-TR');

// İngilizce telaffuz
export const speakEnglish = (text) => speak(text, 'en-US');

// TTS'i durdur
export const stopSpeaking = async () => {
  try {
    // MP3 çalıyorsa durdur
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    
    if (isNative) {
      await TextToSpeech.stop();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (error) {
    console.error('Stop TTS Error:', error);
  }
};

// TTS kullanılabilir mi kontrol et
export const isTTSAvailable = async () => {
  if (isNative) {
    return true; // Native'de her zaman kullanılabilir
  }
  return !!window.speechSynthesis;
};

// Mevcut sesleri listele (debug için)
export const listAvailableVoices = async () => {
  if (isNative) {
    try {
      const voices = await TextToSpeech.getSupportedVoices();
      console.log('Available Native Voices:', voices);
      return voices;
    } catch (error) {
      console.error('Error listing voices:', error);
      return [];
    }
  } else {
    const voices = window.speechSynthesis.getVoices();
    console.log('Available Web Voices:', voices.map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default
    })));
    return voices;
  }
};

// Demo ses çal (ayarlar için)
// Uygulama diline göre sadece o dilde demo sesi çalar
export const playDemoVoice = async (gender) => {
  setVoiceGender(gender);
  
  // Uygulama dilini al
  const appLanguage = localStorage.getItem('language') || 'tr';
  
  // Cinsiyet için dosya adı prefix'i
  const genderPrefix = gender === 'male' ? 'Erkek' : 'Kadın';
  
  // Dile göre demo MP3 yolu
  const langPrefix = appLanguage === 'tr' ? 'TR' : 'EN';
  const demoPath = getAudioPath(`Telaffuz Demo Sesleri/${langPrefix}-${genderPrefix}_telaffuz_ayar_sesi.mp3`);
  
  try {
    await playMaleAudio(demoPath);
  } catch (error) {
    console.warn('Demo MP3 bulunamadı, TTS kullanılıyor');
    // MP3 yoksa TTS kullan
    if (appLanguage === 'tr') {
      await speak('Selam! Keling ile dil öğrenmeye hazır mısın?', 'tr-TR');
    } else {
      await speak('Hello! Are you ready to learn languages with Keling?', 'en-US');
    }
  }
};
