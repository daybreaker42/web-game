// window.DEBUG_MODE = true;

let isStarted = false;
let isCleared = false;

window.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("scoreboard")) {
    setScoreboardData(makeEmptyScoreboard());
  }

  if (typeof window.DEBUG_MODE !== "undefined" && window.DEBUG_MODE) {
    debugMode();
    return;
  }

  console.log("RELEASE_MODE");

  document.addEventListener("keydown", handleStartFromTitle, { once: true });
  document.addEventListener("click", handleStartFromTitle, { once: true });

  hideAllFade(qsa(".screen"));
  showWithFade(qs("#title-screen"));
  setupStaticButtonEvents();
  setupOptionModal();
  setupAudioSliders();
  setupButtonSfx();
});

function debugMode() {
  console.log("DEBUG_MODE is ON");
  hideAllFade(qsa(".screen"));

  // NOTE: Write your test code here (e.g. Screen)
  testGame();
}

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
  }, PRESS_ANY_RESET_DELAY);
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
  }, ANIMATION_DELAY);

  setTimeout(() => {
    showMainMenuScreen();
  }, TITLE_SCREEN_DELAY);
}

function showMainMenuScreen() {
  hideAllFade(qsa(".screen"));
  renderMenu("main");
  showWithFade(qs("#menu-screen"));
  if (isCleared) {
    qs("#menu-screen").classList.add("cleared");
    playBgm(BGM.ENDING);
  } else {
    playBgm(BGM.TITLE);
    startCloudAnimation();
  }
}
