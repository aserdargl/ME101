// ============================================================================
// ME 101 - MAKİNE MÜHENDİSLİĞİNE GİRİŞ | 3 YÖNTEMLİ DERS VE SUNUM MOTORU
// ============================================================================

// Yardımcı: Simülasyon HTML şablonları (İçe aktarılan PPTX'lere de eklenebilir)
function getSimulationSlideObject(simType, weekLabel) {
  if (simType === "gear") {
    return {
      kicker: `${weekLabel} • ETKİLEŞİMLİ LABORATUVAR`,
      title: "Canlı Simülasyon: Dişli Çarklar, Çevrim Oranı ve Tork İletimi",
      pptSummaryBullets: [
        "Çevrim Oranı: i = N₂ / N₁ = ω₁ / ω₂ = T₂ / T₁",
        "Hız düşürülürken döndürme momenti (tork) aynı oranda artar.",
        "Canlı simülasyon üzerinden N₁, N₂, devir ve tork değerlerini test edin."
      ],
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
    };
  }
  if (simType === "beam") {
    return {
      kicker: `${weekLabel} • ETKİLEŞİMLİ LABORATUVAR`,
      title: "Canlı Simülasyon: Ankastre Kiriş Eğilme ve Gerilme Analizi",
      pptSummaryBullets: [
        "Maksimum Eğilme Momenti: M_max = F · L (Ankastre mesnette)",
        "Maksimum Uç Çökmesi (Sehim): δ_max = (F · L³) / (3 · E · I)",
        "Malzeme değişiminin (Çelik, Alüminyum, Titanyum) rijitliğe etkisi"
      ],
      html: `
        <p class="lead">
          Sol ucundan duvara sabitlenmiş (ankastre) bir kirişin ucuna <strong>F kuvveti</strong> uygulandığında oluşan 
          çökmeyi (δ_max) ve gerilmeyi (σ_max) malzeme değiştirerek test edin:
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
    };
  }
  if (simType === "tensile") {
    return {
      kicker: `${weekLabel} • ETKİLEŞİMLİ LABORATUVAR`,
      title: "Canlı Simülasyon: Çekme Deneyi ve σ - ε Diyagramı",
      pptSummaryBullets: [
        "Elastik Bölge: Hooke Yasası (σ = E · ε) geçerlidir, kalıcı uzama olmaz.",
        "Akma Noktası (Re): Kalıcı plastik şekil değiştirmenin başladığı sınır.",
        "Pekleşme, Çekme Dayanımı (Rm), Boyun Verme (Necking) ve Kopma."
      ],
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
    };
  }
  return {
    kicker: `${weekLabel} • MEKANİZMA TEKNİĞİ`,
    title: "Krank-Biyel (Slider-Crank) Mekanizması",
    pptSummaryBullets: [
      "Tam dönme hareketini doğrusal gidip-gelme hareketine dönüştürür.",
      "Kurs Boyu (Strok): H = 2 · r (ÜÖN ile AÖN arası mesafe)",
      "Anlık Piston Hızı: Vp = r · ω · (sin θ + (λ/2) · sin 2θ)"
    ],
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
  };
}

const LECTURES = [
  {
    id: "week-1",
    week: "1. Hafta",
    title: "Makine Mühendisliği Nedir? Tarihçe, Temel Alanlar ve Güç İletimi",
    description:
      "Makine mühendisliğinin tanımı, Sanayi Devrimleri, 5 ana anabilim dalı ve canlı dişli çark mekanizması üzerinde tork-devir simülasyonu.",
    pptxUrl: "pptx/ME101-Hafta1.pptx",
    features: ["⚙️ Canlı Dişli Simülasyonu", "🖼️ Hibrit PPT Görsel Modu", "📥 PPTX İndirilebilir"],
    slides: [
      {
        kicker: "1. HAFTA • GİRİŞ",
        title: "Makine Mühendisliği Nedir?",
        pptSummaryBullets: [
          "Fizik, matematik ve malzeme bilimi ilkeleriyle enerji ve hareket sistemleri tasarımı.",
          "Fikirden ürüne: Doğadaki enerjiyi faydalı mekanik işe dönüştürür.",
          "Güvenlik ve Mukavemet: Kırılmadan, eğilmeden ve yorulmadan çalışma.",
          "Temel Denklem: Güç (P) = Tork (T) × Açısal Hız (ω)"
        ],
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
        pptSummaryBullets: [
          "Endüstri 1.0 (1780'ler): James Watt buhar makinesi ve mekanizasyon.",
          "Endüstri 2.0 (1870'ler): Seri üretim, elektrik ve içten yanmalı motorlar.",
          "Endüstri 3.0 & 4.0: CNC, CAD/CAE, Robotik, 3B Baskı ve Dijital İkiz.",
          "Mühendislik = Bilimsel Teori + Pratik Tasarım + Ekonomik Üretim"
        ],
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
        pptSummaryBullets: [
          "1. Konstrüksiyon ve İmalat (Makine elemanları, CAD, üretim)",
          "2. Mekanik ve Mukavemet (Statik, FEA, gerilme analizi)",
          "3. Termodinamik ve Isı Tekniği (Akışkanlar, ısı transferi, HVAC)",
          "4. Makine Teorisi ve Kontrol (Mekanizmalar, titreşim, robotik)",
          "5. Otomotiv ve Enerji Sistemleri (Taşıt dinamiği, güç aktarma)"
        ],
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
      getSimulationSlideObject("gear", "1. HAFTA")
    ]
  },
  {
    id: "week-2",
    week: "2. Hafta",
    title: "Kuvvet, Moment ve Mukavemet: Kiriş Eğilme Analizi",
    description:
      "Statik denge denklemleri, eğilme momenti kavramı ve ankastre bir kirişin yük altında çökme/gerilme analizi (FEA renk haritası simülasyonu).",
    pptxUrl: "pptx/ME101-Hafta2.pptx",
    features: ["📊 Ankastre Kiriş FEA", "🖼️ Hibrit PPT Görsel Modu", "📥 PPTX İndirilebilir"],
    slides: [
      {
        kicker: "2. HAFTA • STATİK VE MUKAVEMET",
        title: "Kuvvet, Moment ve Statik Denge",
        pptSummaryBullets: [
          "Düzlemde Statik Denge: ∑Fx = 0 , ∑Fy = 0 , ∑M_A = 0",
          "Kuvvet (F [Newton]): Hareket veya şekil değiştirme etkisi.",
          "Moment (M = F · d [N·m]): Kuvvetin döndürme ve eğme etkisi.",
          "Mukavemet: Gerçek cisimler yük altında esner ve iç gerilme (σ) oluşur."
        ],
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
      getSimulationSlideObject("beam", "2. HAFTA")
    ]
  },
  {
    id: "week-3",
    week: "3. Hafta",
    title: "Malzeme Bilimi: Çekme Deneyi ve Gerilme-Şekildeğiştirme (σ - ε)",
    description:
      "Metallerin mekanik özellikleri, Hooke Yasası, elastik/plastik bölge, boyun verme ve interaktif çekme deneyi simülasyonu.",
    pptxUrl: "pptx/ME101-Hafta3.pptx",
    features: ["🧪 Canlı Çekme Deneyi", "🖼️ Hibrit PPT Görsel Modu", "📥 PPTX İndirilebilir"],
    slides: [
      {
        kicker: "3. HAFTA • MALZEME BİLİMİ",
        title: "Gerilme (σ) ve Birim Şekil Değiştirme (ε)",
        pptSummaryBullets: [
          "Normal Gerilme: σ = F / A₀ [MPa = N/mm²]",
          "Birim Şekil Değiştirme: ε = ΔL / L₀ [Boyutsuz uzama oranı]",
          "Hooke Yasası (Elastik Bölge): σ = E · ε",
          "Elastisite Modülü (E): Malzemenin esnemeye karşı rijitliğini gösterir."
        ],
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
      getSimulationSlideObject("tensile", "3. HAFTA")
    ]
  },
  {
    id: "week-4",
    week: "4. Hafta",
    title: "Mekanizma Tekniği: Krank-Biyel (Piston) Mekanizması",
    description:
      "Dönme hareketini doğrusal harekete çeviren krank-biyel mekanizmasının kinematik analizi ve canlı motor pistonu simülasyonu.",
    pptxUrl: "pptx/ME101-Hafta4.pptx",
    features: ["🚗 Canlı Piston Animasyonu", "🖼️ Hibrit PPT Görsel Modu", "📥 PPTX İndirilebilir"],
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
// YÖNTEM 2: BİREBİR POWERPOINT GÖRSEL LEVHASI ÜRETİCİ (SVG / GÖRSEL)
// ============================================================================
function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildPptExactVisualHtml(slide, slideIdx, totalSlides, lectureWeek) {
  // Eğer doğrudan dışa aktarılmış PNG/JPG slayt görseli varsa onu göster
  if (slide.pptImageUrl) {
    return `
      <div class="ppt-exact-frame">
        <img src="${slide.pptImageUrl}" alt="${escapeXml(slide.title)}" />
        <span class="ppt-frame-badge">🖼️ Orijinal PowerPoint Slayt Görseli (Yöntem 2)</span>
      </div>
    `;
  }

  // Yoksa PowerPoint 16:9 (1280x720) teknik slayt levhasını birebir vektörel oluştur
  const bullets = slide.pptSummaryBullets || [
    "ME 101 - Makine Mühendisliğine Giriş Ders Notu",
    "Üstteki butondan İnteraktif Web Modu ile PPT Görsel Modu arasında geçiş yapabilirsiniz."
  ];

  const bulletSvgItems = bullets
    .slice(0, 6)
    .map((b, i) => {
      const y = 245 + i * 68;
      const text = b.length > 78 ? b.slice(0, 75) + "..." : b;
      return `
        <g transform="translate(85, ${y})">
          <rect x="0" y="-24" width="10" height="32" rx="4" fill="#38bdf8" />
          <text x="26" y="0" fill="#f1f5f9" font-family="Inter, sans-serif" font-size="25" font-weight="500">${escapeXml(text)}</text>
        </g>
      `;
    })
    .join("");

  // Gömülü medya görseli varsa sağ tarafa yerleştir
  const embeddedImg =
    slide.extractedImages && slide.extractedImages.length > 0
      ? `<image href="${slide.extractedImages[0]}" x="820" y="210" width="380" height="360" preserveAspectRatio="xMidYMid contain" />`
      : `
        <g transform="translate(920, 320)">
          <circle cx="90" cy="90" r="85" fill="none" stroke="rgba(56,189,248,0.25)" stroke-width="10" stroke-dasharray="18 10" />
          <circle cx="90" cy="90" r="45" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="4" />
          <text x="90" y="98" text-anchor="middle" fill="#38bdf8" font-family="JetBrains Mono, monospace" font-size="22" font-weight="700">ME 101</text>
        </g>
      `;

  return `
    <div class="ppt-exact-frame">
      <svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pptBg_${slideIdx}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#pptBg_${slideIdx})" />
        <!-- Üst Şerit -->
        <rect x="0" y="0" width="1280" height="14" fill="#38bdf8" />
        <rect x="60" y="48" width="1160" height="110" rx="12" fill="rgba(15,23,42,0.75)" stroke="rgba(56,189,248,0.35)" />
        <text x="88" y="85" fill="#38bdf8" font-family="JetBrains Mono, monospace" font-size="18" font-weight="700">${escapeXml(slide.kicker || lectureWeek)}</text>
        <text x="88" y="132" fill="#ffffff" font-family="Inter, sans-serif" font-size="34" font-weight="800">${escapeXml(slide.title)}</text>

        <!-- Maddeler -->
        ${bulletSvgItems}

        <!-- Sağ Görsel / Diyagram Alanı -->
        ${embeddedImg}

        <!-- Alt Bilgi Çubuğu (PowerPoint Footer) -->
        <line x1="60" y1="650" x2="1220" y2="650" stroke="rgba(148,163,184,0.25)" stroke-width="2" />
        <text x="60" y="685" fill="#94a3b8" font-family="Inter, sans-serif" font-size="18">ME 101 - Makine Mühendisliğine Giriş | PowerPoint Slayt Görünümü (Yöntem 2)</text>
        <text x="1220" y="685" text-anchor="end" fill="#38bdf8" font-family="JetBrains Mono, monospace" font-size="18" font-weight="700">Slayt ${slideIdx + 1} / ${totalSlides}</text>
      </svg>
      <span class="ppt-frame-badge">🖼️ Birebir PPT Görsel Modu (Yöntem 2)</span>
    </div>
  `;
}

// ============================================================================
// 1. KATALOG OLUŞTURMA (3 YÖNTEM BUTONLARI İLE)
// ============================================================================
function renderCatalog() {
  lectureGrid.innerHTML = "";
  LECTURES.forEach((lec) => {
    const card = document.createElement("article");
    card.className = "lecture-card";
    const pptxHref = lec.pptxUrl || "pptx/ME101-Hafta1.pptx";
    const downloadFileName = lec.pptxFileName || `${lec.week.replace(/\s+/g, "")}-ME101.pptx`;

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
      <div class="card-actions-3">
        <button class="btn btn-secondary btn-read" data-id="${lec.id}" title="Yöntem 1 & 2: Ders notu ve hibrit görünümde aç">
          📖 Oku
        </button>
        <button class="btn btn-primary btn-present" data-id="${lec.id}" title="Tam ekran PowerPoint sunum modunda başlat">
          🖥️ Sunumu Başlat
        </button>
        <a href="${pptxHref}" download="${downloadFileName}" class="btn btn-secondary" title="Yöntem 3: Orijinal PowerPoint (.pptx) dosyasını indir">
          📥 .PPTX
        </a>
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
// 2. DERS AÇMA (OKUMA VEYA SUNUM MODU + YÖNTEM 1/2/3 DESTEĞİ)
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

  // Yöntem 3: PPTX İndirme butonlarını güncelle
  const pptxHref = lec.pptxUrl || "pptx/ME101-Hafta1.pptx";
  const downloadName = lec.pptxFileName || `${lec.week.replace(/\s+/g, "")}-ME101.pptx`;
  const navDl = document.getElementById("btn-nav-download-pptx");
  const bannerDl = document.getElementById("btn-banner-download-pptx");
  navDl.href = pptxHref;
  navDl.setAttribute("download", downloadName);
  bannerDl.href = pptxHref;
  bannerDl.setAttribute("download", downloadName);

  // Slaytları oluştur (Her slaytta Yöntem 1 [Web] ve Yöntem 2 [Birebir PPT Görseli] katmanı bulunur)
  slidesContainer.innerHTML = "";
  lec.slides.forEach((s, idx) => {
    const slideEl = document.createElement("section");
    slideEl.className = "slide";
    slideEl.dataset.index = idx;
    slideEl.dataset.viewMode = s.defaultViewMode || "web"; // "web" (Yöntem 1) veya "ppt" (Yöntem 2)

    const pptVisualHtml = buildPptExactVisualHtml(s, idx, lec.slides.length, lec.week);
    const isPptMode = slideEl.dataset.viewMode === "ppt";

    slideEl.innerHTML = `
      <div class="slide-top-controls interactive-zone">
        <button class="btn-slide-mode-switch ${isPptMode ? "ppt-visual-active" : ""}" data-slide-idx="${idx}" title="Yöntem 1 (İnteraktif Web) ve Yöntem 2 (Birebir PPT Görseli) arasında geçiş yap">
          ${isPptMode ? "📝 İnteraktif Web Moduna Geç" : "🖼️ Birebir PPT Görseli"}
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

  // Slayt üstü Yöntem 1 <-> Yöntem 2 geçiş butonlarını bağla
  document.querySelectorAll(".btn-slide-mode-switch").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.slideIdx, 10);
      toggleSingleSlideViewMode(idx);
    });
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
    switchBtn.textContent = "📝 İnteraktif Web Moduna Geç";
  } else {
    pptBody.classList.add("hidden");
    webBody.classList.remove("hidden");
    switchBtn.classList.remove("ppt-visual-active");
    switchBtn.textContent = "🖼️ Birebir PPT Görseli";
  }
  updatePresentationHUD();
}

// Tüm slaytları topluca Yöntem 2 (PPT Görsel) veya Yöntem 1 (Web) moduna alma
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
    ? "📝 Tümünü İnteraktif Web Moduna Al"
    : "🖼️ Tümünü PPT Görsel Moduna Al";
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
// 3. SUNUM MODU (POWERPOINT MODU) YÖNETİMİ
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
      presViewBtn.textContent = isPptMode ? "📝 Web Slaytı" : "🖼️ PPT Görseli";
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

  // Eğer slayt Yöntem 1 (Web) modundaysa önce gizli fragment maddelerini sırayla aç
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
// 4. PPTX ENTEGRASYON MERKEZİ (TARAYICI İÇİ .PPTX AYRIŞTIRICI - YÖNTEM 1, 2, 3)
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

// Modal Sekmeleri
document.querySelectorAll(".modal-tab").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    document.querySelectorAll(".modal-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((p) => p.classList.add("hidden"));
    tabBtn.classList.add("active");
    document.getElementById(tabBtn.dataset.tab).classList.remove("hidden");
  });
});

// Dropzone 1: .PPTX Dosyası Seçimi
const pptxDropzone = document.getElementById("pptx-dropzone");
pptxDropzone.addEventListener("click", () => inpPptxFile.click());
pptxDropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  pptxDropzone.style.borderColor = "#38bdf8";
});
pptxDropzone.addEventListener("dragleave", () => {
  pptxDropzone.style.borderColor = "rgba(56, 189, 248, 0.45)";
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
  pptxFileStatus.innerHTML = `✅ Seçilen dosya: <strong>${escapeXml(file.name)}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
  btnProcessPptx.disabled = false;
  const titleInput = document.getElementById("imp-title");
  if (!titleInput.value.trim()) {
    titleInput.value = file.name.replace(/\.pptx$/i, "").replace(/[-_]/g, " ");
  }
}

// JSZip ile .PPTX Dosyasını Tarayıcıda Çözümleme (Yöntem 1 + Yöntem 2 + Yöntem 3)
btnProcessPptx.addEventListener("click", async () => {
  if (!selectedPptxFile) return;
  btnProcessPptx.disabled = true;
  btnProcessPptx.textContent = "⏳ PPTX Çözümleniyor...";

  try {
    const zip = await JSZip.loadAsync(selectedPptxFile);
    const weekLabel = document.getElementById("imp-week").value.trim() || `${LECTURES.length + 1}. Hafta`;
    const customTitle = document.getElementById("imp-title").value.trim() || selectedPptxFile.name.replace(/\.pptx$/i, "");
    const simType = document.getElementById("imp-sim-type").value;

    // 1. Gömülü Görselleri (ppt/media/*) Base64 URL olarak çıkar
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

    // 2. Slayt XML dosyalarını sırayla bul (ppt/slides/slide1.xml, slide2.xml...)
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

      // Slayttaki ilişkili görselleri kontrol et (ppt/slides/_rels/slideX.xml.rels)
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

      // Paragrafları (<a:p>) oku
      const pNodes = Array.from(xmlDoc.getElementsByTagName("a:p"));
      const lines = [];
      pNodes.forEach((p) => {
        const tNodes = Array.from(p.getElementsByTagName("a:t"));
        const lineStr = tNodes.map((t) => t.textContent).join("").trim();
        if (lineStr) lines.push(lineStr);
      });

      const slideTitle = lines.length > 0 ? lines[0] : `${customTitle} - Slayt ${slideNum}`;
      const bulletLines = lines.length > 1 ? lines.slice(1) : ["Bu slayt PowerPoint (.pptx) dosyasından otomatik aktarılmıştır."];

      const bulletsHtml = bulletLines
        .map(
          (b) => `
          <li class="fragment">
            <span>🔹</span>
            <div>${escapeXml(b)}</div>
          </li>
        `
        )
        .join("");

      const imagesHtml =
        slideImages.length > 0
          ? `
          <div class="info-card fragment" style="text-align:center;">
            <h4>🖼️ Slayt Görseli / Diyagramı</h4>
            <img src="${slideImages[0]}" style="max-width:100%; max-height:280px; border-radius:8px; margin-top:0.5rem;" alt="PPTX Görseli" />
          </div>
        `
          : "";

      const layoutHtml =
        slideImages.length > 0
          ? `<div class="slide-grid-2"><ul class="bullet-list">${bulletsHtml}</ul>${imagesHtml}</div>`
          : `<ul class="bullet-list">${bulletsHtml}</ul>`;

      parsedSlides.push({
        kicker: `${weekLabel.toUpperCase()} • PPTX SLAYT ${slideNum}`,
        title: slideTitle,
        pptSummaryBullets: bulletLines,
        extractedImages: slideImages,
        html: layoutHtml
      });
    }

    // Seçildiyse canlı mühendislik simülasyonunu da ekle
    if (simType !== "none") {
      parsedSlides.push(getSimulationSlideObject(simType, weekLabel.toUpperCase()));
    }

    // Yöntem 3: İndirilebilir PPTX Blob URL oluştur
    const pptxBlobUrl = URL.createObjectURL(selectedPptxFile);

    const newLecture = {
      id: `custom-${Date.now()}`,
      week: weekLabel,
      title: customTitle,
      description: `${selectedPptxFile.name} dosyasından 3 yöntemle (Web Slaytı + Birebir PPT Görseli + İndirilebilir PPTX) içe aktarıldı.`,
      pptxUrl: pptxBlobUrl,
      pptxFileName: selectedPptxFile.name,
      features: ["📝 PPTX'ten Otomatik Dönüştürüldü", "🖼️ Hibrit Görsel Modu", "📥 Orijinal PPTX"],
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
    btnProcessPptx.textContent = "⚡ PPTX'i Dönüştür ve Derslere Ekle";
  }
});

// TAB 2: Çoklu Slayt Görseli (.PNG / .JPG) ile Yöntem 2 Sunumu Oluşturma
const imgDropzone = document.getElementById("img-dropzone");
const inpSlideImages = document.getElementById("inp-slide-images");
const btnProcessImages = document.getElementById("btn-process-images");

imgDropzone.addEventListener("click", () => inpSlideImages.click());
inpSlideImages.addEventListener("change", (e) => {
  selectedSlideImages = Array.from(e.target.files || []);
  if (selectedSlideImages.length > 0) {
    document.getElementById("img-files-status").innerHTML =
      `✅ <strong>${selectedSlideImages.length} adet</strong> slayt görseli seçildi.`;
    btnProcessImages.disabled = false;
  }
});

btnProcessImages.addEventListener("click", () => {
  if (selectedSlideImages.length === 0) return;
  const weekLabel = document.getElementById("img-imp-week").value.trim() || "Görsel Sunum";
  const titleLabel = document.getElementById("img-imp-title").value.trim() || "Birebir PowerPoint Görsel Sunumu";

  const imageSlides = selectedSlideImages.map((file, idx) => {
    const imgUrl = URL.createObjectURL(file);
    return {
      kicker: `${weekLabel.toUpperCase()} • SLAYT ${idx + 1}`,
      title: `${titleLabel} - Slayt ${idx + 1}`,
      defaultViewMode: "ppt",
      pptImageUrl: imgUrl,
      pptSummaryBullets: [file.name],
      html: `
        <div class="ppt-exact-frame">
          <img src="${imgUrl}" alt="Slayt ${idx + 1}" />
          <span class="ppt-frame-badge">🖼️ Orijinal PowerPoint Slayt Görseli</span>
        </div>
      `
    };
  });

  const newLec = {
    id: `img-lec-${Date.now()}`,
    week: weekLabel,
    title: titleLabel,
    description: `${selectedSlideImages.length} adet orijinal slayt görseli ile oluşturulmuş birebir sunum.`,
    pptxUrl: "pptx/ME101-Hafta1.pptx",
    features: ["🖼️ %100 Birebir Görsel Koruma", "🔴 Lazer & Kalem Destekli"],
    slides: imageSlides
  };

  LECTURES.push(newLec);
  renderCatalog();
  closePptxModal();
  openLecture(newLec.id, true);
});

// TAB 3: JSON Verisini Kopyala
document.getElementById("btn-export-json").addEventListener("click", () => {
  const jsonStr = JSON.stringify(LECTURES, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    const btn = document.getElementById("btn-export-json");
    btn.textContent = "✅ Tüm Ders Verisi Panoya Kopyalandı!";
    setTimeout(() => {
      btn.textContent = "📋 Eklenen Derslerin Verisini (JSON) Kopyala";
    }, 2500);
  });
});

// ============================================================================
// 5. ETKİLEŞİMLİ MÜHENDİSLİK SİMÜLASYONLARI
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

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(pitchRadius * 0.8, 0);
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 3;
  ctx.stroke();

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
  gearAngle1 += omega1 * dt * 0.35;
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
      badge.textContent = `⚠️ AKMA SINIRI AŞILDI! (σ > ${yieldMPa} MPa)`;
      badge.style.color = "#ef4444";
    } else {
      const sf = (yieldMPa / sigma_MPa).toFixed(1);
      badge.textContent = `✅ EMNİYETLİ (Emniyet Katsayısı: ${sf})`;
      badge.style.color = "#34d399";
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#334155";
    ctx.fillRect(35, 30, 18, 160);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(53, 30);
    ctx.lineTo(53, 190);
    ctx.stroke();

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

    const maxVisualDef = Math.min(75, delta_mm * 2.2);
    const segments = 30;
    for (let i = 0; i < segments; i++) {
      const xi1 = i / segments;
      const xi2 = (i + 1) / segments;
      const def1 = maxVisualDef * 0.5 * (3 * xi1 * xi1 - xi1 * xi1 * xi1);
      const def2 = maxVisualDef * 0.5 * (3 * xi2 * xi2 - xi2 * xi2 * xi2);

      const x1 = 53 + xi1 * beamPxLen;
      const x2 = 53 + xi2 * beamPxLen;

      const stressRatio = Math.min(1, (1 - xi1) * (sigma_MPa / yieldMPa));
      const hue = Math.max(0, 220 - stressRatio * 220);

      ctx.strokeStyle = `hsl(${hue}, 90%, 55%)`;
      ctx.lineWidth = 18;
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.moveTo(x1, y0 + def1);
      ctx.lineTo(x2, y0 + def2);
      ctx.stroke();
    }

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

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("FEA Gerilme Dağılımı: Kırmızı = Maks. Moment (Mesnet) | Mavi = Düşük Gerilme", 55, 208);
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

    const specY = 95;
    const baseLen = 140;
    const stretchPx = eps * 2.8;
    const totalLen = baseLen + stretchPx;
    const startX = 45;

    ctx.fillStyle = "#475569";
    ctx.fillRect(startX - 22, specY - 22, 22, 44);
    ctx.fillRect(startX + totalLen, specY - 22, 22, 44);

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
      ctx.fillRect(startX, specY - halfThick, totalLen * 0.44, halfThick * 2);
      ctx.fillRect(startX + totalLen * 0.56, specY - halfThick, totalLen * 0.44, halfThick * 2);
    }

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillText("Çekme Numunesi (L₀ + ΔL)", startX + 15, specY + 55);

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

  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(pinX, pinY);
  ctx.stroke();

  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(pinX, pinY);
  ctx.lineTo(pistonX, cy);
  ctx.stroke();

  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(pistonX - 14, cy - 28, 42, 56);
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  ctx.strokeRect(pistonX - 14, cy - 28, 42, 56);

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
// 6. LAZER İMLECİ & BEYAZ TAHTA KALEMİ (ÇİZİM MODU)
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
// 7. OLAY DİNLEYİCİLERİ (KLAVYE, FARE TIKLAMASI, BUTONLAR)
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

// Başlangıçta kataloğu yükle
renderCatalog();
