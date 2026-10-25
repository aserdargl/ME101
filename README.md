# MEE 101 Ders Portalı

https://aserdargl.github.io/ME101/

## GitHub sitesi ve kişisel Google Drive

Site adresi GitHub Pages üzerinde kalır. 32 KiB üzerindeki gömülü ders dosyaları `drive.file` kapsamıyla öğretim üyesinin Drive hesabındaki **ME101 — Course Files** klasörüne kaydedilir. Ders listesi, küçük içerikler ve dosya adresleri GitHub’da tutulur. Mevcut `data/` kayıtları ve yerel notlar silinmez.

Öğretim üyesi girişinden sonra **Drive’a Bağlan** ile bir kez Google hesabına izin verilir. **Yerel Dersleri Drive’a Aktar / Dersleri Yayımla** önce **ME101 — Backups** altında bağımsız yedeği tamamlar, ardından büyük dosyaları aktarır. Dosyanın boyutu ve Google SHA-256 değeri doğrulanmadan ders adresi değiştirilmez. Yedeklerde mevcut uzak medya için ayrı, özel kopyalar saklanır. Başarısız yüklemeler sonraki denemede kaldığı yerden sürer; kota hatası ücretli plana geçiş başlatmaz.

Mevcut Rust Worker, yalnız yayımlanan ders dosyalarını içerik özetiyle sunar. Böylece mevcut PPTX görüntüleyicisi dosyayı tarayıcıda okumaya devam eder; indirme zorunlu değildir. Drive yedekleri bu dosya yolundan sunulmaz. Google yenileme belirteci yalnız sunucu hesabının erişebildiği `portalSettings` kaydındadır; istemci Firestore kuralları bu kayıtlara erişimi kapatır. Google erişim belirteci yalnız öğretim üyesinin sekme belleğinde tutulur.

Google OAuth web istemcisi, mevcut projede `DRIVE_CLIENT_ID` ve Worker gizli ayarı `DRIVE_CLIENT_SECRET` ile yapılandırılır. Tek dönüş adresi `https://lecturenotes-approval.aserdargl.workers.dev/drive/callback` olur. Google uygulaması Testing durumundaysa izin verilen test kullanıcısı eklenmelidir ve Google izinleri dönemsel yenileme gerektirebilir. Kart, R2, yeni faturalandırma hesabı, ücretli plan veya kullandıkça öde açılmaz. Google Drive’ın mevcut depolama ve API kotaları uygulanır.

## Ders ve görselleri tüm cihazlarda yayımlama

1. Mevcut notların bulunduğu tarayıcıda sayfayı açın.
2. **Öğretim Üyesi → Giriş Yap** ekranında mevcut Firebase yönetici hesabınızın e-posta ve parolasını kullanın. Tek giriş ders yayımlamayı, öğrenci listesini ve başvuru yönetimini açar. Sekme yenilendiğinde Firebase oturumu ve yönetici yetkisi yeniden doğrulanır. GitHub girişi gerekmez; GitHub uygulama anahtarı ve kısa süreli yayın belirteci yalnız Rust hizmetinde tutulur. Cloudflare `GITHUB_APP_PRIVATE_KEY` secret alanı uygulamanın PKCS#8 anahtarını içerir. Uygulama yalnız `aserdargl/ME101` deposunda içerik okuma/yazma iznine sahiptir; sunucu yalnız `data/` altında dosya oluşturur, güncel kaynak ağacını korur ve force-push yapmaz.
3. **Yayımla** düğmesine basın. **Kaydet** yerel yedeği korur; **Yayımla** ders dosyalarını ve yedeği mevcut Drive bağlantısıyla kaydeder, ders listesini GitHub’a gönderir. Pages yayını tamamlandığında içerikler diğer cihazlarda da görünür.

Aktarım ilerlemesi parça sayısı ve yüzde olarak gösterilir. Parçalar en fazla üç eşzamanlı istekle gönderilir; tamamlanan parçaların GitHub kimlikleri aynı sekmede saklanır. Yenilemeden sonra Aktar düğmesine tekrar basıldığında aynı içerik için yalnız eksik parçalar gönderilir. Aktarım başlamadan önce yerel yedek kaydedilir.

Ortak ders kaydı `data/manifest.json` ve `data/snapshots/` altında tutulur. Yayın tek Git commit'iyle yapılır; mevcut site dosyaları ve eski kayıtlar korunur. Çakışan notlar silinmez; yerel sürüm ayrı ders olarak korunur. Öğrenci listeleri, parolalar ve kişisel oturum bilgileri ortak ders verisine eklenmez.

## Gizli öğrenci listesi ve öğrenci girişi

Site ve ders dosyaları GitHub Pages'te kalır. Öğrenci numarası/ad-soyad listesi yalnızca `lecturenotes-b97ad` projesindeki gizli `studentNumbers` koleksiyonunda tutulur. `registrationRequests`, `numberClaims` ve `enrollments` kayıt/eşleştirme bilgilerini saklar. Bunların hiçbiri GitHub ders yayınına eklenmez. Parolaları Firebase Authentication yönetir. Eski `students` e-posta kayıtları korunur ve çalışmaya devam eder.

- Authentication içinde **Email/Password** etkin, şifresiz e-posta bağlantısı kapalı olmalıdır. Yetkili alan adlarına `aserdargl.github.io` eklenir.
- Firestore için `firestore.rules` yayımlanır. Listeyi yalnızca yetkili yönetici okuyup değiştirebilir. Numara ve ad-soyad sunucu kurallarında eşleştirilir; doğrulanmış öğrenci sadece kendi kaydını okuyabilir. Başka öğrenciler ve anonim ziyaretçiler numara/ad listesini okuyamaz.
- İlk yönetici, Authentication'da kendi e-posta/parola hesabını oluşturup e-postasını doğrular. Proje sahibi Firebase konsolundan `admins/{Firebase-kullanıcı-UID}` belgesini oluşturur. İstemci bu yetkiyi kendisine veremez.
- Tek öğretim üyesi girişinden sonra Öğrenci Listesi ekranını açın. CSV/TXT veya metin biçimi: `öğrenci numarası;ad soyad`. Excel'den bu iki sütun başlıksız yapıştırılabilir; numaraları metin biçiminde tutun. Büyük/küçük harf ve fazla boşluklar ad eşleştirmesini etkilemez; Türkçe harfler korunur. **Listeye Ekle / Güncelle** diğer kayıtları korur. **Listeyi Sıfırla ve Yeniden Tanımla** yeni numara listesini uygular, eski e-posta kayıtlarını silmez. Bir numarayı kaldırmak o numarayla bağlı hesabın ders erişimini kapatır.
- Eski yerel öğrenci listeleri ve oylar silinmez. **Listeyi Kopyala** yerel listeyi kurtarmak için de kullanılabilir; kişisel listeyi kaynak koda veya GitHub'a yapıştırmayın.
- Öğrenci **Hesap Oluştur** ile numarasını, ad-soyadını, istediği e-postayı ve parolayı girer. Eşleşen kayıt, e-posta doğrulandıktan sonra numaraya atomik bağlanır. Eşleşmeyen kayıt gizli `applications` koleksiyonunda yönetici onayını bekler; e-postası doğrulanmış öğrenci karar verilene kadar geçici erişim alır. Geçici kimlik kullanıcı UID'sidir; başka öğrencinin numarasını veya oy kimliğini sahiplenmez.
- **Öğrenci Listesi → Onay Bekleyen Başvurular** bölümünde numara/adı gerektiğinde düzeltip **Onayla** seçilir. Onay numarayı tek hesaba bağlar; başka hesaba bağlı numara devralınamaz. **Reddet ve Hesabı Sil**, başvuruyu reddeder, erişimi keser ve Firebase Authentication hesabını sunucudan siler. Silme geçici olarak başarısızsa durum panelde görünür; 10 dakikalık zamanlayıcı yeniden dener. Aynı e-posta yeni hesapla tekrar geçici erişim alamaz. Yöneticiler bu işlemle silinemez.
- Numara/ad eşleşmesi kimlik kanıtı değildir. Başkasının bilgilerini bilen biri doğrulanmış başka bir e-postayla numarayı ilk sahiplenen kişi olabilir. **Hesap Bağını Sıfırla** yanlış bağlantıyı kaldırır. Spark planı korunur; parolalar yalnız Firebase Authentication'a iletilir.
- GitHub'da yayımlanan ders dosyaları genel erişime açıktır. Firebase erişim kuralları öğrenci listesini korur; GitHub'daki dosya adreslerini özel dosyalara dönüştürmez.

`npm test` uygulama testlerini; `npm run test:firebase` Java 21+ ile ayrı `demo-lecturenotes` emülatöründe izin kurallarını çalıştırır. Canlı projede sentetik öğrenci oluşturulmaz. Dağıtım için yalnızca Firestore kuralları kullanılır; Firebase Hosting yapılandırılmaz. `firebase-config.js` yalnızca herkese açık uygulama tanımlayıcılarını içerir; servis hesabı anahtarı eklemeyin.

## Tek öğretim üyesi girişi ve onay hizmeti

`approval-worker/` Rust ile yazılmış, Cloudflare Workers Free üzerinde çalışan giriş ve onay/ret hizmetidir. Site ve dersler GitHub'da, özel öğrenci kayıtları Firebase'de kalır. Tarayıcı Firebase oturum belirtecini gönderir; Worker güncel kullanıcıyı ve `admins/{uid}` kaydını sunucuda doğrular. CORS yalnız GitHub Pages kaynağına açıktır.

- `lecture-approval` hizmet hesabı yalnız LectureNotes projesinde kullanıcı okuma/silme ve gerekli Firestore belge izinlerine sahiptir. JSON anahtar yalnız Cloudflare `FIREBASE_SERVICE_ACCOUNT` secret alanına konur; depoya, tarayıcıya veya loga eklenmez.
- Derleme: `rustup target add wasm32-unknown-unknown`, `cargo install worker-build --version 0.8.7 --locked`, ardından `approval-worker` içinde `npx wrangler deploy`. `firebase-config.js` içindeki `MEE101_APPROVAL_URL` yayımlanan Worker adresidir. Ücretli plana geçiş gerekmez.
- Yerel test: `demo-lecturenotes` Authentication 9099 ve Firestore 8088 emülatörlerini başlatın. `approval-worker` içinde `npx wrangler dev --env test --local --ip 127.0.0.1 --port 8787 --test-scheduled`, sonra kökten `npm run test:approval`. Test modu yalnız demo proje kimliğiyle çalışır. Gerçek kullanıcı silinmez.

## GitHub hesabıyla giriş

GitHub App `lecturenotes-publisher-aserdargl` yalnız `aserdargl` hesabına kurulabilir. İzinleri Contents read/write ve zorunlu Metadata read ile sınırlıdır; kurulumda yalnız ME101 seçilidir. OAuth tokenı ayrıca ME101 depo kimliğiyle sınırlandırılır. GitHub App Client ID herkese açık yapılandırmadır; Client Secret yalnız Worker `GITHUB_CLIENT_SECRET` gizli ayarında saklanır. GitHub App özel anahtarı gerekmez.

Giriş akışı mevcut Rust Worker'ın `/github/start` ve `/github/callback` yollarında çalışır. Rastgele state ve PKCE doğrulayıcısı kısa ömürlü Secure/HttpOnly/SameSite=Lax çerezinde saklanır. GitHub sonucu yalnız açılan pencereye, tam site kaynağına ve o girişin benzersiz kimliğine bağlı olarak iletilir. Token URL'ye veya kalıcı tarayıcı kaydına eklenmez. Giriş otomatik ders yayını yapmaz; mevcut aktar/yayımla işlemi ve çakışma koruması devam eder. Cloudflare Free ve Firebase Spark planları değişmez.

`npm test` pencere kaynağı ve sahte mesaj kontrollerini de çalıştırır. Yerel Rust Worker `--env test` ile açıkken `node --test tests/github-oauth-worker.cjs` yalnız sentetik yerel GitHub sunucusuyla state/PKCE, hesap ve yazma izni denetimlerini sınar. Gerçek GitHub'a test dersi yayımlanmaz.

GitHub OAuth dönüşü önce sabit depo sahibi hesabını ve ME101 yazma yetkisini doğrular. `FIREBASE_ADMIN_UID` mevcut Firebase yönetici UID'sidir; hesap var, e-postası doğrulanmış, etkin ve `admins/{uid}` belgesi mevcut olmadan giriş verilmez. Beş dakikalık Firebase özel giriş belirteci mevcut UID'yi kullanır. Öğrenci, başvuru, not ve yetki belgeleri oluşturulmaz veya taşınmaz. Yerel yönetici parola ayarları korunur, birleşik girişte kullanılmaz. Çıkış iki oturumu da kapatır.

Birleşik giriş testi: demo emülatörlerini başlatıp `node tests/instructor-fixtures.cjs` çalıştırın. Bu komut yalnız yerel demo hesabını, örnek listeyi ve göz ardı edilen `.dev.vars.test` test anahtarını hazırlar. Worker'ı `--env test --local --port 8797` ile başlatın, ardından `node --test tests/instructor-worker.cjs` çalıştırın. Tarayıcı testi için `MEE101_QA_PORT=4197`, `MEE101_QA_INSTRUCTOR=1` ile önizleme sunucusunu çalıştırın. Firestore kural testleri aynı demo veritabanını temizlediği için bu testlerden önce ve ayrı çalıştırılır.

## PPTX görsellerini onarma

PPTX seçildiğinde slaytlar tarayıcıdaki görüntüleyiciyle doğrudan açılır. Tema, yazı biçimleri, özgün nesne konumları ve sayfa oranı kaynak dosyadan okunur; PNG/ZIP hazırlama veya ek dönüştürme işlemi gerekmez. Görüntüleyici dosyaları GitHub’da `vendor/pptx-renderer/` altında barındırılır.

Mevcut derslerde özgün PPTX varsa slaytlar kaynak slayt yolu veya benzersiz başlıkla eşleştirilir. Görüntüleme kayıtlı HTML notlarını, ders sırasını, özel görselleri veya kullanıcı ayarlarını değiştirmez. Tarayıcıda bulunmayan ve dosyaya gömülmemiş yazı tipleri için sistem yazı tipi kullanılır. Özgün PowerPoint dosyası indirmeye açık kalır.

Dersi düzenlerken özgün PPTX'i seçip **Görselleri Onar · Notları Koru** seçeneğini kullanın. Slaytlar kaynak dosya yolu veya benzersiz başlıkla eşleştirilir; güvenle eşleşmeyen slaytlar değiştirilmez. Desteklenen tüm gömülü resimler alınır. Yeni dosyalar kalıcı veri adresleriyle saklanır; geçici `blob:` adresleri kaydedilmez.

Tarayıcının doğrudan gösteremediği EMF/WMF/TIFF görselleri ve PowerPoint grafik/SmartArt nesneleri için uyarı gösterilir. Bu tür slaytların birebir PowerPoint görünümü için PNG/JPG olarak dışa aktarılmış slayt görselleri kullanılabilir. Özgün içerik ve notlar otomatik silinmez.

## Geliştirme

`npm install` ve `npm test` ile ayrıştırma, içerik koruma ve GitHub yayımlama testleri çalıştırılır. `node tests/preview-server.cjs`, yalnızca ayrı localhost kaydı ve örnek veriler kullanan bir kontrol sayfası açar. Canlı sitede test verisi oluşturulmaz.

Kaynak değişikliklerinden önce uzak dalı alın; `data/` altındaki kullanıcı notlarını koruyun. Site GitHub Pages üzerinde kalır.

### Açılış dosyalarını hazırlama

JavaScript modülleri değiştiğinde yayımlamadan önce `npm run build` çalıştırın. Bu komut kaynak sırasını koruyarak `portal-startup.js` dosyasını oluşturur ve HTML içindeki önbellek sürümünü içeriğe göre günceller. `npm test`, paketin kaynaklarla eşleştiğini de denetler. `firebase-config.js` ayrı kalır; ZIP okuyucusu yalnız dosya içe aktarılırken GitHub’dan yüklenir.

`PLAYWRIGHT_MODULE` Playwright kurulum yolunu gösterirken `node tests/startup-performance.cjs` ayrı localhost kaynağında beş soğuk açılış ölçer. `STARTUP_BEFORE=1` önceki yayını, `STARTUP_VERIFY=1` düzenleyicide açma/iptal/kaydetme/yenileme, kayıt koruma, ZIP içe aktarma ve katalog görünümü eşitliğini denetler. Sentetik veri kullanılır; canlı kayıtlara yazılmaz.

Kullanıcı canlı açılış ölçümü istediğinde `node tests/live-startup.cjs`, gerçek siteyi temiz ve oturumsuz tarayıcılarda yalnız okuyarak ölçer; sentetik veri eklemez, düğmelere basmaz ve yazma isteklerini engeller. İlk ziyaret ve önbellekli tekrar ziyaret ayrı raporlanır. Sonuçlar `tests/live-startup-results.md` dosyasındadır.

## Resim görünümü

Ders, slayt ve sunum kontrollerindeki **Resim / Web / PPT** açılır menüsü PPTX slaytlarını tarayıcıda PNG olarak gösterir. Her ders açılışı resim görünümünde başlar. Açık derste seçilen görünüm sonraki slaytlara da uygulanır; eski kayıtlar silinmez. Web/PPT görünümleri, HTML notları, etkileşimli içerik ve özgün PPTX dosyaları korunur. Resimler yalnız görüntüleme belleğinde üretilir; ders kaydı değiştirilmez. Dönüşüm mevcut PPTX görüntüleyicisini kullanır; PowerPoint masaüstü dışa aktarımı değildir. Dönüşüm başarısızsa mevcut slayt görünümü korunur.
