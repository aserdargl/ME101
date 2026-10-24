/** Sends one optimistic roster edit through the existing administrator service. */
window.createRosterEditClient = auth => async edit => {
  const base = window.MEE101_APPROVAL_URL;
  if (!base || !auth.currentUser) return { ok: false, error: "Öğretim üyesi girişi gerekli." };
  const target = new URL("roster-update", base.endsWith("/") ? base : `${base}/`);
  const local = ["127.0.0.1", "localhost"].includes(location.hostname);
  if (target.protocol !== "https:" && !(local && target.hostname === "127.0.0.1")) return { ok: false, error: "Geçersiz hizmet adresi." };
  const token = await auth.currentUser.getIdToken(true);
  const response = await fetch(target, { method: "POST", credentials: "omit",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(edit) });
  const result = await response.json();
  return response.ok && result.ok ? result : { ok: false, error: result.error || "Öğrenci kaydedilemedi." };
};
