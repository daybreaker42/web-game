// 게임 캔버스 및 컨텍스트 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let animationFrame = null;

// 시간 기반 애니메이션을 위한 변수
let lastTime = 0;
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
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 80;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 30;

// 타입별 색상 매핑
const typeColorMap = {
    0: '#66BB6A',  // 풀
    1: '#FF7043',  // 불
    2: '#FFD54F',  // 전기
    3: '#4FC3F7',  // 물
    4: '#81D4FA'   // 얼음
};

// 캔버스를 채우는 최대 벽돌 개수 계산
function calculateMaxBricks() {
    const maxColumns = Math.floor((canvas.width - BRICK_OFFSET_LEFT * 2 + BRICK_PADDING) / (BRICK_WIDTH + BRICK_PADDING));
    const maxRows = Math.floor((canvas.height / 2 - BRICK_OFFSET_TOP + BRICK_PADDING) / (BRICK_HEIGHT + BRICK_PADDING));
    return { maxColumns, maxRows };
}

const { maxColumns, maxRows } = calculateMaxBricks();
const brickRowCount = maxRows;
const brickColumnCount = maxColumns;

let bricks = [];
let targetPokemonImages = [];
let targetPokemonIndexes = [];

function initBricks() {
    const totalPokemonCount = 107;
    targetPokemonIndexes = [];
    while (targetPokemonIndexes.length < 4) {
        const rand = Math.floor(Math.random() * totalPokemonCount);
        if (!targetPokemonIndexes.includes(rand)) {
            targetPokemonIndexes.push(rand);
        }
    }

    targetPokemonImages = targetPokemonIndexes.map(index => `../../assets/images/game/pokemon/${index}.png`);

    const positions = [];
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            positions.push({ c, r });
        }
    }

    const shuffled = positions.sort(() => Math.random() - 0.5);
    const targetPositions = shuffled.slice(0, 4);

    bricks = [];
    let totalBricks = 0;

    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
            let isTarget = false;
            let pokeIndex;

            const targetIndex = targetPositions.findIndex(pos => pos.c === c && pos.r === r);
            if (targetIndex !== -1) {
                isTarget = true;
                pokeIndex = targetPokemonIndexes[targetIndex];
            } else {
                do {
                    pokeIndex = Math.floor(Math.random() * totalPokemonCount);
                } while (targetPokemonIndexes.includes(pokeIndex));
            }

            const imagePath = `../../assets/images/game/pokemon/${pokeIndex}.png`;
            const pokeType = window.pokemon?.[pokeIndex]?.type;
            const slotColor = typeColorMap[pokeType] || '#eee';

            const brick = new Brick(
                brickX,
                brickY,
                BRICK_WIDTH,
                BRICK_HEIGHT,
                pokeIndex,
                isTarget,
                imagePath
            );

            brick.type = pokeType;
            brick.slotColor = slotColor;

            bricks[c][r] = brick;
            totalBricks++;
        }
    }

    leftBrick = totalBricks;
    console.log('총 생성된 벽돌 수:', leftBrick);
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
            if (b.status === 1 && b.isBrickHit(ball)) {
                // 충돌 방향 계산
                const overlapLeft = ball.x + ball.radius - b.x;
                const overlapRight = b.x + BRICK_WIDTH - (ball.x - ball.radius);
                const overlapTop = ball.y + ball.radius - b.y;
                const overlapBottom = b.y + BRICK_HEIGHT - (ball.y - ball.radius);
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                    ball.speedX = -ball.speedX;
                } else {
                    ball.speedY = -ball.speedY;
                }

                b.status = 0;
                leftBrick--;
                score += 10;
                document.getElementById('score').textContent = score;

                if (b.isTarget && targetPokemonIndexes.includes(b.pokeIndex)) {
                    const imagePath = `../../assets/images/game/pokemon/${b.pokeIndex}.png`;
                    addPokemonToSlot(imagePath);
                }

                // 🛠 checkWin()은 여기서 호출만 하고
                checkWin();

                // 한 번만 처리
                return;
            }
        }
    }
}


function addPokemonToSlot(imageSrc) {
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
                const color = typeColorMap[type] || '#eee';
                slot.style.backgroundColor = color;
            }
            return;
        }
    }
}
function clearPokemonSlots() {
    for (let i = 0; i < 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.style.backgroundImage = 'none';
        slot.style.backgroundColor = 'transparent';  // 혹은 초기 색상으로 지정
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
            cancelAnimationFrame(animationFrame);
            showMessage('게임 일시정지', 'success', true); // <- 지속 메시지
        } else {
            lastTime = performance.now(); // 현재 시간으로 lastTime 초기화
            animationFrame = requestAnimationFrame(update);
            
            // 일시정지 메시지 제거
            if (persistentMessageElement) {
                persistentMessageElement.remove();
                persistentMessageElement = null;
            }
            
            showMessage('게임 재개', 'success'); // 재개 메시지는 자동 제거됨
        }
    }
}


// MARK: 프레임 업데이트
function update(currentTime = 0) {
    // 시간 기반 애니메이션: 프레임 간 경과 시간 계산
    const deltaTime = currentTime - lastTime;
    
    // 목표 FPS에 맞게 프레임 제한
    if (deltaTime < FRAME_DELAY) {
        animationFrame = requestAnimationFrame(update);
        return;
    }
    
    // 시간 업데이트
    lastTime = currentTime - (deltaTime % FRAME_DELAY);
    
    // 프레임 속도 계산을 위한 시간 계수
    const timeMultiplier = deltaTime / FRAME_DELAY;
    
    if (isGameRunning && !isPaused) {
        // 캔버스 초기화
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 게임 요소 그리기
        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        drawLives();
        
        // 벽돌과의 충돌 감지
        collisionDetection();
        
        
        // 벽 반사 처리 (좌우 벽)
        if (ball.x + ball.speedX > canvas.width - ball.radius || ball.x + ball.speedX < 0 + ball.radius) {
            ball.speedX = -ball.speedX;
        }
        
        // 천장 반사 처리
        if (ball.y + ball.speedY < 0 + ball.radius) {
            ball.speedY = -ball.speedY;
        } 
        
        if (isHit(ball, paddle.x, paddle.y, paddle.width, paddle.height)) {
            // 패들에 맞는지 확인
            // 공이 패들에 부딪히면 위로 튕김
            let ySign = ball.speedY > 0 ? -1 : 1;   // 현재 속도가 양수이면 -1, 음수이면 1
            
            // 패들의 위치에 따라 X 속도 조정 (더 역동적인 게임플레이)
            const paddleCenter = paddle.x + paddle.width / 2;
            const ballDistFromCenter = ball.x - paddleCenter;
            
            // 패들 중앙에서 떨어진 거리에 따라 X 속도 조절
            ball.speedX = ballDistFromCenter * 0.15;
            // x방향 속도 최대, 최소값 지정
            ball.speedX = Math.min(ball.speedX, BALL_SPEED * 0.9);
            ball.speedX = Math.max(ball.speedX, -BALL_SPEED * 0.9);
            
            // 바뀐 X값에 따라 Y값 조정
            ball.speedY = -Math.sqrt(BALL_SPEED * BALL_SPEED - ball.speedX * ball.speedX);
        }
        
        if (ball.y + ball.speedY > canvas.height - ball.radius) {
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
                ball.speedX = BALL_SPEED;
                ball.speedY = -BALL_SPEED;
            }
            
        }
        
        // 패들 이동 처리 - 시간 기반으로 수정
        if (rightPressed && paddle.x < canvas.width - paddle.width) {
            paddle.x += 7 * timeMultiplier;
        } else if (leftPressed && paddle.x > 0) {
            paddle.x -= 7 * timeMultiplier;
        }
        
        // 공 이동 - 시간 기반으로 수정
        ball.x += ball.speedX * timeMultiplier;
        ball.y += ball.speedY * timeMultiplier;
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
        lives = TOTAL_LIVES;
        
        // 시간 기반 애니메이션 변수 초기화
        lastTime = performance.now();
        
        // 게임 상태 초기화
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;
        
        // 벽돌 초기화
        initBricks();
        
        // 공과 패들 위치 초기화
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 30;
        ball.speedX = Math.sqrt(BALL_SPEED);
        ball.speedY = -Math.sqrt(BALL_SPEED);
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
    clearPokemonSlots();
    isGameRunning = false;
    lastTime = 0; // 시간 변수 초기화
    setTimeout(startGame, 100);
}

// 초기화 및 게임 루프 시작
initBricks();
// 초기 상태에서는 애니메이션을 시작만 하고 게임은 시작하지 않음
animationFrame = requestAnimationFrame(update);

