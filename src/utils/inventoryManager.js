// Envanter Yönetim Sistemi

// Varsayılan envanter yapısı
const defaultInventory = {
  skipLevelTokens: 0,
  badges: [],
  features: {
    removeAds: false,
    premiumBadge: false
  },
  unlockedFrames: [], // Açık çerçeveler: ['coffee', 'gold', 'diamond', 'legend']
  stats: {
    totalSkipsUsed: 0,
    totalSkipsPurchased: 0,
    totalDiamondsSpent: 0,
    supportLevel: null // 'coffee', 'gold', 'diamond', 'legend'
  }
};

// Envanter'i localStorage'dan al
export const getInventory = () => {
  try {
    const saved = localStorage.getItem('inventory');
    if (saved) {
      const inventory = JSON.parse(saved);
      // Eksik alanları varsayılan değerlerle doldur
      return {
        ...defaultInventory,
        ...inventory,
        features: { ...defaultInventory.features, ...inventory.features },
        stats: { ...defaultInventory.stats, ...inventory.stats }
      };
    }
    return { ...defaultInventory };
  } catch (error) {
    console.error('Envanter yükleme hatası:', error);
    return { ...defaultInventory };
  }
};

// Envanter'i localStorage'a kaydet
export const saveInventory = (inventory) => {
  try {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    return true;
  } catch (error) {
    console.error('Envanter kaydetme hatası:', error);
    return false;
  }
};

// Seviye atlama hakkı ekle
export const addSkipLevelTokens = (amount, diamondCost) => {
  const inventory = getInventory();
  inventory.skipLevelTokens += amount;
  inventory.stats.totalSkipsPurchased += amount;
  inventory.stats.totalDiamondsSpent += diamondCost;
  saveInventory(inventory);
  return inventory;
};

// Seviye atlama hakkı kullan
export const useSkipLevelToken = () => {
  const inventory = getInventory();
  if (inventory.skipLevelTokens > 0) {
    inventory.skipLevelTokens -= 1;
    inventory.stats.totalSkipsUsed += 1;
    saveInventory(inventory);
    return { success: true, remaining: inventory.skipLevelTokens };
  }
  return { success: false, remaining: 0 };
};

// Seviye atlama hakkı sayısını kontrol et
export const getSkipLevelTokenCount = () => {
  const inventory = getInventory();
  return inventory.skipLevelTokens;
};

// Rozet ekle
export const addBadge = (badgeId) => {
  const inventory = getInventory();
  if (!inventory.badges.includes(badgeId)) {
    inventory.badges.push(badgeId);
    saveInventory(inventory);
  }
  return inventory;
};

// Rozet kontrolü
export const hasBadge = (badgeId) => {
  const inventory = getInventory();
  return inventory.badges.includes(badgeId);
};

// Özellik aktif et
export const activateFeature = (featureName) => {
  const inventory = getInventory();
  inventory.features[featureName] = true;
  saveInventory(inventory);
  return inventory;
};

// Özellik kontrolü
export const hasFeature = (featureName) => {
  const inventory = getInventory();
  return inventory.features[featureName] === true;
};

// Destek seviyesi güncelle ve çerçeve aç
export const updateSupportLevel = (level, diamondCost) => {
  const inventory = getInventory();
  
  // Çerçeveyi aç
  if (!inventory.unlockedFrames) {
    inventory.unlockedFrames = [];
  }
  if (!inventory.unlockedFrames.includes(level)) {
    inventory.unlockedFrames.push(level);
  }
  
  // Seviye sıralaması - en yüksek seviyeyi kaydet
  const levels = ['coffee', 'gold', 'diamond', 'legend'];
  const currentLevelIndex = levels.indexOf(inventory.stats.supportLevel);
  const newLevelIndex = levels.indexOf(level);
  
  // Daha yüksek seviyeye geçilirse güncelle
  if (newLevelIndex > currentLevelIndex) {
    inventory.stats.supportLevel = level;
  }
  
  inventory.stats.totalDiamondsSpent += diamondCost;
  saveInventory(inventory);
  
  return inventory;
};

// Çerçeve açık mı kontrol et
export const isFrameUnlocked = (frameKey) => {
  const inventory = getInventory();
  return inventory.unlockedFrames?.includes(frameKey) || false;
};

// Rozet bilgileri
export const getBadgeInfo = (badgeId) => {
  const badgeData = {
    supporter: {
      id: 'supporter',
      name: { tr: '🏅 Destekçi', en: '🏅 Supporter' },
      desc: { tr: 'Oyunu destekledi', en: 'Supported the game' },
      color: 'from-amber-500 to-orange-600'
    },
    gold_supporter: {
      id: 'gold_supporter',
      name: { tr: '🥇 Altın Destekçi', en: '🥇 Gold Supporter' },
      desc: { tr: 'Altın seviye destek', en: 'Gold level support' },
      color: 'from-yellow-500 to-amber-600'
    },
    diamond_supporter: {
      id: 'diamond_supporter',
      name: { tr: '💎 Elmas Destekçi', en: '💎 Diamond Supporter' },
      desc: { tr: 'Elmas seviye destek', en: 'Diamond level support' },
      color: 'from-cyan-500 to-blue-600'
    },
    legend_supporter: {
      id: 'legend_supporter',
      name: { tr: '👑 Efsane Destekçi', en: '👑 Legend Supporter' },
      desc: { tr: 'Efsane seviye destek', en: 'Legend level support' },
      color: 'from-purple-500 to-pink-600'
    }
  };
  
  return badgeData[badgeId] || null;
};

// Envanter istatistiklerini al
export const getInventoryStats = () => {
  const inventory = getInventory();
  return {
    skipLevelTokens: inventory.skipLevelTokens,
    totalSkipsUsed: inventory.stats.totalSkipsUsed,
    totalSkipsPurchased: inventory.stats.totalSkipsPurchased,
    totalDiamondsSpent: inventory.stats.totalDiamondsSpent,
    supportLevel: inventory.stats.supportLevel,
    badgeCount: inventory.badges.length,
    activeFeatures: Object.keys(inventory.features).filter(key => inventory.features[key])
  };
};

// Envanter'i sıfırla (test için)
export const resetInventory = () => {
  saveInventory({ ...defaultInventory });
  return defaultInventory;
};

// 2x Elmas Bonusu kontrolü - 4 destek rozeti varsa aktif
export const has2xDiamondBonus = () => {
  const inventory = getInventory();
  const supportBadges = ['supporter', 'gold_supporter', 'diamond_supporter', 'legend_supporter'];
  const ownedSupportBadges = supportBadges.filter(badge => inventory.badges.includes(badge));
  return ownedSupportBadges.length === 4;
};
