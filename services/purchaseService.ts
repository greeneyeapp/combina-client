// Dosya: kodlar/services/purchaseService.ts (PLATFORM KONTROLÜ KALDIRILMIŞ VERSİYON)

import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { updateUserPlan, getUserProfile } from '@/services/userService';
import API_URL from '@/config';
import { useApiAuthStore } from '@/store/apiAuthStore';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  newPlan?: 'free' | 'standard' | 'premium';
}

export interface RestoreResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  restoredPlan?: 'free' | 'standard' | 'premium';
}

// Purchase a package
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<PurchaseResult> => {
  // --- DÜZELTME: Platform.OS kontrolü tamamen kaldırıldı. ---

  try {
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
  // --- DÜZELTME: Platform.OS kontrolü tamamen kaldırıldı. ---

  try {
    const customerInfo = await Purchases.restorePurchases();

    const restoredPlan = mapEntitlementsToPlan(customerInfo.entitlements.active);

    await syncPurchaseWithBackend(customerInfo, restoredPlan);

    return {
      success: true,
      customerInfo,
      restoredPlan,
    };
  } catch (error: any) {
    console.error('Restore failed:', error);
    return {
      success: false,
      error: error.message || 'Restore failed',
    };
  }
};

// Map RevenueCat entitlements to plan type
const mapEntitlementsToPlan = (entitlements: any): 'free' | 'standard' | 'premium' => {
  if (entitlements.premium_access?.isActive) return 'premium';
  if (entitlements.standard_access?.isActive) return 'standard';
  return 'free';
};

// Sync purchase with backend
const syncPurchaseWithBackend = async (customerInfo: CustomerInfo, newPlan: 'free' | 'standard' | 'premium') => {
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
export const checkSubscriptionStatus = async (): Promise<'free' | 'standard' | 'premium'> => {
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
    // Hata durumunda backend'deki plana güven
    const profile = await getUserProfile();
    return profile.plan as 'free' | 'standard' | 'premium';
  }
};