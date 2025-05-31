/**
 * GameManager class
 * - 게임 실행/상태 관리를 수행하는 클래스
 * - 벽돌깨기(brickGame.js)와 보스전(bossGame.js)의 공통 기능을 제공
 */
class GameManager {
  constructor(canvas) {
    if (window.DEBUG_MODE) console.log('[GameManager] constructor 호출'); // 디버깅용 로그 추가
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

    // MARK: 포켓몬 능력 시스템 추가
    this.pokemonAbilitySystem = {
      cooldowns: [0, 0, 0, 0], // 각 슬롯별 쿨타임 (밀리초)
      lastUsed: [0, 0, 0, 0], // 각 슬롯별 마지막 사용 시간
      defaultCooldown: 3000, // 기본 쿨타임: 3초
      throttleInterval: 200, // 입력 throttling 간격: 200ms
      lastInputTime: [0, 0, 0, 0], // 각 슬롯별 마지막 입력 시간
    };    // MARK: 포켓몬 체력 시스템 추가
    this.pokemonHealthSystem = {
      maxHealth: [100, 100, 100, 100], // 각 슬롯별 최대 체력
      currentHealth: [100, 100, 100, 100], // 각 슬롯별 현재 체력
      healthConsumption: 20, // 능력 사용 시 소모 체력
      isDizzy: [false, false, false, false], // 각 슬롯별 기절 상태
      dizzyImages: [null, null, null, null], // 기절 상태 이미지
      originalImages: [null, null, null, null], // 원본 이미지 저장
    };

    // 게임 상태 변수들
    this.lastTime = 0;
    this.isGameRunning = false;
    this.isPaused = false;
    this.gameStartTime = 0; // 게임 시작 시간 저장
    this.pauseStartTime = 0; // 일시정지했을때 시간 멈추기 용
    this.totalPauseDuration = 0; // 일시정지한 시간

    // 게임 정보
    this.mode = null;       // score | story
    this.difficulty = null;
    this.stage = null;      // 1~3 : 벽돌깨기, 4 : 보스전
    this.score = 0;
    this.lives = 300; // 기본 생명력
    this.totalLives = 300;
    this.isGameClear = false;
    this.saved_pokemon = [];

    // 생명 설정 (모드 및 난이도별) // 주석 추가: 생명 설정 구조화
    this.livesConfig = {
      brick: { easy: 20, normal: 10, hard: 5 }, // 주석 추가: 벽돌깨기 모드 생명 (현재는 동일)
      boss: { easy: 1000, normal: 500, hard: 250 }, // 주석 추가: 보스전 모드 생명 (현재는 동일)
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
    this.paddleOffset = 80;
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
    if (window.DEBUG_MODE) console.log('[GameManager] setGameInfo 호출', data); // 디버깅용 로그 추가
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
    if (window.DEBUG_MODE) console.log('[GameManager] setOnGameEnd 호출'); // 디버깅용 로그 추가
    this.onGameEnd = onGameEnd;
  }
  /**
   * 스테이지별 배경 이미지 로드 메서드 (추가된 기능)
   * @param {number} stage - 스테이지 번호 (1~4)
   */
  loadStageBackground(stage) {
    if (window.DEBUG_MODE) console.log('[GameManager] loadStageBackground 호출', stage); // 디버깅용 로그 추가
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
      console.error(`배경 이미지 가져오기 실패!`);
    };

    // 배경 이미지 경로 설정 및 로드 시작
    const imagePath = `../assets/images/game/ui/background-stage-${stage}.png`;
    this.backgroundImage.src = imagePath;
    this.backgroundImageLoaded = true;
  }
  /**
   * MARK: 레벨에 따른 난이도 설정
   */
  setDifficultyBydifficulty(difficulty) {
    if (window.DEBUG_MODE) console.log('[GameManager] setDifficultyBydifficulty 호출', difficulty); // 디버깅용 로그 추가
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
    if (window.DEBUG_MODE) console.log('[GameManager] initializeGameObjects 호출'); // 디버깅용 로그 추가
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
      y: this.canvas.height - this.paddleOffset,
      color: "#4CAF50",
    };
  }
  /**
   * 키보드 입력 처리
   */
  keyDownHandler(e) {
    // if (window.DEBUG_MODE) console.log('[GameManager] keyDownHandler 호출', e.key); // 디버깅용 로그 추가
    if (
      e.key === "Right" ||
      e.key === "ArrowRight" ||
      e.key === "d" ||
      e.key === "D"
    ) {
      this.keys.rightPressed = true;
    } else {
      this.keys.rightPressed = false;
      if (
        e.key === "Left" ||
        e.key === "ArrowLeft" ||
        e.key === "a" ||
        e.key === "A"
      ) {
        this.keys.leftPressed = true;
      } else {
        this.keys.leftPressed = false;
        if (e.code === "Space") {
          this.keys.spacePressed = true;
          this.togglePause(); // 스페이스바로 일시정지 토글
        } else {
          this.keys.spacePressed = false;
          if (e.key >= "1" && e.key <= "4") {
            // MARK: 포켓몬 능력 사용 처리 추가
            this.handlePokemonAbilityKey(parseInt(e.key) - 1);
          }
        }
      }
    }
  }  /**
   * 키보드 입력 해제 처리
   */
  keyUpHandler(e) {
    // if (window.DEBUG_MODE) console.log('[GameManager] keyUpHandler 호출', e.key); // 디버깅용 로그 추가
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
      this.keys.spacePressed = false; // 스페이스바 입력 해제
    } else if (e.key >= "1" && e.key <= "4") {
      // MARK: 포켓몬 능력 사용 처리 추가
      // const slotIndex = parseInt(e.key) - 1;
      // this.handlePokemonAbilityKey(slotIndex);
    }
  }  // MARK: 포켓몬 능력 키 입력 처리 메서드 추가
  handlePokemonAbilityKey(slotIndex) {
    if (window.DEBUG_MODE) console.log('[GameManager] handlePokemonAbilityKey 호출', slotIndex); // 디버깅용 로그 추가
    // 게임이 실행 중이고 일시정지 상태가 아닐 때만 실행
    if (!this.isGameRunning || this.isPaused) return;

    const currentTime = performance.now();

    // Throttling 체크: 너무 빠른 연속 입력 방지
    if (currentTime - this.pokemonAbilitySystem.lastInputTime[slotIndex] < this.pokemonAbilitySystem.throttleInterval) {
      return;
    }
    this.pokemonAbilitySystem.lastInputTime[slotIndex] = currentTime;

    // 해당 슬롯에 포켓몬이 있는지 확인
    const slot = document.getElementById(`slot-${slotIndex}`);
    if (!slot || !slot.style.backgroundImage || slot.style.backgroundImage === "none") {
      console.log(`슬롯 ${slotIndex + 1}에 포켓몬이 없습니다.`);
      return;
    }

    // 기절 상태 체크 (추가됨)
    if (this.pokemonHealthSystem.isDizzy[slotIndex]) {
      console.log(`슬롯 ${slotIndex + 1} 포켓몬이 기절 상태입니다. 회복할 때까지 능력을 사용할 수 없습니다.`);
      return;
    }

    // 쿨타임 체크
    if (currentTime - this.pokemonAbilitySystem.lastUsed[slotIndex] < this.pokemonAbilitySystem.defaultCooldown) {
      const remainingCooldown = Math.ceil((this.pokemonAbilitySystem.defaultCooldown - (currentTime - this.pokemonAbilitySystem.lastUsed[slotIndex])) / 1000);
      console.log(`슬롯 ${slotIndex + 1} 포켓몬 능력 쿨타임 중입니다. (${remainingCooldown}초 남음)`);
      return;
    }

    // 포켓몬 인덱스 추출
    const bgImage = slot.style.backgroundImage;
    const indexMatch = bgImage.match(/(\d+)\.png/);
    if (!indexMatch) return;

    const pokemonIndex = parseInt(indexMatch[1]);
    this.usePokemonAbility(slotIndex, pokemonIndex);
  }  // MARK: 포켓몬 능력 사용 메서드 추가
  usePokemonAbility(slotIndex, pokemonIndex) {
    if (window.DEBUG_MODE) console.log('[GameManager] usePokemonAbility 호출', slotIndex, pokemonIndex); // 디버깅용 로그 추가
    const currentTime = performance.now();

    // 포켓몬 타입 확인
    let pokemonType = 0; // 기본값: 풀타입
    if (window.pokemon && window.pokemon[pokemonIndex]) {
      pokemonType = window.pokemon[pokemonIndex].type;
    }

    // 타입별 능력명 매핑
    const typeNames = {
      0: "풀타입",
      1: "불타입",
      2: "전기타입",
      3: "물타입",
      4: "얼음타입"
    };

    const typeName = typeNames[pokemonType] || "미지타입";
    console.log(`${typeName} 능력 사용!`);

    // 체력 소모 처리 (추가됨)
    this.consumePokemonHealth(slotIndex);

    // 쿨타임 설정
    this.pokemonAbilitySystem.lastUsed[slotIndex] = currentTime;

    // 하위 클래스에서 오버라이드할 수 있는 메서드 호출
    this.executePokemonAbility(slotIndex, pokemonIndex, pokemonType);
  }
  // MARK: 포켓몬 능력 실행 메서드 (하위 클래스에서 오버라이드)
  executePokemonAbility(slotIndex, pokemonIndex, pokemonType) {
    if (window.DEBUG_MODE) console.log('[GameManager] executePokemonAbility 호출', slotIndex, pokemonIndex, pokemonType); // 디버깅용 로그 추가
    // 기본 구현: 하위 클래스에서 오버라이드하여 실제 능력 효과 구현
    console.log(`슬롯 ${slotIndex + 1}의 포켓몬(인덱스: ${pokemonIndex}, 타입: ${pokemonType}) 능력이 사용되었습니다.`);
  }
  /**
   * 마우스 이동 처리
   */
  mouseMoveHandler(e) {
    // if (window.DEBUG_MODE) console.log('[GameManager] mouseMoveHandler 호출', e.clientX, e.clientY); // 디버깅용 로그 추가
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
   * MARK: 포켓몬 구출 메시지 표시 메서드 추가
   */
  showInGameMessage(message, isNotice = false) {
    if (window.DEBUG_MODE) console.log('[GameManager] showInGameMessage 호출', message, isNotice); // 디버깅용 로그 추가
    // 구출 메시지 컨테이너 가져오기
    const messageContainer = document.getElementById('rescue-message-container');
    if (!messageContainer) {
      console.error('구출 메시지 컨테이너를 찾을 수 없습니다.');
      return;
    }

    // 메시지 엘리먼트 생성
    const messageElement = document.createElement('div');
    messageElement.className = 'rescue-message';
    if (isNotice) {
      messageElement.textContent = message;
    } else {
      messageElement.textContent = `${message}을(를) 구출했습니다!`; // 구출 메시지 텍스트
    }
    // 메시지를 컨테이너에 추가
    messageContainer.appendChild(messageElement);

    // 3초 후 메시지 제거 (페이드아웃 애니메이션 포함)
    setTimeout(() => {
      // 페이드아웃 애니메이션 시작
      messageElement.style.animation = 'rescueMessageHide 0.5s ease-out forwards';

      // 애니메이션 완료 후 DOM에서 제거
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.parentNode.removeChild(messageElement);
        }
      }, 500); // 애니메이션 시간(0.5초) 후 제거
    }, 3000); // 3초 후 페이드아웃 시작
  }
  /**
   * UI 업데이트
   */
  updateUI() {
    if (window.DEBUG_MODE) console.log('[GameManager] updateUI 호출'); // 디버깅용 로그 추가
    // 벽돌깨기 모드일때만 drawLives, 아니면 해당 로직에서 따로 구현
    if (this.stage <= 3) {
      this.drawLives();
    }
    this.drawScore();

    // 포켓몬 체력바 그리기 (추가됨)
    this.drawPokemonHealthBars();
  }
  /**
   * MARK: 목숨 표시
   */
  drawLives() {
    if (window.DEBUG_MODE) console.log('[GameManager] drawLives 호출'); // 디버깅용 로그 추가
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
  /**
   * MARK: 점수 그리기
   */
  drawScore() {
    if (window.DEBUG_MODE) console.log('[GameManager] drawScore 호출'); // 디버깅용 로그 추가
    const scoreElement = qs("#score");
    if (scoreElement) scoreElement.textContent = this.score;
  }
  /**
   * MARK: 일시정지 토글
   */
  togglePause() {
    if (window.DEBUG_MODE) console.log('[GameManager] togglePause 호출'); // 디버깅용 로그 추가
    if (this.isGameRunning) {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.pauseStartTime = performance.now();
        cancelAnimationFrame(this.animationFrame);
        this.showInGameMessage("게임 일시정지", true);
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
        this.showInGameMessage("게임 재개", true);
      }
    }
  }
  /**
   * MARK: 컨트롤 정보 모달 표시
   */
  showControlInfoModal(isBossMode, onClose) {
    if (window.DEBUG_MODE) console.log('[GameManager] showControlInfoModal 호출', isBossMode); // 디버깅용 로그 추가
    const msg = isBossMode
      ? "조작법 <br> W A S D <br> ↑ ← ↓ →"
      : "조작법 <br> W A S D <br> ↑ ← ↓ → <br>마우스";
    showInfoModal(msg, onClose);
  }
  /**
   * MARK: 게임 시작
   */
  startGame() {
    if (window.DEBUG_MODE) console.log('[GameManager] startGame 호출'); // 디버깅용 로그 추가
    if (!this.isGameRunning) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }

      this.isGameRunning = true;
      this.isPaused = false;
      this.score = 0;
      this.lives = this.totalLives;

      this.pauseStartTime = 0;
      this.totalPauseDuration = 0;

      this.initializeGameObjects();

      if (this.initializeGame) {
        this.initializeGame();
      }

      // console.log(`ui 그리기`);
      this.updateUI();
      // console.log(`배경 그리기`);
      this.drawBackground();

      // console.log(`모달 출력`);
      // NOTE MARK: 모달 출력 후 게임 시작
      this.showControlInfoModal(this.mode === "boss", () => {
        hideAllFade(qsa(".screen"));
        this.lastTime = performance.now();
        this.gameStartTime = performance.now();
        this.animationFrame = requestAnimationFrame((time) =>
          this.update(time),
        );
        console.log(`${this.mode} 게임을 시작합니다.`);
        // showInfoModal('게임을 시작합니다!', () => { });
      });
    }
  }
  /**
   * MARK: 게임 재시작
   */
  restartGame() {
    if (window.DEBUG_MODE) console.log('[GameManager] restartGame 호출'); // 디버깅용 로그 추가
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.isGameRunning = false;
    this.lastTime = 0;

    setTimeout(() => this.startGame(), 100);
  }
  /**
   * MARK: 배경 이미지 그리기 메서드 (추가된 기능 - 하위 클래스에서 호출)
   */
  drawBackground() {
    if (window.DEBUG_MODE) console.log('[GameManager] drawBackground 호출'); // 디버깅용 로그 추가
    // 스테이지별 배경 이미지 그리기
    if (this.backgroundImageLoaded && this.backgroundImage) {
      this.ctx.drawImage(
        this.backgroundImage,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      console.log(`배경 이미지 그리기 완료!`);
    } else {
      console.error(`배경 이미지가 로드되지 않았습니다. - ${this.backgroundImageLoaded} / ${this.backgroundImage}`);
    }
    if (qs("#gameplay-screen").classList.contains('hidden')) {
      showWithFade(qs("#gameplay-screen"));
    }
  }
  /**
   * MARK: 포켓몬 체력 소모 메서드 추가
   */
  consumePokemonHealth(slotIndex) {
    if (window.DEBUG_MODE) console.log('[GameManager] consumePokemonHealth 호출', slotIndex); // 디버깅용 로그 추가
    // 체력 소모
    this.pokemonHealthSystem.currentHealth[slotIndex] -= this.pokemonHealthSystem.healthConsumption;

    // 체력이 0 이하로 떨어진 경우 기절 상태 처리
    if (this.pokemonHealthSystem.currentHealth[slotIndex] <= 0) {
      this.pokemonHealthSystem.currentHealth[slotIndex] = 0;
      this.setPokemonDizzy(slotIndex);
    }
  }  // MARK: 포켓몬 기절 상태 설정 메서드 추가 (dizzyImages 배열 활용)
  setPokemonDizzy(slotIndex) {
    if (window.DEBUG_MODE) console.log('[GameManager] setPokemonDizzy 호출', slotIndex); // 디버깅용 로그 추가
    this.pokemonHealthSystem.isDizzy[slotIndex] = true;

    const slot = document.getElementById(`slot-${slotIndex}`);
    if (!slot) return;

    // 원본 이미지 저장 (아직 저장되지 않은 경우)
    if (!this.pokemonHealthSystem.originalImages[slotIndex]) {
      this.pokemonHealthSystem.originalImages[slotIndex] = slot.style.backgroundImage;
    }

    // 포켓몬 인덱스 추출
    const bgImage = slot.style.backgroundImage;
    const indexMatch = bgImage.match(/(\d+)\.png/);
    if (!indexMatch) return;

    const pokemonIndex = parseInt(indexMatch[1]);
    const dizzyImagePath = `../assets/images/game/pokemon/potrait/dizzy/${pokemonIndex}.png`;

    // dizzyImages 배열에 이미 저장된 이미지가 있는지 확인
    if (this.pokemonHealthSystem.dizzyImages[slotIndex]) {
      // 이미 로드된 기절 이미지 사용
      slot.style.backgroundImage = `url(${dizzyImagePath})`;
      slot.style.filter = "grayscale(1)"; // 흑백 효과 적용
      console.log(`슬롯 ${slotIndex + 1} 포켓몬이 기절했습니다. 저장된 기절 이미지 사용.`);
      return;
    }

    // 기절 이미지 존재 여부 확인 및 dizzyImages 배열에 저장
    const testImage = new Image();
    testImage.onload = () => {
      // 성공적으로 로드된 경우 dizzyImages 배열에 저장
      this.pokemonHealthSystem.dizzyImages[slotIndex] = testImage;

      // 기절 이미지가 존재하는 경우 교체
      slot.style.backgroundImage = `url(${dizzyImagePath})`;
      slot.style.filter = "grayscale(1)"; // 흑백 효과 적용
      console.log(`슬롯 ${slotIndex + 1} 포켓몬이 기절했습니다. 기절 이미지로 교체됩니다.`);
    };
    testImage.onerror = () => {
      // 로드 실패한 경우 null로 표시하여 흑백 효과만 사용
      this.pokemonHealthSystem.dizzyImages[slotIndex] = null;

      // 기절 이미지가 없는 경우 흑백 효과만 적용
      slot.style.filter = "grayscale(1)"; // 흑백 효과 적용
      console.log(`슬롯 ${slotIndex + 1} 포켓몬이 기절했습니다. 흑백 효과만 적용됩니다.`);
    };
    testImage.src = dizzyImagePath;
  }

  // MARK: 포켓몬 체력 회복 메서드 추가
  healPokemonHealth(slotIndex, healAmount = 50) {
    if (window.DEBUG_MODE) console.log('[GameManager] healPokemonHealth 호출', slotIndex, healAmount); // 디버깅용 로그 추가
    // 체력 회복
    this.pokemonHealthSystem.currentHealth[slotIndex] = Math.min(
      this.pokemonHealthSystem.maxHealth[slotIndex],
      this.pokemonHealthSystem.currentHealth[slotIndex] + healAmount
    );

    // 기절 상태에서 회복된 경우 원본 이미지 복원
    if (this.pokemonHealthSystem.isDizzy[slotIndex] && this.pokemonHealthSystem.currentHealth[slotIndex] > 0) {
      this.pokemonHealthSystem.isDizzy[slotIndex] = false;

      const slot = document.getElementById(`slot-${slotIndex}`);
      if (slot && this.pokemonHealthSystem.originalImages[slotIndex]) {
        slot.style.backgroundImage = this.pokemonHealthSystem.originalImages[slotIndex];
        slot.style.filter = "none"; // 흑백 효과 제거
        console.log(`슬롯 ${slotIndex + 1} 포켓몬이 회복되었습니다.`);
      }
    }
  }
  // MARK: 포켓몬 체력바 그리기 메서드 추가
  drawPokemonHealthBars() {
    if (window.DEBUG_MODE) console.log('[GameManager] drawPokemonHealthBars 호출'); // 디버깅용 로그 추가
    // 보스전에선 그리지 않음
    if (this.stage === 4) return;

    const barWidth = 60; // 체력바 너비
    const barHeight = 6; // 체력바 높이
    const barY = this.canvas.height - 15; // 체력바 Y 위치 (슬롯 바로 아래)

    for (let i = 0; i < 4; i++) {
      // 주석 추가: 슬롯에 포켓몬이 있는지 확인하여 빈 슬롯 HP바 표시 문제 해결
      const slot = document.getElementById(`slot-${i}`);
      if (!slot || !slot.style.backgroundImage || slot.style.backgroundImage === "none") {
        continue; // 포켓몬이 없는 슬롯은 체력바를 그리지 않음
      }

      const barX = i * 64 + 2; // 각 슬롯 위치에 맞춰 체력바 위치 계산
      const healthPercentage = this.pokemonHealthSystem.currentHealth[i] / this.pokemonHealthSystem.maxHealth[i];

      // 배경 (회색 바)
      this.ctx.fillStyle = "#333333";
      this.ctx.fillRect(barX, barY, barWidth, barHeight);

      // 체력바 색상 결정 (체력에 따라 색상 변화)
      let healthColor;
      if (healthPercentage > 0.6) {
        healthColor = "#4CAF50"; // 초록색 (양호)
      } else if (healthPercentage > 0.3) {
        healthColor = "#FF9800"; // 주황색 (주의)
      } else {
        healthColor = "#F44336"; // 빨간색 (위험)
      }

      // 현재 체력바
      if (healthPercentage > 0) {
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
      }

      // 체력바 테두리
      this.ctx.strokeStyle = "#FFFFFF";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  }

  /**
   * 메인 게임 루프 - 하위 클래스에서 오버라이드
   */
  update(currentTime = 0) {
    if (window.DEBUG_MODE) console.log('[GameManager] update 호출', currentTime); // 디버깅용 로그 추가
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
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;      // 시간 초과 시 게임 종료 처리
      if (timeLeft <= 0) {
        this.isGameRunning = false;
        cancelAnimationFrame(this.animationFrame);

        // 보스전은 시간 초과 시 무조건 실패
        if (this.stage === 4) {
          this.isGameClear = false;
          this.showInGameMessage("시간 초과! 보스를 시간 내에 처치하지 못했습니다!", true);
          this.endGame();
        }
        // 벽돌깨기 게임에서 최소 점수 달성 여부 확인
        else if (this.mode === "story" && this.requiredScores) {
          const requiredScore = this.requiredScores[this.difficulty] || this.requiredScores.easy;
          if (this.score >= requiredScore) {
            // 최소 점수 달성 시 게임 클리어
            this.isGameClear = true;
            this.showInGameMessage(`⏰ 시간 종료! 목표 점수 ${requiredScore}점 달성으로 게임 클리어! 🎉`);
            setTimeout(() => {
              this.endGame();
            }, 3000);
          } else {
            // 최소 점수 미달성 시 게임 오버
            this.isGameClear = false;
            this.showInGameMessage("시간 초과! 목표 점수 미달로 게임 오버", true);
            this.endGame();
          }
        } else {
          // 기타 게임 모드는 기존 로직 유지
          this.endGame();
        }
        return;
      }
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
    if (window.DEBUG_MODE) console.log('[GameManager] endGame 호출'); // 디버깅용 로그 추가
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
    if (!window.DEBUG_GAME) {
      this.onGameEnd(result); // 게임 종료 콜백 호출
    }
  }

  // MARK: 하위 클래스에서 구현해야 할 추상 메서드들
  /**
   * 게임별 초기화 - 하위 클래스에서 구현
   */
  initializeGame() {
    if (window.DEBUG_MODE) console.log('[GameManager] initializeGame 호출'); // 디버깅용 로그 추가
    // 하위 클래스에서 구현
  }

  /**
   * 게임별 업데이트 로직 - 하위 클래스에서 구현
   */
  updateGame(timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[GameManager] updateGame 호출', timeMultiplier); // 디버깅용 로그 추가
    // 하위 클래스에서 구현
  }
}
