function chooseMode(mode) {
  selectedMode = mode;
  hide(qs("#play-mode-menu"));
  show(qs("#level-menu"));
}

function startGameStoryMode(level) {
  stopCloudAnimation();
  stopBgm();
  hide(qs("#level-menu"));
  selectedLevel = level;
  stageListIdx = 0;
  proceedToStage(stageListIdx);
}

function startGameScoreMode(level) {
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
    hide(qs("#level-menu"));
    show(qs("#play-mode-menu"));
  };

  qsa(".btn-level").forEach((btn) => {
    btn.onclick = () => {
      const level = btn.dataset.level;
      if (selectedMode === "story-mode") startGameStoryMode(level);
      else startGameScoreMode(level);
    };
  });
}
