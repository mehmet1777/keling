import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Kullanıcı verilerini Firebase'den çek
export const fetchUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return null;
  }
};

// Kullanıcı verilerini Firebase'e kaydet
export const saveUserData = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Veri kaydetme hatası:', error);
    return false;
  }
};

// Belirli alanları güncelle
export const updateUserField = async (userId, field, value) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [field]: value,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Alan güncelleme hatası:', error);
    return false;
  }
};

// localStorage'dan tüm oyun verilerini al
export const getLocalGameData = () => {
  return {
    diamonds: parseFloat(localStorage.getItem('diamonds') || '0'),
    unlockedLevels: parseInt(localStorage.getItem('unlockedLevels') || '1'),
    completedLevels: JSON.parse(localStorage.getItem('completedLevels') || '[]'),
    bestTimes: JSON.parse(localStorage.getItem('bestTimes') || '{}'),
    lastTimes: JSON.parse(localStorage.getItem('lastTimes') || '{}'),
    lastPlayedLevel: JSON.parse(localStorage.getItem('lastPlayedLevel') || 'null'),
    userProfile: JSON.parse(localStorage.getItem('userProfile') || '{"name":"","avatarIndex":0,"selectedFrame":"none"}'),
    wordBoxProgress: JSON.parse(localStorage.getItem('wordBoxProgress') || '{}'),
    claimedAchievements: JSON.parse(localStorage.getItem('claimedAchievements') || '[]'),
    claimedDailyRepeats: JSON.parse(localStorage.getItem('claimedDailyRepeats') || '[]'),
    inventory: JSON.parse(localStorage.getItem('inventory') || '[]'),
    ownedFrames: JSON.parse(localStorage.getItem('ownedFrames') || '["none"]'),
    hardModeUnlocked: localStorage.getItem('hardModeUnlocked') === 'true',
    totalHintsUsed: parseInt(localStorage.getItem('totalHintsUsed') || '0'),
    totalFairyUsed: parseInt(localStorage.getItem('totalFairyUsed') || '0'),
  };
};

// Firebase verilerini localStorage'a yaz
export const applyCloudData = (cloudData) => {
  if (cloudData.diamonds !== undefined) localStorage.setItem('diamonds', cloudData.diamonds.toString());
  if (cloudData.unlockedLevels !== undefined) localStorage.setItem('unlockedLevels', cloudData.unlockedLevels.toString());
  if (cloudData.completedLevels) localStorage.setItem('completedLevels', JSON.stringify(cloudData.completedLevels));
  if (cloudData.bestTimes) localStorage.setItem('bestTimes', JSON.stringify(cloudData.bestTimes));
  if (cloudData.lastTimes) localStorage.setItem('lastTimes', JSON.stringify(cloudData.lastTimes));
  if (cloudData.lastPlayedLevel) localStorage.setItem('lastPlayedLevel', JSON.stringify(cloudData.lastPlayedLevel));
  if (cloudData.userProfile) localStorage.setItem('userProfile', JSON.stringify(cloudData.userProfile));
  if (cloudData.wordBoxProgress) localStorage.setItem('wordBoxProgress', JSON.stringify(cloudData.wordBoxProgress));
  if (cloudData.claimedAchievements) localStorage.setItem('claimedAchievements', JSON.stringify(cloudData.claimedAchievements));
  if (cloudData.claimedDailyRepeats) localStorage.setItem('claimedDailyRepeats', JSON.stringify(cloudData.claimedDailyRepeats));
  if (cloudData.inventory) localStorage.setItem('inventory', JSON.stringify(cloudData.inventory));
  if (cloudData.ownedFrames) localStorage.setItem('ownedFrames', JSON.stringify(cloudData.ownedFrames));
  if (cloudData.hardModeUnlocked !== undefined) localStorage.setItem('hardModeUnlocked', cloudData.hardModeUnlocked.toString());
  if (cloudData.totalHintsUsed !== undefined) localStorage.setItem('totalHintsUsed', cloudData.totalHintsUsed.toString());
  if (cloudData.totalFairyUsed !== undefined) localStorage.setItem('totalFairyUsed', cloudData.totalFairyUsed.toString());
};

// İki veri setini karşılaştır - hangisi daha ileri?
export const compareProgress = (local, cloud) => {
  if (!cloud) return 'local'; // Cloud'da veri yok
  if (!local) return 'cloud'; // Local'da veri yok
  
  // Tamamlanan bölüm sayısı en önemli kriter
  const localCompleted = (local.completedLevels || []).length;
  const cloudCompleted = (cloud.completedLevels || []).length;
  
  // Açılan bölüm sayısı ikinci kriter
  const localUnlocked = local.unlockedLevels || 1;
  const cloudUnlocked = cloud.unlockedLevels || 1;
  
  // Skor hesapla: tamamlanan * 1000 + açılan * 100 + elmas
  const localScore = localCompleted * 1000 + localUnlocked * 100 + (local.diamonds || 0);
  const cloudScore = cloudCompleted * 1000 + cloudUnlocked * 100 + (cloud.diamonds || 0);
  
  if (localScore > cloudScore) return 'local';
  if (cloudScore > localScore) return 'cloud';
  return 'equal';
};
