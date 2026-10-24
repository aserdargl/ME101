(function (root) {
  const FIELD_IDS = ["inp-roster-numbers", "inp-roster-names", "inp-roster-surnames"];
  const lines = text => text.replace(/\r\n?/g, "\n").split("\n");

  /** Presents independent paste columns without changing the stored student schema. */
  class RosterTable {
    constructor(document) {
      this.fields = FIELD_IDS.map(id => document.getElementById(id));
      this.fields.forEach((field, column) => {
        field.addEventListener("paste", event => this.paste(event, column));
        field.addEventListener("scroll", () => {
          this.fields.forEach(other => { other.scrollTop = field.scrollTop; });
        });
      });
    }

    /** Keeps blank cells aligned and leading zeroes intact for existing validation. */
    read() {
      const columns = this.fields.map(field => lines(field.value));
      return Array.from({ length: Math.max(...columns.map(column => column.length)) }, (_, row) =>
        columns.map(column => column[row] || "").join("\t")
      ).join("\n");
    }

    clear() {
      this.fields.forEach(field => { field.value = ""; field.scrollTop = 0; });
    }

    /** Validates file imports before replacing any unsaved table values. */
    load(text) {
      const result = root.StudentNumbers.parse(text);
      if (!result.ok) return result;
      const rows = result.students.map(student => {
        const parts = student.name.split(" ");
        const surname = parts.length > 1 ? parts.pop() : "";
        return [student.no, parts.join(" "), surname];
      });
      this.fields.forEach((field, column) => { field.value = rows.map(row => row[column]).join("\n"); });
      return { ok: true };
    }

    /** Distributes spreadsheet cells starting at the selected row and column. */
    paste(event, column) {
      const text = event.clipboardData.getData("text/plain");
      if (!text.includes("\t")) return;
      event.preventDefault();
      const field = this.fields[column];
      const startRow = lines(field.value.slice(0, field.selectionStart)).length - 1;
      const rows = lines(text.replace(/\r?\n$/, "")).map(row => row.split("\t"));
      if (rows.some(row => row.length > this.fields.length - column)) {
        root.alert(root.PortalLanguage?.text("En fazla üç sütun yapıştırınız: numara, isim, soyisim.") || "En fazla üç sütun yapıştırınız: numara, isim, soyisim.");
        return;
      }
      this.fields.slice(column).forEach((target, offset) => {
        const values = lines(target.value);
        rows.forEach((row, index) => {
          if (offset < row.length) values[startRow + index] = row[offset];
        });
        target.value = Array.from(values, value => value || "").join("\n");
      });
    }
  }

  root.RosterTable = RosterTable;
  if (typeof module !== "undefined") module.exports = { RosterTable };
})(typeof window !== "undefined" ? window : globalThis);
