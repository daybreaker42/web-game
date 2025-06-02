// gameInstance - 게임 정보를 입력하고, 게임 실행과 관련된 동작 (startGame, endGame 등)을 관리하는 전역 변수
let gameInstance;
const canvas = document.getElementById("game-canvas");

/**
 * playGame
 * ------------------------------------------------------------------
 *  ∘ mode        : "story" | "score"
 *  ∘ difficulty  : "easy"  | "normal" | "hard"
 *  ∘ stage       : 스토리일 때 1-4,  점수 모드일 때는 아무 값(null 포함)
 *  ∘ onGameEnd   : (result:Object) => void     ─ 게임 종료 콜백
 *
 *  - 기존 gameInstance 가 있으면 destroy() 로 완전 정리
 *  - 새 인스턴스를 만들면 GameManager 내부에서 입력 리스너를 스스로 붙임
 * ------------------------------------------------------------------
 */
function playGame(mode, difficulty, stage, onGameEnd) {
  // 0) 배경음
  try {
    playBgm(BGM[`STAGE_${stage}`]);
  } catch (_) {
    /* 없는 스테이지면 조용히 무시 */
  }

  const canvas = document.getElementById("game-canvas");
  console.log("[playGame] 시작:", { mode, difficulty, stage });

  /* ----------------------------------------------------------------
       1) 기존 게임 clean-up
    ---------------------------------------------------------------- */
  if (gameInstance && typeof gameInstance.destroy === "function") {
    gameInstance.destroy(); // ✨ GameManager.destroy() 안에서
    //    이벤트/애니메이션/타이머 전부 해제
  }
  gameInstance = null;

  /* ----------------------------------------------------------------
       2) 인스턴스 생성
    ---------------------------------------------------------------- */
  if (mode === "story") {
    gameInstance =
      stage === 4
        ? new BossGame(canvas) // 보스전
        : new BrickGame(canvas); // 벽돌깨기
  } else if (mode === "score") {
    gameInstance = new BrickGame(canvas);
  } else {
    alert("잘못된 게임 모드입니다.");
    return;
  }

  /* ----------------------------------------------------------------
       3) 게임 정보 & 콜백 설정
    ---------------------------------------------------------------- */
  gameInstance.setGameInfo({ mode, difficulty, stage });

  gameInstance.setOnGameEnd((result) => {
    // 연출용 딜레이(1.8초) 뒤에 상위 콜백 호출
    setTimeout(() => onGameEnd(result), 1800);
  });

  /* ----------------------------------------------------------------
       4) Go!
    ---------------------------------------------------------------- */
  gameInstance.startGame();
}

const brickModeButton = document.getElementById("brickModeButton");
const bossModeButton = document.getElementById("bossModeButton"); // bossModeButton 정의 추가

// 모드 버튼 이벤트 리스너
brickModeButton.addEventListener("click", () => {
  switchGameMode("brick");
});

bossModeButton.addEventListener("click", () => {
  switchGameMode("boss");
});

// 게임 모드 전환 함수 - DEBUG용
function switchGameMode(gameType) {
  if (gameInstance && typeof gameInstance.endGame === "function") {
    // 현재 실행 중인 게임이 있고, endGame 메서드가 있다면 호출
    gameInstance.setOnGameEnd(null);
    gameInstance.endGame();
    console.log(`게임 모드 ${gameInstance.mode} 종료`);
  }

  brickModeButton.classList.toggle("active", gameType === "brick");
  bossModeButton.classList.toggle("active", gameType === "boss");

  if (gameType === "brick") {
    gameInstance = new BrickGame(canvas);
    gameInstance.setGameInfo({ mode: "score", difficulty: "easy", stage: 1 });
  } else if (gameType === "boss") {
    gameInstance = new BossGame(canvas);
    gameInstance.setGameInfo({ mode: "score", difficulty: "easy", stage: 4 });
  }
  console.log(`게임 모드 ${gameInstance.mode} 설정 완료`);
  // 게임 초기화
  // 게임 시작은 사용자가 "게임 시작" 버튼을 눌렀을 때 GameManager의 startGame에 의해 처리됩니다.
  // UI(점수, 생명)는 gameInstance.startGame() 내부 또는 setGameInfo 후 GameManager에서 업데이트합니다.
  if (gameInstance && typeof gameInstance.updateUI === "function") {
    gameInstance.updateUI(); // 모드 변경 시 초기 UI 반영
  }
}

/**
 * brickGame 인스턴스 제작하는 함수
 */
function createBrickGame(data, onGameEnd) {
  let game = new BrickGame(canvas);
  game.setGameInfo(data);
  game.setOnGameEnd(onGameEnd);
  return game;
}

/**
 * bossGame 인스턴스 제작하는 함수
 */
function createBossGame(data, onGameEnd) {
  let game = new BossGame(canvas);
  game.setGameInfo(data);
  game.setOnGameEnd(onGameEnd);
  return game;
}
