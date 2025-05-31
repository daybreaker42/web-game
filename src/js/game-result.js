const GAME_RESULT_FIELDS = [
  {
    label: "모드",
    key: "mode",
    convert: { story: "스토리 모드", score: "스코어 모드" },
  },
  {
    label: "난이도",
    key: "difficulty",
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
    label: "구출한 포켓몬",
    key: "saved_pokemon",
    custom: true, // 아래에서 별도 처리
  },
];

function showGameResultScreen(gameResult) {
  if (gameResult.game_over) playSfx(SFX.GAME_OVER);
  else playBgm(BGM.RESULT);
  renderGameResult(gameResult);
}

function renderGameResult(gameResult) {
  let title;
  if (gameResult.mode === "story" && gameResult.game_over === true)
    title = "GAME OVER";
  else if (gameResult.mode === "story" && gameResult.stage < N_STAGES)
    title = "STAGE CLEAR";
  else title = "GAME RESULT";
  elById("game-result-title").innerHTML = title;

  if (gameResult.game_over == true)
    elById("game-result-root").classList.add("gameover");
  else elById("game-result-root").classList.remove("gameover");

  let contents = "";
  for (const field of GAME_RESULT_FIELDS) {
    if (field.key === "stage" && gameResult.mode === "score") continue;
    let value = gameResult[field.key];
    if (field.convert) value = field.convert[value] || value;
    if (field.formatter) value = field.formatter(value);

    if (field.custom && field.key === "saved_pokemon") {
      const count = Array.isArray(gameResult.saved_pokemon)
        ? gameResult.saved_pokemon.length
        : 0;
      contents += `<div class="game-result-row">
            <span class="game-result-label">${field.label}</span>
            <span class="game-result-value">${count}마리</span>
          </div>`;
    } else {
      contents += `<div class="game-result-row">
            <span class="game-result-label">${field.label}</span>
            <span class="game-result-value">${value}</span>
          </div>`;
    }
  }
  elById("game-result-contents").innerHTML = contents;

  document
    .querySelectorAll(".screen")
    .forEach((e) => e.classList.add("hidden"));
  elById("game-result-screen").classList.remove("hidden");

  const pressMsg = elById("press-any-key-msg");
  if (pressMsg) {
    // 리플로우로 애니메이션 재생
    void pressMsg.offsetWidth;
  }

  function handleAnyPress(e) {
    window.removeEventListener("keydown", handleAnyPress);
    window.removeEventListener("mousedown", handleAnyPress);
    if (pressMsg) pressMsg.classList.add("hidden");
    showUniModal("랭킹에 점수를 저장하시겠습니까?", {
      buttons: [
        {
          label: "네",
          callback: () => showNicknameInputModal(gameResult), // ★ 여기!
          id: "uni-modal-save-yes",
        },
        {
          label: "아니오",
          callback: () => {
            showUniModal("타이틀로 돌아갑니다.", {
                buttons: [
                  {
                    label: "확인",
                    callback: handleReturnToTitleScreen,
                  },
                ],
              });},
          id: "uni-modal-save-no",
        },
      ],
    });
  }

  window.addEventListener("keydown", handleAnyPress, { once: true });
  window.addEventListener("mousedown", handleAnyPress, { once: true });
}
