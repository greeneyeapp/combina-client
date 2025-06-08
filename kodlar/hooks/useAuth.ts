import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebaseConfig';

export function useAuth() {
  // Firebase'den gelen gerçek User objesini veya null değerini tutacağız
  const [user, setUser] = useState<User | null>(null);
  
  // Kimlik doğrulama durumu ilk yüklenirken bunu bileceğiz
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged, Firebase'in anlık kimlik doğrulama durumunu dinleyen
    // bir dinleyicidir (listener). Kullanıcı giriş/çıkış yaptığında veya
    // uygulama ilk açıldığında otomatik olarak tetiklenir.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Firebase'den gelen kullanıcı bilgisini state'imize kaydediyoruz
      setUser(currentUser);
      
      // İlk kontrol tamamlandığında yükleme durumunu false yapıyoruz
      setLoading(false);
    });

    // Component kaldırıldığında (örneğin uygulama kapandığında)
    // performansı artırmak ve hafıza sızıntılarını önlemek için dinleyiciyi kapatıyoruz.
    return () => unsubscribe();
  }, []);

  // Uygulamanın herhangi bir yerinden kullanıcının giriş durumunu ve yüklenme durumunu
  // kontrol edebilmek için bu değerleri döndürüyoruz.
  return { user, loading };
}
