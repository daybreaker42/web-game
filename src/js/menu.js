// ==================== Start Game Functions ====================

let selectedDifficulty = null;

function startGameStoryMode(difficulty) {
  stopCloudAnimation();
  stopBgm();
  hide(qs("#difficulty-menu-screen"));
  selectedDifficulty = difficulty;
  proceedToStage(0);
}

function startGameScoreMode(difficulty) {
  selectedDifficulty = difficulty;
  stopCloudAnimation();
  playGame("score", selectedDifficulty, null, (gameResult) => {
    saveGameResult(gameResult);
    console.log("게임 종료:", gameResult);
  }
  );
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

  qs("#btn-credits").onclick = () => {
    stopCloudAnimation();
    playBgm(BGM.CREDITS);
    hideAllFade(qsa(".screen"));
    showWithFade(qs("#credits-screen"));
    showCredits();
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
    renderScoreboard();
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
