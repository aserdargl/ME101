// ============================================================================
// ME 101 — MAKİNE MÜHENDİSLİĞİNE GİRİŞ | AKADEMİK DERS VE SUNUM MOTORU
// ============================================================================

function getSimulationSlideObject(simType, weekLabel) {
  if (simType === "gear") {
    return {
      kicker: `${weekLabel} • UYGULAMA VE SİMÜLASYON`,
      title: "Dişli Çarklar, Çevrim Oranı ve Tork İletimi",
      pptSummaryBullets: [
        "Çevrim Oranı: i = N₂ / N₁ = ω₁ / ω₂ = T₂ / T₁",
        "Açısal hız düşürülürken döndürme momenti (tork) aynı oranda artar.",
        "Diş sayıları (N₁, N₂), giriş devri ve giriş torku parametrelerinin analizi."
      ],
      html: `
        <p class="lead">
          Dişli çark mekanizmaları açısal hızı düşürüp <strong>döndürme momentini (torku) artırmak</strong> veya hızı yükseltmek amacıyla kullanılır. 
          Aşağıdaki parametreleri değiştirerek mekanizmanın kinematik ve dinamik davranışını inceleyiniz:
        </p>
        <div class="sim-box interactive-zone" data-sim="gear">
          <div class="sim-header">
            <span class="sim-title">TEKNİK SİMÜLASYON I — DÜZ DİŞLİ ÇARK ÇİFTİ (i = N₂ / N₁ = ω₁ / ω₂ = T₂ / T₁)</span>
            <span style="font-size:0.78rem; color:#6e6256;">Parametreleri değiştirmek için sürgüleri kullanınız</span>
          </div>
          <div class="slide-grid-2">
            <div class="sim-canvas-wrap">
              <canvas id="gear-canvas" width="460" height="230"></canvas>
            </div>
            <div>
              <div class="sim-controls" style="grid-template-columns:1fr; margin-top:0;">
                <div class="control-group">
                  <label>Giriş Dişlisi Diş Sayısı (N₁): <strong id="val-n1">12 Diş</strong></label>
                  <input type="range" id="inp-n1" min="8" max="24" step="2" value="12" />
                </div>
                <div class="control-group">
                  <label>Çıkış Dişlisi Diş Sayısı (N₂): <strong id="val-n2">24 Diş</strong></label>
                  <input type="range" id="inp-n2" min="10" max="36" step="2" value="24" />
                </div>
                <div class="control-group">
                  <label>Giriş Devri (n₁): <strong id="val-rpm1">60 d/dk</strong></label>
                  <input type="range" id="inp-rpm1" min="10" max="120" step="5" value="60" />
                </div>
                <div class="control-group">
                  <label>Giriş Momenti (T₁): <strong id="val-t1">50 N·m</strong></label>
                  <input type="range" id="inp-t1" min="10" max="200" step="10" value="50" />
                </div>
              </div>
            </div>
          </div>
          <div class="sim-readout">
            <div class="readout-item">
              <span class="readout-label">Çevrim Oranı (i = N₂ / N₁)</span>
              <span class="readout-val" id="out-ratio">2.00</span>
            </div>
            <div class="readout-item">
              <span class="readout-label">Çıkış Devri (n₂)</span>
              <span class="readout-val" id="out-rpm2">30.0 d/dk</span>
            </div>
            <div class="readout-item">
              <span class="readout-label">Çıkış Momenti (T₂ = i · T₁)</span>
              <span class="readout-val" id="out-t2">100.0 N·m</span>
            </div>
          </div>
        </div>
      `
    };
  }
  if (simType === "beam") {
    return {
      kicker: `${weekLabel} • UYGULAMA VE SİMÜLASYON`,
      title: "Ankastre Kiriş Eğilme ve Gerilme Analizi",
      pptSummaryBullets: [
        "Maksimum Eğilme Momenti: M_max = F · L (Ankastre mesnet kesitinde)",
        "Maksimum Uç Sehimi (Çökme): δ_max = (F · L³) / (3 · E · I)",
        "Malzeme Elastisite Modülünün (E) şekil değiştirmeye etkisi"
      ],
      html: `
        <p class="lead">
          Sol ucundan ankastre mesnetlenmiş bir kirişin serbest ucuna tekil <strong>F kuvveti</strong> uygulandığında oluşan 
          elastik eğriyi (δ_max) ve normal gerilme dağılımını (σ_max) farklı mühendislik malzemeleri için karşılaştırınız:
        </p>
        <div class="sim-box interactive-zone" data-sim="beam">
          <div class="sim-header">
            <span class="sim-title">TEKNİK SİMÜLASYON II — ANKASTRE KİRİŞ GERİLME VE SEHİM ANALİZİ</span>
            <span id="beam-safety-badge" style="font-size:0.78rem; font-weight:700; color:#2d6a4f;">EMNİYETLİ BÖLGE</span>
          </div>
          <div class="slide-grid-2">
            <div class="sim-canvas-wrap">
              <canvas id="beam-canvas" width="460" height="220"></canvas>
            </div>
            <div class="sim-controls" style="grid-template-columns:1fr; margin-top:0;">
              <div class="control-group">
                <label>Uygulanan Uç Kuvvet (F): <strong id="val-beam-f">1500 N</strong></label>
                <input type="range" id="inp-beam-f" min="200" max="5000" step="100" value="1500" />
              </div>
              <div class="control-group">
                <label>Kiriş Açıklığı (L): <strong id="val-beam-l">1.2 m</strong></label>
                <input type="range" id="inp-beam-l" min="0.5" max="2.5" step="0.1" value="1.2" />
              </div>
              <div class="control-group">
                <label>Kiriş Malzemesi (Elastisite Modülü E):</label>
                <select id="inp-beam-mat">
                  <option value="210|250|Yapı Çeliği (S235)">Yapı Çeliği S235 (E = 210 GPa, R_e = 250 MPa)</option>
                  <option value="70|270|Alüminyum 6061-T6">Alüminyum 6061-T6 (E = 70 GPa, R_e = 270 MPa)</option>
                  <option value="114|880|Titanyum Alaşımı Ti-6Al-4V">Titanyum Ti-6Al-4V (E = 114 GPa, R_e = 880 MPa)</option>
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
              <span class="readout-label">Maks. Uç Sehimi (δ_max)</span>
              <span class="readout-val" id="out-beam-def">6.86 mm</span>
            </div>
            <div class="readout-item">
              <span class="readout-label">Maks. Eğilme Gerilmesi (σ_max)</span>
              <span class="readout-val" id="out-beam-stress">108.0 MPa</span>
            </div>
          </div>
        </div>
      `
    };
  }
  if (simType === "tensile") {
    return {
      kicker: `${weekLabel} • UYGULAMA VE SİMÜLASYON`,
      title: "Çekme Deneyi ve Gerilme – Birim Şekil Değiştirme (σ - ε) Diyagramı",
      pptSummaryBullets: [
        "Elastik Bölge: Hooke Yasası (σ = E · ε) geçerlidir, kalıcı şekil değişimi oluşmaz.",
        "Akma Sınırı (Re): Kalıcı plastik deformasyonun başladığı kritik gerilme.",
        "Pekleşme, Çekme Dayanımı (Rm), Boyun Verme (Necking) ve Kopma."
      ],
      html: `
        <p class="lead">
          Standart bir metal çekme numunesine eksenel yük uygulandığında oluşan <strong>elastik uzama, akma sahanlığı, pekleşme, boyun verme ve kopma</strong> evrelerini inceleyiniz:
        </p>
        <div class="sim-box interactive-zone" data-sim="tensile">
          <div class="sim-header">
            <span class="sim-title">TEKNİK SİMÜLASYON III — TEK EKSENLİ ÇEKME DENEYİ</span>
            <span id="tensile-region-badge" style="font-size:0.78rem; font-weight:700; color:#5c3d28;">Bölge I: Elastik Bölge</span>
          </div>
          <div class="sim-canvas-wrap">
            <canvas id="tensile-canvas" width="760" height="240"></canvas>
          </div>
          <div class="sim-controls" style="grid-template-columns: 2fr 1fr; align-items:center;">
            <div class="control-group">
              <label>Uygulanan Birim Uzama (%ε): <strong id="val-strain">%1.0</strong></label>
              <input type="range" id="inp-strain" min="0" max="25" step="0.2" value="1" />
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button id="btn-play-tensile" class="btn btn-primary" style="width:100%; justify-content:center;">Deneyi Otomatik Başlat</button>
            </div>
          </div>
          <div class="sim-readout">
            <div class="readout-item">
              <span class="readout-label">Anlık Mühendislik Gerilmesi (σ)</span>
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
    };
  }
  return {
    kicker: `${weekLabel} • MEKANİZMA TEKNİĞİ`,
    title: "Krank-Biyel (Piston-Silindir) Mekanizması Kinematiği",
    pptSummaryBullets: [
      "Tam dönme hareketini doğrusal öteleme hareketine dönüştürür.",
      "Kurs Boyu (Strok): H = 2 · r (Üst Ölü Nokta ile Alt Ölü Nokta arası)",
      "Anlık Piston Hızı: Vp = r · ω · (sin θ + (λ/2) · sin 2θ)"
    ],
    html: `
      <p class="lead">
        İçten yanmalı motorlar ve pistonlu kompresörlerin temelini oluşturan krank-biyel mekanizması, 
        krank milinin <strong>sürekli dönme hareketini</strong> pistonun <strong>doğrusal öteleme hareketine</strong> dönüştürür:
      </p>
      <div class="sim-box interactive-zone" data-sim="crank">
        <div class="sim-header">
          <span class="sim-title">TEKNİK SİMÜLASYON IV — KRANK-BİYEL KİNEMATİĞİ</span>
          <span style="font-size:0.78rem; color:#6e6256;">ÜÖN: Üst Ölü Nokta | AÖN: Alt Ölü Nokta</span>
        </div>
        <div class="slide-grid-2">
          <div class="sim-canvas-wrap">
            <canvas id="crank-canvas" width="460" height="225"></canvas>
          </div>
          <div class="sim-controls" style="grid-template-columns:1fr; margin-top:0;">
            <div class="control-group">
              <label>Krank Açısal Hızı (n): <strong id="val-crank-rpm">60 d/dk</strong></label>
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
  };
}

const LECTURES = [
  {
    id: "week-1",
    week: "1. Hafta",
    title: "Makine Mühendisliğine Giriş, Tarihsel Gelişim ve Temel Disiplinler",
    description:
      "Makine mühendisliğinin tanımı, Sanayi Devrimleri, beş temel anabilim dalı ve dişli çark mekanizmaları üzerinde güç/moment iletimi analizi.",
    pptxUrl: "pptx/ME101-Hafta1.pptx",
    features: ["Dişli Çark Simülasyonu", "Hibrit Slayt Modu", "PPTX Arşivi"],
    slides: [
      {
        kicker: "1. HAFTA • BÖLÜM I",
        title: "Makine Mühendisliğinin Tanımı ve Kapsamı",
        pptSummaryBullets: [
          "Fizik, matematik ve malzeme bilimi ilkeleriyle mekanik ve ısıl sistemlerin tasarımı.",
          "Enerji dönüşümü: Isı, akışkan ve elektrik enerjisinin mekanik işe dönüştürülmesi.",
          "Yapısal bütünlük: Sistemlerin emniyetli, verimli ve uzun ömürlü çalışmasının sağlanması.",
          "Temel İlişki: Güç (P) = Döndürme Momenti (T) × Açısal Hız (ω)"
        ],
        html: `
          <p class="lead">
            Makine mühendisliği; temel fizik, matematik ve malzeme bilimi yasalarını kullanarak <strong>enerji dönüşümü</strong> ve 
            <strong>hareket üreten sistemleri</strong> tasarlayan, analiz eden ve imal eden mühendislik disiplinidir.
          </p>
          <div class="slide-grid-2">
            <ul class="bullet-list">
              <li class="fragment">
                <span class="bullet-marker">I.</span>
                <div><strong>Enerji ve Güç Dönüşümü:</strong> Doğadaki ısıl, hidrolik ve elektrik kaynaklarını faydalı mekanik işe dönüştüren sistemleri kurgular.</div>
              </li>
              <li class="fragment">
                <span class="bullet-marker">II.</span>
                <div><strong>Mukavemet ve Güvenilirlik:</strong> Makine elemanlarının statik ve dinamik yükler altında kırılmadan, aşınmadan ve yorulmadan çalışmasını güvence altına alır.</div>
              </li>
              <li class="fragment">
                <span class="bullet-marker">III.</span>
                <div><strong>İleri Uygulama Alanları:</strong> Savunma, havacılık, otomotiv, robotik, biyomekanik ve enerji santrallerinin temel yapı taşıdır.</div>
              </li>
            </ul>
            <div class="info-card fragment">
              <h4>Dersin Temel Amacı</h4>
              <p style="margin-bottom:0.8rem;">
                Mühendislik problemlerinin formüle edilmesi, kuvvet-gerilme-malzeme ilişkisinin kurulması ve temel makine elemanlarının çalışma prensiplerinin incelenmesidir.
              </p>
              <div class="formula-box">
                P = T · ω = (2 · π · n · T) / 60
                <span class="formula-sub">P: Güç [W] &nbsp;|&nbsp; T: Döndürme Momenti [N·m] &nbsp;|&nbsp; ω: Açısal Hız [rad/s]</span>
              </div>
            </div>
          </div>
        `
      },
      {
        kicker: "1. HAFTA • BÖLÜM II",
        title: "Endüstriyel Gelişim Süreci",
        pptSummaryBullets: [
          "I. Sanayi Devrimi (1780): Buhar gücü ve mekanik tezgâhların doğuşu.",
          "II. Sanayi Devrimi (1870): Seri üretim hatları, elektrik ve içten yanmalı motorlar.",
          "III. ve IV. Sanayi Devrimi: CNC, CAD/CAE, robotik otomasyon ve dijital ikiz.",
          "Mühendislik Tasarımı = Teorik Analiz + Deneysel Doğrulama + Ekonomik İmalat"
        ],
        html: `
          <p class="lead">
            Üretim teknolojilerindeki tarihsel dönüm noktaları, makine mühendisliğinin geliştirdiği güç ve imalat yöntemleriyle şekillenmiştir:
          </p>
          <div class="slide-grid-3">
            <div class="info-card fragment">
              <h4>I. Sanayi Devrimi (1780)</h4>
              <p><strong>Buhar Makinesi ve Mekanizasyon:</strong> James Watt'ın kondenserli buhar makinesi ile kas ve su gücünden termodinamik güç üretimine geçiş.</p>
            </div>
            <div class="info-card fragment">
              <h4>II. Sanayi Devrimi (1870)</h4>
              <p><strong>Seri İmalat ve İçten Yanmalı Motorlar:</strong> Otto ve Diesel çevrimlerinin geliştirilmesi, standart yedek parça üretimi ve montaj hatları.</p>
            </div>
            <div class="info-card fragment">
              <h4>III. &amp; IV. Sanayi Devrimi</h4>
              <p><strong>Sayısal Kontrol ve Siber-Fiziksel Sistemler:</strong> CNC tezgâhlar, Sonlu Elemanlar Analizi (FEA), Hesaplamalı Akışkanlar Dinamiği (CFD) ve eklemeli imalat.</p>
            </div>
          </div>
          <div class="formula-box fragment" style="margin-top:1.4rem;">
            Mühendislik Çözümü = Bilimsel Doğruluk + Yapısal Emniyet + Optimum Maliyet
            <span class="formula-sub">Mühendislik, kısıtlar altında en uygun (optimum) sistemi tasarlama sanatıdır.</span>
          </div>
        `
      },
      {
        kicker: "1. HAFTA • BÖLÜM III",
        title: "Makine Mühendisliğinin Beş Ana Anabilim Dalı",
        pptSummaryBullets: [
          "01. Konstrüksiyon ve İmalat (Makine elemanları, CAD, talaşlı/talaşsız üretim)",
          "02. Mekanik (Statik, mukavemet, elastisite, sonlu elemanlar analizi)",
          "03. Termodinamik ve Isı Tekniği (Isı transferi, akışkanlar mekaniği, enerji)",
          "04. Makine Teorisi, Sistem Dinamiği ve Kontrol (Mekanizmalar, titreşim, mekatronik)",
          "05. Otomotiv ve Güç Aktarma Sistemleri (Taşıt mekaniği, motorlar, aerodinamik)"
        ],
        html: `
          <p class="lead">Makine mühendisliği lisans eğitimi ve akademik araştırmalar beş temel anabilim dalı üzerine inşa edilmiştir:</p>
          <ul class="bullet-list">
            <li class="fragment">
              <span class="bullet-marker">01</span>
              <div><strong>Konstrüksiyon ve İmalat:</strong> Makine elemanları (dişliler, yataklar, bağlantılar), bilgisayar destekli tasarım (CAD) ve modern üretim yöntemleri.</div>
            </li>
            <li class="fragment">
              <span class="bullet-marker">02</span>
              <div><strong>Mekanik (Katı Cisimler Mekaniği):</strong> Statik, mukavemet, gerilme analizi, kırılma mekaniği ve kompozit malzemeler.</div>
            </li>
            <li class="fragment">
              <span class="bullet-marker">03</span>
              <div><strong>Termodinamik ve Isı Tekniği:</strong> Termodinamik yasaları, akışkanlar mekaniği, ısı geçişi, güç santralleri ve iklimlendirme (HVAC).</div>
            </li>
            <li class="fragment">
              <span class="bullet-marker">04</span>
              <div><strong>Makine Teorisi, Sistem Dinamiği ve Kontrol:</strong> Mekanizma tekniği, mekanik titreşimler, otomatik kontrol sistemleri ve robotik.</div>
            </li>
            <li class="fragment">
              <span class="bullet-marker">05</span>
              <div><strong>Otomotiv ve Enerji Sistemleri:</strong> Taşıt dinamiği, içten yanmalı ve elektrikli tahrik sistemleri, alternatif enerji dönüşümleri.</div>
            </li>
          </ul>
        `
      },
      getSimulationSlideObject("gear", "1. HAFTA")
    ]
  },
  {
    id: "week-2",
    week: "2. Hafta",
    title: "Kuvvet, Moment ve Mukavemet: Kiriş Eğilme Analizi",
    description:
      "Statik denge denklemleri, iç kuvvetler, eğilme momenti kavramı ve ankastre kirişlerin yük altında sehim/gerilme analizi.",
    pptxUrl: "pptx/ME101-Hafta2.pptx",
    features: ["Ankastre Kiriş Analizi", "Hibrit Slayt Modu", "PPTX Arşivi"],
    slides: [
      {
        kicker: "2. HAFTA • STATİK VE MUKAVEMET",
        title: "Kuvvet, Moment ve Statik Denge İlkeleri",
        pptSummaryBullets: [
          "Düzlemde Statik Denge Denklemleri: ∑Fx = 0 , ∑Fy = 0 , ∑M_A = 0",
          "Kuvvet (F [N]): Cisimlerin hareket veya şekil değiştirme durumunu değiştiren etki.",
          "Moment (M = F · d [N·m]): Kuvvetin bir eksene göre döndürme/eğme etkisi.",
          "Mukavemet Analizi: Dış yükler altında oluşan iç gerilmelerin (σ, τ) hesabı."
        ],
        html: `
          <p class="lead">
            Bir taşıyıcı sistemin veya makine parçasının statik dengede kalabilmesi için üzerine etkiyen 
            tüm dış kuvvetlerin ve momentlerin bileşkesi sıfır olmalıdır.
          </p>
          <div class="slide-grid-2">
            <div>
              <div class="formula-box fragment">
                ∑ Fₓ = 0 , &nbsp; ∑ Fᵧ = 0 , &nbsp; ∑ M_A = 0
                <span class="formula-sub">İki Boyutlu Rijit Cisim Denge Denklemleri</span>
              </div>
              <ul class="bullet-list">
                <li class="fragment">
                  <span class="bullet-marker">I.</span>
                  <div><strong>Kuvvet (F [Newton]):</strong> Doğrultusu, yönü ve şiddeti olan vektörel büyüklüktür.</div>
                </li>
                <li class="fragment">
                  <span class="bullet-marker">II.</span>
                  <div><strong>Moment (M = F · d [N·m]):</strong> Kuvvetin uygulama hattının referans noktasına olan dik uzaklığı ile çarpımıdır.</div>
                </li>
              </ul>
            </div>
            <div class="info-card fragment">
              <h4>Rijit Cisimden Şekil Değiştiren Cisme Geçiş</h4>
              <p>
                Statik analizde cisimler <em>rijit</em> kabul edilirken, mukavemet dersinde gerçek malzemelerin yük altında esnediği ve kesit içinde <strong>Gerilme (σ)</strong> oluştuğu dikkate alınır.
              </p>
            </div>
          </div>
        `
      },
      getSimulationSlideObject("beam", "2. HAFTA")
    ]
  },
  {
    id: "week-3",
    week: "3. Hafta",
    title: "Malzeme Bilimi: Çekme Deneyi ve Gerilme – Şekil Değiştirme (σ - ε)",
    description:
      "Mühendislik malzemelerinin mekanik davranışları, Hooke Yasası, elastik/plastik şekil değiştirme ve tek eksenli çekme deneyi.",
    pptxUrl: "pptx/ME101-Hafta3.pptx",
    features: ["Çekme Deneyi Simülasyonu", "Hibrit Slayt Modu", "PPTX Arşivi"],
    slides: [
      {
        kicker: "3. HAFTA • MALZEME BİLİMİ",
        title: "Normal Gerilme (σ) ve Birim Şekil Değiştirme (ε)",
        pptSummaryBullets: [
          "Normal Gerilme: σ = F / A₀ [MPa = N/mm²]",
          "Birim Şekil Değiştirme: ε = ΔL / L₀ [Boyutsuz uzama oranı]",
          "Hooke Yasası (Lineer Elastik Bölge): σ = E · ε",
          "Elastisite Modülü (E): Malzemenin elastik şekil değiştirmeye karşı direnci."
        ],
        html: `
          <p class="lead">
            Malzemelerin mekanik dayanımını geometri ve boyuttan bağımsız olarak tanımlamak için iki temel büyüklük kullanılır:
          </p>
          <div class="slide-grid-2">
            <div class="info-card fragment">
              <h4>I. Mühendislik Gerilmesi (σ)</h4>
              <p>Birim başlangıç kesit alanına etkiyen dik iç kuvvettir. Birimi <strong>MPa (N/mm²)</strong> olarak ifade edilir.</p>
              <div class="formula-box">
                σ = F / A₀
                <span class="formula-sub">F: Eksenel Kuvvet [N] &nbsp;|&nbsp; A₀: İlk Kesit Alanı [mm²]</span>
              </div>
            </div>
            <div class="info-card fragment">
              <h4>II. Birim Şekil Değiştirme (ε)</h4>
              <p>Numunedeki boy değişiminin başlangıç ölçü boyuna oranıdır.</p>
              <div class="formula-box">
                ε = ΔL / L₀ = (L - L₀) / L₀
                <span class="formula-sub">L₀: İlk Ölçü Boyu &nbsp;|&nbsp; ΔL: Uzama Miktarı</span>
              </div>
            </div>
          </div>
          <div class="formula-box fragment" style="margin-top:1.1rem;">
            Hooke Yasası: &nbsp; σ = E · ε
            <span class="formula-sub">E (Young / Elastisite Modülü): Doğrunun eğimi olup malzemenin rijitliğini temsil eder.</span>
          </div>
        `
      },
      getSimulationSlideObject("tensile", "3. HAFTA")
    ]
  },
  {
    id: "week-4",
    week: "4. Hafta",
    title: "Mekanizma Tekniği: Krank-Biyel Mekanizması Kinematiği",
    description:
      "Dönme hareketini doğrusal harekete dönüştüren krank-biyel mekanizmasının konum, hız ve strok analizi.",
    pptxUrl: "pptx/ME101-Hafta4.pptx",
    features: ["Krank-Biyel Simülasyonu", "Hibrit Slayt Modu", "PPTX Arşivi"],
    slides: [getSimulationSlideObject("crank", "4. HAFTA")]
  }
];

// ============================================================================
// UYGULAMA DURUMU (STATE)
// ============================================================================
let currentLecture = null;
let isPresentationMode = false;
let currentSlideIndex = 0;
let animationFrameId = null;
let allSlidesInPptVisualMode = false;

let gearAngle1 = 0;
let gearAngle2 = 0;
let crankAngle = 0;
let tensileAutoTimer = null;

let isLaserActive = false;
let isPenActive = false;
let isDrawing = false;

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

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============================================================================
// YÖNTEM 2: BİREBİR POWERPOINT GÖRSEL LEVHASI ÜRETİCİ (KLASİK AKADEMİK TEMA)
// ============================================================================
function buildPptExactVisualHtml(slide, slideIdx, totalSlides, lectureWeek) {
  if (slide.pptImageUrl) {
    return `
      <div class="ppt-exact-frame">
        <img src="${slide.pptImageUrl}" alt="${escapeXml(slide.title)}" />
        <span class="ppt-frame-badge">Orijinal PowerPoint Slayt Görseli (Yöntem II)</span>
      </div>
    `;
  }

  const bullets = slide.pptSummaryBullets || [
    "ME 101 — Makine Mühendisliğine Giriş Ders Notu",
    "Üstteki butondan Web Görünümü ile PPT Levha Görünümü arasında geçiş yapabilirsiniz."
  ];

  const bulletSvgItems = bullets
    .slice(0, 6)
    .map((b, i) => {
      const y = 250 + i * 68;
      const text = b.length > 78 ? b.slice(0, 75) + "..." : b;
      return `
        <g transform="translate(85, ${y})">
          <rect x="0" y="-20" width="8" height="24" fill="#5c3d28" />
          <text x="24" y="0" fill="#241c15" font-family="Inter, sans-serif" font-size="24" font-weight="500">${escapeXml(text)}</text>
        </g>
      `;
    })
    .join("");

  const embeddedImg =
    slide.extractedImages && slide.extractedImages.length > 0
      ? `<image href="${slide.extractedImages[0]}" x="820" y="210" width="380" height="360" preserveAspectRatio="xMidYMid contain" />`
      : `
        <g transform="translate(940, 320)">
          <rect x="0" y="0" width="220" height="180" fill="#f5f2eb" stroke="#bfaf9c" stroke-width="2" />
          <line x1="0" y1="45" x2="220" y2="45" stroke="#d8cfc2" />
          <text x="110" y="30" text-anchor="middle" fill="#5c3d28" font-family="JetBrains Mono, monospace" font-size="16" font-weight="700">ME 101</text>
          <text x="110" y="105" text-anchor="middle" fill="#3b2818" font-family="Source Serif 4, Georgia, serif" font-size="22" font-weight="700">Teknik Şema</text>
          <text x="110" y="135" text-anchor="middle" fill="#6e6256" font-family="Inter, sans-serif" font-size="14">Slayt ${slideIdx + 1}</text>
        </g>
      `;

  return `
    <div class="ppt-exact-frame">
      <svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="720" fill="#fdfcfa" />
        <!-- Üst Akademik Başlık Bandı -->
        <rect x="0" y="0" width="1280" height="145" fill="#3b2818" />
        <rect x="0" y="145" width="1280" height="6" fill="#8c5a3c" />
        <text x="75" y="55" fill="#d8c3a5" font-family="JetBrains Mono, monospace" font-size="17" font-weight="600">${escapeXml(slide.kicker || lectureWeek)}</text>
        <text x="75" y="108" fill="#ffffff" font-family="Source Serif 4, Georgia, serif" font-size="34" font-weight="700">${escapeXml(slide.title)}</text>

        <!-- Maddeler -->
        ${bulletSvgItems}

        <!-- Sağ Teknik Kutu / Görsel -->
        ${embeddedImg}

        <!-- Alt Bilgi Çubuğu -->
        <line x1="60" y1="650" x2="1220" y2="650" stroke="#d8cfc2" stroke-width="2" />
        <text x="60" y="685" fill="#6e6256" font-family="Inter, sans-serif" font-size="17">ME 101 — Makine Mühendisliğine Giriş | PowerPoint Slayt Levhası</text>
        <text x="1220" y="685" text-anchor="end" fill="#3b2818" font-family="JetBrains Mono, monospace" font-size="17" font-weight="700">${slideIdx + 1} / ${totalSlides}</text>
      </svg>
      <span class="ppt-frame-badge">PPT Levha Görünümü (Yöntem II)</span>
    </div>
  `;
}

// ============================================================================
// 1. ÖĞRENCİ YILDIZ PUANLAMA SİSTEMİ VE DİKEY DERS LİSTESİ
// ============================================================================
const RATING_STORAGE_KEY = "me101_lecture_ratings_v1";

const DEFAULT_RATINGS = {
  "week-1": { baseSum: 58, baseCount: 12 },
  "week-2": { baseSum: 47, baseCount: 10 },
  "week-3": { baseSum: 44, baseCount: 9 },
  "week-4": { baseSum: 39, baseCount: 8 }
};

function getSavedUserRatings() {
  try {
    const raw = localStorage.getItem(RATING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserRating(lectureId, starValue) {
  try {
    const current = getSavedUserRatings();
    current[lectureId] = starValue;
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // localStorage kapalıysa sessizce devam et
  }
}

function getLectureRatingStats(lectureId) {
  const userRatings = getSavedUserRatings();
  const userVote = userRatings[lectureId] || 0;
  const base = DEFAULT_RATINGS[lectureId] || { baseSum: 23, baseCount: 5 };
  const totalSum = base.baseSum + (userVote > 0 ? userVote : 0);
  const totalCount = base.baseCount + (userVote > 0 ? 1 : 0);
  const avg = (totalSum / totalCount).toFixed(1);
  return { avg, totalCount, userVote };
}

function renderCatalog() {
  lectureGrid.innerHTML = "";
  LECTURES.forEach((lec) => {
    const card = document.createElement("article");
    card.className = "lecture-card";
    const pptxHref = lec.pptxUrl || "pptx/ME101-Hafta1.pptx";
    const downloadFileName = lec.pptxFileName || `${lec.week.replace(/\s+/g, "")}-ME101.pptx`;

    const stats = getLectureRatingStats(lec.id);
    const activeStarThreshold = stats.userVote > 0 ? stats.userVote : Math.round(parseFloat(stats.avg));

    let starsHtml = "";
    for (let s = 1; s <= 5; s++) {
      const filledClass = s <= activeStarThreshold ? "filled" : "";
      starsHtml += `<button type="button" class="star-btn ${filledClass}" data-lec="${lec.id}" data-val="${s}" title="${s} Yıldız Ver">&#9733;</button>`;
    }

    card.innerHTML = `
      <div class="lecture-week-col">
        <span class="week-tag">${lec.week}</span>
        <span class="slide-count-tag">${lec.slides.length} Bölüm / Slayt</span>
      </div>

      <div class="lecture-info-col">
        <h4>${lec.title}</h4>
        <p>${lec.description}</p>
        <div class="card-features">
          ${lec.features.map((f) => `<span class="feature-chip">${f}</span>`).join("")}
        </div>
      </div>

      <div class="lecture-right-col">
        <div class="rating-box" data-rating-box="${lec.id}">
          <div class="star-group" data-star-group="${lec.id}">
            ${starsHtml}
          </div>
          <span class="rating-meta">
            <strong>${stats.avg}</strong> / 5.0 (${stats.totalCount} oy)
          </span>
          ${stats.userVote > 0 ? `<span class="rating-user-note">Puanınız: ${stats.userVote}&#9733;</span>` : ""}
        </div>

        <div class="card-actions-3">
          <button class="btn btn-secondary btn-read" data-id="${lec.id}">
            Ders Notu
          </button>
          <button class="btn btn-primary btn-present" data-id="${lec.id}">
            Sunumu Başlat
          </button>
          <a href="${pptxHref}" download="${downloadFileName}" class="btn btn-outline" title="Orijinal PowerPoint (.pptx) dosyasını indir">
            PPTX İndir
          </a>
        </div>
      </div>
    `;
    lectureGrid.appendChild(card);
  });

  // Yıldız hover ve tıklama etkileşimleri
  document.querySelectorAll(".star-group").forEach((groupEl) => {
    const buttons = Array.from(groupEl.querySelectorAll(".star-btn"));
    buttons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        const hoverVal = parseInt(btn.dataset.val, 10);
        buttons.forEach((b) => {
          const v = parseInt(b.dataset.val, 10);
          b.classList.toggle("hover-preview", v <= hoverVal);
        });
      });
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const lecId = btn.dataset.lec;
        const val = parseInt(btn.dataset.val, 10);
        saveUserRating(lecId, val);
        renderCatalog();
      });
    });
    groupEl.addEventListener("mouseleave", () => {
      buttons.forEach((b) => b.classList.remove("hover-preview"));
    });
  });

  document.querySelectorAll(".btn-read").forEach((btn) => {
    btn.addEventListener("click", () => openLecture(btn.dataset.id, false));
  });
  document.querySelectorAll(".btn-present").forEach((btn) => {
    btn.addEventListener("click", () => openLecture(btn.dataset.id, true));
  });
}

// ============================================================================
// 2. DERS AÇMA
// ============================================================================
function openLecture(lectureId, startInPresentation = false) {
  const lec = LECTURES.find((l) => l.id === lectureId);
  if (!lec) return;
  currentLecture = lec;
  currentSlideIndex = 0;
  allSlidesInPptVisualMode = false;

  catalogView.classList.add("hidden");
  lectureView.classList.remove("hidden");
  lectureNavActions.classList.remove("hidden");
  navCurrentLectureTitle.textContent = `${lec.week}: ${lec.title.split(":")[0]}`;
  presLectureName.textContent = `${lec.week}`;

  const pptxHref = lec.pptxUrl || "pptx/ME101-Hafta1.pptx";
  const downloadName = lec.pptxFileName || `${lec.week.replace(/\s+/g, "")}-ME101.pptx`;
  const navDl = document.getElementById("btn-nav-download-pptx");
  const bannerDl = document.getElementById("btn-banner-download-pptx");
  navDl.href = pptxHref;
  navDl.setAttribute("download", downloadName);
  bannerDl.href = pptxHref;
  bannerDl.setAttribute("download", downloadName);

  slidesContainer.innerHTML = "";
  lec.slides.forEach((s, idx) => {
    const slideEl = document.createElement("section");
    slideEl.className = "slide";
    slideEl.dataset.index = idx;
    slideEl.dataset.viewMode = s.defaultViewMode || "web";

    const pptVisualHtml = buildPptExactVisualHtml(s, idx, lec.slides.length, lec.week);
    const isPptMode = slideEl.dataset.viewMode === "ppt";

    slideEl.innerHTML = `
      <div class="slide-top-controls interactive-zone">
        <button class="btn-slide-mode-switch ${isPptMode ? "ppt-visual-active" : ""}" data-slide-idx="${idx}">
          ${isPptMode ? "Web Görünümüne Geç" : "PPT Levha Görünümü"}
        </button>
        <span class="slide-number-badge">Slayt ${idx + 1} / ${lec.slides.length}</span>
      </div>
      <div class="slide-kicker">${s.kicker}</div>
      <h2>${s.title}</h2>
      <div class="slide-body-web ${isPptMode ? "hidden" : ""}">${s.html}</div>
      <div class="slide-body-ppt ${isPptMode ? "" : "hidden"}">${pptVisualHtml}</div>
    `;
    slidesContainer.appendChild(slideEl);
  });

  document.querySelectorAll(".btn-slide-mode-switch").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.slideIdx, 10);
      toggleSingleSlideViewMode(idx);
    });
  });

  initSimulations();

  if (startInPresentation) {
    enterPresentationMode();
  } else {
    exitPresentationMode();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function toggleSingleSlideViewMode(slideIdx) {
  const slideEl = document.querySelector(`.slide[data-index="${slideIdx}"]`);
  if (!slideEl) return;
  const webBody = slideEl.querySelector(".slide-body-web");
  const pptBody = slideEl.querySelector(".slide-body-ppt");
  const switchBtn = slideEl.querySelector(".btn-slide-mode-switch");

  const nextMode = slideEl.dataset.viewMode === "web" ? "ppt" : "web";
  slideEl.dataset.viewMode = nextMode;

  if (nextMode === "ppt") {
    webBody.classList.add("hidden");
    pptBody.classList.remove("hidden");
    switchBtn.classList.add("ppt-visual-active");
    switchBtn.textContent = "Web Görünümüne Geç";
  } else {
    pptBody.classList.add("hidden");
    webBody.classList.remove("hidden");
    switchBtn.classList.remove("ppt-visual-active");
    switchBtn.textContent = "PPT Levha Görünümü";
  }
  updatePresentationHUD();
}

document.getElementById("btn-toggle-all-slide-modes").addEventListener("click", () => {
  allSlidesInPptVisualMode = !allSlidesInPptVisualMode;
  const targetMode = allSlidesInPptVisualMode ? "ppt" : "web";
  document.querySelectorAll(".slide").forEach((slideEl) => {
    const idx = parseInt(slideEl.dataset.index, 10);
    if (slideEl.dataset.viewMode !== targetMode) {
      toggleSingleSlideViewMode(idx);
    }
  });
  document.getElementById("btn-toggle-all-slide-modes").textContent = allSlidesInPptVisualMode
    ? "Tümünü Web Görünümüne Al"
    : "Tümünü PPT Levha Görünümüne Al";
});

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
// 3. SUNUM MODU YÖNETİMİ
// ============================================================================
function enterPresentationMode() {
  if (!currentLecture) return;
  isPresentationMode = true;
  document.body.classList.add("presentation-mode");
  presentationToolbar.classList.remove("hidden");

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
    const isPptMode = activeSlide.dataset.viewMode === "ppt";
    const presViewBtn = document.getElementById("btn-pres-view-mode");
    if (presViewBtn) {
      presViewBtn.textContent = isPptMode ? "Web Görünümü" : "PPT Levhası";
    }

    const allFragments = activeSlide.querySelectorAll(".slide-body-web .fragment");
    const visibleFragments = activeSlide.querySelectorAll(".slide-body-web .fragment.visible");
    if (!isPptMode && allFragments.length > 0) {
      stepIndicator.classList.remove("hidden");
      stepIndicator.textContent = `Adım ${visibleFragments.length}/${allFragments.length}`;
    } else {
      stepIndicator.classList.add("hidden");
    }
  }

  const progress = ((currentSlideIndex + 1) / totalSlides) * 100;
  presProgressBar.style.width = `${progress}%`;
}

function nextStepOrSlide() {
  if (!isPresentationMode || !currentLecture) return;
  const activeSlide = document.querySelector(".slide.active-slide");
  if (!activeSlide) return;

  if (activeSlide.dataset.viewMode !== "ppt") {
    const hiddenFragments = activeSlide.querySelectorAll(".slide-body-web .fragment:not(.visible)");
    if (hiddenFragments.length > 0) {
      hiddenFragments[0].classList.add("visible");
      updatePresentationHUD();
      return;
    }
  }

  if (currentSlideIndex < currentLecture.slides.length - 1) {
    currentSlideIndex++;
    updateActiveSlide();
  }
}

function prevStepOrSlide() {
  if (!isPresentationMode || !currentLecture) return;
  const activeSlide = document.querySelector(".slide.active-slide");
  if (!activeSlide) return;

  if (activeSlide.dataset.viewMode !== "ppt") {
    const visibleFragments = activeSlide.querySelectorAll(".slide-body-web .fragment.visible");
    if (visibleFragments.length > 0) {
      visibleFragments[visibleFragments.length - 1].classList.remove("visible");
      updatePresentationHUD();
      return;
    }
  }

  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    updateActiveSlide();
  }
}

// ============================================================================
// 4. PPTX ENTEGRASYON MERKEZİ
// ============================================================================
const pptxModalBackdrop = document.getElementById("pptx-modal-backdrop");
const inpPptxFile = document.getElementById("inp-pptx-file");
const btnProcessPptx = document.getElementById("btn-process-pptx");
const pptxFileStatus = document.getElementById("pptx-file-status");
let selectedPptxFile = null;
let selectedSlideImages = [];

function openPptxModal() {
  pptxModalBackdrop.classList.remove("hidden");
}

function closePptxModal() {
  pptxModalBackdrop.classList.add("hidden");
}

document.getElementById("btn-open-pptx-modal").addEventListener("click", openPptxModal);
document.getElementById("btn-hero-pptx-modal").addEventListener("click", openPptxModal);
document.getElementById("btn-close-pptx-modal").addEventListener("click", closePptxModal);

document.querySelectorAll(".modal-tab").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    document.querySelectorAll(".modal-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((p) => p.classList.add("hidden"));
    tabBtn.classList.add("active");
    document.getElementById(tabBtn.dataset.tab).classList.remove("hidden");
  });
});

const pptxDropzone = document.getElementById("pptx-dropzone");
pptxDropzone.addEventListener("click", () => inpPptxFile.click());
pptxDropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  pptxDropzone.style.borderColor = "#5c3d28";
});
pptxDropzone.addEventListener("dragleave", () => {
  pptxDropzone.style.borderColor = "#bfaf9c";
});
pptxDropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handlePptxFileChosen(e.dataTransfer.files[0]);
  }
});
inpPptxFile.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    handlePptxFileChosen(e.target.files[0]);
  }
});

function handlePptxFileChosen(file) {
  selectedPptxFile = file;
  pptxFileStatus.innerHTML = `Seçilen dosya: <strong>${escapeXml(file.name)}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
  btnProcessPptx.disabled = false;
  const titleInput = document.getElementById("imp-title");
  if (!titleInput.value.trim()) {
    titleInput.value = file.name.replace(/\.pptx$/i, "").replace(/[-_]/g, " ");
  }
}

btnProcessPptx.addEventListener("click", async () => {
  if (!selectedPptxFile) return;
  btnProcessPptx.disabled = true;
  btnProcessPptx.textContent = "PPTX Çözümleniyor...";

  try {
    const zip = await JSZip.loadAsync(selectedPptxFile);
    const weekLabel = document.getElementById("imp-week").value.trim() || `${LECTURES.length + 1}. Hafta`;
    const customTitle = document.getElementById("imp-title").value.trim() || selectedPptxFile.name.replace(/\.pptx$/i, "");
    const simType = document.getElementById("imp-sim-type").value;

    const mediaMap = {};
    const mediaFiles = Object.keys(zip.files).filter((k) => k.startsWith("ppt/media/"));
    for (const mediaPath of mediaFiles) {
      const ext = mediaPath.split(".").pop().toLowerCase();
      if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) {
        const base64 = await zip.file(mediaPath).async("base64");
        const mime = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
        mediaMap[mediaPath.split("/").pop()] = `data:${mime};base64,${base64}`;
      }
    }

    const slideFiles = Object.keys(zip.files)
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
        const nb = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
        return na - nb;
      });

    const parsedSlides = [];
    const parser = new DOMParser();

    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i];
      const slideNum = i + 1;
      const xmlText = await zip.file(slidePath).async("text");
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");

      const relPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
      const slideImages = [];
      if (zip.file(relPath)) {
        const relText = await zip.file(relPath).async("text");
        const relDoc = parser.parseFromString(relText, "application/xml");
        const relNodes = Array.from(relDoc.getElementsByTagName("Relationship"));
        relNodes.forEach((rn) => {
          const target = rn.getAttribute("Target") || "";
          const fileName = target.split("/").pop();
          if (mediaMap[fileName]) {
            slideImages.push(mediaMap[fileName]);
          }
        });
      }

      const pNodes = Array.from(xmlDoc.getElementsByTagName("a:p"));
      const lines = [];
      pNodes.forEach((p) => {
        const tNodes = Array.from(p.getElementsByTagName("a:t"));
        const lineStr = tNodes.map((t) => t.textContent).join("").trim();
        if (lineStr) lines.push(lineStr);
      });

      const slideTitle = lines.length > 0 ? lines[0] : `${customTitle} — Bölüm ${slideNum}`;
      const bulletLines = lines.length > 1 ? lines.slice(1) : ["PowerPoint (.pptx) dosyasından aktarılmış içerik."];

      const bulletsHtml = bulletLines
        .map(
          (b, bIdx) => `
          <li class="fragment">
            <span class="bullet-marker">${String(bIdx + 1).padStart(2, "0")}</span>
            <div>${escapeXml(b)}</div>
          </li>
        `
        )
        .join("");

      const imagesHtml =
        slideImages.length > 0
          ? `
          <div class="info-card fragment" style="text-align:center;">
            <h4>Slayt Şeması / Görseli</h4>
            <img src="${slideImages[0]}" style="max-width:100%; max-height:280px; border-radius:4px; margin-top:0.5rem;" alt="Slayt Görseli" />
          </div>
        `
          : "";

      const layoutHtml =
        slideImages.length > 0
          ? `<div class="slide-grid-2"><ul class="bullet-list">${bulletsHtml}</ul>${imagesHtml}</div>`
          : `<ul class="bullet-list">${bulletsHtml}</ul>`;

      parsedSlides.push({
        kicker: `${weekLabel.toUpperCase()} • BÖLÜM ${slideNum}`,
        title: slideTitle,
        pptSummaryBullets: bulletLines,
        extractedImages: slideImages,
        html: layoutHtml
      });
    }

    if (simType !== "none") {
      parsedSlides.push(getSimulationSlideObject(simType, weekLabel.toUpperCase()));
    }

    const pptxBlobUrl = URL.createObjectURL(selectedPptxFile);

    const newLecture = {
      id: `custom-${Date.now()}`,
      week: weekLabel,
      title: customTitle,
      description: `${selectedPptxFile.name} dosyasından aktarılmış ders içeriği.`,
      pptxUrl: pptxBlobUrl,
      pptxFileName: selectedPptxFile.name,
      features: ["PPTX'ten Aktarıldı", "Hibrit Slayt Modu", "PPTX Arşivi"],
      slides: parsedSlides
    };

    LECTURES.push(newLecture);
    renderCatalog();
    closePptxModal();
    openLecture(newLecture.id, false);
  } catch (err) {
    alert("PPTX dosyası okunurken bir hata oluştu: " + err.message);
  } finally {
    btnProcessPptx.disabled = false;
    btnProcessPptx.textContent = "Dosyayı Dönüştür ve Derslere Ekle";
  }
});

// TAB 2: Çoklu Slayt Görseli (.PNG / .JPG)
const imgDropzone = document.getElementById("img-dropzone");
const inpSlideImages = document.getElementById("inp-slide-images");
const btnProcessImages = document.getElementById("btn-process-images");

imgDropzone.addEventListener("click", () => inpSlideImages.click());
inpSlideImages.addEventListener("change", (e) => {
  selectedSlideImages = Array.from(e.target.files || []);
  if (selectedSlideImages.length > 0) {
    document.getElementById("img-files-status").innerHTML =
      `<strong>${selectedSlideImages.length} adet</strong> slayt görseli seçildi.`;
    btnProcessImages.disabled = false;
  }
});

btnProcessImages.addEventListener("click", () => {
  if (selectedSlideImages.length === 0) return;
  const weekLabel = document.getElementById("img-imp-week").value.trim() || "Ek Ders";
  const titleLabel = document.getElementById("img-imp-title").value.trim() || "PowerPoint Görsel Sunumu";

  const imageSlides = selectedSlideImages.map((file, idx) => {
    const imgUrl = URL.createObjectURL(file);
    return {
      kicker: `${weekLabel.toUpperCase()} • SLAYT ${idx + 1}`,
      title: `${titleLabel} — Slayt ${idx + 1}`,
      defaultViewMode: "ppt",
      pptImageUrl: imgUrl,
      pptSummaryBullets: [file.name],
      html: `
        <div class="ppt-exact-frame">
          <img src="${imgUrl}" alt="Slayt ${idx + 1}" />
          <span class="ppt-frame-badge">Orijinal PowerPoint Slayt Görseli</span>
        </div>
      `
    };
  });

  const newLec = {
    id: `img-lec-${Date.now()}`,
    week: weekLabel,
    title: titleLabel,
    description: `${selectedSlideImages.length} adet slayt görseli ile oluşturulmuş sunum.`,
    pptxUrl: "pptx/ME101-Hafta1.pptx",
    features: ["Birebir Görsel Koruma", "Lazer ve Kalem Destekli"],
    slides: imageSlides
  };

  LECTURES.push(newLec);
  renderCatalog();
  closePptxModal();
  openLecture(newLec.id, true);
});

document.getElementById("btn-export-json").addEventListener("click", () => {
  const jsonStr = JSON.stringify(LECTURES, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    const btn = document.getElementById("btn-export-json");
    btn.textContent = "Ders Verisi Panoya Kopyalandı";
    setTimeout(() => {
      btn.textContent = "Ders Verisini (JSON) Kopyala";
    }, 2500);
  });
});

// ============================================================================
// 5. TEKNİK MÜHENDİSLİK SİMÜLASYONLARI (AÇIK RENK TEKNİK ÇİZİM STİLİ)
// ============================================================================
function drawDraftingGrid(ctx, w, h) {
  ctx.fillStyle = "#faf8f4";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#ece6dc";
  ctx.lineWidth = 1;
  const step = 24;
  for (let x = step; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = step; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

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

function drawGear(ctx, cx, cy, teeth, modulePitch, angle, fillColor, strokeColor, label) {
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
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  // Kamalı mil ekseni işareti
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(pitchRadius * 0.78, 0);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, Math.max(8, rootRadius * 0.32), 0, Math.PI * 2);
  ctx.fillStyle = "#faf8f4";
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = "#3b2818";
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
  gearAngle1 += omega1 * dt * 0.35;
  gearAngle2 = -(gearAngle1 * n1) / n2 + Math.PI / n2;

  drawDraftingGrid(ctx, canvas.width, canvas.height);

  const totalSpan = r1 * 2 + r2 * 2;
  const startX = (canvas.width - totalSpan) / 2 + r1;
  const cy = canvas.height / 2 - 10;
  const cx1 = startX;
  const cx2 = cx1 + r1 + r2 + mod * 0.25;

  drawGear(ctx, cx1, cy, n1, mod, gearAngle1, "#d8c3a5", "#3b2818", `Giriş Dişlisi (N₁=${n1})`);
  drawGear(ctx, cx2, cy, n2, mod, gearAngle2, "#c29b77", "#3b2818", `Çıkış Dişlisi (N₂=${n2})`);
}

function setupBeamSim() {
  const canvas = document.getElementById("beam-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const inpF = document.getElementById("inp-beam-f");
  const inpL = document.getElementById("inp-beam-l");
  const inpMat = document.getElementById("inp-beam-mat");

  function renderBeam() {
    const F = parseFloat(inpF.value);
    const L = parseFloat(inpL.value);
    const [E_GPa, yieldMPa] = inpMat.value.split("|").map(Number);

    document.getElementById("val-beam-f").textContent = `${F} N`;
    document.getElementById("val-beam-l").textContent = `${L.toFixed(1)} m`;

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
      badge.textContent = `AKMA SINIRI AŞILDI (σ > ${yieldMPa} MPa)`;
      badge.style.color = "#9b2226";
    } else {
      const sf = (yieldMPa / sigma_MPa).toFixed(2);
      badge.textContent = `EMNİYETLİ (Emniyet Katsayısı S = ${sf})`;
      badge.style.color = "#2d6a4f";
    }

    drawDraftingGrid(ctx, canvas.width, canvas.height);

    // Ankastre mesnet taraması
    ctx.fillStyle = "#d8cfc2";
    ctx.fillRect(35, 30, 18, 155);
    ctx.strokeStyle = "#3b2818";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(53, 30);
    ctx.lineTo(53, 185);
    ctx.stroke();

    const beamPxLen = 140 + L * 95;
    const y0 = 85;
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#8c7d70";
    ctx.beginPath();
    ctx.moveTo(53, y0);
    ctx.lineTo(53 + beamPxLen, y0);
    ctx.stroke();
    ctx.restore();

    const maxVisualDef = Math.min(72, delta_mm * 2.2);
    const segments = 30;
    for (let i = 0; i < segments; i++) {
      const xi1 = i / segments;
      const xi2 = (i + 1) / segments;
      const def1 = maxVisualDef * 0.5 * (3 * xi1 * xi1 - xi1 * xi1 * xi1);
      const def2 = maxVisualDef * 0.5 * (3 * xi2 * xi2 - xi2 * xi2 * xi2);

      const x1 = 53 + xi1 * beamPxLen;
      const x2 = 53 + xi2 * beamPxLen;

      const stressRatio = Math.min(1, (1 - xi1) * (sigma_MPa / yieldMPa));
      // Kahverengi/Bronzdan Koyu Kırmızıya teknik gerilme gradyanı
      const rCol = Math.round(92 + stressRatio * 95);
      const gCol = Math.round(61 - stressRatio * 35);
      const bCol = Math.round(40 - stressRatio * 20);

      ctx.strokeStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
      ctx.lineWidth = 16;
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.moveTo(x1, y0 + def1);
      ctx.lineTo(x2, y0 + def2);
      ctx.stroke();
    }

    const tipX = 53 + beamPxLen;
    const tipY = y0 + maxVisualDef;
    ctx.strokeStyle = "#9b2226";
    ctx.fillStyle = "#9b2226";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY - 46);
    ctx.lineTo(tipX, tipY - 11);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tipX, tipY - 7);
    ctx.lineTo(tipX - 5, tipY - 17);
    ctx.lineTo(tipX + 5, tipY - 17);
    ctx.closePath();
    ctx.fill();

    ctx.font = "700 12px JetBrains Mono, monospace";
    ctx.fillText(`F = ${F} N`, tipX - 35, tipY - 52);

    ctx.fillStyle = "#4a3f35";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Kesit: 40×25 mm Dikdörtgen | Maksimum eğilme momenti ankastre mesnet (x = 0) noktasındadır.", 53, 206);
  }

  [inpF, inpL, inpMat].forEach((el) => el.addEventListener("input", renderBeam));
  renderBeam();
}

function setupTensileSim() {
  const canvas = document.getElementById("tensile-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const inpStrain = document.getElementById("inp-strain");
  const btnPlay = document.getElementById("btn-play-tensile");

  function computeStress(epsPercent) {
    if (epsPercent <= 1.2) {
      return (epsPercent / 1.2) * 250;
    } else if (epsPercent <= 2.5) {
      return 250 + Math.sin((epsPercent - 1.2) * 12) * 6;
    } else if (epsPercent <= 16) {
      const norm = (epsPercent - 2.5) / 13.5;
      return 250 + 170 * Math.sin(norm * (Math.PI / 2));
    } else if (epsPercent <= 23.5) {
      const norm = (epsPercent - 16) / 7.5;
      return 420 - 90 * norm * norm;
    } else {
      return 0;
    }
  }

  function renderTensile() {
    const eps = parseFloat(inpStrain.value);
    const sigma = computeStress(eps);

    document.getElementById("val-strain").textContent = `%${eps.toFixed(1)}`;
    document.getElementById("out-tensile-sigma").textContent =
      eps > 23.5 ? "KOPMA (0 MPa)" : `${sigma.toFixed(0)} MPa`;

    const badge = document.getElementById("tensile-region-badge");
    if (eps <= 1.2) {
      badge.textContent = "Bölge I: Elastik Bölge (Hooke Yasası Geçerli)";
      badge.style.color = "#5c3d28";
    } else if (eps <= 2.5) {
      badge.textContent = "Bölge II: Akma Sahanlığı (Lüders Bantları / Kalıcı Deformasyon)";
      badge.style.color = "#8c5a3c";
    } else if (eps <= 16) {
      badge.textContent = "Bölge III: Pekleşme Bölgesi (Dislokasyon Yoğunluğu Artışı)";
      badge.style.color = "#2d6a4f";
    } else if (eps <= 23.5) {
      badge.textContent = "Bölge IV: Boyun Verme (Yerel Kesit Daralması)";
      badge.style.color = "#9b2226";
    } else {
      badge.textContent = "Bölge V: KOPMA (Numune Ayrılması)";
      badge.style.color = "#9b2226";
    }

    drawDraftingGrid(ctx, canvas.width, canvas.height);

    const specY = 95;
    const baseLen = 140;
    const stretchPx = eps * 2.8;
    const totalLen = baseLen + stretchPx;
    const startX = 45;

    ctx.fillStyle = "#5c3d28";
    ctx.fillRect(startX - 22, specY - 22, 22, 44);
    ctx.fillRect(startX + totalLen, specY - 22, 22, 44);

    const neckFactor = eps > 16 ? Math.min(0.65, (eps - 16) / 11) : 0;
    const halfThick = 14 * (1 - eps * 0.008);
    const neckHalfThick = halfThick * (1 - neckFactor);
    const midX = startX + totalLen / 2;

    ctx.fillStyle = eps > 23.5 ? "#9b2226" : "#b08968";
    ctx.strokeStyle = "#3b2818";
    ctx.lineWidth = 1.5;

    if (eps <= 23.5) {
      ctx.beginPath();
      ctx.moveTo(startX, specY - halfThick);
      ctx.quadraticCurveTo(midX, specY - neckHalfThick, startX + totalLen, specY - halfThick);
      ctx.lineTo(startX + totalLen, specY + halfThick);
      ctx.quadraticCurveTo(midX, specY + neckHalfThick, startX, specY + halfThick);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(startX, specY - halfThick, totalLen * 0.44, halfThick * 2);
      ctx.strokeRect(startX, specY - halfThick, totalLen * 0.44, halfThick * 2);
      ctx.fillRect(startX + totalLen * 0.56, specY - halfThick, totalLen * 0.44, halfThick * 2);
      ctx.strokeRect(startX + totalLen * 0.56, specY - halfThick, totalLen * 0.44, halfThick * 2);
    }

    ctx.fillStyle = "#3b2818";
    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillText("Çekme Numunesi (L₀ + ΔL)", startX + 15, specY + 55);

    const gx = 340;
    const gy = 205;
    const gw = 380;
    const gh = 175;

    ctx.strokeStyle = "#3b2818";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy - gh);
    ctx.lineTo(gx, gy);
    ctx.lineTo(gx + gw, gy);
    ctx.stroke();

    ctx.fillStyle = "#3b2818";
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillText("σ (Gerilme [MPa])", gx + 8, gy - gh + 10);
    ctx.fillText("ε (% Birim Uzama)", gx + gw - 105, gy - 8);

    ctx.beginPath();
    for (let e = 0; e <= 23.5; e += 0.25) {
      const s = computeStress(e);
      const px = gx + (e / 25) * gw;
      const py = gy - (s / 460) * gh;
      if (e === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "#d8cfc2";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    const limitE = Math.min(eps, 23.5);
    for (let e = 0; e <= limitE; e += 0.2) {
      const s = computeStress(e);
      const px = gx + (e / 25) * gw;
      const py = gy - (s / 460) * gh;
      if (e === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "#5c3d28";
    ctx.lineWidth = 3;
    ctx.stroke();

    const curX = gx + (limitE / 25) * gw;
    const curY = gy - (computeStress(limitE) / 460) * gh;
    ctx.beginPath();
    ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#9b2226";
    ctx.fill();
  }

  inpStrain.addEventListener("input", renderTensile);
  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      if (tensileAutoTimer) {
        clearInterval(tensileAutoTimer);
        tensileAutoTimer = null;
        btnPlay.textContent = "Deneyi Otomatik Başlat";
        return;
      }
      inpStrain.value = 0;
      btnPlay.textContent = "Durdur";
      tensileAutoTimer = setInterval(() => {
        let v = parseFloat(inpStrain.value) + 0.25;
        if (v > 25) {
          clearInterval(tensileAutoTimer);
          tensileAutoTimer = null;
          btnPlay.textContent = "Deneyi Tekrar Başlat";
          return;
        }
        inpStrain.value = v;
        renderTensile();
      }, 45);
    });
  }
  renderTensile();
}

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

  const cx = 115;
  const cy = canvas.height / 2;

  const pinX = cx + r * Math.cos(crankAngle);
  const pinY = cy + r * Math.sin(crankAngle);

  const dy = pinY - cy;
  const dxRod = Math.sqrt(Math.max(10, l * l - dy * dy));
  const pistonX = pinX + dxRod;

  const r_m = r / 1000;
  const lambda = r / l;
  const vel =
    r_m * omega * (Math.sin(crankAngle) + (lambda / 2) * Math.sin(2 * crankAngle));

  const deg = Math.round((crankAngle * 180) / Math.PI) % 360;
  document.getElementById("out-crank-angle").textContent = `${deg}°`;
  document.getElementById("out-crank-vel").textContent = `${Math.abs(vel).toFixed(2)} m/s`;

  drawDraftingGrid(ctx, canvas.width, canvas.height);

  const minPistonX = cx + l - r;
  const maxPistonX = cx + l + r;
  ctx.strokeStyle = "#6e6256";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(minPistonX - 18, cy - 32);
  ctx.lineTo(maxPistonX + 52, cy - 32);
  ctx.moveTo(minPistonX - 18, cy + 32);
  ctx.lineTo(maxPistonX + 52, cy + 32);
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#8c5a3c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "#3b2818";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(pinX, pinY);
  ctx.stroke();

  ctx.strokeStyle = "#8c5a3c";
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(pinX, pinY);
  ctx.lineTo(pistonX, cy);
  ctx.stroke();

  ctx.fillStyle = "#d8c3a5";
  ctx.fillRect(pistonX - 14, cy - 28, 42, 56);
  ctx.strokeStyle = "#3b2818";
  ctx.lineWidth = 2;
  ctx.strokeRect(pistonX - 14, cy - 28, 42, 56);

  [
    [cx, cy],
    [pinX, pinY],
    [pistonX, cy]
  ].forEach(([mx, my]) => {
    ctx.beginPath();
    ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#faf8f4";
    ctx.fill();
    ctx.strokeStyle = "#3b2818";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// ============================================================================
// 6. LAZER İMLECİ & KALEM MODU
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
  drawCtx.strokeStyle = "#9b2226";
  drawCtx.lineWidth = 3;
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
// 7. OLAY DİNLEYİCİLERİ
// ============================================================================
document.getElementById("btn-home").addEventListener("click", goHome);
document.getElementById("btn-back-catalog").addEventListener("click", goHome);
document.getElementById("btn-start-presentation").addEventListener("click", enterPresentationMode);
document.getElementById("btn-banner-present").addEventListener("click", enterPresentationMode);

document.getElementById("btn-prev-slide").addEventListener("click", prevStepOrSlide);
document.getElementById("btn-next-slide").addEventListener("click", nextStepOrSlide);
document.getElementById("btn-pres-view-mode").addEventListener("click", () => {
  toggleSingleSlideViewMode(currentSlideIndex);
});
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
  } else if (e.key.toLowerCase() === "v") {
    toggleSingleSlideViewMode(currentSlideIndex);
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

renderCatalog();
