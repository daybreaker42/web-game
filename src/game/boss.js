/**
 * BossGame class
 * - GameManager를 상속받아 보스전 탄막 게임을 구현
 * - 플레이어는 2D 평면에서 회전/가속으로 이동하며 공을 발사
 * - 보스는 탄막을 발사하고 플레이어 공에 맞으면 체력 감소
 */
class BossGame extends GameManager {
    constructor(canvas) {
        super(canvas);

        // MARK: 보스전 전용 설정
        this.bossMaxHealth = 1000;
        this.bossHealth = this.bossMaxHealth;

        // MARK: 플레이어 설정
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            rotation: 0, // 라디안 단위
            velocityX: 0,
            velocityY: 0,
            maxSpeed: 8,
            acceleration: 0.3,
            rotationSpeed: 0.08,
            friction: 0.95,
            radius: 15,
            color: '#00ff00'
        };

        // MARK: 보스 설정
        this.boss = {
            x: this.canvas.width / 2,
            y: 100,
            width: 120, // 초기 너비, 이미지 로드 후 변경될 수 있음 // 주석 추가
            height: 80, // 초기 높이, 이미지 로드 후 변경될 수 있음 // 주석 추가
            health: this.bossMaxHealth,
            maxHealth: this.bossMaxHealth,
            color: '#ff0000', // 이미지 로드 실패 시 폴백 색상 // 주석 추가
            lastAttackTime: 0,
            attackCooldown: 1000, // 1초마다 공격
            bulletSpeed: 3,
            name: '뮤츠',
            description: '전설의 포켓몬, 강력한 정신 공격을 사용합니다.',
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
            image: new Image(), // 보스 이미지 객체 추가 // 주석 추가
            imageLoaded: false, // 이미지 로드 완료 플래그 추가 // 주석 추가
            imagePath: '../../assets/images/game/boss/mewtwo_normal.png' // 보스 이미지 경로 추가 // 주석 추가
        };
        this.boss.image.src = this.boss.imagePath; // 이미지 경로 설정 // 주석 추가
        this.boss.image.onload = () => { // 이미지 로드 완료 시 // 주석 추가
            this.boss.imageLoaded = true; // 주석 추가

            // 이미지 크기를 기반으로 보스 크기 조정 (예: 최대 크기 제한) // 주석 추가
            const maxWidth = 150; // 보스 이미지 최대 너비 // 주석 추가
            const maxHeight = 150; // 보스 이미지 최대 높이 // 주석 추가
            let newWidth = this.boss.image.naturalWidth; // 주석 추가
            let newHeight = this.boss.image.naturalHeight; // 주석 추가

            if (newWidth > maxWidth) { // 주석 추가
                const ratio = maxWidth / newWidth; // 주석 추가
                newWidth = maxWidth; // 주석 추가
                newHeight *= ratio; // 주석 추가
            }
            if (newHeight > maxHeight) { // 주석 추가
                const ratio = maxHeight / newHeight; // 주석 추가
                newHeight = maxHeight; // 주석 추가
                newWidth *= ratio; // 주석 추가
            }
            this.boss.width = newWidth; // 주석 추가
            this.boss.height = newHeight; // 주석 추가
            console.log(`보스 이미지 로드 완료. 크기: ${this.boss.width}x${this.boss.height}`); // 주석 추가
        };
        this.boss.image.onerror = () => { // 이미지 로드 실패 시 // 주석 추가
            console.error(`보스 이미지 로드 실패: ${this.boss.imagePath}`); // 주석 추가
            this.boss.imageLoaded = false; // 이미지 로드 실패로 명시 // 주석 추가
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
    }

    /**
     * 키보드 입력 처리 오버라이드
     */
    keyDownHandler(e) {
        super.keyDownHandler(e); // 부모 클래스의 기본 처리 먼저 수행        // 보스전 전용 키 처리
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            this.keys.upPressed = true;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            this.keys.downPressed = true;
        }
        // 스페이스바 발사 기능 제거 - 자동 발사로 변경
    }

    /**
     * 키보드 키 눌림 이벤트 처리 (WASD 키 지원 추가)
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    keyDownHandler(e) {
        // 부모 클래스의 기본 키 처리 호출
        super.keyDownHandler(e);

        // WASD 키 지원 추가
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
            this.keys.upPressed = true; // W키로 앞으로 가속
        }
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
            this.keys.downPressed = true; // S키로 뒤로 가속
        }
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
            this.keys.leftPressed = true; // A키로 좌회전
        }
        if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
            this.keys.rightPressed = true; // D키로 우회전
        }
    }

    /**
     * 키보드 키 해제 이벤트 처리 (WASD 키 지원 추가)
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    keyUpHandler(e) {
        // 부모 클래스의 기본 키 처리 호출
        super.keyUpHandler(e);

        // WASD 키 지원 추가
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
            this.keys.upPressed = false; // W키 해제
        }
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
            this.keys.downPressed = false; // S키 해제
        }
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
            this.keys.leftPressed = false; // A키 해제
        }
        if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
            this.keys.rightPressed = false; // D키 해제
        }
    }

    /**
     * MARK: 게임별 초기화
     */
    initializeGame() {
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
    }

    /**
     * 게임별 업데이트 로직
     */
    updateGame(timeMultiplier) {
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
            this.player.velocityX += Math.cos(this.player.rotation) * this.player.acceleration * timeMultiplier;
            this.player.velocityY += Math.sin(this.player.rotation) * this.player.acceleration * timeMultiplier;
        }
        if (this.keys.downPressed) {
            // 현재 회전 반대 방향으로 가속 (후진)
            this.player.velocityX -= Math.cos(this.player.rotation) * this.player.acceleration * timeMultiplier;
            this.player.velocityY -= Math.sin(this.player.rotation) * this.player.acceleration * timeMultiplier;
        }

        // 최대 속도 제한
        const speed = Math.sqrt(this.player.velocityX ** 2 + this.player.velocityY ** 2);
        if (speed > this.player.maxSpeed) {
            this.player.velocityX = (this.player.velocityX / speed) * this.player.maxSpeed;
            this.player.velocityY = (this.player.velocityY / speed) * this.player.maxSpeed;
        }

        // 마찰력 적용
        this.player.velocityX *= Math.pow(this.player.friction, timeMultiplier);
        this.player.velocityY *= Math.pow(this.player.friction, timeMultiplier);

        // 위치 업데이트
        this.player.x += this.player.velocityX * timeMultiplier;
        this.player.y += this.player.velocityY * timeMultiplier;

        // 화면 경계 처리
        this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));
    }

    /**
     * MARK: 플레이어 총알 발사
     */
    shootPlayerBullet() {
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
                color: '#ffff00'
            });
            this.playerLastShotTime = currentTime;
        }
    }

    /**
     * 플레이어 총알 업데이트
     */
    updatePlayerBullets(timeMultiplier) {
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];

            // 총알 이동
            bullet.x += bullet.velocityX * timeMultiplier;
            bullet.y += bullet.velocityY * timeMultiplier;

            // 화면 밖으로 나간 총알 제거
            if (bullet.x < 0 || bullet.x > this.canvas.width ||
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.playerBullets.splice(i, 1);
            }
        }
    }

    /**
     * MARK: 보스 업데이트
     */
    updateBoss(timeMultiplier) {
        const currentTime = performance.now();

        // 페이즈 2 전환 체크
        if (!this.boss.phase2Triggered && this.boss.health <= this.boss.maxHealth * 0.3) {
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
        // 이동 처리
        if (!this.boss.isMoving && currentTime - this.boss.lastMoveTime >= this.boss.moveCooldown) {
            this.startBossMove(); // 보스 이동 시작
        }

        if (this.boss.isMoving) {
            this.updateBossMovement(currentTime, timeMultiplier); // 보스 이동 업데이트
        }

        // 공격 처리 (이동 중이 아닐 때만)
        if (!this.boss.isMoving && currentTime - this.boss.lastAttackTime >= this.boss.attackCooldown) {
            this.shootBossBullets(); // 전방향 공격
            this.boss.lastAttackTime = currentTime;
        }
    }

    /**
     * MARK: 페이즈 2 업데이트 (순간이동 + 플레이어 조준 공격)
     */
    updatePhase2(currentTime, timeMultiplier) {
        // 순간이동 처리 (페이즈 2에서는 더 자주 이동)
        const phase2MoveCooldown = 2000; // 2초마다 이동
        if (!this.boss.isMoving && currentTime - this.boss.lastMoveTime >= phase2MoveCooldown) {
            this.startBossTeleport(); // 보스 순간이동 시작
        }

        if (this.boss.isMoving) {
            this.updateBossTeleport(currentTime); // 순간이동 업데이트
        }

        // 공격 처리 (이동 중이 아닐 때만, 더 빠른 공격)
        const phase2AttackCooldown = 800; // 0.8초마다 공격
        if (!this.boss.isMoving && currentTime - this.boss.lastAttackTime >= phase2AttackCooldown) {
            this.shootTargetedBullets(); // 플레이어 조준 공격
            this.boss.lastAttackTime = currentTime;
        }
    }

    /**
     * MARK: 페이즈 2 전환 처리
     */
    triggerPhase2() {
        this.boss.phase2Triggered = true;
        this.boss.currentPhase = 2;
        this.boss.color = '#8b0000'; // 보스 색깔 변경 (더 어두운 빨간색)

        // 레이저 공격 발사
        this.shootLaserAttack();

        // 페이즈 전환 메시지 표시
        this.showMessage('보스 페이즈 2! 더욱 강해졌다!', 'error');
    }

    /**
     * MARK: 보스 이동 시작 (페이즈 1)
     */
    startBossMove() {
        // 랜덤한 목표 위치 설정 (화면 상단 1/3 영역 내)
        const margin = 60; // 화면 가장자리 여백
        this.boss.startX = this.boss.x;
        this.boss.startY = this.boss.y;
        this.boss.targetX = margin + Math.random() * (this.canvas.width - 2 * margin);
        this.boss.targetY = margin + Math.random() * (this.canvas.height / 3 - margin);

        this.boss.isMoving = true;
        this.boss.moveStartTime = performance.now();
    }

    /**
     * MARK: 보스 이동 업데이트 (페이즈 1)
     */
    updateBossMovement(currentTime, timeMultiplier) {
        const elapsed = currentTime - this.boss.moveStartTime;
        const progress = Math.min(elapsed / this.boss.moveDuration, 1);

        // 부드러운 이동을 위한 easing 함수 적용
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // 현재 위치 계산
        this.boss.x = this.boss.startX + (this.boss.targetX - this.boss.startX) * easeProgress;
        this.boss.y = this.boss.startY + (this.boss.targetY - this.boss.startY) * easeProgress;

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
        // 랜덤한 위치로 순간이동
        const margin = 60;
        this.boss.targetX = margin + Math.random() * (this.canvas.width - 2 * margin);
        this.boss.targetY = margin + Math.random() * (this.canvas.height / 3 - margin);

        this.boss.isMoving = true;
        this.boss.moveStartTime = performance.now();
        this.boss.moveDuration = 100; // 순간이동은 매우 빠르게 (0.1초)
    }

    /**
     * MARK: 보스 순간이동 업데이트 (페이즈 2)
     */
    updateBossTeleport(currentTime) {
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
                color: '#ff00ff', // 보라색 레이저
                damage: 15 // 레이저는 더 강한 데미지
            });
        }
    }

    /**
     * MARK: 플레이어 조준 공격 (페이즈 2)
     */
    shootTargetedBullets() {
        // 플레이어 방향으로 3발 발사 (중앙 + 좌우 약간 벗어난 각도)
        const dx = this.player.x - this.boss.x;
        const dy = this.player.y - (this.boss.y + this.boss.height / 2);
        const baseAngle = Math.atan2(dy, dx);
        const bulletLifespan = 5000; // 총알 수명: 5000ms (5초) // 주석 추가

        for (let i = -1; i <= 1; i++) {
            const angle = baseAngle + (i * 0.3); // 약 17도씩 벗어나게
            const bulletSpeed = 5;

            this.bossBullets.push({
                x: this.boss.x,
                y: this.boss.y + this.boss.height / 2,
                velocityX: Math.cos(angle) * bulletSpeed,
                velocityY: Math.sin(angle) * bulletSpeed,
                radius: 6,
                color: '#ff4400', // 주황색으로 조준 공격 구분
                lifespan: bulletLifespan // 수명 속성 추가 // 주석 추가
            });
        }
    }

    /**
     * MARK: 보스 탄막 발사
     */
    shootBossBullets() {
        const bulletCount = 8; // 8방향으로 탄막 발사
        const angleStep = (Math.PI * 2) / bulletCount;
        const bulletLifespan = 5000; // 총알 수명: 5000ms (5초) // 주석 추가

        for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep;
            this.bossBullets.push({
                x: this.boss.x,
                y: this.boss.y + this.boss.height / 2,
                velocityX: Math.cos(angle) * this.boss.bulletSpeed,
                velocityY: Math.sin(angle) * this.boss.bulletSpeed,
                radius: 6,
                color: '#ff8800',
                lifespan: bulletLifespan // 수명 속성 추가 // 주석 추가
            });
        }
    }

    /**
     * MARK: 보스 탄막 업데이트
     */
    updateBossBullets(timeMultiplier) {
        const deltaTime = timeMultiplier * this.FRAME_DELAY; // 실제 경과 시간 계산 // 주석 추가

        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            const bullet = this.bossBullets[i];

            // 탄막 이동
            bullet.x += bullet.velocityX * timeMultiplier;
            bullet.y += bullet.velocityY * timeMultiplier;

            // 수명 감소 // 주석 추가
            if (bullet.lifespan !== undefined) { // lifespan 속성이 있는 경우에만 처리 // 주석 추가
                bullet.lifespan -= deltaTime; // 주석 추가
            }

            // 화면 밖으로 나간 탄막 또는 수명이 다한 탄막 제거 // 주석 수정
            if (bullet.x < -50 || bullet.x > this.canvas.width + 50 ||
                bullet.y < -50 || bullet.y > this.canvas.height + 50 ||
                (bullet.lifespan !== undefined && bullet.lifespan <= 0)) { // 수명 체크 조건 추가 // 주석 추가
                this.bossBullets.splice(i, 1);
            }
        }
    }

    /**
     * MARK: 레이저 총알 업데이트
     */
    updateLaserBullets(timeMultiplier) {
        for (let i = this.laserBullets.length - 1; i >= 0; i--) {
            const bullet = this.laserBullets[i];

            // 레이저 이동
            bullet.x += bullet.velocityX * timeMultiplier;
            bullet.y += bullet.velocityY * timeMultiplier;

            // 화면 밖으로 나간 레이저 제거
            if (bullet.x < -100 || bullet.x > this.canvas.width + 100 ||
                bullet.y < -100 || bullet.y > this.canvas.height + 100) {
                this.laserBullets.splice(i, 1);
            }
        }
    }

    /**
     * MARK: 충돌 감지
     */
    checkCollisions() {
        // 플레이어 총알과 보스 충돌
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];

            if (bullet.x >= this.boss.x - this.boss.width / 2 &&
                bullet.x <= this.boss.x + this.boss.width / 2 &&
                bullet.y >= this.boss.y &&
                bullet.y <= this.boss.y + this.boss.height) {

                // 보스 체력 감소
                this.boss.health -= 50;
                this.score += 100; // 점수 증가

                // 총알 제거
                this.playerBullets.splice(i, 1);
            }
        }

        // 보스 탄막과 플레이어 충돌
        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            const bullet = this.bossBullets[i];
            const distance = Math.sqrt(
                (bullet.x - this.player.x) ** 2 +
                (bullet.y - this.player.y) ** 2
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
                (laser.x - this.player.x) ** 2 +
                (laser.y - this.player.y) ** 2
            );

            if (distance < laser.radius + this.player.radius) {
                // 플레이어 생명 감소 (레이저는 더 강함)
                this.lives -= (laser.damage || 15);

                // 레이저 제거
                this.laserBullets.splice(i, 1);
            }
        }
    }

    /**
     * MARK: 게임 종료 조건 확인
     */
    checkGameEnd() {
        // 보스 체력이 0 이하이면 승리
        if (this.boss.health <= 0) {
            this.isGameClear = true;
            this.showMessage('보스 처치! 승리!', 'success', true);
            this.endGame();
        }

        // 플레이어 생명이 0 이하이면 패배
        if (this.lives <= 0) {
            this.isGameClear = false;
            this.showMessage('게임 오버!', 'error', true);
            this.endGame();
        }
    }

    /**
     * MARK: 플레이어 그리기
     */
    drawPlayer() {
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
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * MARK: 보스 그리기
     */
    drawBoss() {
        // 이동 중일 때 반투명 효과 (페이즈 2 순간이동) // 주석 추가
        if (this.boss.isMoving && this.boss.currentPhase === 2) {
            this.ctx.globalAlpha = 0.7;
        }

        if (this.boss.imageLoaded) { // 이미지가 로드되었으면 이미지 그리기 // 주석 추가
            this.ctx.drawImage(
                this.boss.image,
                this.boss.x - this.boss.width / 2, // 이미지의 x 좌표 (중앙 정렬)
                this.boss.y,                       // 이미지의 y 좌표 (상단 기준)
                this.boss.width,                   // 그려질 이미지의 너비
                this.boss.height                   // 그려질 이미지의 높이
            );

            // 페이즈 2일 때 추가 효과 (외곽선 등)는 이미지 위에 그려질 수 있음 // 주석 추가
            if (this.boss.currentPhase === 2) {
                this.ctx.strokeStyle = '#ff00ff'; // 보라색 외곽선
                this.ctx.lineWidth = 3; // 선 두께
                this.ctx.strokeRect(
                    this.boss.x - this.boss.width / 2,
                    this.boss.y,
                    this.boss.width,
                    this.boss.height
                );
            }
        } else { // 이미지가 로드되지 않았으면 기존 사각형 그리기 (폴백) // 주석 추가
            this.ctx.fillStyle = this.boss.color;
            this.ctx.fillRect(
                this.boss.x - this.boss.width / 2,
                this.boss.y,
                this.boss.width,
                this.boss.height
            );

            // 보스 외곽선
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                this.boss.x - this.boss.width / 2,
                this.boss.y,
                this.boss.width,
                this.boss.height
            );

            // 페이즈 2일 때 추가 효과
            if (this.boss.currentPhase === 2) {
                this.ctx.strokeStyle = '#ff00ff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    this.boss.x - this.boss.width / 2 - 5,
                    this.boss.y - 5,
                    this.boss.width + 10,
                    this.boss.height + 10
                );
            }
        }
        this.ctx.globalAlpha = 1.0; // 투명도 복구
    }

    /**
     * MARK: 플레이어 총알 그리기
     */
    drawPlayerBullets() {
        this.playerBullets.forEach(bullet => {
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
        this.bossBullets.forEach(bullet => {
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
        this.laserBullets.forEach(laser => {
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
        // 보스 체력바
        const bossHealthBarWidth = 300;
        const bossHealthBarHeight = 20;
        const bossHealthBarX = (this.canvas.width - bossHealthBarWidth) / 2;
        const bossHealthBarY = 20;

        // 보스 체력바 배경
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(bossHealthBarX, bossHealthBarY, bossHealthBarWidth, bossHealthBarHeight);

        // 보스 체력바
        const bossHealthPercent = this.boss.health / this.boss.maxHealth;
        this.ctx.fillStyle = bossHealthPercent > 0.3 ? '#ff4444' : '#ff0000';
        this.ctx.fillRect(bossHealthBarX, bossHealthBarY, bossHealthBarWidth * bossHealthPercent, bossHealthBarHeight);

        // 보스 체력바 외곽선
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(bossHealthBarX, bossHealthBarY, bossHealthBarWidth, bossHealthBarHeight);

        // 페이즈 표시 추가
        const phaseText = `Phase ${this.boss.currentPhase}`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(phaseText, this.canvas.width / 2, bossHealthBarY - 10);

        // 보스 체력 텍스트
        this.ctx.fillText(
            `Boss HP: ${Math.max(0, this.boss.health)} / ${this.boss.maxHealth}`,
            this.canvas.width / 2,
            bossHealthBarY + bossHealthBarHeight + 20
        );
    }
}

// 게임 인스턴스 생성 및 시작 (전역 변수로 설정)
// let bossGame = null;

// // 페이지 로드 시 게임 초기화
// document.addEventListener('DOMContentLoaded', function () {
//     const canvas = document.getElementById('gameCanvas');
//     if (canvas) {
//         bossGame = new BossGame(canvas);

//         // 게임 정보 설정 (예시)
//         try {
//             bossGame.setGameInfo({
//                 mode: 'boss',
//                 level: 'normal',
//                 stage: 4
//             });
//         } catch (e) {
//             console.error('게임 정보 설정 오류:', e);
//         }

//         // 초기 애니메이션 프레임 시작
//         bossGame.animationFrame = requestAnimationFrame((time) => bossGame.update(time));
//     }
// });