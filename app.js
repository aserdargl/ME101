// ============================================================================
// MEE 101 — MAKİNE MÜHENDİSLİĞİNE GİRİŞ | AKADEMİK DERS VE SUNUM MOTORU
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

const LECTURES = [];
// ============================================================================
// UYGULAMA DURUMU (STATE)
// ============================================================================
const PREFERRED_VIEW_MODE_KEY = "mee101_preferred_view_mode_v1";
let currentLecture = null;
let isPresentationMode = false;
let currentSlideIndex = 0;
let animationFrameId = null;
let preferredSlideViewMode = (function () {
  try {
    const saved = localStorage.getItem(PREFERRED_VIEW_MODE_KEY);
    return saved === "ppt" || saved === "web" ? saved : null;
  } catch {
    return null;
  }
})();
let allSlidesInPptVisualMode = preferredSlideViewMode === "ppt";

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
  return SlideVisual.render(slide, slideIdx, totalSlides, lectureWeek);
}

// ============================================================================
// 1. ÖĞRETİM ÜYESİ YETKİLENDİRME, ÖĞRENCİ LİSTESİ (OBS) VE PUANLAMA SİSTEMİ
// ============================================================================
// Legacy records are retained for recovery; startup never clears stored data.

const RATING_STORAGE_KEY = "me101_student_votes_v4";
const CUSTOM_LECTURES_KEY = "me101_custom_lectures_v1";
const ALL_LECTURES_STORAGE_KEY = "me101_all_lectures_v2";
const STUDENT_ROSTER_KEY = "me101_student_roster_v1";
const ADMIN_SESSION_KEY = "me101_instructor_unlocked";
const STUDENT_SESSION_KEY = "me101_active_student_no";


const CUSTOM_ADMIN_PASS_HASH_KEY = "mee101_custom_admin_hash_v1";
const DEFAULT_INSTRUCTOR_HASH = "a7dc91fb2b6975cf";

function hashAdminPass(str) {
  const s = "mee101_salt_" + String(str || "").trim();
  let h1 = 0xdeadbeef ^ s.length;
  let h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

function getActiveAdminPassHash() {
  try {
    return localStorage.getItem(CUSTOM_ADMIN_PASS_HASH_KEY) || DEFAULT_INSTRUCTOR_HASH;
  } catch {
    return DEFAULT_INSTRUCTOR_HASH;
  }
}

const DEFAULT_STUDENT_ROSTER = [];

let isAdminAuthenticated = false;
let activeStudentNo = null;
let firebaseAdminSession = false;
let pendingStudentAction = null; // { type: 'vote', lecId, val } veya { type: 'download', href, fileName }

function getStudentRoster() {
  if (FirebaseStudents.isAdmin) return FirebaseStudents.roster;
  try {
    const raw = localStorage.getItem(STUDENT_ROSTER_KEY);
    if (!raw) return [...DEFAULT_STUDENT_ROSTER];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_STUDENT_ROSTER];
  } catch {
    return [...DEFAULT_STUDENT_ROSTER];
  }
}

function findStudentInRoster(studentNoInput) {
  const cleanNo = String(studentNoInput || "").trim();
  if (!cleanNo) return null;
  const student = FirebaseStudents.profile;
  return student && String(student.accessKey || student.no || student.email).toLowerCase() === cleanNo.toLowerCase() ? student : null;
}

function updateAdminUI() {
  LecturePublishing.setLocalAdmin(isAdminAuthenticated);
  const adminToolbar = document.getElementById("admin-toolbar");
  const adminSectionActions = document.getElementById("admin-section-actions");
  const adminToggleBtn = document.getElementById("btn-admin-toggle");
  const adminLockLabel = document.getElementById("admin-lock-label");
  const navEditBtn = document.getElementById("btn-nav-edit-lecture");
  const bannerEditBtn = document.getElementById("btn-banner-edit-lecture");

  if (isAdminAuthenticated) {
    adminToolbar.classList.remove("hidden");
    if (adminSectionActions) adminSectionActions.classList.remove("hidden");
    if (navEditBtn) navEditBtn.classList.remove("hidden");
    if (bannerEditBtn) bannerEditBtn.classList.remove("hidden");
    adminToggleBtn.classList.add("unlocked");
    adminLockLabel.textContent = "Yönetici (Çıkış)";
  } else {
    adminToolbar.classList.add("hidden");
    if (adminSectionActions) adminSectionActions.classList.add("hidden");
    if (navEditBtn) navEditBtn.classList.add("hidden");
    if (bannerEditBtn) bannerEditBtn.classList.add("hidden");
    adminToggleBtn.classList.remove("unlocked");
    adminLockLabel.textContent = "Öğretim Üyesi";
  }
}

function updateStudentUI() {
  const studentBtn = document.getElementById("btn-student-toggle");
  const studentLabel = document.getElementById("student-login-label");
  if (!studentBtn || !studentLabel) return;

  if (activeStudentNo) {
    const stu = findStudentInRoster(activeStudentNo);
    if (!stu) {
      activeStudentNo = null;
      sessionStorage.removeItem(STUDENT_SESSION_KEY);
      studentBtn.classList.remove("logged-in");
      studentLabel.textContent = "Öğrenci Girişi";
      return;
    }
    studentBtn.classList.add("logged-in");
    studentLabel.textContent = stu.name
      ? `Öğrenci: ${stu.no} (${stu.name}) • Çıkış`
      : `Öğrenci: ${stu.no} (Çıkış)`;
    if (stu.approvalStatus === "pending") studentLabel.textContent += " · Onay bekliyor";
  } else {
    studentBtn.classList.remove("logged-in");
    studentLabel.textContent = "Öğrenci Girişi";
  }
}

function saveAllLecturesToStorage() {
  let legacySaved = false;
  try {
    localStorage.setItem(ALL_LECTURES_STORAGE_KEY, JSON.stringify(LECTURES));
    legacySaved = true;
  } catch {
    // Large embedded images are saved to IndexedDB below instead.
  }
  return LectureStorage.save(LECTURES).then(saved => {
    if (!saved && !legacySaved) alert("Notlar bu oturumda açık; ancak yerel kayıt yapılamadı. Sayfayı kapatmadan ders verisini dışa aktarın.");
    if (saved || legacySaved) LecturePublishing.save();
    return saved || legacySaved;
  });
}

function loadCustomLectures() {
  try {
    const rawAll = localStorage.getItem(ALL_LECTURES_STORAGE_KEY);
    if (rawAll) {
      const parsedAll = JSON.parse(rawAll);
      if (Array.isArray(parsedAll)) {
        LECTURES.length = 0;
        parsedAll.forEach((lec) => LECTURES.push(lec));
        return;
      }
    }

    const raw = localStorage.getItem(CUSTOM_LECTURES_KEY);
    if (!raw) return;
    const customArr = JSON.parse(raw);
    if (Array.isArray(customArr)) {
      customArr.forEach((c) => {
        if (!LECTURES.some((l) => l.id === c.id)) {
          LECTURES.push(c);
        }
      });
      saveAllLecturesToStorage();
    }
  } catch {
    // ignore
  }
}

function saveCustomLectureToStorage(newLec) {
  try {
    const raw = localStorage.getItem(CUSTOM_LECTURES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(newLec);
    localStorage.setItem(CUSTOM_LECTURES_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
  return saveAllLecturesToStorage();
}

function deleteCustomLectureFromStorage(lecId) {
  if (!isAdminAuthenticated) return;
  const targetLec = LECTURES.find((l) => l.id === lecId);
  const label = targetLec ? `${targetLec.week} (${targetLec.title})` : lecId;
  if (!confirm(`"${label}" dersini silmek istediğinize emin misiniz?`)) {
    return;
  }
  try {
    const raw = localStorage.getItem(CUSTOM_LECTURES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((l) => l.id !== lecId);
    localStorage.setItem(CUSTOM_LECTURES_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
  const idx = LECTURES.findIndex((l) => l.id === lecId);
  if (idx !== -1) LECTURES.splice(idx, 1);
  saveAllLecturesToStorage();
}

// Yalnızca kayıtlı öğrencilerin oylarını saklar: { [lectureId]: { [studentNo]: starValue } }
function getAllStudentVotes() {
  try {
    const raw = localStorage.getItem(RATING_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setStudentVote(lectureId, studentNo, starValue) {
  const stu = findStudentInRoster(studentNo);
  if (!stu) return false;
  try {
    const all = getAllStudentVotes();
    if (!all[lectureId] || typeof all[lectureId] !== "object" || Array.isArray(all[lectureId])) {
      all[lectureId] = {};
    }
    // Aynı öğrenci aynı derse tekrar oy verirse eski oyunu günceller (mükerrer oy engellenir)
    all[lectureId][stu.accessKey || stu.no] = starValue;
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

function clearLectureVotes(lectureId) {
  if (!isAdminAuthenticated) return;
  try {
    const all = getAllStudentVotes();
    delete all[lectureId];
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function clearAllStudentVotes() {
  if (!isAdminAuthenticated) return;
  if (!confirm("Yeni dönem için tüm derslerin yıldız puanlarını sıfırlamak istiyor musunuz?")) {
    return;
  }
  try {
    localStorage.removeItem(RATING_STORAGE_KEY);
  } catch {
    // ignore
  }
  renderCatalog();
}

function getLectureVoteStats(lectureId) {
  const all = getAllStudentVotes();
  const lecMap = all[lectureId] && typeof all[lectureId] === "object" && !Array.isArray(all[lectureId])
    ? all[lectureId]
    : {};
  const values = Object.values(lecMap).map((v) => Number(v)).filter((v) => v >= 1 && v <= 5);
  const count = values.length;
  const myVote = activeStudentNo && lecMap[activeStudentNo] ? Number(lecMap[activeStudentNo]) : null;

  if (count === 0) {
    return { avg: 0, avgText: "0.0", count: 0, filledStars: 0, myVote: null };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / count;
  return {
    avg,
    avgText: avg.toFixed(1),
    count,
    filledStars: Math.round(avg),
    myVote
  };
}

function triggerDirectFileDownload(href, fileName) {
  const tempLink = document.createElement("a");
  tempLink.href = href;
  if (fileName) tempLink.setAttribute("download", fileName);
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
}

function renderCatalog() {
  updateAdminUI();
  updateStudentUI();
  lectureGrid.innerHTML = "";

  [...LECTURES].sort((a, b) => CatalogOrder.compareWeeks(a.week, b.week)).forEach((lec) => {
    const card = document.createElement("article");
    card.className = "lecture-card";
    const pptxHref = lec.pptxUrl || "";
    const downloadFileName = lec.pptxFileName || `${lec.week.replace(/\s+/g, "")}-MEE101.pptx`;

    const stats = getLectureVoteStats(lec.id);

    let starsHtml = "";
    for (let s = 1; s <= 5; s++) {
      const filledClass = s <= stats.filledStars ? "filled" : "";
      starsHtml += `<button type="button" class="star-btn ${filledClass}" data-lec="${lec.id}" data-val="${s}" title="${s} Yıldız Ver">&#9733;</button>`;
    }

    const myVoteBadge = stats.myVote ? ` • Sizin: ${stats.myVote}★` : "";

    card.innerHTML = `
      <div class="lecture-row-top">
        <div class="lecture-title-wrap">
          <span class="week-tag">${escapeXml(lec.week)}</span>
          <h4>${escapeXml(lec.title)}</h4>
        </div>
        <div class="lecture-meta-right">
          <span class="slide-count-tag">${lec.slides.length} Slayt</span>
          ${isAdminAuthenticated ? `<button type="button" class="btn-edit-lecture" data-edit-lec="${lec.id}" title="Bu dersi ve slaytlarını düzenle">&#9998; Düzenle</button>` : ""}
          ${isAdminAuthenticated ? `<button type="button" class="btn-delete-lecture" data-del-lec="${lec.id}" title="Bu dersi sil">Dersi Sil</button>` : ""}
        </div>
      </div>

      <div class="lecture-row-bottom">
        <div class="lecture-desc-wrap">
          <p title="${escapeXml(lec.description)}">${escapeXml(lec.description)}</p>
        </div>

        <div class="lecture-controls-right">
          <div class="rating-box" data-rating-box="${lec.id}">
            <div class="star-group" data-star-group="${lec.id}">
              ${starsHtml}
            </div>
            <span class="rating-meta">
              ${stats.count > 0 ? `<strong>${stats.avgText}</strong> (${stats.count} oy${myVoteBadge})` : `0 oy`}
            </span>
            ${isAdminAuthenticated && stats.count > 0 ? `<button type="button" class="btn-clear-rating" data-clear-rating="${lec.id}" title="Yönetici: Bu dersin yıldızlarını temizle">&times; Temizle</button>` : ""}
          </div>

          <div class="card-actions-3">
            ${isAdminAuthenticated ? `<button type="button" class="btn btn-outline btn-edit-card-action" data-edit-lec="${lec.id}" title="Bu dersi ve slaytlarını düzenle">&#9998; Düzenle</button>` : ""}
            <button class="btn btn-secondary btn-read" data-id="${lec.id}">
              Ders Notu
            </button>
            <button class="btn btn-primary btn-present" data-id="${lec.id}">
              Sunum
            </button>
            <a ${pptxHref ? "" : "hidden"} href="${escapeXml(pptxHref)}" download="${escapeXml(downloadFileName)}" class="btn btn-outline btn-protected-pptx${pptxHref ? "" : " hidden"}" data-pptx-href="${escapeXml(pptxHref)}" data-pptx-name="${escapeXml(downloadFileName)}" title="PowerPoint (.pptx) dosyasını indir (Öğrenci No gerektirir)">
              PPTX
            </a>
          </div>
        </div>
      </div>
    `;
    lectureGrid.appendChild(card);
  });

  updateCatalogOverview();

  // Yıldız hover ve kayıtlı öğrenci oy verme etkileşimleri
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
        if (!activeStudentNo) {
          openStudentLoginModal({ type: "vote", lecId, val });
          return;
        }
        setStudentVote(lecId, activeStudentNo, val);
        renderCatalog();
      });
    });
    groupEl.addEventListener("mouseleave", () => {
      buttons.forEach((b) => b.classList.remove("hover-preview"));
    });
  });

  // PPTX İndirme Koruması (Kayıtlı Öğrenci veya Öğretim Üyesi)
  document.querySelectorAll(".btn-protected-pptx").forEach((linkEl) => {
    linkEl.addEventListener("click", (e) => {
      if (isAdminAuthenticated || activeStudentNo) {
        return; // Doğrudan indirilebilir
      }
      e.preventDefault();
      e.stopPropagation();
      openStudentLoginModal({
        type: "download",
        href: linkEl.dataset.pptxHref,
        fileName: linkEl.dataset.pptxName
      });
    });
  });

  // Yıldızları Sil / Temizle butonu (Yalnızca Yönetici)
  document.querySelectorAll(".btn-clear-rating").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isAdminAuthenticated) return;
      clearLectureVotes(btn.dataset.clearRating);
      renderCatalog();
    });
  });

  // Dersi Düzenle butonu (Yalnızca Öğretim Üyesi)
  document.querySelectorAll("[data-edit-lec]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isAdminAuthenticated) return;
      openEditLectureModal(btn.dataset.editLec, 0);
    });
  });

  // Dersi silme butonu (Yalnızca Öğretim Üyesi)
  document.querySelectorAll(".btn-delete-lecture").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isAdminAuthenticated) return;
      deleteCustomLectureFromStorage(btn.dataset.delLec);
      renderCatalog();
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
  if (window.MEE101_FIREBASE_CONFIG && !isAdminAuthenticated && !activeStudentNo) {
    openStudentLoginModal({ type: "lecture", lecId: lectureId, startInPresentation });
    return;
  }
  const lec = LECTURES.find((l) => l.id === lectureId);
  if (!lec) return;
  currentLecture = lec;
  currentSlideIndex = 0;
  allSlidesInPptVisualMode = preferredSlideViewMode === "ppt";

  catalogView.classList.add("hidden");
  lectureView.classList.remove("hidden");
  lectureNavActions.classList.remove("hidden");
  navCurrentLectureTitle.textContent = `${lec.week}: ${lec.title.split(":")[0]}`;
  presLectureName.textContent = `${lec.week}`;

  const pptxHref = lec.pptxUrl || "";
  const downloadName = lec.pptxFileName || `${lec.week.replace(/\s+/g, "")}-MEE101.pptx`;
  const navDl = document.getElementById("btn-nav-download-pptx");
  const bannerDl = document.getElementById("btn-banner-download-pptx");
  navDl.classList.toggle("hidden", !pptxHref);
  bannerDl.classList.toggle("hidden", !pptxHref);
  navDl.href = pptxHref;
  navDl.setAttribute("download", downloadName);
  bannerDl.href = pptxHref;
  bannerDl.setAttribute("download", downloadName);

  [navDl, bannerDl].forEach((dlEl) => {
    dlEl.onclick = (e) => {
      if (isAdminAuthenticated || activeStudentNo) return;
      e.preventDefault();
      openStudentLoginModal({
        type: "download",
        href: pptxHref,
        fileName: downloadName
      });
    };
  });

  slidesContainer.innerHTML = "";
  PptxDisplay.prepareLecture(lec).then(prepared => {
    if (!prepared || currentLecture !== lec) return;
    slidesContainer.querySelectorAll('.slide-body-ppt[data-rendered="true"]').forEach(body => {
      const index = Number(body.closest(".slide").dataset.index);
      body.innerHTML = buildPptExactVisualHtml(lec.slides[index], index, lec.slides.length, lec.week);
    });
  });
  lec.slides.forEach((s, idx) => {
    const slideEl = document.createElement("section");
    slideEl.className = "slide";
    slideEl.dataset.index = idx;
    const effectiveMode = preferredSlideViewMode || s.defaultViewMode || "web";
    slideEl.dataset.viewMode = effectiveMode;

    const isPptMode = effectiveMode === "ppt";
    // Simulation controls must exist for setup even when the PPT view is selected.
    const needsWebBody = !isPptMode || detectSlideSimType(s) !== "none";

    slideEl.innerHTML = `
      <div class="slide-top-controls interactive-zone">
        ${isAdminAuthenticated ? `<button type="button" class="btn-edit-lecture btn-edit-this-slide" data-edit-slide-idx="${idx}" title="Bu slaytı düzenle">&#9998; Slaytı Düzenle</button>` : ""}
        <button class="btn-slide-mode-switch ${isPptMode ? "ppt-visual-active" : ""}" data-slide-idx="${idx}">
          ${isPptMode ? "Web Görünümüne Geç" : "PPT Levha Görünümü"}
        </button>
        <span class="slide-number-badge">Slayt ${idx + 1} / ${lec.slides.length}</span>
      </div>
      <div class="slide-kicker">${escapeXml(s.kicker)}</div>
      <h2>${escapeXml(s.title)}</h2>
      <div class="slide-body-web ${isPptMode ? "hidden" : ""}" data-rendered="${needsWebBody}">${needsWebBody ? s.html : ""}</div>
      <div class="slide-body-ppt ${isPptMode ? "" : "hidden"}" data-rendered="${isPptMode}">${isPptMode ? buildPptExactVisualHtml(s, idx, lec.slides.length, lec.week) : ""}</div>
    `;
    slidesContainer.appendChild(slideEl);
  });

  const toggleAllBtn = document.getElementById("btn-toggle-all-slide-modes");
  if (toggleAllBtn) {
    toggleAllBtn.textContent = allSlidesInPptVisualMode
      ? "Tümünü Web Görünümüne Al"
      : "Tümünü PPT Levha Görünümüne Al";
  }

  document.querySelectorAll(".btn-edit-this-slide").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isAdminAuthenticated || !currentLecture) return;
      const idx = parseInt(btn.dataset.editSlideIdx, 10);
      openEditLectureModal(currentLecture.id, idx);
    });
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

function setSlideElementViewMode(slideEl, mode) {
  if (!slideEl) return;
  const webBody = slideEl.querySelector(".slide-body-web");
  const pptBody = slideEl.querySelector(".slide-body-ppt");
  const switchBtn = slideEl.querySelector(".btn-slide-mode-switch");
  const body = mode === "ppt" ? pptBody : webBody;
  if (body.dataset.rendered !== "true") {
    const index = Number(slideEl.dataset.index);
    const slide = currentLecture.slides[index];
    body.innerHTML = mode === "ppt"
      ? buildPptExactVisualHtml(slide, index, currentLecture.slides.length, currentLecture.week)
      : slide.html;
    body.dataset.rendered = "true";
  }

  slideEl.dataset.viewMode = mode;

  if (mode === "ppt") {
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
}

function applyPersistentSlideViewMode(targetMode) {
  const mode = targetMode === "ppt" ? "ppt" : "web";
  preferredSlideViewMode = mode;
  allSlidesInPptVisualMode = mode === "ppt";
  try {
    localStorage.setItem(PREFERRED_VIEW_MODE_KEY, mode);
  } catch {
    // ignore
  }

  document.querySelectorAll(".slide").forEach((slideEl) => {
    setSlideElementViewMode(slideEl, mode);
  });

  const toggleAllBtn = document.getElementById("btn-toggle-all-slide-modes");
  if (toggleAllBtn) {
    toggleAllBtn.textContent = allSlidesInPptVisualMode
      ? "Tümünü Web Görünümüne Al"
      : "Tümünü PPT Levha Görünümüne Al";
  }

  updatePresentationHUD();
}

function toggleSingleSlideViewMode(slideIdx) {
  const slideEl = document.querySelector(`.slide[data-index="${slideIdx}"]`);
  if (!slideEl) return;
  const nextMode = slideEl.dataset.viewMode === "web" ? "ppt" : "web";
  // Seçilen görünüm (PPT veya Web) sonraki slaytlara geçildiğinde de kalıcı olur
  applyPersistentSlideViewMode(nextMode);
}

document.getElementById("btn-toggle-all-slide-modes").addEventListener("click", () => {
  const targetMode = allSlidesInPptVisualMode ? "web" : "ppt";
  applyPersistentSlideViewMode(targetMode);
});

function goHome() {
  if (isPresentationMode) {
    exitPresentationMode();
  }
  currentLecture = null;
  stopSimulations();
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
// 4. DERS EKLEME, ÖĞRENCİ LİSTESİ (OBS) VE GİRİŞ DOĞRULAMA MERKEZİ
// ============================================================================
const pptxModalBackdrop = document.getElementById("pptx-modal-backdrop");
const adminLoginBackdrop = document.getElementById("admin-login-backdrop");
const adminLoginError = document.getElementById("admin-login-error");

const studentLoginBackdrop = document.getElementById("student-login-backdrop");
const inpStudentNo = document.getElementById("inp-student-email");
const studentLoginError = document.getElementById("student-login-error");

const inpPptxFile = document.getElementById("inp-pptx-file");
const btnProcessPptx = document.getElementById("btn-process-pptx");
const pptxFileStatus = document.getElementById("pptx-file-status");
let selectedPptxFile = null;
let selectedSlideImages = [];
let pendingAdminTab = null;

// --- ÖĞRENCİ GİRİŞİ VE DOĞRULAMA ---
function openStudentLoginModal(actionAfterLogin = null) {
  pendingStudentAction = actionAfterLogin;
  inpStudentNo.value = "";
  document.getElementById("inp-student-password").value = "";
  document.getElementById("student-registration-details").open = false;
  document.getElementById("inp-student-number").value = "";
  document.getElementById("inp-student-name").value = "";
  studentLoginError.classList.add("hidden");
  studentLoginBackdrop.classList.remove("hidden");
  setTimeout(() => inpStudentNo.focus(), 50);
}

function closeStudentLoginModal() {
  studentLoginBackdrop.classList.add("hidden");
  pendingStudentAction = null;
}

async function handleStudentLoginSubmit() {
  const button = document.getElementById("btn-submit-student-login");
  if (button.disabled) return;
  button.disabled = true;
  studentLoginError.classList.add("hidden");
  const passwordInput = document.getElementById("inp-student-password");
  const result = await FirebaseStudents.signIn(inpStudentNo.value, passwordInput.value,
    document.getElementById("inp-student-number").value, document.getElementById("inp-student-name").value);
  passwordInput.value = "";
  button.disabled = false;
  if (!result.ok) {
    studentLoginError.textContent = result.error;
    studentLoginError.classList.remove("hidden");
    return;
  }
  const matchedStu = FirebaseStudents.profile;
  activeStudentNo = matchedStu ? matchedStu.accessKey || matchedStu.no || matchedStu.email : null;
  const actionToRun = pendingStudentAction;
  closeStudentLoginModal();
  renderCatalog();

  if (actionToRun) {
    if (actionToRun.type === "vote") {
      setStudentVote(actionToRun.lecId, activeStudentNo, actionToRun.val);
      renderCatalog();
    } else if (actionToRun.type === "download") {
      triggerDirectFileDownload(actionToRun.href, actionToRun.fileName);
    } else if (actionToRun.type === "lecture") {
      openLecture(actionToRun.lecId, actionToRun.startInPresentation);
    }
  }
}

document.getElementById("btn-student-toggle").addEventListener("click", async () => {
  if (activeStudentNo) {
    await FirebaseStudents.signOut();
    activeStudentNo = null;
    sessionStorage.removeItem(STUDENT_SESSION_KEY);
    renderCatalog();
  } else {
    openStudentLoginModal(null);
  }
});

document.getElementById("btn-close-student-login").addEventListener("click", closeStudentLoginModal);
document.getElementById("btn-submit-student-login").addEventListener("click", handleStudentLoginSubmit);
inpStudentNo.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleStudentLoginSubmit();
});
document.getElementById("inp-student-password").addEventListener("keydown", event => {
  if (event.key === "Enter") handleStudentLoginSubmit();
});
document.getElementById("btn-student-register").addEventListener("click", async () => {
  const number = document.getElementById("inp-student-number");
  const name = document.getElementById("inp-student-name");
  if (!number.value.trim() || !name.value.trim()) {
    document.getElementById("student-registration-details").open = true;
    number.focus();
    return;
  }
  const button = document.getElementById("btn-student-register");
  if (button.disabled) return;
  button.disabled = true;
  const input = document.getElementById("inp-student-password");
  const result = await FirebaseStudents.register(inpStudentNo.value, input.value, number.value, name.value);
  button.disabled = false;
  input.value = "";
  studentLoginError.textContent = result.ok ? "Doğrulama e-postası gönderildi. Bağlantıyı açtıktan sonra giriş yapınız." : result.error;
  studentLoginError.classList.remove("hidden");
});
document.getElementById("btn-student-reset-password").addEventListener("click", async () => {
  const result = await FirebaseStudents.resetPassword(inpStudentNo.value);
  studentLoginError.textContent = result.ok ? "Adresiniz için bir hesap varsa parola sıfırlama e-postası gönderilecektir." : result.error;
  studentLoginError.classList.remove("hidden");
});
document.getElementById("btn-roster-firebase-login").addEventListener("click", () => openAdminLoginModal());
document.getElementById("btn-student-resend-verification").addEventListener("click", async () => {
  const result = await FirebaseStudents.resendVerification();
  studentLoginError.textContent = result.ok ? "Doğrulama e-postası yeniden gönderildi." : result.error;
  studentLoginError.classList.remove("hidden");
});

// --- ÖĞRETİM ÜYESİ: ÖĞRENCİ NUMARASI LİSTESİ (OBS) YÖNETİMİ ---
function renderRosterAdminList() {
  renderApprovalApplications();
  document.getElementById("btn-roster-firebase-login").classList.toggle("hidden", FirebaseStudents.isAdmin);
  const roster = FirebaseStudents.isAdmin ? FirebaseStudents.roster : [];
  const countBadge = document.getElementById("roster-count-badge");
  const container = document.getElementById("roster-items-container");
  if (!countBadge || !container) return;

  countBadge.textContent = String(roster.length);
  container.innerHTML = "";

  if (roster.length === 0) {
    container.innerHTML = `<div style="padding:0.65rem; font-size:0.78rem; color:#6e6256;">Henüz kayıtlı öğrenci bulunmuyor. Sol taraftan öğrenci numaralarını ekleyebilirsiniz.</div>`;
    return;
  }

  roster.forEach((stu) => {
    const row = document.createElement("div");
    row.className = "roster-item";
    row.innerHTML = `
      <span class="roster-item-no">${escapeXml(stu.no || stu.email)}</span>
      <span class="roster-item-name">${escapeXml(stu.name || "—")}</span>
      <span class="roster-item-email">${escapeXml(stu.email || "Numara ile kayıt")}${stu.enabled ? "" : " · Engelli"}</span>
      ${stu.email ? "" : `<button type="button" class="btn btn-outline" data-reset-number="${escapeXml(stu.no)}" title="Bu numaranın önceki hesabıyla bağlantısını kaldır">Hesap Bağını Sıfırla</button>`}
      <button type="button" class="btn-clear-rating" data-remove-stu="${escapeXml(stu.email || stu.no)}" title="Bu öğrencinin giriş iznini kaldır">&times; Sil</button>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll("[data-remove-stu]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!isAdminAuthenticated) return;
      const result = await FirebaseStudents.removeStudent(btn.dataset.removeStu);
      if (!result.ok) alert(result.error);
      renderRosterAdminList();
      renderCatalog();
    });
  });
  container.querySelectorAll("[data-reset-number]").forEach(button => {
    button.addEventListener("click", async () => {
      if (!confirm("Bu numaranın mevcut hesap bağlantısı kaldırılacak; öğrenci yeniden kayıt yapabilecek. Devam edilsin mi?")) return;
      const result = await FirebaseStudents.resetNumber(button.dataset.resetNumber);
      if (!result.ok) alert(result.error);
    });
  });
}

async function appendOrUpdateRosterFromText(rawText, replaceAll = false) {
  if (!isAdminAuthenticated) return;
  const result = await FirebaseStudents.saveText(rawText, replaceAll);
  if (!result.ok) { alert(result.error); return; }
  document.getElementById("inp-roster-bulk").value = "";
  renderRosterAdminList();
  renderCatalog();
}

document.getElementById("btn-roster-append").addEventListener("click", () => {
  const txt = document.getElementById("inp-roster-bulk").value;
  appendOrUpdateRosterFromText(txt, false);
});

document.getElementById("btn-roster-replace").addEventListener("click", () => {
  const txt = document.getElementById("inp-roster-bulk").value;
  if (!txt.trim()) {
    alert("Sıfırlayıp yeniden tanımlamak için önce metin kutusuna yeni öğrenci listesini yapıştırınız.");
    return;
  }
  if (confirm("Ortak listedeki diğer öğrencilerin giriş izni kaldırılacak. Yeni listeyle değiştirmek istiyor musunuz?")) appendOrUpdateRosterFromText(txt, true);
});

document.getElementById("inp-roster-file").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("inp-roster-bulk").value = String(reader.result || "");
  };
  reader.readAsText(file, "utf-8");
});

document.getElementById("btn-copy-roster-code").addEventListener("click", () => {
  const roster = getStudentRoster();
  const codeStr = JSON.stringify(roster, null, 2);
  navigator.clipboard.writeText(codeStr).then(() => {
    const btn = document.getElementById("btn-copy-roster-code");
    btn.textContent = "Kopyalandı";
    setTimeout(() => {
      btn.textContent = "Listeyi Kopyala";
    }, 2000);
  });
});

function openAdminLoginModal(targetTab) {
  pendingAdminTab = typeof targetTab === "string" ? targetTab : null;
  adminLoginError.classList.add("hidden");
  adminLoginBackdrop.classList.remove("hidden");
  document.getElementById("btn-submit-admin-login").focus();
}

function closeAdminLoginModal() {
  if (instructorSignIn.isProcessing()) instructorSession.logout();
  instructorSignIn.cancel();
  adminLoginBackdrop.classList.add("hidden");
}

const instructorSession = new InstructorSession({ publishing: LecturePublishing, students: FirebaseStudents });
const instructorSignIn = createGitHubSignIn({
  host: window,
  serviceUrl: window.MEE101_APPROVAL_URL || location.origin,
  onCredentials: credentials => instructorSession.login(credentials),
  onState: (busy, error, complete) => {
    document.getElementById("btn-submit-admin-login").disabled = busy;
    adminLoginError.textContent = error || "";
    adminLoginError.classList.toggle("hidden", !error);
    if (!complete) return;
    isAdminAuthenticated = true;
    firebaseAdminSession = true;
    closeAdminLoginModal();
    renderCatalog();
    if (currentLecture) openLecture(currentLecture.id, isPresentationMode);
    if (pendingAdminTab) {
      const tab = pendingAdminTab;
      pendingAdminTab = null;
      openPptxModal(tab);
    }
  }
});

function handleAdminLoginSubmit() {
  instructorSignIn.start();
}

document.getElementById("btn-admin-toggle").addEventListener("click", () => {
  if (isAdminAuthenticated) {
    instructorSignIn.cancel();
    instructorSession.logout();
    isAdminAuthenticated = false;
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    closePptxModal();
    closeEditLectureModal();
    renderCatalog();
    if (currentLecture) {
      openLecture(currentLecture.id, isPresentationMode);
    }
  } else {
    openAdminLoginModal();
  }
});

document.getElementById("btn-close-admin-login").addEventListener("click", closeAdminLoginModal);
document.getElementById("btn-submit-admin-login").addEventListener("click", handleAdminLoginSubmit);

function switchModalTab(tabId) {
  document.querySelectorAll(".modal-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-pane").forEach((p) => {
    p.classList.toggle("hidden", p.id !== tabId);
  });
  if (tabId === "tab-student-roster") {
    renderRosterAdminList();
  }
}

function openPptxModal(defaultTabId) {
  if (!isAdminAuthenticated) {
    openAdminLoginModal(defaultTabId);
    return;
  }
  const nextWeekNum = LECTURES.length + 1;
  const weekInput = document.getElementById("imp-week");
  if (weekInput) weekInput.value = `${nextWeekNum}. Hafta`;
  renderRosterAdminList();
  if (typeof defaultTabId === "string" && defaultTabId) {
    switchModalTab(defaultTabId);
  }
  pptxModalBackdrop.classList.remove("hidden");
}

function closePptxModal() {
  pptxModalBackdrop.classList.add("hidden");
}

document.getElementById("btn-open-pptx-modal").addEventListener("click", () => openPptxModal("tab-add-manual"));
document.getElementById("btn-hero-pptx-modal").addEventListener("click", () => openPptxModal("tab-add-manual"));
document.getElementById("btn-open-student-roster").addEventListener("click", () => openPptxModal("tab-student-roster"));
document.getElementById("btn-section-student-roster").addEventListener("click", () => openPptxModal("tab-student-roster"));
document.getElementById("btn-close-pptx-modal").addEventListener("click", closePptxModal);
document.getElementById("btn-clear-all-ratings").addEventListener("click", clearAllStudentVotes);
document.getElementById("btn-section-clear-all-ratings").addEventListener("click", clearAllStudentVotes);

// İkonik 1., 2., 3. Yöntem butonları ilgili sekmeyi açar
document.querySelectorAll("[data-open-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    openPptxModal(btn.dataset.openTab);
  });
});

document.querySelectorAll(".modal-tab").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    switchModalTab(tabBtn.dataset.tab);
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
  const titleInput = document.getElementById("imp-title");
  if (!titleInput.value.trim()) {
    titleInput.value = file.name.replace(/\.pptx$/i, "").replace(/[-_]/g, " ");
  }
  PptxPreview.prepare(file);
}

async function parsePptxFileToSlides(pptxFile, weekLabel, customTitle) {
  return PptxImport.parse(pptxFile, weekLabel, customTitle);
}

btnProcessPptx.addEventListener("click", async () => {
  const weekLabel = document.getElementById("imp-week").value.trim() || `${LECTURES.length + 1}. Hafta`;
  const customTitleInput = document.getElementById("imp-title").value.trim();
  const customDescInput = document.getElementById("imp-desc").value.trim();
  const manualBulletsRaw = document.getElementById("imp-manual-bullets").value.trim();
  const simType = document.getElementById("imp-sim-type").value;

  // Durum A: .PPTX dosyası seçilmeden manuel ders ekleme
  if (!selectedPptxFile) {
    const finalTitle = customTitleInput || `${weekLabel} Ders İçeriği`;
    const finalDesc = customDescInput;
    const bulletLines = manualBulletsRaw
      ? manualBulletsRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      : [];

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

    const slidesArr = [
      {
        kicker: `${weekLabel.toUpperCase()} • BÖLÜM I`,
        title: finalTitle,
        pptSummaryBullets: bulletLines,
        html: `<p class="lead">${escapeXml(finalDesc)}</p><ul class="bullet-list">${bulletsHtml}</ul>`
      }
    ];

    if (simType !== "none") {
      slidesArr.push(getSimulationSlideObject(simType, weekLabel.toUpperCase()));
    }

    const newLecture = {
      id: `custom-${Date.now()}`,
      week: weekLabel,
      title: finalTitle,
      description: finalDesc,
      pptxUrl: "",
      features: ["Ders Notu", "Sunum Modu"],
      slides: slidesArr
    };

    LECTURES.push(newLecture);
    await saveCustomLectureToStorage(newLecture);
    renderCatalog();
    closePptxModal();
    document.getElementById("imp-title").value = "";
    document.getElementById("imp-desc").value = "";
    document.getElementById("imp-manual-bullets").value = "";
    return;
  }

  // Durum B: .PPTX dosyası seçilmişse JSZip ile ayrıştır
  btnProcessPptx.disabled = true;
  btnProcessPptx.textContent = "PPTX Çözümleniyor...";

  try {
    const customTitle = customTitleInput || selectedPptxFile.name.replace(/\.pptx$/i, "");
    const parsedSlides = await PptxPreview.getSlides(selectedPptxFile, weekLabel, customTitle);

    if (simType !== "none") {
      parsedSlides.push(getSimulationSlideObject(simType, weekLabel.toUpperCase()));
    }

    const pptxDataUrl = await readFileAsDataURL(selectedPptxFile);

    const newLecture = {
      id: `custom-${Date.now()}`,
      week: weekLabel,
      title: customTitle,
      description: customDescInput || `${selectedPptxFile.name} dosyasından aktarılmış ders içeriği.`,
      pptxUrl: pptxDataUrl,
      pptxFileName: selectedPptxFile.name,
      features: ["PPTX'ten Aktarıldı", "Hibrit Slayt Modu"],
      slides: parsedSlides
    };

    LECTURES.push(newLecture);
    await saveCustomLectureToStorage(newLecture);
    selectedPptxFile = null;
    PptxPreview.clear();
    pptxFileStatus.textContent = "Dosya seçilmezse yukarıdaki başlık ve maddelerle ders oluşturulur.";
    renderCatalog();
    closePptxModal();
    openLecture(newLecture.id, false);
  } catch (err) {
    alert("PPTX dosyası okunurken bir hata oluştu: " + err.message);
  } finally {
    btnProcessPptx.disabled = false;
    btnProcessPptx.textContent = "+ Dersi Listeye Ekle";
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

btnProcessImages.addEventListener("click", async () => {
  if (selectedSlideImages.length === 0) return;
  const weekLabel = document.getElementById("img-imp-week").value.trim() || "Ek Ders";
  const titleLabel = document.getElementById("img-imp-title").value.trim() || "PowerPoint Görsel Sunumu";

  const imageSlides = await Promise.all(selectedSlideImages.map(async (file, idx) => {
    const imgUrl = await readFileAsDataURL(file);
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
  }));

  const newLec = {
    id: `img-lec-${Date.now()}`,
    week: weekLabel,
    title: titleLabel,
    description: `${selectedSlideImages.length} adet slayt görseli ile oluşturulmuş sunum.`,
    pptxUrl: "",
    features: ["Birebir Görsel Koruma", "Lazer ve Kalem Destekli"],
    slides: imageSlides
  };

  LECTURES.push(newLec);
  await saveCustomLectureToStorage(newLec);
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

document.getElementById("btn-download-backup").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(LECTURES, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `MEE101-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.getElementById("btn-save-new-admin-pass").addEventListener("click", async () => {
  if (!isAdminAuthenticated) return;
  const inp = document.getElementById("inp-new-admin-pass");
  const msg = document.getElementById("admin-pass-save-msg");
  const newPass = (inp.value || "").trim();
  if (newPass.length < 4) {
    alert("Lütfen en az 4 karakterli bir parola giriniz.");
    return;
  }
  const newHash = hashAdminPass(newPass);
  try {
    localStorage.setItem(CUSTOM_ADMIN_PASS_HASH_KEY, newHash);
  } catch {
    // ignore
  }
  inp.value = "";
  msg.textContent = "Yeni parola kaydedildi!";
  setTimeout(() => {
    msg.textContent = "";
  }, 3000);
});

// ============================================================================
// 4B. MEVCUT DERSLERİ VE SLAYTLARI DÜZENLEME MERKEZİ (ÖĞRETİM ÜYESİ)
// ============================================================================
const editLectureBackdrop = document.getElementById("edit-lecture-backdrop");
let editingLectureDraft = null;
let editingSlideIndex = 0;
let editingSlideInitialSnapshot = null;
let editingSlideRawHtmlTouched = false;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

function detectSlideSimType(slide) {
  const html = String((slide && slide.html) || "");
  const m = html.match(/data-sim=["'](gear|beam|tensile|crank)["']/i);
  return m ? m[1].toLowerCase() : "none";
}

function extractSlideEditableFields(slide) {
  const simType = detectSlideSimType(slide);
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = (slide && slide.html) || "";

  const leadEl = tempDiv.querySelector("p.lead");
  const lead = leadEl ? leadEl.textContent.replace(/\s+/g, " ").trim() : "";

  let bullets = [];
  if (Array.isArray(slide.pptSummaryBullets) && slide.pptSummaryBullets.length > 0) {
    bullets = [...slide.pptSummaryBullets];
  } else {
    const liNodes = Array.from(tempDiv.querySelectorAll(".bullet-list li"));
    bullets = liNodes
      .map((li) => {
        const clone = li.cloneNode(true);
        const marker = clone.querySelector(".bullet-marker");
        if (marker) marker.remove();
        return clone.textContent.replace(/\s+/g, " ").trim();
      })
      .filter(Boolean);
  }

  let formula = "";
  let formulaSub = "";
  const fBox = tempDiv.querySelector(".formula-box");
  if (fBox) {
    const fClone = fBox.cloneNode(true);
    const subEl = fClone.querySelector(".formula-sub");
    if (subEl) {
      formulaSub = subEl.textContent.replace(/\s+/g, " ").trim();
      subEl.remove();
    }
    formula = fClone.textContent.replace(/\s+/g, " ").trim();
  }

  const imageUrl =
    slide.pptImageUrl ||
    (Array.isArray(slide.extractedImages) && slide.extractedImages.length > 0
      ? slide.extractedImages[0]
      : "");

  return {
    kicker: slide.kicker || "",
    title: slide.title || "",
    viewMode: slide.defaultViewMode || "web",
    simType,
    lead,
    bulletsText: bullets.join("\n"),
    formula,
    formulaSub,
    imageUrl,
    rawHtml: slide.html || ""
  };
}

function updateSlideImageStatusUI(imageUrl) {
  const statusEl = document.getElementById("edit-slide-img-status");
  const removeBtn = document.getElementById("btn-edit-remove-slide-img");
  if (!statusEl || !removeBtn) return;

  if (imageUrl) {
    statusEl.innerHTML = `<strong style="color:#2d6a4f;">Görsel tanımlı</strong>`;
    removeBtn.classList.remove("hidden");
  } else {
    statusEl.textContent = "Görsel yok";
    removeBtn.classList.add("hidden");
  }
}

let pendingImageInsertIndex = null;

function updateEditLivePreview() {
  const stage = document.getElementById("edit-live-preview-stage");
  const typeLabel = document.getElementById("edit-live-preview-type-label");
  if (!stage || !editingLectureDraft || !editingLectureDraft.slides[editingSlideIndex]) return;

  const slide = editingLectureDraft.slides[editingSlideIndex];
  const weekVal = document.getElementById("edit-lec-week").value.trim() || editingLectureDraft.week || "Ders";
  const kicker = document.getElementById("edit-slide-kicker").value.trim() || slide.kicker || weekVal.toUpperCase();
  const title = document.getElementById("edit-slide-title").value.trim() || slide.title || `Slayt ${editingSlideIndex + 1}`;
  const simType = document.getElementById("edit-slide-simtype").value;
  const bulletsRaw = document.getElementById("edit-slide-bullets").value;
  const bulletLines = bulletsRaw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let previewSlideObj;
  if (simType !== "none") {
    const simTemplate = getSimulationSlideObject(simType, weekVal.toUpperCase());
    previewSlideObj = {
      kicker,
      title,
      pptSummaryBullets: simTemplate.pptSummaryBullets
    };
    if (typeLabel) typeLabel.textContent = `Teknik Simülasyon Slaytı (${simType.toUpperCase()})`;
  } else {
    const activeImg =
      slide._imageChanged !== undefined
        ? slide._currentImageUrl
        : slide.pptImageUrl || (slide.extractedImages && slide.extractedImages[0]) || "";
    previewSlideObj = {
      kicker,
      title,
      pptImageUrl: slide.pptImageUrl || (slide._imageChanged && slide.defaultViewMode === "ppt" ? activeImg : undefined),
      sourceSlideVisual: slide.sourceSlideVisual,
      sourceSlideRatio: slide.sourceSlideRatio,
      sourceSlideEdited: slide.sourceSlideEdited || title !== slide.title || kicker !== slide.kicker || bulletsRaw.trim() !== (editingSlideInitialSnapshot?.bulletsText || "").trim(),
      extractedImages: slide._imageChanged ? (activeImg ? [activeImg] : []) : (slide.extractedImages || []),
      pptSummaryBullets: bulletLines
    };
    const native = PptxDisplay.visualFor(slide);
    if (native) previewSlideObj = slide;
    if (typeLabel) {
      typeLabel.textContent = activeImg
        ? "Görselli Slayt Önizlemesi"
        : "Slayt Levha Önizlemesi (Canlı)";
    }
  }

  const renderedVisual = buildPptExactVisualHtml(
    previewSlideObj,
    editingSlideIndex,
    editingLectureDraft.slides.length,
    weekVal
  );
  stage.innerHTML = renderedVisual;

  const activeThumbCard = document.querySelector("#edit-slide-tabs .edit-thumb-card.active");
  if (activeThumbCard) {
    const thumbPrev = activeThumbCard.querySelector(".edit-thumb-preview");
    const thumbTitle = activeThumbCard.querySelector(".edit-thumb-title");
    if (thumbPrev) editThumbnailObserver?.unobserve(thumbPrev);
    if (thumbPrev) thumbPrev.innerHTML = renderedVisual;
    if (thumbTitle) thumbTitle.textContent = title;
  }
}

function loadSlideIntoEditForm(slideIdx, rebuildTabs = true) {
  if (!editingLectureDraft || !editingLectureDraft.slides.length) return;
  editingSlideIndex = Math.max(0, Math.min(slideIdx, editingLectureDraft.slides.length - 1));
  const slide = editingLectureDraft.slides[editingSlideIndex];
  const fields = extractSlideEditableFields(slide);
  editingSlideInitialSnapshot = fields;
  editingSlideRawHtmlTouched = false;

  document.getElementById("edit-current-slide-badge").textContent =
    `Seçili: Slayt ${editingSlideIndex + 1} / ${editingLectureDraft.slides.length}`;
  const sidebarBadge = document.getElementById("edit-sidebar-total-badge");
  if (sidebarBadge) {
    sidebarBadge.textContent = `${editingLectureDraft.slides.length} Slayt`;
  }

  document.getElementById("btn-move-slide-up").disabled = editingSlideIndex === 0;
  document.getElementById("btn-move-slide-down").disabled =
    editingSlideIndex === editingLectureDraft.slides.length - 1;

  document.getElementById("edit-slide-kicker").value = fields.kicker;
  document.getElementById("edit-slide-title").value = fields.title;
  document.getElementById("edit-slide-viewmode").value = fields.viewMode;
  document.getElementById("edit-slide-simtype").value = fields.simType;

  document.getElementById("edit-slide-lead").value = fields.lead;
  document.getElementById("edit-slide-bullets").value = fields.bulletsText;
  document.getElementById("edit-slide-formula").value = fields.formula;
  document.getElementById("edit-slide-formula-sub").value = fields.formulaSub;
  document.getElementById("edit-slide-raw-html").value = fields.rawHtml;

  slide._currentImageUrl = fields.imageUrl;
  slide._imageChanged = false;
  updateSlideImageStatusUI(fields.imageUrl);

  const standardFieldsBox = document.getElementById("edit-slide-standard-fields");
  if (standardFieldsBox) {
    standardFieldsBox.classList.toggle("hidden", fields.simType !== "none");
  }

  if (rebuildTabs) renderEditSlideTabs();
  else document.querySelectorAll("#edit-slide-tabs .edit-thumb-card").forEach((card, index) => {
    card.classList.toggle("active", index === editingSlideIndex);
  });
  updateEditLivePreview();
}

function createInsertBetweenBar(insertPos, totalSlides) {
  const bar = document.createElement("div");
  bar.className = "edit-insert-between";
  let posLabel = `+ ${insertPos} ile ${insertPos + 1} Arasına:`;
  if (insertPos === 0) {
    posLabel = "+ En Başa Ekle:";
  } else if (insertPos === totalSlides) {
    posLabel = "+ En Sona Ekle:";
  }

  bar.innerHTML = `
    <span class="edit-insert-label">${posLabel}</span>
    <div class="edit-insert-btns">
      <button type="button" class="btn-insert-here" data-ins-type="slide" data-ins-pos="${insertPos}" title="Bu araya yeni konu/metin slaytı ekle">+Konu</button>
      <button type="button" class="btn-insert-here" data-ins-type="sim" data-ins-pos="${insertPos}" title="Bu araya teknik simülasyon slaytı ekle">+Sim</button>
      <button type="button" class="btn-insert-here" data-ins-type="img" data-ins-pos="${insertPos}" title="Bu araya görsel (PNG/JPG) slayt ekle">+Görsel</button>
    </div>
  `;

  bar.querySelectorAll(".btn-insert-here").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pos = parseInt(btn.dataset.insPos, 10);
      const type = btn.dataset.insType;
      if (type === "slide") {
        insertContentSlideAt(pos);
      } else if (type === "sim") {
        insertSimSlideAt(pos);
      } else if (type === "img") {
        pendingImageInsertIndex = pos;
        document.getElementById("inp-edit-add-images").click();
      }
    });
  });

  return bar;
}

let editThumbnailObserver;

function renderEditSlideTabs() {
  const tabsContainer = document.getElementById("edit-slide-tabs");
  if (!tabsContainer || !editingLectureDraft) return;
  editThumbnailObserver?.disconnect();
  tabsContainer.innerHTML = "";

  const total = editingLectureDraft.slides.length;
  const weekVal = document.getElementById("edit-lec-week").value.trim() || editingLectureDraft.week || "Ders";
  editThumbnailObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || !editingLectureDraft || !entry.target.isConnected) return;
      const index = Number(entry.target.dataset.slideIndex);
      if (index !== editingSlideIndex) {
        entry.target.innerHTML = buildPptExactVisualHtml(editingLectureDraft.slides[index], index, total, weekVal);
      }
      editThumbnailObserver.unobserve(entry.target);
    });
  }, { root: tabsContainer, rootMargin: "150px" });

  // 0. pozisyona (En Başa) ekleme çubuğu
  tabsContainer.appendChild(createInsertBetweenBar(0, total));

  editingLectureDraft.slides.forEach((s, idx) => {
    const card = document.createElement("div");
    card.className = `edit-thumb-card ${idx === editingSlideIndex ? "active" : ""}`;

    const simType = detectSlideSimType(s);
    const hasImg = Boolean(s.pptImageUrl || (s.extractedImages && s.extractedImages.length > 0));
    const typeTagText =
      simType !== "none" ? `Simülasyon (${simType})` : hasImg ? "Görsel Slayt" : "Konu Slaytı";

    card.innerHTML = `
      <div class="edit-thumb-top">
        <span class="edit-thumb-num">${idx + 1}. Slayt</span>
        <span class="edit-thumb-type-tag">${typeTagText}</span>
      </div>
      <div class="edit-thumb-preview" data-slide-index="${idx}"></div>
      <div class="edit-thumb-title">${escapeXml(s.title || `Slayt ${idx + 1}`)}</div>
    `;

    card.addEventListener("click", () => {
      if (idx === editingSlideIndex) return;
      commitCurrentSlideFormToDraft();
      loadSlideIntoEditForm(idx, false);
    });

    tabsContainer.appendChild(card);
    editThumbnailObserver.observe(card.querySelector(".edit-thumb-preview"));

    // Bu slayt ile bir sonraki slayt arasına (idx + 1) ekleme çubuğu
    tabsContainer.appendChild(createInsertBetweenBar(idx + 1, total));
  });
}

function commitCurrentSlideFormToDraft() {
  if (!editingLectureDraft || !editingLectureDraft.slides[editingSlideIndex]) return;
  const slide = editingLectureDraft.slides[editingSlideIndex];
  const snap = editingSlideInitialSnapshot || extractSlideEditableFields(slide);
  const unchangedFields = [
    ["edit-slide-kicker", snap.kicker], ["edit-slide-title", snap.title],
    ["edit-slide-viewmode", snap.viewMode], ["edit-slide-simtype", snap.simType],
    ["edit-slide-lead", snap.lead], ["edit-slide-bullets", snap.bulletsText],
    ["edit-slide-formula", snap.formula], ["edit-slide-formula-sub", snap.formulaSub]
  ].every(([id, value]) => document.getElementById(id).value === value);
  // An untouched slide must keep its original HTML, media and optional fields verbatim.
  if (unchangedFields && !editingSlideRawHtmlTouched && !slide._imageChanged) return;

  const weekVal = document.getElementById("edit-lec-week").value.trim() || editingLectureDraft.week || "Ders";
  const kicker = document.getElementById("edit-slide-kicker").value.trim() || `${weekVal.toUpperCase()} • BÖLÜM ${editingSlideIndex + 1}`;
  const title = document.getElementById("edit-slide-title").value.trim() || `Slayt ${editingSlideIndex + 1}`;
  const viewMode = document.getElementById("edit-slide-viewmode").value;
  const simType = document.getElementById("edit-slide-simtype").value;

  if (slide.sourceSlideVisual && (title !== snap.title || kicker !== snap.kicker ||
      document.getElementById("edit-slide-bullets").value.trim() !== snap.bulletsText.trim() ||
      document.getElementById("edit-slide-lead").value.trim() !== snap.lead ||
      document.getElementById("edit-slide-formula").value.trim() !== snap.formula ||
      document.getElementById("edit-slide-formula-sub").value.trim() !== snap.formulaSub || simType !== snap.simType ||
      editingSlideRawHtmlTouched || slide._imageChanged)) slide.sourceSlideEdited = true;
  slide.kicker = kicker;
  slide.title = title;
  slide.defaultViewMode = viewMode;

  if (simType !== "none") {
    if (simType !== snap.simType) {
      const simObj = getSimulationSlideObject(simType, weekVal.toUpperCase());
      slide.html = simObj.html;
      slide.pptSummaryBullets = simObj.pptSummaryBullets;
      if (kicker === snap.kicker) slide.kicker = simObj.kicker;
      if (title === snap.title) slide.title = simObj.title;
    }
    return;
  }

  const lead = document.getElementById("edit-slide-lead").value.trim();
  const bulletsRaw = document.getElementById("edit-slide-bullets").value;
  const bulletLines = bulletsRaw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const formula = document.getElementById("edit-slide-formula").value.trim();
  const formulaSub = document.getElementById("edit-slide-formula-sub").value.trim();
  const rawHtml = document.getElementById("edit-slide-raw-html").value;

  slide.pptSummaryBullets = bulletLines;

  // Kullanıcı doğrudan Gelişmiş HTML alanını düzenlediyse onu esas al
  if (editingSlideRawHtmlTouched && rawHtml !== snap.rawHtml) {
    slide.html = rawHtml;
    return;
  }

  // Eğer önceden simülasyon slaytı idiyse ve standart slayta çevrildiyse temiz şablon kur
  const tempDiv = document.createElement("div");
  if (snap.simType !== "none") {
    tempDiv.innerHTML = `<p class="lead"></p><ul class="bullet-list"></ul>`;
  } else {
    tempDiv.innerHTML = slide.html || "";
  }

  // 1. Lead paragrafı güncellemesi
  if (lead !== snap.lead || snap.simType !== "none") {
    let leadEl = tempDiv.querySelector("p.lead");
    if (lead) {
      if (!leadEl) {
        leadEl = document.createElement("p");
        leadEl.className = "lead";
        tempDiv.insertBefore(leadEl, tempDiv.firstChild);
      }
      leadEl.textContent = lead;
    } else if (leadEl) {
      leadEl.remove();
    }
  }

  // 2. Maddeler (Bullets) güncellemesi
  if (bulletsRaw.trim() !== snap.bulletsText.trim() || snap.simType !== "none") {
    const newBulletsHtml = bulletLines
      .map(
        (b, bIdx) => `
        <li class="fragment">
          <span class="bullet-marker">${String(bIdx + 1).padStart(2, "0")}</span>
          <div>${escapeXml(b)}</div>
        </li>
      `
      )
      .join("");

    let ulEl = tempDiv.querySelector("ul.bullet-list");
    if (ulEl) {
      ulEl.innerHTML = newBulletsHtml;
    } else if (bulletLines.length > 0) {
      ulEl = document.createElement("ul");
      ulEl.className = "bullet-list";
      ulEl.innerHTML = newBulletsHtml;
      tempDiv.appendChild(ulEl);
    }
  }

  // 3. Formül kutusu güncellemesi
  if (formula !== snap.formula || formulaSub !== snap.formulaSub) {
    let fBox = tempDiv.querySelector(".formula-box");
    if (formula) {
      const fInner = `${escapeXml(formula)}${
        formulaSub ? `<span class="formula-sub">${escapeXml(formulaSub)}</span>` : ""
      }`;
      if (!fBox) {
        fBox = document.createElement("div");
        fBox.className = "formula-box fragment";
        tempDiv.appendChild(fBox);
      }
      fBox.innerHTML = fInner;
    } else if (fBox) {
      fBox.remove();
    }
  }

  // 4. Görsel güncellemesi
  if (slide._imageChanged) {
    const newImgUrl = slide._currentImageUrl || "";
    if (newImgUrl) {
      slide.extractedImages = [newImgUrl];
      if (slide.defaultViewMode === "ppt" || slide.pptImageUrl) {
        slide.pptImageUrl = newImgUrl;
      }
      const existingImg = tempDiv.querySelector("img");
      if (existingImg) {
        existingImg.setAttribute("src", newImgUrl);
      } else {
        const imgCard = document.createElement("div");
        imgCard.className = "info-card fragment edit-uploaded-img-card";
        imgCard.style.textAlign = "center";
        imgCard.style.marginTop = "0.85rem";
        imgCard.innerHTML = `
          <h4>Slayt Şeması / Görseli</h4>
          <img src="${newImgUrl}" style="max-width:100%; max-height:280px; border-radius:4px; margin-top:0.5rem;" alt="Slayt Görseli" />
        `;
        tempDiv.appendChild(imgCard);
      }
    } else {
      delete slide.pptImageUrl;
      slide.extractedImages = [];
      const uploadedCard = tempDiv.querySelector(".edit-uploaded-img-card");
      if (uploadedCard) uploadedCard.remove();
    }
  }

  slide.html = tempDiv.innerHTML;
}

function openEditLectureModal(lecId, initialSlideIdx = 0) {
  if (!isAdminAuthenticated) {
    openAdminLoginModal();
    return;
  }
  const targetLec = LECTURES.find((l) => l.id === lecId);
  if (!targetLec) return;

  editingLectureDraft = structuredClone(targetLec);
  if (!Array.isArray(editingLectureDraft.slides) || editingLectureDraft.slides.length === 0) {
    editingLectureDraft.slides = [
      {
        kicker: `${(editingLectureDraft.week || "DERS").toUpperCase()} • BÖLÜM I`,
        title: editingLectureDraft.title || "Yeni Slayt",
        pptSummaryBullets: [],
        html: `<p class="lead">${escapeXml(editingLectureDraft.description || "")}</p>`
      }
    ];
  }

  document.getElementById("edit-modal-heading").textContent =
    `${editingLectureDraft.week} — Dersi ve Slaytları Düzenle`;
  document.getElementById("edit-lec-week").value = editingLectureDraft.week || "";
  document.getElementById("edit-lec-title").value = editingLectureDraft.title || "";
  document.getElementById("edit-lec-desc").value = editingLectureDraft.description || "";
  const sourceUrl = String(editingLectureDraft.pptxUrl || "");
  document.getElementById("edit-lec-pptx-url").value = /^(data:|blob:)/.test(sourceUrl)
    ? (editingLectureDraft.pptxFileName ? `pptx/${editingLectureDraft.pptxFileName}` : "")
    : sourceUrl;
  document.getElementById("edit-pptx-status").textContent = "";
  document.getElementById("edit-save-feedback").textContent = "";
  document.getElementById("inp-edit-pptx-file").value = "";

  loadSlideIntoEditForm(initialSlideIdx);
  const displayDraft = editingLectureDraft;
  PptxDisplay.prepareLecture(displayDraft).then(prepared => {
    if (!prepared || editingLectureDraft !== displayDraft) return;
    renderEditSlideTabs();
    updateEditLivePreview();
  });
  editLectureBackdrop.classList.remove("hidden");
}

function closeEditLectureModal() {
  editThumbnailObserver?.disconnect();
  if (editLectureBackdrop) {
    editLectureBackdrop.classList.add("hidden");
  }
  editingLectureDraft = null;
}

document.getElementById("btn-close-edit-modal").addEventListener("click", closeEditLectureModal);
document.getElementById("btn-cancel-edit-lecture").addEventListener("click", closeEditLectureModal);

document.getElementById("btn-nav-edit-lecture").addEventListener("click", () => {
  if (currentLecture) {
    openEditLectureModal(currentLecture.id, currentSlideIndex);
  }
});

document.getElementById("btn-banner-edit-lecture").addEventListener("click", () => {
  if (currentLecture) {
    openEditLectureModal(currentLecture.id, currentSlideIndex);
  }
});

document.getElementById("edit-slide-simtype").addEventListener("change", (e) => {
  const simVal = e.target.value;
  const standardFieldsBox = document.getElementById("edit-slide-standard-fields");
  if (standardFieldsBox) {
    standardFieldsBox.classList.toggle("hidden", simVal !== "none");
  }
  updateEditLivePreview();
});

["edit-slide-kicker", "edit-slide-title", "edit-slide-bullets", "edit-lec-week"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", () => {
      updateEditLivePreview();
    });
  }
});

document.getElementById("edit-slide-raw-html").addEventListener("input", () => {
  editingSlideRawHtmlTouched = true;
});

document.getElementById("inp-edit-slide-img").addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !editingLectureDraft) return;
  try {
    const dataUrl = await readFileAsDataURL(file);
    const slide = editingLectureDraft.slides[editingSlideIndex];
    slide._currentImageUrl = dataUrl;
    slide._imageChanged = true;
    updateSlideImageStatusUI(dataUrl);
    updateEditLivePreview();
  } catch (err) {
    alert("Görsel yüklenemedi: " + err.message);
  }
});

document.getElementById("btn-edit-remove-slide-img").addEventListener("click", () => {
  if (!editingLectureDraft) return;
  const slide = editingLectureDraft.slides[editingSlideIndex];
  slide._currentImageUrl = "";
  slide._imageChanged = true;
  document.getElementById("inp-edit-slide-img").value = "";
  updateSlideImageStatusUI("");
  updateEditLivePreview();
});

function insertContentSlideAt(insertPos) {
  if (!editingLectureDraft) return;
  commitCurrentSlideFormToDraft();
  const weekLabel = document.getElementById("edit-lec-week").value.trim() || editingLectureDraft.week || "Ders";
  const targetPos = Math.max(0, Math.min(insertPos, editingLectureDraft.slides.length));
  const newSlideNum = targetPos + 1;
  const newSlide = {
    kicker: `${weekLabel.toUpperCase()} • BÖLÜM ${newSlideNum}`,
    title: `Yeni Slayt Başlığı (${newSlideNum})`,
    defaultViewMode: "web",
    pptSummaryBullets: [],
    html: ""
  };
  editingLectureDraft.slides.splice(targetPos, 0, newSlide);
  loadSlideIntoEditForm(targetPos);
}

function insertSimSlideAt(insertPos) {
  if (!editingLectureDraft) return;
  commitCurrentSlideFormToDraft();
  const weekLabel = document.getElementById("edit-lec-week").value.trim() || editingLectureDraft.week || "Ders";
  const targetPos = Math.max(0, Math.min(insertPos, editingLectureDraft.slides.length));
  const simSlide = getSimulationSlideObject("gear", weekLabel.toUpperCase());
  editingLectureDraft.slides.splice(targetPos, 0, simSlide);
  loadSlideIntoEditForm(targetPos);
}

// Seçili Slayttan Hemen Sonraya Yeni Slayt Ekle
document.getElementById("btn-edit-add-slide").addEventListener("click", () => {
  if (!editingLectureDraft) return;
  insertContentSlideAt(editingSlideIndex + 1);
});

// Seçili Slayttan Hemen Sonraya Simülasyon Slaytı Ekle
document.getElementById("btn-edit-add-sim-slide").addEventListener("click", () => {
  if (!editingLectureDraft) return;
  insertSimSlideAt(editingSlideIndex + 1);
});

// Çoklu Görsel Slayt Ekle (PNG/JPG) — Seçilen araya veya seçili slayttan sonraya
document.getElementById("inp-edit-add-images").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length || !editingLectureDraft) return;
  commitCurrentSlideFormToDraft();
  const weekLabel = document.getElementById("edit-lec-week").value.trim() || editingLectureDraft.week || "Ders";
  const lecTitle = document.getElementById("edit-lec-title").value.trim() || editingLectureDraft.title || "Sunum";

  const basePos =
    typeof pendingImageInsertIndex === "number"
      ? Math.max(0, Math.min(pendingImageInsertIndex, editingLectureDraft.slides.length))
      : editingSlideIndex + 1;
  pendingImageInsertIndex = null;

  const newImgSlides = [];
  for (let i = 0; i < files.length; i++) {
    const dataUrl = await readFileAsDataURL(files[i]);
    const slNum = basePos + i + 1;
    newImgSlides.push({
      kicker: `${weekLabel.toUpperCase()} • SLAYT ${slNum}`,
      title: `${lecTitle} — Slayt ${slNum}`,
      defaultViewMode: "ppt",
      pptImageUrl: dataUrl,
      extractedImages: [dataUrl],
      pptSummaryBullets: [files[i].name],
      html: `
        <div class="ppt-exact-frame">
          <img src="${dataUrl}" alt="Slayt ${slNum}" />
          <span class="ppt-frame-badge">Orijinal PowerPoint Slayt Görseli</span>
        </div>
      `
    });
  }
  editingLectureDraft.slides.splice(basePos, 0, ...newImgSlides);
  e.target.value = "";
  loadSlideIntoEditForm(basePos);
});

// Slayt Sırası Değiştirme & Silme
document.getElementById("btn-move-slide-up").addEventListener("click", () => {
  if (!editingLectureDraft || editingSlideIndex <= 0) return;
  commitCurrentSlideFormToDraft();
  const arr = editingLectureDraft.slides;
  const temp = arr[editingSlideIndex - 1];
  arr[editingSlideIndex - 1] = arr[editingSlideIndex];
  arr[editingSlideIndex] = temp;
  loadSlideIntoEditForm(editingSlideIndex - 1);
});

document.getElementById("btn-move-slide-down").addEventListener("click", () => {
  if (!editingLectureDraft || editingSlideIndex >= editingLectureDraft.slides.length - 1) return;
  commitCurrentSlideFormToDraft();
  const arr = editingLectureDraft.slides;
  const temp = arr[editingSlideIndex + 1];
  arr[editingSlideIndex + 1] = arr[editingSlideIndex];
  arr[editingSlideIndex] = temp;
  loadSlideIntoEditForm(editingSlideIndex + 1);
});

document.getElementById("btn-delete-current-slide").addEventListener("click", () => {
  if (!editingLectureDraft) return;
  if (editingLectureDraft.slides.length <= 1) {
    alert("Bir derste en az 1 slayt bulunmalıdır.");
    return;
  }
  if (!confirm(`Slayt ${editingSlideIndex + 1} silinsin mi?`)) return;
  editingLectureDraft.slides.splice(editingSlideIndex, 1);
  const nextIdx = Math.min(editingSlideIndex, editingLectureDraft.slides.length - 1);
  loadSlideIntoEditForm(nextIdx);
});

// Düzenleme Modalı İçinden Yeni .PPTX Yükleme
document.getElementById("inp-edit-pptx-file").addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !editingLectureDraft) return;
  commitCurrentSlideFormToDraft();

  const mode = document.getElementById("sel-edit-pptx-mode").value;
  const statusEl = document.getElementById("edit-pptx-status");
  const weekLabel = document.getElementById("edit-lec-week").value.trim() || editingLectureDraft.week || "Ders";
  const lecTitle = document.getElementById("edit-lec-title").value.trim() || editingLectureDraft.title;

  statusEl.textContent = "PPTX dosyası çözümleniyor...";

  try {
    const parsedSlides = mode === "file-only" ? null : await parsePptxFileToSlides(file, weekLabel, lecTitle);
    const dataUrl = await readFileAsDataURL(file);
    editingLectureDraft.pptxUrl = dataUrl;
    editingLectureDraft.pptxFileName = file.name;
    document.getElementById("edit-lec-pptx-url").value = `pptx/${file.name}`;

    if (mode !== "file-only") {
      if (parsedSlides.length > 0) {
        if (mode === "restore-media") {
          const result = PptxImport.repairMedia(editingLectureDraft.slides, parsedSlides);
          loadSlideIntoEditForm(editingSlideIndex);
          statusEl.textContent = `${result.repaired} slaydın görselleri onarıldı; notlar korundu.${result.unmatched.length ? ` ${result.unmatched.length} slayt güvenle eşleştirilemedi ve değiştirilmedi.` : ""}`;
        } else if (mode === "replace") {
          editingLectureDraft.slides = parsedSlides;
          loadSlideIntoEditForm(0);
          statusEl.innerHTML = `<strong style="color:#2d6a4f;">${escapeXml(file.name)}</strong> yüklendi (${parsedSlides.length} slayt ile yenilendi).`;
        } else {
          editingLectureDraft.slides.push(...parsedSlides);
          loadSlideIntoEditForm(editingLectureDraft.slides.length - 1);
          statusEl.innerHTML = `<strong style="color:#2d6a4f;">${escapeXml(file.name)}</strong> yüklendi (+${parsedSlides.length} slayt sona eklendi).`;
        }
      }
    } else {
      statusEl.innerHTML = `<strong style="color:#2d6a4f;">${escapeXml(file.name)}</strong> indirme dosyası olarak tanımlandı.`;
    }
    const displayDraft = editingLectureDraft;
    if (await PptxDisplay.prepareLecture(displayDraft) && editingLectureDraft === displayDraft) {
      renderEditSlideTabs();
      updateEditLivePreview();
    }
    document.querySelector(".edit-live-preview-wrap").scrollIntoView({ block: "nearest" });
  } catch (err) {
    statusEl.textContent = "Hata: " + err.message;
  }
});

// Değişiklikleri Kaydet
document.getElementById("btn-save-edit-lecture").addEventListener("click", async () => {
  if (!isAdminAuthenticated || !editingLectureDraft) return;
  commitCurrentSlideFormToDraft();

  editingLectureDraft.week =
    document.getElementById("edit-lec-week").value.trim() || editingLectureDraft.week;
  editingLectureDraft.title =
    document.getElementById("edit-lec-title").value.trim() || editingLectureDraft.title;
  editingLectureDraft.description =
    document.getElementById("edit-lec-desc").value.trim() || editingLectureDraft.description;

  const manualPptxUrl = document.getElementById("edit-lec-pptx-url").value.trim();
  const embeddedSource = /^(blob:|data:)/.test(String(editingLectureDraft.pptxUrl || ""));
  const embeddedLabel = editingLectureDraft.pptxFileName ? `pptx/${editingLectureDraft.pptxFileName}` : "";
  if (manualPptxUrl && (!embeddedSource || manualPptxUrl !== embeddedLabel)) {
    editingLectureDraft.pptxUrl = manualPptxUrl;
  }

  // Geçici düzenleme alanlarını temizle
  editingLectureDraft.slides.forEach((s) => {
    delete s._currentImageUrl;
    delete s._imageChanged;
  });

  const idx = LECTURES.findIndex((l) => l.id === editingLectureDraft.id);
  if (idx !== -1) {
    LECTURES[idx] = editingLectureDraft;
  } else {
    LECTURES.push(editingLectureDraft);
  }

  const savedId = editingLectureDraft.id;
  const savedSlideIdx = editingSlideIndex;
  if (!await saveAllLecturesToStorage()) return;
  renderCatalog();
  if (editingLectureDraft?.id !== savedId) return;
  closeEditLectureModal();

  if (currentLecture && currentLecture.id === savedId) {
    openLecture(savedId, isPresentationMode);
    currentSlideIndex = Math.min(savedSlideIdx, currentLecture.slides.length - 1);
    if (isPresentationMode) {
      updateActiveSlide();
    }
  }
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

function stopSimulations() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (tensileAutoTimer) clearInterval(tensileAutoTimer);
  animationFrameId = null;
  tensileAutoTimer = null;
}

/** Skips drawing hidden and offscreen canvases without changing simulation data. */
function isSimulationVisible(canvas) {
  if (!canvas || document.hidden || !currentLecture || !canvas.getClientRects().length) return false;
  const bounds = canvas.getBoundingClientRect();
  return bounds.bottom > 0 && bounds.top < innerHeight && bounds.right > 0 && bounds.left < innerWidth;
}

function initSimulations() {
  stopSimulations();

  setupGearSim();
  setupBeamSim();
  setupTensileSim();
  setupCrankSim();

  function animateLoop() {
    stepGearAnimation();
    stepCrankAnimation();
    animationFrameId = requestAnimationFrame(animateLoop);
  }
  if (document.getElementById("gear-canvas") || document.getElementById("crank-canvas")) animateLoop();
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
  if (!isSimulationVisible(canvas)) return;
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
        if (!isSimulationVisible(canvas)) return;
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
  if (!isSimulationVisible(canvas)) return;
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

/** Opens existing notes first; shared content never silently replaces unsynced notes. */
async function initializeLectures() {
  FirebaseStudents.initialize(state => {
    const hadStudentAccess = Boolean(activeStudentNo);
    activeStudentNo = state.profile ? state.profile.accessKey || state.profile.no || state.profile.email : null;
    if (state.isAdmin && LecturePublishing.isAuthenticated()) {
      isAdminAuthenticated = true;
      firebaseAdminSession = true;
    } else if (firebaseAdminSession && state.accessResolved) {
      isAdminAuthenticated = false;
      firebaseAdminSession = false;
      LecturePublishing.logout();
    }
    if (hadStudentAccess && !activeStudentNo && !isAdminAuthenticated) goHome();
    renderCatalog();
    renderRosterAdminList();
  });
  const stored = await LectureStorage.load();
  if (Array.isArray(stored)) {
    LECTURES.length = 0;
    LECTURES.push(...stored);
  } else loadCustomLectures();
  const visibleLectures = await LegacyContent.userLectures(LECTURES);
  LECTURES.splice(0, LECTURES.length, ...visibleLectures);
  const hasLocalData = Array.isArray(stored) || Boolean(localStorage.getItem(ALL_LECTURES_STORAGE_KEY) || localStorage.getItem(CUSTOM_LECTURES_KEY));
  renderCatalog();
  await LecturePublishing.initialize({
    getLectures: () => LECTURES,
    hasLocalData,
    applyLectures: async lectures => { const visible = await LegacyContent.userLectures(lectures); LECTURES.splice(0, LECTURES.length, ...visible); renderCatalog(); },
    onLoginRequired: openAdminLoginModal
  });
  if (LectureStorage.warning) window.dispatchEvent(new CustomEvent("lecture-storage-status", { detail: LectureStorage.warning }));
}
initializeLectures();
