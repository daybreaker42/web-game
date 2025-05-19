// 게임 캔버스 및 컨텍스트 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let animationFrame = null;

// #region 게임 상태 변수
let score = 0;
let lives = 3;
let isGameRunning = false;
let isPaused = false;
let leftBrick = 0;

// 공 변수
let ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    speedX: 5,
    speedY: -5,
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

            bricks[c][r] = new Brick({
                x: 0,
                y: 0,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color: randomColor
            });
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
        const relativeX = e.clientX - canvas.offsetLeft;
        const relativeY = e.clientY - canvas.offsetTop;
        console.log(relativeX, relativeY);
        // 패들이 캔버스 내부에 있도록 제한
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

// MARK: 충돌 감지
// 모든 벽돌에 대해 공과의 충돌을 확인
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                // 활성화된 벽돌에 대해서만 충돌 감지
                if (b.isHit(ball)) {
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
                    console.log(`Score: ${score}`);
                    leftBrick--; // 남은 벽돌 수 감소

                    // 점수 업데이트
                    document.getElementById('score').textContent = score;

                    // 모든 벽돌을 부쉈는지 확인
                    checkWin();

                    // 한 프레임에 하나의 벽돌만 처리
                    return;
                }
            }
        }
    }
}

// MARK: 승리 조건 확인
function checkWin() {
    let brickCount = 0;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                brickCount++;
            }
        }
    }

    // 모든 벽돌이 부서졌다면
    if (brickCount === 0) {
        showMessage('축하합니다! 모든 벽돌을 깨셨습니다!', 'success');
        isGameRunning = false;
        // 승리 시 애니메이션 프레임 취소
        cancelAnimationFrame(animationFrame);
    }
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
                // 벽돌의 위치 계산
                const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;

                // 계산된 위치 저장
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                // 벽돌 그리기
                ctx.beginPath();
                ctx.rect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();
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
function showMessage(text, type) {
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

    if (type === 'success') {
        messageElement.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
    } else {
        messageElement.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
    }

    messageElement.style.color = 'white';
    document.getElementById('game-container').appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// MARK: 프레임 업데이트
function update() {
    if (isGameRunning && !isPaused) {
        // 캔버스 초기화
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 게임 요소 그리기
        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        drawLives();

        // 충돌 감지
        collisionDetection();

        // 벽 반사 처리 (좌우 벽)
        if (ball.x + ball.speedX > canvas.width - ball.radius || ball.x + ball.speedX < ball.radius) {
            ball.speedX = -ball.speedX;
        }

        // 천장 반사 처리
        if (ball.y + ball.speedY < ball.radius) {
            ball.speedY = -ball.speedY;
        }
            // TODO - 여기 부분 로직 수정 필요, 현재는 바닥에 닿을 때, paddle범위내에 있으면 튀기는 방식
        // 바닥 처리 - 생명 감소 또는 게임 오버
        else if (ball.y + ball.speedY > canvas.height - ball.radius) {
            if (isHit(ball, paddle.x, paddle.y, paddle.width, paddle.height)) {
                // 패들에 맞는지 확인
                // 공이 패들에 부딪히면 위로 튕김
                ball.speedY = -ball.speedY;

                // 패들의 위치에 따라 X 속도 조정 (더 역동적인 게임플레이)
                const paddleCenter = paddle.x + paddle.width / 2;
                const ballDistFromCenter = ball.x - paddleCenter;

                // 패들 중앙에서 떨어진 거리에 따라 X 속도 조절
                ball.speedX = ballDistFromCenter * 0.15;

                // x방향 속도 최대, 최소값 지정
                ball.speedX = Math.min(ball.speedX, 5);
                ball.speedX = Math.max(ball.speedX, -5);
            } else {
                // 바닥에 부딫힌 경우
                lives--;
                document.getElementById('lives').textContent = lives;

                if (lives === 0) {
                    showMessage('게임 오버!', 'error');
                    isGameRunning = false;
                    cancelAnimationFrame(animationFrame); // 게임 오버 시 애니메이션 중단
                    return;
                } else {
                    // 공 위치 재설정
                    ball.x = canvas.width / 2;
                    ball.y = canvas.height - 30;
                    ball.speedX = 5;
                    ball.speedY = -5;
                }
            }
        }

        // 패들 이동 처리
        if (rightPressed && paddle.x < canvas.width - paddle.width) {
            paddle.x += 7;
        } else if (leftPressed && paddle.x > 0) {
            paddle.x -= 7;
        }

        // 공 이동
        ball.x += ball.speedX;
        ball.y += ball.speedY;
    }

    // 게임이 실행 중이고 일시정지 상태가 아닐 때만 다음 애니메이션 프레임 요청
    if (isGameRunning) {
        animationFrame = requestAnimationFrame(update);
    }
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
        lives = 3;

        // 게임 상태 초기화
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;

        // 벽돌 초기화
        initBricks();

        // 공과 패들 위치 초기화
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 30;
        ball.speedX = 5;
        ball.speedY = -5;
        paddle.x = (canvas.width - paddle.width) / 2;

        // 애니메이션 프레임 시작
        animationFrame = requestAnimationFrame(update);

        // 시작 메시지
        showMessage('게임 시작!', 'success');
    }
}

// 일시정지 토글
function togglePause() {
    if (isGameRunning) {
        isPaused = !isPaused;
        if (isPaused) {
            // 게임 일시정지 시 애니메이션 프레임 취소
            cancelAnimationFrame(animationFrame);
            showMessage('게임 일시정지', 'success');
        } else {
            // 게임 재개 시 애니메이션 프레임 다시 요청
            animationFrame = requestAnimationFrame(update);
            showMessage('게임 재개', 'success');
        }
    }
}

// 게임 재시작
function restartGame() {
    // 현재 실행 중인 애니메이션 프레임 취소
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    isGameRunning = false;
    setTimeout(startGame, 100);
}

// 초기화 및 게임 루프 시작
initBricks();
// 초기 상태에서는 애니메이션을 시작만 하고 게임은 시작하지 않음
animationFrame = requestAnimationFrame(update);