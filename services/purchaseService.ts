// services/purchaseService.ts - Sadeleştirilmiş plan yapısı

import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { updateUserPlan, getUserProfile } from '@/services/userService';
import API_URL from '@/config';
import { useApiAuthStore } from '@/store/apiAuthStore';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  newPlan?: 'free' | 'premium'; // Standard kaldırıldı
}

export interface RestoreResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  restoredPlan?: 'free' | 'premium'; // Standard kaldırıldı
}

// Map RevenueCat entitlements to plan type - Sadeleştirilmiş
const mapEntitlementsToPlan = (entitlements: any): 'free' | 'premium' => {
  if (!entitlements) return 'free';
  // Sadece premium_access kontrolü - standard_access kaldırıldı
  if (entitlements.premium_access?.isActive) return 'premium';
  return 'free';
};

// Purchase a package with duplicate subscription prevention
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<PurchaseResult> => {
  try {
    // Önce mevcut durumu kontrol et
    const currentCustomerInfo = await Purchases.getCustomerInfo();
    const currentPlan = mapEntitlementsToPlan(currentCustomerInfo.entitlements.active);
    
    // Eğer kullanıcının zaten Premium aboneliği varsa, yeni satın alma işlemini engelle
    if (currentPlan === 'premium') {
      return {
        success: false,
        error: 'User already has an active Premium subscription',
      };
    }
    
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    const newPlan = mapEntitlementsToPlan(customerInfo.entitlements.active);
    
    await syncPurchaseWithBackend(customerInfo, newPlan);
    
    return {
      success: true,
      customerInfo,
      newPlan,
    };
  } catch (error: any) {
    console.error('Purchase failed:', error);
    
    if (error.userCancelled) {
      return {
        success: false,
        error: 'Purchase was cancelled by user',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
};

// Restore purchases
export const restorePurchases = async (): Promise<RestoreResult> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    
    const restoredPlan = mapEntitlementsToPlan(customerInfo.entitlements.active);
    
    // Arka plan senkronizasyonu sadece Premium plan bulunursa yapılır
    if (restoredPlan === 'premium') {
        await syncPurchaseWithBackend(customerInfo, restoredPlan);
    }
    
    return {
      success: true,
      customerInfo,
      restoredPlan,
    };
  } catch (error: any) {
    console.error('Restore failed with error:', error);
    return {
      success: false,
      error: error.message || 'Restore failed',
    };
  }
};

// Sync purchase with backend
const syncPurchaseWithBackend = async (customerInfo: CustomerInfo, newPlan: 'free' | 'premium') => {
  try {
    await updateUserPlan(newPlan);
    await verifyPurchaseWithBackend(customerInfo);
    await getUserProfile(true);
    console.log(`Purchase synced: Plan updated to ${newPlan}`);
  } catch (error) {
    console.error('Failed to sync purchase with backend:', error);
  }
};

// Send purchase verification to backend
const verifyPurchaseWithBackend = async (customerInfo: CustomerInfo) => {
  try {
    const token = useApiAuthStore.getState().jwt;
    if (!token) return;

    await fetch(`${API_URL}/api/users/verify-purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_info: {
          original_app_user_id: customerInfo.originalAppUserId,
          entitlements: customerInfo.entitlements.active,
          latest_expiration_date: customerInfo.latestExpirationDate,
          original_purchase_date: customerInfo.originalPurchaseDate,
        },
      }),
    });
  } catch (error) {
    console.error('Purchase verification error:', error);
  }
};

// Check for any active subscriptions on app start
export const checkSubscriptionStatus = async (): Promise<'free' | 'premium'> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const currentPlan = mapEntitlementsToPlan(customerInfo.entitlements.active);
    
    const backendProfile = await getUserProfile();
    if (backendProfile.plan !== currentPlan) {
      await updateUserPlan(currentPlan);
    }
    
    return currentPlan;
  } catch (error) {
    console.error('Subscription status check failed:', error);
    try {
        const profile = await getUserProfile();
        return profile.plan as 'free' | 'premium';
    } catch(e) {
        return 'free';
    }
  }
};

// Prevent subscription conflicts - Check if user can purchase
export const canPurchaseSubscription = async (): Promise<{
  canPurchase: boolean;
  reason?: string;
  currentPlan?: 'free' | 'premium';
}> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const currentPlan = mapEntitlementsToPlan(customerInfo.entitlements.active);
    
    if (currentPlan === 'premium') {
      return {
        canPurchase: false,
        reason: 'User already has Premium subscription',
        currentPlan,
      };
    }
    
    return {
      canPurchase: true,
      currentPlan,
    };
  } catch (error) {
    console.error('Error checking purchase eligibility:', error);
    return {
      canPurchase: true, // Default to allowing purchase if check fails
      currentPlan: 'free',
    };
  }
};