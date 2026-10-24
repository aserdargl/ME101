# MEE 101 Ders Portalı

https://aserdargl.github.io/ME101/

## Ders ve görselleri tüm cihazlarda yayımlama

1. Mevcut notların bulunduğu tarayıcıda sayfayı açın.
2. Öğretim Üyesi menüsünden **GitHub ile Giriş** seçeneğini kullanın. Yalnızca `ME101` deposuna `Contents: Read and write` izni veren fine-grained GitHub anahtarı kullanılır. Anahtar yalnızca sekmenin belleğinde tutulur.
3. **Yerel Notları GitHub’a Aktar** düğmesine basın. Sonraki düzenlemeler için **Kaydet** yerel yedeği korur; **GitHub’a Yayımla** tamamladığınız değişiklikleri ortak kayda gönderir. Pages yayını tamamlandığında içerikler diğer cihazlarda da görünür.

Ortak ders kaydı `data/manifest.json` ve `data/snapshots/` altında tutulur. Yayın tek Git commit'iyle yapılır; mevcut site dosyaları ve eski kayıtlar korunur. Çakışan notlar silinmez; yerel sürüm ayrı ders olarak korunur. Öğrenci listeleri, parolalar ve kişisel oturum bilgileri ortak ders verisine eklenmez.

## Gizli öğrenci listesi ve Firebase girişi

Site ve ders dosyaları GitHub Pages'te kalır. Öğrenci numarası/ad-soyad listesi yalnızca `lecturenotes-b97ad` projesindeki gizli `studentNumbers` koleksiyonunda tutulur. `registrationRequests`, `numberClaims` ve `enrollments` kayıt/eşleştirme bilgilerini saklar. Bunların hiçbiri GitHub ders yayınına eklenmez. Parolaları Firebase Authentication yönetir. Eski `students` e-posta kayıtları korunur ve çalışmaya devam eder.

- Authentication içinde **Email/Password** etkin, şifresiz e-posta bağlantısı kapalı olmalıdır. Yetkili alan adlarına `aserdargl.github.io` eklenir.
- Firestore için `firestore.rules` yayımlanır. Listeyi yalnızca yetkili yönetici okuyup değiştirebilir. Numara ve ad-soyad sunucu kurallarında eşleştirilir; doğrulanmış öğrenci sadece kendi kaydını okuyabilir. Başka öğrenciler ve anonim ziyaretçiler numara/ad listesini okuyamaz.
- İlk yönetici, Authentication'da kendi e-posta/parola hesabını oluşturup e-postasını doğrular. Proje sahibi Firebase konsolundan `admins/{Firebase-kullanıcı-UID}` belgesini oluşturur. İstemci bu yetkiyi kendisine veremez.
- Öğrenci Listesi ekranında Firebase yönetici hesabıyla giriş yapın. CSV/TXT veya metin biçimi: `öğrenci numarası;ad soyad`. Excel'den bu iki sütun başlıksız yapıştırılabilir; numaraları metin biçiminde tutun. Büyük/küçük harf ve fazla boşluklar ad eşleştirmesini etkilemez; Türkçe harfler korunur. **Listeye Ekle / Güncelle** diğer kayıtları korur. **Listeyi Sıfırla ve Yeniden Tanımla** yeni numara listesini uygular, eski e-posta kayıtlarını silmez. Bir numarayı kaldırmak o numarayla bağlı hesabın ders erişimini kapatır.
- Eski yerel öğrenci listeleri ve oylar silinmez. **Listeyi Kopyala** yerel listeyi kurtarmak için de kullanılabilir; kişisel listeyi kaynak koda veya GitHub'a yapıştırmayın.
- Öğrenci **Hesap Oluştur** ile numarasını, ad-soyadını, istediği e-postayı ve parolayı girer. Eşleşen kayıt, e-posta doğrulandıktan sonra numaraya atomik bağlanır. Eşleşmeyen kayıt gizli `applications` koleksiyonunda yönetici onayını bekler; e-postası doğrulanmış öğrenci karar verilene kadar geçici erişim alır. Geçici kimlik kullanıcı UID'sidir; başka öğrencinin numarasını veya oy kimliğini sahiplenmez.
- **Öğrenci Listesi → Onay Bekleyen Başvurular** bölümünde numara/adı gerektiğinde düzeltip **Onayla** seçilir. Onay numarayı tek hesaba bağlar; başka hesaba bağlı numara devralınamaz. **Reddet ve Hesabı Sil**, başvuruyu reddeder, erişimi keser ve Firebase Authentication hesabını sunucudan siler. Silme geçici olarak başarısızsa durum panelde görünür; 10 dakikalık zamanlayıcı yeniden dener. Aynı e-posta yeni hesapla tekrar geçici erişim alamaz. Yöneticiler bu işlemle silinemez.
- Numara/ad eşleşmesi kimlik kanıtı değildir. Başkasının bilgilerini bilen biri doğrulanmış başka bir e-postayla numarayı ilk sahiplenen kişi olabilir. **Hesap Bağını Sıfırla** yanlış bağlantıyı kaldırır. Spark planı korunur; parolalar yalnız Firebase Authentication'a iletilir.
- GitHub'da yayımlanan ders dosyaları genel erişime açıktır. Firebase erişim kuralları öğrenci listesini korur; GitHub'daki dosya adreslerini özel dosyalara dönüştürmez.

`npm test` uygulama testlerini; `npm run test:firebase` Java 21+ ile ayrı `demo-lecturenotes` emülatöründe izin kurallarını çalıştırır. Canlı projede sentetik öğrenci oluşturulmaz. Dağıtım için yalnızca Firestore kuralları kullanılır; Firebase Hosting yapılandırılmaz. `firebase-config.js` yalnızca herkese açık uygulama tanımlayıcılarını içerir; servis hesabı anahtarı eklemeyin.

## Cloudflare onay hizmeti

`approval-worker/` Rust ile yazılmış, Cloudflare Workers Free üzerinde çalışan yalnızca onay/ret hizmetidir. Site ve dersler GitHub'da, özel öğrenci kayıtları Firebase'de kalır. Tarayıcı Firebase oturum belirtecini gönderir; Worker güncel kullanıcıyı ve `admins/{uid}` kaydını sunucuda doğrular. CORS yalnız GitHub Pages kaynağına açıktır.

- `lecture-approval` hizmet hesabı yalnız LectureNotes projesinde kullanıcı okuma/silme ve gerekli Firestore belge izinlerine sahiptir. JSON anahtar yalnız Cloudflare `FIREBASE_SERVICE_ACCOUNT` secret alanına konur; depoya, tarayıcıya veya loga eklenmez.
- Derleme: `rustup target add wasm32-unknown-unknown`, `cargo install worker-build --version 0.8.7 --locked`, ardından `approval-worker` içinde `npx wrangler deploy`. `firebase-config.js` içindeki `MEE101_APPROVAL_URL` yayımlanan Worker adresidir. Ücretli plana geçiş gerekmez.
- Yerel test: `demo-lecturenotes` Authentication 9099 ve Firestore 8088 emülatörlerini başlatın. `approval-worker` içinde `npx wrangler dev --env test --local --ip 127.0.0.1 --port 8787 --test-scheduled`, sonra kökten `npm run test:approval`. Test modu yalnız demo proje kimliğiyle çalışır. Gerçek kullanıcı silinmez.

## PPTX görsellerini onarma

Dersi düzenlerken özgün PPTX'i seçip **Görselleri Onar · Notları Koru** seçeneğini kullanın. Slaytlar kaynak dosya yolu veya benzersiz başlıkla eşleştirilir; güvenle eşleşmeyen slaytlar değiştirilmez. Desteklenen tüm gömülü resimler alınır. Yeni dosyalar kalıcı veri adresleriyle saklanır; geçici `blob:` adresleri kaydedilmez.

Tarayıcının doğrudan gösteremediği EMF/WMF/TIFF görselleri ve PowerPoint grafik/SmartArt nesneleri için uyarı gösterilir. Bu tür slaytların birebir PowerPoint görünümü için PNG/JPG olarak dışa aktarılmış slayt görselleri kullanılabilir. Özgün içerik ve notlar otomatik silinmez.

## Geliştirme

`npm install` ve `npm test` ile ayrıştırma, içerik koruma ve GitHub yayımlama testleri çalıştırılır. `node tests/preview-server.cjs`, yalnızca ayrı localhost kaydı ve örnek veriler kullanan bir kontrol sayfası açar. Canlı sitede test verisi oluşturulmaz.

Kaynak değişikliklerinden önce uzak dalı alın; `data/` altındaki kullanıcı notlarını koruyun. Site GitHub Pages üzerinde kalır.
