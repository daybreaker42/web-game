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

    // MARK: 배경 이미지 시스템
    this.backgroundImage = null;
    this.backgroundImageLoaded = false;
    // MARK: 목숨 아이콘 이미지
    this.ballIcon = new Image();
    this.ballIcon.src = "../assets/images/game/object/ball.png"; // 볼 아이콘 경로 설정
    this.ballIconLoaded = false;
    this.ballIcon.onload = () => {
      this.ballIconLoaded = true; // 볼 아이콘 로드 완료 플래그
    };

    // MARK: 포켓몬 능력 시스템
    this.pokemonAbilitySystem = {
      cooldowns: [0, 0, 0, 0], // 각 슬롯별 쿨타임 (밀리초)
      lastUsed: [0, 0, 0, 0], // 각 슬롯별 마지막 사용 시간
      defaultCooldown: 3000, // 기본 쿨타임: 3초
      throttleInterval: 200, // 입력 throttling 간격: 200ms
      lastInputTime: [0, 0, 0, 0], // 각 슬롯별 마지막 입력 시간
      cooldownTimers: [null, null, null, null], // MARK: 각 슬롯별 시각적 쿨다운 타이머 관리
    };

    // MARK: 포켓몬 체력 시스템
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

    // 생명 설정 (모드 및 난이도별) // 주석: 생명 설정 구조화
    this.livesConfig = {
      brick: { easy: 20, normal: 10, hard: 5 }, // 주석: 벽돌깨기 모드 생명 (현재는 동일)
      boss: { easy: 1000, normal: 500, hard: 250 }, // 주석: 보스전 모드 생명 (현재는 동일)
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
      this.mode = data.mode;
      this.difficulty = data.difficulty;
      this.stage = data.stage || 1;
      this.saved_pokemon = data.saved_pokemon || [];

      // Set lives according to mode and difficulty
      this.setDifficultyBydifficulty(data.difficulty);

      console.log("게임 정보 설정 완료:", this);
    } catch (error) {
      console.error("게임 정보 설정 오류:", error);
      throw error;
    }
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
    this.backgroundImage = new Image();
    this.backgroundImageLoaded = false;

    // 스테이지별 배경 이미지 경로 설정
    const backgroundPaths = {
      1: "../assets/images/background/stage1.png",
      2: "../assets/images/background/stage2.png",
      3: "../assets/images/background/stage3.png",
      4: "../assets/images/background/stage4.png"
    };

    const imagePath = backgroundPaths[stage] || backgroundPaths[1];

    this.backgroundImage.onload = () => {
      this.backgroundImageLoaded = true;
      console.log(`스테이지 ${stage} 배경 이미지 로드 완료`);
    };

    this.backgroundImage.onerror = () => {
      console.warn(`스테이지 ${stage} 배경 이미지 로드 실패: ${imagePath}`);
      this.backgroundImageLoaded = false;
    };

    this.backgroundImage.src = imagePath;
  }

  /**
   * MARK: 레벨에 따른 난이도 설정
   */
  setDifficultyBydifficulty(difficulty) {
    const gameType = this.stage >= 4 ? 'boss' : 'brick';
    const difficultyConfig = this.livesConfig[gameType];

    if (difficultyConfig && difficultyConfig[difficulty]) {
      this.lives = difficultyConfig[difficulty];
      this.totalLives = this.lives;
      console.log(`난이도 ${difficulty} 설정 완료: ${gameType} 모드, 생명력 ${this.lives}`);
    } else {
      console.warn(`Unknown difficulty: ${difficulty}, using default lives`);
    }
  }

  /**
   * 공통 게임 오브젝트 초기화
   */
  initializeGameObjects() {
    // 패들 초기화 (벽돌깨기에서 주로 사용)
    this.paddle = {
      x: (this.canvas.width - 80) / 2,
      y: this.canvas.height - this.paddleOffset,
      width: 80,
      height: 10,
      speed: 8,
    };

    // 공 초기화 (벽돌깨기에서 주로 사용)
    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height - this.paddleOffset - 20,
      radius: 8,
      dx: this.BALL_SPEED,
      dy: -this.BALL_SPEED,
      speed: this.BALL_SPEED,
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
    } else if (e.key >= "1" && e.key <= "4") {
      // MARK: 포켓몬 능력 사용 처리
      const slotIndex = parseInt(e.key) - 1;
      this.handlePokemonAbilityKey(slotIndex);
    }
  }

  /**
   * 키보드 입력 해제 처리
   */
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
      this.keys.spacePressed = false; // 스페이스바 입력 해제
    }
  }

  // MARK: 포켓몬 능력 키 입력 처리 메서드
  handlePokemonAbilityKey(slotIndex) {
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
  }

  // MARK: 포켓몬 능력 사용 메서드
  usePokemonAbility(slotIndex, pokemonIndex) {
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

    // 체력 소모 처리
    this.pokemonHealthSystem.currentHealth[slotIndex] -= this.pokemonHealthSystem.healthConsumption;

    if (this.pokemonHealthSystem.currentHealth[slotIndex] <= 0) {
      this.pokemonHealthSystem.currentHealth[slotIndex] = 0;
      this.pokemonHealthSystem.isDizzy[slotIndex] = true;

      // 기절 상태 이미지로 변경
      const slot = document.getElementById(`slot-${slotIndex}`);
      if (slot) {
        // 원본 이미지 저장 (아직 저장되지 않은 경우에만)
        if (!this.pokemonHealthSystem.originalImages[slotIndex]) {
          this.pokemonHealthSystem.originalImages[slotIndex] = slot.style.backgroundImage;
        }

        // 기절 이미지로 변경
        const dizzyImagePath = `url('../assets/images/pokemon/${pokemonIndex}_dizzy.png')`;
        slot.style.backgroundImage = dizzyImagePath;
        this.pokemonHealthSystem.dizzyImages[slotIndex] = dizzyImagePath;
      }

      console.log(`슬롯 ${slotIndex + 1} 포켓몬이 기절했습니다!`);
    }

    // 쿨타임 설정 및 시각적 효과 시작 // MARK: 시각적 쿨다운 효과 연동
    this.pokemonAbilitySystem.lastUsed[slotIndex] = currentTime;
    this.startCooldownVisualEffect(slotIndex); // MARK: 시각적 쿨다운 효과 시작

    // 타입별 특수 효과 (게임 로직에 따라 구현)
    switch (pokemonType) {
      case 0: // 풀타입
        console.log("풀타입 능력: 체력 회복 효과!");
        break;
      case 1: // 불타입
        console.log("불타입 능력: 화염 공격!");
        break;
      case 2: // 전기타입
        console.log("전기타입 능력: 전기 공격!");
        break;
      case 3: // 물타입
        console.log("물타입 능력: 물 공격!");
        break;
      case 4: // 얼음타입
        console.log("얼음타입 능력: 얼음 공격!");
        break;
      default:
        console.log("알 수 없는 타입의 능력!");
        break;
    }

    // 체력 UI 업데이트
    this.updateHealthUI(slotIndex);
  }

  // MARK: 쿨다운 시각적 효과 시작 메서드
  startCooldownVisualEffect(slotIndex) {
    const slotFrame = document.getElementById(`slot-frame-${slotIndex}`);
    if (!slotFrame) return;

    // 쿨다운 클래스 및 능력 준비 클래스 제거
    slotFrame.classList.add('cooldown');
    slotFrame.classList.remove('ability-ready');

    // 기존 쿨다운 타이머가 있다면 제거 (중복 방지)
    if (this.pokemonAbilitySystem.cooldownTimers && this.pokemonAbilitySystem.cooldownTimers[slotIndex]) {
      clearInterval(this.pokemonAbilitySystem.cooldownTimers[slotIndex]);
    }

    // 쿨다운 타이머 배열 초기화 (처음 실행 시)
    if (!this.pokemonAbilitySystem.cooldownTimers) {
      this.pokemonAbilitySystem.cooldownTimers = [null, null, null, null];
    }

    // 쿨다운 진행률 업데이트를 위한 타이머 설정
    const startTime = performance.now();
    const updateInterval = 50; // 50ms마다 업데이트 (부드러운 애니메이션)

    this.pokemonAbilitySystem.cooldownTimers[slotIndex] = setInterval(() => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.pokemonAbilitySystem.defaultCooldown, 1);

      // CSS 변수로 진행률 설정 (360도 기준)
      const progressDegrees = progress * 360;
      slotFrame.style.setProperty('--cooldown-progress', `${progressDegrees}deg`);

      // 쿨다운 완료 체크
      if (progress >= 1) {
        this.endCooldownVisualEffect(slotIndex);
      }
    }, updateInterval);
  }

  // MARK: 쿨다운 시각적 효과 종료 메서드  
  endCooldownVisualEffect(slotIndex) {
    const slotFrame = document.getElementById(`slot-frame-${slotIndex}`);
    if (!slotFrame) return;

    // 쿨다운 타이머 정리
    if (this.pokemonAbilitySystem.cooldownTimers && this.pokemonAbilitySystem.cooldownTimers[slotIndex]) {
      clearInterval(this.pokemonAbilitySystem.cooldownTimers[slotIndex]);
      this.pokemonAbilitySystem.cooldownTimers[slotIndex] = null;
    }

    // 쿨다운 클래스 제거 및 능력 준비 클래스
    slotFrame.classList.remove('cooldown');
    slotFrame.style.removeProperty('--cooldown-progress');

    // 포켓몬이 있고 기절 상태가 아니면 능력 준비 상태로 설정
    const slot = document.getElementById(`slot-${slotIndex}`);
    if (slot && slot.style.backgroundImage && slot.style.backgroundImage !== "none" &&
      !this.pokemonHealthSystem.isDizzy[slotIndex]) {
      slotFrame.classList.add('ability-ready');
    }
  }

  // MARK: 게임 시작 시 모든 슬롯의 쿨다운 상태 초기화 메서드
  initializeCooldownVisualEffects() {
    for (let i = 0; i < 4; i++) {
      this.endCooldownVisualEffect(i);
    }
  }

  // MARK: 슬롯에 포켓몬이 배치될 때 호출되는 메서드 (기존 코드에서 호출해야 함)
  onPokemonSlotUpdated(slotIndex) {
    const slot = document.getElementById(`slot-${slotIndex}`);
    const slotFrame = document.getElementById(`slot-frame-${slotIndex}`);

    if (!slot || !slotFrame) return;

    // 포켓몬이 있는지 확인
    const hasPokemon = slot.style.backgroundImage && slot.style.backgroundImage !== "none";
    const isDizzy = this.pokemonHealthSystem.isDizzy[slotIndex];
    const isOnCooldown = this.isCooldownActive(slotIndex);

    if (hasPokemon && !isDizzy && !isOnCooldown) {
      // 포켓몬이 있고, 기절하지 않았고, 쿨다운이 아니면 능력 준비 상태
      slotFrame.classList.add('ability-ready');
    } else {
      // 그 외의 경우는 능력 준비 상태 해제
      slotFrame.classList.remove('ability-ready');
    }
  }

  // MARK: 쿨다운 활성 상태 체크 헬퍼 메서드
  isCooldownActive(slotIndex) {
    const currentTime = performance.now();
    return (currentTime - this.pokemonAbilitySystem.lastUsed[slotIndex]) < this.pokemonAbilitySystem.defaultCooldown;
  }

  /**
   * 체력 UI 업데이트 메서드
   */
  updateHealthUI(slotIndex) {
    const healthBar = document.querySelector(`#slot-${slotIndex} .health-bar`);
    if (healthBar) {
      const healthPercentage = (this.pokemonHealthSystem.currentHealth[slotIndex] / this.pokemonHealthSystem.maxHealth[slotIndex]) * 100;
      healthBar.style.width = `${healthPercentage}%`;

      // 체력에 따른 색상 변경
      if (healthPercentage > 60) {
        healthBar.style.backgroundColor = '#4CAF50'; // 녹색
      } else if (healthPercentage > 30) {
        healthBar.style.backgroundColor = '#FF9800'; // 주황색
      } else {
        healthBar.style.backgroundColor = '#F44336'; // 빨간색
      }
    }
  }

  /**
   * 아이템 사용 처리 메서드
   */
  useItemOnSlot(slotIndex, itemType) {
    if (itemType === 'potion') {
      // 회복 물약 사용
      if (this.pokemonHealthSystem.isDizzy[slotIndex]) {
        // 기절 상태 해제
        this.pokemonHealthSystem.isDizzy[slotIndex] = false;
        this.pokemonHealthSystem.currentHealth[slotIndex] = this.pokemonHealthSystem.maxHealth[slotIndex];

        // 원본 이미지로 복구
        const slot = document.getElementById(`slot-${slotIndex}`);
        if (slot && this.pokemonHealthSystem.originalImages[slotIndex]) {
          slot.style.backgroundImage = this.pokemonHealthSystem.originalImages[slotIndex];
          this.pokemonHealthSystem.originalImages[slotIndex] = null;
          this.pokemonHealthSystem.dizzyImages[slotIndex] = null;
        }

        console.log(`슬롯 ${slotIndex + 1} 포켓몬이 회복되었습니다!`);

        // MARK: 회복 시 슬롯 상태 업데이트
        this.onPokemonSlotUpdated(slotIndex);
      } else {
        // 일반 체력 회복
        this.pokemonHealthSystem.currentHealth[slotIndex] = Math.min(
          this.pokemonHealthSystem.currentHealth[slotIndex] + 50,
          this.pokemonHealthSystem.maxHealth[slotIndex]
        );
        console.log(`슬롯 ${slotIndex + 1} 포켓몬 체력이 회복되었습니다!`);
      }

      this.updateHealthUI(slotIndex);
    }
  }

  /**
   * 게임 상태 관리 메서드들
   */
  startGame() {
    this.isGameRunning = true;
    this.gameStartTime = performance.now();
    this.totalPauseDuration = 0;
    console.log("게임 시작!");
  }

  pauseGame() {
    if (this.isGameRunning && !this.isPaused) {
      this.isPaused = true;
      this.pauseStartTime = performance.now();
      console.log("게임 일시정지");
    }
  }

  resumeGame() {
    if (this.isGameRunning && this.isPaused) {
      this.isPaused = false;
      this.totalPauseDuration += performance.now() - this.pauseStartTime;
      console.log("게임 재개");
    }
  }

  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  stopGame() {
    this.isGameRunning = false;
    this.isPaused = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    console.log("게임 종료");
  }

  /**
   * 게임 루프 메서드 (각 게임 모드에서 오버라이드)
   */
  gameLoop() {
  // 기본 게임 루프 - 각 게임 모드에서 구현
  }

  /**
   * 렌더링 메서드 (각 게임 모드에서 오버라이드)
   */
  render() {
  // 기본 렌더링 - 각 게임 모드에서 구현
  }

  /**
   * 마우스 이동 처리
   */
  mouseMoveHandler(e) {
    if (this.isGameRunning && !this.isPaused && this.paddle) {
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const scaleX = this.canvas.width / rect.width;
      this.paddle.x = (relativeX * scaleX) - (this.paddle.width / 2);

      // 패들이 화면 밖으로 나가지 않도록 제한
      if (this.paddle.x < 0) {
        this.paddle.x = 0;
      } else if (this.paddle.x > this.canvas.width - this.paddle.width) {
        this.paddle.x = this.canvas.width - this.paddle.width;
      }
    }
  }
}