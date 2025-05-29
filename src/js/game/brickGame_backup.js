/**
 * BrickGame class
 * - GameManager를 상속받아 벽돌깨기 게임을 구현
 * - 공이 패들과 벽돌에 부딪히며 벽돌을 깨는 게임
 */

class BrickGame extends GameManager {
  constructor(canvas) {    super(canvas); // GameManager 생성자 호출

    // MARK: 벽돌깨기 전용 설정
    this.leftBrick = 0;

    // MARK: 벽돌 관련 설정
    this.BRICK_WIDTH = 80;
    this.BRICK_HEIGHT = 80;
    this.BRICK_PADDING = 10;
    this.BRICK_OFFSET_TOP = 60;
    this.BRICK_OFFSET_LEFT = 30;
    this.bricks = [];

    // MARK: 동적 조합 시스템 설정 추가
    this.combinations = []; // 현재 화면에 있는 조합들
    this.combinationSpeed = 2; // 조합 이동 속도
    this.combinationSpawnInterval = 3000; // 조합 생성 간격 (ms)
    this.lastCombinationSpawn = 0;
    this.clearedCombinations = 0; // 클리어한 조합 수
    this.requiredCombinations = 10; // 스테이지 클리어에 필요한 조합 수

    // MARK: 이미지 관련 속성
    this.paddleImage = null; // 패들 이미지 객체 초기화

    this.targetPokemonImages = [];
    this.targetPokemonIndexes = [];
    // 타입별 색상 매핑
    this.typeColorMap = {
      0: "#66BB6A", // 풀
      1: "#FF7043", // 불
      2: "#FFD54F", // 전기
      3: "#4FC3F7", // 물
      4: "#81D4FA", // 얼음
    };
    this.totalPokemonCount = 107;
    
    // MARK: 스테이지별 특별 포켓몬 설정 추가
    this.specialPokemon = {
      1: 105, // stage1: 피카츄
      2: 106  // stage2: 팽도리
    };
  }
  /**
   * 스테이지별 조합 패턴 정의 메서드 추가
   */
  getCombinationPatterns() {
    const patterns = {
      1: [ // Stage 1 패턴들
        [[1, 1], [1, 1]], // 2x2 사각형
        [[1], [1], [1]], // 세로 3칸
        [[1, 1, 1]], // 가로 3칸
        [[1, 0], [1, 1]], // L자 모양
      ],
      2: [ // Stage 2 패턴들  
        [[1, 1, 1], [1, 0, 1]], // T자 모양
        [[1, 1], [1, 1], [1, 1]], // 2x3 직사각형
        [[1, 0, 1], [1, 1, 1]], // 역T자 모양
        [[1, 1, 1, 1]], // 가로 4칸
      ],
      3: [ // Stage 3 패턴들
        [[1, 1, 1], [0, 1, 0], [0, 1, 0]], // 십자 모양
        [[1, 0, 1], [1, 1, 1], [1, 0, 1]], // 플러스 모양
        [[1, 1, 1], [1, 1, 1]], // 2x3 직사각형
        [[1, 1, 0], [0, 1, 1]], // 지그재그
      ],
      4: [ // Stage 4 패턴들
        [[1, 1, 1, 1], [1, 0, 0, 1]], // 큰 사각틀
        [[1, 0, 1], [1, 1, 1], [1, 0, 1], [1, 0, 1]], // 큰 십자
        [[1, 1, 1], [1, 1, 1], [1, 1, 1]], // 3x3 사각형
        [[1, 1, 1, 1, 1]], // 가로 5칸
      ]
    };
    return patterns[this.stage] || patterns[1];
  }

  /**
   * 조합에 들어갈 포켓몬 배치 생성 메서드 추가
   */
  generatePokemonForCombination(pattern) {
    const slotCount = pattern.flat().filter(cell => cell === 1).length;
    const pokemonList = [];
    const currentSpecialPokemon = this.specialPokemon[this.stage];
    let hasSpecialPokemon = false;

    // 특별 포켓몬이 아직 구출되지 않았다면 한 번만 포함
    if (currentSpecialPokemon && !this.saved_pokemon.includes(currentSpecialPokemon)) {
      pokemonList.push(currentSpecialPokemon);
      hasSpecialPokemon = true;
    }

    // 나머지 슬롯을 일반 포켓몬으로 채움
    const remainingSlots = slotCount - (hasSpecialPokemon ? 1 : 0);
    const availablePokemon = Array.from({length: this.totalPokemonCount}, (_, i) => i)
      .filter(i => i !== currentSpecialPokemon); // 특별 포켓몬 제외

    for (let i = 0; i < remainingSlots; i++) {
      const randomIndex = Math.floor(Math.random() * availablePokemon.length);
      pokemonList.push(availablePokemon[randomIndex]);
    }

    // 포켓몬 리스트를 랜덤하게 섞기
    return pokemonList.sort(() => Math.random() - 0.5);
  }

  /**
   * 새로운 조합 생성 메서드 추가
   */
  createNewCombination() {
    const patterns = this.getCombinationPatterns();
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const pokemonList = this.generatePokemonForCombination(randomPattern);
    
    let pokemonIndex = 0;
    const combination = {
      pattern: randomPattern,
      bricks: [],
      x: -200, // 화면 왼쪽 밖에서 시작
      y: this.BRICK_OFFSET_TOP + Math.random() * 200, // 랜덤 높이
      speed: this.combinationSpeed
    };

    // 패턴에 따라 벽돌 생성
    for (let row = 0; row < randomPattern.length; row++) {
      for (let col = 0; col < randomPattern[row].length; col++) {
        if (randomPattern[row][col] === 1) {
          const brickX = combination.x + col * (this.BRICK_WIDTH + this.BRICK_PADDING);
          const brickY = combination.y + row * (this.BRICK_HEIGHT + this.BRICK_PADDING);
          const pokeIndex = pokemonList[pokemonIndex++];
          
          const imagePath = `../assets/images/game/pokemon/${pokeIndex}.png`;
          const pokeType = window.pokemon?.[pokeIndex]?.type;
          const slotColor = this.typeColorMap[pokeType] || "#eee";
          const isTarget = this.targetPokemonIndexes.includes(pokeIndex);

          const brick = new Brick(
            brickX,
            brickY,
            this.BRICK_WIDTH,
            this.BRICK_HEIGHT,
            pokeIndex,
            pokeType,
            isTarget,
            imagePath
          );
          brick.type = pokeType;
          brick.color = slotColor;
          brick.status = 1;
          brick.combination = combination; // 조합 참조 추가
          
          combination.bricks.push(brick);
        }
      }
    }

    this.combinations.push(combination);
    console.log(`새로운 조합 생성: ${combination.bricks.length}개 블록`);
  }
  /**
   * 게임별 초기화 (GameManager 오버라이드)
   */
  initializeGame() {
    // 기본 게임 오브젝트 초기화는 부모에서 처리
    this.initializeGameObjects();

    // 동적 조합 시스템 초기화
    this.initDynamicBrickSystem();
    this.totalLives = this.lives;
  }

  /**
   * 동적 벽돌 시스템 초기화 메서드 추가
   */
  initDynamicBrickSystem() {
    // 타겟 포켓몬 설정
    this.targetPokemonIndexes = [];
    while (this.targetPokemonIndexes.length < 4) {
      const rand = Math.floor(Math.random() * this.totalPokemonCount);
      if (!this.targetPokemonIndexes.includes(rand)) {
        this.targetPokemonIndexes.push(rand);
      }
    }

    this.targetPokemonImages = this.targetPokemonIndexes.map(
      (index) => `../assets/images/game/pokemon/${index}.png`
    );

    // 조합 시스템 초기화
    this.combinations = [];
    this.clearedCombinations = 0;
    this.lastCombinationSpawn = 0;
    this.leftBrick = 0;

    console.log(`타겟 포켓몬: ${this.targetPokemonIndexes}`);
    console.log(`특별 포켓몬 (Stage ${this.stage}): ${this.specialPokemon[this.stage]}`);
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

    this.targetPokemonImages = this.targetPokemonIndexes.map(
      (index) => `../assets/images/game/pokemon/${index}.png`,
    );

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
        const brickX =
          c * (this.BRICK_WIDTH + this.BRICK_PADDING) + this.BRICK_OFFSET_LEFT;
        const brickY =
          r * (this.BRICK_HEIGHT + this.BRICK_PADDING) + this.BRICK_OFFSET_TOP;
        let isTarget = false;
        let pokeIndex;
        const targetIdx = targetPositions.findIndex(
          (pos) => pos.c === c && pos.r === r,
        );
        if (targetIdx !== -1) {
          isTarget = true;
          pokeIndex = this.targetPokemonIndexes[targetIdx];
        } else {
          do {
            pokeIndex = Math.floor(Math.random() * this.totalPokemonCount);
          } while (this.targetPokemonIndexes.includes(pokeIndex));
        }

        const imagePath = `../assets/images/game/pokemon/${pokeIndex}.png`;
        const pokeType = window.pokemon?.[pokeIndex]?.type;
        const slotColor = this.typeColorMap[pokeType] || "#eee";

        this.bricks[c][r] = new Brick(
          brickX,
          brickY,
          this.BRICK_WIDTH,
          this.BRICK_HEIGHT,
          pokeIndex,
          window.pokemon?.[pokeIndex]?.type,
          isTarget,
          imagePath,
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

    // 조합 생성 및 이동 시스템 추가
    this.updateCombinations(timeMultiplier);

    // 화면 밖 감지 조건 정의
    const ballIsOutOfScreenLeft = this.ball.x <= -this.ball.radius;
    const ballIsOutOfScreenTop = this.ball.y <= -this.ball.radius;
    const ballIsOutOfScreenRight = this.ball.x - this.ball.radius > this.canvas.width;
    const ballIsOutOfScreenBottom = this.ball.y + this.ball.radius > this.canvas.height;
    const isBallMissing = isNaN(this.ball.x) || isNaN(this.ball.y);

    if (ballIsOutOfScreenLeft || ballIsOutOfScreenRight || ballIsOutOfScreenTop || ballIsOutOfScreenBottom || isBallMissing) {
      // 공이 화면 밖으로 나간 경우: 생명 감소 및 위치/속도 초기화
      this.lives -= 1;

      if (this.lives <= 0) {
        this.isGameClear = false;
        this.showMessage("게임 오버!", "error", true);
        this.endGame();
        return;
      }

      // 공 위치 및 속도 초기화
      this.ball.x = this.canvas.width / 2;
      this.ball.y = this.canvas.height - 30;
      this.ball.speedX = 0;
      this.ball.speedY = -this.BALL_SPEED;
    } else {
      // 공이 화면 안에 있는 경우: 일반 벽 충돌(바운스) 처리
      // 좌우 벽 충돌
      if (this.ball.x - this.ball.radius <= 0) {
        this.ball.speedX = -this.ball.speedX;
        this.ball.x = this.ball.radius;
      } else if (this.ball.x + this.ball.radius >= this.canvas.width) {
        this.ball.speedX = -this.ball.speedX;
        this.ball.x = this.canvas.width - this.ball.radius;
      }

      // 상단 벽 충돌
      if (this.ball.y - this.ball.radius <= 0) {
        this.ball.speedY = -this.ball.speedY;
        this.ball.y = this.ball.radius;
      }
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
      this.ball.speedX = (ballDistFromCenter / (this.paddle.width / 2)) * this.BALL_SPEED;
      this.ball.speedY = -Math.sqrt(this.BALL_SPEED ** 2 - this.ball.speedX ** 2);
    }

    // 벽돌과 공 충돌 (동적 조합 시스템으로 변경)
    this.dynamicCollisionDetection();

    // 승리 조건 확인
    this.checkWin();

    // 모든 객체 그리기
    this.drawBall();
    this.drawPaddle();
    this.drawDynamicBricks(); // 동적 벽돌 그리기로 변경
  }

  /**
   * 조합 시스템 업데이트 메서드 추가
   */
  updateCombinations(timeMultiplier) {
    const currentTime = Date.now();
    
    // 새 조합 생성 (일정 간격으로)
    if (currentTime - this.lastCombinationSpawn > this.combinationSpawnInterval) {
      this.createNewCombination();
      this.lastCombinationSpawn = currentTime;
    }

    // 기존 조합들 이동 및 정리
    for (let i = this.combinations.length - 1; i >= 0; i--) {
      const combination = this.combinations[i];
      combination.x += combination.speed * timeMultiplier;

      // 조합의 모든 벽돌 위치 업데이트
      combination.bricks.forEach((brick, brickIndex) => {
        const pattern = combination.pattern;
        let row = 0, col = 0;
        let count = 0;
        
        // 패턴에서 현재 벽돌의 위치 찾기
        for (let r = 0; r < pattern.length; r++) {
          for (let c = 0; c < pattern[r].length; c++) {
            if (pattern[r][c] === 1) {
              if (count === brickIndex) {
                row = r;
                col = c;
                break;
              }
              count++;
            }
          }
        }
        
        brick.x = combination.x + col * (this.BRICK_WIDTH + this.BRICK_PADDING);
        brick.y = combination.y + row * (this.BRICK_HEIGHT + this.BRICK_PADDING);
      });

      // 화면을 벗어난 조합 제거
      if (combination.x > this.canvas.width + 200) {
        this.combinations.splice(i, 1);
        continue;
      }

      // 조합의 모든 벽돌이 부서졌는지 확인
      const activeBricks = combination.bricks.filter(brick => brick.status === 1);
      if (activeBricks.length === 0) {
        this.combinations.splice(i, 1);
        this.clearedCombinations++;
        console.log(`조합 클리어! 총 ${this.clearedCombinations}개 조합 클리어`);
      }
    }
  }

  /**
   * 동적 벽돌 충돌 감지 메서드 추가
   */
  dynamicCollisionDetection() {
    for (const combination of this.combinations) {
      for (const brick of combination.bricks) {
        if (brick.status === 1 && brick.isBrickHit(this.ball)) {
          // 겹침 영역 계산을 통한 방향 감지
          const overlapLeft = this.ball.x + this.ball.radius - brick.x;
          const overlapRight = brick.x + this.BRICK_WIDTH - (this.ball.x - this.ball.radius);
          const overlapTop = this.ball.y + this.ball.radius - brick.y;
          const overlapBottom = brick.y + this.BRICK_HEIGHT - (this.ball.y - this.ball.radius);

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            this.ball.speedX = -this.ball.speedX;
          } else {
            this.ball.speedY = -this.ball.speedY;
          }

          brick.status = 0; // 벽돌 부서짐
          this.score += 10;

          // 타겟 포켓몬이거나 특별 포켓몬인 경우 슬롯에 추가
          if (brick.isTarget && this.targetPokemonIndexes.includes(brick.pokeIndex)) {
            const imagePath = `../assets/images/game/pokemon/${brick.pokeIndex}.png`;
            this.addPokemonToSlot(imagePath);
          } else if (this.specialPokemon[this.stage] === brick.pokeIndex) {
            // 특별 포켓몬 구출
            this.saved_pokemon.push(brick.pokeIndex);
            const imagePath = `../assets/images/game/pokemon/${brick.pokeIndex}.png`;
            this.addPokemonToSlot(imagePath);
            console.log(`특별 포켓몬 구출: ${window.pokemon[brick.pokeIndex]?.name}`);
          }

          this.checkWin();
          return; // 한 프레임에 하나의 벽돌만 처리
        }
      }
    }
  }// 공의 중심 x가 -radius 이하 (완전히 왼쪽 밖)
    const ballIsOutOfScreenTop = this.ball.y <= -this.ball.radius; // 공의 중심 y가 -radius 이하 (완전히 위쪽 밖)
    const ballIsOutOfScreenRight =
      this.ball.x - this.ball.radius > this.canvas.width; // 공의 왼쪽 끝이 캔버스 오른쪽을 넘어감 (완전히 오른쪽 밖)
    const ballIsOutOfScreenBottom =
      this.ball.y + this.ball.radius > this.canvas.height; // 기존 하단 아웃 조건 (공의 아래쪽 끝이 캔버스 하단을 넘어감)
    const isBallMissing = isNaN(this.ball.x) || isNaN(this.ball.y);

    if (
      ballIsOutOfScreenLeft ||
      ballIsOutOfScreenRight ||
      ballIsOutOfScreenTop ||
      ballIsOutOfScreenBottom ||
      isBallMissing
    ) {
      // 공이 화면 밖으로 나간 경우: 생명 감소 및 위치/속도 초기화
      this.lives -= 1; // 생명 감소
      // console.log(`Ball went out of bounds. Condition: L=${ballIsOutOfScreenLeft}, R=${ballIsOutOfScreenRight}, T=${ballIsOutOfScreenTop}, B=${ballIsOutOfScreenBottom}, M=${isBallMissing}. Lives left: ${this.lives}`); // 수정: 아웃된 조건 로그 추가

      if (this.lives <= 0) {
        this.isGameClear = false;
        this.showMessage("게임 오버!", "error", true);
        this.endGame();
        return; // 게임 종료 시 더 이상 진행하지 않음
      }

      // 공 위치 및 속도 초기화
      this.ball.x = this.canvas.width / 2;
      this.ball.y = this.canvas.height - 30; // 패들 근처 또는 안전한 위치
      this.ball.speedX = 0;
      this.ball.speedY = -this.BALL_SPEED; // 위로 다시 발사
      // console.log(`Ball reset after going out of bounds. New position x: ${this.ball.x}, y: ${this.ball.y}`); // 수정: 리셋 로그 추가
    } else {
      // 공이 화면 안에 있는 경우: 일반 벽 충돌(바운스) 처리
      // 좌우 벽 충돌
      if (this.ball.x - this.ball.radius <= 0) {
        // 왼쪽 벽에 닿음 (튕김)
        this.ball.speedX = -this.ball.speedX;
        this.ball.x = this.ball.radius; // 공이 벽을 넘어가지 않도록 위치 조정
        // console.log(`Ball bounced off left wall. New x: ${this.ball.x}`); // 추가: 왼쪽 벽 충돌 로그
      } else if (this.ball.x + this.ball.radius >= this.canvas.width) {
        // 오른쪽 벽에 닿음 (튕김)
        this.ball.speedX = -this.ball.speedX;
        this.ball.x = this.canvas.width - this.ball.radius; // 위치 조정
        // console.log(`Ball bounced off right wall. New x: ${this.ball.x}`); // 추가: 오른쪽 벽 충돌 로그
      }

      // 상단 벽 충돌
      if (this.ball.y - this.ball.radius <= 0) {
        // 상단 벽에 닿음 (튕김)
        this.ball.speedY = -this.ball.speedY;
        this.ball.y = this.ball.radius; // 위치 조정
        // console.log(`Ball bounced off top wall. New y: ${this.ball.y}`); // 추가: 상단 벽 충돌 로그
      }
    }

    // 패들 이동 처리
    if (
      this.keys.rightPressed &&
      this.paddle.x < this.canvas.width - this.paddle.width
    ) {
      this.paddle.x += 7 * timeMultiplier;
    } else if (this.keys.leftPressed && this.paddle.x > 0) {
      this.paddle.x -= 7 * timeMultiplier;
    }

    // 패들과 공 충돌
    if (
      isHit(
        this.ball,
        this.paddle.x,
        this.paddle.y,
        this.paddle.width,
        this.paddle.height,
      )
    ) {
      const paddleCenter = this.paddle.x + this.paddle.width / 2;
      const ballDistFromCenter = this.ball.x - paddleCenter;
      this.ball.speedX =
        (ballDistFromCenter / (this.paddle.width / 2)) * this.BALL_SPEED; // 패들 중앙에서의 거리 비율로 속도 조정
      this.ball.speedY = -Math.sqrt(
        this.BALL_SPEED ** 2 - this.ball.speedX ** 2,
      ); // 공의 속도 조정
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
            const overlapRight =
              b.x + this.BRICK_WIDTH - (this.ball.x - this.ball.radius);
            const overlapTop = this.ball.y + this.ball.radius - b.y;
            const overlapBottom =
              b.y + this.BRICK_HEIGHT - (this.ball.y - this.ball.radius);

            // 가장 작은 겹침이 발생한 방향이 충돌 방향
            const minOverlap = Math.min(
              overlapLeft,
              overlapRight,
              overlapTop,
              overlapBottom,
            );

            if (minOverlap === overlapLeft || minOverlap === overlapRight) {
              this.ball.speedX = -this.ball.speedX; // 좌/우 충돌
            } else {
              this.ball.speedY = -this.ball.speedY; // 상/하 충돌
            }

            b.status = 0; // 벽돌 부서짐
            this.score += 10; // 점수 추가
            this.leftBrick--; // 남은 벽돌 수 감소

            if (b.isTarget && this.targetPokemonIndexes.includes(b.pokeIndex)) {
              const imagePath = `../assets/images/game/pokemon/${b.pokeIndex}.png`;
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
        return; // 이미 들어있는 포켓몬은 중복 추가 안 함
      }
    }

    // 빈 슬롯 찾아서 추가
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`slot-${i}`);
      const bg = slot.style.backgroundImage;

      if (!bg || bg === "none") {
        slot.style.backgroundImage = `url(${imageSrc})`;
        slot.style.backgroundSize = "cover";
        slot.style.backgroundPosition = "center";
        const indexMatch = imageSrc.match(/(\d+)\.png/);
        if (indexMatch) {
          const index = parseInt(indexMatch[1]);
          const type = window.pokemon?.[index]?.type;
          const color = this.typeColorMap[type] || "#eee";
          slot.style.backgroundColor = color;
        }
        return;
      }
    }
  }

  /**
   * 포켓몬 슬롯 초기화
   */
  clearPokemonSlots() {
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`slot-${i}`);
      slot.style.backgroundImage = "none";
      slot.style.backgroundColor = "transparent"; // 혹은 초기 색상으로 지정
    }
  }

  /**
   * 승리 조건 확인
   */
  checkWin() {
    // 모든 벽돌이 부서졌다면
    if (this.leftBrick === 0) {
      this.isGameClear = true;
      this.showMessage("축하합니다! 모든 벽돌을 깨셨습니다!", "success", true);
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
  } /**
   * 패들 그리기
   */
  drawPaddle() {
    // 이미지 객체 생성 및 캐싱을 위한 정적 변수 사용
    if (!this.paddleImage) {
      this.paddleImage = new Image(); // 패들 이미지 객체 생성
      this.paddleImage.src = "../assets/images/game/object/bar.png"; // index.html 기준 상대 경로로 수정
    }

    // 이미지가 로드되었는지 확인
    if (this.paddleImage.complete) {
      // 이미지를 패들과 같은 크기로 그리기
      this.ctx.drawImage(
        this.paddleImage,
        this.paddle.x,
        this.paddle.y,
        this.paddle.width,
        this.paddle.height,
      );
    } else {
      // 이미지 로딩 중일 때는 기존 사각형으로 대체
      this.ctx.beginPath();
      this.ctx.rect(
        this.paddle.x,
        this.paddle.y,
        this.paddle.width,
        this.paddle.height,
      );
      this.ctx.fillStyle = this.paddle.color;
      this.ctx.fill();
      this.ctx.closePath();
    }
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
  restartGame() {
    this.clearPokemonSlots(); // 슬롯 초기화
    super.restartGame(); // 부모 클래스의 재시작 메서드 호출
  }
}
