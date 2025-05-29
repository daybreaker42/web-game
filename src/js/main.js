const DEBUG_MODE = true;
const DEBUG_GAME = true;

window.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", startFromTitle, { once: true });
  document.addEventListener("click", startFromTitle, { once: true });

  if (DEBUG_MODE) {
    hideAllFade(qsa(".screen"));    
    if (DEBUG_GAME) {
        show(qs("#gameplay-screen"));
        playGame("story", 0, 0, (gameResult) => {
          console.log("Game ended:", gameResult);
          returnToTitleScreen();
        });
    }
    return;
  }
  else {
    hideAllFade(qsa(".screen"));
    showWithFade(qs("#title-screen"));
  }

  setupMenuEvents();
  setupOptionModal();
  setupAudioSliders();
  setupButtonSfx();
  if (!localStorage.getItem("scoreboard")) {
    setScoreboardData(makeEmptyScoreboard());
  }
  // DEMO
  setScoreboardData(DEMO_RANKING_DATA);
});

let started = false;

function returnToTitleScreen() {
  console.log("Returning to title screen");
  started = false;
  stopBgm();
  hideAllFade(qsa(".screen"));
  showWithFade(qs("#title-screen"));

  setTimeout(() => {
    const pressAny = qs(".press-any");
    if (pressAny) {
      pressAny.classList.remove("flash-twice", "noblink", "blink");
      void pressAny.offsetWidth;
    }
    document.addEventListener("keydown", startFromTitle, { once: true });
    document.addEventListener("click", startFromTitle, { once: true });
  }, 1000);
}

function startFromTitle(e) {
  if (started) return;
  started = true;

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
