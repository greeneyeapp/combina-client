import { Outfit } from '@/store/outfitStore';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 6) {
    return formatDate(dateString);
  } else if (diffInDays > 1) {
    return `${diffInDays} days ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInHours > 1) {
    return `${diffInHours} hours ago`;
  } else if (diffInMinutes > 1) {
    return `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

export function groupOutfitsByDate(outfits: Outfit[]) {
  const groups: { title: string; data: Outfit[] }[] = [];
  const map = new Map<string, Outfit[]>();

  outfits.forEach(outfit => {
    const dateString = formatDate(outfit.date); // örn. "June 12, 2025"
    if (!map.has(dateString)) {
      map.set(dateString, []);
    }
    map.get(dateString)!.push(outfit);
  });

  // Grupları oluştur, en yeni tarih yukarıda olacak şekilde sırala
  Array.from(map.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .forEach(([title, data]) => {
      groups.push({ title, data });
    });

  return groups;
}
