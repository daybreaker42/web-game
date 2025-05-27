function showStoryScreen() {
  hide(qs("#difficulty-menu"));
  show(qs("#story-screen"));
}

function playStageStory(stageIndex, onStoryEnd) {
  showStoryScreen();
  const scenes = STORY_SCRIPTS[stageIndex] || [];
  playSceneByIndex(scenes, 0, onStoryEnd);
}

function playSceneByIndex(scenes, idx, onStoryEnd) {
  if (idx >= scenes.length) {
    if (typeof onStoryEnd === "function") onStoryEnd();
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

// ============================================================================
//                               Skip Modal
// ============================================================================

const skipModal = qs("#confirm-skip-modal");
const btnYes = qs("#skip-confirm-yes");
const btnNo = qs("#skip-confirm-no");

qs("#btn-skip-story")?.addEventListener("click", () => {
  skipModal.showModal();
});
btnYes?.addEventListener("click", () => {
  skipModal.close();
  hide(qs("#story-screen"));
  if (typeof onStageClear === "function") {
    onStageClear();
  }
});
btnNo?.addEventListener("click", () => {
  skipModal.close();
});
