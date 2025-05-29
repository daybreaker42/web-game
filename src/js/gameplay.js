// gameInstance - 게임 정보를 입력하고, 게임 실행과 관련된 동작 (startGame, endGame 등)을 관리하는 전역 변수
let gameInstance;
const canvas = document.getElementById("game-canvas");

/**
 * playGame(mode, difficulty, stage, onGameEnd)
 * - mode: "story" | "score"
 * - difficulty: "easy" | "normal" | "hard"
 * - stage: 스토리 모드는 1 이상의 정수, 점수모드는 null/-1/미사용
 * - onGameEnd: 게임 종료 콜백
 */
function playGame(mode, difficulty, stage, onGameEnd) {
  playBgm(BGM[`STAGE_${stage}`]);
  const canvas = document.getElementById("game-canvas");

  console.log("게임 시작:", mode, difficulty, stage);

  window.onkeydown = null;
  window.onkeyup = null;
  canvas.onmousemove = null;

  let gameInfo = {
    mode,
    difficulty,
    stage,
  };


  if (mode === "score") {
    gameInstance = new BrickGame(canvas);
  } else if (mode === "story") {
    if (stage === STORY_SCRIPTS.length) {
      gameInstance = new BossGame(canvas);
    } else {
      gameInstance = new BrickGame(canvas);
    }
  } else {
    alert("잘못된 게임 모드입니다.");
    return;
  }
  gameInstance.setGameInfo(gameInfo);
  gameInstance.setOnGameEnd(function (gameResult) {
    setTimeout(() => onGameEnd(gameResult), 1800);
  });

  // TODO: 이거 bossGame.js, brickGame.js, game/main.js에 중복 아닌가? (성준)
  window.onkeydown = (e) => gameInstance.keyDownHandler(e);
  window.onkeyup = (e) => gameInstance.keyUpHandler(e);
  canvas.onmousemove = (e) => gameInstance.mouseMoveHandler(e);

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

// 게임 모드 전환 함수
function switchGameMode(gameType) {
  if (gameInstance && typeof gameInstance.endGame === "function") {
    // 현재 실행 중인 게임이 있고, endGame 메서드가 있다면 호출
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
