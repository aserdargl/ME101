(function (root) {
  const COLUMNS = ["Numara", "İsim", "Soyisim"];
  const keyOf = student => student.email || student.no;

  /** Splits legacy full names for display only; stored names remain unchanged. */
  function displayColumns(student) {
    const parts = String(student.name || "").trim().split(/\s+/);
    const surname = parts.length > 1 ? parts.pop() : "";
    return [student.no || "", parts.join(" "), surname];
  }

  /** Renders private roster actions using injected storage and clipboard dependencies. */
  class RegisteredRoster {
    constructor({ document, students, remove, reset, clipboard, confirm, notify, changed, text }) {
      Object.assign(this, { document, students, remove, reset, clipboard, confirm, notify, changed, text });
      this.selected = new Set();
      this.busy = false;
      this.container = document.getElementById("roster-items-container");
      this.feedback = document.getElementById("roster-list-feedback");
      document.getElementById("btn-roster-delete-selected").onclick = () => this.delete(this.students().filter(student => this.selected.has(keyOf(student))));
      document.getElementById("btn-roster-delete-all").onclick = () => this.delete(this.students());
      document.querySelectorAll("[data-language-toggle]").forEach(button => button.addEventListener("click", () => this.render()));
    }

    element(tag, text, className) {
      const element = this.document.createElement(tag);
      if (text) element.textContent = text;
      if (className) element.className = className;
      return element;
    }

    button(label, action) {
      const button = this.element("button", this.text(label), "btn-clear-rating");
      button.type = "button";
      button.disabled = this.busy;
      button.onclick = action;
      return button;
    }

    render() {
      const students = this.students();
      const current = new Set(students.map(keyOf));
      this.selected = new Set([...this.selected].filter(key => current.has(key)));
      this.document.getElementById("roster-count-badge").textContent = String(students.length);
      this.container.replaceChildren();
      const table = this.element("table", "", "registered-roster-table");
      table.setAttribute("aria-label", this.text("Kayıtlı Öğrenciler"));
      table.append(this.header(students));
      const body = this.element("tbody");
      students.forEach(student => body.append(this.row(student)));
      if (!students.length) {
        const cell = this.element("td", this.text("Henüz kayıtlı öğrenci bulunmuyor."));
        cell.colSpan = 5;
        const row = this.element("tr"); row.append(cell); body.append(row);
      }
      table.append(body); this.container.append(table); this.updateSelection();
    }

    checkbox(label, checked, action) {
      const input = this.element("input");
      input.type = "checkbox"; input.checked = checked; input.disabled = this.busy;
      input.setAttribute("aria-label", this.text(label)); input.onchange = action;
      return input;
    }

    header(students) {
      const head = this.element("thead"), row = this.element("tr"), select = this.element("th");
      this.selectAll = this.checkbox("Tüm öğrencileri seç", false, () => {
        this.selected = new Set(this.selectAll.checked ? students.map(keyOf) : []);
        this.render();
      });
      select.append(this.selectAll); row.append(select);
      COLUMNS.forEach((label, column) => {
        const cell = this.element("th"); cell.scope = "col";
        cell.append(this.element("span", this.text(label)));
        const copy = this.button("Kopyala", () => this.copy(column));
        copy.setAttribute("aria-label", this.text(`${label} sütununu kopyala`));
        copy.disabled = this.busy || !students.length; cell.append(copy); row.append(cell);
      });
      row.append(this.element("th", this.text("İşlemler"))); head.append(row); return head;
    }

    row(student) {
      const row = this.element("tr"), select = this.element("td"), key = keyOf(student);
      const checkbox = this.checkbox("Öğrenciyi seç", this.selected.has(key), event => {
        if (event.target.checked) this.selected.add(key); else this.selected.delete(key);
        this.updateSelection();
      });
      checkbox.setAttribute("aria-label", `${this.text("Öğrenciyi seç")} ${student.no || student.email}`);
      select.append(checkbox);
      row.append(select);
      displayColumns(student).forEach(value => {
        const cell = this.element("td", value); cell.setAttribute("data-roster-value", ""); row.append(cell);
      });
      const actions = this.element("td", "", "registered-roster-actions");
      if (student.email) {
        const email = this.element("small", student.email); email.setAttribute("data-roster-value", ""); actions.append(email);
      }
      if (!student.enabled) actions.append(this.element("small", this.text("Engelli")));
      if (!student.email) actions.append(this.button("Hesap Bağını Sıfırla", () => this.resetStudent(student.no)));
      actions.append(this.button("Sil", () => this.delete([student]))); row.append(actions); return row;
    }

    updateSelection() {
      const count = this.students().length;
      this.selectAll.checked = count > 0 && this.selected.size === count;
      this.selectAll.indeterminate = this.selected.size > 0 && this.selected.size < count;
      this.selectAll.disabled = this.busy || !count;
      this.document.getElementById("btn-roster-delete-selected").disabled = this.busy || !this.selected.size;
      this.document.getElementById("btn-roster-delete-all").disabled = this.busy || !count;
      this.document.getElementById("roster-selected-count").textContent = String(this.selected.size);
    }

    /** Copies exactly one displayed column, retaining blank cells and leading zeroes. */
    async copy(column) {
      try {
        await this.clipboard.writeText(this.students().map(student => displayColumns(student)[column]).join("\n"));
        this.feedback.textContent = this.text("Sütun kopyalandı.");
      } catch { this.feedback.textContent = this.text("Kopyalanamadı. Sütundaki metni seçip kopyalayınız."); }
    }

    async delete(students) {
      if (this.busy || !students.length) return;
      const keys = students.map(keyOf);
      const message = `${this.text("Silinecek öğrenci sayısı:")} ${keys.length}. ${this.text("Bu öğrencilerin ders erişimi kaldırılacak. Devam edilsin mi?")}`;
      if (!this.confirm(message)) return;
      this.busy = true; this.feedback.textContent = this.text("Liste güncelleniyor…"); this.render();
      try {
        const result = await this.remove(keys);
        this.feedback.textContent = result.ok ? this.text("Öğrenci kayıtları silindi.") : `${result.error}${result.removed ? ` (${this.text("Silinen kayıt sayısı:")} ${result.removed})` : ""}`;
        if (!result.ok) this.notify(result.error);
      } finally { this.busy = false; this.render(); this.changed(); }
    }

    async resetStudent(no) {
      if (this.busy || !this.confirm(this.text("Bu numaranın mevcut hesap bağlantısı kaldırılacak; öğrenci yeniden kayıt yapabilecek. Devam edilsin mi?"))) return;
      this.busy = true; this.render();
      try { const result = await this.reset(no); if (!result.ok) this.notify(result.error); }
      finally { this.busy = false; this.render(); }
    }
  }

  root.RegisteredRoster = RegisteredRoster;
  if (typeof module !== "undefined") module.exports = { RegisteredRoster, displayColumns };
})(typeof window !== "undefined" ? window : globalThis);
