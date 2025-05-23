// ================================================================
//                         [헬퍼 함수 / 쿼리]
// ================================================================
const qs = (sel) => document.querySelector(sel);
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

  setTimeout(() => {
    logo.classList.add("show");
  }, 2000);

  setTimeout(() => {
    pressAny.classList.add("show");
  }, 3000);
});

function startFromTitle(e) {
    setTimeout(() => {
        playSfx(SFX.START);
    }, 80);

  const pressAny = qs(".press-any");
  pressAny.classList.remove("flash-twice", "noblink");
  void pressAny.offsetWidth;
  pressAny.classList.add("flash-twice");

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
  mainMenu.classList.add("fade-in");
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
  mainMenu.classList.remove("fade-in");
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
//              [난이도 메뉴 -> 스토리 모드 / 스코어 모드]
// ================================================================

qsa(".btn-level").forEach((btn) => {
  btn.onclick = () => {
    const level = btn.dataset.level;
    if (selectedMode === "story") startStoryGameMode(level);
    else startScoreMode(level);
  };
});

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
let sfxVolume = 0.5,
  bgmVolume = 0.5;
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
//                            [게임 시작]
// ================================================================
function startGame(mode, level) {
  restoreBgm();
  alert(`Game starts!\nMode: ${mode}\nLevel: ${level ?? "default"}`);
  // TODO: 게임 화면 연결
}

// ================================================================
//                           [스토리 모드]
// ================================================================

window.story_stages = [
  window.story_intro,
  window.story_stage1_clear,
  window.story_stage2_clear,
  window.story_stage3_begin,
  window.story_stage3_clear,
];

let selectedStoryLevel = null;
let stageIdx = 0;
let storyScript = [];
let currentStoryIndex = 0;
let currentLineIndex = 0;

function startStoryGameMode(level) {
  selectedStoryLevel = level;
  stageIdx = 0;
  proceedToStage(stageIdx);
}

function proceedToStage(idx) {
  // 1. 스토리부터 보여주기
  storyScript = window.story_stages[idx] || [];
  currentStoryIndex = 0;
  currentLineIndex = 0;
  playStoryBgm();
  showStoryScreen();
  showStoryLine();
}

let prevIllustrationPath = null;

function showStoryLine() {
    if (currentStoryIndex >= storyScript.length) {
      hide(qs("#story-screen"));
      startGameForStage(stageIdx, selectedStoryLevel);
      return;
    }
    const chapter = storyScript[currentStoryIndex];
    const lines = chapter.lines;
  
    if (currentLineIndex >= lines.length) {
      currentStoryIndex++;
      currentLineIndex = 0;
      showStoryLine();
      return;
    }
  
    playStorySfx();
  
    const illustration = qs("#story-illustration");
    const newPath = `url('../assets/images/story/${chapter.image}.png')`;
  
    // 달라질 때만 효과
    if (prevIllustrationPath !== newPath) {
      illustration.classList.remove("fade-in");
      void illustration.offsetWidth; // 트리거
      illustration.classList.add("fade-in");
      prevIllustrationPath = newPath;
    }
    illustration.style.backgroundImage = newPath;
  
    qs("#story-line").textContent = lines[currentLineIndex];
  }
  

function showStoryScreen() {
  hide(qs("#level-menu"));
  show(qs("#story-screen"));
}

qs("#story-screen").onclick = function (e) {
  if (e.target.id === "btn-skip")
    return;
  currentLineIndex++;
  showStoryLine();
};

qs("#btn-skip").onclick = () => {
  hide(qs("#story-screen"));
  startGameForStage(stageIdx, selectedStoryLevel);
};

// **스테이지별 본게임**
function startGameForStage(idx, level) {
  restoreBgm();
  alert(`Stage ${idx + 1} 게임 시작!\n레벨: ${level}`);
  setTimeout(() => {
    nextStage();
  }, 1500);
}

function nextStage() {
  stageIdx++;
  if (stageIdx < window.story_stages.length) {
    proceedToStage(stageIdx);
  } else {
    alert("모든 스테이지 클리어! 타이틀로 돌아갑니다.");
    hide(qs("#story-screen"));
    show(qs("#title"));
    document.addEventListener("keydown", startFromTitle, { once: true });
    document.addEventListener("click", startFromTitle, { once: true });
  }
}

// ================================================================
//                      [스코어 어택 모드]
// ================================================================
function startScoreMode(level) {
  hide(qs("#level-menu"));
  startGame("score", level);
}

// ================================================================
//                          [BGM]
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
//                       [Sound Effect]
// ================================================================
const SFX = {
    BUTTON:   "button-click.wav",
    START:   "title-start.mp3",
    STORY:   "story-next.wav",
};

function getSfxPath(name) {
    return `../assets/sounds/${name}`;
  }
  
  function playSfx(path, volume = sfxVolume) {
    path = getSfxPath(path);
    const audio = new Audio(path);
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  
  

document.querySelectorAll("button").forEach((btn) => {
btn.addEventListener("click", () => playSfx(SFX.BUTTON));
});
  
function playStorySfx() {
playSfx(SFX.STORY);
}
  
// ================================================================
//                       [Skip 모달]
// ================================================================
const skipModal = qs("#confirm-skip-modal");
const btnYes = qs("#skip-confirm-yes");
const btnNo = qs("#skip-confirm-no");

qs("#btn-skip").onclick = () => {
  skipModal.showModal();
};

btnYes.onclick = () => {
  skipModal.close();
  hide(qs("#story-screen"));
  startGameForStage(stageIdx, selectedStoryLevel);
};

btnNo.onclick = () => {
  skipModal.close();
};

// ESC키, 바깥 클릭으로도 닫힘(기본 dialog 동작)
