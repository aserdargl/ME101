# MEE 101 Ders Portalı

## Öğrenci girişi

Öğrenciler yalnızca öğrenci numaralarını girerek erişir. E-posta, parola, hesap oluşturma, doğrulama veya yönetici onayı gerekmez; özel öğrenci listesi giriş için sorgulanmaz. Baştaki sıfırlar korunur ve aynı sekmede yenileme sonrası giriş sürer. Numara beyanı kimlik doğrulaması değildir. Öğretim üyesinin yetkileri ayrı doğrulanır. Eski hesaplar, başvurular, öğrenci kayıtları, notlar ve puanlar silinmez. Aşağıdaki eski üyelik altyapısı bilgileri korunmuş kayıtların yönetimi içindir; öğrenci girişinde kullanılmaz.

https://aserdargl.github.io/ME101/

## GitHub sitesi ve kişisel Google Drive

Site adresi GitHub Pages üzerinde kalır. 32 KiB üzerindeki gömülü ders dosyaları `drive.file` kapsamıyla öğretim üyesinin Drive hesabındaki **ME101 — Course Files** klasörüne kaydedilir. Ders listesi, küçük içerikler ve dosya adresleri GitHub’da tutulur. Mevcut `data/` kayıtları ve yerel notlar silinmez.

Öğretim üyesi girişinden sonra **Drive’a Bağlan** ile bir kez Google hesabına izin verilir. **Yerel Dersleri Drive’a Aktar / Dersleri Yayımla** önce **ME101 — Backups** altında bağımsız yedeği tamamlar, ardından büyük dosyaları aktarır. Dosyanın boyutu ve Google SHA-256 değeri doğrulanmadan ders adresi değiştirilmez. Yedeklerde mevcut uzak medya için ayrı, özel kopyalar saklanır. Başarısız yüklemeler sonraki denemede kaldığı yerden sürer; kota hatası ücretli plana geçiş başlatmaz.

Mevcut Rust Worker, yalnız yayımlanan ders dosyalarını içerik özetiyle sunar. PDF sayfaları dosyayı tarayıcıda okuyarak görüntülenir; indirme zorunlu değildir. Drive yedekleri bu dosya yolundan sunulmaz. Google yenileme belirteci yalnız sunucu hesabının erişebildiği `portalSettings` kaydındadır; istemci Firestore kuralları bu kayıtlara erişimi kapatır. Google erişim belirteci yalnız öğretim üyesinin sekme belleğinde tutulur.

Google OAuth web istemcisi, mevcut projede `DRIVE_CLIENT_ID` ve Worker gizli ayarı `DRIVE_CLIENT_SECRET` ile yapılandırılır. Tek dönüş adresi `https://lecturenotes-approval.aserdargl.workers.dev/drive/callback` olur. Google uygulaması Testing durumundaysa izin verilen test kullanıcısı eklenmelidir ve Google izinleri dönemsel yenileme gerektirebilir. Kart, R2, yeni faturalandırma hesabı, ücretli plan veya kullandıkça öde açılmaz. Google Drive’ın mevcut depolama ve API kotaları uygulanır.

## Ders ve görselleri tüm cihazlarda yayımlama

1. Mevcut notların bulunduğu tarayıcıda sayfayı açın.
2. **Öğretim Üyesi → Giriş Yap** ekranında mevcut Firebase yönetici hesabınızın e-posta ve parolasını kullanın. Tek giriş ders yayımlamayı, öğrenci listesini ve başvuru yönetimini açar. Sekme yenilendiğinde Firebase oturumu ve yönetici yetkisi yeniden doğrulanır. GitHub girişi gerekmez; GitHub uygulama anahtarı ve kısa süreli yayın belirteci yalnız Rust hizmetinde tutulur. Cloudflare `GITHUB_APP_PRIVATE_KEY` secret alanı uygulamanın PKCS#8 anahtarını içerir. Uygulama yalnız `aserdargl/ME101` deposunda içerik okuma/yazma iznine sahiptir; sunucu yalnız `data/` altında dosya oluşturur, güncel kaynak ağacını korur ve force-push yapmaz.
3. **Yayımla** düğmesine basın. **Kaydet** yerel yedeği korur; **Yayımla** ders dosyalarını ve yedeği mevcut Drive bağlantısıyla kaydeder, ders listesini GitHub’a gönderir. Pages yayını tamamlandığında içerikler diğer cihazlarda da görünür.

Aktarım ilerlemesi parça sayısı ve yüzde olarak gösterilir. Parçalar en fazla üç eşzamanlı istekle gönderilir; tamamlanan parçaların GitHub kimlikleri aynı sekmede saklanır. Yenilemeden sonra Aktar düğmesine tekrar basıldığında aynı içerik için yalnız eksik parçalar gönderilir. Aktarım başlamadan önce yerel yedek kaydedilir.

Ortak ders kaydı `data/manifest.json` ve `data/snapshots/` altında tutulur. Yayın tek Git commit'iyle yapılır; mevcut site dosyaları ve eski kayıtlar korunur. Çakışan notlar silinmez; yerel sürüm ayrı ders olarak korunur. Öğrenci listeleri, parolalar ve kişisel oturum bilgileri ortak ders verisine eklenmez.

## Gizli öğrenci kayıtlarının yönetimi

Site ve ders dosyaları GitHub Pages'te kalır. Öğrenci listesi ve önceki hesap/başvuru belgeleri gizli Firebase koleksiyonlarında korunur; GitHub ders yayınına eklenmez. Listeyi yalnızca doğrulanmış öğretim üyesi okuyup değiştirebilir. Liste ve eski hesap bağları yeni öğrenci girişini sınırlamaz.

- Öğretim üyesi mevcut Firebase e-posta/parola hesabını ve sunucuda doğrulanan `admins/{uid}` yetkisini kullanır.
- Öğrenci Listesi ekranında Excel sütunları veya CSV/TXT ile numara, isim ve soyisim yönetimi devam eder. Mevcut kayıtlar ve eski yerel listeler kendiliğinden değiştirilmez.
- Önceki başvurular yönetici ekranında korunur; yeni öğrenci girişi hesap veya başvuru oluşturmaz.
- Puanlar mevcut yerel depolama anahtarında öğrenci numarasıyla saklanır. Numara girişi mevcut puanları sıfırlamaz.
- GitHub'da yayımlanan ders dosyaları genel erişime açıktır.

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

## PDF sunumları

PowerPoint sunumunu **Dışa Aktar → PDF** ile kaydedip **Ders Ekle** ekranına yükleyin. Her PDF sayfası özgün dosyasına ve sayfa numarasına bağlı bir slayt olur; PNG/JPG dönüşümü yapılmaz. Mozilla PDF.js 6.4.299, çalışanı, yazı tipleri ve yardımcı dosyaları GitHub üzerinde `vendor/pdfjs/` altında barındırılır. Tarayıcı yalnız görünür sayfaları çizer.

Dersi düzenlerken sayfaların arasındaki **+Konu**, **+Sim**, **+Görsel** ve **+PDF** düğmeleriyle içerik ekleyin. PDF sayfaları ile ek slaytlar taşınabilir ve birlikte kaydedilir. **+PDF** başka bir PDF'nin sayfalarını seçilen araya ekler. Varsayılan dosya güncellemesi sona ekler; tüm slaytları değiştirmek ayrıca seçilip onaylanır. Vazgeç işlemi kaydedilmiş içeriği değiştirmez.

PDF sayfasının kendi metni ve görselleri kaynak dosyada düzenlenir; web açıklamaları ayrıca eklenebilir. İndirme düğmesi özgün PDF'yi verir; araya eklenen slaytlar site sunumunda ve ders yedeğinde bulunur. Önceki dersler, notlar, görseller ve özgün PPTX dosyaları korunur; yeni PPTX yükleme ve resim dönüştürme kaldırılmıştır.

## Geliştirme

`npm install` ve `npm test` ile ayrıştırma, içerik koruma ve GitHub yayımlama testleri çalıştırılır. `node tests/preview-server.cjs`, yalnızca ayrı localhost kaydı ve örnek veriler kullanan bir kontrol sayfası açar. Canlı sitede test verisi oluşturulmaz.

Kaynak değişikliklerinden önce uzak dalı alın; `data/` altındaki kullanıcı notlarını koruyun. Site GitHub Pages üzerinde kalır.

### Açılış dosyalarını hazırlama

JavaScript modülleri değiştiğinde yayımlamadan önce `npm run build` çalıştırın. Bu komut kaynak sırasını koruyarak `portal-startup.js` dosyasını oluşturur ve HTML içindeki önbellek sürümünü içeriğe göre günceller. `npm test`, paketin kaynaklarla eşleştiğini de denetler. `firebase-config.js` ayrı kalır; PDF görüntüleyicisi yalnız PDF açılırken GitHub’dan yüklenir.

`node tests/pdf-slides-browser.cjs` ayrı localhost kaynağında PDF önizlemesi, sayfalar arasına ek slayt ve PDF ekleme, sıralama, iptal/kaydetme/yenileme, kayıt koruma ve mobil sunumu denetler. `node tests/presentation-fit.cjs` ile farklı ekran oranları, `node tests/fullscreen.cjs` ile tam ekran davranışı doğrulanır. Sentetik veri kullanılır; canlı kayıtlara yazılmaz.

Kullanıcı canlı açılış ölçümü istediğinde `node tests/live-startup.cjs`, gerçek siteyi temiz ve oturumsuz tarayıcılarda yalnız okuyarak ölçer; sentetik veri eklemez, düğmelere basmaz ve yazma isteklerini engeller. İlk ziyaret ve önbellekli tekrar ziyaret ayrı raporlanır. Sonuçlar `tests/live-startup-results.md` dosyasındadır.

## Slayt görünümü

**Slayt / Notlar** menüsü PDF sayfasını ve varsa ek web açıklamalarını gösterir. PDF sayfasındaki başlık yeniden eklenmez. Sunum, tam ekran, lazer ve kalem araçları aynı slayt sırası üzerinde çalışır.

## Çalışan HTML slaytları

Düzenleyicide sayfaların arasındaki **+HTML** düğmesine basın. Tam HTML/CSS/JavaScript kodunu **HTML / CSS / JavaScript Sayfası** alanına yapıştırın, **Önizlemeyi Çalıştır** ile deneyin ve dersi kaydedin. HTML sayfası PDF sayfalarıyla aynı sırada ilerler. Kod ayrı bir iframe içinde çalışır; portalın kayıtlarına ve yönetici oturumuna erişmez. Küçük önizlemeler kodu çalıştırmaz. PDF dosyasının kendisi değiştirilmez; ek sayfa ders kaydında saklanır.
