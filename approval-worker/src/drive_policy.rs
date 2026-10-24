use serde::Deserialize;

pub const MAX_ASSET_SIZE: u64 = 2 * 1024 * 1024 * 1024;

pub fn valid_hash(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

pub fn valid_file_id(value: &str) -> bool {
    (10..=200).contains(&value.len()) && value.bytes().all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AssetRegistration {
    pub hash: String,
    pub file_id: String,
    pub size: u64,
}

impl AssetRegistration {
    pub fn validate(&self) -> Result<(), &'static str> {
        if !valid_hash(&self.hash) || !valid_file_id(&self.file_id) || self.size == 0 || self.size > MAX_ASSET_SIZE {
            return Err("Geçersiz ders dosyası.");
        }
        Ok(())
    }

    pub fn matches(&self, file: &serde_json::Value, folder: &str) -> bool {
        file["id"].as_str() == Some(&self.file_id)
            && file["sha256Checksum"].as_str() == Some(&self.hash)
            && file["size"].as_str().and_then(|value| value.parse::<u64>().ok()) == Some(self.size)
            && file["trashed"] != true
            && file["parents"].as_array().is_some_and(|parents| parents.iter().any(|parent| parent.as_str() == Some(folder)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn registration_requires_verified_bytes_and_the_course_folder() {
        let asset = AssetRegistration { hash: "a".repeat(64), file_id: "verified-file-123".into(), size: 1024 };
        assert!(asset.validate().is_ok());
        let file = json!({"id":asset.file_id,"sha256Checksum":asset.hash,"size":"1024","parents":["course-folder"],"trashed":false});
        assert!(asset.matches(&file,"course-folder"));
        assert!(!asset.matches(&file,"private-backup-folder"));
        let mut damaged = file.clone(); damaged["sha256Checksum"] = json!("b".repeat(64));
        assert!(!asset.matches(&damaged,"course-folder"));
        damaged = file.clone(); damaged["size"] = json!("1023");
        assert!(!asset.matches(&damaged,"course-folder"));
        damaged = file.clone(); damaged["trashed"] = json!(true);
        assert!(!asset.matches(&damaged,"course-folder"));
    }

    #[test]
    fn rejects_paths_and_non_content_addresses() {
        assert!(!valid_hash(&"A".repeat(64)));
        assert!(!valid_hash("../private"));
        assert!(!valid_file_id("../../private/settings"));
        assert!(!valid_file_id("file-id?alt=media"));
    }
}
