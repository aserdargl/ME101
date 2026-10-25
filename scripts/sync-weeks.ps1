param([string]$Source, [switch]$Watch, [switch]$Preview)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$stateRoot = Join-Path $env:LOCALAPPDATA 'ME101-WeekSync'
$configPath = Join-Path $stateRoot 'source.json'
$markerName = '.me101-week-source'

try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git for Windows gerekli: https://git-scm.com/downloads/win' }
    $saved = $null
    if (Test-Path -LiteralPath $configPath) { $saved = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json }
    if (-not $Source -and (Test-Path -LiteralPath $configPath)) {
        $Source = $saved.source
    }
    if (-not $Source) { $Source = Read-Host 'Drive ders klasorunun tam yolunu yazin' }
    $sourceItem = Get-Item -LiteralPath $Source
    if (-not $sourceItem.PSIsContainer) { throw 'Kaynak bir klasor olmali.' }
    $Source = $sourceItem.FullName
    $marker = Join-Path $Source $markerName
    if (-not (Test-Path -LiteralPath $marker)) {
        if ($saved -and $saved.source -eq $Source) { throw 'Kaynak isareti kayip. Drive baglantisini kontrol edin. GitHub dosyalari silinmedi.' }
        # Require actual weekly content before arming a new source for deletions.
        $weekly = Get-ChildItem -LiteralPath $Source -Force | Where-Object { $_.Name -match '^\d+[. _-]*(Week|Hafta)' }
        if (-not $weekly) { throw 'Ilk kurulum icin klasore 1.Week.pdf gibi bir ders ekleyin. Kaynak isareti olusturulmadi.' }
        if (-not $Preview) { Set-Content -LiteralPath $marker -Value ([guid]::NewGuid().ToString()) -Encoding UTF8 }
        else { throw 'Ilk kurulumu onizlemeden once normal modda yapin.' }
    }
    $sourceIdentity = (Get-Content -LiteralPath $marker -Raw).Trim()
    if ($saved -and $saved.source -eq $Source -and $saved.identity -ne $sourceIdentity) { throw 'Kaynak klasor kimligi degisti. Silme durduruldu.' }
    if (-not $Preview) {
        New-Item -ItemType Directory -Path $stateRoot -Force | Out-Null
        @{ source = $Source; identity = $sourceIdentity } | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8
    }
    $executable = Join-Path $projectRoot 'tools\week-sync\target\release\me101-week-sync.exe'
    if (-not (Test-Path -LiteralPath $executable)) {
        if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) { throw 'Esitleme programi hazir degil. Rust yukleyin veya hazir EXE dosyasini isteyin.' }
        & cargo build --release --locked --manifest-path (Join-Path $projectRoot 'tools\week-sync\Cargo.toml')
        if ($LASTEXITCODE -ne 0) { throw 'Esitleme programi derlenemedi.' }
    }
    $syncArguments = @('--source', $Source, '--checkout', (Join-Path $stateRoot 'repository'))
    if ($Watch) { $syncArguments += '--watch'; Write-Host 'Izleme acik. Durdurmak icin Ctrl+C. Drive dosyalari bu bilgisayarda okunabilir olmali.' }
    if ($Preview) { $syncArguments += '--dry-run' }
    & $executable @syncArguments
    exit $LASTEXITCODE
} catch {
    Write-Host ('HATA: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
