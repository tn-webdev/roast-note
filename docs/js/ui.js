// =====================
//  UI処理
// =====================
document.addEventListener("DOMContentLoaded", () => {
    let currentEditId = null;           // 編集用グローバル変数

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

    let selectedTags = [];
    let activeFilterTag = null;          // 一覧絞り込み中のタグ

    function renderTagSelector() {
        const tagList = document.getElementById("tag-list");
        tagList.innerHTML = "";

        TASTE_TAGS.forEach(tag => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = tag;
            button.className = "tag-chip";

            if (selectedTags.includes(tag)) {
                button.classList.add("selected");
            }

            button.addEventListener("click", () => {
                if (selectedTags.includes(tag)) {
                    selectedTags = selectedTags.filter(t => t !== tag);
                } else {
                    selectedTags.push(tag);
                }

                renderTagSelector();
            });

            tagList.appendChild(button);
        });
    }

    function renderTagFilter() {
        const tagFilterList = document.getElementById("tag-filter-list");
        tagFilterList.innerHTML = "";

        TASTE_TAGS.forEach(tag => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = tag;
            button.className = "tag-chip";

            if (activeFilterTag === tag) {
                button.classList.add("selected");
            }

            button.addEventListener("click", () => {
                if (activeFilterTag === tag) {
                    activeFilterTag = null;      // 同じタグを押したら解除
                } else {
                    activeFilterTag = tag;       // 押したタグで絞り込み
                }

                renderTagFilter();
                renderNotes();
            });

            tagFilterList.appendChild(button);
        });
    }

    async function editNote(id) {
        const data = await getNoteById(id);

        document.getElementById("name").value = data.name;
        document.getElementById("comment").value = data.comment;
        document.getElementById("roast").value = data.roast;
        document.getElementById("origin").value = data.origin;
        document.getElementById("shop").value = data.shop || "";

        if (data.rating) {
            document.querySelector(`input[name="rating"][value="${data.rating}"]`).checked = true;
        }

        selectedTags = data.tags || [];
        renderTagSelector();

        currentEditId = id;

        document.getElementById("form-title").textContent = "✏️ 編集中";
        document.getElementById("submit-btn").textContent = "更新";
    }

    // DOM（ページの構造データ）読み込み後に実行

    document.getElementById("note-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const rating = document.querySelector('input[name="rating"]:checked')?.value;

        const data = {
        name: document.getElementById("name").value,
        comment: document.getElementById("comment").value,
        rating: rating ? Number(rating) : null,
        roast: document.getElementById("roast").value,
        origin: document.getElementById("origin").value,
        shop: document.getElementById("shop").value, 
        tags: selectedTags,
        createdAt: new Date().toISOString()
        };

        if (!data.name) {
            alert("コーヒー名は必須だよ🤖☕️");
            return;
        }

        const notes = await getAllNotes();
        const similarNotes = findSimilarNotes(data.name, notes, currentEditId);

        if (similarNotes.length > 0) {
            alert(
                "似た名前のコーヒーがあります☕️\n\n" +
                similarNotes.map(note => `・${note.name}`).join("\n")
            );
        }

        if (currentEditId) {
            data.id = currentEditId;
        } else {
            data.id = crypto.randomUUID();
        }

        await saveNote(data, currentEditId !== null);
        currentEditId = null;

        console.log("保存OK", data);

        // フォームリセット
        e.target.reset();

        selectedTags = [];
        renderTagSelector();

        // 編集モード解除（UIリセット）
        document.getElementById("form-title").textContent = "新規登録";
        document.getElementById("submit-btn").textContent = "保存";

        // 検索リセット
        document.getElementById("searchInput").value = "";

        // タグ絞り込みリセット
        activeFilterTag = null;
        renderTagFilter();

        // 最後に1回だけ再描画
        renderNotes();
    });

    // =====================
    // 重複チェック
    // =====================
    function normalizeCoffeeName(text) {
        return (text || "").trim().toLowerCase().replace(/\s+/g, "");
    }

    function findSimilarNotes(inputName, notes, currentId = null) {
        const target = normalizeCoffeeName(inputName);

        if (!target) return [];

        return notes.filter(note => {
            // 編集中は自分自身を除外
            if (currentId && note.id === currentId) return false;

            const existing = normalizeCoffeeName(note.name);

            if (!existing) return false;

            return existing.includes(target) || target.includes(existing);
        });
    }

    // =====================
    // フォーマット系
    // =====================
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

    // =====================
    // 好み分析
    // =====================
    function analyzePreferences(notes) {
        const ratedNotes = notes.filter(note =>
            note.rating !== null &&
            note.rating !== undefined
        );

        if (ratedNotes.length === 0) {
            return null;
        }

        // =====================
        // タグ分析
        // =====================
        const tagStats = {};

        ratedNotes.forEach(note => {
            const tags = note.tags || [];

            tags.forEach(tag => {
                if (!tagStats[tag]) {
                    tagStats[tag] = {
                        total: 0,
                        sum: 0
                    };
                }

                tagStats[tag].total += 1;
                tagStats[tag].sum += note.rating;
            });
        });

        // 平均値計算
        const tagRanking = Object.entries(tagStats)
            .map(([tag, data]) => ({
                tag,
                average: data.sum / data.total,
                total: data.total
            }))
            .sort((a, b) => b.average - a.average);

        // =====================
        // 焙煎度分析
        // =====================
        const roastStats = {};

        ratedNotes.forEach(note => {
            if (!note.roast) return;

            if (!roastStats[note.roast]) {
                roastStats[note.roast] = {
                    total: 0,
                    sum: 0
                };
            }

            roastStats[note.roast].total += 1;
            roastStats[note.roast].sum += note.rating;
        });

        const roastRanking = Object.entries(roastStats)
            .map(([roast, data]) => ({
                roast,
                average: data.sum / data.total,
                total: data.total
            }))
            .sort((a, b) => b.average - a.average);

        // =====================
        // 産地分析
        // =====================
        const originStats = {};

        ratedNotes.forEach(note => {
            if (!note.origin) return;

            const origin = note.origin.trim();
            if (!origin) return;

            if (!originStats[origin]) {
                originStats[origin] = {
                    total: 0,
                    sum: 0
                };
            }

            originStats[origin].total += 1;
            originStats[origin].sum += note.rating;
        });

        const originRanking = Object.entries(originStats)
            .map(([origin, data]) => ({
                origin,
                average: data.sum / data.total,
                total: data.total
            }))
            .sort((a, b) => b.average - a.average);    

        return {
            totalRated: ratedNotes.length,
            tagRanking,
            roastRanking,
            originRanking
        };
    }

    function renderPreferenceAnalysis(notes) {
        const analysisContent = document.getElementById("analysis-content");
        const analysis = analyzePreferences(notes);

        if (!analysis) {
            analysisContent.textContent = "評価データがまだありません";
            return;
        }

        const topTags = analysis.tagRanking
            .slice(0, 3)
            .map(tag =>
                `・${tag.tag}（${tag.average.toFixed(1)}）`
            )
            .join("<br>");

        const topRoasts = analysis.roastRanking
            .slice(0, 3)
            .map(item =>
                `・${formatRoast(item.roast)}（${item.average.toFixed(1)} / ${item.total}件）`
            )
            .join("<br>");

        const topOrigins = analysis.originRanking
            .slice(0, 3)
            .map(item =>
                `・${item.origin}（${item.average.toFixed(1)} / ${item.total}件）`
            )
            .join("<br>");

        analysisContent.innerHTML = `
            <div class="analysis-section">
                <div class="analysis-label">登録済み評価データ</div>
                <div class="analysis-item">${analysis.totalRated}件</div>
            </div>

            <div class="analysis-section">
                <div class="analysis-label">高評価に付きやすいタグ</div>
                <div class="analysis-item">
                    ${topTags || "データなし"}
                </div>
            </div>

            <div class="analysis-section">
                <div class="analysis-label">好きな焙煎度</div>
                <div class="analysis-item">
                    ${topRoasts || "データなし"}
                </div>
            </div>

            <div class="analysis-section">
                <div class="analysis-label">好きな産地</div>
                <div class="analysis-item">
                    ${topOrigins || "データなし"}
                </div>
            </div>

        `;
    }

    // =====================
    // UI描画（検索対応版）
    // =====================
    async function renderNotes(keyword = "") {
        const notes = await getAllNotes();                                // 全ノート取得
        renderPreferenceAnalysis(notes);
        const output = document.getElementById("output");                 // 描画先の要素取得

        output.innerHTML = "";                                            // リセット

        // 検索キーワードを小文字化（大文字小文字を区別しない）
        const lowerKeyword = keyword.toLowerCase();

        // フィルタ処理（name + comment 部分一致）
        // let filtered;
        // if (!lowerKeyword) {
        //     // 検索なし → 全件表示
        //     filtered = notes;
        // } else {
        //     // 検索あり → フィルタ
        //     filtered = notes.filter(note => {
        //         const tags = note.tags || [];
                
        //         return (
        //             note.name?.toLowerCase().includes(lowerKeyword) ||
        //             note.comment?.toLowerCase().includes(lowerKeyword) ||
        //             tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
        //         );
        //     });
        // }

        // フィルタ処理
        // 今回は「タグ絞り込み」を優先。
        // 検索欄との併用は後回し。
        let filtered = notes;

        if (activeFilterTag) {
            filtered = filtered.filter(note => {
                const tags = note.tags || [];
                return tags.includes(activeFilterTag);
            });
        } else if (lowerKeyword) {
            filtered = filtered.filter(note => {
                const tags = note.tags || [];

                return (
                    note.name?.toLowerCase().includes(lowerKeyword) ||
                    note.comment?.toLowerCase().includes(lowerKeyword) ||
                    tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
                );
            });
        }

        // 該当なしの場合
        if (filtered.length === 0) {
            output.innerHTML = "<p>該当なし🤖☕️</p>";
            return;
        }

        // 作成日の新しい順に並べ替え
        filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        // =====================
        // ノート描画処理
        // =====================
        filtered.forEach(note => {
            const tags = note.tags || [];
            const tagHtml = tags.length
                ? `<div class="note-tags">${tags.map(tag => `<span class="note-tag">${tag}</span>`).join("")}</div>`
                : "";

            // カードの外枠
            const div = document.createElement("div");
            div.className = "note-card";

            // カード本体のHTML
            div.innerHTML = `
            <div class="top">☕️ ${note.name ?? "（未入力）"}</div>

            <div class="sub">
                ${formatRoast(note.roast)} / ⭐ <strong>${note.rating ?? "-"}</strong>
            </div>

            ${tagHtml}

            <div class="comment">
                ${note.comment ?? "なし"}
            </div>

            ${note.origin ? `<div class="origin">${note.origin}</div>` : ""}
            ${note.shop ? `<div class="shop">🏠 ${note.shop}</div>` : ""}
            `;

            // =====================
            // ボタン類（削除・編集）
            // =====================
            // 削除ボタン
            const delBtn = document.createElement("button");
            delBtn.textContent = "削除";
            delBtn.addEventListener("click", async () => {
                await deleteNote(note.id);
                renderNotes();
            });

            // 編集ボタン
            const editBtn = document.createElement("button");
            editBtn.textContent = "編集";
            editBtn.addEventListener("click", () => editNote(note.id));

            // ボタンをまとめるラッパー
            const btnWrapper = document.createElement("div");
            btnWrapper.className = "btn-group";

            btnWrapper.appendChild(editBtn);
            btnWrapper.appendChild(delBtn);

            div.appendChild(btnWrapper);        // カードにボタンを追加
            output.appendChild(div);            // 最終的に output に追加
        });
    }
    
    // =====================
    // 検索イベント
    // =====================
    const searchInput = document.getElementById("searchInput");

    searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value;
    renderNotes(keyword);
    });

    // データ管理
    document.getElementById("data-btn").addEventListener("click", () => {
        location.href = "data.html";
    });

    renderTagSelector();
    renderTagFilter();

    renderNotes("");
});