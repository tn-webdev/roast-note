document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const editId = params.get("id");
  const from = params.get("from");
  const isEdit = Boolean(editId);

  const form = document.getElementById("note-form");
  const title = document.getElementById("form-title");
  const submitButton = document.getElementById("submit-btn");
  const cancelButton = document.getElementById("cancel-btn");
  const tagList = document.getElementById("tag-list");
  const warning = document.getElementById("duplicate-warning");
  const duplicateList = document.getElementById("duplicate-list");
  const duplicateSaveButton = document.getElementById("duplicate-save-btn");
  const duplicateBackButton = document.getElementById("duplicate-back-btn");

  let selectedTags = [];
  let originalNote = null;
  let pendingData = null;

  function returnUrl() {
    if (from === "search") return "./search.html";
    if (from === "records") return "./records.html";
    return "./index.html";
  }

  function renderTags() {
    RoastNoteUI.renderTagButtons(tagList, selectedTags, tag => {
      selectedTags = selectedTags.includes(tag)
        ? selectedTags.filter(item => item !== tag)
        : [...selectedTags, tag];

      renderTags();
    });
  }

  function setForm(note) {
    document.getElementById("name").value = note.name || "";
    document.getElementById("origin").value = note.origin || "";
    document.getElementById("shop").value = note.shop || "";
    document.getElementById("comment").value = note.comment || "";
    document.getElementById("roast").value = note.roast || "";

    if (note.rating) {
      const ratingInput = document.querySelector(`input[name="rating"][value="${note.rating}"]`);
      if (ratingInput) ratingInput.checked = true;
    }

    selectedTags = note.tags || [];
    renderTags();
  }

  function collectFormData() {
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const now = new Date().toISOString();

    return {
      id: isEdit ? editId : crypto.randomUUID(),
      name: document.getElementById("name").value.trim(),
      origin: document.getElementById("origin").value.trim(),
      shop: document.getElementById("shop").value.trim(),
      comment: document.getElementById("comment").value.trim(),
      roast: document.getElementById("roast").value,
      rating: rating ? Number(rating) : null,
      tags: selectedTags,
      createdAt: isEdit ? (originalNote?.createdAt || now) : now,
      updatedAt: now
    };
  }

  function clearForm() {
    form.reset();
    selectedTags = [];
    renderTags();
    warning.hidden = true;
    pendingData = null;
  }

  function showDuplicateWarning(data, similarNotes) {
    pendingData = data;
    duplicateList.innerHTML = similarNotes
      .map(note => `<p>・${RoastNoteUI.escapeHtml(note.name)}</p>`)
      .join("");
    warning.hidden = false;
    warning.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveData(data) {
    await saveNote(data, isEdit);

    if (isEdit) {
      location.href = returnUrl();
      return;
    }

    alert("保存しました");
    clearForm();
  }

  if (isEdit) {
    title.textContent = "編集";
    submitButton.textContent = "更新";
    originalNote = await getNoteById(editId);

    if (!originalNote) {
      alert("編集対象が見つかりません");
      location.href = returnUrl();
      return;
    }

    setForm(originalNote);
  } else {
    renderTags();
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    warning.hidden = true;

    const data = collectFormData();
    if (!data.name) {
      alert("コーヒー名は必須だよ🤖☕");
      return;
    }

    const notes = await getAllNotes();
    const similarNotes = RoastNoteUI.findSimilarNotes(data.name, notes, isEdit ? editId : null);

    if (similarNotes.length > 0) {
      showDuplicateWarning(data, similarNotes);
      return;
    }

    await saveData(data);
  });

  duplicateSaveButton.addEventListener("click", async () => {
    if (!pendingData) return;
    await saveData(pendingData);
  });

  duplicateBackButton.addEventListener("click", () => {
    pendingData = null;
    warning.hidden = true;
  });

  cancelButton.addEventListener("click", () => {
    location.href = isEdit ? returnUrl() : "./index.html";
  });
});
