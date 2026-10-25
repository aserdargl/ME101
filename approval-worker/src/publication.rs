use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

pub const MAX_BODY: usize = 32 * 1024 * 1024;

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Publication {
    pub head: String,
    pub id: String,
    pub parts: Vec<String>,
    pub digest: String,
    #[serde(rename = "lectureCount")]
    pub lecture_count: usize,
    #[serde(default)]
    pub format: Option<u8>,
    #[serde(default)]
    pub hashes: Vec<String>,
    #[serde(default)]
    pub encodings: Vec<String>,
    #[serde(default, rename = "partLength")]
    pub part_length: Option<usize>,
}

fn hex(value: &str, size: usize) -> bool {
    value.len() == size && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

impl Publication {
    /// Accepts only generated snapshot paths and Git object IDs, never caller-supplied source paths.
    pub fn valid(&self) -> bool {
        let id: Vec<&str> = self.id.split('-').collect();
        id.len() == 5 && id.iter().zip([8, 4, 4, 4, 12]).all(|(part, size)| hex(part, size))
            && hex(&self.head, 40) && hex(&self.digest, 64)
            && !self.parts.is_empty() && self.parts.len() <= if self.format==Some(2) {4096} else {400}
            && self.parts.iter().all(|part| hex(part, 40))
            && match self.format {
                Some(2)=>self.part_length==Some(4*1024*1024) && self.hashes.len()==self.parts.len()
                    && self.hashes.iter().all(|hash|hex(hash,64)) && self.encodings.len()==self.parts.len()
                    && self.encodings.iter().all(|encoding|matches!(encoding.as_str(),"plain"|"gzip")),
                None=>self.hashes.is_empty() && self.encodings.is_empty() && self.part_length.is_none(),
                _=>false
            }
    }

    /// Builds a fresh snapshot subtree so obsolete publication files are no longer served.
    pub fn snapshot_entries(&self) -> Vec<Value> {
        self.parts.iter().enumerate().map(|(index, sha)| {
            json!({"path":format!("{}/{index}.txt",self.id),"mode":"100644","type":"blob","sha":sha})
        }).collect()
    }

    /// Replaces only the managed snapshot directory and manifest in the existing source tree.
    pub fn entries(&self, snapshot_sha: &str, manifest_sha: &str) -> Vec<Value> {
        vec![
            json!({"path":"data/snapshots","mode":"040000","type":"tree","sha":snapshot_sha}),
            json!({"path":"data/manifest.json","mode":"100644","type":"blob","sha":manifest_sha}),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> Publication {
        Publication {head:"a".repeat(40),id:"12345678-1234-1234-1234-123456789abc".into(),
            parts:vec!["b".repeat(40)],digest:"c".repeat(64),lecture_count:1,format:None,hashes:vec![],encodings:vec![],part_length:None}
    }
    #[test]
    fn only_snapshot_files_and_manifest_can_be_written() {
        let publication=fixture();
        assert!(publication.valid());
        let entries=publication.entries(&"e".repeat(40), &"d".repeat(40));
        assert_eq!(entries.len(),2);
        assert_eq!(entries[0]["path"],"data/snapshots");
        assert_eq!(entries[0]["type"],"tree");
        let parts=publication.snapshot_entries();
        assert_eq!(parts[0]["path"],format!("{}/0.txt",publication.id));
        assert_eq!(entries[1]["path"],"data/manifest.json");
        assert!(entries.iter().all(|entry|entry["sha"].is_string()));
    }
    #[test]
    fn format_two_keeps_compression_hashes_and_bounded_parts() {
        let mut publication=fixture();
        publication.format=Some(2);publication.part_length=Some(4*1024*1024);
        publication.hashes=vec!["e".repeat(64)];publication.encodings=vec!["gzip".into()];
        assert!(publication.valid());
        publication.encodings[0]="unsupported".into();assert!(!publication.valid());
        let mut body=serde_json::to_value(fixture()).unwrap();body["tree"]=json!("source-replacement");
        assert!(serde_json::from_value::<Publication>(body).is_err());
    }
    #[test]
    fn rejects_path_injection_missing_parts_and_invalid_ids() {
        for id in ["../index.html", "12345678-1234-1234-1234-123456789ab/"] {
            let mut publication=fixture(); publication.id=id.into(); assert!(!publication.valid());
        }
        let mut publication=fixture();publication.parts.clear();assert!(!publication.valid());
        publication.parts=vec!["b".repeat(40);401];assert!(!publication.valid());
        let mut publication=fixture();publication.head="main".into();assert!(!publication.valid());
        assert!(serde_json::from_value::<Publication>(json!({"force":true})).is_err());
    }
}
