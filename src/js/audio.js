let sfxVolume = 0.5,
  bgmVolume = 0.5;
const bgm = qs("#bgm");
const clickSfx = qs("#click-sfx");
const startSfx = qs("#start-sfx");

function getBgmPath(name) {
  return `../assets/sounds/bgm/${name}`;
}
function getSfxPath(name) {
  return `../assets/sounds/sfx/${name}`;
}

function stopBgm() {
  bgm.pause();
  bgm.src = "";
  bgm.load();
  bgm.currentTime = 0;
}

function playBgm(name) {
  bgm.pause();
  bgm.src = getBgmPath(name);
  bgm.load();
  bgm.currentTime = 0;
  bgm.oncanplaythrough = function handler() {
    bgm.play();
    bgm.oncanplaythrough = null;
  };
  bgm.volume = bgmVolume;
}

function playSfx(path, volume = sfxVolume) {
  path = getSfxPath(path);
  const audio = new Audio(path);
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function updateSfxVolume(vol) {
  if (clickSfx) clickSfx.volume = vol;
  if (startSfx) startSfx.volume = vol;
}

function setupAudioSliders() {
  // SFX 볼륨 슬라이더
  qs("#sfx-volume")?.addEventListener("input", (e) => {
    sfxVolume = +e.target.value;
    updateSfxVolume(sfxVolume);
  });
  updateSfxVolume(sfxVolume); // 초기값

  // BGM 볼륨 슬라이더
  qs("#bgm-volume")?.addEventListener("input", (e) => {
    bgmVolume = +e.target.value;
    bgm.volume = bgmVolume;
  });
  if (bgm) bgm.volume = bgmVolume;
}

// 모든 버튼 효과음 자동화
function setupButtonSfx() {
  document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => playSfx(SFX.BUTTON));
  });
}
