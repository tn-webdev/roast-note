document.addEventListener("DOMContentLoaded", async () => {
  const analysisContent = document.getElementById("analysis-content");
  const notes = await getAllNotes();
  const analysis = analyzePreferences(notes);

  if (!analysis) {
    analysisContent.textContent = "評価データがまだありません";
    return;
  }

  const topTags = analysis.tagRanking
    .slice(0, 3)
    .map(tag => `・${RoastNoteUI.escapeHtml(tag.tag)}（${tag.average.toFixed(1)} / ${tag.total}件）`)
    .join("<br>");

  const topRoasts = analysis.roastRanking
    .slice(0, 3)
    .map(item => `・${RoastNoteUI.escapeHtml(RoastNoteUI.formatRoast(item.roast))}（${item.average.toFixed(1)} / ${item.total}件）`)
    .join("<br>");

  const topOrigins = analysis.originRanking
    .slice(0, 3)
    .map(item => `・${RoastNoteUI.escapeHtml(item.origin)}（${item.average.toFixed(1)} / ${item.total}件）`)
    .join("<br>");

  analysisContent.innerHTML = `
    <div class="analysis-section">
      <div class="analysis-label">登録済み評価データ</div>
      <div class="analysis-item">${analysis.totalRated}件</div>
    </div>

    <div class="analysis-section">
      <div class="analysis-label">高評価に付きやすいタグ</div>
      <div class="analysis-item">${topTags || "データなし"}</div>
    </div>

    <div class="analysis-section">
      <div class="analysis-label">好きな焙煎度</div>
      <div class="analysis-item">${topRoasts || "データなし"}</div>
    </div>

    <div class="analysis-section">
      <div class="analysis-label">好きな産地</div>
      <div class="analysis-item">${topOrigins || "データなし"}</div>
    </div>
  `;
});

function analyzePreferences(notes) {
  const ratedNotes = notes.filter(note =>
    note.rating !== null &&
    note.rating !== undefined
  );

  if (ratedNotes.length === 0) return null;

  const tagStats = {};
  ratedNotes.forEach(note => {
    (note.tags || []).forEach(tag => {
      if (!tagStats[tag]) tagStats[tag] = { total: 0, sum: 0 };
      tagStats[tag].total += 1;
      tagStats[tag].sum += note.rating;
    });
  });

  const roastStats = {};
  ratedNotes.forEach(note => {
    if (!note.roast) return;
    if (!roastStats[note.roast]) roastStats[note.roast] = { total: 0, sum: 0 };
    roastStats[note.roast].total += 1;
    roastStats[note.roast].sum += note.rating;
  });

  const originStats = {};
  ratedNotes.forEach(note => {
    const origin = note.origin?.trim();
    if (!origin) return;
    if (!originStats[origin]) originStats[origin] = { total: 0, sum: 0 };
    originStats[origin].total += 1;
    originStats[origin].sum += note.rating;
  });

  return {
    totalRated: ratedNotes.length,
    tagRanking: createRanking(tagStats, "tag"),
    roastRanking: createRanking(roastStats, "roast"),
    originRanking: createRanking(originStats, "origin")
  };
}

function createRanking(stats, keyName) {
  return Object.entries(stats)
    .map(([key, data]) => ({
      [keyName]: key,
      average: data.sum / data.total,
      total: data.total
    }))
    .sort((a, b) => b.average - a.average);
}
