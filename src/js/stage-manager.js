let currentStageIndex = 0;

function proceedToStage(stageIdx) {
    currentStageIndex = stageIdx;
    console.log(`Proceeding to stage ${stageIdx}`);
  
    // 모든 스테이지 완료 - ENDING 스토리 재생
    if (stageIdx > N_STAGES) {
      playStory(N_STAGES + 1, () => {
        // story_chapter5_closing
        onAllStagesCleared();
      });
      return;
    }
  
    // Stage 4는 보스전 전 스토리가 먼저 (chapter4_finale)
    // Stage 1~3은 게임 바로 시작 (스토리는 게임 후)
    const beforeStage = (stageIdx === N_STAGES)
    ? (cb) => playStory(4, cb)
    : (cb) => cb();

    stopBgm();
    stopSfx();

  beforeStage(() => {
    showInfoModal(`Stage ${stageIdx}를 시작합니다.`, () => {
      if (stageIdx === 4) hideWithFade(qs("#story-screen"));
      playGame("story", selectedDifficulty, stageIdx, (gameResult) => {
        onGameEnd(gameResult);
      });
    });
  });
}

/**
 * 게임 끝나고 호출하는 함수, 다음 스테이지로 넘어가거나 없으면 타이틀로
 */
function onGameEnd(gameResult) {
  stopBgm();
  console.log("게임 종료:", gameResult);
  if (gameResult.game_over) {
    onStageOver(gameResult);
  } else {
    saveGameResult(gameResult);
    hideWithFade(qs("#gameplay-screen"));
    onStageClear(gameResult);
  }
}

// =============================================================================
//                               Callbacks
// =============================================================================

function onAllStagesCleared() {
  // ENDING 스토리 재생
  playStory(N_STAGES + 1, () => {
    // story_chapter5_closing
    showCredits();
    handleReturnToTitleScreen();
  });
}

function onStageClear(gameResult) {
  alert(`Stage ${currentStageIndex}를 클리어했습니다.`);

  if (currentStageIndex === N_STAGES) {
    // Stage 4 클리어
    onAllStagesCleared();
  } else {
    // Stage 1~3 클리어 후 해당 스토리 재생
    playStory(currentStageIndex, () => {
        stopBgm();
        stop
      proceedToStage(currentStageIndex + 1); // 다음 스테이지로
    });
  }
}

function onStageOver(gameResult) {
  showInfoModal("GAME OVER\n타이틀로 돌아갑니다.", () => {
    handleReturnToTitleScreen();
  });
}

function saveGameResult(gameResult) {
  // TODO: 게임 결과 저장
}
