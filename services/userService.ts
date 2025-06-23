import API_URL from '@/config';
import { auth } from '@/firebaseConfig';

interface UserProfile {
  user_id: string;
  fullname: string;
  gender: string;
  age?: number;
  plan: string;
  usage: {
    daily_limit: number;
    current_usage: number;
    remaining: number;
    percentage_used: number;
    date: string;
  };
  created_at: any;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const idToken = await user.getIdToken();
  const tokenResponse = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken })
  });
  
  const { access_token } = await tokenResponse.json();
  
  const response = await fetch(`${API_URL}/api/users/profile`, {
    headers: { 
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
};

export const updateUserPlan = async (plan: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const idToken = await user.getIdToken();
  const tokenResponse = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken })
  });
  
  const { access_token } = await tokenResponse.json();
  
  const response = await fetch(`${API_URL}/api/users/plan`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ plan })
  });
  
  if (!response.ok) throw new Error('Failed to update plan');
  return response.json();
};