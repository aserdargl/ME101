# MEE 101 Ders Portalı

https://aserdargl.github.io/ME101/

## Ders ve görselleri tüm cihazlarda yayımlama

1. Mevcut notların bulunduğu tarayıcıda sayfayı açın.
2. Öğretim Üyesi menüsünden **GitHub ile Giriş** seçeneğini kullanın. Yalnızca `ME101` deposuna `Contents: Read and write` izni veren fine-grained GitHub anahtarı kullanılır. Anahtar yalnızca sekmenin belleğinde tutulur.
3. **Yerel Notları GitHub’a Aktar** düğmesine basın. Sonraki düzenlemeler için **Kaydet** yerel yedeği korur; **GitHub’a Yayımla** tamamladığınız değişiklikleri ortak kayda gönderir. Pages yayını tamamlandığında içerikler diğer cihazlarda da görünür.

Ortak ders kaydı `data/manifest.json` ve `data/snapshots/` altında tutulur. Yayın tek Git commit'iyle yapılır; mevcut site dosyaları ve eski kayıtlar korunur. Çakışan notlar silinmez; yerel sürüm ayrı ders olarak korunur. Öğrenci listeleri, parolalar ve kişisel oturum bilgileri ortak ders verisine eklenmez.

## PPTX görsellerini onarma

Dersi düzenlerken özgün PPTX'i seçip **Görselleri Onar · Notları Koru** seçeneğini kullanın. Slaytlar kaynak dosya yolu veya benzersiz başlıkla eşleştirilir; güvenle eşleşmeyen slaytlar değiştirilmez. Desteklenen tüm gömülü resimler alınır. Yeni dosyalar kalıcı veri adresleriyle saklanır; geçici `blob:` adresleri kaydedilmez.

Tarayıcının doğrudan gösteremediği EMF/WMF/TIFF görselleri ve PowerPoint grafik/SmartArt nesneleri için uyarı gösterilir. Bu tür slaytların birebir PowerPoint görünümü için PNG/JPG olarak dışa aktarılmış slayt görselleri kullanılabilir. Özgün içerik ve notlar otomatik silinmez.

## Geliştirme

`npm install` ve `npm test` ile ayrıştırma, içerik koruma ve GitHub yayımlama testleri çalıştırılır. `node tests/preview-server.cjs`, yalnızca ayrı localhost kaydı ve örnek veriler kullanan bir kontrol sayfası açar. Canlı sitede test verisi oluşturulmaz.

Kaynak değişikliklerinden önce uzak dalı alın; `data/` altındaki kullanıcı notlarını koruyun. Site GitHub Pages üzerinde kalır.
