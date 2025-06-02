/**
 * BossGame class
 * - GameManager를 상속받아 보스전 탄막 게임을 구현
 * - 플레이어는 2D 평면에서 회전/가속으로 이동하며 공을 발사
 * - 보스는 탄막을 발사하고 플레이어 공에 맞으면 체력 감소
 */
class BossGame extends GameManager {
  constructor(canvas) {
    if (window.DEBUG_MODE) console.log('[BossGame] constructor 호출', canvas); // 디버깅용 로그 추가
    super(canvas);

    // MARK: 보스전 전용 설정
    this.bossMaxHealth = 1000;
    this.bossHealth = this.bossMaxHealth;

    // MARK: 플레이어 설정
    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 50,
      power: PLAYER_POWER, // 플레이어 공격력
      rotation: 0, // 라디안 단위
      velocityX: 0,
      velocityY: 0,
      maxSpeed: 8,
      acceleration: 0.3,
      rotationSpeed: 0.08,
      friction: 0.95,
      radius: 15,
      color: "#00ff00",
    };

    // MARK: 보스 설정
    this.boss = {
      x: this.canvas.width / 2,
      y: 100,
      width: 120, // 초기 너비, 이미지 로드 후 변경될 수 있음
      height: 80, // 초기 높이, 이미지 로드 후 변경될 수 있음
      health: this.bossMaxHealth,
      maxHealth: this.bossMaxHealth,
      color: "#ff0000", // 이미지 로드 실패 시 폴백 색상
      lastAttackTime: 0,
      attackCooldown: 1000, // 1초마다 공격
      bulletSpeed: 3,
      name: "뮤츠",
      description: "전설의 포켓몬, 강력한 정신 공격을 사용합니다.",
      // 페이즈 시스템 추가
      currentPhase: 1, // 현재 페이즈 (1 또는 2)
      phase2Triggered: false, // 2페이즈 전환 여부
      lastMoveTime: 0, // 마지막 이동 시간
      moveCooldown: 3000, // 3초마다 이동
      isMoving: false, // 이동 중인지 여부
      moveStartTime: 0, // 이동 시작 시간
      moveDuration: 500, // 이동 지속 시간 (0.5초)
      startX: 0, // 이동 시작 X 좌표
      startY: 0, // 이동 시작 Y 좌표
      targetX: 0, // 이동 목표 X 좌표
      targetY: 0, // 이동 목표 Y 좌표
      image: new Image(), // 보스 이미지 객체 추가
      imageLoaded: false, // 이미지 로드 완료 플래그 추가
      imagePath: "../assets/images/game/boss/mewtwo_normal_1.png", // 보스 이미지 상대 경로 추가
      imageHurt: new Image(), // 피격 시 이미지 객체 추가
      imageHurtLoaded: false, // 피격 이미지 로드 완료 플래그 추가
      imagePathHurt: "../assets/images/game/boss/mewtwo_hurt_1.png", // 피격 이미지 경로 추가
      imageAttack: new Image(), // 공격 시 이미지 객체 추가
      imageAttackLoaded: false, // 공격 이미지 로드 완료 플래그 추가
      imagePathAttack: "../assets/images/game/boss/mewtwo_attack_1.png", // 공격 이미지 경로 추가
      isHurt: false, // 현재 피격 애니메이션 중인지 여부
      hurtEndTime: 0, // 피격 애니메이션 종료 시간
      hurtAnimationDuration: 200, // 피격 애니메이션 지속 시간 (ms) // 주석 추가: 피격 애니메이션 지속 시간 명시
      isAttacking: false, // 현재 공격 애니메이션 중인지 여부
      attackAnimEndTime: 0, // 공격 애니메이션 종료 시간
      attackAnimationDuration: 300, // 공격 애니메이션 지속 시간 (ms)
    };
    this.boss.image.src = this.boss.imagePath;
    this.boss.image.onload = () => {
      this.boss.imageLoaded = true;
      this.adjustBossImageSize(this.boss.image); // 이미지 크기 조정 함수 호출 // 주석 수정: 이전에 이 위치에 직접 로직이 있었음
      console.log(
        `보스 일반 이미지 로드 완료. 크기: ${this.boss.width}x${this.boss.height}`,
      );
    };
    this.boss.image.onerror = () => {
      console.error(`보스 일반 이미지 로드 실패: ${this.boss.imagePath}`);
      this.boss.imageLoaded = false;
    };

    this.boss.imageHurt.src = this.boss.imagePathHurt; // 피격 이미지 로드
    this.boss.imageHurt.onload = () => {
      this.boss.imageHurtLoaded = true;
      console.log("보스 피격 이미지 로드 완료.");
    };
    this.boss.imageHurt.onerror = () => {
      console.error(`보스 피격 이미지 로드 실패: ${this.boss.imagePathHurt}`);
    };

    this.boss.imageAttack.src = this.boss.imagePathAttack; // 공격 이미지 로드
    this.boss.imageAttack.onload = () => {
      this.boss.imageAttackLoaded = true;
      console.log("보스 공격 이미지 로드 완료.");
    };
    this.boss.imageAttack.onerror = () => {
      console.error(`보스 공격 이미지 로드 실패: ${this.boss.imagePathAttack}`);
    };

    // MARK: 총알 시스템
    this.playerBullets = []; // 플레이어가 발사한 총알
    this.bossBullets = []; // 보스가 발사한 탄막
    this.laserBullets = []; // 레이저 공격용 총알 배열 추가
    this.playerLastShotTime = 0;
    this.playerShotCooldown = 500; // 0.5초마다 자동 발사

    // MARK: 추가 키 설정
    this.keys.upPressed = false;
    this.keys.downPressed = false;

    // // MARK: 포켓몬 능력 효과 상태 변수 추가
    // this.electricBoostActive = false; // 전기타입 능력 (점수 2배) 활성 상태
    // this.waterBoostActive = false; // 물타입 능력 (플레이어 속도 증가) 활성 상태  
    // this.iceBoostActive = false; // 얼음타입 능력 (보스 이동 속도 감소) 활성 상태

    // 사운드 설정
    this.bossHitSound = new Audio("../assets/sounds/sfx/mewtwo.ogg"); // 피격 사운드 파일 경로
    this.bossHitSound.volume = 0.5; // 사운드 볼륨 설정 (0.0 ~ 1.0)
    this.lastHitSoundTime = 0; // 마지막 사운드 재생 시간 (throttling용)
    this.HIT_SOUND_THROTTLE_MS = 1200; // 사운드 재생 최소 간격 (밀리초)
    this.lastHurtAnimationTime = 0; // 마지막 피격 애니메이션 시작 시간 (throttling용)
    this.HURT_ANIMATION_THROTTLE_MS = 200; // 피격 애니메이션 최소 간격 (밀리초)
  }

  /**
   * 키보드 입력 처리 오버라이드
   */
  keyDownHandler(e) {
    if (window.DEBUG_MODE) console.log('[BossGame] keyDownHandler 호출', e.key); // 디버깅용 로그 추가
    super.keyDownHandler(e); // 부모 클래스의 기본 처리 먼저 수행        // 보스전 전용 키 처리
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      this.keys.upPressed = true;
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      this.keys.downPressed = true;
    }
    // 스페이스바 발사 기능 제거 - 자동 발사로 변경
  }

  /**
   * 키보드 키 눌림 이벤트 처리 (WASD 키 지원 추가)
   */
  keyDownHandler(e) {
    if (window.DEBUG_MODE) console.log('[BossGame] keyDownHandler(WASD) 호출', e.key); // 디버깅용 로그 추가
    // 부모 클래스의 기본 키 처리 호출
    super.keyDownHandler(e);

    // WASD 키 지원 추가
    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
      this.keys.upPressed = true; // W키로 앞으로 가속
    }
    if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
      this.keys.downPressed = true; // S키로 뒤로 가속
    }
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
      this.keys.leftPressed = true; // A키로 좌회전
    }
    if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
      this.keys.rightPressed = true; // D키로 우회전
    }
  }

  /**
   * 키보드 키 해제 이벤트 처리 (WASD 키 지원 추가)
   * @param {KeyboardEvent} e - 키보드 이벤트
   */
  keyUpHandler(e) {
    if (window.DEBUG_MODE) console.log('[BossGame] keyUpHandler 호출', e.key); // 디버깅용 로그 추가
    // 부모 클래스의 기본 키 처리 호출
    super.keyUpHandler(e);

    // WASD 키 지원 추가
    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
      this.keys.upPressed = false; // W키 해제
    }
    if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
      this.keys.downPressed = false; // S키 해제
    }
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
      this.keys.leftPressed = false; // A키 해제
    }
    if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
      this.keys.rightPressed = false; // D키 해제
    }
  }

  /**
   * MARK: 게임별 초기화
   */
  initializeGame() {
    if (window.DEBUG_MODE) console.log('[BossGame] initializeGame 호출'); // 디버깅용 로그 추가
    // 플레이어 초기 위치 설정
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height - 50;
    this.player.rotation = 0;
    this.player.velocityX = 0;
    this.player.velocityY = 0;

    // 보스 초기화
    this.boss.health = this.boss.maxHealth;
    this.boss.lastAttackTime = 0;
    this.boss.currentPhase = 1; // 페이즈 1로 초기화
    this.boss.phase2Triggered = false; // 2페이즈 전환 플래그 초기화
    this.boss.lastMoveTime = 0; // 마지막 이동 시간 초기화
    this.boss.isMoving = false; // 이동 상태 초기화

    // 총알 배열 초기화
    this.playerBullets = [];
    this.bossBullets = [];
    this.laserBullets = []; // 레이저 총알 배열 초기화
    this.playerLastShotTime = 0;

    // 보스전에서 포켓몬 슬롯 숨기기
    document.body.classList.add('boss-mode');
    const slotContainer = document.getElementById('pokemon-slot-container');
    const slotFrameContainer = document.getElementById('pokemon-slot-frame-container');
    if (slotContainer) slotContainer.style.display = 'none';
    if (slotFrameContainer) slotFrameContainer.style.display = 'none';
  }

  /**
   * 게임별 업데이트 로직
   */
  updateGame(timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updateGame 호출', timeMultiplier); // 디버깅용 로그 추가
    this.updatePlayer(timeMultiplier);
    this.updatePlayerBullets(timeMultiplier);
    this.updateBoss(timeMultiplier);
    this.updateBossBullets(timeMultiplier);
    this.updateLaserBullets(timeMultiplier); // 레이저 총알 업데이트 추가
    this.checkCollisions();
    this.checkGameEnd();

    // 모든 객체 그리기
    this.drawPlayer();
    this.drawBoss();
    this.drawPlayerBullets();
    this.drawBossBullets();
    this.drawLaserBullets(); // 레이저 총알 그리기 추가
    this.drawHealthBars();
  }

  /**
   * MARK: 플레이어 업데이트
   */
  updatePlayer(timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updatePlayer 호출', timeMultiplier); // 디버깅용 로그 추가

    // 자동 발사 처리
    this.shootPlayerBullet();

    // 회전 처리
    if (this.keys.leftPressed) {
      this.player.rotation -= this.player.rotationSpeed * timeMultiplier;
    }
    if (this.keys.rightPressed) {
      this.player.rotation += this.player.rotationSpeed * timeMultiplier;
    }

    // 가속도 처리 (앞/뒤 이동)
    if (this.keys.upPressed) {
      // 현재 회전 방향으로 가속
      this.player.velocityX +=
        Math.cos(this.player.rotation) *
        this.player.acceleration *
        timeMultiplier;
      this.player.velocityY +=
        Math.sin(this.player.rotation) *
        this.player.acceleration *
        timeMultiplier;
    }
    if (this.keys.downPressed) {
      // 현재 회전 반대 방향으로 가속 (후진)
      this.player.velocityX -=
        Math.cos(this.player.rotation) *
        this.player.acceleration *
        timeMultiplier;
      this.player.velocityY -=
        Math.sin(this.player.rotation) *
        this.player.acceleration *
        timeMultiplier;
    }

    // 최대 속도 제한
    const speed = Math.sqrt(
      this.player.velocityX ** 2 + this.player.velocityY ** 2,
    );
    if (speed > this.player.maxSpeed) {
      this.player.velocityX =
        (this.player.velocityX / speed) * this.player.maxSpeed;
      this.player.velocityY =
        (this.player.velocityY / speed) * this.player.maxSpeed;
    }

    // 마찰력 적용
    this.player.velocityX *= Math.pow(this.player.friction, timeMultiplier);
    this.player.velocityY *= Math.pow(this.player.friction, timeMultiplier);

    // 위치 업데이트
    this.player.x += this.player.velocityX * timeMultiplier;
    this.player.y += this.player.velocityY * timeMultiplier;

    // 화면 경계 처리
    this.player.x = Math.max(
      this.player.radius,
      Math.min(this.canvas.width - this.player.radius, this.player.x),
    );
    this.player.y = Math.max(
      this.player.radius,
      Math.min(this.canvas.height - this.player.radius, this.player.y),
    );
  }

  /**
   * MARK: 플레이어 총알 발사
   */
  shootPlayerBullet() {
    if (window.DEBUG_MODE) console.log('[BossGame] shootPlayerBullet 호출'); // 디버깅용 로그 추가
    const currentTime = performance.now();
    if (currentTime - this.playerLastShotTime >= this.playerShotCooldown) {
      // 플레이어 앞 방향으로 총알 발사
      const bulletSpeed = 10;
      this.playerBullets.push({
        x: this.player.x + Math.cos(this.player.rotation) * this.player.radius,
        y: this.player.y + Math.sin(this.player.rotation) * this.player.radius,
        velocityX: Math.cos(this.player.rotation) * bulletSpeed,
        velocityY: Math.sin(this.player.rotation) * bulletSpeed,
        radius: 4,
        color: "#ffff00",
      });
      this.playerLastShotTime = currentTime;
    }
  }

  /**
   * 플레이어 총알 업데이트
   */
  updatePlayerBullets(timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updatePlayerBullets 호출', timeMultiplier); // 디버깅용 로그 추가
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];

      // 총알 이동
      bullet.x += bullet.velocityX * timeMultiplier;
      bullet.y += bullet.velocityY * timeMultiplier;

      // 화면 밖으로 나간 총알 제거
      if (
        bullet.x < 0 ||
        bullet.x > this.canvas.width ||
        bullet.y < 0 ||
        bullet.y > this.canvas.height
      ) {
        this.playerBullets.splice(i, 1);
      }
    }
  }

  /**
   * MARK: 보스 업데이트
   */
  updateBoss(timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updateBoss 호출', timeMultiplier); // 디버깅용 로그 추가

    const currentTime = performance.now();

    // 페이즈 2 전환 체크
    if (
      !this.boss.phase2Triggered &&
      this.boss.health <= this.boss.maxHealth * 0.3
    ) {
      this.triggerPhase2(); // 페이즈 2로 전환
    }

    // 페이즈별 업데이트
    if (this.boss.currentPhase === 1) {
      this.updatePhase1(currentTime, timeMultiplier);
    } else if (this.boss.currentPhase === 2) {
      this.updatePhase2(currentTime, timeMultiplier);
    }
  }
  /**
   * MARK: 페이즈 1 업데이트 (일반 이동 + 전방향 공격)
   */
  updatePhase1(currentTime, timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updatePhase1 호출', currentTime, timeMultiplier); // 디버깅용 로그 추가

    // MARK: 얼음타입 능력 적용 - 보스 이동 쿨다운 증가
    const effectiveMoveCooldown = this.iceBoostActive
      ? this.boss.moveCooldown * 2 // 얼음타입 능력 시 이동 쿨다운 2배 증가
      : this.boss.moveCooldown;

    // 이동 처리
    if (
      !this.boss.isMoving &&
      currentTime - this.boss.lastMoveTime >= effectiveMoveCooldown
    ) {
      this.startBossMove(); // 보스 이동 시작
    }

    if (this.boss.isMoving) {
      this.updateBossMovement(currentTime, timeMultiplier); // 보스 이동 업데이트
    }

    // 공격 처리 (이동 중이 아닐 때만)
    if (
      !this.boss.isMoving &&
      currentTime - this.boss.lastAttackTime >= this.boss.attackCooldown
    ) {
      this.shootBossBullets(); // 전방향 공격
      this.boss.lastAttackTime = currentTime;
    }
  }
  /**
   * MARK: 페이즈 2 업데이트 (순간이동 + 플레이어 조준 공격)
   */
  updatePhase2(currentTime, timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updatePhase2 호출', currentTime, timeMultiplier); // 디버깅용 로그 추가

    // MARK: 얼음타입 능력 적용 - 페이즈 2 이동 쿨다운도 증가
    const phase2MoveCooldown = this.iceBoostActive
      ? 4000 // 얼음타입 능력 시 4초마다 이동 (기존 2초에서 2배 증가)
      : 2000; // 기본 2초마다 이동

    // 순간이동 처리 (페이즈 2에서는 더 자주 이동)
    if (
      !this.boss.isMoving &&
      currentTime - this.boss.lastMoveTime >= phase2MoveCooldown
    ) {
      this.startBossTeleport(); // 보스 순간이동 시작
    }

    if (this.boss.isMoving) {
      this.updateBossTeleport(currentTime); // 순간이동 업데이트
    }

    // 공격 처리 (이동 중이 아닐 때만, 더 빠른 공격)
    const phase2AttackCooldown = 800; // 0.8초마다 공격
    if (
      !this.boss.isMoving &&
      currentTime - this.boss.lastAttackTime >= phase2AttackCooldown
    ) {
      this.shootTargetedBullets(); // 플레이어 조준 공격
      this.boss.lastAttackTime = currentTime;
    }
  }

  /**
   * MARK: 페이즈 2 전환 처리
   */
  triggerPhase2() {
    if (window.DEBUG_MODE) console.log('[BossGame] triggerPhase2 호출'); // 디버깅용 로그 추가
    this.boss.phase2Triggered = true;
    this.boss.currentPhase = 2;
    this.boss.color = "#8b0000"; // 보스 색깔 변경 (더 어두운 빨간색)

    // 레이저 공격 발사
    this.shootLaserAttack();

    // 페이즈 전환 메시지 표시
    this.showInGameMessage("보스 페이즈 2! 더욱 강해졌다!", true);
  }

  /**
   * MARK: 보스 이동 시작 (페이즈 1)
   */
  startBossMove() {
    if (window.DEBUG_MODE) console.log('[BossGame] startBossMove 호출'); // 디버깅용 로그 추가
    // 랜덤한 목표 위치 설정 (화면 상단 1/3 영역 내)
    const margin = 60; // 화면 가장자리 여백
    this.boss.startX = this.boss.x;
    this.boss.startY = this.boss.y;
    this.boss.targetX =
      margin + Math.random() * (this.canvas.width - 2 * margin);
    this.boss.targetY =
      margin + Math.random() * (this.canvas.height / 3 - margin);

    this.boss.isMoving = true;
    this.boss.moveStartTime = performance.now();
  }
  /**
   * MARK: 보스 이동 업데이트 (페이즈 1)
   */
  updateBossMovement(currentTime, timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updateBossMovement 호출', currentTime, timeMultiplier); // 디버깅용 로그 추가
    const elapsed = currentTime - this.boss.moveStartTime;

    // MARK: 얼음타입 능력 적용 - 보스 이동 지속시간 증가 (속도 감소 효과)
    const effectiveMoveDuration = this.iceBoostActive
      ? this.boss.moveDuration * 2 // 얼음타입 능력 시 이동시간 2배 증가 (속도 50% 감소)
      : this.boss.moveDuration;

    const progress = Math.min(elapsed / effectiveMoveDuration, 1);

    // 부드러운 이동을 위한 easing 함수 적용
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    // 현재 위치 계산
    this.boss.x =
      this.boss.startX + (this.boss.targetX - this.boss.startX) * easeProgress;
    this.boss.y =
      this.boss.startY + (this.boss.targetY - this.boss.startY) * easeProgress;

    // 이동 완료 처리
    if (progress >= 1) {
      this.boss.isMoving = false;
      this.boss.lastMoveTime = currentTime;
    }
  }

  /**
   * MARK: 보스 순간이동 시작 (페이즈 2)
   */
  startBossTeleport() {
    if (window.DEBUG_MODE) console.log('[BossGame] startBossTeleport 호출'); // 디버깅용 로그 추가
    // 랜덤한 위치로 순간이동
    const margin = 60;
    this.boss.targetX =
      margin + Math.random() * (this.canvas.width - 2 * margin);
    this.boss.targetY =
      margin + Math.random() * (this.canvas.height / 3 - margin);

    this.boss.isMoving = true;
    this.boss.moveStartTime = performance.now();
    this.boss.moveDuration = 100; // 순간이동은 매우 빠르게 (0.1초)
  }

  /**
   * MARK: 보스 순간이동 업데이트 (페이즈 2)
   */
  updateBossTeleport(currentTime) {
    if (window.DEBUG_MODE) console.log('[BossGame] updateBossTeleport 호출', currentTime); // 디버깅용 로그 추가
    const elapsed = currentTime - this.boss.moveStartTime;
    const progress = elapsed / this.boss.moveDuration;

    if (progress >= 1) {
      // 순간이동 완료
      this.boss.x = this.boss.targetX;
      this.boss.y = this.boss.targetY;
      this.boss.isMoving = false;
      this.boss.lastMoveTime = currentTime;
      this.boss.moveDuration = 500; // 다음 이동을 위해 지속시간 복구
    }
  }

  /**
   * MARK: 레이저 공격 (페이즈 전환 시)
   */
  shootLaserAttack() {
    if (window.DEBUG_MODE) console.log('[BossGame] shootLaserAttack 호출'); // 디버깅용 로그 추가
    const rayCount = 16; // 16방향으로 레이저 발사
    const angleStep = (Math.PI * 2) / rayCount;

    for (let i = 0; i < rayCount; i++) {
      const angle = i * angleStep;
      const laserSpeed = 8; // 레이저는 더 빠르게

      this.laserBullets.push({
        x: this.boss.x,
        y: this.boss.y + this.boss.height / 2,
        velocityX: Math.cos(angle) * laserSpeed,
        velocityY: Math.sin(angle) * laserSpeed,
        radius: 8, // 레이저는 더 크게
        color: "#ff00ff", // 보라색 레이저
        damage: 15, // 레이저는 더 강한 데미지
      });
    }
    this.boss.isAttacking = true; // 공격 상태 설정
    this.boss.attackAnimEndTime =
      performance.now() + this.boss.attackAnimationDuration; // 공격 애니메이션 종료 시간 설정
  }

  /**
   * MARK: 플레이어 조준 공격 (페이즈 2)
   */
  shootTargetedBullets() {
    if (window.DEBUG_MODE) console.log('[BossGame] shootTargetedBullets 호출'); // 디버깅용 로그 추가
    // 플레이어 방향으로 3발 발사 (중앙 + 좌우 약간 벗어난 각도)
    const dx = this.player.x - this.boss.x;
    const dy = this.player.y - (this.boss.y + this.boss.height / 2);
    const baseAngle = Math.atan2(dy, dx);
    const bulletLifespan = 5000; // 총알 수명: 5000ms (5초)

    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * 0.3; // 약 17도씩 벗어나게
      const bulletSpeed = 5;

      this.bossBullets.push({
        x: this.boss.x,
        y: this.boss.y + this.boss.height / 2,
        velocityX: Math.cos(angle) * bulletSpeed,
        velocityY: Math.sin(angle) * bulletSpeed,
        radius: 6,
        color: "#ff4400", // 주황색으로 조준 공격 구분
        lifespan: bulletLifespan, // 수명 속성 추가
      });
    }
    this.boss.isAttacking = true; // 공격 상태 설정
    this.boss.attackAnimEndTime =
      performance.now() + this.boss.attackAnimationDuration; // 공격 애니메이션 종료 시간 설정
  }

  /**
   * MARK: 보스 탄막 발사
   */
  shootBossBullets() {
    if (window.DEBUG_MODE) console.log('[BossGame] shootBossBullets 호출'); // 디버깅용 로그 추가
    const bulletCount = 8; // 8방향으로 탄막 발사
    const angleStep = (Math.PI * 2) / bulletCount;
    const bulletLifespan = 5000; // 총알 수명: 5000ms (5초)

    for (let i = 0; i < bulletCount; i++) {
      const angle = i * angleStep;
      this.bossBullets.push({
        x: this.boss.x,
        y: this.boss.y + this.boss.height / 2,
        velocityX: Math.cos(angle) * this.boss.bulletSpeed,
        velocityY: Math.sin(angle) * this.boss.bulletSpeed,
        radius: 6,
        color: "#ff8800",
        lifespan: bulletLifespan, // 수명 속성 추가
      });
    }
    this.boss.isAttacking = true; // 공격 상태 설정
    this.boss.attackAnimEndTime =
      performance.now() + this.boss.attackAnimationDuration; // 공격 애니메이션 종료 시간 설정
  }

  /**
   * MARK: 보스 탄막 업데이트
   */
  updateBossBullets(timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updateBossBullets 호출', timeMultiplier); // 디버깅용 로그 추가
    const deltaTime = timeMultiplier * this.FRAME_DELAY; // 실제 경과 시간 계산

    for (let i = this.bossBullets.length - 1; i >= 0; i--) {
      const bullet = this.bossBullets[i];

      // 탄막 이동
      bullet.x += bullet.velocityX * timeMultiplier;
      bullet.y += bullet.velocityY * timeMultiplier;

      // 수명 감소
      if (bullet.lifespan !== undefined) {
        // lifespan 속성이 있는 경우에만 처리
        bullet.lifespan -= deltaTime;
      }

      // 화면 밖으로 나간 탄막 또는 수명이 다한 탄막 제거 // 주석 수정
      if (
        bullet.x < -50 ||
        bullet.x > this.canvas.width + 50 ||
        bullet.y < -50 ||
        bullet.y > this.canvas.height + 50 ||
        (bullet.lifespan !== undefined && bullet.lifespan <= 0)
      ) {
        // 수명 체크 조건 추가
        this.bossBullets.splice(i, 1);
      }
    }
  }

  /**
   * MARK: 레이저 총알 업데이트
   */
  updateLaserBullets(timeMultiplier) {
    if (window.DEBUG_MODE) console.log('[BossGame] updateLaserBullets 호출', timeMultiplier); // 디버깅용 로그 추가
    for (let i = this.laserBullets.length - 1; i >= 0; i--) {
      const bullet = this.laserBullets[i];

      // 레이저 이동
      bullet.x += bullet.velocityX * timeMultiplier;
      bullet.y += bullet.velocityY * timeMultiplier;

      // 화면 밖으로 나간 레이저 제거
      if (
        bullet.x < -100 ||
        bullet.x > this.canvas.width + 100 ||
        bullet.y < -100 ||
        bullet.y > this.canvas.height + 100
      ) {
        this.laserBullets.splice(i, 1);
      }
    }
  }

  /**
   * MARK: 충돌 감지
   */
  checkCollisions() {
    if (window.DEBUG_MODE) console.log('[BossGame] checkCollisions 호출'); // 디버깅용 로그 추가
    // 플레이어 총알과 보스 충돌
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];

      if (
        bullet.x >= this.boss.x - this.boss.width / 2 &&
        bullet.x <= this.boss.x + this.boss.width / 2 &&
        bullet.y >= this.boss.y && // Y 좌표는 이미지 상단 기준
        bullet.y <= this.boss.y + this.boss.height
      ) {
        // Y 좌표는 이미지 상단 기준        // 보스 체력 감소
        this.boss.health -= this.player.power;

        // 총알 제거
        this.playerBullets.splice(i, 1);

        const currentTime = performance.now();

        // 피격 이미지 변경 처리 (0.2초 throttling)
        if (
          currentTime - this.lastHurtAnimationTime >
          this.HURT_ANIMATION_THROTTLE_MS
        ) {
          // 주석 추가: 이미지 변경 throttling 조건
          this.boss.isHurt = true; // 피격 상태로 설정
          this.boss.hurtEndTime = currentTime + this.boss.hurtAnimationDuration; // 피격 애니메이션 종료 시간 설정
          this.lastHurtAnimationTime = currentTime; // 마지막 이미지 변경 시간 업데이트
        }

        // 피격 사운드 재생 처리 (1초 throttling)
        if (currentTime - this.lastHitSoundTime > this.HIT_SOUND_THROTTLE_MS) {
          // 주석 추가: 사운드 재생 throttling 조건
          this.bossHitSound.currentTime = 0; // 사운드를 처음부터 재생
          this.bossHitSound
            .play()
            .catch((error) =>
              console.error("Error playing boss hit sound:", error),
            ); // 사운드 재생 및 오류 처리
          this.lastHitSoundTime = currentTime; // 마지막 사운드 재생 시간 업데이트
        }
      }
    }

    // 보스 탄막과 플레이어 충돌
    for (let i = this.bossBullets.length - 1; i >= 0; i--) {
      const bullet = this.bossBullets[i];
      const distance = Math.sqrt(
        (bullet.x - this.player.x) ** 2 + (bullet.y - this.player.y) ** 2,
      );

      if (distance < bullet.radius + this.player.radius) {
        // 플레이어 생명 감소
        this.lives -= 10;

        // 탄막 제거
        this.bossBullets.splice(i, 1);
      }
    }

    // 레이저와 플레이어 충돌 추가
    for (let i = this.laserBullets.length - 1; i >= 0; i--) {
      const laser = this.laserBullets[i];
      const distance = Math.sqrt(
        (laser.x - this.player.x) ** 2 + (laser.y - this.player.y) ** 2,
      );

      if (distance < laser.radius + this.player.radius) {
        // 플레이어 생명 감소 (레이저는 더 강함)
        this.lives -= laser.damage || 15;

        // 레이저 제거
        this.laserBullets.splice(i, 1);
      }
    }
  }

  /**
   * MARK: 게임 종료 조건 확인
   */
  checkGameEnd() {
    if (window.DEBUG_MODE) console.log('[BossGame] checkGameEnd 호출'); // 디버깅용 로그 추가
    // 보스 체력이 0 이하이면 승리
    if (this.boss.health <= 0) {
      this.isGameClear = true;
      this.showInGameMessage("보스 처치! 승리!", "success", true);
      this.endGame();
    }

    // 플레이어 생명이 0 이하이면 패배
    if (this.lives <= 0) {
      this.isGameClear = false;
      this.showInGameMessage("게임 오버!", "error", true);
      this.endGame();
    }
  }

  /**
   * MARK: 플레이어 그리기
   */
  drawPlayer() {
    if (window.DEBUG_MODE) console.log('[BossGame] drawPlayer 호출'); // 디버깅용 로그 추가
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);
    this.ctx.rotate(this.player.rotation);

    // 플레이어를 삼각형으로 그리기
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.radius, 0);
    this.ctx.lineTo(-this.player.radius / 2, -this.player.radius / 2);
    this.ctx.lineTo(-this.player.radius / 2, this.player.radius / 2);
    this.ctx.closePath();

    this.ctx.fillStyle = this.player.color;
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * MARK: 보스 그리기
   */
  drawBoss() {
    if (window.DEBUG_MODE) console.log('[BossGame] drawBoss 호출'); // 디버깅용 로그 추가
    const currentTime = performance.now(); // 현재 시간
    let currentImage = this.boss.image; // 기본 이미지
    let imageToDrawLoaded = this.boss.imageLoaded;

    // 이동 중일 때 반투명 효과 (페이즈 2 순간이동)
    if (this.boss.isMoving && this.boss.currentPhase === 2) {
      this.ctx.globalAlpha = 0.7;
    }

    // 피격 애니메이션 상태 업데이트
    if (this.boss.isHurt && currentTime >= this.boss.hurtEndTime) {
      this.boss.isHurt = false; // 피격 시간 지나면 상태 해제
    }

    // 공격 애니메이션 상태 업데이트
    if (this.boss.isAttacking && currentTime >= this.boss.attackAnimEndTime) {
      this.boss.isAttacking = false; // 공격 애니메이션 시간 지나면 상태 해제
    }

    // 이미지 선택 로직 (피격 > 공격 > 일반 순)
    if (this.boss.isHurt && this.boss.imageHurtLoaded) {
      // 피격 상태이고 피격 이미지가 로드되었으면
      currentImage = this.boss.imageHurt;
      imageToDrawLoaded = this.boss.imageHurtLoaded;
    } else if (this.boss.isAttacking && this.boss.imageAttackLoaded) {
      // 공격 상태이고 공격 이미지가 로드되었으면
      currentImage = this.boss.imageAttack;
      imageToDrawLoaded = this.boss.imageAttackLoaded;
    }
    // 그 외의 경우는 기본 이미지가 이미 설정되어 있음

    if (imageToDrawLoaded) {
      // 선택된 이미지가 로드되었으면 이미지 그리기
      this.ctx.drawImage(
        currentImage, // 현재 상태에 맞는 이미지
        this.boss.x - this.boss.width / 2,
        this.boss.y,
        this.boss.width,
        this.boss.height,
      );

      // 페이즈 2일 때 추가 효과 (외곽선 등)은 이미지 위에 그려질 수 있음
      if (this.boss.currentPhase === 2 && !this.boss.isHurt) {
        // 피격 시에는 외곽선 잠시 숨김 (선택사항)
        this.ctx.strokeStyle = "#ff00ff";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
          this.boss.x - this.boss.width / 2,
          this.boss.y,
          this.boss.width,
          this.boss.height,
        );
      }
    } else {
      // 이미지가 로드되지 않았으면 기존 사각형 그리기 (폴백)
      this.ctx.fillStyle = this.boss.color;
      this.ctx.fillRect(
        this.boss.x - this.boss.width / 2,
        this.boss.y,
        this.boss.width,
        this.boss.height,
      );

      // 보스 외곽선
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        this.boss.x - this.boss.width / 2,
        this.boss.y,
        this.boss.width,
        this.boss.height,
      );

      // 페이즈 2일 때 추가 효과
      if (this.boss.currentPhase === 2) {
        this.ctx.strokeStyle = "#ff00ff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
          this.boss.x - this.boss.width / 2 - 5,
          this.boss.y - 5,
          this.boss.width + 10,
          this.boss.height + 10,
        );
      }
    }
    this.ctx.globalAlpha = 1.0; // 투명도 복구
  }

  /**
   * MARK: 플레이어 총알 그리기
   */
  drawPlayerBullets() {
    if (window.DEBUG_MODE) console.log('[BossGame] drawPlayerBullets 호출'); // 디버깅용 로그 추가
    this.playerBullets.forEach((bullet) => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = bullet.color;
      this.ctx.fill();
    });
  }

  /**
   * MARK: 보스 탄막 그리기
   */
  drawBossBullets() {
    if (window.DEBUG_MODE) console.log('[BossGame] drawBossBullets 호출'); // 디버깅용 로그 추가
    this.bossBullets.forEach((bullet) => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = bullet.color;
      this.ctx.fill();
    });
  }

  /**
   * MARK: 레이저 총알 그리기
   */
  drawLaserBullets() {
    if (window.DEBUG_MODE) console.log('[BossGame] drawLaserBullets 호출'); // 디버깅용 로그 추가
    this.laserBullets.forEach((laser) => {
      // 레이저 글로우 효과
      this.ctx.save();
      this.ctx.shadowColor = laser.color;
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      this.ctx.arc(laser.x, laser.y, laser.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = laser.color;
      this.ctx.fill();

      this.ctx.restore();
    });
  }
  /**
   * MARK: 체력바 그리기
   */
  drawHealthBars() {
    if (window.DEBUG_MODE) console.log('[BossGame] drawHealthBars 호출'); // 디버깅용 로그 추가
    this.drawBossHealthBar();
    this.drawPlayerHealthBar();
  }

  /**
   * MARK: 보스 체력바 그리기 (상단)
   */
  drawBossHealthBar() {
    if (window.DEBUG_MODE) console.log('[BossGame] drawBossHealthBar 호출'); // 디버깅용 로그 추가
    const bossHealthBarWidth = 300;
    const bossHealthBarHeight = 20;
    const bossHealthBarX = (this.canvas.width - bossHealthBarWidth) / 2;
    const bossHealthBarY = 20;

    // 보스 체력바 배경
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(
      bossHealthBarX,
      bossHealthBarY,
      bossHealthBarWidth,
      bossHealthBarHeight,
    );

    // 보스 체력바
    const bossHealthPercent = this.boss.health / this.boss.maxHealth;
    this.ctx.fillStyle = bossHealthPercent > 0.3 ? "#ff4444" : "#ff0000";
    this.ctx.fillRect(
      bossHealthBarX,
      bossHealthBarY,
      bossHealthBarWidth * bossHealthPercent,
      bossHealthBarHeight,
    );

    // 보스 체력바 외곽선
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      bossHealthBarX,
      bossHealthBarY,
      bossHealthBarWidth,
      bossHealthBarHeight,
    );

    // 보스 체력 텍스트
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `뮤츠 : ${Math.max(0, this.boss.health)} / ${this.boss.maxHealth}`,
      this.canvas.width / 2,
      bossHealthBarY + bossHealthBarHeight + 20,
    );
  }

  /**
   * MARK: 플레이어 체력바 그리기 (하단)
   */
  drawPlayerHealthBar() {
    if (window.DEBUG_MODE) console.log('[BossGame] drawPlayerHealthBar 호출'); // 디버깅용 로그 추가
    const playerHealthBarWidth = 200;
    const playerHealthBarHeight = 15;
    const playerHealthBarX = (this.canvas.width - playerHealthBarWidth) / 2;
    const playerHealthBarY = this.canvas.height - 50;

    // 플레이어 체력바 배경
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(
      playerHealthBarX,
      playerHealthBarY,
      playerHealthBarWidth,
      playerHealthBarHeight,
    );

    // 플레이어 체력바
    const playerHealthPercent = this.lives / this.totalLives;
    this.ctx.fillStyle = playerHealthPercent > 0.3 ? "#44ff44" : "#ffff44";
    this.ctx.fillRect(
      playerHealthBarX,
      playerHealthBarY,
      playerHealthBarWidth * playerHealthPercent,
      playerHealthBarHeight,
    );

    // 플레이어 체력바 외곽선
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      playerHealthBarX,
      playerHealthBarY,
      playerHealthBarWidth,
      playerHealthBarHeight,
    );

    // 플레이어 체력 텍스트
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "14px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `체력: ${this.lives} / ${this.totalLives}`,
      this.canvas.width / 2,
      playerHealthBarY + playerHealthBarHeight + 20,
    );
  }

  /**
   * 보스 이미지 크기 조정 공통 함수
   */
  adjustBossImageSize(imageInstance) {
    if (window.DEBUG_MODE) console.log('[BossGame] adjustBossImageSize 호출', imageInstance); // 디버깅용 로그 추가
    // 주석 추가
    const minWidth = 67.5; // 주석 추가
    const minHeight = 67.5; // 주석 추가
    const maxWidth = 200; // 보스 이미지 최대 너비 // 주석 추가
    const maxHeight = 200; // 보스 이미지 최대 높이 // 주석 추가
    let newWidth = imageInstance.naturalWidth; // 주석 추가
    let newHeight = imageInstance.naturalHeight; // 주석 추가

    if (newWidth > maxWidth) {
      // 주석 추가
      const ratio = maxWidth / newWidth; // 주석 추가
      newWidth = maxWidth; // 주석 추가
      newHeight *= ratio; // 주석 추가
    }
    if (newHeight > maxHeight) {
      // 주석 추가
      const ratio = maxHeight / newHeight; // 주석 추가
      newHeight = maxHeight; // 주석 추가
      newWidth *= ratio; // 주석 추가
    }
    if (newWidth < minWidth) {
      // 주석 추가
      const ratio = minWidth / newWidth; // 주석 추가
      newWidth = minWidth; // 최소 너비 제한 // 주석 추가
      newHeight *= ratio; // 주석 추가
    }
    if (newHeight < minHeight) {
      // 주석 추가
      const ratio = minHeight / newHeight; // 주석 추가
      newHeight = minHeight; // 최소 높이 제한 // 주석 추가
      newWidth *= ratio; // 주석 추가
    }

    // 이 함수는 보스의 기본 렌더링 크기를 설정하는 데 사용됩니다. // 주석 추가
    // imageInstance가 this.boss.image일 때만 this.boss.width와 this.boss.height를 업데이트합니다. // 주석 추가
    if (imageInstance === this.boss.image) {
      // 주석 추가
      this.boss.width = newWidth; // 주석 추가
      this.boss.height = newHeight; // 주석 추가
    } // 주석 추가
  } // 주석 추가

//   // MARK: 포켓몬 능력 실행 오버라이드 (GameManager에서 상속)
//   executePokemonAbility(slotIndex, pokemonIndex, pokemonType) {
//     // 타입별 능력 실행
//     switch (pokemonType) {
//       case 0: // 풀타입
//         this.executeGrassAbility();
//         break;
//       case 1: // 불타입
//         this.executeFireAbility();
//         break;
//       case 2: // 전기타입
//         this.executeElectricAbility();
//         break;
//       case 3: // 물타입
//         this.executeWaterAbility();
//         break;
//       case 4: // 얼음타입
//         this.executeIceAbility();
//         break;
//       default:
//         console.log("알 수 없는 타입의 포켓몬 능력입니다.");
//     }
//   }

//   // MARK: 풀타입 능력 - 생명력 회복
//   executeGrassAbility() {
//     this.lives += 100; // 생명력 100 회복
//     if (this.lives > this.totalLives) {
//       this.lives = this.totalLives; // 최대 생명력 제한
//     }
//     console.log("풀타입 능력 사용! 생명력 100 회복");
//   }

//   // MARK: 불타입 능력 - 플레이어 이동 속도 증가
//   executeFireAbility() {
//     const originalMaxSpeed = this.player.maxSpeed;
//     this.player.maxSpeed = originalMaxSpeed * 1.5; // 1.5배 속도 증가

//     console.log("불타입 능력 사용! 플레이어 속도 5초간 증가");

//     // 5초 후 원래 속도로 복귀
//     setTimeout(() => {
//       this.player.maxSpeed = originalMaxSpeed;
//     }, 5000);
//   }

//   // MARK: 전기타입 능력 - 점수 2배 획득
//   executeElectricAbility() {
//     this.electricBoostActive = true;
//     console.log("전기타입 능력 사용! 8초간 점수 2배 획득");

//     // 8초 후 효과 해제
//     setTimeout(() => {
//       this.electricBoostActive = false;
//     }, 8000);
//   }

//   // MARK: 물타입 능력 - 플레이어 가속력 증가
//   executeWaterAbility() {
//     this.waterBoostActive = true;
//     const originalAcceleration = this.player.acceleration;
//     this.player.acceleration = originalAcceleration * 1.8; // 1.8배 가속력 증가

//     console.log("물타입 능력 사용! 7초간 플레이어 가속력 증가");

//     // 7초 후 효과 해제
//     setTimeout(() => {
//       this.waterBoostActive = false;
//       this.player.acceleration = originalAcceleration;
//     }, 7000);
//   }
//   // MARK: 얼음타입 능력 - 보스 이동 속도 감소
//   executeIceAbility() {
//     this.iceBoostActive = true;
//     this.showMessage("얼음타입 능력: 보스 이동 속도 감소!", "success"); // 시각적 피드백 추가
//     console.log("얼음타입 능력 사용! 6초간 보스 이동 속도 감소");

//     // 6초 후 효과 해제
//     setTimeout(() => {
//       this.iceBoostActive = false;
//       console.log("얼음타입 능력 효과 종료: 보스 이동 속도 원상복구"); // 종료 로그 추가
//     }, 6000);
//   }
}
