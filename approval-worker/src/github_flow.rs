const COOKIE_NAME: &str = "__Host-lecture_github";

pub fn valid_nonce(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

/// Requires the same browser's short-lived state and PKCE verifier.
pub fn cookie_proof(cookie: &str, state: &str) -> Option<(String, String)> {
    if !valid_nonce(state) { return None; }
    let value = cookie.split(';').map(str::trim).find_map(|part| part.strip_prefix(&format!("{COOKIE_NAME}=")))?;
    let parts: Vec<_> = value.split('.').collect();
    if parts.len() != 3 || parts[0] != state || !parts.iter().all(|part| valid_nonce(part)) { return None; }
    Some((parts[1].into(), parts[2].into()))
}

pub fn login_cookie(state: &str, verifier: &str, request_id: &str) -> String {
    format!("{COOKIE_NAME}={state}.{verifier}.{request_id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600")
}

pub fn clear_cookie() -> String {
    format!("{COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0")
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn requires_matching_browser_state_and_complete_pkce_proof() {
        let state = "a".repeat(64); let verifier = "b".repeat(64); let id = "c".repeat(64);
        let cookie = login_cookie(&state, &verifier, &id);
        assert_eq!(cookie_proof(&cookie, &state), Some((verifier, id)));
        assert!(cookie_proof(&cookie, &"d".repeat(64)).is_none());
        assert!(cookie_proof("", &state).is_none());
        assert!(cookie_proof(&cookie.replace(&"b".repeat(64), "short"), &state).is_none());
        assert!(!valid_nonce("<script>"));
    }
}
