// 戻る
document.getElementById("back-btn").onclick = () => {
  location.href = "index.html";
};

// Export
document.getElementById("export-btn").addEventListener("click", async () => {
  const notes = await getAllNotes();

  const blob = new Blob(
    [JSON.stringify(notes, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "roast-note-backup.json";
  a.click();

  URL.revokeObjectURL(url);
});

// Import
document.getElementById("import-btn").addEventListener("click", async () => {
  if (!confirm("現在のデータは上書きされます。本当に実行しますか？")) return;

  const fileInput = document.getElementById("import-file");
  const file = fileInput.files[0];

  if (!file) {
    alert("ファイル選んでね");
    return;
  }

  const text = await file.text();
  const data = JSON.parse(text);
  const db = await openDB();

  // --- clear専用トランザクション ---
  await new Promise((resolve, reject) => {
    const tx = db.transaction("notes", "readwrite");
    const store = tx.objectStore("notes");

    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // --- put専用トランザクション ---
  await new Promise((resolve, reject) => {
    const tx = db.transaction("notes", "readwrite");
    const store = tx.objectStore("notes");

    data.forEach(item => {
      store.put(item);
    });

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  alert("インポート完了！");
  location.href = "index.html";
});