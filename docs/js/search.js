document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const tagFilterList = document.getElementById("tag-filter-list");
  const output = document.getElementById("output");

  let activeFilterTag = null;

  function renderTagFilter() {
    RoastNoteUI.renderTagButtons(
      tagFilterList,
      activeFilterTag ? [activeFilterTag] : [],
      tag => {
        activeFilterTag = activeFilterTag === tag ? null : tag;
        renderTagFilter();
        renderNotes();
      }
    );
  }

  async function renderNotes() {
    const keyword = searchInput.value.trim().toLowerCase();
    const notes = await getAllNotes();

    const filtered = RoastNoteUI.sortNewest(notes).filter(note => {
      const tags = note.tags || [];
      const matchesKeyword = !keyword || (
        note.name?.toLowerCase().includes(keyword) ||
        note.comment?.toLowerCase().includes(keyword) ||
        tags.some(tag => tag.toLowerCase().includes(keyword))
      );
      const matchesTag = !activeFilterTag || tags.includes(activeFilterTag);

      return matchesKeyword && matchesTag;
    });

    output.innerHTML = "";

    if (filtered.length === 0) {
      RoastNoteUI.renderEmpty(output, "該当なし🤖☕");
      return;
    }

    filtered.forEach(note => {
      output.appendChild(RoastNoteUI.createNoteCard(note, {
        onEdit: item => {
          location.href = `./register.html?id=${encodeURIComponent(item.id)}&from=search`;
        },
        onDelete: async item => {
          if (!confirm("削除しますか？")) return;
          await deleteNote(item.id);
          renderNotes();
        }
      }));
    });
  }

  searchInput.addEventListener("input", renderNotes);
  renderTagFilter();
  renderNotes();
});
