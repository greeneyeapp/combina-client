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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const groups = [
    { title: 'Today', data: [] as Outfit[] },
    { title: 'Yesterday', data: [] as Outfit[] },
    { title: 'This Week', data: [] as Outfit[] },
    { title: 'Last Week', data: [] as Outfit[] },
    { title: 'This Month', data: [] as Outfit[] },
    { title: 'Older', data: [] as Outfit[] },
  ];
  
  outfits.forEach(outfit => {
    const outfitDate = new Date(outfit.date);
    outfitDate.setHours(0, 0, 0, 0);
    
    if (outfitDate.getTime() === today.getTime()) {
      groups[0].data.push(outfit);
    } else if (outfitDate.getTime() === yesterday.getTime()) {
      groups[1].data.push(outfit);
    } else if (outfitDate >= thisWeekStart) {
      groups[2].data.push(outfit);
    } else if (outfitDate >= lastWeekStart) {
      groups[3].data.push(outfit);
    } else if (outfitDate >= thisMonthStart) {
      groups[4].data.push(outfit);
    } else {
      groups[5].data.push(outfit);
    }
  });
  
  // Remove empty groups
  return groups.filter(group => group.data.length > 0);
}