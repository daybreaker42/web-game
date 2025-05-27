document.addEventListener("keydown", startFromTitle, { once: true });
document.addEventListener("click", startFromTitle, { once: true });

let started = false;

function startFromTitle(e) {
  if (started) return;
  started = true;
  setTimeout(() => {
    playSfx(SFX.START);
  }, 0);

  const pressAny = qs(".press-any");
  pressAny.classList.remove("flash-twice", "noblink");
  void pressAny.offsetWidth;
  pressAny.classList.add("flash-twice");

  setTimeout(() => {
    hide(qs("#title"));
    showMainMenu();
    playBgm(BGM.TITLE);
    startCloudAnimation();
  }, 1100);
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");
  setupMenuEvents();
  setupOptionModal();
  setupAudioSliders();
  setupButtonSfx();
});
