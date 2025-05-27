window.story_scripts = [
  window.story_intro,
  window.story_stage1,
  window.story_stage2,
  window.story_stage3,
  window.story_ending,
];

// ====== 상태 변수 ======
let selectedLevel = null;
let stageListIdx = 0;
let storyScript = [];
let storySceneIdx = 0;

let prevStorySceneType = "normal";
let prevIlustration = null;

// ====== 주요 진입점 ======
function proceedToStage(idx) {
  storyScript = window.story_scripts[idx] || [];
  storySceneIdx = 0;
  currentLineIndex = 0;
  showStoryScreen();
  showStoryScenes();
}

function setSelectedLevel(level) {
  selectedLevel = level;
}

function setStageListIdx(idx) {
  stageListIdx = idx;
}

// ====== 스토리 씬 진행 ======
function showStoryScenes() {
  if (storySceneIdx >= storyScript.length) {
    hide(qs("#story-screen"));
    startGameForStage(stageListIdx, selectedLevel);
    return;
  }
  const scene = storyScript[storySceneIdx];

  playSceneAudio(scene);
  qs("#story-line").textContent = "";
  if (prevIlustration !== scene.image) {
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

// ====== 포트레이트 표시 ======
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

// ====== 일러스트 표시 ======
function showStoryIlustration(scene) {
  if (prevIlustration === scene.image) return;
  const storyIlustration = qs("#story-illustration");
  storyIlustration.classList.remove("fade-in");
  void storyIlustration.offsetWidth;
  storyIlustration.classList.add("fade-in");
  storyIlustration.style.backgroundImage = scene.image
    ? `url('../assets/images/story/${scene.image}.png')`
    : "";
  if (scene.image_width) {
    storyIlustration.style.width = `${scene.image_width}px`;
  } else {
    storyIlustration.style.width = "100%";
  }
  prevIlustration = scene.image;
}

// ====== 씬 타입별 재생 ======
function showStorySceneNormal(scene, onDone) {
  if (scene.image) showStoryIlustration(scene);
  showStoryPotrait(scene);
  const indicator = qs(".story-next-indicator");
  let idx = 0;

  if (!scene.lines || scene.lines.length === 0) {
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
        setTimeout(() => indicator.classList.remove("hidden"), 50);
      }

      qs("#story-screen").onclick = function (e) {
        if (e.target.id === "btn-skip-story") return;
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

function showStorySceneFlashback(scene, onDone) {
  qs("#story-illustration").style.backgroundImage = scene.image
    ? `url('../assets/images/story/${scene.image}.png')`
    : "";

  let idx = 0;
  function advanceLine() {
    if (idx < scene.lines.length) {
      qs("#story-line").textContent = scene.lines[idx];
      qs("#story-line").style.fontStyle = "italic";
      qs("#story-line").style.color = "#999";
      qs("#story-screen").onclick = function (e) {
        if (e.target.id === "btn-skip-story") return;
        idx++;
        advanceLine();
      };
    } else {
      qs("#story-line").style.fontStyle = "";
      qs("#story-line").style.color = "";
      qs("#story-screen").onclick = null;
      if (onDone) onDone();
    }
  }
  advanceLine();
}

// ====== BGM, SFX 재생 ======
function playSceneAudio(scene) {
  if (scene.bgm) {
    playBgm(scene.bgm);
  }
  if (scene.sfx) {
    playSfx(scene.sfx);
  }
}

// ====== 스테이지별 본게임 Dummy ======
function startGameForStage(idx, level) {
  stopBgm();
  hide(qs("#story-screen"));
  alert(
    `Stage ${idx + 1} 게임 시작!\n레벨: ${level}\n(아직 구현되지 않음. 자동 진행)`,
  );
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
    // started = false; // main.js 등에서 started 별도 관리 필요
  }
}

// ====== 스킵 모달 처리 ======
const skipModal = qs("#confirm-skip-modal");
const btnYes = qs("#skip-confirm-yes");
const btnNo = qs("#skip-confirm-no");

qs("#btn-skip-story")?.addEventListener("click", () => {
  skipModal.showModal();
});

btnYes?.addEventListener("click", () => {
  skipModal.close();
  hide(qs("#story-screen"));
  startGameForStage(stageListIdx, selectedLevel);
});

btnNo?.addEventListener("click", () => {
  skipModal.close();
});

// ====== 스코어보드 렌더링 예시 (임시) ======
function renderScoreboard() {
  // 스코어보드 렌더링 로직
  // qs("#ranking-list").innerHTML = ...;
}
