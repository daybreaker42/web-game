// ============================================================================
//                               Skip Modal
// ============================================================================

const skipModal = qs("#confirm-skip-modal");
const btnYes = qs("#skip-confirm-yes");
const btnNo = qs("#skip-confirm-no");

let currentOnSkip = null; // CRT 씬에서 스킵 콜백을 저장

function setupStorySkipHandler(onSkip) {
  currentOnSkip = onSkip;
  const btnSkipStory = qs("#btn-skip-story");
  if (btnSkipStory) {
    btnSkipStory.onclick = () => {
      showStorySkipConfirm(() => {
        // CRT 화면도 숨기기
        const crtConsoleScreen = qs("#crt-console-screen");
        if (crtConsoleScreen) crtConsoleScreen.classList.add("hidden");
        if (typeof currentOnSkip === "function") currentOnSkip();
      });
    };
  }
}

// ============================================================================

function showStoryScreen() {
  hide(qs("#difficulty-menu-screen"));
  show(qs("#story-screen"));
}

function playStory(stageIndex, finalCallback) {
  console.log(`Playing story for stage ${stageIndex}`);
  showStoryScreen();

  const isEnding = stageIndex > N_STAGES; // ★ 엔딩 여부
  function afterScenes() {
    if (isEnding) {
      console.log("Showing ending illustration");
      showEndingIllustration(finalCallback);
    } else {
      finalCallback();
    }
  }

  const scenes = STORY_SCRIPTS[stageIndex] || [];
  setupStorySkipHandler(afterScenes);

  playSceneByIndex(scenes, 0, afterScenes);
}

function playSceneByIndex(scenes, idx, onStoryEnd) {
  if (idx >= scenes.length) {
    onStoryEnd();
    return;
  }
  const scene = scenes[idx];
  playScene(scene, () => playSceneByIndex(scenes, idx + 1, onStoryEnd));
}

// ============================================================================
//                                Play Story
// ============================================================================

let prevIlustration = null;

function playScene(scene, onDone) {
  playSceneAudio(scene);
  qs("#story-line").textContent = "";
  if (prevIlustration !== scene.image) {
    qs("#story-illustration").style.backgroundImage = "none";
    showStoryIlustration(scene);
  }

  if (scene.delay) {
    setTimeout(() => runScene(), scene.delay * 1000);
  } else {
    runScene();
  }

  function runScene() {
    if (scene.CRT_style) {
      showStorySceneConsole(scene, onDone);
    } else {
      showStorySceneNormal(scene, onDone);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 엔딩 : 일러스트 한 장 → 「—— Fin ——」 → 두 번째 클릭으로 종료
// ─────────────────────────────────────────────────────────────
function showEndingIllustration(done) {
  const screen = qs("#story-screen");
  const illust = qs("#story-illustration");
  const textbox = qs("#story-textbox");
  const skipBtn = qs("#btn-skip-story");

  /* 0. 기존 UI 요소 정리 */
  hideWithFade(textbox); // 자막 박스 사라짐
  hideWithFade(skipBtn); // 스킵 버튼 사라짐
  hideWithFade(illust); // 포트레이트 사라짐
  hideWithFade(screen); // 일러스트가 보임
  screen.style.backgroundColor = "black";
  screen.style.background =
    'url("../assets/images/story/ending-memory.png") no-repeat center/contain';
  showWithFade(screen); // 일러스트가 보임

  let clickCnt = 0;
  screen.onclick = () => {
    clickCnt++;

    if (clickCnt === 1) {
      showWithFade(qs("#story-fin-text"));
    } else if (clickCnt === 2) {
      hideWithFade(illust);
      hideWithFade(qs("#story-fin-text"));

      screen.onclick = null; // 중복 호출 방지
      setTimeout(done, 800);
    }
  };
}

// ============================================================================
//                                Scene Handlers
// ============================================================================

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
  let isSkipped = false; // 스킵 상태 추적

  // CRT 화면의 기존 스킵 버튼 사용
  const crtSkipBtn = crtConsoleScreen.querySelector("#btn-skip-story");

  // CRT 스킵 버튼 이벤트 핸들러 (기존 핸들러 덮어쓰기 방지)
  if (crtSkipBtn && !crtSkipBtn.hasAttribute("data-crt-handler-set")) {
    crtSkipBtn.onclick = () => {
      showStorySkipConfirm(() => {
        isSkipped = true;
        crtConsoleScreen.classList.add("hidden");
        if (typeof currentOnSkip === "function") currentOnSkip();
      });
    };
    crtSkipBtn.setAttribute("data-crt-handler-set", "true");
  }

  stopBgm();
  if (storyScreen) {
    playSfx(SFX.CRT_ON);
  }

  setTimeout(() => {
    if (storyScreen) {
      storyScreen.classList.add("hidden");
    }
    crtConsoleText.textContent = "";
    crtConsoleScreen.classList.remove("hidden");
    crtConsoleScreen.classList.add("slow-fadein-crt");

    setTimeout(() => {
      crtConsoleText.textContent = "";
      typeNextLine();
    }, 1800);
  }, 920);

  function typeNextLine() {
    if (isSkipped) return; // 스킵되었으면 중단

    if (idx < scene.lines.length) {
      let i = 0;
      const text = scene.lines[idx];
      crtConsoleText.textContent = "";
      function typeChar() {
        if (isSkipped) return; // 스킵되었으면 중단

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
      finishCRTScene();
    }
  }

  function finishCRTScene() {
    crtConsoleScreen.classList.add("hidden");
    storyScreen.classList.remove("hidden");
    crtConsoleScreen.classList.remove("slow-fadein-crt");
    crtConsoleText.textContent = "";
    if (onDone) onDone();
  }

  // btnYes 클릭 시 CRT 씬도 정리하도록 수정
  const originalBtnYesHandler = btnYes.onclick;
  btnYes.onclick = () => {
    isSkipped = true; // 스킵 플래그 설정
    crtConsoleScreen.classList.add("hidden");
    originalBtnYesHandler();
  };
}

// ============================================================================
//                            Play Scene Utils
// ============================================================================

let prevStorySceneType = "normal";

function playSceneAudio(scene) {
  if (scene.bgm) {
    playBgm(scene.bgm);
  }
  if (scene.sfx) {
    playSfx(scene.sfx);
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
