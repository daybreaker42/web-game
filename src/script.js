const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => [...document.querySelectorAll(sel)];
const hide = (el) => el.classList.add("hidden");
const show = (el) => el.classList.remove("hidden");

// ===== 타이틀 → 메인 메뉴 =====
document.addEventListener("keydown", startFromTitle, { once: true });
document.addEventListener("click", startFromTitle, { once: true });

window.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".logo");
  const pressAny = document.querySelector(".press-any");

  // 2초 후 로고 보이기
  setTimeout(() => {
    logo.classList.add("show");
  }, 2000);

  // 5초 후 press any button 보이기
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

// ===== 메인 메뉴 → 모드 메뉴 =====
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

// ===== 모드 → 난이도 =====
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

// ===== 옵션 모달 =====
function openOptions() {
  qs("#options-modal").showModal();
}
document
  .querySelectorAll(".btn-options")
  .forEach((btn) => (btn.onclick = openOptions));
qs("#modal-close").onclick = () => qs("#options-modal").close();

// SFX/BGM 볼륨
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

// BGM 볼륨
qs("#bgm-volume").addEventListener("input", (e) => {
  bgmVolume = +e.target.value;
  bgm.volume = bgmVolume;
});
bgm.volume = bgmVolume;

const storyBgmPath = "../assets/sounds/story.mp3";
let prevBgmSrc = bgm.src;

function playStoryBgm() {
    prevBgmSrc = bgm.src; // 기존 배경음 저장
    bgm.pause();
    bgm.src = storyBgmPath;
    bgm.load();
    bgm.currentTime = 0;
    // play는 load 이벤트 이후에!
    bgm.oncanplaythrough = () => {
      bgm.play();
    };
  }

// ===== 난이도 선택 후 분기 =====
qsa(".btn-level").forEach((btn) => {
  btn.onclick = () => {
    const level = btn.dataset.level;
    if (selectedMode === "story") startStoryMode(level);
    else startScoreMode(level);
  };
});

// ===== 스토리 진행 =====
let storyScript = window.story_intro || [];
let selectedStoryLevel = null;

function startStoryMode(level) {
  hide(qs("#level-menu"));
  show(qs("#story-screen"));
  currentStoryIndex = 0;
  currentLineIndex = 0;
  selectedStoryLevel = level;
  playStoryBgm();
  showStoryLine();
}

function showStoryLine() {
  if (currentStoryIndex >= storyScript.length) {
    // 스토리 다 보면 본게임 시작
    startGame('story', selectedStoryLevel);
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

  qs("#story-illustration").style.backgroundImage =
    `url('../assets/images/story/${chapter.image}.jpg')`;
  qs("#story-line").textContent = lines[currentLineIndex];
}

// 스토리 화면 클릭: 다음 줄 진행
qs("#story-screen").onclick = function (e) {
  if (e.target.id === "btn-skip") return;
  currentLineIndex++;
  showStoryLine();
};

// 스킵: 스토리 즉시 종료 → 본게임 바로 시작
qs("#btn-skip").onclick = () => {
  startGame('story', selectedStoryLevel);
};

// 본게임 시작(자리표시자)
function startGame(mode, level) {
  restoreBgm();
  alert(`Game starts!\nMode: ${mode}\nLevel: ${level ?? "default"}`);
  // TODO: 게임 화면 연결
}

  
// ===== 스코어 어택 =====
function startScoreMode(level) {
  hide(qs("#level-menu"));
  startGame("score", level);
}

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
