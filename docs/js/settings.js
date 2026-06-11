document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("export-btn").addEventListener("click", exportNotes);
  document.getElementById("import-btn").addEventListener("click", importNotes);
  document.getElementById("delete-all-btn").addEventListener("click", deleteAllNotes);
});

async function exportNotes() {
  const notes = await getAllNotes();
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "roast-note-backup.json";
  link.click();

  URL.revokeObjectURL(url);
}

async function importNotes() {
  if (!confirm("現在のデータは上書きされます。本当に実行しますか？")) return;

  const file = document.getElementById("import-file").files[0];
  if (!file) {
    alert("ファイルを選んでください");
    return;
  }

  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    alert("JSONファイルを読み込めませんでした");
    return;
  }

  if (!Array.isArray(data)) {
    alert("Roast Noteのバックアップ形式ではありません");
    return;
  }

  await removeAllNotes();

  for (const item of data) {
    await saveNote(item, false);
  }

  alert("インポート完了");
}

async function deleteAllNotes() {
  if (!confirm("登録データをすべて削除しますか？")) return;
  await removeAllNotes();
  alert("全削除しました");
}

async function removeAllNotes() {
  const notes = await getAllNotes();
  for (const note of notes) {
    await deleteNote(note.id);
  }
}
