const MENU_TPL = {
  main: "#tmpl-main",
  mode: "#tmpl-mode",
  diff: "#tmpl-difficulty",
};

const $menuScreen = qs("#menu-screen");
const $menuButtons = qs("#menu-buttons");
let menuState = "main"; // 현재 단계

function renderMenu(state) {
  menuState = state;
  const tpl = qs(MENU_TPL[state]);
  $menuButtons.innerHTML = "";
  $menuButtons.appendChild(tpl.content.cloneNode(true));
}

$menuButtons.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  playSfx(SFX.BUTTON);
  const { action, difficulty } = btn.dataset;

  switch (action) {
    /* 메인 → 모드 선택 */
    case "play":
      renderMenu("mode");
      break;

    /* 랭킹 화면 */
    case "ranking":
      stopCloudAnimation();
      playBgm(BGM.RANKING);
      hide($menuScreen);
      showWithFade(qs("#ranking-screen"));
      resetScoreboardFilters();
      break;

    /* 옵션 */
    case "options":
      showOptionsModal();
      break;

    /* 모드 선택 → 난이도 선택 */
    case "story":
      selectedMode = "story-mode";
      renderMenu("diff");
      break;
    case "score":
      selectedMode = "score-mode";
      renderMenu("diff");
      break;

    /* 공통 뒤로가기 */
    case "back":
      if (menuState === "diff") renderMenu("mode");
      else if (menuState === "mode") renderMenu("main");
      break;
  }

  /* 난이도 버튼 */
  if (difficulty) {
    if (selectedMode === "story-mode") startGameStoryMode(difficulty);
    else startGameScoreMode(difficulty);
  }
});

// ==================== Start Game Functions ====================

let selectedDifficulty = null;

function startGameStoryMode(difficulty) {
  stopCloudAnimation();
  stopBgm();
  hide(qs("#menu-screen"));
  selectedDifficulty = difficulty;

  // START 스토리부터 시작
  currentStageIndex = 0;
  playStory(0, () => {
    proceedToStage(1); // Stage 1 게임부터
  });
}

function startGameScoreMode(difficulty) {
  selectedDifficulty = difficulty;
  stopCloudAnimation();
  hide(qs("#menu-screen"));
  // FIXME 스코어 모드에서 stage null로 보내면 이후 음악이나 배경 선택 불가! 여기서 stage random으로 일단 보내줌. 이후 로직 수정 필요 - 성준, 6/5
  const stageNum = Math.floor(Math.random() * 3) + 1;
  playGame("score", selectedDifficulty, stageNum, (gameResult) => {
    showWithFade(qs("#game-result-screen"));
    renderGameResult(gameResult);
  });
}

// ==================== Setup Menu Events ====================

function setupStaticButtonEvents() {
  qs("#btn-ranking-to-main").onclick = () => {
    playBgm(BGM.TITLE);
    hideWithFade(qs("#ranking-screen"));
    showMainMenuScreen();
  };

  qs("#modal-close").onclick = () => {
    qs("#options-modal").close();
  };
}
