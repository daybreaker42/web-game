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
        this.BRICK_WIDTH = 80;
        this.BRICK_HEIGHT = 80;
        this.BRICK_PADDING = 10;
        this.BRICK_OFFSET_TOP = 60;
        this.BRICK_OFFSET_LEFT = 30;

        // MARK: 벽돌 배열
        this.bricks = [];

        // MARK: 벽돌 개수 계산 및 설정
        const { maxColumns, maxRows } = this.calculateMaxBricks();
        this.brickRowCount = maxRows; // 세로 개수
        this.brickColumnCount = maxColumns; // 가로 개수
        this.targetPokemonImages = [];
        this.targetPokemonIndexes = [];
        // 타입별 색상 매핑
        this.typeColorMap = {
            0: '#66BB6A',  // 풀
            1: '#FF7043',  // 불
            2: '#FFD54F',  // 전기
            3: '#4FC3F7',  // 물
            4: '#81D4FA'   // 얼음
        };
        this.totalPokemonCount = 107;
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

        this.targetPokemonIndexes = [];
        while (this.targetPokemonIndexes.length < 4) {
            const rand = Math.floor(Math.random() * this.totalPokemonCount);
            if (!this.targetPokemonIndexes.includes(rand)) {
                this.targetPokemonIndexes.push(rand);
            }
        }

        this.targetPokemonImages = this.targetPokemonIndexes.map(index => `../../assets/images/game/pokemon/${index}.png`);

        const positions = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                positions.push({ c, r });
            }
        }

        const shuffled = positions.sort(() => Math.random() - 0.5);
        const targetPositions = shuffled.slice(0, 4);

        // bricks = [];
        let totalBricks = 0;
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {

                // Brick 생성자에 개별 매개변수로 전달
                const brickX = c * (this.BRICK_WIDTH + this.BRICK_PADDING) + this.BRICK_OFFSET_LEFT;
                const brickY = r * (this.BRICK_HEIGHT + this.BRICK_PADDING) + this.BRICK_OFFSET_TOP;
                let isTarget = false;
                let pokeIndex;
                const targetIdx = targetPositions.findIndex(pos => pos.c === c && pos.r === r);
                if(targetIdx !== -1) {
                    isTarget = true;
                    pokeIndex = this.targetPokemonIndexes[targetIdx];
                }else{
                    do{
                        pokeIndex = Math.floor(Math.random() * this.totalPokemonCount);
                    } while (this.targetPokemonIndexes.includes(pokeIndex));
                }

                const imagePath = `../../assets/images/game/pokemon/${pokeIndex}.png`;
                const pokeType = window.pokemon?.[pokeIndex]?.type;
                const slotColor = this.typeColorMap[pokeType] || '#eee';

                this.bricks[c][r] = new Brick(
                    brickX,
                    brickY,
                    this.BRICK_WIDTH,
                    this.BRICK_HEIGHT,
                    pokeIndex,
                    isTarget,
                    imagePath
                );
                this.bricks[c][r].type = pokeType; // 벽돌 타입 저장
                this.bricks[c][r].color = slotColor; // 벽돌 색상 저장
                this.bricks[c][r].status = 1; // 벽돌 활성화 상태
                totalBricks++; // 총 벽돌 수 증가
            }
        }
        // this.leftBrick = this.brickColumnCount * this.brickRowCount; // 남은 벽돌 수 초기화
        this.leftBrick = totalBricks;
        console.log(`총 생성된 벽돌 수: ${this.leftBrick}`);
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
            this.ball.speedY = -this.BALL_SPEED;
        }

        // 패들 이동 처리
        if (this.keys.rightPressed && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += 7 * timeMultiplier;
        } else if (this.keys.leftPressed && this.paddle.x > 0) {
            this.paddle.x -= 7 * timeMultiplier;
        }

        // 패들과 공 충돌
        if (isHit(this.ball, this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height)) {
            const paddleCenter = this.paddle.x + this.paddle.width / 2;
            const ballDistFromCenter = this.ball.x - paddleCenter;
            this.ball.speedX = (ballDistFromCenter / (this.paddle.width / 2)) * this.BALL_SPEED; // 패들 중앙에서의 거리 비율로 속도 조정
            this.ball.speedY = -Math.sqrt(this.BALL_SPEED ** 2 - this.ball.speedX ** 2); // 공의 속도 조정
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

                        if (b.isTarget && this.targetPokemonIndexes.includes(b.pokeIndex)) {
                        const imagePath = `../../assets/images/game/pokemon/${b.pokeIndex}.png`;
                            this.addPokemonToSlot(imagePath);
                        }

                        // 🛠 checkWin()은 여기서 호출만 하고
                        this.checkWin();
                        
                        // 한 프레임에 하나의 벽돌만 처리
                        return;
                    }
                }
            }
        }
    }

    addPokemonToSlot(imageSrc) {
        // 중복 방지: 이미 슬롯에 들어가 있는 경우 무시
        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`slot-${i}`);
            const bg = slot.style.backgroundImage;


            if (bg.includes(imageSrc)) {
                return; // 이미 들어있으면 중복 추가 안 함
            }

        }

        // 빈 슬롯 찾아서 추가
        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`slot-${i}`);
            const bg = slot.style.backgroundImage;

            if (!bg || bg === 'none') {
                slot.style.backgroundImage = `url(${imageSrc})`;
                slot.style.backgroundSize = 'cover';
                slot.style.backgroundPosition = 'center';
                const indexMatch = imageSrc.match(/(\d+)\.png/);
                if (indexMatch) {
                    const index = parseInt(indexMatch[1]);
                    const type = window.pokemon?.[index]?.type;
                    const color = this.typeColorMap[type] || '#eee';
                    slot.style.backgroundColor = color;
                }
                return;
            }
        }
    }
    clearPokemonSlots() {
        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`slot-${i}`);
            slot.style.backgroundImage = 'none';
            slot.style.backgroundColor = 'transparent';  // 혹은 초기 색상으로 지정
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

    /** 
     * 게임 재시작
    */
   restartGame(){
    this.clearPokemonSlots(); // 슬롯 초기화
    super.restartGame(); // 부모 클래스의 재시작 메서드 호출
   }
}

// 전역 변수로 게임 인스턴스 관리 (game.html에서 사용) - 하위 호환성을 위해 유지
let brickGame = null;

// 페이지 로드 시 게임 초기화 (하지만 즉시 시작하지는 않음)
// document.addEventListener('DOMContentLoaded', function () {
//     const canvas = document.getElementById('gameCanvas');
//     if (canvas) {
//         // BrickGame 인스턴스 생성 - 클래스 기반 접근법 사용
//         brickGame = new BrickGame(canvas);

//         // 게임 정보 설정
//         try {
//             brickGame.setGameInfo({
//                 mode: 'brick',
//                 level: 'normal',
//                 stage: 1
//             });
//         } catch (e) {
//             console.warn('게임 정보 설정 실패:', e.message);
//         }
//     }
// });