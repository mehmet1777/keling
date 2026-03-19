import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, setDoc } from 'firebase/firestore';
import { playSound } from '../utils/SoundManager';

// Avatar listesi - PhoneMenuPage ile aynı
const avatarList = [
  { type: 'image', src: '/avatars/avatar_1.png', bg: 'from-yellow-400 to-orange-400' },
  { type: 'image', src: '/avatars/avatar_2.png', bg: 'from-blue-400 to-cyan-400' },
  { type: 'image', src: '/avatars/avatar_3.png', bg: 'from-pink-400 to-purple-400' },
  { type: 'image', src: '/avatars/avatar_4.png', bg: 'from-sky-300 to-blue-400' },
  { type: 'image', src: '/avatars/avatar_5.png', bg: 'from-amber-400 to-yellow-300' },
  { type: 'image', src: '/avatars/avatar_6.png', bg: 'from-orange-400 to-red-400' },
  { type: 'image', src: '/avatars/avatar_7.png', bg: 'from-orange-500 to-amber-400' },
  { type: 'image', src: '/avatars/avatar_8.png', bg: 'from-gray-300 to-gray-400' },
  { type: 'image', src: '/avatars/avatar_9.png', bg: 'from-yellow-500 to-orange-500' },
  { type: 'image', src: '/avatars/avatar_10.png', bg: 'from-green-400 to-emerald-400' },
  { type: 'image', src: '/avatars/avatar_11.png', bg: 'from-purple-400 to-pink-400' },
  { type: 'image', src: '/avatars/avatar_12.png', bg: 'from-red-500 to-orange-500' },
];

// Çerçeve stilleri - PhoneMenuPage ile aynı
const frameStyles = {
  none: { 
    image: null, 
    scale: '1', 
    scaleY: '1', 
    cardBg: 'from-indigo-500/30 via-purple-500/20 to-pink-500/30', 
    border: 'border-purple-400/40',
    nameColor: 'text-white'
  },
  coffee: { 
    image: '/frames/coffee_frame.png', 
    scale: '1.3', 
    scaleY: '1.55',
    cardBg: 'from-amber-600/40 via-orange-500/30 to-amber-700/40',
    border: 'border-amber-300',
    nameColor: 'text-amber-200'
  },
  gold: { 
    image: '/frames/gold_frame.png', 
    scale: '1.4', 
    scaleY: '1.7',
    cardBg: 'from-yellow-500/40 via-amber-400/30 to-yellow-600/40',
    border: 'border-yellow-300',
    nameColor: 'text-yellow-200'
  },
  diamond: { 
    image: '/frames/diamond_frame.png', 
    scale: '1.5', 
    scaleY: '1.7',
    cardBg: 'from-cyan-500/40 via-blue-400/30 to-cyan-600/40',
    border: 'border-cyan-300',
    nameColor: 'text-cyan-200'
  },
  legend: { 
    image: '/frames/legend_frame.png', 
    scale: '1.5', 
    scaleY: '1.7',
    cardBg: 'from-purple-600/40 via-pink-500/30 to-fuchsia-600/40',
    border: 'border-fuchsia-300',
    nameColor: 'text-fuchsia-200'
  }
};

const LeaderboardPage = ({ 
  isOpen, 
  onClose, 
  currentLevel,
  collectionStats,
  userProfile,
  language = 'tr'
}) => {
  const [activeTab, setActiveTab] = useState('level');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const t = {
    tr: {
      title: 'Sıralama',
      levelTab: 'Bölüm',
      collectionTab: 'Koleksiyon Tekrarı',
      level: 'Bölüm',
      score: 'Puan',
      you: 'Sen',
      noData: 'Henüz kimse yok',
      loading: 'Yükleniyor...',
      yourRank: 'Senin Sıran',
      top100: 'En İyi 100'
    },
    en: {
      title: 'Leaderboard',
      levelTab: 'Level',
      collectionTab: 'Collection Reviews',
      level: 'Level',
      score: 'Score',
      you: 'You',
      noData: 'No one yet',
      loading: 'Loading...',
      yourRank: 'Your Rank',
      top100: 'Top 100'
    }
  }[language];

  useEffect(() => {
    let id = localStorage.getItem('odaId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('odaId', id);
    }
    setUserId(id);
  }, []);

  const calculateCollectionScore = () => {
    if (!collectionStats) return 0;
    const uniqueCollections = collectionStats.uniqueCount || 0;
    const totalReviews = collectionStats.totalReviews || 0;
    return (uniqueCollections * 5300) + (totalReviews * 520);
  };

  const saveUserData = async () => {
    if (!userId) return;
    
    try {
      const userRef = doc(db, 'leaderboard', userId);
      await setDoc(userRef, {
        odaId: userId,
        name: userProfile?.name || `K#${userId.slice(-4)}`,
        avatar: userProfile?.avatarIndex || 0,
        frame: userProfile?.selectedFrame || 'none',
        level: currentLevel || 1,
        collectionScore: calculateCollectionScore(),
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Firebase kayıt hatası:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const field = activeTab === 'level' ? 'level' : 'collectionScore';
      const q = query(
        collection(db, 'leaderboard'),
        orderBy(field, 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc, index) => ({
        ...doc.data(),
        rank: index + 1
      }));
      
      setLeaderboardData(data);
      
      const userIndex = data.findIndex(d => d.odaId === userId);
      if (userIndex !== -1) {
        setUserRank(userIndex + 1);
      }
    } catch (error) {
      console.error('Sıralama çekme hatası:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && userId) {
      saveUserData().then(() => fetchLeaderboard());
    }
  }, [isOpen, userId, activeTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gradient-to-b from-stone-900 via-neutral-950 to-zinc-950 rounded-2xl overflow-hidden border border-amber-700/40 shadow-2xl mx-3"
          style={{ maxHeight: '88vh', maxWidth: '420px', width: 'calc(100% - 24px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-3 border-b border-white/10"
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{t.title}</h2>
                  <p className="text-xs text-gray-400">{t.top100}</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setActiveTab('level');
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  activeTab === 'level'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 text-gray-400 active:bg-white/10'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                🎯 {t.levelTab}
              </motion.button>
              <motion.button
                onClick={() => {
                  playSound('telefontıklama.mp3');
                  setActiveTab('collection');
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  activeTab === 'collection'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-white/5 text-gray-400 active:bg-white/10'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                📚 {t.collectionTab}
              </motion.button>
            </div>
          </div>

          {/* User Rank Card */}
          {userRank && (
            <div className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    #{userRank}
                  </div>
                  <span className="text-purple-200 font-medium">{t.yourRank}</span>
                </div>
                <div className="text-white font-bold">
                  {activeTab === 'level' ? `${t.level} ${currentLevel}` : `${calculateCollectionScore().toLocaleString('tr-TR')} ${t.score}`}
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="overflow-y-auto px-3 py-2 space-y-2" 
            style={{ 
              maxHeight: 'calc(88vh - 220px)',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
            }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-4xl mb-3"
                >
                  ⏳
                </motion.div>
                <p className="text-gray-400">{t.loading}</p>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="text-5xl mb-3">🏆</span>
                <p className="text-gray-400">{t.noData}</p>
              </div>
            ) : (
              leaderboardData.map((player, index) => {
                const isCurrentUser = player.odaId === userId;
                const frameStyle = frameStyles[player.frame] || frameStyles.none;
                const avatar = avatarList[player.avatar] || avatarList[0];
                const hasFrame = frameStyle.image;
                
                return (
                  <div
                    key={player.odaId}
                    className={`relative py-[42px] px-3 rounded-xl ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-amber-900/60 to-yellow-800/50 border-2 border-amber-400' 
                        : player.rank === 1
                          ? 'bg-gradient-to-r from-stone-800/70 to-neutral-700/60 border-2 border-yellow-500/70'
                          : player.rank === 2
                            ? 'bg-gradient-to-r from-stone-800/70 to-neutral-700/60 border-2 border-gray-400/70'
                            : player.rank === 3
                              ? 'bg-gradient-to-r from-stone-800/70 to-neutral-700/60 border-2 border-orange-500/70'
                              : 'bg-gradient-to-r from-zinc-800/60 to-stone-800/50 border border-purple-500/40'
                    }`}
                  >
                    {/* Sıralama Badge - Sol üst köşe */}
                    <div className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      player.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                      player.rank === 2 ? 'bg-gray-300 text-gray-800' :
                      player.rank === 3 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-700/80 text-white'
                    }`}>
                      {player.rank <= 3 ? ['👑', '🥈', '🥉'][player.rank - 1] : player.rank}
                    </div>
                    
                    {/* Profil Önizleme yapısı - PhoneMenuPage ile aynı */}
                    <div className="relative mx-auto" style={{ overflow: 'visible', maxWidth: '200px' }}>
                      {/* Çerçeve PNG */}
                      {hasFrame && (
                        <img 
                          src={frameStyle.image} 
                          alt="Frame" 
                          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                          style={{ 
                            transform: `scale(${frameStyle.scale || '1.4'}) scaleY(${frameStyle.scaleY || '1.7'})`, 
                            objectFit: 'fill' 
                          }}
                        />
                      )}
                      
                      {/* Kart İçeriği - Çerçeveye göre renk değişir */}
                      <div className={`relative bg-gradient-to-br ${frameStyle.cardBg || 'from-violet-500 via-purple-600 to-indigo-600'} rounded-xl p-4 border-2 ${hasFrame ? 'border-transparent' : (frameStyle.border || 'border-violet-300')}`}>
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={`w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br ${avatar.bg} border-2 border-purple-400/50 flex-shrink-0 flex items-center justify-center`}>
                            {avatar.type === 'image' ? (
                              <img src={avatar.src} alt="Avatar" className="w-full h-full object-cover" style={{ transform: 'scale(1.3)' }} />
                            ) : (
                              <span className="text-xl">{avatar.emoji}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className={`${frameStyle.nameColor || 'text-white'} font-bold truncate capitalize ${player.name.length <= 4 ? 'text-xl' : player.name.length <= 6 ? 'text-lg' : player.name.length <= 9 ? 'text-base' : 'text-sm'}`}>{player.name}</p>
                              {isCurrentUser && (
                                <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/30 text-purple-300">
                                  {t.you}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Puan - Dış kartın sağ alt köşesi */}
                    <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 z-20">
                      <p className="text-white font-bold text-xs flex items-center gap-1">
                        {activeTab === 'level' 
                          ? <><span>⭐</span> {player.level}</>
                          : `${(player.collectionScore || 0).toLocaleString('tr-TR')}`
                        }
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LeaderboardPage;
