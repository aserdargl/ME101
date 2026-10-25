use crate::catalog::{self, Manifest, SyncResult, MANIFEST};
use std::{collections::BTreeSet, fs, path::Path, process::Command};

const REMOTE: &str = "https://github.com/aserdargl/ME101.git";

pub fn git(folder: &Path, args: &[&str]) -> SyncResult<String> {
    let output = Command::new("git")
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GCM_INTERACTIVE", "never")
        .arg("-C")
        .arg(folder)
        .args(args)
        .output()
        .map_err(|e| format!("Git baslatilamadi: {e}"))?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// Uses an isolated checkout and never resets or force-pushes user changes.
pub fn prepare(folder: &Path) -> SyncResult<()> {
    if !folder.exists() {
        fs::create_dir_all(folder.parent().ok_or("Gecersiz depo yolu")?)
            .map_err(|e| e.to_string())?;
        let status = Command::new("git")
            .env("GIT_TERMINAL_PROMPT", "0")
            .env("GCM_INTERACTIVE", "never")
            .args(["clone", "--branch", "main", "--single-branch", REMOTE])
            .arg(folder)
            .status()
            .map_err(|e| e.to_string())?;
        if !status.success() {
            return Err("Depo indirilemedi. GitHub erisimini kontrol edin.".into());
        }
    }
    if git(folder, &["remote", "get-url", "origin"])? != REMOTE
        || git(folder, &["branch", "--show-current"])? != "main"
    {
        return Err("Yanlis depo veya dal; islem durduruldu.".into());
    }
    if !git(folder, &["status", "--porcelain"])?.is_empty() {
        return Err(
            "Esitleme deposunda tamamlanmamis degisiklik var. Dosyalar korunuyor; destek isteyin."
                .into(),
        );
    }
    git(folder, &["fetch", "origin", "main"])?;
    if let Err(error) = git(folder, &["rebase", "origin/main"]) {
        let _ = git(folder, &["rebase", "--abort"]);
        return Err(format!(
            "Uzak degisiklikler birlestirilemedi; dosyalar korundu: {error}"
        ));
    }
    Ok(())
}

pub fn previous(folder: &Path) -> SyncResult<Manifest> {
    let path = folder.join(MANIFEST);
    if !path.exists() {
        return Ok(Manifest {
            version: 1,
            files: vec![],
        });
    }
    let manifest: Manifest = serde_json::from_slice(&fs::read(path).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    catalog::validate(&manifest)?;
    Ok(manifest)
}

/// Writes verified files before removing only obsolete manifest-owned paths.
pub fn mirror(source: &Path, folder: &Path, old: &Manifest, new: &Manifest) -> SyncResult<()> {
    catalog::validate(old)?;
    catalog::validate(new)?;
    // Stage a complete immutable source snapshot before changing the checkout.
    let stage = folder.parent().ok_or("Gecersiz depo yolu")?.join("staging");
    fs::create_dir_all(&stage).map_err(|e| e.to_string())?;
    for entry in &new.files {
        let bytes = catalog::read_file(&source.join(&entry.name))?;
        if catalog::hash(&bytes) != entry.sha256 {
            return Err("Kaynak degisiyor; dosya kaydini bitirip yeniden deneyin.".into());
        }
        fs::write(stage.join(entry.path.rsplit('/').next().unwrap()), bytes)
            .map_err(|e| e.to_string())?;
    }
    if catalog::scan(source)? != *new {
        return Err("Kaynak degisiyor; silme yapilmadi.".into());
    }
    fs::create_dir_all(folder.join("weeks/files")).map_err(|e| e.to_string())?;
    for entry in &new.files {
        fs::copy(
            stage.join(entry.path.rsplit('/').next().unwrap()),
            folder.join(&entry.path),
        )
        .map_err(|e| e.to_string())?;
    }
    let retained: BTreeSet<_> = new.files.iter().map(|entry| &entry.path).collect();
    for entry in &old.files {
        let path = folder.join(&entry.path);
        if !retained.contains(&entry.path) && path.exists() {
            fs::remove_file(path).map_err(|e| e.to_string())?;
        }
    }
    let text = serde_json::to_string_pretty(new).map_err(|e| e.to_string())?;
    fs::write(folder.join(MANIFEST), format!("{text}\n")).map_err(|e| e.to_string())?;
    // Clean only files created in this fixed staging directory; no recursive delete.
    for entry in &new.files {
        let _ = fs::remove_file(stage.join(entry.path.rsplit('/').next().unwrap()));
    }
    Ok(())
}

pub fn publish(folder: &Path) -> SyncResult<()> {
    git(folder, &["add", "-A", "--", "weeks"])?;
    if !git(folder, &["diff", "--cached", "--name-only"])?.is_empty() {
        git(
            folder,
            &[
                "-c",
                "user.name=ME101 Week Sync",
                "-c",
                "user.email=week-sync@users.noreply.github.com",
                "commit",
                "-m",
                "Synchronize weekly course files",
            ],
        )?;
    }
    git(folder, &["push", "origin", "HEAD:main"])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};
    static NEXT: AtomicU64 = AtomicU64::new(0);

    fn fixture() -> (std::path::PathBuf, std::path::PathBuf) {
        let base = std::env::temp_dir().join(format!(
            "me101-week-test-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        let source = base.join("source");
        let target = base.join("checkout");
        fs::create_dir_all(&source).unwrap();
        fs::create_dir_all(target.join("data")).unwrap();
        fs::write(source.join(catalog::MARKER), "test-only").unwrap();
        fs::write(target.join("data/manifest.json"), "existing notes").unwrap();
        (source, target)
    }

    #[test]
    fn add_update_rename_and_delete_preserve_unmanaged_notes() {
        let (source, target) = fixture();
        fs::write(source.join("1.Week.pdf"), b"%PDF-first").unwrap();
        let first = catalog::scan(&source).unwrap();
        mirror(&source, &target, &previous(&target).unwrap(), &first).unwrap();
        assert!(target.join(&first.files[0].path).is_file());
        fs::write(source.join("1.Week.pdf"), b"%PDF-updated").unwrap();
        fs::rename(source.join("1.Week.pdf"), source.join("2.Week.pdf")).unwrap();
        let second = catalog::scan(&source).unwrap();
        mirror(&source, &target, &first, &second).unwrap();
        assert!(!target.join(&first.files[0].path).exists());
        assert_eq!(second.files[0].week, 2);
        fs::write(target.join("weeks/files/unmanaged.pdf"), "keep").unwrap();
        fs::remove_file(source.join("2.Week.pdf")).unwrap();
        let empty = catalog::scan(&source).unwrap();
        mirror(&source, &target, &second, &empty).unwrap();
        assert!(!target.join(&second.files[0].path).exists());
        assert!(target.join("weeks/files/unmanaged.pdf").exists());
        assert_eq!(
            fs::read_to_string(target.join("data/manifest.json")).unwrap(),
            "existing notes"
        );
    }

    #[test]
    fn missing_source_marker_and_changed_file_never_remove_published_files() {
        let (source, target) = fixture();
        fs::write(source.join("1.Week.pdf"), b"%PDF-original").unwrap();
        let first = catalog::scan(&source).unwrap();
        mirror(&source, &target, &previous(&target).unwrap(), &first).unwrap();
        fs::write(source.join("1.Week.pdf"), b"%PDF-changing").unwrap();
        assert!(mirror(&source, &target, &first, &first).is_err());
        assert!(target.join(&first.files[0].path).exists());
        fs::remove_file(source.join(catalog::MARKER)).unwrap();
        assert!(catalog::scan(&source).is_err());
        assert!(target.join(&first.files[0].path).exists());
    }

    #[test]
    fn duplicate_content_and_nested_weeks_are_stable() {
        let (source, target) = fixture();
        fs::create_dir(source.join("10.Week")).unwrap();
        fs::write(source.join("10.Week/Notes.pdf"), b"%PDF-same").unwrap();
        fs::write(source.join("2.Week.pdf"), b"%PDF-same").unwrap();
        let first = catalog::scan(&source).unwrap();
        assert_eq!(first.files[0].week, 2);
        assert_eq!(first.files[1].week, 10);
        assert_eq!(first.files[0].path, first.files[1].path);
        mirror(&source, &target, &previous(&target).unwrap(), &first).unwrap();
        fs::remove_file(source.join("2.Week.pdf")).unwrap();
        let second = catalog::scan(&source).unwrap();
        mirror(&source, &target, &first, &second).unwrap();
        assert!(target.join(&first.files[0].path).exists());
    }

    #[test]
    fn commits_and_pushes_deletions_to_an_isolated_local_remote() {
        let (source, target) = fixture();
        let remote = target.parent().unwrap().join("remote.git");
        git(&target, &["init", "--initial-branch=main"]).unwrap();
        git(&target, &["init", "--bare", remote.to_str().unwrap()]).unwrap();
        git(
            &target,
            &["remote", "add", "origin", remote.to_str().unwrap()],
        )
        .unwrap();
        git(&target, &["add", "data"]).unwrap();
        git(
            &target,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-m",
                "Synthetic original notes",
            ],
        )
        .unwrap();
        fs::write(source.join("1.Week.pdf"), b"%PDF-test").unwrap();
        let first = catalog::scan(&source).unwrap();
        mirror(&source, &target, &previous(&target).unwrap(), &first).unwrap();
        publish(&target).unwrap();
        fs::remove_file(source.join("1.Week.pdf")).unwrap();
        mirror(&source, &target, &first, &catalog::scan(&source).unwrap()).unwrap();
        publish(&target).unwrap();
        assert_eq!(
            git(&remote, &["show", "main:data/manifest.json"]).unwrap(),
            "existing notes"
        );
        assert!(git(&remote, &["show", &format!("main:{}", first.files[0].path)]).is_err());
        assert!(git(&target, &["status", "--porcelain"]).unwrap().is_empty());
    }
}
