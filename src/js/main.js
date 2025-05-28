function setupCredits() {
  qs("#btn-credits").onclick = () => showDemoCredits();
}

window.addEventListener("DOMContentLoaded", () => {
  //   console.log("Adding event listeners");
  document.addEventListener("keydown", startFromTitle, { once: true });
  document.addEventListener("click", startFromTitle, { once: true });

  setupCredits();

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

function startFromTitle(e) {
  if (started) return;
  started = true;
  playSfx(SFX.START);

  const pressAny = qs(".press-any");
  setTimeout(() => {
    pressAny.classList.remove("flash-twice", "noblink");
    void pressAny.offsetWidth;
    pressAny.classList.add("flash-twice");
  }, 100);

  setTimeout(() => {
    hide(qs("#title-screen"));
    showWithFade(qs("#main-menu-screen"));
    playBgm(BGM.TITLE);
    startCloudAnimation();
  }, 1100);
}
