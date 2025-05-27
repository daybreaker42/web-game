localStorage.setItem("scoreboard", JSON.stringify(DEMO_RANKING_DATA));

// 초기 상태
let currentMode = "story_mode"; // story_mode | score_mode
let currentLevel = "easy"; // easy | normal | hard

function getScoreboardData() {
  const saved = localStorage.getItem("scoreboard");
  if (saved) return JSON.parse(saved);
  else
    return {
      story: { easy: [], normal: [], hard: [] },
      score: { easy: [], normal: [], hard: [] },
    };
}

function setScoreboardData(data) {
  localStorage.setItem("scoreboard", JSON.stringify(data));
}

qsa(".ranking-tab").forEach((btn) => {
  btn.onclick = () => {
    qsa(".ranking-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode === "score" ? "score_mode" : "story_mode";
    renderScoreboard();
  };
});

// 난이도 탭
qsa(".difficulty-tab").forEach((btn) => {
  btn.onclick = () => {
    qsa(".difficulty-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentLevel = btn.dataset.level;
    renderScoreboard();
  };
});

function renderScoreboard() {
  const data = getScoreboardData();
  const board = qs(".scoreboard");
  const rows = data[currentMode]?.[currentLevel] || [];

  // 최대 5개만 표시
  if (rows.length > 5) rows.length = 5;

  // 테이블 만들기 (2칸: 순위+닉/점수+날짜)
  let html = `
      <table class="scoreboard-table">
        <thead>
          <tr>
            <th style="width:35%">순위 / 닉네임</th>
            <th style="width:65%">점수 / 날짜</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (r) => `
                  <tr>
                    <td>
                      <span style="color:#ffd400;">#${r.rank}</span>
                      &nbsp;${r.name}
                    </td>
                    <td>
                      <span style="color:#ff6666;">${r.score}</span>
                      &nbsp;/&nbsp;<span style="font-size:0.93em;">${r.date}</span>
                    </td>
                  </tr>
                `,
                  )
                  .join("")
              : `<tr><td colspan="2" style="color:#888;padding:36px 0;font-size:1.2em;">등록된 기록이 없습니다.</td></tr>`
          }
        </tbody>
      </table>
    `;
  board.innerHTML = html;
}

function addScore(mode, level, name, score) {
  let data = getScoreboardData();
  let arr = data[mode][level];

  // 새 기록 추가
  arr.push({
    rank: 0, // 임시, 아래에서 결정
    name,
    score,
    date: new Date().toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  // 점수로 내림차순, rank 부여 (상위 5명만 유지)
  arr.sort((a, b) => b.score - a.score);
  arr.forEach((r, i) => (r.rank = i + 1));
  setScoreboardData(data);
}
