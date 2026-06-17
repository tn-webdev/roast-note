document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const ratingFilter = document.getElementById("ratingFilter");
  const originFilter = document.getElementById("originFilter");
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
    const selectedRating = ratingFilter.value;
    const originKeyword = originFilter.value.trim().toLowerCase();

    const notes = await getAllNotes();

    const filtered = RoastNoteUI.sortNewest(notes).filter(note => {
      const tags = note.tags || [];

      const matchesKeyword = !keyword || (
        note.name?.toLowerCase().includes(keyword) ||
        note.comment?.toLowerCase().includes(keyword) ||
        tags.some(tag => tag.toLowerCase().includes(keyword))
      );

      const matchesTag = !activeFilterTag || tags.includes(activeFilterTag);

      const matchesRating = !selectedRating ||
              (selectedRating === "none"
                ? !note.rating
                : Number(note.rating) === Number(selectedRating));

      const matchesOrigin = !originKeyword ||
        (note.origin || "").toLowerCase().includes(originKeyword);

      return matchesKeyword && matchesTag && matchesRating && matchesOrigin;
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
  ratingFilter.addEventListener("change", renderNotes);
  originFilter.addEventListener("input", renderNotes);

  renderTagFilter();
  renderNotes();
});
