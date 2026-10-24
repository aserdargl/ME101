# MEE 101 Ders Portalı

https://aserdargl.github.io/ME101/

## Ders ve görselleri tüm cihazlarda yayımlama

1. Mevcut notların bulunduğu tarayıcıda sayfayı açın.
2. Öğretim Üyesi menüsünden **GitHub ile Giriş** seçeneğini kullanın. Yalnızca `ME101` deposuna `Contents: Read and write` izni veren fine-grained GitHub anahtarı kullanılır. Anahtar yalnızca sekmenin belleğinde tutulur.
3. **Yerel Notları GitHub’a Aktar** düğmesine basın. Sonraki düzenlemeler için **Kaydet** yerel yedeği korur; **GitHub’a Yayımla** tamamladığınız değişiklikleri ortak kayda gönderir. Pages yayını tamamlandığında içerikler diğer cihazlarda da görünür.

Ortak ders kaydı `data/manifest.json` ve `data/snapshots/` altında tutulur. Yayın tek Git commit'iyle yapılır; mevcut site dosyaları ve eski kayıtlar korunur. Çakışan notlar silinmez; yerel sürüm ayrı ders olarak korunur. Öğrenci listeleri, parolalar ve kişisel oturum bilgileri ortak ders verisine eklenmez.

## Gizli öğrenci listesi ve Firebase girişi

Site ve ders dosyaları GitHub Pages'te kalır. Öğrenci kayıtları yalnızca `lecturenotes-b97ad` Firebase projesinin Firestore veritabanındaki `students/{küçük-harf-e-posta}` belgelerinde tutulur; GitHub ders yayımlama akışına eklenmez. Parolaları Firebase Authentication yönetir.

- Authentication içinde **Email/Password** etkin, şifresiz e-posta bağlantısı kapalı olmalıdır. Yetkili alan adlarına `aserdargl.github.io` eklenir.
- Firestore için `firestore.rules` yayımlanır. Listeyi yalnızca yetkili yönetici okuyup değiştirebilir. E-postasını doğrulamış öğrenci sadece kendi belgesini okuyabilir.
- İlk yönetici, Authentication'da kendi e-posta/parola hesabını oluşturup e-postasını doğrular. Proje sahibi Firebase konsolundan `admins/{Firebase-kullanıcı-UID}` belgesini oluşturur. İstemci bu yetkiyi kendisine veremez.
- Öğrenci Listesi ekranında Firebase yönetici hesabıyla giriş yapın. CSV/TXT veya metin biçimi: `e-posta;öğrenci numarası;ad soyad`. **Listeye Ekle / Güncelle** diğer kayıtları korur. **Listeyi Sıfırla ve Yeniden Tanımla** yalnızca yeni listedekileri bırakır. Bir kaydı kaldırmak o öğrencinin uygulamadaki giriş iznini kaldırır; açık oturumlar da ortak kayıttaki değişikliği izler.
- Eski yerel öğrenci listeleri ve oylar silinmez. **Listeyi Kopyala** yerel listeyi kurtarmak için de kullanılabilir; kişisel listeyi kaynak koda veya GitHub'a yapıştırmayın. E-posta bulunmayan eski kayıtlara e-posta eklemek gerekir.
- Öğrenci **Hesap Oluştur** ile kaydolur, doğrulama e-postasını açar ve sonra giriş yapar. Hesap oluşturmak tek başına ders izni vermez; etkin liste kaydı da gereklidir.
- GitHub'da yayımlanan ders dosyaları genel erişime açıktır. Firebase erişim kuralları öğrenci listesini korur; GitHub'daki dosya adreslerini özel dosyalara dönüştürmez.

`npm test` uygulama testlerini; `npm run test:firebase` Java 21+ ile ayrı `demo-lecturenotes` emülatöründe izin kurallarını çalıştırır. Canlı projede sentetik öğrenci oluşturulmaz. Dağıtım için yalnızca Firestore kuralları kullanılır; Firebase Hosting yapılandırılmaz. `firebase-config.js` yalnızca herkese açık uygulama tanımlayıcılarını içerir; servis hesabı anahtarı eklemeyin.

## PPTX görsellerini onarma

Dersi düzenlerken özgün PPTX'i seçip **Görselleri Onar · Notları Koru** seçeneğini kullanın. Slaytlar kaynak dosya yolu veya benzersiz başlıkla eşleştirilir; güvenle eşleşmeyen slaytlar değiştirilmez. Desteklenen tüm gömülü resimler alınır. Yeni dosyalar kalıcı veri adresleriyle saklanır; geçici `blob:` adresleri kaydedilmez.

Tarayıcının doğrudan gösteremediği EMF/WMF/TIFF görselleri ve PowerPoint grafik/SmartArt nesneleri için uyarı gösterilir. Bu tür slaytların birebir PowerPoint görünümü için PNG/JPG olarak dışa aktarılmış slayt görselleri kullanılabilir. Özgün içerik ve notlar otomatik silinmez.

## Geliştirme

`npm install` ve `npm test` ile ayrıştırma, içerik koruma ve GitHub yayımlama testleri çalıştırılır. `node tests/preview-server.cjs`, yalnızca ayrı localhost kaydı ve örnek veriler kullanan bir kontrol sayfası açar. Canlı sitede test verisi oluşturulmaz.

Kaynak değişikliklerinden önce uzak dalı alın; `data/` altındaki kullanıcı notlarını koruyun. Site GitHub Pages üzerinde kalır.
