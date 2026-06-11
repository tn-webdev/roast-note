document.addEventListener("DOMContentLoaded", () => {
  const count = document.getElementById("record-count");
  const toggleButton = document.getElementById("toggle-all-btn");
  const output = document.getElementById("output");

  let showAll = false;

  async function renderRecords() {
    const notes = RoastNoteUI.sortNewest(await getAllNotes());
    const visibleNotes = showAll ? notes : notes.slice(0, 5);

    count.textContent = `${notes.length}件`;
    toggleButton.textContent = showAll ? "最近5件" : "全件表示";
    toggleButton.hidden = notes.length <= 5;
    output.innerHTML = "";

    if (visibleNotes.length === 0) {
      RoastNoteUI.renderEmpty(output, "登録データがありません");
      return;
    }

    visibleNotes.forEach(note => {
      output.appendChild(RoastNoteUI.createNoteCard(note, {
        onEdit: item => {
          location.href = `./register.html?id=${encodeURIComponent(item.id)}&from=records`;
        },
        onDelete: async item => {
          if (!confirm("削除しますか？")) return;
          await deleteNote(item.id);
          renderRecords();
        }
      }));
    });
  }

  toggleButton.addEventListener("click", () => {
    showAll = !showAll;
    renderRecords();
  });

  renderRecords();
});
