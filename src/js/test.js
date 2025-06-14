function testMainLogic() {
  document.addEventListener("keydown", handleStartFromTitle, { once: true });
  document.addEventListener("click", handleStartFromTitle, { once: true });
  showWithFade(qs("#title-screen"));
  setupStaticButtonEvents();
  setupOptionModal();
  setupAudioSliders();
  setupButtonSfx();
}

function testGameResultScreen() {
  showGameResultScreen(TEST_GAME_RESULT_1);
}

function testGame() {
  console.log("DEBUG_GAME is ON");
  hideAllFade(qsa(".screen"));
  show(qs("#gameplay-screen"));
  show(qs(".controls"));
  show(qs(".mode-selection"));

  playGame("story", "easy", 1, (gameResult) => {
    console.log("Game ended:", gameResult);
    handleReturnToTitleScreen();
  });
}

function testCredits() {
  console.log("DEBUG_CREDITS is ON");
  showCredits(TEST_CREDITS_DATA, () => {
    console.log("Credits ended");
    handleReturnToTitleScreen();
  });
}
