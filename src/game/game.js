/**
 * BrickGame class
 * - GameManager를 상속받아 벽돌깨기 게임을 구현
 * - 공이 패들과 벽돌에 부딪히며 벽돌을 깨는 게임
 */
class BrickGame extends GameManager {
    constructor(canvas) {
        super(canvas); // GameManager 생성자 호출

        // MARK: 벽돌깨기 전용 설정
        this.TOTAL_LIVES = 300;
        this.leftBrick = 0;

        // MARK: 벽돌 관련 설정
        this.BRICK_WIDTH = 50;
        this.BRICK_HEIGHT = 50;
        this.BRICK_PADDING = 10;
        this.BRICK_OFFSET_TOP = 60;
        this.BRICK_OFFSET_LEFT = 30;

        // MARK: 벽돌 배열
        this.bricks = [];

        // MARK: 벽돌 개수 계산 및 설정
        const { maxColumns, maxRows } = this.calculateMaxBricks();
        this.brickRowCount = maxRows; // 세로 개수
        this.brickColumnCount = maxColumns; // 가로 개수
    }

    /**
     * 캔버스를 채우는 최대 벽돌 개수 계산
     */
    calculateMaxBricks() {
    // 가로로 들어갈 수 있는 벽돌 수 계산
        const maxColumns = Math.floor((this.canvas.width - this.BRICK_OFFSET_LEFT * 2 + this.BRICK_PADDING) / (this.BRICK_WIDTH + this.BRICK_PADDING));

        // 세로로 들어갈 수 있는 벽돌 수 계산
        const maxRows = Math.floor((this.canvas.height / 2 - this.BRICK_OFFSET_TOP + this.BRICK_PADDING) / (this.BRICK_HEIGHT + this.BRICK_PADDING));

        return { maxColumns, maxRows };
    }

    /**
     * 게임별 초기화 (GameManager 오버라이드)
     */
    initializeGame() {
        // 기본 게임 오브젝트 초기화는 부모에서 처리
        this.initializeGameObjects();

        // 벽돌깨기 전용 초기화
        this.initBricks();
        this.lives = this.TOTAL_LIVES;
        this.totalLives = this.TOTAL_LIVES;
    }

    /**
     * 벽돌 배열 초기화
     */
    initBricks() {
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                // 벽돌의 색상을 랜덤하게 설정
                const colors = ['#FF5252', '#FF4081', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#69F0AE', '#B2FF59'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                // Brick 생성자에 개별 매개변수로 전달
                const brickX = c * (this.BRICK_WIDTH + this.BRICK_PADDING) + this.BRICK_OFFSET_LEFT;
                const brickY = r * (this.BRICK_HEIGHT + this.BRICK_PADDING) + this.BRICK_OFFSET_TOP;

                this.bricks[c][r] = new Brick(
                    brickX,
                    brickY,
                    this.BRICK_WIDTH,
                    this.BRICK_HEIGHT,
                    randomColor
                );
            }
        }
        this.leftBrick = this.brickColumnCount * this.brickRowCount; // 남은 벽돌 수 초기화
    }

    /**
     * 게임별 업데이트 로직 (GameManager 오버라이드)
     */
    updateGame(timeMultiplier) {
        // 공 이동
        this.ball.x += this.ball.speedX * timeMultiplier;
        this.ball.y += this.ball.speedY * timeMultiplier;

        // 좌우 벽 충돌
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            this.ball.speedX = -this.ball.speedX;
        }

        // 상단 벽 충돌
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.speedY = -this.ball.speedY;
        }

        // 하단 벽 충돌 (게임 오버)
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.lives -= 1; // 생명 감소

            if (this.lives <= 0) {
                this.isGameClear = false;
                this.showMessage('게임 오버!', 'error', true);
                this.endGame();
                return;
            }

            // 공 위치 리셋
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height - 30;
            this.ball.speedX = 0;
            this.ball.speedY = this.BALL_SPEED;
        }

        // 패들 이동 처리
        if (this.keys.rightPressed && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += 7 * timeMultiplier;
        } else if (this.keys.leftPressed && this.paddle.x > 0) {
            this.paddle.x -= 7 * timeMultiplier;
        }

        // 패들과 공 충돌
        if (isHit(this.ball, this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height)) {
            this.ball.speedY = -this.ball.speedY;
        }

        // 벽돌과 공 충돌
        this.collisionDetection();

        // 승리 조건 확인
        this.checkWin();

        // 모든 객체 그리기
        this.drawBall();
        this.drawPaddle();
        this.drawBricks();
    }

    /**
     * 모든 벽돌에 대해 공과의 충돌을 확인
     */
    collisionDetection() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status === 1) {
    // 활성화된 벽돌에 대해서만 충돌 감지
                    if (b.isBrickHit(this.ball)) {
                    // 겹침 영역 계산을 통한 방향 감지
                        const overlapLeft = this.ball.x + this.ball.radius - b.x;
                        const overlapRight = b.x + this.BRICK_WIDTH - (this.ball.x - this.ball.radius);
                        const overlapTop = this.ball.y + this.ball.radius - b.y;
                        const overlapBottom = b.y + this.BRICK_HEIGHT - (this.ball.y - this.ball.radius);

                        // 가장 작은 겹침이 발생한 방향이 충돌 방향
                        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                            this.ball.speedX = -this.ball.speedX; // 좌/우 충돌
                        } else {
                            this.ball.speedY = -this.ball.speedY; // 상/하 충돌
                        }

                        b.status = 0; // 벽돌 부서짐
                        this.score += 10; // 점수 추가
                        this.leftBrick--; // 남은 벽돌 수 감소

                        // 한 프레임에 하나의 벽돌만 처리
                        return;
                    }
                }
            }
        }
    }

    /**
     * 승리 조건 확인
     */
    checkWin() {
    // 모든 벽돌이 부서졌다면
        if (this.leftBrick === 0) {
            this.isGameClear = true;
            this.showMessage('축하합니다! 모든 벽돌을 깨셨습니다!', 'success', true);
            this.endGame();
            return true;
        }
        return false;
    }

    /**
     * 공 그리기
     */
    drawBall() {
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.ball.color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    /**
     * 패들 그리기
     */
    drawPaddle() {
        this.ctx.beginPath();
        this.ctx.rect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        this.ctx.fillStyle = this.paddle.color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    /**
     * 벽돌 그리기
     */
    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
    // Brick 클래스의 draw 메서드 사용
                    this.bricks[c][r].draw(this.ctx);
                }
            }
        }
    }
}

// 전역 변수로 게임 인스턴스 관리 (game.html에서 사용) - 하위 호환성을 위해 유지
let brickGame = null;

// 페이지 로드 시 게임 초기화 (하지만 즉시 시작하지는 않음)
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        // BrickGame 인스턴스 생성 - 클래스 기반 접근법 사용
        brickGame = new BrickGame(canvas);

        // 게임 정보 설정
        try {
            brickGame.setGameInfo({
                mode: 'brick',
                level: 'normal',
                stage: 1
            });
        } catch (e) {
            console.warn('게임 정보 설정 실패:', e.message);
        }
    }
});