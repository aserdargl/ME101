mod catalog;
mod repository;

use catalog::{Manifest, SyncResult};
use std::{env, path::PathBuf, thread, time::Duration};

fn argument(name: &str) -> SyncResult<PathBuf> {
    let args: Vec<_> = env::args_os().collect();
    args.windows(2)
        .find(|pair| pair[0] == name)
        .map(|pair| PathBuf::from(&pair[1]))
        .ok_or(format!("Eksik parametre: {name}"))
}

fn synchronize(
    source: &std::path::Path,
    checkout: &std::path::Path,
    current: &Manifest,
    dry_run: bool,
) -> SyncResult<()> {
    if dry_run {
        println!(
            "Onizleme: {} dosya; GitHub degistirilmedi.",
            current.files.len()
        );
        return Ok(());
    }
    repository::prepare(checkout)?;
    let previous = repository::previous(checkout)?;
    if previous == *current {
        // A prior push may have failed after its commit was saved locally.
        repository::publish(checkout)?;
        println!("Guncel: {} dosya.", current.files.len());
        return Ok(());
    }
    repository::mirror(source, checkout, &previous, current)?;
    repository::publish(checkout)?;
    println!(
        "{} dosya GitHub'a esitlendi. Site yayini GitHub Pages tamamlandiginda yenilenir.",
        current.files.len()
    );
    Ok(())
}

fn run() -> SyncResult<()> {
    let source = argument("--source")?
        .canonicalize()
        .map_err(|e| format!("Kaynak klasor bulunamadi: {e}"))?;
    let checkout = argument("--checkout")?;
    if checkout.starts_with(&source) || source.starts_with(&checkout) {
        return Err("Kaynak ve esitleme deposu ayri klasorlerde olmali.".into());
    }
    let watch = env::args().any(|arg| arg == "--watch");
    let dry_run = env::args().any(|arg| arg == "--dry-run");
    let _lock = if !dry_run {
        let state = checkout.parent().ok_or("Gecersiz depo yolu")?;
        std::fs::create_dir_all(state).map_err(|e| e.to_string())?;
        let mut options = std::fs::OpenOptions::new();
        options.create(true).read(true).write(true).truncate(false);
        #[cfg(windows)]
        {
            use std::os::windows::fs::OpenOptionsExt;
            options.share_mode(0);
        }
        Some(
            options
                .open(state.join("sync.lock"))
                .map_err(|_| "Baska bir esitleme zaten acik. Once onu kapatin.".to_string())?,
        )
    } else {
        None
    };
    let mut last = None;
    loop {
        let attempt = (|| {
            let snapshot = catalog::scan(&source)?;
            if last.as_ref() == Some(&snapshot) {
                return Ok(());
            }
            thread::sleep(Duration::from_secs(2));
            if catalog::scan(&source)? != snapshot {
                return Err("Dosyalar hala degisiyor; yeniden denenecek.".into());
            }
            synchronize(&source, &checkout, &snapshot, dry_run)?;
            last = Some(snapshot);
            Ok::<_, String>(())
        })();
        if !watch {
            return attempt;
        }
        if let Err(error) = attempt {
            eprintln!("Esitleme durdu; sonraki kontrolde tekrar denenecek: {error}");
        }
        thread::sleep(Duration::from_secs(3));
    }
}

fn main() {
    if let Err(error) = run() {
        eprintln!("HATA: {error}");
        std::process::exit(1);
    }
}
