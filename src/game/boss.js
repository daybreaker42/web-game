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
            width: 120,
            height: 80,
            health: this.bossMaxHealth,
            maxHealth: this.bossMaxHealth,
            color: '#ff0000',
            lastAttackTime: 0,
            attackCooldown: 1000, // 1초마다 공격
            bulletSpeed: 3
        };

        // MARK: 총알 시스템        this.playerBullets = []; // 플레이어가 발사한 총알
        this.bossBullets = []; // 보스가 발사한 탄막
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
     * 게임별 초기화
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

        // 총알 배열 초기화
        this.playerBullets = [];
        this.bossBullets = [];
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
        this.checkCollisions();
        this.checkGameEnd();

        // 모든 객체 그리기
        this.drawPlayer();
        this.drawBoss();
        this.drawPlayerBullets();
        this.drawBossBullets();
        this.drawHealthBars();
    }    /**
     * 플레이어 업데이트
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
     * 플레이어 총알 발사
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
     * 보스 업데이트
     */
    updateBoss(timeMultiplier) {
        const currentTime = performance.now();

        // 보스 공격 패턴
        if (currentTime - this.boss.lastAttackTime >= this.boss.attackCooldown) {
            this.shootBossBullets();
            this.boss.lastAttackTime = currentTime;
        }
    }

    /**
     * 보스 탄막 발사
     */
    shootBossBullets() {
        const bulletCount = 8; // 8방향으로 탄막 발사
        const angleStep = (Math.PI * 2) / bulletCount;

        for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep;
            this.bossBullets.push({
                x: this.boss.x,
                y: this.boss.y + this.boss.height / 2,
                velocityX: Math.cos(angle) * this.boss.bulletSpeed,
                velocityY: Math.sin(angle) * this.boss.bulletSpeed,
                radius: 6,
                color: '#ff8800'
            });
        }
    }

    /**
     * 보스 탄막 업데이트
     */
    updateBossBullets(timeMultiplier) {
        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            const bullet = this.bossBullets[i];

            // 탄막 이동
            bullet.x += bullet.velocityX * timeMultiplier;
            bullet.y += bullet.velocityY * timeMultiplier;

            // 화면 밖으로 나간 탄막 제거
            if (bullet.x < -50 || bullet.x > this.canvas.width + 50 ||
                bullet.y < -50 || bullet.y > this.canvas.height + 50) {
                this.bossBullets.splice(i, 1);
            }
        }
    }

    /**
     * 충돌 감지
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
    }

    /**
     * 게임 종료 조건 확인
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
     * 플레이어 그리기
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
     * 보스 그리기
     */
    drawBoss() {
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
    }

    /**
     * 플레이어 총알 그리기
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
     * 보스 탄막 그리기
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
     * 체력바 그리기
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

        // 보스 체력 텍스트
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Boss HP: ${Math.max(0, this.boss.health)} / ${this.boss.maxHealth}`,
            this.canvas.width / 2,
            bossHealthBarY + bossHealthBarHeight + 20
        );
    }
}

// 게임 인스턴스 생성 및 시작 (전역 변수로 설정)
let bossGame = null;

// 페이지 로드 시 게임 초기화
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        bossGame = new BossGame(canvas);

        // 게임 정보 설정 (예시)
        try {
            bossGame.setGameInfo({
                mode: 'boss',
                level: 'normal',
                stage: 4
            });
        } catch (e) {
            console.error('게임 정보 설정 오류:', e);
        }

        // 초기 애니메이션 프레임 시작
        bossGame.animationFrame = requestAnimationFrame((time) => bossGame.update(time));
    }
});