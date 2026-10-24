/* Emulator-only fixtures. This script has no production URL or credentials. */
async function post(path, body) {
  const response = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/${path}?key=demo-key`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer owner" }, body: JSON.stringify(body)
  });
  if (!response.ok) throw Error(await response.text());
  return response.json();
}
async function putDocument(path, fields) {
  const response = await fetch(`http://127.0.0.1:8088/v1/projects/demo-lecturenotes/databases/(default)/documents/${path}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer owner" }, body: JSON.stringify({ fields })
  });
  if (!response.ok) throw Error(await response.text());
}
(async () => {
  for (const [email, enabled, admin] of [["admin@example.test", true, true], ["student@example.test", true, false], ["blocked@example.test", false, false]]) {
    const user = await post("accounts:signUp", { email, password: "Synthetic-Test-Only-123!", returnSecureToken: true });
    await post("accounts:update", { localId: user.localId, emailVerified: true });
    if (admin) await putDocument(`admins/${user.localId}`, { role: { stringValue: "owner" } });
    else await putDocument(`students/${email}`, {
      email: { stringValue: email }, no: { stringValue: email.split("@")[0] },
      name: { stringValue: "Synthetic Student" }, enabled: { booleanValue: enabled }
    });
  }
  process.stdout.write("Synthetic emulator accounts ready\n");
})().catch(error => { process.stderr.write(error.message); process.exitCode = 1; });
