/**
 * GameManager class
 * - 게임 실행/상태 관리를 수행하는 클래스
 * - 벽돌깨기(game.js)와 보스전(boss.js)의 공통 기능을 제공
 */
class GameManager {
    constructor(canvas) {
        // 캔버스 설정
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationFrame = null;

        // MARK: 게임 설정 상수들
        this.FPS = 60;
        this.FRAME_DELAY = 1000 / this.FPS;

        // MARK: 게임 상태 변수들
        this.gameState = 'waiting'; // waiting, playing, paused, finished
        this.lastTime = 0;
        this.isGameRunning = false;
        this.isPaused = false;

        // MARK: 게임 정보
        this.mode = null;
        this.level = null;
        this.stage = null;
        this.score = 0;
        this.lives = 300; // 기본 생명력
        this.totalLives = 300;
        this.isGameClear = false;
        this.saved_pokemon = [];

        // MARK: 입력 상태
        this.keys = {
            rightPressed: false,
            leftPressed: false,
            spacePressed: false
        };

        // MARK: 공통 게임 오브젝트들
        this.ball = null;
        this.paddle = null;

        // MARK: 메시지 시스템
        this.persistentMessageElement = null;

        // 이벤트 리스너 바인딩
        this.bindEventListeners();
    }

    /**
     * 게임 정보를 설정하는 메서드
     */
    setGameInfo(data) {
        if (!data.mode) {
            throw new Error('게임 mode 설정 안됨');
        }
        if (!data.level) {
            throw new Error('게임 level 설정 안됨');
        }

        try {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
        } catch (e) {
            throw new Error('받은 data가 JSON 형식이 아닙니다');
        }

        if (typeof data.mode !== 'string' || typeof data.level !== 'string' || typeof data.stage !== 'number') {
            throw new Error('게임 정보의 형식이 유효하지 않습니다');
        }

        this.mode = data.mode;
        this.level = data.level;
        this.stage = data.stage;

        // 레벨에 따른 난이도 설정
        this.setDifficultyByLevel(data.level);
    }

    /**
     * 레벨에 따른 난이도 설정
     */
    setDifficultyByLevel(level) {
        switch (level) {
            case 'easy':
                this.totalLives = 500;
                break;
            case 'normal':
                this.totalLives = 300;
                break;
            case 'hard':
                this.totalLives = 100;
                break;
            default:
                this.totalLives = 300;
        }
        this.lives = this.totalLives;
    }

    /**
     * 공통 게임 오브젝트 초기화
     */
    initializeGameObjects() {
        // 공 초기화
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 30,
            speedX: Math.sqrt(5), // 기본 공 속도
            speedY: -Math.sqrt(5),
            radius: 10,
            color: '#ffeb3b',
            baseSpeed: 5
        };

        // 패들 초기화
        this.paddle = {
            height: 10,
            width: 110,
            x: (this.canvas.width - 110) / 2,
            y: this.canvas.height - 10,
            color: '#4CAF50'
        };
    }

    /**
     * 이벤트 리스너 바인딩
     */
    bindEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => this.keyDownHandler(e));
        document.addEventListener('keyup', (e) => this.keyUpHandler(e));

        // 마우스 이벤트
        document.addEventListener('mousemove', (e) => this.mouseMoveHandler(e));

        // 버튼 이벤트 (존재하는 경우만)
        const startButton = document.getElementById('startButton');
        const pauseButton = document.getElementById('pauseButton');
        const restartButton = document.getElementById('restartButton');

        if (startButton) startButton.addEventListener('click', () => this.startGame());
        if (pauseButton) pauseButton.addEventListener('click', () => this.togglePause());
        if (restartButton) restartButton.addEventListener('click', () => this.restartGame());
    }

    /**
     * 키보드 입력 처리
     */
    keyDownHandler(e) {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            this.keys.rightPressed = true;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            this.keys.leftPressed = true;
        } else if (e.code === 'Space') {
            this.keys.spacePressed = true;
            this.togglePause(); // 스페이스바로 일시정지 토글
        }
    }

    keyUpHandler(e) {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            this.keys.rightPressed = false;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            this.keys.leftPressed = false;
        } else if (e.code === 'Space') {
            this.keys.spacePressed = false;
        }
    }

    /**
     * 마우스 이동 처리
     */
    mouseMoveHandler(e) {
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
     * 메시지 표시 시스템
     */
    showMessage(text, type, persistent = false) {
        if (this.persistentMessageElement) {
            this.persistentMessageElement.remove();
            this.persistentMessageElement = null;
        }

        const messageElement = document.createElement('div');
        messageElement.textContent = text;
        messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 100;
            color: white;
            background-color: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
        `;

        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(messageElement);
        }

        if (persistent) {
            this.persistentMessageElement = messageElement;
        } else {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 3000);
        }
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        const scoreElement = document.getElementById('score');
        const livesElement = document.getElementById('lives');

        if (scoreElement) scoreElement.textContent = this.score;
        if (livesElement) livesElement.textContent = this.lives;
    }

    /**
     * 일시정지 토글
     */
    togglePause() {
        if (this.isGameRunning) {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                cancelAnimationFrame(this.animationFrame);
                this.showMessage('게임 일시정지', 'success', true);
            } else {
                this.lastTime = performance.now();
                this.animationFrame = requestAnimationFrame((time) => this.update(time));

                if (this.persistentMessageElement) {
                    this.persistentMessageElement.remove();
                    this.persistentMessageElement = null;
                }
                this.showMessage('게임 재개', 'success');
            }
        }
    }

    /**
     * 게임 시작
     */
    startGame() {
        if (!this.isGameRunning) {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }

            this.isGameRunning = true;
            this.isPaused = false;
            this.gameState = 'playing';
            this.score = 0;
            this.lives = this.totalLives;
            this.lastTime = performance.now();

            // 게임 오브젝트 초기화
            this.initializeGameObjects();

            // 하위 클래스의 초기화 메서드 호출
            if (this.initializeGame) {
                this.initializeGame();
            }

            this.updateUI();
            this.animationFrame = requestAnimationFrame((time) => this.update(time));
            this.showMessage('게임 시작!', 'success');
        }
    }

    /**
     * 게임 재시작
     */
    restartGame() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.isGameRunning = false;
        this.gameState = 'waiting';
        this.lastTime = 0;

        setTimeout(() => this.startGame(), 100);
    }

    /**
     * 메인 게임 루프 - 하위 클래스에서 오버라이드
     */
    update(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime < this.FRAME_DELAY) {
            this.animationFrame = requestAnimationFrame((time) => this.update(time));
            return;
        }

        this.lastTime = currentTime - (deltaTime % this.FRAME_DELAY);
        const timeMultiplier = deltaTime / this.FRAME_DELAY;

        if (this.isGameRunning && !this.isPaused) {
            // 캔버스 초기화
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 하위 클래스의 업데이트 메서드 호출
            if (this.updateGame) {
                this.updateGame(timeMultiplier);
            }

            this.updateUI();
        }

        if (this.isGameRunning) {
            this.animationFrame = requestAnimationFrame((time) => this.update(time));
        }
    }

    /**
     * 게임 종료
     */
    endGame() {
        this.isGameRunning = false;
        this.gameState = 'finished';

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        return {
            mode: this.mode,
            level: this.level,
            stage: this.stage,
            score: this.score,
            date: new Date().toISOString(),
            game_over: !this.isGameClear,
            saved_pokemon: this.saved_pokemon || [],
        };
    }

    // MARK: 하위 클래스에서 구현해야 할 추상 메서드들
    /**
     * 게임별 초기화 - 하위 클래스에서 구현
     */
    initializeGame() {
        // 하위 클래스에서 구현
    }

    /**
     * 게임별 업데이트 로직 - 하위 클래스에서 구현
     */
    updateGame(timeMultiplier) {
    // 하위 클래스에서 구현
    }
}