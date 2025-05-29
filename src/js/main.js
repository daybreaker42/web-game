// window.DEBUG_MODE = true;
// window.DEBUG_GAME = true;

window.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("scoreboard")) {
    setScoreboardData(makeEmptyScoreboard());
  }
  document.addEventListener("keydown", handleStartFromTitle, { once: true });
  document.addEventListener("click", handleStartFromTitle, { once: true });

  if (typeof window.DEBUG_MODE !== "undefined" && window.DEBUG_MODE) {
    debugMode();
    return;
  }
  console.log("RELEASE_MODE");
  hideAllFade(qsa(".screen"));
  showWithFade(qs("#title-screen"));
  setupMenuEvents();
  setupOptionModal();
  setupAudioSliders();
  setupButtonSfx();

  // DEMO
  setScoreboardData(DEMO_RANKING_DATA);
});

function debugMode() {
  console.log("DEBUG_MODE is ON");
  hideAllFade(qsa(".screen"));

  // NOTE: Write your debug code here (e.g. Screen)
  showWithFade(qs("#title-screen"));

  // Set up debug events
  if (window.DEBUG_GAME) {
    console.log("DEBUG_GAME is ON");
    hideAllFade(qsa(".screen"));
    document.removeEventListener("keydown", handleStartFromTitle);
    document.removeEventListener("click", handleStartFromTitle);
    show(qs("#gameplay-screen"));
    playGame("story", 0, 0, (gameResult) => {
      console.log("Game ended:", gameResult);
      handleReturnToTitleScreen();
    });
  }
  return;
}

let isStarted = false;

function handleReturnToTitleScreen() {
  console.log("Returning to title screen");
  isStarted = false;
  stopBgm();
  hideAllFade(qsa(".screen"));
  showWithFade(qs("#title-screen"));

  setTimeout(() => {
    const pressAny = qs(".press-any");
    if (pressAny) {
      pressAny.classList.remove("flash-twice", "noblink", "blink");
      void pressAny.offsetWidth;
    }
    document.addEventListener("keydown", handleStartFromTitle, { once: true });
    document.addEventListener("click", handleStartFromTitle, { once: true });
  }, 1000);
}

function handleStartFromTitle(e) {
  if (isStarted) return;
  isStarted = true;

  playSfx(SFX.START);

  const pressAny = qs(".press-any");
  setTimeout(() => {
    // 깜빡임 효과 리트리거
    if (pressAny) {
      pressAny.classList.remove("flash-twice", "noblink", "blink");
      void pressAny.offsetWidth; // 강제 리플로우
      pressAny.classList.add("flash-twice");
    }
  }, 100);

  setTimeout(() => {
    showMainMenuScreen();
  }, 1100);
}

function showMainMenuScreen() {
  hideAllFade(qsa(".screen"));
  showWithFade(qs("#main-menu-screen"));
  playBgm(BGM.TITLE);
  startCloudAnimation();
}
