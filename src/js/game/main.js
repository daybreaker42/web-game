// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  if (window.DEBUG_MODE && window.DEBUG_GAME) {
    // switchGameMode("brick"); // 기본 모드로 초기화
    document.getElementById('gameplay-screen').classList.remove('hidden');
  }
  // 게임 컨트롤 버튼 이벤트 리스너 설정 (한 번만) // 주석 추가
  const startButton = document.getElementById("startButton");
  const pauseButtonLegacy = document.getElementById("pauseButton");
  const pauseButton = document.getElementById("pause-button");
  const restartButton = document.getElementById("restartButton");

  if (startButton) {
    startButton.addEventListener("click", () => {
      if (gameInstance && typeof gameInstance.startGame === "function") {
        gameInstance.startGame();
      }
    });
  } else {
    console.error("startButton 요소를 찾을 수 없습니다.");
  }
  if (pauseButton && pauseButtonLegacy) {
    pauseButton.addEventListener("click", () => {
      if (gameInstance && typeof gameInstance.togglePause === "function") {
        gameInstance.togglePause();
      }
    });
    pauseButtonLegacy.addEventListener("click", () => {
      if (gameInstance && typeof gameInstance.togglePause === "function") {
        gameInstance.togglePause();
      }
    });
  } else {
    console.error("pauseButton 요소를 찾을 수 없습니다.");
  }
  if (restartButton) {
    restartButton.addEventListener("click", () => {
      if (gameInstance && typeof gameInstance.restartGame === "function") {
        gameInstance.restartGame();
      }
    });
  } else {
    console.error("restartButton 요소를 찾을 수 없습니다.");
  }

  // 키보드 및 마우스 이벤트 리스너 설정 (한 번만) // 주석 추가
  document.addEventListener("keydown", (e) => {
    if (gameInstance && typeof gameInstance.keyDownHandler === "function") {
      gameInstance.keyDownHandler(e);
    }
  });

  document.addEventListener("keyup", (e) => {
    if (gameInstance && typeof gameInstance.keyUpHandler === "function") {
      gameInstance.keyUpHandler(e);
    }
  });

  document.addEventListener("mousemove", (e) => {
    // mouseMoveHandler는 paddle 객체가 있는 BrickGame에만 주로 사용되므로,
    // BossGame 등 다른 게임 모드에서 paddle이 없을 경우 오류를 방지하기 위해 gameInstance.paddle 존재 여부도 확인 가능
    // 또는 GameManager에 paddle이 null일 수 있음을 명시하고 각 핸들러에서 처리
    if (gameInstance && typeof gameInstance.mouseMoveHandler === "function") {
      // GameManager의 mouseMoveHandler는 this.paddle 유무를 이미 체크하고 있으므로 바로 호출 가능
      gameInstance.mouseMoveHandler(e);
    }
  });

  // slot 이동 event lister 설정
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
