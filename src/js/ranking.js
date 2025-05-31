const MODES = {
  STORY: "story_mode",
  SCORE: "score_mode",
};
const DIFFICULTY = ["easy", "normal", "hard"];

const SCOREBOARD_COLUMNS = [
  {
    key: "rank_name",
    header: "순위 / 닉네임",
    style: "width:35%",
    render: (row) =>
      `<span style="color:#ffd400;">#${row.rank}</span> &nbsp;${row.name}`,
  },
  {
    key: "score_date",
    header: "점수 / 날짜",
    style: "width:65%",
    render: (row) =>
      `<span style="color:#ff6666;">${row.score}</span> &nbsp;/&nbsp;` +
      `<span style="font-size:0.93em;">${row.date}</span>`,
  },
];

function resetScoreboardFilters() {
  // 값 리셋
  currentMode = MODES.STORY;
  currentDifficulty = "easy";
  // 탭 UI 동기화
  qsa(".ranking-tab").forEach((btn) => {
    const isStory = btn.dataset.mode !== "score";
    btn.classList.toggle("active", isStory);
  });
  qsa(".difficulty-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === "easy");
  });
  // 테이블 리렌더
  renderScoreboard();
}

function makeEmptyScoreboard() {
  const data = {};
  Object.values(MODES).forEach((mode) => {
    data[mode] = {};
    DIFFICULTY.forEach((difficulty) => {
      data[mode][difficulty] = [];
    });
  });
  return data;
}
function getScoreboardData() {
  const saved = localStorage.getItem("scoreboard");
  if (saved) return JSON.parse(saved);
  else return makeEmptyScoreboard();
}
function setScoreboardData(data) {
  localStorage.setItem("scoreboard", JSON.stringify(data));
}

let currentMode = MODES.STORY; // "story_mode" | "score_mode"
let currentDifficulty = "easy"; // "easy" | "normal" | "hard"

qsa(".ranking-tab").forEach((btn) => {
  btn.onclick = () => {
    qsa(".ranking-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode === "score" ? MODES.SCORE : MODES.STORY;
    renderScoreboard();
  };
});
qsa(".difficulty-tab").forEach((btn) => {
  btn.onclick = () => {
    qsa(".difficulty-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentDifficulty = btn.dataset.difficulty;
    renderScoreboard();
  };
});

function renderScoreboard() {
  const data = getScoreboardData();
  const board = qs(".scoreboard");
  const rows =
    data[currentMode] && data[currentMode][currentDifficulty]
      ? data[currentMode][currentDifficulty]
      : [];
  // 최대 5개만 표시
  const visibleRows = rows.slice(0, 5);

  // THEAD 생성
  const theadHtml =
    "<tr>" +
    SCOREBOARD_COLUMNS.map(
      (col) => `<th style="${col.style || ""}">${col.header}</th>`,
    ).join("") +
    "</tr>";

  // TBODY 생성
  const tbodyHtml = visibleRows.length
    ? visibleRows
        .map(
          (row) =>
            "<tr>" +
            SCOREBOARD_COLUMNS.map((col) => `<td>${col.render(row)}</td>`).join(
              "",
            ) +
            "</tr>",
        )
        .join("")
    : `<tr><td colspan="${SCOREBOARD_COLUMNS.length}" style="color:#888;padding:36px 0;font-size:1.2em;">등록된 기록이 없습니다.</td></tr>`;

  board.innerHTML = `
      <table class="scoreboard-table">
        <thead>${theadHtml}</thead>
        <tbody>${tbodyHtml}</tbody>
      </table>
    `;
}

function addScoreRecord(mode, difficulty, name, score) {
  if (mode === "score") mode = MODES.SCORE;
  if (mode === "story") mode = MODES.STORY;
  if (!DIFFICULTY.includes(difficulty)) difficulty = "easy"; // 혹시라도

  try {
    let data = getScoreboardData();
    let arr = data[mode][difficulty];
    arr.push({
      rank: 0,
      name,
      score,
      date: new Date().toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      ts: Date.now(), // ← timestamp
    });
    arr.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.ts - a.ts; // 최신이 앞으로
    });
    data[mode][difficulty] = arr.slice(0, 5);
    data[mode][difficulty].forEach((r, i) => (r.rank = i + 1));
    setScoreboardData(data);
    return true; // 성공
  } catch (e) {
    console.error("addScoreRecord 실패:", e);
    return false; // 실패
  }
}
