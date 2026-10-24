/** Renders private pending applications only inside the authenticated instructor panel. */
window.renderApprovalApplications = () => {
  const container = document.getElementById("approval-applications");
  if (!container) return;
  container.replaceChildren();
  const applications = FirebaseStudents.applications.filter(application => application.status === "pending"
    || application.status === "rejected" && application.deletionStatus === "pending");
  document.getElementById("approval-pending-count").textContent = applications.length;
  for (const application of applications) {
    const card = document.createElement("article");
    card.className = "approval-card";
    const pending = application.status === "pending";
    card.innerHTML = `<div><strong>${escapeXml(application.name)}</strong> · ${escapeXml(application.email)}</div>
      <small>${pending ? "Eşleşmeyen kayıt · Onay bekliyor · Geçici erişim açık" : "Reddedildi · Erişim kapalı · Hesap silme yeniden denenecek"}</small>
      <div class="approval-fields"><label>Öğrenci Numarası<input data-review-number value="${escapeXml(application.no)}" inputmode="numeric" maxlength="32" /></label>
      <label>Ad Soyad<input data-review-name value="${escapeXml(application.name)}" maxlength="200" /></label></div>
      <div class="firebase-auth-actions">${pending ? '<button class="btn btn-primary" data-review-action="approve">Onayla</button>' : ""}
      <button class="btn approval-reject-button" data-review-action="reject">${pending ? "Reddet ve Hesabı Sil" : "Hesap Silmeyi Tekrar Dene"}</button></div>`;
    card.querySelectorAll("[data-review-action]").forEach(button => {
      button.addEventListener("click", async () => {
        const action = button.dataset.reviewAction;
        if (action === "reject" && !confirm(`${application.email} hesabının erişimi kapatılacak ve giriş hesabı kalıcı olarak silinecek. Devam edilsin mi?`)) return;
        card.querySelectorAll("button").forEach(control => { control.disabled = true; });
        const result = await FirebaseStudents.reviewApplication(application.uid, action,
          card.querySelector("[data-review-number]").value, card.querySelector("[data-review-name]").value);
        const feedback = document.getElementById("approval-feedback");
        feedback.textContent = result.ok ? action === "approve" ? "Kayıt onaylandı."
          : result.deletionStatus === "deleted" ? "Erişim kapatıldı ve giriş hesabı silindi."
          : "Erişim kapatıldı. Hesap silme işlemi otomatik yeniden denenecek." : result.error;
        card.querySelectorAll("button").forEach(control => { control.disabled = false; });
      });
    });
    container.appendChild(card);
  }
};
