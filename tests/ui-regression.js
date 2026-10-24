/* Loaded exclusively by the isolated local QA server, never by the live site. */
(() => {
  const button = document.createElement("button");
  button.textContent = "Run isolated regression";
  button.style = "position:fixed;bottom:60px;left:12px;z-index:700;padding:10px";
  const result = document.createElement("output");
  result.id = "qa-regression";
  result.className = "visually-hidden";
  document.body.append(button, result);
  const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const check = (condition, message) => { if (!condition) throw new Error(message); };

  button.onclick = async () => {
    try {
      closePptxModal();
      const original = JSON.stringify(LECTURES.find(item => item.id === "qa-original"));
      openEditLectureModal("qa-original");
      document.getElementById("edit-slide-title").value = "Cancelled draft";
      closeEditLectureModal();
      check(JSON.stringify(LECTURES.find(item => item.id === "qa-original")) === original, "Cancel altered original");
      openEditLectureModal("qa-original");
      document.getElementById("btn-save-edit-lecture").click();
      const deadline = performance.now() + 5000;
      while (editingLectureDraft && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
      check(!editingLectureDraft, "Save did not complete");
      check(JSON.stringify(LECTURES.find(item => item.id === "qa-original")) === original, "Save altered original");
      const stored = await LectureStorage.load();
      check(JSON.stringify(stored.find(item => item.id === "qa-original")) === original, "Reload altered original");

      const slide = { title: "Synthetic slide", kicker: "QA", pptSummaryBullets: Array.from({ length: 30 }, (_, i) => `Synthetic bullet ${i}`), html: "<p>Isolated test content</p>" };
      const stress = { id: "qa-stress", week: "12. Hafta", title: "120 synthetic slides", description: "QA", slides: Array.from({ length: 120 }, (_, index) => ({ ...structuredClone(slide), title: `Synthetic ${index}` })) };
      LECTURES.push(stress, ...[6, 1, 10, 2].map(week => ({ id: `qa-week-${week}`, week: `${week}. Hafta`, title: "QA week", description: "QA", slides: [structuredClone(slide)] })));
      renderCatalog();
      const weeks = [...document.querySelectorAll(".week-tag")].map(item => Number(item.textContent.match(/\d+/)[0]));
      const sorted = weeks.every((week, index) => !index || week >= weeks[index - 1]);

      const start = performance.now();
      openEditLectureModal(stress.id);
      await settle();
      const openingMs = Math.round(performance.now() - start);
      const renderedThumbnails = document.querySelectorAll(".edit-thumb-preview:not(:empty)").length;
      const firstCard = document.querySelector(".edit-thumb-card");
      const switchStart = performance.now();
      document.querySelectorAll(".edit-thumb-card")[1].click();
      await settle();
      const switchMs = Math.round(performance.now() - switchStart);
      const retainedCards = firstCard === document.querySelector(".edit-thumb-card");
      closeEditLectureModal();
      result.textContent = JSON.stringify({ preservedOnCancelSaveReload: true, weeks, sorted, openingMs, renderedThumbnails, switchMs, retainedCards });
      sessionStorage.setItem("qa-regression-result", result.textContent);
    } catch (error) {
      result.textContent = `FAIL: ${error.message}`;
    }
  };
  result.textContent = sessionStorage.getItem("qa-regression-result") || "Not run";
})();
