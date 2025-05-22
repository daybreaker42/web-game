const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => [...document.querySelectorAll(sel)];
const hide = (el) => el.classList.add("hidden");
const show = (el) => el.classList.remove("hidden");

// ===== 타이틀 → 메인 메뉴 =====
document.addEventListener("keydown", startFromTitle, { once: true });
document.addEventListener("click", startFromTitle, { once: true });

window.addEventListener("DOMContentLoaded", () => {
  const fadeinWrap = document.getElementById("fadein-wrap");
  const logo = document.querySelector(".logo");
  const pressAny = document.querySelector(".press-any");

  // 0.5초 후 전체 페이드인
  setTimeout(() => {
    fadeinWrap.classList.add("fadein-show");
  }, 500);

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
    const mainMenu = qs("#main-menu");
    show(mainMenu);
    setTimeout(() => {
      mainMenu.classList.add("show-fade");
    }, 30);
    try {
      qs("#bgm").play();
    } catch (e) {}
  }, 1100);
}

// ===== 메인 메뉴 → 모드 메뉴 =====
qs("#btn-play").onclick = () => {
  hide(qs("#main-menu"));
  show(qs("#mode-menu"));
};
// 뒤로가기(모드) → 메인 메뉴
qs("#btn-back-to-main-menu").onclick = () => {
  hide(qs("#mode-menu"));
  show(qs("#main-menu"));
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

// ===== 난이도 선택 후 분기 =====
qsa(".btn-level").forEach((btn) => {
  btn.onclick = () => {
    const diff = btn.dataset.diff;
    if (selectedMode === "story") startStoryMode(diff);
    else startScoreMode(diff);
  };
});

// ===== 스토리 진행 =====
const storyImages = ["img/story1.jpg", "img/story2.jpg", "img/story3.jpg"];
const storyLines = [
  "…먼 옛날, 평화로운 왕국에 재앙이 닥쳤다.",
  "주인공은 왕의 부름을 받아, 마왕성을 향해 떠나는데…",
  "모험이 지금 시작된다!",
];

function startStoryMode(diff) {
  hide(qs("#level-menu"));
  show(qs("#story-screen"));
  runStory(0, diff);
}

function runStory(index, diff) {
  if (index >= storyLines.length) {
    endStoryReturnToTitle();
    return;
  }
  qs("#story-line").textContent = storyLines[index];
  qs("#story-illustration").style.backgroundImage =
    `url("${storyImages[index]}")`;

  // advance on click anywhere in story-screen (except Skip)
  const next = (e) => {
    // Skip버튼 클릭 시 무시 (아래 핸들러에서 처리)
    if (e.target.id === "btn-skip") return;
    qs("#story-screen").removeEventListener("click", next);
    runStory(index + 1, diff);
  };
  qs("#story-screen").addEventListener("click", next, { once: true });
}

// Skip 클릭시도 타이틀로 복귀
qs("#btn-skip").onclick = () => endStoryReturnToTitle();

function endStoryReturnToTitle() {
  hide(qs("#story-screen"));
  show(qs("#title"));
  // 타이틀 화면으로 돌아갈 때 'Press any button...' 리스너 재설정
  document.addEventListener("keydown", startFromTitle, { once: true });
  document.addEventListener("click", startFromTitle, { once: true });
}

// ===== 스코어 어택 =====
function startScoreMode(diff) {
  hide(qs("#level-menu"));
  startGame("score", diff);
}

// ===== 본 게임 시작 (자리표시자) =====
function startGame(mode, diff) {
  alert(`Game starts!\nMode: ${mode}\nDifficulty: ${diff ?? "default"}`);
  // TODO: 캔버스, 실제 게임 화면 등 연결
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
