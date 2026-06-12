const RoastNoteUI = (() => {
  const TASTE_TAGS = [
    "甘み",
    "苦み",
    "酸味ひかえめ",
    "酸味あり",
    "コク",
    "ナッツ",
    "チョコ",
    "香ばしい",
    "フルーティ",
    "土っぽい",
    "まろやか",
    "すっきり",
    "重め",
    "軽め",
    "余韻あり"
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatRoast(roast) {
    const map = {
      light: "浅煎り（ライト：-20秒）",
      cinnamon: "浅煎り（シナモン：-10秒）",
      medium: "中煎り（ミディアム：標準）",
      high: "中煎り（ハイ：+20秒）",
      city: "深煎り（シティ以上：+40秒～）"
    };
    return map[roast] || "不明";
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).replaceAll("/", "-");
  }

  function sortNewest(notes) {
    return [...notes].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
  }

  function normalizeCoffeeName(text) {
    return (text || "").trim().toLowerCase().replace(/\s+/g, "");
  }

  function findSimilarNotes(inputName, notes, currentId = null) {
    const target = normalizeCoffeeName(inputName);
    if (!target) return [];

    return notes.filter(note => {
      if (currentId && note.id === currentId) return false;

      const existing = normalizeCoffeeName(note.name);
      if (!existing) return false;

      return existing.includes(target) || target.includes(existing);
    });
  }

  function renderTagButtons(container, selectedTags, onToggle) {
    container.innerHTML = "";

    TASTE_TAGS.forEach(tag => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = tag;
      button.className = "tag-chip";

      if (selectedTags.includes(tag)) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => onToggle(tag));
      container.appendChild(button);
    });
  }

  function createNoteCard(note, actions = {}) {
    const tags = note.tags || [];
    const tagHtml = tags.length
      ? `<div class="note-tags">${tags.map(tag => `<span class="note-tag">${escapeHtml(tag)}</span>`).join("")}</div>`
      : "";
    const createdDate = formatDate(note.createdAt);
    const updatedDate = formatDate(note.updatedAt);
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <div class="top">🫘 ${escapeHtml(note.name || "（未入力）")}</div>
      <div class="sub">${escapeHtml(formatRoast(note.roast))} / 評価 <strong>${escapeHtml(note.rating ?? "-")}</strong></div>
      ${tagHtml}
      <div class="comment">${escapeHtml(note.comment || "なし")}</div>
      ${note.origin ? `<div class="origin">${escapeHtml(note.origin)}</div>` : ""}
      ${note.shop ? `<div class="shop">${escapeHtml(note.shop)}</div>` : ""}
      <div class="note-dates">
        <div>📅作成日 ${escapeHtml(createdDate)}</div>
        <div>✏️更新日 ${escapeHtml(updatedDate)}</div>
      </div>
    `;

    const hasActions = actions.onEdit || actions.onDelete;
    if (hasActions) {
      const wrapper = document.createElement("div");
      wrapper.className = "btn-group";

      if (actions.onEdit) {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "編集";
        editButton.addEventListener("click", () => actions.onEdit(note));
        wrapper.appendChild(editButton);
      }

      if (actions.onDelete) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "削除";
        deleteButton.className = "secondary-btn";
        deleteButton.addEventListener("click", () => actions.onDelete(note));
        wrapper.appendChild(deleteButton);
      }

      card.appendChild(wrapper);
    }

    return card;
  }

  function renderEmpty(container, message = "該当なし🤖☕") {
    container.innerHTML = "";
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = message;
    container.appendChild(empty);
  }

  return {
    TASTE_TAGS,
    createNoteCard,
    escapeHtml,
    findSimilarNotes,
    formatRoast,
    renderEmpty,
    renderTagButtons,
    sortNewest,
    formatDate
  };
})();
