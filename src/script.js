// ================================================================
//                         [헬퍼 함수 / 쿼리]
// ================================================================
const qs  = (sel) => document.querySelector(sel);
const qsa = (sel) => [...document.querySelectorAll(sel)];
const hide = (el) => el.classList.add("hidden");
const show = (el) => el.classList.remove("hidden");


// ================================================================
//                    [타이틀 → 메인 메뉴 진입]
// ================================================================
document.addEventListener("keydown", startFromTitle, { once: true });
document.addEventListener("click", startFromTitle, { once: true });

window.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".logo");
  const pressAny = document.querySelector(".press-any");

  // 2초 후 로고 보이기
  setTimeout(() => {
    logo.classList.add("show");
  }, 2000);

  // 3초 후 press any button 보이기
  setTimeout(() => {
    pressAny.classList.add("show");
  }, 3000);
});

function startFromTitle(e) {
  try {
    qs("#start-sfx").currentTime = 0;
    qs("#start-sfx").play();
  } catch (err) {}

  // 빠른 플래시 2회
  const pressAny = qs(".press-any");
  pressAny.classList.remove("flash-twice", "noblink");
  void pressAny.offsetWidth;
  pressAny.classList.add("flash-twice");

  setTimeout(() => {
    const title = document.getElementById("title");
    title.classList.add("fadeout");
  }, 300);

  setTimeout(() => {
    hide(qs("#title"));
    showMainMenuWithFade();
    try {
      qs("#bgm").play();
    } catch (e) {}
  }, 1100);
}

function showMainMenuWithFade() {
  const mainMenu = qs("#main-menu");
  mainMenu.classList.add("slow-fade");
  show(mainMenu);
}


// ================================================================
//                  [메인 메뉴 <-> 모드 메뉴]
// ================================================================
qs("#btn-play").onclick = () => {
  hide(qs("#main-menu"));
  show(qs("#mode-menu"));
};
// 뒤로가기(모드) → 메인 메뉴
qs("#btn-back-to-main-menu").onclick = () => {
  hide(qs("#mode-menu"));
  const mainMenu = qs("#main-menu");
  mainMenu.classList.remove("slow-fade");
  show(mainMenu);
};


// ================================================================
//                   [모드 메뉴 <-> 난이도 메뉴]
// ================================================================
let selectedMode = null;
qs("#btn-story").onclick = () => chooseMode("story");
qs("#btn-score").onclick = () => chooseMode("score");

function chooseMode(mode) {
  selectedMode = mode;
  hide(qs("#mode-menu"));
  show(qs("#level-menu"));
}

// 뒤로가기(난이도) → 모드 메뉴
qs("#btn-back-to-mode-menu").onclick = () => {
  hide(qs("#level-menu"));
  show(qs("#mode-menu"));
};


// ================================================================
//                          [옵션 모달]
// ================================================================
function openOptions() {
  qs("#options-modal").showModal();
}
document
  .querySelectorAll(".btn-options")
  .forEach((btn) => (btn.onclick = openOptions));
qs("#modal-close").onclick = () => qs("#options-modal").close();


// ================================================================
//                      [SFX / BGM 볼륨 설정]
// ================================================================
let sfxVolume = 0.5, bgmVolume = 0.5;
const bgm = qs("#bgm");
const clickSfx = qs("#click-sfx");
const startSfx = qs("#start-sfx");

function updateSfxVolume(vol) {
  if (clickSfx) clickSfx.volume = vol;
  if (startSfx) startSfx.volume = vol;
}

// SFX 볼륨 슬라이더
qs("#sfx-volume").addEventListener("input", (e) => {
  sfxVolume = +e.target.value;
  updateSfxVolume(sfxVolume);
});
updateSfxVolume(sfxVolume); // 초기값

// BGM 볼륨 슬라이더
qs("#bgm-volume").addEventListener("input", (e) => {
  bgmVolume = +e.target.value;
  bgm.volume = bgmVolume;
});
bgm.volume = bgmVolume;


// ================================================================
//                   [BGM: 스토리/기본 전환]
// ================================================================
const storyBgmPath = "../assets/sounds/story.mp3";
let prevBgmSrc = bgm.src;

function playStoryBgm() {
  prevBgmSrc = bgm.src;
  bgm.pause();
  bgm.src = storyBgmPath;
  bgm.load();
  bgm.currentTime = 0;
  bgm.oncanplaythrough = function handler() {
    bgm.play();
    bgm.oncanplaythrough = null;
  };
}

function restoreBgm() {
  bgm.pause();
  bgm.src = prevBgmSrc;
  bgm.load();
  bgm.currentTime = 0;
  bgm.oncanplaythrough = function handler() {
    bgm.play();
    bgm.oncanplaythrough = null;
  };
}

// ================================================================
//                       [게임 시작]
// ================================================================
function startGame(mode, level) {
  restoreBgm();
  alert(`Game starts!\nMode: ${mode}\nLevel: ${level ?? "default"}`);
  // TODO: 게임 화면 연결
}


// ================================================================
//                      [스코어 어택 모드]
// ================================================================
function startScoreMode(level) {
  hide(qs("#level-menu"));
  startGame("score", level);
}


// ================================================================
//                       [버튼 SFX 효과]
// ================================================================
document.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sfx = document.getElementById("click-sfx");
    if (sfx) {
      sfx.currentTime = 0;
      sfx.volume = sfxVolume; // ← 볼륨 항상 최신값 반영
      sfx.play();
    }
  });
});
