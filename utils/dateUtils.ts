import { Outfit } from '@/store/outfitStore';

export function formatDate(dateString: string, locale: string = 'en-US'): string {
  const date = new Date(dateString);
  
  // Türkçe locale için özel aylar dizisi
  if (locale === 'tr' || locale === 'tr-TR') {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }
  
  // Diğer diller için standart format
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string, locale: string = 'en-US', t: any): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 6) {
    return formatDate(dateString, locale);
  } else if (diffInDays > 1) {
    return t('common.daysAgo', { count: diffInDays });
  } else if (diffInDays === 1) {
    return t('common.yesterday');
  } else if (diffInHours > 1) {
    return t('common.hoursAgo', { count: diffInHours });
  } else if (diffInMinutes > 1) {
    return t('common.minutesAgo', { count: diffInMinutes });
  } else {
    return t('common.justNow');
  }
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isYesterday(dateString: string): boolean {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

export function groupOutfitsByDate(outfits: Outfit[], locale: string = 'en-US', t: any) {
  const groups: { title: string; data: Outfit[] }[] = [];
  const map = new Map<string, { outfits: Outfit[]; originalDate: string }>();

  outfits.forEach(outfit => {
    // Date anahtarı olarak YYYY-MM-DD formatını kullan (locale bağımsız)
    const dateKey = outfit.date.split('T')[0]; // "2025-06-23"
    
    if (!map.has(dateKey)) {
      map.set(dateKey, { outfits: [], originalDate: outfit.date });
    }
    map.get(dateKey)!.outfits.push(outfit);
  });

  // Grupları oluştur, en yeni tarih yukarıda olacak şekilde sırala
  Array.from(map.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .forEach(([dateKey, { outfits, originalDate }]) => {
      let title: string;
      
      // Bugün, dün kontrolü
      if (isToday(originalDate)) {
        title = t('common.today');
      } else if (isYesterday(originalDate)) {
        title = t('common.yesterday');
      } else {
        // Localized tarih formatı - burada locale parametresini geçiyoruz
        title = formatDate(originalDate, locale);
      }

      groups.push({ 
        title, 
        data: outfits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      });
    });

  return groups;
}