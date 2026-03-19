// Başarımlar (Achievements) - Bir kez tamamlanabilir görevler

// Bölüm Tamamlama Görevleri
export const levelAchievements = [
  {
    id: 'complete-5-levels',
    type: 'level',
    title: { tr: '5 Bölüm Tamamla', en: 'Complete 5 Levels' },
    icon: '🎖️',
    target: 5,
    reward: 5,
    category: 'levels'
  },
  {
    id: 'complete-10-levels',
    type: 'level',
    title: { tr: '10 Bölüm Tamamla', en: 'Complete 10 Levels' },
    icon: '🎖️',
    target: 10,
    reward: 8,
    category: 'levels'
  },
  {
    id: 'complete-20-levels',
    type: 'level',
    title: { tr: '20 Bölüm Tamamla', en: 'Complete 20 Levels' },
    icon: '🎖️',
    target: 20,
    reward: 10,
    category: 'levels'
  },
  {
    id: 'complete-50-levels',
    type: 'level',
    title: { tr: '50 Bölüm Tamamla', en: 'Complete 50 Levels' },
    icon: '🥉',
    target: 50,
    reward: 25,
    category: 'levels'
  },
  {
    id: 'complete-100-levels',
    type: 'level',
    title: { tr: '100 Bölüm Tamamla', en: 'Complete 100 Levels' },
    icon: '🥉',
    target: 100,
    reward: 50,
    category: 'levels'
  },
  {
    id: 'complete-200-levels',
    type: 'level',
    title: { tr: '200 Bölüm Tamamla', en: 'Complete 200 Levels' },
    icon: '🥈',
    target: 200,
    reward: 75,
    category: 'levels'
  },
  {
    id: 'complete-500-levels',
    type: 'level',
    title: { tr: '500 Bölüm Tamamla', en: 'Complete 500 Levels' },
    icon: '🥈',
    target: 500,
    reward: 150,
    category: 'levels'
  },
  {
    id: 'complete-1000-levels',
    type: 'level',
    title: { tr: '1000 Bölüm Tamamla', en: 'Complete 1000 Levels' },
    icon: '🥇',
    target: 1000,
    reward: 250,
    category: 'levels'
  },
  {
    id: 'complete-1500-levels',
    type: 'level',
    title: { tr: '1500 Bölüm Tamamla', en: 'Complete 1500 Levels' },
    icon: '🥇',
    target: 1500,
    reward: 400,
    category: 'levels'
  },
  {
    id: 'complete-2000-levels',
    type: 'level',
    title: { tr: '2000 Bölüm Tamamla', en: 'Complete 2000 Levels' },
    icon: '🏆',
    target: 2000,
    reward: 1000,
    category: 'levels'
  },
  {
    id: 'complete-2600-final',
    type: 'level',
    title: { tr: '🎊 FİNAL: 2600 Bölümü Tamamla', en: '🎊 FINAL: Complete Level 2600' },
    description: { tr: 'Tüm bölümleri tamamla ve büyük final ödülünü kazan!', en: 'Complete all levels and win the grand final reward!' },
    icon: '👑',
    target: 2600,
    reward: 78000,
    category: 'levels',
    isFinal: true
  }
];

// Koleksiyon Tamamlama Görevleri
export const collectionAchievements = [
  {
    id: 'complete-1-collection',
    type: 'collection',
    title: { tr: '1 Koleksiyon Tamamla', en: 'Complete 1 Collection' },
    icon: '🎖️',
    target: 1,
    reward: 3,
    category: 'collections'
  },
  {
    id: 'complete-3-collections',
    type: 'collection',
    title: { tr: '3 Koleksiyon Tamamla', en: 'Complete 3 Collections' },
    icon: '🎖️',
    target: 3,
    reward: 5,
    category: 'collections'
  },
  {
    id: 'complete-5-collections',
    type: 'collection',
    title: { tr: '5 Koleksiyon Tamamla', en: 'Complete 5 Collections' },
    icon: '🎖️',
    target: 5,
    reward: 8,
    category: 'collections'
  },
  {
    id: 'complete-10-collections',
    type: 'collection',
    title: { tr: '10 Koleksiyon Tamamla', en: 'Complete 10 Collections' },
    icon: '🥉',
    target: 10,
    reward: 12,
    category: 'collections'
  },
  {
    id: 'complete-25-collections',
    type: 'collection',
    title: { tr: '25 Koleksiyon Tamamla', en: 'Complete 25 Collections' },
    icon: '🥉',
    target: 25,
    reward: 20,
    category: 'collections'
  },
  {
    id: 'complete-50-collections',
    type: 'collection',
    title: { tr: '50 Koleksiyon Tamamla', en: 'Complete 50 Collections' },
    icon: '🥈',
    target: 50,
    reward: 35,
    category: 'collections'
  },
  {
    id: 'complete-75-collections',
    type: 'collection',
    title: { tr: '75 Koleksiyon Tamamla', en: 'Complete 75 Collections' },
    icon: '🥈',
    target: 75,
    reward: 50,
    category: 'collections'
  },
  {
    id: 'complete-100-collections',
    type: 'collection',
    title: { tr: '100 Koleksiyon Tamamla', en: 'Complete 100 Collections' },
    icon: '🥇',
    target: 100,
    reward: 75,
    category: 'collections'
  },
  {
    id: 'complete-150-collections',
    type: 'collection',
    title: { tr: '150 Koleksiyon Tamamla', en: 'Complete 150 Collections' },
    icon: '🥇',
    target: 150,
    reward: 120,
    category: 'collections'
  },
  {
    id: 'complete-173-collections',
    type: 'collection',
    title: { tr: '173 Koleksiyon Tamamla', en: 'Complete 173 Collections' },
    icon: '🏆',
    target: 173,
    reward: 200,
    category: 'collections'
  }
];

// Tüm başarımlar (geriye dönük uyumluluk için)
export const achievements = [...levelAchievements, ...collectionAchievements];


// Bölüm başarımlarını kontrol et
export const checkLevelAchievements = (completedLevelsCount, claimedAchievements = []) => {
  return levelAchievements.filter(achievement => {
    return !claimedAchievements.includes(achievement.id) && 
           completedLevelsCount >= achievement.target;
  });
};

// Koleksiyon başarımlarını kontrol et
export const checkCollectionAchievements = (completedCollectionsCount, claimedAchievements = []) => {
  return collectionAchievements.filter(achievement => {
    return !claimedAchievements.includes(achievement.id) && 
           completedCollectionsCount >= achievement.target;
  });
};

// Devam eden bölüm başarımları
export const getInProgressLevelAchievements = (completedLevelsCount, claimedAchievements = []) => {
  return levelAchievements.filter(achievement => {
    return !claimedAchievements.includes(achievement.id) && 
           completedLevelsCount < achievement.target;
  });
};

// Devam eden koleksiyon başarımları
export const getInProgressCollectionAchievements = (completedCollectionsCount, claimedAchievements = []) => {
  return collectionAchievements.filter(achievement => {
    return !claimedAchievements.includes(achievement.id) && 
           completedCollectionsCount < achievement.target;
  });
};

// Tamamlanmış bölüm başarımları
export const getClaimedLevelAchievements = (claimedAchievements = []) => {
  return levelAchievements.filter(achievement => 
    claimedAchievements.includes(achievement.id)
  );
};

// Tamamlanmış koleksiyon başarımları
export const getClaimedCollectionAchievements = (claimedAchievements = []) => {
  return collectionAchievements.filter(achievement => 
    claimedAchievements.includes(achievement.id)
  );
};

// Geriye dönük uyumluluk için eski fonksiyonlar
export const checkAchievements = (completedLevelsCount, claimedAchievements = []) => {
  return checkLevelAchievements(completedLevelsCount, claimedAchievements);
};

export const getInProgressAchievements = (completedLevelsCount, claimedAchievements = []) => {
  return getInProgressLevelAchievements(completedLevelsCount, claimedAchievements);
};

export const getClaimedAchievements = (claimedAchievements = []) => {
  return getClaimedLevelAchievements(claimedAchievements);
};


// Günlük Tekrar Görevleri
export const dailyRepeatQuests = [
  {
    id: 'daily-repeat-1',
    title: { tr: '1 Koleksiyon Tekrar Et', en: 'Repeat 1 Collection' },
    icon: '🔁',
    target: 1,
    reward: 1
  },
  {
    id: 'daily-repeat-2',
    title: { tr: '2 Koleksiyon Tekrar Et', en: 'Repeat 2 Collections' },
    icon: '🔁',
    target: 2,
    reward: 1
  },
  {
    id: 'daily-repeat-3',
    title: { tr: '3 Koleksiyon Tekrar Et', en: 'Repeat 3 Collections' },
    icon: '🔁',
    target: 3,
    reward: 2
  },
  {
    id: 'daily-repeat-5',
    title: { tr: '5 Koleksiyon Tekrar Et', en: 'Repeat 5 Collections' },
    icon: '🔁',
    target: 5,
    reward: 3
  },
  {
    id: 'daily-repeat-7',
    title: { tr: '7 Koleksiyon Tekrar Et', en: 'Repeat 7 Collections' },
    icon: '🔁',
    target: 7,
    reward: 4
  },
  {
    id: 'daily-repeat-10',
    title: { tr: '10 Koleksiyon Tekrar Et', en: 'Repeat 10 Collections' },
    icon: '🔁',
    target: 10,
    reward: 5
  }
];

// Bugünün tarihini YYYY-MM-DD formatında al
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Bugün tekrar edilen farklı koleksiyon sayısını hesapla
export const getTodayRepeatCount = () => {
  const boxProgress = JSON.parse(localStorage.getItem('wordBoxProgress') || '{}');
  const today = getTodayDate();
  let count = 0;
  
  Object.values(boxProgress).forEach(progress => {
    if (progress.completionHistory && progress.completionHistory.length > 0) {
      // Bugün tamamlanan var mı kontrol et
      const todayCompletion = progress.completionHistory.find(date => 
        date.startsWith(today)
      );
      if (todayCompletion) {
        count++;
      }
    }
  });
  
  return count;
};

// Günlük tekrar görevlerinin durumunu kontrol et
export const checkDailyRepeatQuests = (claimedToday = []) => {
  const todayCount = getTodayRepeatCount();
  
  return dailyRepeatQuests.map(quest => ({
    ...quest,
    current: Math.min(todayCount, quest.target),
    completed: todayCount >= quest.target,
    claimed: claimedToday.includes(quest.id),
    canClaim: todayCount >= quest.target && !claimedToday.includes(quest.id)
  }));
};

// Önerilen koleksiyonu bul (en az tekrar edilen 1 tane)
export const getSuggestedCollections = (boxProgress, allBoxes, excludeIds = []) => {
  if (!allBoxes || allBoxes.length === 0) return [];
  
  // Her koleksiyonun tekrar sayısını hesapla
  const collectionsWithCount = allBoxes
    .filter(box => !excludeIds.includes(box.id)) // Daha önce önerilenleri hariç tut
    .map(box => {
      const progress = boxProgress[box.id] || {};
      const repeatCount = progress.completionHistory ? progress.completionHistory.length : 0;
      return {
        ...box,
        repeatCount
      };
    });
  
  if (collectionsWithCount.length === 0) return [];
  
  // En az tekrar sayısını bul
  const minRepeat = Math.min(...collectionsWithCount.map(c => c.repeatCount));
  
  // En az tekrar edilenleri bul
  const leastRepeated = collectionsWithCount.filter(c => c.repeatCount === minRepeat);
  
  // En düşük numaralı koleksiyonu seç (Koleksiyon 1'den başla)
  leastRepeated.sort((a, b) => a.number - b.number);
  return [leastRepeated[0]];
  
  return suggested;
};
