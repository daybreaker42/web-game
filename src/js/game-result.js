const GAME_RESULT_FIELDS = [
  {
    label: "모드",
    key: "mode",
    convert: { story: "스토리 모드", score: "스코어 모드" },
  },
  {
    label: "난이도",
    key: "level",
    convert: { easy: "쉬움", normal: "보통", hard: "어려움" },
  },
  {
    label: "스테이지",
    key: "stage",
    formatter: (v) => (v !== null && v !== undefined ? v : "-"),
  },
  {
    label: "점수",
    key: "score",
  },
  {
    label: "플레이 날짜",
    key: "date",
    formatter: (v) =>
      v
        ? new Date(v).toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
  },
  {
    label: "구출한 포켓몬",
    key: "saved_pokemon",
    custom: true, // 아래에서 별도 처리
  },
];

function renderGameResult(gameResult) {
  let html = "";
  for (const field of GAME_RESULT_FIELDS) {
    let value = gameResult[field.key];
    // 변환 테이블 처리
    if (field.convert) value = field.convert[value] || value;
    // 날짜, 스테이지 등 별도 포맷 처리
    if (field.formatter) value = field.formatter(value);

    // 구출 포켓몬만 별도 처리
    if (field.custom && field.key === "saved_pokemon") {
      html += `<div class="game-result-row">
          <span class="game-result-label">${field.label}</span>
          <span>
            <div class="game-result-pokemon-list">
              ${
                value && value.length > 0
                  ? value
                      .map(
                        (id) =>
                          `<img class="game-result-pokemon-img" src="../assets/images/game/pokemon/${id}.png" alt="포켓몬 ${id}" />`,
                      )
                      .join("")
                  : '<span style="color:#ccc;">없음</span>'
              }
            </div>
          </span>
        </div>`;
    } else {
      html += `<div class="game-result-row">
          <span class="game-result-label">${field.label}</span>
          <span>${value}</span>
        </div>`;
    }
  }

  elById("game-result-contents").innerHTML = html;

  document
    .querySelectorAll(".screen")
    .forEach((e) => e.classList.add("hidden"));
  elById("game-result-screen").classList.remove("hidden");

  elById("btn-game-result-ok").onclick = function () {
    returnToTitleScreen();
  };
}
