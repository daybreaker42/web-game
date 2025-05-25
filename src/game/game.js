// 게임 캔버스 및 컨텍스트 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let animationFrame = null;
// 충돌 플래그 추가
let firstPaddleHit = false;
let gameStartTime = 0;  //(게임 시작 시간 저장)
// 시간 기반 애니메이션을 위한 변수
let lastTime = 0;

let pauseStartTime = 0;//일시정지했을때 시간 멈추기 용용
let totalPauseDuration = 0;// 일시정지한 시간간
const FPS = 60;
const FRAME_DELAY = 1000 / FPS; // 목표 프레임당 시간 (ms)

// #region 게임 상태 변수
const TOTAL_LIVES = 300;
let score = 0;
let lives = TOTAL_LIVES;
let isGameRunning = false;
let isPaused = false;
let leftBrick = 0;

// 공 변수
const BALL_SPEED = 5;
let ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    speedX: Math.sqrt(BALL_SPEED),
    speedY: -Math.sqrt(BALL_SPEED),
    radius: 10,
    color: '#ffeb3b'
};

// 패들 변수
let paddle = {
    height: 10,
    width: 110,
    x: (canvas.width - 110) / 2,
    y: canvas.height - 10,
    color: '#4CAF50'
};
let rightPressed = false;
let leftPressed = false;

// 벽돌 관련 변수
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 50;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 30;

// 캔버스를 채우는 최대 벽돌 개수 계산
function calculateMaxBricks() {
    // 가로로 들어갈 수 있는 벽돌 수 계산
    const maxColumns = Math.floor((canvas.width - BRICK_OFFSET_LEFT * 2 + BRICK_PADDING) / (BRICK_WIDTH + BRICK_PADDING));

    // 세로로 들어갈 수 있는 벽돌 수 계산
    const maxRows = Math.floor((canvas.height / 2 - BRICK_OFFSET_TOP + BRICK_PADDING) / (BRICK_HEIGHT + BRICK_PADDING));

    return { maxColumns, maxRows };
}

// 최대 벽돌 개수 계산
const { maxColumns, maxRows } = calculateMaxBricks();

// 계산된 값으로 벽돌 행/열 개수 설정
const brickRowCount = maxRows; // 세로 개수
const brickColumnCount = maxColumns; // 가로 개수
// #endregion

// 벽돌 배열
let bricks = [];
// MARK: 벽돌 배열 초기화
// 벽돌 초기화
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            // 벽돌의 색상을 랜덤하게 설정
            const colors = ['#FF5252', '#FF4081', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#69F0AE', '#B2FF59'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            // Brick 생성자에 개별 매개변수로 전달
            const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;

            bricks[c][r] = new Brick(
                brickX,
                brickY,
                BRICK_WIDTH,
                BRICK_HEIGHT,
                randomColor
            );
        }
    }
    leftBrick = brickColumnCount * brickRowCount; // 남은 벽돌 수 초기화
}

// MARK: 이벤트 리스터 - 키보드 및 마우스
// 키보드 이벤트 리스너
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);

// 버튼 이벤트 리스너
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('pauseButton').addEventListener('click', togglePause);
document.getElementById('restartButton').addEventListener('click', restartGame);

// 키보드 입력 처리
function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
    else if (e.code === 'Space') {
        togglePause();  // 스페이스바로 일시정지 토글
    }

}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

// 마우스 이동 처리
function mouseMoveHandler(e) {
    if (isGameRunning && !isPaused) {
        const OFFSET_LEFT = canvas.getBoundingClientRect().left;
        const OFFSET_TOP = canvas.getBoundingClientRect().top;
        const relativeX = e.clientX - OFFSET_LEFT;
        // 패들이 캔버스 내부에 있도록 제한
        if (relativeX > 0 && relativeX < canvas.width) {
            if (relativeX - paddle.width / 2 < 0) {
                paddle.x = 0;
            } else if (relativeX + paddle.width / 2 > canvas.width) {
                paddle.x = canvas.width - paddle.width;
            } else {
                // 마우스가 캔버스 안에 있는 경우
                paddle.x = relativeX - paddle.width / 2;
            }
        }
    }
}

// MARK: 충돌 감지
// 모든 벽돌에 대해 공과의 충돌을 확인
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                // 활성화된 벽돌에 대해서만 충돌 감지
                if (b.isBrickHit(ball)) {
                    // 겹침 영역 계산을 통한 방향 감지
                    const overlapLeft = ball.x + ball.radius - b.x;
                    const overlapRight = b.x + BRICK_WIDTH - (ball.x - ball.radius);
                    const overlapTop = ball.y + ball.radius - b.y;
                    const overlapBottom = b.y + BRICK_HEIGHT - (ball.y - ball.radius);

                    // 가장 작은 겹침이 발생한 방향이 충돌 방향
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                        ball.speedX = -ball.speedX; // 좌/우 충돌
                    } else {
                        ball.speedY = -ball.speedY; // 상/하 충돌
                    }

                    b.status = 0; // 벽돌 부서짐
                    score += 10; // 점수 추가
                    leftBrick--; // 남은 벽돌 수 감소

                    // 점수 업데이트
                    document.getElementById('score').textContent = score;

                    // 모든 벽돌을 부쉈는지 확인
                    let result = checkWin();

                    // 한 프레임에 하나의 벽돌만 처리
                    return result;
                }
            }
        }
    }
}

// MARK: 승리 조건 확인
function checkWin() {
    // 모든 벽돌이 부서졌다면
    if (leftBrick === 0) {
        showMessage('축하합니다! 모든 벽돌을 깨셨습니다!', 'success');
        isGameRunning = false;
        // 승리 시 애니메이션 프레임 취소
        // cancelAnimationFrame(animationFrame);
        return true;
    }
    return false;
}
// MARK: 공과 패들, 벽돌 그리기
// 공 그리기
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

// 패들 그리기
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = paddle.color;
    ctx.fill();
    ctx.closePath();
}

// 벽돌 그리기
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                // Brick 클래스의 draw 메서드 사용
                bricks[c][r].draw(ctx);
            }
        }
    }
}

// 점수 그리기
function drawScore() {
    document.getElementById('score').textContent = score;
}

// 남은 생명 그리기
function drawLives() {
    document.getElementById('lives').textContent = lives;
}

// 메시지 표시
// 메시지 엘리먼트를 전역 변수로 추적
let persistentMessageElement = null;

function showMessage(text, type, persistent = false) {
    // 이미 존재하는 메시지 제거
    if (persistentMessageElement) {
        persistentMessageElement.remove();
        persistentMessageElement = null;
    }

    const messageElement = document.createElement('div');
    messageElement.textContent = text;
    messageElement.style.position = 'absolute';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.padding = '20px';
    messageElement.style.borderRadius = '10px';
    messageElement.style.fontSize = '24px';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.zIndex = '100';
    messageElement.style.color = 'white';
    messageElement.style.backgroundColor =
        type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)';

    document.getElementById('game-container').appendChild(messageElement);

    if (persistent) {
        // 전역 변수에 저장하여 나중에 제거할 수 있게 함
        persistentMessageElement = messageElement;
    } else {
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
}

function togglePause() {
    if (isGameRunning) {
        isPaused = !isPaused;
        if (isPaused) {
            // 일시정지 시작 시점 기록
            pauseStartTime = performance.now();

            cancelAnimationFrame(animationFrame);
            showMessage('게임 일시정지', 'success', true);
        } else {
            // 일시정지 해제 시점 - 일시정지 지속시간 계산하여 누적
            const pauseEndTime = performance.now();
            totalPauseDuration += (pauseEndTime - pauseStartTime);

            lastTime = performance.now();

            animationFrame = requestAnimationFrame(update);

            if (persistentMessageElement) {
                persistentMessageElement.remove();
                persistentMessageElement = null;
            }
            showMessage('게임 재개', 'success');
        }
    }
}


// MARK: 프레임 업데이트
function update(currentTime = 0) {
    const deltaTime = currentTime - lastTime;

    if (deltaTime < FRAME_DELAY) {
        animationFrame = requestAnimationFrame(update);
        return;
    }

    lastTime = currentTime - (deltaTime % FRAME_DELAY);
    const timeMultiplier = deltaTime / FRAME_DELAY;

    if (isGameRunning && !isPaused) {
        // 남은 시간 (ms)
        const elapsedTime = currentTime - gameStartTime - totalPauseDuration;
        const timeLeft = Math.max(0, 120000 - elapsedTime);

        // 분과 초 계산
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);

        // 화면에 표시 (두자리 숫자 포맷)
        document.getElementById('timer').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // 시간 초과 시 게임 종료 처리
        if (timeLeft <= 0) {
            showMessage('시간 초과! 게임 종료', 'error');
            isGameRunning = false;
            cancelAnimationFrame(animationFrame);
            return;
        }

        // 이하 기존 게임 로직 계속...

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        drawLives();

        let result = collisionDetection();
        if (result) {
            cancelAnimationFrame(animationFrame);
            return;
        }

        if (ball.x + ball.speedX > canvas.width - ball.radius || ball.x + ball.speedX < 0 + ball.radius) {
            ball.speedX = -ball.speedX;
        }

        if (ball.y + ball.speedY < 0 + ball.radius) {
            ball.speedY = -ball.speedY;
        }

        if (isHit(ball, paddle.x, paddle.y, paddle.width, paddle.height)) {
            const paddleCenter = paddle.x + paddle.width / 2;
            const ballDistFromCenter = ball.x - paddleCenter;

            ball.speedX = ballDistFromCenter * 0.15;
            ball.speedX = Math.min(ball.speedX, BALL_SPEED * 0.9);
            ball.speedX = Math.max(ball.speedX, -BALL_SPEED * 0.9);

            ball.speedY = -Math.sqrt(BALL_SPEED * BALL_SPEED - ball.speedX * ball.speedX);
        }

        if (ball.y + ball.speedY > canvas.height - ball.radius) {
            lives--;
            document.getElementById('lives').textContent = lives;

            if (lives === 0) {
                showMessage('게임 오버!', 'error');
                isGameRunning = false;
                cancelAnimationFrame(animationFrame);
                return;
            } else {
                ball.x = canvas.width / 2;
                ball.y = canvas.height - 30;
                ball.speedX = 0;
                ball.speedY = -BALL_SPEED;
            }
        }

        if (rightPressed && paddle.x < canvas.width - paddle.width) {
            paddle.x += 7 * timeMultiplier;
        } else if (leftPressed && paddle.x > 0) {
            paddle.x -= 7 * timeMultiplier;
        }

        ball.x += ball.speedX * timeMultiplier;
        ball.y += ball.speedY * timeMultiplier;
    }

    if (isGameRunning) {
        animationFrame = requestAnimationFrame(update);
    }
}
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.speedX = 0;
    ball.speedY = -BALL_SPEED;
}
// MARK: 게임 시작
function startGame() {
    if (!isGameRunning) {
        // 이전 애니메이션 프레임이 있다면 취소
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        isGameRunning = true;
        isPaused = false;
        score = 0;
        lives = TOTAL_LIVES;

        // 시간 기반 애니메이션 변수 초기화
        lastTime = performance.now();
        gameStartTime = performance.now();  // 게임 시작 시간 기록
        // 게임 상태 초기화
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;

        // 벽돌 초기화
        initBricks();

        // 공과 패들 위치 초기화
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 30;
        ball.speedX = 0; // X 속도는 0으로 시작 (직선 위 방향)
        ball.speedY = -BALL_SPEED; // 위로 향하는 일정한 속도
        paddle.x = (canvas.width - paddle.width) / 2;

        // 애니메이션 프레임 시작
        animationFrame = requestAnimationFrame(update);

        // 시작 메시지
        showMessage('게임 시작!', 'success');
    }
}



// 게임 재시작
function restartGame() {
    // 현재 실행 중인 애니메이션 프레임 취소
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    isGameRunning = false;
    lastTime = 0; // 시간 변수 초기화
    setTimeout(startGame, 100);
}

// 초기화 및 게임 루프 시작
initBricks();
// 초기 상태에서는 애니메이션을 시작만 하고 게임은 시작하지 않음
animationFrame = requestAnimationFrame(update);