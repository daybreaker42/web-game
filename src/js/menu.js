function chooseMode(mode) {
  selectedMode = mode;
  hide(qs("#play-mode-menu"));
  show(qs("#difficulty-menu"));
}

function startGameStoryMode(difficulty) {
  stopCloudAnimation();
  stopBgm();
  hide(qs("#difficulty-menu"));
  selecteddifficulty = difficulty;
  stageListIdx = 0;
  proceedToStage(stageListIdx);
}

function startGameScoreMode(difficulty) {
  stopCloudAnimation();
  alert("미구현");
}

function setupMenuEvents() {
  qs("#btn-story").onclick = () => chooseMode("story-mode");
  qs("#btn-score").onclick = () => chooseMode("score-mode");

  qs("#btn-play").onclick = () => {
    hide(qs("#main-menu"));
    show(qs("#play-mode-menu"));
  };

  qs("#btn-back-to-main-menu").onclick = () => {
    hide(qs("#play-mode-menu"));
    showMainMenu();
  };

  qs("#btn-ranking").onclick = () => {
    stopCloudAnimation();
    playBgm(BGM.RANKING);
    qs("#ranking-screen").classList.remove("fade-out");
    qs("#ranking-screen").classList.add("fade-in");
    hide(qs("#main-menu"));
    show(qs("#ranking-screen"));
    renderScoreboard();
  };

  qs("#btn-back-to-main").onclick = () => {
    playBgm(BGM.TITLE);
    qs("#ranking-screen").classList.remove("fade-in");
    qs("#ranking-screen").classList.add("fade-out");
    hide(qs("#ranking-screen"));
    show(qs("#main-menu"));
    startCloudAnimation();
  };

  qs("#btn-back-to-play-mode-menu").onclick = () => {
    hide(qs("#difficulty-menu"));
    show(qs("#play-mode-menu"));
  };

  qsa(".btn-difficulty").forEach((btn) => {
    btn.onclick = () => {
      const difficulty = btn.dataset.difficulty;
      if (selectedMode === "story-mode") startGameStoryMode(difficulty);
      else startGameScoreMode(difficulty);
    };
  });
}
