use serde::Deserialize;
use unicode_normalization::UnicodeNormalization;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Decision {
    pub uid: String,
    pub action: String,
    pub no: Option<String>,
    pub name: Option<String>,
}

pub fn valid_uid(uid: &str) -> bool {
    !uid.is_empty() && uid.len() <= 128
        && uid.bytes().all(|value| value.is_ascii_alphanumeric() || matches!(value, b'-' | b'_'))
}

pub fn valid_number(no: &str) -> bool {
    !no.is_empty() && no.len() <= 32 && no.bytes().all(|value| value.is_ascii_digit())
}

pub fn name_key(name: &str) -> String {
    name.nfkc().flat_map(|character| match character {
        'I' => 'ı'.to_lowercase(), 'İ' => 'i'.to_lowercase(), other => other.to_lowercase()
    }).collect::<String>().split_whitespace().collect::<Vec<_>>().join(" ")
}

pub fn validate(decision: &Decision, actor: &str, target_is_admin: bool, state: &str) -> Result<(), &'static str> {
    if !valid_uid(&decision.uid) || !matches!(decision.action.as_str(), "approve" | "reject") {
        return Err("Geçersiz işlem.");
    }
    if decision.uid == actor || target_is_admin { return Err("Yönetici hesapları bu işlemle değiştirilemez."); }
    if state != "pending" && !(state == "rejected" && decision.action == "reject") {
        return Err("Başvuru başka bir işlemle sonuçlandırılmış.");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn decision(action: &str) -> Decision {
        Decision { uid: "student".into(), action: action.into(), no: None, name: None }
    }
    #[test]
    fn protects_administrators_and_completed_decisions() {
        assert!(validate(&decision("reject"), "student", false, "pending").is_err());
        assert!(validate(&decision("reject"), "owner", true, "pending").is_err());
        assert!(validate(&decision("reject"), "owner", false, "approved").is_err());
        assert!(validate(&decision("reject"), "owner", false, "rejected").is_ok());
        assert!(validate(&decision("approve"), "owner", false, "pending").is_ok());
    }
    #[test]
    fn rejects_paths_and_malformed_numbers() {
        assert!(!valid_uid("../owner"));
        assert!(!valid_number("2.026e8"));
        assert!(valid_number("001234"));
    }
}
