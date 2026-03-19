// Local Notification Service
import { LocalNotifications } from '@capacitor/local-notifications';

// Bildirim ID'leri
const NOTIFICATION_IDS = {
  MORNING_REMINDER: 1,    // 10:00 Sabah
  AFTERNOON_REMINDER: 2,  // 17:00 Öğleden sonra
  EVENING_REMINDER: 3,    // 20:30 Akşam
  STREAK_REMINDER: 4,
};

// Bildirim izni iste
export const requestNotificationPermission = async () => {
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Bildirim izni hatası:', error);
    return false;
  }
};

// Bildirim izni kontrolü
export const checkNotificationPermission = async () => {
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Bildirim izni kontrol hatası:', error);
    return false;
  }
};

// Sabah hatırlatma (varsayılan 10:00, ayarlanabilir 07:00-10:30)
export const scheduleMorningReminder = async () => {
  const language = localStorage.getItem('language') || 'tr';
  const isEnabled = localStorage.getItem('morningReminderEnabled') !== 'false';
  
  if (!isEnabled) return;
  
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }
  
  await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS.MORNING_REMINDER }] });
  
  // Kullanıcının ayarladığı saati al
  const savedTime = localStorage.getItem('morningReminderTime');
  const timeConfig = savedTime ? JSON.parse(savedTime) : { hour: 10, minute: 0 };
  
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const notification = {
    title: language === 'tr' ? '☀️ Günaydın!' : '☀️ Good Morning!',
    body: language === 'tr' 
      ? 'Güne kelimelerle başla! 5 kelime öğrenmeye ne dersin?' 
      : 'Start your day with words! How about learning 5 words?',
    id: NOTIFICATION_IDS.MORNING_REMINDER,
    schedule: { at: scheduledTime, every: 'day' },
  };
  
  await LocalNotifications.schedule({ notifications: [notification] });
  console.log('Sabah hatırlatma zamanlandı:', scheduledTime);
};

// Öğleden sonra hatırlatma (varsayılan 17:00, ayarlanabilir 13:00-18:00)
export const scheduleAfternoonReminder = async () => {
  const language = localStorage.getItem('language') || 'tr';
  const isEnabled = localStorage.getItem('afternoonReminderEnabled') !== 'false';
  
  if (!isEnabled) return;
  
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }
  
  await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS.AFTERNOON_REMINDER }] });
  
  // Kullanıcının ayarladığı saati al
  const savedTime = localStorage.getItem('afternoonReminderTime');
  const timeConfig = savedTime ? JSON.parse(savedTime) : { hour: 17, minute: 0 };
  
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const notification = {
    title: language === 'tr' ? '🌤️ Mola Zamanı!' : '🌤️ Break Time!',
    body: language === 'tr' 
      ? '2 dakikalık bir kelime turu seni bekliyor!' 
      : 'A 2-minute word tour is waiting for you!',
    id: NOTIFICATION_IDS.AFTERNOON_REMINDER,
    schedule: { at: scheduledTime, every: 'day' },
  };
  
  await LocalNotifications.schedule({ notifications: [notification] });
  console.log('Öğleden sonra hatırlatma zamanlandı:', scheduledTime);
};

// Akşam hatırlatma (varsayılan 20:30, ayarlanabilir 19:00-22:00)
export const scheduleEveningReminder = async () => {
  const language = localStorage.getItem('language') || 'tr';
  const isEnabled = localStorage.getItem('eveningReminderEnabled') !== 'false';
  
  if (!isEnabled) return;
  
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }
  
  await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS.EVENING_REMINDER }] });
  
  // Kullanıcının ayarladığı saati al
  const savedTime = localStorage.getItem('eveningReminderTime');
  const timeConfig = savedTime ? JSON.parse(savedTime) : { hour: 20, minute: 30 };
  
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const notification = {
    title: language === 'tr' ? '🌙 Günü Tamamla!' : '🌙 Complete Your Day!',
    body: language === 'tr' 
      ? 'Bugün öğrenme hedefini tamamlamak için mükemmel zaman!' 
      : 'Perfect time to complete your learning goal today!',
    id: NOTIFICATION_IDS.EVENING_REMINDER,
    schedule: { at: scheduledTime, every: 'day' },
  };
  
  await LocalNotifications.schedule({ notifications: [notification] });
  console.log('Akşam hatırlatma zamanlandı:', scheduledTime);
};

// Eski fonksiyon - geriye uyumluluk için
export const scheduleDailyReminder = async (hour = 20, minute = 0) => {
  // Artık kullanılmıyor, yeni sistem 3 ayrı hatırlatma kullanıyor
  console.log('scheduleDailyReminder deprecated, use scheduleMorningReminder/scheduleAfternoonReminder/scheduleEveningReminder');
};

// Streak koruma hatırlatması
export const scheduleStreakReminder = async () => {
  const language = localStorage.getItem('language') || 'tr';
  const isEnabled = localStorage.getItem('streakReminderEnabled') !== 'false';
  
  if (!isEnabled) return;
  
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;
  
  // Son giriş zamanını al
  const lastPlayTime = localStorage.getItem('lastPlayTime');
  if (!lastPlayTime) return;
  
  const lastPlay = new Date(parseInt(lastPlayTime));
  const now = new Date();
  const hoursSinceLastPlay = (now - lastPlay) / (1000 * 60 * 60);
  
  // 24 saatten fazla geçmişse bildirim gönder
  if (hoursSinceLastPlay >= 24) {
    const streakDays = parseInt(localStorage.getItem('streakDays') || '0');
    
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS.STREAK_REMINDER }] });
    
    const notification = {
      title: language === 'tr' ? 'Seriniz Kırılmasın! 🔥' : "Don't Break Your Streak! 🔥",
      body: language === 'tr' 
        ? `${streakDays} günlük seriniz devam ediyor. Hemen oyna!`
        : `Your ${streakDays} day streak is waiting. Play now!`,
      id: NOTIFICATION_IDS.STREAK_REMINDER,
      schedule: {
        at: new Date(Date.now() + 1000 * 60), // 1 dakika sonra
      },
    };
    
    await LocalNotifications.schedule({ notifications: [notification] });
  }
};

// Kelime tekrarı hatırlatması - artık kullanılmıyor
export const scheduleReviewReminder = async () => {
  // Deprecated - yeni sistem 3 zaman dilimi kullanıyor
  console.log('scheduleReviewReminder deprecated');
};

// Tüm bildirimleri iptal et
export const cancelAllNotifications = async () => {
  try {
    await LocalNotifications.cancel({
      notifications: [
        { id: NOTIFICATION_IDS.MORNING_REMINDER },
        { id: NOTIFICATION_IDS.AFTERNOON_REMINDER },
        { id: NOTIFICATION_IDS.EVENING_REMINDER },
        { id: NOTIFICATION_IDS.STREAK_REMINDER },
      ],
    });
    console.log('Tüm bildirimler iptal edildi');
  } catch (error) {
    console.error('Bildirim iptal hatası:', error);
  }
};

// Tek bir bildirimi iptal et
export const cancelNotification = async (notificationId) => {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
    console.log('Bildirim iptal edildi:', notificationId);
  } catch (error) {
    console.error('Bildirim iptal hatası:', error);
  }
};

// Bildirimleri yeniden zamanla (dil değiştiğinde)
export const rescheduleAllNotifications = async () => {
  await scheduleMorningReminder();
  await scheduleAfternoonReminder();
  await scheduleEveningReminder();
  await scheduleStreakReminder();
};

// Export notification IDs for external use
export { NOTIFICATION_IDS };

// Son oyun zamanını güncelle
export const updateLastPlayTime = () => {
  localStorage.setItem('lastPlayTime', Date.now().toString());
};

// Streak günlerini güncelle
export const updateStreakDays = () => {
  const lastPlayTime = localStorage.getItem('lastPlayTime');
  const streakDays = parseInt(localStorage.getItem('streakDays') || '0');
  
  if (!lastPlayTime) {
    localStorage.setItem('streakDays', '1');
    return;
  }
  
  const lastPlay = new Date(parseInt(lastPlayTime));
  const now = new Date();
  const hoursSinceLastPlay = (now - lastPlay) / (1000 * 60 * 60);
  
  if (hoursSinceLastPlay < 48) {
    // 48 saat içinde giriş yaptı, streak devam ediyor
    localStorage.setItem('streakDays', (streakDays + 1).toString());
  } else {
    // Streak kırıldı, sıfırla
    localStorage.setItem('streakDays', '1');
  }
};
