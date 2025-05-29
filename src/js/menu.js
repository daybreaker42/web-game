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
    // story_chapter0_opening
    startStage(1); // Stage 1 게임부터
  });
}

function startStage(stageNumber) {
  currentStageIndex = stageNumber;

  if (stageNumber > N_STAGES) {
    // 모든 스테이지 완료
    onAllStagesCleared();
    return;
  }

  // Stage 4는 보스전 전 스토리가 먼저
  if (stageNumber === 4) {
    playStory(4, () => {
      // story_chapter4_finale
      playGame("story", selectedDifficulty, stageNumber, (gameResult) => {
        onGameEnd(gameResult);
      });
    });
  } else {
    // Stage 1~3은 게임 먼저
    playGame("story", selectedDifficulty, stageNumber, (gameResult) => {
      onGameEnd(gameResult);
    });
  }
}

function startGameScoreMode(difficulty) {
  selectedDifficulty = difficulty;
  stopCloudAnimation();
  playGame("score", selectedDifficulty, null, (gameResult) => {
    saveGameResult(gameResult);
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
