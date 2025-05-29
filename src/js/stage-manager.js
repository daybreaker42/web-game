let currentStageIndex = 0;

function proceedToStage(stageNumber) {
    currentStageIndex = stageNumber;
    
    if (stageNumber > N_STAGES) {
      // 모든 스테이지 완료 - ENDING 스토리 재생
      playStory(5, () => { // story_closing
        onAllStagesCleared();
      });
      return;
    }
    
    // 각 스테이지 전 스토리 재생
    playStory(stageNumber, () => { // stage 1이면 story_chapter1 (인덱스 1)
      // 스토리 후 게임 시작
      playGame("story", selectedDifficulty, stageNumber, (gameResult) => {
        onGameEnd(gameResult);
      });
    });
  }

/**
 * 게임 끝나고 호출하는 함수, 다음 스테이지로 넘어가거나 없으면 타이틀로
 */
function onGameEnd(gameResult) {
    saveGameResult(gameResult);
    hideWithFade(qs("#gameplay-screen"));
    
    if (gameResult.game_over) {
      onStageOver(gameResult);
    } else {
      // Stage 4 (보스) 클리어 시 특별 처리
      if (currentStageIndex === 4) {
        // Stage 4 클리어 후 바로 ENDING 스토리로
        proceedToStage(5); // ENDING 스토리 재생
      } else {
        onStageClear(gameResult);
      }
    }
  }

// =============================================================================
//                               Callbacks
// =============================================================================

function onAllStagesCleared() {
    alert("축하합니다. 모든 스테이지를 클리어했습니다!\n타이틀로 돌아갑니다.");
    
    // 최종 결과 표시 및 크레딧
    showCredits();
    handleReturnToTitleScreen();
  }
  
  function onStageClear(gameResult) {
    alert(`Stage ${currentStageIndex}를 클리어했습니다.\n다음 스테이지로 진행합니다.`);
    proceedToStage(currentStageIndex + 1);
  }
  
  function onStageOver(gameResult) {
    alert("게임 오버! 타이틀로 돌아갑니다.");
    handleReturnToTitleScreen();
  }
  
  function saveGameResult(gameResult) {
    // TODO: 게임 결과 저장 (localStorage 사용하지 않고 메모리에 저장)
    // 예: window.gameResults = window.gameResults || [];
    // window.gameResults.push(gameResult);
  }