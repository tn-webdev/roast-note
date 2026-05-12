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
        "ココア",
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

    async function editNote(id) {
        const data = await getNoteById(id);

        document.getElementById("name").value = data.name;
        document.getElementById("comment").value = data.comment;
        document.getElementById("roast").value = data.roast;
        document.getElementById("origin").value = data.origin;

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
        tags: selectedTags,
        createdAt: new Date().toISOString()
        };

        if (!data.name) {
            alert("コーヒー名は必須だよ🤖☕️");
            return;
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

        // 最後に1回だけ再描画
        renderNotes();
    });

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
    // UI描画（検索対応版）
    // =====================
    async function renderNotes(keyword = "") {
        const notes = await getAllNotes();                                // 全ノート取得
        const output = document.getElementById("output");                 // 描画先の要素取得

        output.innerHTML = "";                                            // リセット

        // 検索キーワードを小文字化（大文字小文字を区別しない）
        const lowerKeyword = keyword.toLowerCase();

        // フィルタ処理（name + comment 部分一致）
        let filtered;
        if (!lowerKeyword) {
            // 検索なし → 全件表示
            filtered = notes;
        } else {
            // 検索あり → フィルタ
            filtered = notes.filter(note => {
            const tags = note.tags || [];
            const tagHtml = tags.length
                ? `<div class="note-tags">${tags.map(tag => `<span class="note-tag">${tag}</span>`).join("")}</div>`
                : "";
                
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

    renderNotes("");
});