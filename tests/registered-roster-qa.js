/* Synthetic local-only roster fixture. Loaded exclusively by /qa-roster. */
window.addEventListener("DOMContentLoaded", () => {
  const key = "qa-registered-roster";
  const seed = [{ no: "00123", name: "Ahmet Serdar Güldibi", enabled: true }, { no: "00456", name: "Ayşe Kaya", enabled: true }, { email: "legacy@example.test", no: "00789", name: "Özgün İsim", enabled: false }];
  const load = () => JSON.parse(localStorage.getItem(key) || JSON.stringify(seed));
  const service = new FirebaseStudentService({
    errorMessage: error => error.message,
    writeRoster: async (students, removals) => {
      const id = student => student.email || student.no;
      const records = new Map(load().map(student => [id(student), student]));
      removals.forEach(student => records.delete(id(student)));
      students.forEach(student => records.set(id(student), student));
      localStorage.setItem(key, JSON.stringify([...records.values()]));
      service.roster = load(); renderRosterAdminList();
    }
  });
  service.isAdmin = true; service.roster = load();
  Object.defineProperty(FirebaseStudents, "isAdmin", { get: () => true });
  Object.defineProperty(FirebaseStudents, "roster", { get: () => service.roster });
  FirebaseStudents.removeStudents = keys => service.removeStudents(keys);
  FirebaseStudents.saveText = (text, replace) => {
    const result = StudentNumbers.parse(text);
    return result.ok ? service.saveRoster(result.students, replace) : Promise.resolve(result);
  };
  const button = document.createElement("button");
  button.textContent = "Open synthetic roster";
  button.onclick = () => { isAdminAuthenticated = true; updateAdminUI(); openPptxModal("tab-student-roster"); };
  const proof = document.createElement("output"); proof.id = "qa-roster-proof";
  setInterval(() => { proof.textContent = JSON.stringify({ records: load(), lecturePreserved: LECTURES.some(lecture => lecture.id === "qa-original") }); }, 100);
  document.querySelectorAll("body > button").forEach(control => { control.style.display = "none"; });
  document.body.append(button, proof);
});
