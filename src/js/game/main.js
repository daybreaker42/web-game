// 게임 모드 선택 관리
let currentGameMode = "brick"; // 기본값: 벽돌깨기
let currentGame = null;
const canvas = document.getElementById("game-canvas");
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
function switchGameMode(mode) {
  if (currentGame && typeof currentGame.endGame === "function") {
    // 현재 실행 중인 게임이 있고, endGame 메서드가 있다면 호출
    currentGame.endGame();
    console.log(`게임 모드 ${currentGameMode} 종료`);
  }

  currentGameMode = mode;
  brickModeButton.classList.toggle("active", mode === "brick");
  bossModeButton.classList.toggle("active", mode === "boss");

  if (mode === "brick") {
    currentGame = new BrickGame(canvas);
      currentGame.setGameInfo({ mode: "brick", difficulty: "easy", stage: 1 });
  } else if (mode === "boss") {
    currentGame = new BossGame(canvas);
      currentGame.setGameInfo({ mode: "boss", difficulty: "easy", stage: 4 });
  }
  console.log(`게임 모드 ${currentGameMode} 설정 완료`);
  // 게임 초기화
  // 게임 시작은 사용자가 "게임 시작" 버튼을 눌렀을 때 GameManager의 startGame에 의해 처리됩니다.
  // UI(점수, 생명)는 currentGame.startGame() 내부 또는 setGameInfo 후 GameManager에서 업데이트합니다.
  if (currentGame && typeof currentGame.updateUI === "function") {
    currentGame.updateUI(); // 모드 변경 시 초기 UI 반영
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

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  switchGameMode("brick"); // 기본 모드로 초기화

  // 게임 컨트롤 버튼 이벤트 리스너 설정 (한 번만) // 주석 추가
  const startButton = document.getElementById("startButton");
  const pauseButtonLegacy = document.getElementById("pauseButton");
  const pauseButton = document.getElementById("pause-button");
  const restartButton = document.getElementById("restartButton");

  if (startButton) {
    startButton.addEventListener("click", () => {
      if (currentGame && typeof currentGame.startGame === "function") {
        currentGame.startGame();
      }
    });
  } else {
    console.error("startButton 요소를 찾을 수 없습니다.");
  }
  if (pauseButton && pauseButtonLegacy) {
    pauseButton.addEventListener("click", () => {
      if (currentGame && typeof currentGame.togglePause === "function") {
        currentGame.togglePause();
      }
    });
    pauseButtonLegacy.addEventListener("click", () => {
      if (currentGame && typeof currentGame.togglePause === "function") {
        currentGame.togglePause();
      }
    });
  } else {
    console.error("pauseButton 요소를 찾을 수 없습니다.");
  }
  if (restartButton) {
    restartButton.addEventListener("click", () => {
      if (currentGame && typeof currentGame.restartGame === "function") {
        currentGame.restartGame();
      }
    });
  } else {
    console.error("restartButton 요소를 찾을 수 없습니다.");
  }

  // 키보드 및 마우스 이벤트 리스너 설정 (한 번만) // 주석 추가
  document.addEventListener("keydown", (e) => {
    if (currentGame && typeof currentGame.keyDownHandler === "function") {
      currentGame.keyDownHandler(e);
    }
  });

  document.addEventListener("keyup", (e) => {
    if (currentGame && typeof currentGame.keyUpHandler === "function") {
      currentGame.keyUpHandler(e);
    }
  });

  document.addEventListener("mousemove", (e) => {
    // mouseMoveHandler는 paddle 객체가 있는 BrickGame에만 주로 사용되므로,
    // BossGame 등 다른 게임 모드에서 paddle이 없을 경우 오류를 방지하기 위해 currentGame.paddle 존재 여부도 확인 가능
    // 또는 GameManager에 paddle이 null일 수 있음을 명시하고 각 핸들러에서 처리
    if (currentGame && typeof currentGame.mouseMoveHandler === "function") {
      // GameManager의 mouseMoveHandler는 this.paddle 유무를 이미 체크하고 있으므로 바로 호출 가능
      currentGame.mouseMoveHandler(e);
    }
  });

  // slot 이동
  document.addEventListener("keydown", (e) => {
    if (e.key >= "1" && e.key <= "4") {
      // 1 ~ 4 키를 누르면 해당하는 slot 선택
      const slotList = document.querySelectorAll(".pokemon-slot-frame");
      const index = parseInt(e.key) - 1;
      slotList.forEach((slot, i) => {
        if (i === index) {
          slot.classList.add("selected");
        } else {
          slot.classList.remove("selected");
        }
      });
    }
  });
});
