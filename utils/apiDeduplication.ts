// utils/apiDeduplication.ts - API çağrılarını tekrar önleme

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class APIDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 dakika

  /**
   * Aynı endpoint'e paralel istekleri birleştirir
   */
  async deduplicate<T>(
    key: string, 
    requestFn: () => Promise<T>, 
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Önce cache'e bak
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      console.log(`📋 Using cached result for: ${key}`);
      return cached.data;
    }

    // Pending request var mı kontrol et
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`⏳ Joining existing request for: ${key}`);
      return pending.promise;
    }

    // Yeni request başlat
    console.log(`🚀 Starting new request for: ${key}`);
    const promise = requestFn()
      .then(result => {
        // Cache'e kaydet
        this.cache.set(key, {
          data: result,
          timestamp: Date.now(),
          ttl
        });
        return result;
      })
      .finally(() => {
        // Pending'den temizle
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Cache'i temizle
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    } else {
      this.cache.clear();
      this.pendingRequests.clear();
    }
  }

  /**
   * Expired cache entries'leri temizle
   */
  cleanup() {
    const now = Date.now();
    
    // Cache cleanup
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // Pending requests cleanup (5 dakikadan eski olanlar)
    for (const [key, request] of this.pendingRequests.entries()) {
      if ((now - request.timestamp) > 5 * 60 * 1000) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// Global instance
export const apiDeduplicator = new APIDeduplicator();

// Cleanup timer (her 10 dakikada bir)
setInterval(() => {
  apiDeduplicator.cleanup();
}, 10 * 60 * 1000);