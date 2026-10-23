// ============================================================================
// MAK 101 - MAKİNE MÜHENDİSLİĞİNE GİRİŞ | DERS VE SUNUM MOTORU
// ============================================================================

const LECTURES = [
  {
    id: "week-1",
    week: "1. Hafta",
    title: "Makine Mühendisliği Nedir? Tarihçe, Temel Alanlar ve Güç İletimi",
    description:
      "Makine mühendisliğinin tanımı, Sanayi Devrimleri, 5 ana anabilim dalı ve canlı dişli çark mekanizması üzerinde tork-devir simülasyonu.",
    features: ["⚙️ Canlı Dişli Simülasyonu", "📊 Adım Adım Animasyon", "📐 Formüller"],
    slides: [
      {
        kicker: "1. HAFTA • GİRİŞ",
        title: "Makine Mühendisliği Nedir?",
        html: `
          <p class="lead">
            Fizik, matematik ve malzeme bilimi ilkelerini kullanarak <strong>enerji dönüşümü</strong> ve 
            <strong>hareket üreten sistemleri</strong> tasarlayan, analiz eden ve üreten temel mühendislik disiplinidir.
          </p>
          <div class="slide-grid-2">
            <ul class="bullet-list">
              <li class="fragment">
                <span>💡</span>
                <div><strong>Fikirden Ürüne:</strong> Doğadaki enerji kaynaklarını (ısı, akışkan, elektrik) faydalı mekanik işe dönüştürür.</div>
              </li>
              <li class="fragment">
                <span>🛡️</span>
                <div><strong>Güvenlik ve Mukavemet:</strong> Sistemlerin kırılmadan, eğilmeden ve yorulmadan uzun ömürlü çalışmasını sağlar.</div>
              </li>
              <li class="fragment">
                <span>🤖</span>
                <div><strong>Geleceğin Teknolojileri:</strong> Robotik, otonom araçlar, havacılık, biyomekanik ve yenilenebilir enerji sistemlerinin kalbidir.</div>
              </li>
            </ul>
            <div class="info-card fragment">
              <h4>🎯 Bu Derste Neler Öğreneceğiz?</h4>
              <p style="margin-bottom:0.8rem;">
                Bir makine mühendisinin dünyaya nasıl baktığını; kuvvet, gerilme, malzeme seçimi, mekanizmalar ve enerji ilkelerini görsel simülasyonlarla deneyimleyeceğiz.
              </p>
              <div class="formula-box">
                Güç (P) = Tork (T) × Açısal Hız (ω)
                <span class="formula-sub">P [Watt] = T [N·m] × ω [rad/s]</span>
              </div>
            </div>
          </div>
        `
      },
      {
        kicker: "1. HAFTA • TARİHÇE",
        title: "Sanayi Devrimleri ve Makine Mühendisliğinin Evrimi",
        html: `
          <p class="lead">
            İnsanlık tarihindeki her büyük sıçrama, yeni bir makine veya enerji dönüşüm teknolojisiyle başlamıştır:
          </p>
          <div class="slide-grid-3">
            <div class="info-card fragment">
              <h4>🚂 Endüstri 1.0 (1780'ler)</h4>
              <p><strong>Buhar Gücü ve Mekanizasyon:</strong> James Watt'ın buhar makinesini geliştirmesiyle kas gücünden makine gücüne geçiş.</p>
            </div>
            <div class="info-card fragment">
              <h4>⚡ Endüstri 2.0 (1870'ler)</h4>
              <p><strong>Seri Üretim ve İçten Yanmalı Motorlar:</strong> Elektrik enerjisi, montaj hatları, Otto ve Diesel çevrimli motorlar.</p>
            </div>
            <div class="info-card fragment">
              <h4>🦾 Endüstri 3.0 & 4.0 (Günümüz)</h4>
              <p><strong>CNC, Robotik ve Dijital İkiz:</strong> Bilgisayar destekli tasarım (CAD/CAE), eklemeli imalat (3B baskı) ve akıllı fabrikalar.</p>
            </div>
          </div>
          <div class="formula-box fragment" style="margin-top:1.5rem;">
            Mühendislik = Bilimsel Teori + Pratik Tasarım + Ekonomik Üretim
            <span class="formula-sub">İyi bir mühendis, problemi en güvenli ve en optimum maliyetle çözen kişidir.</span>
          </div>
        `
      },
      {
        kicker: "1. HAFTA • ANABİLİM DALLARI",
        title: "Makine Mühendisliğinin 5 Temel Sütunu",
        html: `
          <p class="lead">Bölümümüzde eğitim boyunca karşılaşacağınız 5 ana uzmanlık alanı:</p>
          <ul class="bullet-list">
            <li class="fragment">
              <span>1️⃣</span>
              <div><strong>Konstrüksiyon ve İmalat:</strong> Makine elemanları (dişliler, rulmanlar, miller), CAD tasarımı, talaşlı ve talaşsız üretim yöntemleri.</div>
            </li>
            <li class="fragment">
              <span>2️⃣</span>
              <div><strong>Mekanik (Katı Cisimler Mekaniği):</strong> Statik, mukavemet, sonlu elemanlar analizi (FEA) ve kompozit/metal malzemeler.</div>
            </li>
            <li class="fragment">
              <span>3️⃣</span>
              <div><strong>Termodinamik ve Isı Tekniği:</strong> Isı transferi, akışkanlar mekaniği, motorlar, türbinler, iklimlendirme (HVAC) ve enerji.</div>
            </li>
            <li class="fragment">
              <span>4️⃣</span>
              <div><strong>Makine Teorisi, Sistem Dinamiği ve Kontrol:</strong> Mekanizma tekniği, mekanik titreşimler, mekatronik, otomatik kontrol ve robotik.</div>
            </li>
            <li class="fragment">
              <span>5️⃣</span>
              <div><strong>Otomotiv / Enerji Sistemleri:</strong> Taşıt dinamiği, hibrit/elektrikli güç aktarma organları ve aerodinamik.</div>
            </li>
          </ul>
        `
      },
      {
        kicker: "1. HAFTA • ETKİLEŞİMLİ LABORATUVAR",
        title: "Canlı Simülasyon: Dişli Çarklar, Çevrim Oranı ve Tork İletimi",
        html: `
          <p class="lead">
            Dişli çarklar hızı düşürüp <strong>torku (döndürme momentini) artırmak</strong> veya hızı artırmak için kullanılır. 
            Aşağıdaki sürgüleri değiştirerek dişlilerin dönüşünü canlı inceleyin:
          </p>
          <div class="sim-box interactive-zone" data-sim="gear">
            <div class="sim-header">
              <span class="sim-title">⚙️ İnteraktif Dişli Çark Çifti (i = N₂ / N₁ = ω₁ / ω₂ = T₂ / T₁)</span>
              <span style="font-size:0.8rem; color:#94a3b8;">Sunum sırasında sürgüleri hareket ettirebilirsiniz</span>
            </div>
            <div class="slide-grid-2">
              <div style="display:flex; justify-content:center; align-items:center; background:#070b14; border-radius:10px; padding:0.5rem;">
                <canvas id="gear-canvas" width="460" height="230"></canvas>
              </div>
              <div>
                <div class="sim-controls" style="grid-template-columns:1fr;">
                  <div class="control-group">
                    <label>Giriş Dişlisi Diş Sayısı (N₁): <strong id="val-n1">12 Diş</strong></label>
                    <input type="range" id="inp-n1" min="8" max="24" step="2" value="12" />
                  </div>
                  <div class="control-group">
                    <label>Çıkış Dişlisi Diş Sayısı (N₂): <strong id="val-n2">24 Diş</strong></label>
                    <input type="range" id="inp-n2" min="10" max="36" step="2" value="24" />
                  </div>
                  <div class="control-group">
                    <label>Motor Giriş Devri (n₁): <strong id="val-rpm1">60 d/dk</strong></label>
                    <input type="range" id="inp-rpm1" min="10" max="120" step="5" value="60" />
                  </div>
                  <div class="control-group">
                    <label>Giriş Torku (T₁): <strong id="val-t1">50 N·m</strong></label>
                    <input type="range" id="inp-t1" min="10" max="200" step="10" value="50" />
                  </div>
                </div>
              </div>
            </div>
            <div class="sim-readout">
              <div class="readout-item">
                <span class="readout-label">Çevrim Oranı (i = N₂/N₁)</span>
                <span class="readout-val" id="out-ratio">2.00</span>
              </div>
              <div class="readout-item">
                <span class="readout-label">Çıkış Devri (n₂)</span>
                <span class="readout-val" id="out-rpm2">30.0 d/dk</span>
              </div>
              <div class="readout-item">
                <span class="readout-label">Çıkış Torku (T₂ = i · T₁)</span>
                <span class="readout-val" id="out-t2">100.0 N·m</span>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: "week-2",
    week: "2. Hafta",
    title: "Kuvvet, Moment ve Mukavemet: Kiriş Eğilme Analizi",
    description:
      "Statik denge denklemleri, eğilme momenti kavramı ve ankastre bir kirişin yük altında çökme/gerilme analizi (FEA renk haritası simülasyonu).",
    features: ["📐 Ankastre Kiriş FEA Simülasyonu", "⚖️ Statik Denge", "🧱 Malzeme Seçimi"],
    slides: [
      {
        kicker: "2. HAFTA • STATİK VE MUKAVEMET",
        title: "Kuvvet, Moment ve Statik Denge",
        html: `
          <p class="lead">
            Bir makine parçasının veya yapının yük altında dengede kalabilmesi için Newton'un birinci yasası gereği 
            tüm kuvvetlerin ve momentlerin toplamı sıfır olmalıdır.
          </p>
          <div class="slide-grid-2">
            <div>
              <div class="formula-box fragment">
                ∑ Fₓ = 0 , &nbsp; ∑ Fᵧ = 0 , &nbsp; ∑ M_A = 0
                <span class="formula-sub">Düzlemde Statik Denge Denklemleri</span>
              </div>
              <ul class="bullet-list">
                <li class="fragment">
                  <span>➡️</span>
                  <div><strong>Kuvvet (F [Newton]):</strong> Cisimleri hareket ettirmeye veya şeklini değiştirmeye çalışan etkidir.</div>
                </li>
                <li class="fragment">
                  <span>🔄</span>
                  <div><strong>Moment (M = F · d [N·m]):</strong> Kuvvetin bir dönme noktasına veya mesnete göre oluşturduğu döndürme/eğme etkisidir.</div>
                </li>
              </ul>
            </div>
            <div class="info-card fragment">
              <h4>🔍 Neden Sadece Statik Yetmez?</h4>
              <p>
                Statik dersinde cisimleri <em>rijit (şekil değiştirmeyen)</em> kabul ederiz. Ancak gerçekte her çelik mil, uçak kanadı veya vinç kolu yük altında esner ve içinde <strong>Gerilme (Stress)</strong> oluşur!
              </p>
            </div>
          </div>
        `
      },
      {
        kicker: "2. HAFTA • ETKİLEŞİMLİ LABORATUVAR",
        title: "Canlı Simülasyon: Ankastre Kiriş Eğilme ve Gerilme Analizi",
        html: `
          <p class="lead">
            Sol ucundan duvara sabitlenmiş (ankastre) bir kirişin ucuna <strong>F kuvveti</strong> uygulandığında oluşan 
            çökmeyi ($\delta_{max}$) ve gerilmeyi ($\sigma_{max}$) malzeme değiştirerek test edin:
          </p>
          <div class="sim-box interactive-zone" data-sim="beam">
            <div class="sim-header">
              <span class="sim-title">📊 Ankastre Kiriş FEA Gerilme &amp; Sehim Simülatörü</span>
              <span id="beam-safety-badge" style="font-size:0.8rem; font-weight:700; color:#34d399;">✅ EMNİYETLİ BÖLGE</span>
            </div>
            <div class="slide-grid-2">
              <div style="display:flex; justify-content:center; align-items:center; background:#070b14; border-radius:10px; padding:0.5rem;">
                <canvas id="beam-canvas" width="460" height="220"></canvas>
              </div>
              <div class="sim-controls" style="grid-template-columns:1fr; margin-top:0;">
                <div class="control-group">
                  <label>Uygulanan Uç Kuvvet (F): <strong id="val-beam-f">1500 N</strong></label>
                  <input type="range" id="inp-beam-f" min="200" max="5000" step="100" value="1500" />
                </div>
                <div class="control-group">
                  <label>Kiriş Uzunluğu (L): <strong id="val-beam-l">1.2 m</strong></label>
                  <input type="range" id="inp-beam-l" min="0.5" max="2.5" step="0.1" value="1.2" />
                </div>
                <div class="control-group">
                  <label>Kiriş Malzemesi (Elastisite Modülü E):</label>
                  <select id="inp-beam-mat">
                    <option value="210|250|Yapı Çeliği (S235)">Yapı Çeliği S235 (E = 210 GPa, σ_akma = 250 MPa)</option>
                    <option value="70|270|Alüminyum 6061-T6">Alüminyum 6061-T6 (E = 70 GPa, σ_akma = 270 MPa)</option>
                    <option value="114|880|Titanyum Alaşımı Ti-6Al-4V">Titanyum Ti-6Al-4V (E = 114 GPa, σ_akma = 880 MPa)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="sim-readout">
              <div class="readout-item">
                <span class="readout-label">Maks. Eğilme Momenti (M = F·L)</span>
                <span class="readout-val" id="out-beam-m">1800 N·m</span>
              </div>
              <div class="readout-item">
                <span class="readout-label">Maks. Uç Çökmesi (δ_max)</span>
                <span class="readout-val" id="out-beam-def">6.86 mm</span>
              </div>
              <div class="readout-item">
                <span class="readout-label">Maks. Gerilme (σ_max)</span>
                <span class="readout-val" id="out-beam-stress">108.0 MPa</span>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: "week-3",
    week: "3. Hafta",
    title: "Malzeme Bilimi: Çekme Deneyi ve Gerilme-Şekildeğiştirme (σ - ε)",
    description:
      "Metallerin mekanik özellikleri, Hooke Yasası, elastik/plastik bölge, boyun verme ve interaktif çekme deneyi simülasyonu.",
    features: ["🧪 Canlı Çekme Deneyi", "📈 σ - ε Diyagramı", "🔬 Elastik & Plastik Bölge"],
    slides: [
      {
        kicker: "3. HAFTA • MALZEME BİLİMİ",
        title: "Gerilme (σ) ve Birim Şekil Değiştirme (ε)",
        html: `
          <p class="lead">
            Bir malzemenin ne kadar sağlam olduğunu anlamak için boyutlardan bağımsız iki temel büyüklük tanımlanır:
          </p>
          <div class="slide-grid-2">
            <div class="info-card fragment">
              <h4>1. Normal Gerilme (σ - Sigma)</h4>
              <p>Birim kesit alanına düşen iç kuvvettir. Birimi <strong>MPa (N/mm²)</strong>'dir.</p>
              <div class="formula-box">
                σ = F / A₀
                <span class="formula-sub">F: Kuvvet [N] &nbsp;|&nbsp; A₀: Başlangıç Kesit Alanı [mm²]</span>
              </div>
            </div>
            <div class="info-card fragment">
              <h4>2. Birim Şekil Değiştirme (ε - Epsilon)</h4>
              <p>Boyutsuz uzama oranıdır (Genellikle % veya mm/mm olarak ifade edilir).</p>
              <div class="formula-box">
                ε = ΔL / L₀ = (L - L₀) / L₀
                <span class="formula-sub">L₀: İlk Ölçü Boyu &nbsp;|&nbsp; ΔL: Uzama Miktarı</span>
              </div>
            </div>
          </div>
          <div class="formula-box fragment" style="margin-top:1.2rem;">
            Hooke Yasası (Elastik Bölge): &nbsp; σ = E · ε
            <span class="formula-sub">E (Elastisite / Young Modülü): Malzemenin rijitliğini (esnemeye karşı direncini) gösterir.</span>
          </div>
        `
      },
      {
        kicker: "3. HAFTA • ETKİLEŞİMLİ LABORATUVAR",
        title: "Canlı Simülasyon: Çekme Deneyi ve σ - ε Diyagramı",
        html: `
          <p class="lead">
            Sürgüyü sağa kaydırarak çelik numuneye çekme kuvveti uygulayın; numunenin <strong>elastik uzamasını, akmasını, boyun vermesini ve kopmasını</strong> canlı izleyin:
          </p>
          <div class="sim-box interactive-zone" data-sim="tensile">
            <div class="sim-header">
              <span class="sim-title">🧪 İnteraktif Çekme Deneyi (Tensile Test)</span>
              <span id="tensile-region-badge" style="font-size:0.82rem; font-weight:700; color:#38bdf8;">Bölge: Elastik Bölge (Kalıcı Deformasyon Yok)</span>
            </div>
            <div style="display:flex; justify-content:center; align-items:center; background:#070b14; border-radius:10px; padding:0.6rem;">
              <canvas id="tensile-canvas" width="760" height="245"></canvas>
            </div>
            <div class="sim-controls" style="grid-template-columns: 2fr 1fr; align-items:center;">
              <div class="control-group">
                <label>Uygulanan Birim Uzama (%ε): <strong id="val-strain">%1.0</strong></label>
                <input type="range" id="inp-strain" min="0" max="25" step="0.2" value="1" />
              </div>
              <div style="display:flex; gap:0.5rem;">
                <button id="btn-play-tensile" class="btn btn-primary" style="width:100%; justify-content:center;">▶ Deneyi Otomatik Oynat</button>
              </div>
            </div>
            <div class="sim-readout">
              <div class="readout-item">
                <span class="readout-label">Anlık Gerilme (σ)</span>
                <span class="readout-val" id="out-tensile-sigma">210 MPa</span>
              </div>
              <div class="readout-item">
                <span class="readout-label">Akma Dayanımı (R_e)</span>
                <span class="readout-val">250 MPa</span>
              </div>
              <div class="readout-item">
                <span class="readout-label">Çekme Dayanımı (R_m)</span>
                <span class="readout-val">420 MPa</span>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: "week-4",
    week: "4. Hafta",
    title: "Mekanizma Tekniği: Krank-Biyel (Piston) Mekanizması",
    description:
      "Dönme hareketini doğrusal harekete çeviren krank-biyel mekanizmasının kinematik analizi ve canlı motor pistonu simülasyonu.",
    features: ["活塞 Canlı Piston-Krank Animasyonu", "🔄 Dönme → Doğrusal Hareket", "⚡ Kinematik Hız Analizi"],
    slides: [
      {
        kicker: "4. HAFTA • MEKANİZMA TEKNİĞİ",
        title: "Krank-Biyel (Slider-Crank) Mekanizması",
        html: `
          <p class="lead">
            İçten yanmalı motorlardan hava kompresörlerine kadar en yaygın kullanılan mekanizmadır. 
            Krankın <strong>tam dönme hareketini</strong>, pistonun <strong>gidip-gelme (öteleme) hareketine</strong> dönüştürür:
          </p>
          <div class="sim-box interactive-zone" data-sim="crank">
            <div class="sim-header">
              <span class="sim-title">🚗 Canlı Krank-Biyel ve Piston Kinematiği Simülasyonu</span>
              <span style="font-size:0.8rem; color:#94a3b8;">ÜÖN: Üst Ölü Nokta | AÖN: Alt Ölü Nokta</span>
            </div>
            <div class="slide-grid-2">
              <div style="display:flex; justify-content:center; align-items:center; background:#070b14; border-radius:10px; padding:0.5rem;">
                <canvas id="crank-canvas" width="460" height="225"></canvas>
              </div>
              <div class="sim-controls" style="grid-template-columns:1fr; margin-top:0;">
                <div class="control-group">
                  <label>Krank Dönüş Hızı (RPM): <strong id="val-crank-rpm">60 d/dk</strong></label>
                  <input type="range" id="inp-crank-rpm" min="0" max="180" step="5" value="60" />
                </div>
                <div class="control-group">
                  <label>Krank Yarıçapı (r): <strong id="val-crank-r">45 mm</strong></label>
                  <input type="range" id="inp-crank-r" min="25" max="65" step="5" value="45" />
                </div>
                <div class="control-group">
                  <label>Biyel Kolu Uzunluğu (l): <strong id="val-crank-l">140 mm</strong></label>
                  <input type="range" id="inp-crank-l" min="110" max="170" step="5" value="140" />
                </div>
              </div>
            </div>
            <div class="sim-readout">
              <div class="readout-item">
                <span class="readout-label">Kurs Boyu (Strok H = 2·r)</span>
                <span class="readout-val" id="out-crank-stroke">90 mm</span>
              </div>
              <div class="readout-item">
                <span class="readout-label">Krank Açısı (θ)</span>
                <span class="readout-val" id="out-crank-angle">0°</span>
              </div>
              <div class="readout-item">
                <span class="readout-label">Anlık Piston Hızı (V_p)</span>
                <span class="readout-val" id="out-crank-vel">0.00 m/s</span>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
];

// ============================================================================
// UYGULAMA DURUMU (STATE)
// ============================================================================
let currentLecture = null;
let isPresentationMode = false;
let currentSlideIndex = 0;
let animationFrameId = null;

// Simülasyon durum değişkenleri
let gearAngle1 = 0;
let gearAngle2 = 0;
let crankAngle = 0;
let tensileAutoTimer = null;

// Kalem & Lazer durumu
let isLaserActive = false;
let isPenActive = false;
let isDrawing = false;

// DOM Referansları
const catalogView = document.getElementById("catalog-view");
const lectureView = document.getElementById("lecture-view");
const lectureGrid = document.getElementById("lecture-grid");
const slidesContainer = document.getElementById("slides-container");
const slidesViewport = document.getElementById("slides-viewport");
const lectureNavActions = document.getElementById("lecture-nav-actions");
const navCurrentLectureTitle = document.getElementById("nav-current-lecture-title");
const presentationToolbar = document.getElementById("presentation-toolbar");
const presLectureName = document.getElementById("pres-lecture-name");
const slideCounter = document.getElementById("slide-counter");
const stepIndicator = document.getElementById("step-indicator");
const presProgressBar = document.getElementById("pres-progress-bar");
const laserPointer = document.getElementById("laser-pointer");
const drawingCanvas = document.getElementById("drawing-canvas");
const drawCtx = drawingCanvas.getContext("2d");

// ============================================================================
// 1. KATALOG OLUŞTURMA
// ============================================================================
function renderCatalog() {
  lectureGrid.innerHTML = "";
  LECTURES.forEach((lec) => {
    const card = document.createElement("article");
    card.className = "lecture-card";
    card.innerHTML = `
      <div>
        <div class="card-top-meta">
          <span class="week-tag">${lec.week}</span>
          <span class="slide-count-tag">📑 ${lec.slides.length} Slayt / Bölüm</span>
        </div>
        <h4>${lec.title}</h4>
        <p>${lec.description}</p>
        <div class="card-features">
          ${lec.features.map((f) => `<span class="feature-chip">${f}</span>`).join("")}
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-read" data-id="${lec.id}">
          📖 Ders Notunu Oku
        </button>
        <button class="btn btn-primary btn-present" data-id="${lec.id}">
          🖥️ Sunumu Başlat
        </button>
      </div>
    `;
    lectureGrid.appendChild(card);
  });

  document.querySelectorAll(".btn-read").forEach((btn) => {
    btn.addEventListener("click", () => openLecture(btn.dataset.id, false));
  });
  document.querySelectorAll(".btn-present").forEach((btn) => {
    btn.addEventListener("click", () => openLecture(btn.dataset.id, true));
  });
}

// ============================================================================
// 2. DERS AÇMA (OKUMA VEYA SUNUM MODU)
// ============================================================================
function openLecture(lectureId, startInPresentation = false) {
  const lec = LECTURES.find((l) => l.id === lectureId);
  if (!lec) return;
  currentLecture = lec;
  currentSlideIndex = 0;

  catalogView.classList.add("hidden");
  lectureView.classList.remove("hidden");
  lectureNavActions.classList.remove("hidden");
  navCurrentLectureTitle.textContent = `${lec.week}: ${lec.title.split(":")[0]}`;
  presLectureName.textContent = `${lec.week}`;

  // Slaytları oluştur
  slidesContainer.innerHTML = "";
  lec.slides.forEach((s, idx) => {
    const slideEl = document.createElement("section");
    slideEl.className = "slide";
    slideEl.dataset.index = idx;
    slideEl.innerHTML = `
      <span class="slide-number-badge">Slayt ${idx + 1} / ${lec.slides.length}</span>
      <div class="slide-kicker">${s.kicker}</div>
      <h2>${s.title}</h2>
      <div class="slide-body">${s.html}</div>
    `;
    slidesContainer.appendChild(slideEl);
  });

  // Simülasyonları bağla
  initSimulations();

  if (startInPresentation) {
    enterPresentationMode();
  } else {
    exitPresentationMode();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function goHome() {
  if (isPresentationMode) {
    exitPresentationMode();
  }
  currentLecture = null;
  lectureView.classList.add("hidden");
  lectureNavActions.classList.add("hidden");
  catalogView.classList.remove("hidden");
}

// ============================================================================
// 3. SUNUM MODU (POWERPOINT MODU) YÖNETİMİ
// ============================================================================
function enterPresentationMode() {
  if (!currentLecture) return;
  isPresentationMode = true;
  document.body.classList.add("presentation-mode");
  presentationToolbar.classList.remove("hidden");

  // İlk slayttan başlat, tüm fragment'ları sıfırla
  currentSlideIndex = 0;
  document.querySelectorAll(".slide .fragment").forEach((f) => {
    f.classList.remove("visible");
  });

  updateActiveSlide();
  resizeDrawingCanvas();
}

function exitPresentationMode() {
  isPresentationMode = false;
  document.body.classList.remove("presentation-mode");
  presentationToolbar.classList.add("hidden");
  toggleLaser(false);
  togglePen(false);
  clearCanvas();

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

function updateActiveSlide() {
  const slides = document.querySelectorAll(".slide");
  slides.forEach((s, i) => {
    if (i === currentSlideIndex) {
      s.classList.add("active-slide");
    } else {
      s.classList.remove("active-slide");
    }
  });

  clearCanvas();
  updatePresentationHUD();
}

function updatePresentationHUD() {
  if (!currentLecture) return;
  const totalSlides = currentLecture.slides.length;
  slideCounter.textContent = `Slayt ${currentSlideIndex + 1} / ${totalSlides}`;

  const activeSlide = document.querySelector(".slide.active-slide");
  if (activeSlide) {
    const allFragments = activeSlide.querySelectorAll(".fragment");
    const visibleFragments = activeSlide.querySelectorAll(".fragment.visible");
    if (allFragments.length > 0) {
      stepIndicator.classList.remove("hidden");
      stepIndicator.textContent = `Adım ${visibleFragments.length}/${allFragments.length}`;
    } else {
      stepIndicator.classList.add("hidden");
    }
  }

  const progress = ((currentSlideIndex + 1) / totalSlides) * 100;
  presProgressBar.style.width = `${progress}%`;
}

// İLERİ (Önce slayt içindeki gizli maddeyi açar, hepsi açıksa sonraki slayta geçer)
function nextStepOrSlide() {
  if (!isPresentationMode || !currentLecture) return;
  const activeSlide = document.querySelector(".slide.active-slide");
  if (!activeSlide) return;

  const hiddenFragments = activeSlide.querySelectorAll(".fragment:not(.visible)");
  if (hiddenFragments.length > 0) {
    hiddenFragments[0].classList.add("visible");
    updatePresentationHUD();
    return;
  }

  if (currentSlideIndex < currentLecture.slides.length - 1) {
    currentSlideIndex++;
    updateActiveSlide();
  }
}

// GERİ (Önce slayt içindeki son açılan maddeyi kapatır, yoksa önceki slayta döner)
function prevStepOrSlide() {
  if (!isPresentationMode || !currentLecture) return;
  const activeSlide = document.querySelector(".slide.active-slide");
  if (!activeSlide) return;

  const visibleFragments = activeSlide.querySelectorAll(".fragment.visible");
  if (visibleFragments.length > 0) {
    visibleFragments[visibleFragments.length - 1].classList.remove("visible");
    updatePresentationHUD();
    return;
  }

  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    updateActiveSlide();
  }
}

// ============================================================================
// 4. ETKİLEŞİMLİ MÜHENDİSLİK SİMÜLASYONLARI
// ============================================================================
function initSimulations() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (tensileAutoTimer) clearInterval(tensileAutoTimer);

  setupGearSim();
  setupBeamSim();
  setupTensileSim();
  setupCrankSim();

  function animateLoop() {
    stepGearAnimation();
    stepCrankAnimation();
    animationFrameId = requestAnimationFrame(animateLoop);
  }
  animateLoop();
}

// --- SİMÜLASYON 1: DİŞLİ ÇARK ÇİFTİ ---
function setupGearSim() {
  const inpN1 = document.getElementById("inp-n1");
  const inpN2 = document.getElementById("inp-n2");
  const inpRpm1 = document.getElementById("inp-rpm1");
  const inpT1 = document.getElementById("inp-t1");
  if (!inpN1) return;

  function updateGearReadouts() {
    const n1 = parseInt(inpN1.value, 10);
    const n2 = parseInt(inpN2.value, 10);
    const rpm1 = parseFloat(inpRpm1.value);
    const t1 = parseFloat(inpT1.value);

    const ratio = n2 / n1;
    const rpm2 = rpm1 / ratio;
    const t2 = t1 * ratio;

    document.getElementById("val-n1").textContent = `${n1} Diş`;
    document.getElementById("val-n2").textContent = `${n2} Diş`;
    document.getElementById("val-rpm1").textContent = `${rpm1} d/dk`;
    document.getElementById("val-t1").textContent = `${t1} N·m`;

    document.getElementById("out-ratio").textContent = ratio.toFixed(2);
    document.getElementById("out-rpm2").textContent = `${rpm2.toFixed(1)} d/dk`;
    document.getElementById("out-t2").textContent = `${t2.toFixed(1)} N·m`;
  }

  [inpN1, inpN2, inpRpm1, inpT1].forEach((el) =>
    el.addEventListener("input", updateGearReadouts)
  );
  updateGearReadouts();
}

function drawGear(ctx, cx, cy, teeth, modulePitch, angle, color, label) {
  const pitchRadius = (teeth * modulePitch) / 2;
  const outerRadius = pitchRadius + modulePitch * 0.9;
  const rootRadius = pitchRadius - modulePitch * 1.1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.beginPath();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.22;
    const a2 = a0 + step * 0.45;
    const a3 = a0 + step * 0.72;
    const a4 = a0 + step * 0.95;

    ctx.lineTo(Math.cos(a0) * rootRadius, Math.sin(a0) * rootRadius);
    ctx.lineTo(Math.cos(a1) * outerRadius, Math.sin(a1) * outerRadius);
    ctx.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    ctx.lineTo(Math.cos(a3) * rootRadius, Math.sin(a3) * rootRadius);
    ctx.lineTo(Math.cos(a4) * rootRadius, Math.sin(a4) * rootRadius);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e2e8f0";
  ctx.stroke();

  // Referans çizgisi (dönüşü net görmek için)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(pitchRadius * 0.8, 0);
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Göbek
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(8, rootRadius * 0.32), 0, Math.PI * 2);
  ctx.fillStyle = "#0f172a";
  ctx.fill();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + outerRadius + 18);
}

function stepGearAnimation() {
  const canvas = document.getElementById("gear-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const n1 = parseInt(document.getElementById("inp-n1").value, 10);
  const n2 = parseInt(document.getElementById("inp-n2").value, 10);
  const rpm1 = parseFloat(document.getElementById("inp-rpm1").value);

  const mod = 4.2;
  const r1 = (n1 * mod) / 2;
  const r2 = (n2 * mod) / 2;

  const omega1 = (rpm1 * 2 * Math.PI) / 60;
  const dt = 1 / 60;
  gearAngle1 += omega1 * dt * 0.35; // görsel akıcılık ölçeği
  gearAngle2 = -(gearAngle1 * n1) / n2 + Math.PI / n2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const totalSpan = r1 * 2 + r2 * 2;
  const startX = (canvas.width - totalSpan) / 2 + r1;
  const cy = canvas.height / 2 - 10;
  const cx1 = startX;
  const cx2 = cx1 + r1 + r2 + mod * 0.25;

  drawGear(ctx, cx1, cy, n1, mod, gearAngle1, "#38bdf8", `Giriş (N₁=${n1})`);
  drawGear(ctx, cx2, cy, n2, mod, gearAngle2, "#f97316", `Çıkış (N₂=${n2})`);
}

// --- SİMÜLASYON 2: ANKASTRE KİRİŞ EĞİLME ANALİZİ ---
function setupBeamSim() {
  const canvas = document.getElementById("beam-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const inpF = document.getElementById("inp-beam-f");
  const inpL = document.getElementById("inp-beam-l");
  const inpMat = document.getElementById("inp-beam-mat");

  function renderBeam() {
    const F = parseFloat(inpF.value); // N
    const L = parseFloat(inpL.value); // m
    const [E_GPa, yieldMPa] = inpMat.value.split("|").map(Number);

    document.getElementById("val-beam-f").textContent = `${F} N`;
    document.getElementById("val-beam-l").textContent = `${L.toFixed(1)} m`;

    // Kiriş kesiti sabit: b = 40 mm, h = 25 mm dikdörtgen kesit
    // I = b*h^3/12 = 40 * 25^3 / 12 = 52083.3 mm^4 = 5.208e-8 m^4
    // W = b*h^2/6 = 40 * 625 / 6 = 4166.7 mm^3
    const I = 5.208e-8;
    const W_mm3 = 4166.7;
    const E_Pa = E_GPa * 1e9;

    const M_Nm = F * L;
    const delta_m = (F * Math.pow(L, 3)) / (3 * E_Pa * I);
    const delta_mm = delta_m * 1000;
    const sigma_MPa = (M_Nm * 1000) / W_mm3;

    document.getElementById("out-beam-m").textContent = `${M_Nm.toFixed(0)} N·m`;
    document.getElementById("out-beam-def").textContent = `${delta_mm.toFixed(2)} mm`;
    document.getElementById("out-beam-stress").textContent = `${sigma_MPa.toFixed(1)} MPa`;

    const badge = document.getElementById("beam-safety-badge");
    if (sigma_MPa > yieldMPa) {
      badge.textContent = `⚠️ AKMA SINIRI AŞILDI! (σ > ${yieldMPa} MPa)`;
      badge.style.color = "#ef4444";
    } else {
      const sf = (yieldMPa / sigma_MPa).toFixed(1);
      badge.textContent = `✅ EMNİYETLİ (Emniyet Katsayısı: ${sf})`;
      badge.style.color = "#34d399";
    }

    // Çizim
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ankastre duvar (Sol mesnet)
    ctx.fillStyle = "#334155";
    ctx.fillRect(35, 30, 18, 160);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(53, 30);
    ctx.lineTo(53, 190);
    ctx.stroke();

    // Eğilmemiş referans ekseni (kesikli çizgi)
    const beamPxLen = 140 + L * 95;
    const y0 = 90;
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.beginPath();
    ctx.moveTo(53, y0);
    ctx.lineTo(53 + beamPxLen, y0);
    ctx.stroke();
    ctx.restore();

    // Eğilmiş kiriş (FEA renk gradyanı ile)
    const maxVisualDef = Math.min(75, delta_mm * 2.2);
    const segments = 30;
    for (let i = 0; i < segments; i++) {
      const xi1 = i / segments;
      const xi2 = (i + 1) / segments;
      // Ankastre kiriş elastik eğri denklemi: y(x) = delta * (3*(x/L)^2 - (x/L)^3) / 2
      const def1 = maxVisualDef * 0.5 * (3 * xi1 * xi1 - xi1 * xi1 * xi1);
      const def2 = maxVisualDef * 0.5 * (3 * xi2 * xi2 - xi2 * xi2 * xi2);

      const x1 = 53 + xi1 * beamPxLen;
      const x2 = 53 + xi2 * beamPxLen;

      // Gerilme ankastre uçta maksimum, serbest uçta sıfır
      const stressRatio = Math.min(1, (1 - xi1) * (sigma_MPa / yieldMPa));
      const hue = Math.max(0, 220 - stressRatio * 220); // 220 (Mavi) -> 0 (Kırmızı)

      ctx.strokeStyle = `hsl(${hue}, 90%, 55%)`;
      ctx.lineWidth = 18;
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.moveTo(x1, y0 + def1);
      ctx.lineTo(x2, y0 + def2);
      ctx.stroke();
    }

    // Uçtaki F kuvvet oku
    const tipX = 53 + beamPxLen;
    const tipY = y0 + maxVisualDef;
    ctx.strokeStyle = "#f97316";
    ctx.fillStyle = "#f97316";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY - 48);
    ctx.lineTo(tipX, tipY - 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tipX, tipY - 8);
    ctx.lineTo(tipX - 6, tipY - 18);
    ctx.lineTo(tipX + 6, tipY - 18);
    ctx.closePath();
    ctx.fill();

    ctx.font = "700 13px JetBrains Mono, monospace";
    ctx.fillText(`F = ${F} N`, tipX - 35, tipY - 55);

    // FEA Renk Skalası Bilgisi
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("FEA Gerilme Dağılımı: Kırmızı = Maks. Moment (Mesnet) | Mavi = Düşük Gerilme", 55, 208);
  }

  [inpF, inpL, inpMat].forEach((el) => el.addEventListener("input", renderBeam));
  renderBeam();
}

// --- SİMÜLASYON 3: ÇEKME DENEYİ VE SIGMA-EPSILON GRAFİĞİ ---
function setupTensileSim() {
  const canvas = document.getElementById("tensile-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const inpStrain = document.getElementById("inp-strain");
  const btnPlay = document.getElementById("btn-play-tensile");

  function computeStress(epsPercent) {
    // Tipik sünek çelik eğrisi modellemesi
    if (epsPercent <= 1.2) {
      return (epsPercent / 1.2) * 250; // Elastik bölge (0 -> 250 MPa)
    } else if (epsPercent <= 2.5) {
      return 250 + Math.sin((epsPercent - 1.2) * 12) * 6; // Akma sahanlığı
    } else if (epsPercent <= 16) {
      // Pekleşme (Strain hardening -> 420 MPa tepe)
      const norm = (epsPercent - 2.5) / 13.5;
      return 250 + 170 * Math.sin(norm * (Math.PI / 2));
    } else if (epsPercent <= 23.5) {
      // Boyun verme (Necking -> 330 MPa)
      const norm = (epsPercent - 16) / 7.5;
      return 420 - 90 * norm * norm;
    } else {
      return 0; // Kopma (Fracture)
    }
  }

  function renderTensile() {
    const eps = parseFloat(inpStrain.value);
    const sigma = computeStress(eps);

    document.getElementById("val-strain").textContent = `%${eps.toFixed(1)}`;
    document.getElementById("out-tensile-sigma").textContent =
      eps > 23.5 ? "KOPTU (0 MPa)" : `${sigma.toFixed(0)} MPa`;

    const badge = document.getElementById("tensile-region-badge");
    if (eps <= 1.2) {
      badge.textContent = "Bölge: 1. Elastik Bölge (Yük kalkarsa ilk boyuna döner)";
      badge.style.color = "#38bdf8";
    } else if (eps <= 2.5) {
      badge.textContent = "Bölge: 2. Akma Sahanlığı (Kalıcı plastik deformasyon başladı)";
      badge.style.color = "#facc15";
    } else if (eps <= 16) {
      badge.textContent = "Bölge: 3. Pekleşme Bölgesi (Malzeme dayanımı R_m'ye yükseliyor)";
      badge.style.color = "#34d399";
    } else if (eps <= 23.5) {
      badge.textContent = "Bölge: 4. Boyun Verme (Kesit yerel olarak daralıyor!)";
      badge.style.color = "#f97316";
    } else {
      badge.textContent = "Bölge: 5. KOPMA (Numune ikiye ayrıldı)";
      badge.style.color = "#ef4444";
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // SOL TARAF: Çekme Numunesi (Dogbone Specimen)
    const specY = 95;
    const baseLen = 140;
    const stretchPx = eps * 2.8;
    const totalLen = baseLen + stretchPx;
    const startX = 45;

    // Çeneler
    ctx.fillStyle = "#475569";
    ctx.fillRect(startX - 22, specY - 22, 22, 44);
    ctx.fillRect(startX + totalLen, specY - 22, 22, 44);

    // Numune gövdesi
    const neckFactor = eps > 16 ? Math.min(0.65, (eps - 16) / 11) : 0;
    const halfThick = 14 * (1 - eps * 0.008);
    const neckHalfThick = halfThick * (1 - neckFactor);
    const midX = startX + totalLen / 2;

    ctx.fillStyle = eps > 23.5 ? "#ef4444" : "#93c5fd";
    if (eps <= 23.5) {
      ctx.beginPath();
      ctx.moveTo(startX, specY - halfThick);
      ctx.quadraticCurveTo(midX, specY - neckHalfThick, startX + totalLen, specY - halfThick);
      ctx.lineTo(startX + totalLen, specY + halfThick);
      ctx.quadraticCurveTo(midX, specY + neckHalfThick, startX, specY + halfThick);
      ctx.closePath();
      ctx.fill();
    } else {
      // Kopmuş iki parça
      ctx.fillRect(startX, specY - halfThick, totalLen * 0.44, halfThick * 2);
      ctx.fillRect(startX + totalLen * 0.56, specY - halfThick, totalLen * 0.44, halfThick * 2);
    }

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillText("Çekme Numunesi (L₀ + ΔL)", startX + 15, specY + 55);

    // SAĞ TARAF: Sigma - Epsilon Grafiği
    const gx = 340;
    const gy = 205;
    const gw = 380;
    const gh = 175;

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy - gh);
    ctx.lineTo(gx, gy);
    ctx.lineTo(gx + gw, gy);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("σ (Gerilme [MPa])", gx + 8, gy - gh + 10);
    ctx.fillText("ε (% Uzama)", gx + gw - 70, gy - 8);

    // Tam referans eğri (soluk)
    ctx.beginPath();
    for (let e = 0; e <= 23.5; e += 0.25) {
      const s = computeStress(e);
      const px = gx + (e / 25) * gw;
      const py = gy - (s / 460) * gh;
      if (e === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Aktif çizilen eğri
    ctx.beginPath();
    const limitE = Math.min(eps, 23.5);
    for (let e = 0; e <= limitE; e += 0.2) {
      const s = computeStress(e);
      const px = gx + (e / 25) * gw;
      const py = gy - (s / 460) * gh;
      if (e === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Anlık nokta
    const curX = gx + (limitE / 25) * gw;
    const curY = gy - (computeStress(limitE) / 460) * gh;
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#f97316";
    ctx.fill();
  }

  inpStrain.addEventListener("input", renderTensile);
  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      if (tensileAutoTimer) {
        clearInterval(tensileAutoTimer);
        tensileAutoTimer = null;
        btnPlay.textContent = "▶ Deneyi Otomatik Oynat";
        return;
      }
      inpStrain.value = 0;
      btnPlay.textContent = "⏸ Durdur";
      tensileAutoTimer = setInterval(() => {
        let v = parseFloat(inpStrain.value) + 0.25;
        if (v > 25) {
          clearInterval(tensileAutoTimer);
          tensileAutoTimer = null;
          btnPlay.textContent = "↺ Tekrar Oynat";
          return;
        }
        inpStrain.value = v;
        renderTensile();
      }, 45);
    });
  }
  renderTensile();
}

// --- SİMÜLASYON 4: KRANK-BİYEL (PİSTON) MEKANİZMASI ---
function setupCrankSim() {
  const inpRpm = document.getElementById("inp-crank-rpm");
  const inpR = document.getElementById("inp-crank-r");
  const inpL = document.getElementById("inp-crank-l");
  if (!inpRpm) return;

  function updateCrankLabels() {
    const rpm = parseFloat(inpRpm.value);
    const r = parseFloat(inpR.value);
    const l = parseFloat(inpL.value);
    document.getElementById("val-crank-rpm").textContent = `${rpm} d/dk`;
    document.getElementById("val-crank-r").textContent = `${r} mm`;
    document.getElementById("val-crank-l").textContent = `${l} mm`;
    document.getElementById("out-crank-stroke").textContent = `${(2 * r).toFixed(0)} mm`;
  }

  [inpRpm, inpR, inpL].forEach((el) => el.addEventListener("input", updateCrankLabels));
  updateCrankLabels();
}

function stepCrankAnimation() {
  const canvas = document.getElementById("crank-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const rpm = parseFloat(document.getElementById("inp-crank-rpm").value);
  const r = parseFloat(document.getElementById("inp-crank-r").value);
  const l = parseFloat(document.getElementById("inp-crank-l").value);

  const omega = (rpm * 2 * Math.PI) / 60;
  crankAngle = (crankAngle + omega * (1 / 60)) % (Math.PI * 2);

  // Kinematik hesap
  const cx = 115;
  const cy = canvas.height / 2;

  const pinX = cx + r * Math.cos(crankAngle);
  const pinY = cy + r * Math.sin(crankAngle);

  const dy = pinY - cy;
  const dxRod = Math.sqrt(Math.max(10, l * l - dy * dy));
  const pistonX = pinX + dxRod;

  // Anlık hız hesabı (m/s)
  const r_m = r / 1000;
  const lambda = r / l;
  const vel =
    r_m * omega * (Math.sin(crankAngle) + (lambda / 2) * Math.sin(2 * crankAngle));

  const deg = Math.round((crankAngle * 180) / Math.PI) % 360;
  document.getElementById("out-crank-angle").textContent = `${deg}°`;
  document.getElementById("out-crank-vel").textContent = `${Math.abs(vel).toFixed(2)} m/s`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Silindir gömleği
  const minPistonX = cx + l - r;
  const maxPistonX = cx + l + r;
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(minPistonX - 18, cy - 32);
  ctx.lineTo(maxPistonX + 52, cy - 32);
  ctx.moveTo(minPistonX - 18, cy + 32);
  ctx.lineTo(maxPistonX + 52, cy + 32);
  ctx.stroke();

  // Krank dairesi yörüngesi
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Krank kolu
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(pinX, pinY);
  ctx.stroke();

  // Biyel kolu
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(pinX, pinY);
  ctx.lineTo(pistonX, cy);
  ctx.stroke();

  // Piston
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(pistonX - 14, cy - 28, 42, 56);
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  ctx.strokeRect(pistonX - 14, cy - 28, 42, 56);

  // Mafsallar
  [
    [cx, cy],
    [pinX, pinY],
    [pistonX, cy]
  ].forEach(([mx, my]) => {
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// ============================================================================
// 5. LAZER İMLECİ & BEYAZ TAHTA KALEMİ (ÇİZİM MODU)
// ============================================================================
function toggleLaser(forceState) {
  isLaserActive = typeof forceState === "boolean" ? forceState : !isLaserActive;
  const btn = document.getElementById("btn-toggle-laser");
  if (isLaserActive) {
    laserPointer.classList.remove("hidden");
    btn.classList.add("active");
  } else {
    laserPointer.classList.add("hidden");
    btn.classList.remove("active");
  }
}

function togglePen(forceState) {
  isPenActive = typeof forceState === "boolean" ? forceState : !isPenActive;
  const btnPen = document.getElementById("btn-toggle-pen");
  const btnClear = document.getElementById("btn-clear-pen");

  if (isPenActive) {
    drawingCanvas.classList.add("pen-active");
    btnPen.classList.add("active");
    btnClear.classList.remove("hidden");
    resizeDrawingCanvas();
  } else {
    drawingCanvas.classList.remove("pen-active");
    btnPen.classList.remove("active");
  }
}

function resizeDrawingCanvas() {
  const rect = slidesViewport.getBoundingClientRect();
  drawingCanvas.width = rect.width;
  drawingCanvas.height = rect.height;
}

function clearCanvas() {
  drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

drawingCanvas.addEventListener("mousedown", (e) => {
  if (!isPenActive) return;
  isDrawing = true;
  const rect = drawingCanvas.getBoundingClientRect();
  drawCtx.beginPath();
  drawCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
});

drawingCanvas.addEventListener("mousemove", (e) => {
  if (!isPenActive || !isDrawing) return;
  const rect = drawingCanvas.getBoundingClientRect();
  drawCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  drawCtx.strokeStyle = "#ef4444";
  drawCtx.lineWidth = 3.5;
  drawCtx.lineCap = "round";
  drawCtx.stroke();
});

window.addEventListener("mouseup", () => {
  isDrawing = false;
});

window.addEventListener("mousemove", (e) => {
  if (isLaserActive) {
    laserPointer.style.left = `${e.clientX}px`;
    laserPointer.style.top = `${e.clientY}px`;
  }
});

// ============================================================================
// 6. OLAY DİNLEYİCİLERİ (KLAVYE, FARE TIKLAMASI, BUTONLAR)
// ============================================================================
document.getElementById("btn-home").addEventListener("click", goHome);
document.getElementById("btn-back-catalog").addEventListener("click", goHome);
document.getElementById("btn-start-presentation").addEventListener("click", enterPresentationMode);
document.getElementById("btn-banner-present").addEventListener("click", enterPresentationMode);

document.getElementById("btn-prev-slide").addEventListener("click", prevStepOrSlide);
document.getElementById("btn-next-slide").addEventListener("click", nextStepOrSlide);
document.getElementById("btn-toggle-laser").addEventListener("click", () => toggleLaser());
document.getElementById("btn-toggle-pen").addEventListener("click", () => togglePen());
document.getElementById("btn-clear-pen").addEventListener("click", clearCanvas);
document.getElementById("btn-exit-presentation").addEventListener("click", exitPresentationMode);

document.getElementById("btn-fullscreen").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Sunum modunda slayta sol tıklayınca ileri git (Simülasyon kutuları hariç!)
slidesViewport.addEventListener("click", (e) => {
  if (!isPresentationMode || isPenActive) return;
  if (
    e.target.closest(".interactive-zone") ||
    e.target.closest("button") ||
    e.target.closest("input") ||
    e.target.closest("select")
  ) {
    return;
  }
  nextStepOrSlide();
});

// Klavye kısayolları (PowerPoint & Sunum Kumandası uyumlu)
window.addEventListener("keydown", (e) => {
  if (!isPresentationMode) return;

  if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
    e.preventDefault();
    nextStepOrSlide();
  } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) {
    e.preventDefault();
    prevStepOrSlide();
  } else if (e.key === "Escape") {
    exitPresentationMode();
  } else if (e.key.toLowerCase() === "l") {
    toggleLaser();
  } else if (e.key.toLowerCase() === "c") {
    togglePen();
  } else if (e.key.toLowerCase() === "d") {
    clearCanvas();
  } else if (e.key.toLowerCase() === "f") {
    document.getElementById("btn-fullscreen").click();
  }
});

window.addEventListener("resize", () => {
  if (isPresentationMode) resizeDrawingCanvas();
});

// Başlangıçta kataloğu yükle
renderCatalog();
