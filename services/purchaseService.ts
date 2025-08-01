// services/purchaseService.ts - Gelişmiş Plan Yönetimi

import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { updateUserPlan, getUserProfile } from '@/services/userService';
import API_URL from '@/config';
import { useApiAuthStore } from '@/store/apiAuthStore';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  newPlan?: 'free' | 'premium';
  planType?: 'monthly' | 'yearly';
  isUpgrade?: boolean;
  isDowngrade?: boolean;
}

// Detailed plan mapping with subscription type
const mapEntitlementsToDetailedPlan = (entitlements: any): {
  plan: 'free' | 'premium';
  type: 'monthly' | 'yearly' | null;
  productIdentifier: string | null;
} => {
  if (!entitlements?.premium_access?.isActive) {
    return { plan: 'free', type: null, productIdentifier: null };
  }

  const productId = entitlements.premium_access.productIdentifier?.toLowerCase() || '';

  if (productId.includes('annual') || productId.includes('yearly')) {
    return {
      plan: 'premium',
      type: 'yearly',
      productIdentifier: entitlements.premium_access.productIdentifier
    };
  } else if (productId.includes('monthly')) {
    return {
      plan: 'premium',
      type: 'monthly',
      productIdentifier: entitlements.premium_access.productIdentifier
    };
  }

  return {
    plan: 'premium',
    type: 'monthly', // Default fallback
    productIdentifier: entitlements.premium_access.productIdentifier
  };
};

// Get package type from identifier
const getPackageType = (pkg: PurchasesPackage): 'monthly' | 'yearly' | null => {
  const id = pkg.identifier.toLowerCase();
  if (id.includes('annual') || id.includes('yearly')) return 'yearly';
  if (id.includes('monthly')) return 'monthly';
  return null;
};

// Enhanced purchase with plan transition logic
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<PurchaseResult> => {
  try {
    // Get current subscription status
    const currentCustomerInfo = await Purchases.getCustomerInfo();
    const currentPlanInfo = mapEntitlementsToDetailedPlan(currentCustomerInfo.entitlements.active);
    const newPackageType = getPackageType(packageToPurchase);

    // Determine transition type
    const isUpgrade = currentPlanInfo.plan === 'free' ||
      (currentPlanInfo.type === 'monthly' && newPackageType === 'yearly');
    const isDowngrade = currentPlanInfo.type === 'yearly' && newPackageType === 'monthly';
    const isDuplicate = currentPlanInfo.plan === 'premium' &&
      currentPlanInfo.type === newPackageType;

    // Handle duplicate subscription attempt
    if (isDuplicate) {
      return {
        success: false,
        error: `User already has an active Premium ${currentPlanInfo.type} subscription`,
        planType: currentPlanInfo.type,
      };
    }

    // Handle downgrade (requires special handling)
    if (isDowngrade) {
      return {
        success: false,
        error: 'DOWNGRADE_REQUIRED',
        isDowngrade: true,
        planType: newPackageType,
      };
    }

    // Proceed with purchase/upgrade
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    const newPlanInfo = mapEntitlementsToDetailedPlan(customerInfo.entitlements.active);

    await syncPurchaseWithBackend(customerInfo, newPlanInfo.plan);

    return {
      success: true,
      customerInfo,
      newPlan: newPlanInfo.plan,
      planType: newPlanInfo.type,
      isUpgrade,
      isDowngrade: false,
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

// Restore purchases function
export const restorePurchases = async (): Promise<PurchaseResult> => {
  try {
    console.log('🔄 Restoring purchases...');

    // Restore purchases through RevenueCat
    const customerInfo = await Purchases.restorePurchases();
    const planInfo = mapEntitlementsToDetailedPlan(customerInfo.entitlements.active);

    // Sync with backend
    await syncPurchaseWithBackend(customerInfo, planInfo.plan);

    console.log(`✅ Purchases restored: Plan is ${planInfo.plan}`);

    return {
      success: true,
      customerInfo,
      newPlan: planInfo.plan,
      planType: planInfo.type,
    };
  } catch (error: any) {
    console.error('❌ Restore purchases failed:', error);

    return {
      success: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
};

// Get current customer info
export const getCurrentCustomerInfo = async (): Promise<{
  plan: 'free' | 'premium';
  type: 'monthly' | 'yearly' | null;
  hasActiveSubscription: boolean;
}> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const planInfo = mapEntitlementsToDetailedPlan(customerInfo.entitlements.active);

    return {
      plan: planInfo.plan,
      type: planInfo.type,
      hasActiveSubscription: planInfo.plan === 'premium',
    };
  } catch (error) {
    console.error('Error getting customer info:', error);
    return {
      plan: 'free',
      type: null,
      hasActiveSubscription: false,
    };
  }
};

// Check if user has active entitlements
export const checkEntitlements = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active.premium_access?.isActive || false;
  } catch (error) {
    console.error('Error checking entitlements:', error);
    return false;
  }
};

// Check subscription transition possibility
export const canTransitionToPlan = async (targetPackage: PurchasesPackage): Promise<{
  canTransition: boolean;
  currentPlan: string;
  targetPlan: string;
  transitionType: 'upgrade' | 'downgrade' | 'duplicate' | 'new';
  requiresManualDowngrade?: boolean;
  message?: string;
}> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const currentPlanInfo = mapEntitlementsToDetailedPlan(customerInfo.entitlements.active);
    const targetType = getPackageType(targetPackage);

    const currentPlan = currentPlanInfo.plan === 'free' ? 'free' : `premium_${currentPlanInfo.type}`;
    const targetPlan = `premium_${targetType}`;

    // Free to Premium - Always allowed
    if (currentPlanInfo.plan === 'free') {
      return {
        canTransition: true,
        currentPlan,
        targetPlan,
        transitionType: 'new',
        message: 'New subscription'
      };
    }

    // Same plan type - Duplicate
    if (currentPlanInfo.type === targetType) {
      return {
        canTransition: false,
        currentPlan,
        targetPlan,
        transitionType: 'duplicate',
        message: `You already have an active Premium ${currentPlanInfo.type} subscription`
      };
    }

    // Monthly to Yearly - Upgrade (Allowed)
    if (currentPlanInfo.type === 'monthly' && targetType === 'yearly') {
      return {
        canTransition: true,
        currentPlan,
        targetPlan,
        transitionType: 'upgrade',
        message: 'Upgrade to yearly plan'
      };
    }

    // Yearly to Monthly - Downgrade (Requires manual management)
    if (currentPlanInfo.type === 'yearly' && targetType === 'monthly') {
      return {
        canTransition: false,
        currentPlan,
        targetPlan,
        transitionType: 'downgrade',
        requiresManualDowngrade: true,
        message: 'Downgrade requires manual management through App Store'
      };
    }

    return {
      canTransition: false,
      currentPlan,
      targetPlan,
      transitionType: 'duplicate',
      message: 'Transition not possible'
    };

  } catch (error) {
    console.error('Error checking transition possibility:', error);
    return {
      canTransition: true, // Default to allowing if check fails
      currentPlan: 'unknown',
      targetPlan: 'unknown',
      transitionType: 'new',
    };
  }
};

// Enhanced subscription management info
export const getSubscriptionManagementInfo = async (): Promise<{
  hasActiveSubscription: boolean;
  currentPlan: 'free' | 'premium';
  planType: 'monthly' | 'yearly' | null;
  canUpgrade: boolean;
  canDowngrade: boolean;
  productIdentifier: string | null;
  expirationDate: string | null;
  willRenew: boolean;
}> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const planInfo = mapEntitlementsToDetailedPlan(customerInfo.entitlements.active);

    const hasActiveSubscription = planInfo.plan === 'premium';
    const canUpgrade = planInfo.type === 'monthly'; // Can upgrade from monthly to yearly
    const canDowngrade = planInfo.type === 'yearly'; // Can downgrade from yearly to monthly (manual)

    const premiumEntitlement = customerInfo.entitlements.active.premium_access;
    const expirationDate = premiumEntitlement?.expirationDate || null;
    const willRenew = premiumEntitlement?.willRenew || false;

    return {
      hasActiveSubscription,
      currentPlan: planInfo.plan,
      planType: planInfo.type,
      canUpgrade,
      canDowngrade,
      productIdentifier: planInfo.productIdentifier,
      expirationDate,
      willRenew,
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return {
      hasActiveSubscription: false,
      currentPlan: 'free',
      planType: null,
      canUpgrade: true,
      canDowngrade: false,
      productIdentifier: null,
      expirationDate: null,
      willRenew: false,
    };
  }
};

// Sync purchase with backend (existing function)
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