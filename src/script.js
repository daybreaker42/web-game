// ================================================================
//                         [헬퍼 함수 / 쿼리]
// ================================================================
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => [...document.querySelectorAll(sel)];
const hide = (el) => el.classList.add("hidden");
const show = (el) => el.classList.remove("hidden");

// ================================================================
//                    [타이틀 -> 메인 메뉴 진입]
// ================================================================
document.addEventListener("keydown", startFromTitle, { once: true });
document.addEventListener("click", startFromTitle, { once: true });
let started = false;

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

function showMainMenu() {
  const mainMenu = qs("#main-menu");
  mainMenu.classList.add("fade-in");
  show(mainMenu);
}

// ================================================================
//            [메인 메뉴 <-> 플레이 모드 선택 or 랭킹 화면]
// ================================================================
qs("#btn-play").onclick = () => {
  hide(qs("#main-menu"));
  show(qs("#play-mode-menu"));
};

qs("#btn-back-to-main-menu").onclick = () => {
  hide(qs("#play-mode-menu"));
  const mainMenu = qs("#main-menu");
  mainMenu.classList.remove("fade-in");
  show(mainMenu);
};

qs("#btn-ranking").onclick = () => {
  stopCloudAnimation();
  playBgm(BGM.RANKING);
  qs("#ranking-screen").classList.remove("fade-out");
  qs("#ranking-screen").classList.add("fade-in");
  hide(qs("#main-menu"));
  show(qs("#ranking-screen"));
  renderScoreboard();
};

qs("#btn-back-to-main").onclick = () => {
  playBgm(BGM.TITLE);
  qs("#ranking-screen").classList.remove("fade-in");
  qs("#ranking-screen").classList.add("fade-out");
  hide(qs("#ranking-screen"));
  show(qs("#main-menu"));
  startCloudAnimation();
};

// ================================================================
//                   [모드 메뉴 <-> 난이도 메뉴]
// ================================================================
let selectedMode = null;

qs("#btn-story").onclick = () => chooseMode("story-mode");
qs("#btn-score").onclick = () => chooseMode("score-mode");

function chooseMode(mode) {
  selectedMode = mode;
  hide(qs("#play-mode-menu"));
  show(qs("#level-menu"));
}

qs("#btn-back-to-play-mode-menu").onclick = () => {
  hide(qs("#level-menu"));
  show(qs("#play-mode-menu"));
};

// ================================================================
//              [난이도 메뉴 -> 스토리 모드 / 스코어 모드]
// ================================================================

qsa(".btn-level").forEach((btn) => {
  btn.onclick = () => {
    const level = btn.dataset.level;
    if (selectedMode === "story-mode") startGameStoryMode(level);
    else startGameScoreMode(level);
  };
});

function startGameStoryMode(level) {
  stopCloudAnimation();
  stopBgm();
  hide(qs("#level-menu"));
  selectedLevel = level;
  stageListIdx = 0;
  proceedToStage(stageListIdx);
}

function startGameScoreMode(level) {
  stopCloudAnimation();
  alert("미구현");
}

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
  playBgm(BGM.GAME);
  alert(`Game starts!\nMode: ${mode}\nLevel: ${level ?? "default"}`);
  // TODO: 게임 화면 연결
}

// ================================================================
//                           [스토리 모드]
// ================================================================

window.story_scripts = [
  window.story_intro,
  window.story_stage1,
  window.story_stage2,
  window.story_stage3,
  window.story_ending,
];

let selectedLevel = null;
let stageListIdx = 0;
let storyScript = [];
let storySceneIdx = 0;

function proceedToStage(idx) {
  storyScript = window.story_scripts[idx] || [];
  storySceneIdx = 0;
  currentLineIndex = 0;
  showStoryScreen();
  showStoryScenes();
}

function playSceneAudio(scene) {
  if (scene.bgm) {
    playBgm(scene.bgm);
  }
  if (scene.sfx) {
    playSfx(scene.sfx);
  }
}

const STORY_SCENE_TYPES = {
  NORMAL: "normal",
  CRT_CONSOLE: "crt_console",
  FLASHBACK: "flashback",
};

let prevStorySceneType = STORY_SCENE_TYPES.NORMAL;
let prevIlustration = null;

function showStoryIlustration(scene) {
  if (prevIlustration === scene.image) return;

  const storyIlustration = qs("#story-illustration");
  storyIlustration.classList.remove("fade-in"); // 1. 클래스 제거
  void storyIlustration.offsetWidth; // 2. 리플로우 강제(애니메이션 리셋 트릭)
  storyIlustration.classList.add("fade-in"); // 3. 다시 추가 → 항상 애니메이션 재생
  storyIlustration.style.backgroundImage = `url('../assets/images/story/${scene.image}.png')`;

  if (scene.image_width) {
    storyIlustration.style.width = `${scene.image_width}px`;
  } else {
    storyIlustration.style.width = "100%";
  }
  prevIlustration = scene.image;
}

// storyScript: 현재 stage의 전체 씬 배열
// storySceneIdx: 현재 씬 index
function showStoryScenes() {
  if (storySceneIdx >= storyScript.length) {
    hide(qs("#story-screen"));
    startGameForStage(stageListIdx, selectedLevel);
    return;
  }
  const scene = storyScript[storySceneIdx];

  playSceneAudio(scene);
  qs("#story-line").textContent = "";
  if (prevIlustration != scene.image) {
    qs("#story-illustration").style.backgroundImage = "none";
    showStoryIlustration(scene);
  }

  if (scene.delay) {
    setTimeout(() => {
      runScene();
    }, scene.delay * 1000);
  } else {
    runScene();
  }

  function runScene() {
    if (scene.CRT_style) {
      showStorySceneConsole(scene, nextScene);
    } else if (scene.flashback) {
      showStorySceneFlashback(scene, nextScene);
    } else {
      showStorySceneNormal(scene, nextScene);
    }
  }
  function nextScene() {
    storySceneIdx++;
    showStoryScenes();
  }
}

function showStoryPotrait(scene) {
  const potraitEl = qs("#story-potrait");
  const storyLine = qs("#story-line");
  if (scene.potrait) {
    potraitEl.classList.remove("hidden");
    let folder = scene.potrait;
    let potraitType = scene.potrait_type || "Normal";
    potraitEl.style.background = `url('../assets/images/story/potrait/${folder}/${potraitType}.png') center/contain no-repeat`;
    storyLine.classList.add("with-potrait");
  } else {
    potraitEl.classList.add("hidden");
    storyLine.classList.remove("with-potrait");
    potraitEl.style.background = "";
  }
}

function showStorySceneNormal(scene, onDone) {
  if (scene.image) showStoryIlustration(scene);
  showStoryPotrait(scene);
  const indicator = qs(".story-next-indicator");
  let idx = 0;

  if (scene.lines.length === 0) {
    qs("#story-textbox").classList.add("hidden");
    if (onDone) onDone();
    return;
  } else {
    qs("#story-textbox").classList.remove("hidden");
  }

  function advanceLine() {
    if (idx < scene.lines.length) {
      qs("#story-line").textContent = scene.lines[idx];
      playSfx(SFX.STORY);
      if (indicator) {
        indicator.classList.add("hidden");
        setTimeout(() => {
          indicator.classList.remove("hidden");
        }, 50);
      }

      qs("#story-screen").onclick = function (e) {
        if (e.target.id === "btn-skip") return;
        idx++;
        advanceLine();
      };
    } else {
      qs("#story-screen").onclick = null;
      if (onDone) onDone();
    }
  }
  advanceLine();
}

function showStorySceneConsole(scene, onDone) {
  const crtConsoleScreen = qs("#crt-console-screen");
  const crtConsoleText = qs("#crt-console-text");
  const storyScreen = qs("#story-screen");

  if (!scene.lines || scene.lines.length === 0) {
    crtConsoleScreen.classList.add("hidden");
    if (onDone) onDone();
    return;
  }

  let idx = 0;

  stopBgm();
  if (storyScreen) {
    storyScreen.classList.add("crt-off-anim");
    playSfx(SFX.CRT_ON);
  }

  setTimeout(() => {
    if (storyScreen) {
      storyScreen.classList.add("hidden");
      storyScreen.classList.remove("crt-off-anim");
    }
    crtConsoleScreen.classList.remove("hidden");
    crtConsoleScreen.classList.add("slow-fadein-crt");

    setTimeout(() => {
      crtConsoleText.textContent = "";
      typeNextLine();
    }, 1800);
  }, 920);

  function typeNextLine() {
    if (idx < scene.lines.length) {
      let i = 0;
      const text = scene.lines[idx];
      crtConsoleText.textContent = "";
      function typeChar() {
        if (i <= text.length) {
          crtConsoleText.textContent = text.slice(0, i);
          if (i > 0 && text[i - 1] !== " " && SFX.CRT_TYPE) {
            playSfx(SFX.CRT_TYPE);
          }
          i++;
          setTimeout(typeChar, 46);
        } else {
          idx++;
          setTimeout(typeNextLine, 500);
        }
      }
      typeChar();
    } else {
      crtConsoleScreen.classList.add("hidden");
      storyScreen.classList.remove("hidden");
      crtConsoleScreen.classList.remove("slow-fadein-crt");
      crtConsoleText.textContent = "";
      if (onDone) onDone();
    }
  }
}

// TODO
function showStorySceneFlashback(scene, onDone) {
  // 예시: 플래시백 스타일은 텍스트/배경 등 다르게 처리
  qs("#story-illustration").style.backgroundImage =
    `url('../assets/images/story/${scene.image}.png')`;

  let idx = 0;
  function advanceLine() {
    if (idx < scene.lines.length) {
      qs("#story-line").textContent = scene.lines[idx];
      // 스타일 강조 (예: 회색톤, 이탤릭 등)
      qs("#story-line").style.fontStyle = "italic";
      qs("#story-line").style.color = "#999";
      qs("#story-screen").onclick = function (e) {
        if (e.target.id === "btn-skip") return;
        idx++;
        advanceLine();
      };
    } else {
      // 스타일 초기화, 한 챕터 끝
      qs("#story-line").style.fontStyle = "";
      qs("#story-line").style.color = "";
      qs("#story-screen").onclick = null;
      if (onDone) onDone();
    }
  }
  advanceLine();
}

function showStoryScreen() {
  hide(qs("#level-menu"));
  show(qs("#story-screen"));
}

// **스테이지별 본게임**
function startGameForStage(idx, level) {
  stopBgm();
  hide(qs("#story-screen"));
  alert(
    `Stage ${idx + 1} 게임 시작!\n레벨: ${level}\n(아직 구현되지 않음. 자동 진행)`,
  );
  // TODO: 스테이지별 게임 화면 연결
  setTimeout(() => {
    nextStage();
  }, 1500);
}

function nextStage() {
  stageListIdx++;
  if (stageListIdx < window.story_scripts.length) {
    proceedToStage(stageListIdx);
  } else {
    alert("모든 스테이지 클리어! 타이틀로 돌아갑니다.");
    hide(qs("#story-screen"));
    show(qs("#title"));
    document.addEventListener("keydown", startFromTitle, { once: true });
    document.addEventListener("click", startFromTitle, { once: true });
    started = false;
  }
}

// ================================================================
//                          [BGM]
// ================================================================

const BGM = {
  TITLE: "title.mp3",
  STORY: "story.mp3",
  GAME: "game.mp3",
  ENDING: "ending.mp3",
  CREDITS: "credits.mp3",
  INTRO: "intro.mp3",
  RANKING: "ranking.mp3",
};

function getBgmPath(name) {
  return `../assets/sounds/bgm/${name}`;
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
}

// ================================================================
//                       [Sound Effect]
// ================================================================
const SFX = {
  BUTTON: "button-click.wav",
  START: "press-any-button.mp3",
  STORY: "story-next.wav",
  CRT_TYPE: "crt-type.wav",
  CRT_ON: "crt-on.mp3",
  CRT_OFF: "crt-off.mp3",
};

function getSfxPath(name) {
  return `../assets/sounds/sfx/${name}`;
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
  startGameForStage(stageListIdx, selectedLevel);
};

btnNo.onclick = () => {
  skipModal.close();
};

// ================================================================
//                       [타이틀 애니메이션]
// ================================================================

let cloudAnimTimer = null;

function preloadCloudFrames(frameCount, basePath) {
  const frames = [];
  let loadedCount = 0;
  return new Promise((resolve) => {
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = `${basePath}${i}.png`;
      img.onload = () => {
        frames[i] = img;
        loadedCount++;
        if (loadedCount === frameCount) resolve(frames);
      };
      img.onerror = () => {
        // 실패해도 비워둠
        loadedCount++;
        if (loadedCount === frameCount) resolve(frames);
      };
    }
  });
}

function startCloudAnimation() {
  const root = document.documentElement;
  const frameCount = 4;
  const basePath = "../assets/images/background/title_";
  let frameIdx = 0;
  let frames = [];

  // 프레임 preload 후 애니메이션 시작
  preloadCloudFrames(frameCount, basePath).then((loadedFrames) => {
    frames = loadedFrames;
    // 첫 프레임 강제 표시
    if (frames[0] && frames[0].src) {
      root.style.setProperty("--img-menu-bg", `url('${frames[0].src}')`);
    }
    cloudAnimTimer = setInterval(() => {
      const img = frames[frameIdx];
      if (img && img.src) {
        root.style.setProperty("--img-menu-bg", `url('${img.src}')`);
      }
      frameIdx = (frameIdx + 1) % frameCount;
    }, 500);
  });
}

function stopCloudAnimation() {
  if (cloudAnimTimer !== null) {
    clearInterval(cloudAnimTimer);
    cloudAnimTimer = null;
  }
}
