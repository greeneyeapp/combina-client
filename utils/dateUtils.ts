import { Outfit } from '@/store/outfitStore';
import i18n from '@/locales/i18n';

export function formatDate(dateString: string, locale?: string): string {
  const date = new Date(dateString);
  const currentLocale = locale || i18n.language || 'en-US';
  
  if (currentLocale === 'tr' || currentLocale === 'tr-TR') {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }
  
  return date.toLocaleDateString(currentLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string, locale?: string, t?: any): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  const translator = t || i18n.t;
  const currentLocale = locale || i18n.language || 'en-US';
  
  if (diffInDays > 6) {
    return formatDate(dateString, currentLocale);
  } else if (diffInDays > 1) {
    return translator('common.daysAgo', { count: diffInDays });
  } else if (diffInDays === 1) {
    return translator('common.yesterday');
  } else if (diffInHours > 1) {
    return translator('common.hoursAgo', { count: diffInHours });
  } else if (diffInMinutes > 1) {
    return translator('common.minutesAgo', { count: diffInMinutes });
  } else {
    return translator('common.justNow');
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

export function groupOutfitsByDate(outfits: Outfit[], locale?: string, t?: any) {
  const groups: { title: string; data: Outfit[] }[] = [];
  const map = new Map<string, { outfits: Outfit[]; originalDate: string }>();
  
  const translator = t || i18n.t;
  const currentLocale = locale || i18n.language || 'en-US';

  outfits.forEach(outfit => {
    const dateKey = outfit.date.split('T')[0];
    
    if (!map.has(dateKey)) {
      map.set(dateKey, { outfits: [], originalDate: outfit.date });
    }
    map.get(dateKey)!.outfits.push(outfit);
  });

  Array.from(map.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .forEach(([dateKey, { outfits, originalDate }]) => {
      let title: string;
      
      if (isToday(originalDate)) {
        title = translator('common.today');
      } else if (isYesterday(originalDate)) {
        title = translator('common.yesterday');
      } else {
        title = formatDate(originalDate, currentLocale);
      }

      groups.push({ 
        title, 
        data: outfits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      });
    });

  return groups;
}