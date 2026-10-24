/** Sends a review decision with the current administrator's Firebase ID token. */
window.createApprovalClient = auth => async (uid, action, no, name) => {
  const base = window.MEE101_APPROVAL_URL;
  if (!base || !auth.currentUser) throw { code: "approval/unavailable" };
  const target = new URL(base);
  const local = ["127.0.0.1", "localhost"].includes(location.hostname);
  if (target.protocol !== "https:" && !(local && target.hostname === "127.0.0.1")) throw { code: "approval/unavailable" };
  const token = await auth.currentUser.getIdToken(true);
  const response = await fetch(new URL("review", target.href.endsWith("/") ? target : `${target.href}/`), {
    method: "POST", credentials: "omit", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ uid, action, ...(no ? { no } : {}), ...(name ? { name } : {}) })
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw { code: "approval/failed", publicMessage: data.error || "İşlem tamamlanamadı." };
  return data;
};
