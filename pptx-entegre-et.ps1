# =============================================================================
# MEE 101 - OTOMATIK PPTX ENTEGRASYON VE GITHUB YAYIN ARACI (3 YONTEM BIR ARADA)
# =============================================================================
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pptxDir = Join-Path $root "pptx"
$slidesImgDir = Join-Path $root "assets\ppt-slides"

New-Item -ItemType Directory -Force -Path $pptxDir | Out-Null
New-Item -ItemType Directory -Force -Path $slidesImgDir | Out-Null

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MEE 101 - PPTX Entegrasyon Araci (Yontem 1 + 2 + 3)     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$pptxFiles = Get-ChildItem -Path $pptxDir -Filter "*.pptx"
if ($pptxFiles.Count -eq 0) {
    Write-Host "pptx/ klasorunde hic .pptx dosyasi bulunamadi." -ForegroundColor Yellow
    Write-Host "Lutfen .pptx dosyalarinizi '$pptxDir' klasorune kopyalayin."
    exit
}

Write-Host "Bulunan .pptx dosyalari:" -ForegroundColor Green
foreach ($f in $pptxFiles) {
    Write-Host "  -> $($f.Name)"
}

# PowerPoint COM ile Yontem 2 (Birebir Slayt PNG Gorselleri) disa aktarmayi dene
try {
    $pptApp = New-Object -ComObject PowerPoint.Application
    foreach ($f in $pptxFiles) {
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
        $outFolder = Join-Path $slidesImgDir $baseName
        if (-not (Test-Path $outFolder)) {
            New-Item -ItemType Directory -Force -Path $outFolder | Out-Null
            Write-Host "PowerPoint uzerinden '$($f.Name)' slayt gorselleri (Yontem 2) uretiliyor..." -ForegroundColor Cyan
            $pres = $pptApp.Presentations.Open($f.FullName, $true, $true, $false)
            $idx = 1
            foreach ($slide in $pres.Slides) {
                $imgPath = Join-Path $outFolder "slide$idx.png"
                $slide.Export($imgPath, "PNG", 1920, 1080)
                $idx++
            }
            $pres.Close()
            Write-Host "  Tamamlandi: $($idx - 1) slayt PNG olarak kaydedildi." -ForegroundColor Green
        }
    }
    $pptApp.Quit()
} catch {
    Write-Host "Bilgi: PowerPoint masaustu COM otomasyonu atlandi (Web arayuzundeki SVG/JSZip motoru aktif)." -ForegroundColor DarkGray
}

Write-Host ""
$ans = Read-Host "Degisiklikleri ve yeni .pptx dosyalarini GitHub (ME101) sayfasina yuklemek ister misiniz? (E/H)"
if ($ans -match "^[EeYy]") {
    Set-Location $root
    git add .
    git commit -m "Update ME101 lectures and PPTX resources"
    git push origin main
    Write-Host "Basariyla GitHub'a yuklendi! https://aserdargl.github.io/ME101/" -ForegroundColor Green
}
