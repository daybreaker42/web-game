function testMainLogic() {
  showWithFade(qs("#title-screen"));
  setupMenuEvents();
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
  playGame("story", 0, 0, (gameResult) => {
    console.log("Game ended:", gameResult);
    handleReturnToTitleScreen();
  });
}
