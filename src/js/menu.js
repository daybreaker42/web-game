// ==================== Start Game Functions ====================

let selectedDifficulty = null;

function startGameStoryMode(difficulty) {
  stopCloudAnimation();
  stopBgm();
  hide(qs("#difficulty-menu-screen"));
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
  playGame("score", selectedDifficulty, null, (gameResult) => {
    hide(qs("#difficulty-menu-screen"));
    showWithFade(qs("#game-result-screen"));
    renderGameResult(gameResult);
  });
}

// ==================== Setup Menu Events ====================

function chooseMode(mode) {
  selectedMode = mode;
  hide(qs("#select-mode-menu-screen"));
  show(qs("#difficulty-menu-screen"));
}

function showMainMenu() {
  showWithFade(qs("#main-menu-screen"));
}

function setupMenuEvents() {
  qs("#btn-story").onclick = () => chooseMode("story-mode");
  qs("#btn-score").onclick = () => chooseMode("score-mode");

  qs("#btn-play").onclick = () => {
    hide(qs("#main-menu-screen"));
    show(qs("#select-mode-menu-screen"));
  };

  qs("#btn-select-to-main").onclick = () => {
    hide(qs("#select-mode-menu-screen"));
    show(qs("#main-menu-screen"));
  };

  qs("#btn-ranking").onclick = () => {
    stopCloudAnimation();
    playBgm(BGM.RANKING);
    hide(qs("#main-menu-screen"));
    showWithFade(qs("#ranking-screen"));
    resetScoreboardFilters();
  };

  qs("#btn-ranking-to-main").onclick = () => {
    playBgm(BGM.TITLE);
    hideWithFade(qs("#ranking-screen"));
    showWithFade(qs("#main-menu-screen"));
    startCloudAnimation();
  };

  qs("#btn-back-to-select-mode-menu-screen").onclick = () => {
    hide(qs("#difficulty-menu-screen"));
    show(qs("#select-mode-menu-screen"));
  };

  qsa(".btn-difficulty").forEach((btn) => {
    btn.onclick = () => {
      const difficulty = btn.dataset.difficulty;
      if (selectedMode === "story-mode") startGameStoryMode(difficulty);
      else startGameScoreMode(difficulty);
    };
  });
}
