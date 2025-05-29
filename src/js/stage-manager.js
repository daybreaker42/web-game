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

  // 각 스테이지 전 스토리 재생
  playStory(stageIdx, () => {
    playGame("story", selectedDifficulty, stageIdx, (gameResult) => {
      onGameEnd(gameResult);
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
      // Stage 1이면 story_chapter1
      startStage(currentStageIndex + 1); // 다음 스테이지로
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
