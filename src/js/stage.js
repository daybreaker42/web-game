let currentStageIndex = 0;

function proceedToStage(stageIdx) {
  currentStageIndex = stageIdx;
  console.log(`Proceeding to stage ${stageIdx}`);

  // Stage 4는 보스전 전 스토리가 먼저 (chapter4_finale)
  // Stage 1~3은 게임 바로 시작 (스토리는 게임 후)
  const beforeStage =
    stageIdx === N_STAGES ? (cb) => playStory(4, cb) : (cb) => cb();

  stopBgm();
  stopSfx();

  beforeStage(() => {
    if (stageIdx === N_STAGES) hideWithFade(qs("#story-screen"));
    // if (stageIdx === N_STAGES) hideWithFade(qs("#story-screen"));
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

function onStageClear(gameResult) {
  if (currentStageIndex === N_STAGES) {
    // 1. 엔딩 일러스트 → 2. 크레딧 → 3. 게임 결과
    playStory(N_STAGES + 1, () => {
      showCredits(gameResult, () => {
        showGameResultScreen(gameResult);
      });
    });
  } else {
    // 기존 그대로 (1~3스테이지)
    playStory(currentStageIndex, () => {
      stopBgm();
      proceedToStage(currentStageIndex + 1);
    });
  }
}

function onStageOver(gameResult) {
  showGameResultScreen(gameResult);
}

function saveGameResult(gameResult) {
  addScoreRecord(
    gameResult.mode,
    gameResult.difficulty,
    gameResult.name,
    gameResult.score,
  );
  console.log("게임 결과 저장:", gameResult);
}
