/**
 * GameManager class
 * - 게임 실행/상태 관리를 수행하는 클래스
 * - 벽돌깨기(brickGame.js)와 보스전(bossGame.js)의 공통 기능을 제공
 */
class GameManager {
  constructor(canvas) {
    // 캔버스 설정
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.animationFrame = null;

    // MARK: 게임 설정 상수들
    this.FPS = 60;
    this.FRAME_DELAY = 1000 / this.FPS;

    // MARK: 배경 이미지 시스템 추가
    this.backgroundImage = null;
    this.backgroundImageLoaded = false;
    // MARK: 목숨 아이콘 이미지 추가
    this.ballIcon = new Image();
    this.ballIcon.src = "../assets/images/game/object/ball.png"; // 볼 아이콘 경로 설정
    this.ballIconLoaded = false;
    this.ballIcon.onload = () => {
      this.ballIconLoaded = true; // 볼 아이콘 로드 완료 플래그
    };
    // 게임 상태 변수들
    this.lastTime = 0;
    this.isGameRunning = false;
    this.isPaused = false;
    this.gameStartTime = 0; // 게임 시작 시간 저장
    this.pauseStartTime = 0; // 일시정지했을때 시간 멈추기 용
    this.totalPauseDuration = 0; // 일시정지한 시간

    // 게임 정보
    this.mode = null;
    this.difficulty = null;
    this.stage = null;
    this.score = 0;
    this.lives = 300; // 기본 생명력
    this.totalLives = 300;
    this.isGameClear = false;
    this.saved_pokemon = [];

    // 생명 설정 (모드 및 난이도별) // 주석 추가: 생명 설정 구조화
    this.livesConfig = {
      brick: { easy: 300, normal: 300, hard: 300 }, // 주석 추가: 벽돌깨기 모드 생명 (현재는 동일)
      boss: { easy: 1000, normal: 300, hard: 300 }, // 주석 추가: 보스전 모드 생명 (현재는 동일)
    };

    // 입력 상태
    this.keys = {
      rightPressed: false,
      leftPressed: false,
      spacePressed: false,
    };

    // 공통 게임 오브젝트들
    this.ball = null;
    this.paddle = null;
    this.BALL_SPEED = 5; // 공의 기본 속도

    // 메시지 시스템
    this.persistentMessageElement = null;

    // 다음 스테이지로 넘어가기
    this.onGameEnd = null;
  }

  /**
   * MARK: 게임 정보를 설정하는 메서드
   */
  setGameInfo(data) {
    if (!data.mode) {
        throw new Error(`게임 mode 설정 안됨: ${JSON.stringify(data)}`);
    }
    if (!data.difficulty) {
        throw new Error(`게임 difficulty 설정 안됨: ${JSON.stringify(data)}`);
    }

    try {
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
    } catch (e) {
      throw new Error("받은 data가 JSON 형식이 아닙니다");
    }
    if (typeof data.mode !== "string" || typeof data.difficulty !== "string") {
      throw new Error("게임 정보의 형식이 유효하지 않습니다");
    }
    this.mode = data.mode;
    this.difficulty = data.difficulty;
    this.stage = data.stage;

    // 스테이지별 배경 이미지 로드 (추가된 기능)
    this.loadStageBackground(data.stage);

    // 레벨에 따른 난이도 설정
    this.setDifficultyBydifficulty(data.difficulty);
  }

  /**
   * 다음 스테이지로 넘어가는 함수를 설정함
   */
  setOnGameEnd(onGameEnd) {
    this.onGameEnd = onGameEnd;
  }

  /**
   * 스테이지별 배경 이미지 로드 메서드 (추가된 기능)
   * @param {number} stage - 스테이지 번호 (1~4)
   */
  loadStageBackground(stage) {
    // 기존 배경 이미지 초기화
    this.backgroundImage = null;
    this.backgroundImageLoaded = false;

    // 스테이지 번호 유효성 검사
    if (stage < 1 || stage > 4) {
      console.warn(
        `유효하지 않은 스테이지 번호: ${stage}. 기본 배경을 사용합니다.`,
      );
      return;
    }

    // 배경 이미지 생성 및 로드
    this.backgroundImage = new Image();

    // 이미지 로드 완료 시 플래그 설정
    this.backgroundImage.onload = () => {
      this.backgroundImageLoaded = true;
    };

    // 이미지 로드 실패 시 에러 처리
    this.backgroundImage.onerror = () => {
      this.backgroundImage = null;
      this.backgroundImageLoaded = false;
    };

    // 배경 이미지 경로 설정 및 로드 시작
    const imagePath = `../assets/images/game/ui/background-stage-${stage}.png`;
    this.backgroundImage.src = imagePath;
  }

  /**
   * MARK: 레벨에 따른 난이도 설정
   */
  setDifficultyBydifficulty(difficulty) {
    const currentModeConfig =
      this.livesConfig[this.mode] || this.livesConfig.brick; // 현재 모드의 설정을 가져오거나 기본값(brick) 사용

    switch (difficulty) {
      case "easy":
        this.totalLives = currentModeConfig.easy; // 주석 수정: 모드별 난이도에 따른 생명 설정
        break;
      case "normal":
        this.totalLives = currentModeConfig.normal; // 주석 수정: 모드별 난이도에 따른 생명 설정
        break;
      case "hard":
        this.totalLives = currentModeConfig.hard; // 주석 수정: 모드별 난이도에 따른 생명 설정
        break;
      default:
        this.totalLives = currentModeConfig.normal; // 주석 수정: 기본값으로 normal 난이도 생명 설정
    }
    this.lives = this.totalLives;
  }

  /**
   * 공통 게임 오브젝트 초기화
   */
  initializeGameObjects() {
    // 공 초기화
    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 30,
      speedX: 0,
      speedY: -this.BALL_SPEED,
      radius: 10,
      color: "#ffeb3b",
    };

    // 패들 초기화
    this.paddle = {
      height: 10,
      width: 110,
      x: (this.canvas.width - 110) / 2,
      y: this.canvas.height - 100,
      color: "#4CAF50",
    };
  }

  /**
   * 키보드 입력 처리
   */
  keyDownHandler(e) {
    if (
      e.key === "Right" ||
      e.key === "ArrowRight" ||
      e.key === "d" ||
      e.key === "D"
    ) {
      this.keys.rightPressed = true;
    } else if (
      e.key === "Left" ||
      e.key === "ArrowLeft" ||
      e.key === "a" ||
      e.key === "A"
    ) {
      this.keys.leftPressed = true;
    } else if (e.code === "Space") {
      this.keys.spacePressed = true;
      this.togglePause(); // 스페이스바로 일시정지 토글
    }
  }

  keyUpHandler(e) {
    if (
      e.key === "Right" ||
      e.key === "ArrowRight" ||
      e.key === "d" ||
      e.key === "D"
    ) {
      this.keys.rightPressed = false;
    } else if (
      e.key === "Left" ||
      e.key === "ArrowLeft" ||
      e.key === "a" ||
      e.key === "A"
    ) {
      this.keys.leftPressed = false;
    } else if (e.code === "Space") {
      this.keys.spacePressed = false;
    }
  }

  /**
   * 마우스 이동 처리
   */
  mouseMoveHandler(e) {
    if (this.isGameRunning && !this.isPaused && this.paddle) {
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;

      if (relativeX > 0 && relativeX < this.canvas.width) {
        if (relativeX - this.paddle.width / 2 < 0) {
          this.paddle.x = 0;
        } else if (relativeX + this.paddle.width / 2 > this.canvas.width) {
          this.paddle.x = this.canvas.width - this.paddle.width;
        } else {
          this.paddle.x = relativeX - this.paddle.width / 2;
        }
      }
    }
  }

  /**
   * 메시지 표시 시스템
   */
  showMessage(text, type, persistent = false) {
    if (this.persistentMessageElement) {
      this.persistentMessageElement.remove();
      this.persistentMessageElement = null;
    }

    const messageElement = document.createElement("div");
    messageElement.textContent = text;
    messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 100;
            color: white;
            background-color: ${type === "success" ? "rgba(76, 175, 80, 0.9)" : "rgba(244, 67, 54, 0.9)"};
        `;

    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.appendChild(messageElement);
    }

    if (persistent) {
      this.persistentMessageElement = messageElement;
    } else {
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
      }, 3000);
    }
  }

  /**
   * UI 업데이트
   */
  updateUI() {
    this.drawLives();
    this.drawScore();
  }

  /**
   * 목숨 표시 (master 요청으로 추가된 메서드)
   */
  drawLives() {
    const iconWidth = 30; // 아이콘 너비
    const iconHeight = 30; // 아이콘 높이
    const iconX = this.canvas.width - 100; // 아이콘 위치 (우측 여백 70px)
    const iconY = 10; // 아이콘 위치 (상단 여백 10px)
    const textX = iconX + iconWidth + 5; // 텍스트 위치 (아이콘 옆)
    const textY = iconY + iconHeight / 2 + 5; // 텍스트 수직 정렬
    if (this.ballIconLoaded) {
      this.ctx.drawImage(this.ballIcon, iconX, iconY, iconWidth, iconHeight); // 볼 아이콘 그리기

      this.ctx.font = "20px DOSGothic"; // 폰트 설정
      this.ctx.fillStyle = "#fff"; // 텍스트 색상
      this.ctx.textAlign = "left"; // 텍스트 정렬
      this.ctx.fillText(`X ${this.lives}`, textX, textY); // 남은 목숨 표시
    } else {
      this.ctx.fillText(`남은 목숨: ${this.lives}`, textX, textY); // 볼 아이콘이 로드되지 않았을 때 텍스트로 표시
    }
  }

  drawScore() {
    const scoreElement = qs("#score");
    if (scoreElement) scoreElement.textContent = this.score;
  }

  /**
   * 일시정지 토글
   */
  togglePause() {
    if (this.isGameRunning) {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.pauseStartTime = performance.now();
        cancelAnimationFrame(this.animationFrame);
        this.showMessage("게임 일시정지", "success", true);
      } else {
        // 일시정지 해제 시 - 일시정지 지속 시간 계산하여 누적
        const pauseEndTime = performance.now();
        this.totalPauseDuration += pauseEndTime - this.pauseStartTime;
        this.lastTime = performance.now();
        this.animationFrame = requestAnimationFrame((time) =>
          this.update(time),
        );

        if (this.persistentMessageElement) {
          this.persistentMessageElement.remove();
          this.persistentMessageElement = null;
        }
        this.showMessage("게임 재개", "success");
      }
    }
  }

  /**
   * 게임 시작
   */
  startGame() {
    if (!this.isGameRunning) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }

      this.isGameRunning = true;
      this.isPaused = false;
      this.score = 0;
      this.lives = this.totalLives;
      this.lastTime = performance.now();
      this.gameStartTime = performance.now();
      this.pauseStartTime = 0; // pauseStartTime 초기화
      this.totalPauseDuration = 0; // totalPauseDuration 초기화

      // 게임 오브젝트 초기화
      this.initializeGameObjects();

      // 하위 클래스의 초기화 메서드 호출
      if (this.initializeGame) {
        this.initializeGame();
      }

      // UI 업데이트
      this.updateUI();
      this.drawBackground();

      // 초기 안내 문구 출력
      const instructions = qs("#info-modal");
      const confirmButton = qs("#info-confirm-yes");
      this.setInfoModalContent(this.mode === "boss");
      const result = instructions.showModal();
      confirmButton.addEventListener("click", () => {
        instructions.close();

        hideAllFade(qsa(".screen"));
        showWithFade(qs("#gameplay-screen"));

        // 애니메이션 프레임 시작
        this.animationFrame = requestAnimationFrame((time) =>
          this.update(time),
        );
        console.log(`${this.mode} 게임을 시작합니다.`);
        this.showMessage(`게임 시작!`, "success");
      });
    }
  }

  /**
   * 게임 플래이 방법 안내 모달 내용 설정
   * - 모달의 내용은 게임 모드에 따라 다르게 설정
   * @param {boolean} isBossMode - 보스 모드 여부
   * - true: 보스 모드, false: 일반 모드
   */
  setInfoModalContent(isBossMode) {
    const infoContentSpan = qs("#info-content");
    infoContentSpan.innerHTML = isBossMode
      ? "W A S D <br> ↑ ← ↓ →"
      : "W A S D <br> ↑ ← ↓ → <br> 마우스";
  }

  /**
   * 게임 재시작
   */
  restartGame() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.isGameRunning = false;
    this.lastTime = 0;

    setTimeout(() => this.startGame(), 100);
  }

  /**
   * 배경 이미지 그리기 메서드 (추가된 기능 - 하위 클래스에서 호출)
   */
  drawBackground() {
    // 스테이지별 배경 이미지 그리기
    if (this.backgroundImageLoaded && this.backgroundImage) {
      this.ctx.drawImage(
        this.backgroundImage,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    }
  }

  /**
   * 메인 게임 루프 - 하위 클래스에서 오버라이드
   */
  update(currentTime = 0) {
    const deltaTime = currentTime - this.lastTime;

    // 프레임 딜레이를 고려한 업데이트
    // 현재 시간과 마지막 업데이트 시간의 차이를 계산하여 프레임 딜레이보다 작으면 다음 프레임으로 넘어감
    if (deltaTime < this.FRAME_DELAY) {
      this.animationFrame = requestAnimationFrame((time) => this.update(time));
      return;
    }

    this.lastTime = currentTime - (deltaTime % this.FRAME_DELAY);
    const timeMultiplier = deltaTime / this.FRAME_DELAY; // FPS 기반 시간 보정치

    // 게임이 실행 중이고 일시정지가 아닌 경우에만 업데이트
    if (this.isGameRunning && !this.isPaused) {
      // 남은 시간 (ms)
      const elapsedTime =
        currentTime - this.gameStartTime - this.totalPauseDuration;
      const timeLeft = Math.max(0, GAME_TIME - elapsedTime);

      // 분과 초 계산
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);

      // 화면에 표시 (두자리 숫자 포맷)
      document.getElementById("timer").textContent =
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      // 시간 초과 시 게임 종료 처리
      if (timeLeft <= 0) {
        this.showMessage("시간 초과! 게임 종료", "error"); // this 추가
        this.isGameRunning = false; // this 추가
        cancelAnimationFrame(this.animationFrame);
        this.endGame();
        return;
      } // 이하 기존 게임 로직 계속...
      // 캔버스 초기화
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 배경 그리기 (항상 먼저)
      if (this.backgroundImageLoaded && this.backgroundImage) {
        this.drawBackground();
      } else if (this.stage) {
        // 배경 이미지가 로드되지 않았지만 스테이지 정보가 있다면 로드 시도
        this.loadStageBackground(this.stage);
      }

      // 하위 클래스의 업데이트 메서드 호출
      if (this.updateGame) {
        this.updateGame(timeMultiplier);
      }

      this.updateUI();
    } // 다음 프레임 요청 (게임이 실행 중일 때만)
    if (this.isGameRunning) {
      this.animationFrame = requestAnimationFrame((time) => this.update(time));
    }
  }

  /**
   * 게임 종료
   */
  endGame() {
    this.isGameRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const result = {
      mode: this.mode,
      difficulty: this.difficulty,
      stage: this.stage,
      score: this.score,
      date: new Date().toISOString(),
      game_over: window.DEBUG_MODE ? false : true, // 디버그 모드에서는 계속 진행
      saved_pokemon: this.saved_pokemon || [],
    };
    this.onGameEnd(result); // 게임 종료 콜백 호출
  }

  // MARK: 하위 클래스에서 구현해야 할 추상 메서드들
  /**
   * 게임별 초기화 - 하위 클래스에서 구현
   */
  initializeGame() {
    // 하위 클래스에서 구현
  }

  /**
   * 게임별 업데이트 로직 - 하위 클래스에서 구현
   */
  updateGame(timeMultiplier) {
    // 하위 클래스에서 구현
  }
}
