use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{collections::BTreeSet, fs, path::Path};

pub const MARKER: &str = ".me101-week-source";
pub const MANIFEST: &str = "weeks/manifest.json";
pub const MAX_SIZE: u64 = 95 * 1024 * 1024;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub week: u32,
    pub name: String,
    pub path: String,
    pub sha256: String,
    pub size: u64,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct Manifest {
    pub version: u32,
    pub files: Vec<Entry>,
}

pub type SyncResult<T> = Result<T, String>;

pub fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

/// Accepts 1.Week.pdf and a 1.Week folder containing named files.
pub fn week_number(name: &str) -> Option<u32> {
    let lower = name.to_lowercase();
    let count = lower.chars().take_while(|c| c.is_ascii_digit()).count();
    let week = lower[..count].parse::<u32>().ok()?;
    let suffix = lower[count..].trim_start_matches(['.', ' ', '-', '_']);
    (week > 0 && (suffix.starts_with("week") || suffix.starts_with("hafta"))).then_some(week)
}

pub fn extension(name: &str) -> Option<String> {
    let ext = Path::new(name).extension()?.to_str()?.to_lowercase();
    ["pdf", "html", "htm", "pptx"]
        .contains(&ext.as_str())
        .then_some(ext)
}

/// Enumerates only regular files; links and unreadable folders stop the sync.
pub fn scan(source: &Path) -> SyncResult<Manifest> {
    if !source.join(MARKER).is_file() {
        return Err(
            "Kaynak klasor isareti bulunamadi. Drive baglantisini kontrol edin; silme yapilmadi."
                .into(),
        );
    }
    let mut files = Vec::new();
    walk(source, source, None, &mut files)?;
    files.sort_by(|a, b| a.week.cmp(&b.week).then(a.name.cmp(&b.name)));
    let ids: BTreeSet<_> = files.iter().map(|entry| &entry.id).collect();
    if ids.len() != files.len() {
        return Err("Tekrarlanan ders dosyasi kimligi.".into());
    }
    Ok(Manifest { version: 1, files })
}

fn walk(
    root: &Path,
    folder: &Path,
    inherited: Option<u32>,
    files: &mut Vec<Entry>,
) -> SyncResult<()> {
    let entries = fs::read_dir(folder).map_err(|e| format!("Klasor okunamadi: {e}"))?;
    for item in entries {
        let item = item.map_err(|e| e.to_string())?;
        let name = item.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || name.starts_with('~') {
            continue;
        }
        let kind = item.file_type().map_err(|e| e.to_string())?;
        if kind.is_symlink() {
            return Err(format!("Baglanti yerine gercek dosya kullanin: {name}"));
        }
        if kind.is_dir() {
            if let Some(week) = inherited.or_else(|| week_number(&name)) {
                walk(root, &item.path(), Some(week), files)?;
            }
        } else if kind.is_file() {
            if let (Some(week), Some(ext)) =
                (inherited.or_else(|| week_number(&name)), extension(&name))
            {
                let relative = item
                    .path()
                    .strip_prefix(root)
                    .map_err(|e| e.to_string())?
                    .to_string_lossy()
                    .replace('\\', "/");
                let bytes = read_file(&item.path())?;
                let sha256 = hash(&bytes);
                files.push(Entry {
                    id: format!("week-file-{}", hash(relative.as_bytes())),
                    week,
                    name: relative,
                    path: format!("weeks/files/{sha256}.{ext}"),
                    sha256,
                    size: bytes.len() as u64,
                });
            }
        }
    }
    Ok(())
}

pub fn read_file(path: &Path) -> SyncResult<Vec<u8>> {
    let size = fs::metadata(path)
        .map_err(|e| format!("Dosya okunamadi: {e}"))?
        .len();
    if size == 0 || size > MAX_SIZE {
        return Err(format!(
            "Dosya bos veya 95 MiB sinirini asiyor: {}",
            path.display()
        ));
    }
    fs::read(path).map_err(|e| format!("Dosya okunamadi: {e}"))
}

/// Only hash-addressed files recorded by this tool may be removed.
pub fn validate(manifest: &Manifest) -> SyncResult<()> {
    if manifest.version != 1 {
        return Err("Desteklenmeyen hafta listesi surumu.".into());
    }
    for entry in &manifest.files {
        let ext = extension(&entry.path).ok_or("Gecersiz dosya uzantisi")?;
        if entry.sha256.len() != 64
            || !entry.sha256.chars().all(|c| c.is_ascii_hexdigit())
            || entry.path != format!("weeks/files/{}.{ext}", entry.sha256)
        {
            return Err("Guvenli olmayan dosya yolu; silme durduruldu.".into());
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn names_and_scope() {
        assert_eq!(week_number("12.Week.pdf"), Some(12));
        assert_eq!(week_number("2.Week"), Some(2));
        assert_eq!(week_number("0.Week.pdf"), None);
        assert_eq!(week_number("notes.pdf"), None);
        let entry = Entry {
            id: "x".into(),
            week: 1,
            name: "1.Week.pdf".into(),
            path: "data/manifest.json".into(),
            sha256: "a".repeat(64),
            size: 10,
        };
        assert!(validate(&Manifest {
            version: 1,
            files: vec![entry]
        })
        .is_err());
    }
}
