/**
 * BrickGame class
 * - GameManager를 상속받아 벽돌깨기 게임을 구현
 * - 동적 조합 시스템으로 공이 패들과 벽돌에 부딪히며 벽돌을 깨는 게임
 */

class BrickGame extends GameManager {
  constructor(canvas) {
    super(canvas);

    // MARK: 벽돌깨기 전용 설정
    this.leftBrick = 0;

    // MARK: 벽돌 관련 설정
    this.BRICK_WIDTH = 80;
    this.BRICK_HEIGHT = 80;
    this.BRICK_PADDING = 10;
    this.BRICK_OFFSET_TOP = 60;
    this.BRICK_OFFSET_LEFT = 30;
    this.bricks = [];    // MARK: 동적 조합 시스템 설정 추가
    this.combinations = []; // 현재 화면에 있는 조합들
    this.combinationSpeed = 2; // 조합 이동 속도
    this.combinationSpawnInterval = 6000; // 조합 생성 기본 간격 (6초) - 수정됨: 간격 조정
    this.combinationSpawnDelayWhenActive = 3000; // 화면에 조합이 있을 때 추가 대기시간 (3초) - 추가됨: 화면에 조합이 있을 때 대기시간
    this.lastCombinationSpawn = 0;
    this.clearedCombinations = 0; // 클리어한 조합 수
    this.requiredCombinations = 10; // 스테이지 클리어에 필요한 조합 수    // MARK: 이미지 관련 속성
    this.paddleImage = null;
    this.ballImage = null; // 공 이미지 추가

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

    // MARK: 포켓몬 능력 효과 상태 변수 추가
    this.electricBoostActive = false; // 전기타입 능력 (점수 2배) 활성 상태
    this.waterBoostActive = false; // 물타입 능력 (패들 크기 증가) 활성 상태  
    this.iceBoostActive = false; // 얼음타입 능력 (조합 속도 감소) 활성 상태
  }  /**
   * MARK: 모든 조합 패턴 정의 메서드 (스테이지 구분 없이 랜덤 선택)
   */
  getCombinationPatterns() {
    let patterns = [
      // 간단한 패턴들
      [[1, 1], [1, 1]], // 2x2 사각형
      [[1], [1], [1]], // 세로 3칸
      [[1, 1, 1]], // 가로 3칸
      [[1, 0], [1, 1]], // L자 모양
      // 중간 복잡도 패턴들
      [[1, 1, 1], [1, 0, 1]], // T자 모양
      [[1, 1], [1, 1], [1, 1]], // 2x3 직사각형
      [[1, 0, 1], [1, 1, 1]], // 역T자 모양
      [[1, 1, 1, 1]], // 가로 4칸
      // 복잡한 패턴들
      [[1, 1, 1], [0, 1, 0], [0, 1, 0]], // 십자 모양
      [[1, 0, 1], [1, 1, 1], [1, 0, 1]], // 플러스 모양
      [[1, 1, 1], [1, 1, 1]], // 2x3 직사각형
      [[1, 1, 0], [0, 1, 1]], // 지그재그
      // 고난도 패턴들
      [[1, 1, 1, 1], [1, 0, 0, 1]], // 큰 사각틀
      [[1, 0, 1], [1, 1, 1], [1, 0, 1], [1, 0, 1]], // 큰 십자
      [[1, 1, 1], [1, 1, 1], [1, 1, 1]], // 3x3 사각형
      [[1, 1, 1, 1, 1]] // 가로 5칸
    ];
    return patterns;
  }
  /**
   * MARK: 조합에 들어갈 포켓몬 배치 생성 메서드 추가
   */
  generatePokemonForCombination(pattern) {
    let slotCount = pattern.flat().filter(function (cell) { return cell === 1; }).length;
    let pokemonList = [];
    let currentSpecialPokemon = this.specialPokemon[this.stage];
    let hasSpecialPokemon = false;

    // 특별 포켓몬이 아직 구출되지 않았다면 한 번만 포함
    if (currentSpecialPokemon && !this.saved_pokemon.includes(currentSpecialPokemon)) {
      pokemonList.push(currentSpecialPokemon);
      hasSpecialPokemon = true;
    }

    // 나머지 슬롯을 일반 포켓몬으로 채움
    let remainingSlots = slotCount - (hasSpecialPokemon ? 1 : 0);
    let availablePokemon = [];
    for (let i = 0; i < this.totalPokemonCount; i++) {
      if (i !== currentSpecialPokemon) {
        availablePokemon.push(i);
      }
    }

    for (let i = 0; i < remainingSlots; i++) {
      let randomIndex = Math.floor(Math.random() * availablePokemon.length);
      pokemonList.push(availablePokemon[randomIndex]);
    }

    // 포켓몬 리스트를 랜덤하게 섞기
    return pokemonList.sort(function () { return Math.random() - 0.5; });
  }

  /**
   * MARK: frame 조합 생성
   * TODO - frame들 겹치는 문제 해결
   */
  createNewCombination() {
    let patterns = this.getCombinationPatterns();
    let randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    let pokemonList = this.generatePokemonForCombination(randomPattern);
    let pokemonIndex = 0;

    // 조합 크기 계산 - 수정됨: 패턴 크기 고려
    let patternHeight = randomPattern.length * (this.BRICK_HEIGHT + this.BRICK_PADDING);

    // paddle y 위치보다 위쪽에서만 조합 생성하도록 제한
    let maxY = this.paddle.y - this.paddleOffset - patternHeight - 10; // 패들보다 충분히 위에서 생성 + 패턴 높이 고려
    let minY = this.BRICK_OFFSET_TOP;

    // 기존 조합과 겹치지 않는 Y 위치 찾기 - 추가됨: 겹침 방지 로직
    let randomY = this.findNonOverlappingY(minY, maxY, patternHeight);

    let combination = {
      pattern: randomPattern,
      bricks: [],
      x: -200, // 화면 왼쪽 밖에서 시작
      y: randomY, // 패들 위쪽 영역에서 랜덤 높이
      speed: this.combinationSpeed
    };

    // 패턴에 따라 벽돌 생성
    for (let row = 0; row < randomPattern.length; row++) {
      for (let col = 0; col < randomPattern[row].length; col++) {
        if (randomPattern[row][col] === 1) {
          let brickX = combination.x + col * (this.BRICK_WIDTH + this.BRICK_PADDING);
          let brickY = combination.y + row * (this.BRICK_HEIGHT + this.BRICK_PADDING);
          let pokeIndex = pokemonList[pokemonIndex++];

          let imagePath = "../assets/images/game/pokemon/" + pokeIndex + ".png";
          let pokeType = window.pokemon && window.pokemon[pokeIndex] ? window.pokemon[pokeIndex].type : 0;
          let slotColor = this.typeColorMap[pokeType] || "#eee";
          let isTarget = this.targetPokemonIndexes.includes(pokeIndex);
          let brick = new Brick(
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

          combination.bricks.push(brick); // 벽돌을 조합에 추가
        }
      }
    }

    this.combinations.push(combination);
    console.log("새로운 조합 생성: " + combination.bricks.length + "개 블록");
    // console.log(`조합 내 brick들 좌표 : `);
    // combination.bricks.forEach((brick, index)=>{
    //   console.log(`brick ${index} : ${brick.x}, ${brick.y}`);
    // });
  }
  /**
   * MARK: 게임별 초기화 
   * (GameManager 오버라이드)
   */
  initializeGame() {
    // 기본 게임 오브젝트 초기화는 부모에서 처리
    this.initializeGameObjects();

    // 동적 조합 시스템 초기화
    this.initDynamicBrickSystem();
    this.totalLives = this.lives;
  }
  /**
   * MARK: 동적 벽돌 시스템 초기화
   */
  initDynamicBrickSystem() {
    // 타겟 포켓몬 설정
    this.targetPokemonIndexes = [];
    while (this.targetPokemonIndexes.length < 4) {
      let rand = Math.floor(Math.random() * this.totalPokemonCount);
      if (!this.targetPokemonIndexes.includes(rand)) {
        this.targetPokemonIndexes.push(rand);
      }
    }

    this.targetPokemonImages = this.targetPokemonIndexes.map(function (index) {
      return "../assets/images/game/pokemon/" + index + ".png";
    });

    // 조합 시스템 초기화
    this.combinations = [];
    this.clearedCombinations = 0;
    this.lastCombinationSpawn = 0;
    this.leftBrick = 0;

    console.log("타겟 포켓몬: " + this.targetPokemonIndexes);
    console.log("특별 포켓몬 (Stage " + this.stage + "): " + this.specialPokemon[this.stage]);
  }
  /**
   * MARK: 게임별 업데이트 로직
   * (GameManager 오버라이드)
   */
  updateGame(timeMultiplier) {
    // 공 이동
    this.ball.x += this.ball.speedX * timeMultiplier;
    this.ball.y += this.ball.speedY * timeMultiplier;

    // 조합 생성 및 이동 시스템 추가
    this.updateCombinations(timeMultiplier);

    // 화면 밖 감지 조건 정의
    let ballIsOutOfScreenLeft = this.ball.x <= -this.ball.radius;
    let ballIsOutOfScreenTop = this.ball.y <= -this.ball.radius;
    let ballIsOutOfScreenRight = this.ball.x - this.ball.radius > this.canvas.width;
    let ballIsOutOfScreenBottom = this.ball.y + this.ball.radius > this.canvas.height;
    let isBallMissing = isNaN(this.ball.x) || isNaN(this.ball.y);

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
      this.ball.y = this.canvas.height - this.paddleOffset - 10;
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
      let paddleCenter = this.paddle.x + this.paddle.width / 2;
      let ballDistFromCenter = this.ball.x - paddleCenter;
      this.ball.speedX = (ballDistFromCenter / (this.paddle.width / 2)) * this.BALL_SPEED;
      this.ball.speedY = -Math.sqrt(this.BALL_SPEED * this.BALL_SPEED - this.ball.speedX * this.ball.speedX);
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
   * MARK: 조합 시스템
   */
  updateCombinations(timeMultiplier) {
    let currentTime = Date.now();

    // 화면에 조합이 있는지 확인 (화면 경계 내에 조합이 있는지 체크) - 추가됨: 화면 내 조합 존재 여부 확인
    let hasActiveCombinationOnScreen = false;
    for (let i = 0; i < this.combinations.length; i++) {
      let combination = this.combinations[i];
      // 조합이 화면 안에 있는지 확인 (조합의 시작점이 화면 오른쪽 경계를 넘지 않았으면 화면에 있다고 판단)
      if (combination.x < this.canvas.width) {
        hasActiveCombinationOnScreen = true;
        break;
      }
    }

    // 새 조합 생성 조건 개선 - 수정됨: 화면에 조합이 없을 때만 생성하거나, 있을 때는 추가 대기시간 적용
    let requiredInterval = hasActiveCombinationOnScreen
      ? this.combinationSpawnInterval + this.combinationSpawnDelayWhenActive  // 화면에 조합이 있으면 기본 간격 + 추가 대기시간
      : this.combinationSpawnInterval; // 화면에 조합이 없으면 기본 간격만 적용

    if (currentTime - this.lastCombinationSpawn > requiredInterval) {
      this.createNewCombination(); // 새 조합 생성
      this.lastCombinationSpawn = currentTime;
      // console.log("새 조합 생성됨 - 화면에 기존 조합 존재: " + hasActiveCombinationOnScreen); // 추가됨: 조합 생성 로그
    }

    // 기존 조합들 이동 및 정리
    for (let i = this.combinations.length - 1; i >= 0; i--) {
      let combination = this.combinations[i];
      combination.x += combination.speed * timeMultiplier;

      // 조합의 모든 벽돌 위치 업데이트 - 수정됨: 벽돌 위치 매핑 로직 개선
      let self = this;
      combination.bricks.forEach(function (brick, brickIndex) {
        let pattern = combination.pattern;
        let row = 0, col = 0;
        let count = 0;
        let found = false; // 위치를 찾았는지 확인하는 플래그 추가

        // 패턴에서 현재 벽돌의 위치 찾기 - 수정됨: 이중 루프 탈출 문제 해결
        outerLoop: for (let r = 0; r < pattern.length; r++) {
          for (let c = 0; c < pattern[r].length; c++) {
            if (pattern[r][c] === 1) {
              if (count === brickIndex) {
                row = r;
                col = c;
                found = true;
                break outerLoop; // 라벨을 사용한 이중 루프 완전 탈출
              }
              count++;
            }
          }
        }

        // 위치를 찾은 경우에만 좌표 업데이트 - 추가됨: 안전성 검증
        if (found) {
          brick.x = combination.x + col * (self.BRICK_WIDTH + self.BRICK_PADDING);
          brick.y = combination.y + row * (self.BRICK_HEIGHT + self.BRICK_PADDING);
        } else {
          // 위치를 찾지 못한 경우 오류 로그 출력 - 추가됨: 디버깅용 로그
          // console.error("벽돌 위치 매핑 실패: brickIndex=" + brickIndex + ", 패턴 크기=" + pattern.length);
        }
      });

      // 화면을 벗어난 조합 제거
      if (combination.x > this.canvas.width + 200) {
        this.combinations.splice(i, 1);
        continue;
      }

      // 조합의 모든 벽돌이 부서졌는지 확인
      let activeBricks = combination.bricks.filter(function (brick) { return brick.status === 1; });
      if (activeBricks.length === 0) {
        this.combinations.splice(i, 1);
        this.clearedCombinations++;
        // console.log("조합 클리어! 총 " + this.clearedCombinations + "개 조합 클리어");
      }
    }
  }

  /**
   * MARK: 동적 벽돌 충돌 감지
   */
  dynamicCollisionDetection() {
    for (let i = 0; i < this.combinations.length; i++) {
      let combination = this.combinations[i];
      for (let j = 0; j < combination.bricks.length; j++) {
        let brick = combination.bricks[j];
        if (brick.status === 1 && brick.isBrickHit(this.ball)) {
          // 겹침 영역 계산을 통한 방향 감지
          let overlapLeft = this.ball.x + this.ball.radius - brick.x;
          let overlapRight = brick.x + this.BRICK_WIDTH - (this.ball.x - this.ball.radius);
          let overlapTop = this.ball.y + this.ball.radius - brick.y;
          let overlapBottom = brick.y + this.BRICK_HEIGHT - (this.ball.y - this.ball.radius);

          let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            this.ball.speedX = -this.ball.speedX;
          } else {
            this.ball.speedY = -this.ball.speedY;
          } brick.status = 0; // 벽돌 부서짐
          let pokemon = window.pokemon[brick.pokeIndex];
          let baseScore = 0;

          if (pokemon.type === 5) {
            // 전설의 포켓몬 - 점수 더 많이 줌
            baseScore = 50;
          } else {
            // 일반 포켓몬 - 10점
            baseScore = 10;
          }

          // MARK: 전기타입 능력 적용 - 점수 2배
          if (this.electricBoostActive) {
            this.score += baseScore * 2;
          } else {
            this.score += baseScore;
          }

          // 타겟 포켓몬이거나 특별 포켓몬인 경우 슬롯에 추가
          if (brick.isTarget && this.targetPokemonIndexes.includes(brick.pokeIndex)) {
            let imagePath = "../assets/images/game/pokemon/" + brick.pokeIndex + ".png";
            this.addPokemonToSlot(imagePath);
          } else if (this.specialPokemon[this.stage] === brick.pokeIndex) {
            // 특별 포켓몬 구출
            this.saved_pokemon.push(brick.pokeIndex);
            let imagePath = "../assets/images/game/pokemon/" + brick.pokeIndex + ".png";
            // this.addPokemonToSlot(imagePath);
            let pokemonName = window.pokemon && window.pokemon[brick.pokeIndex] ? window.pokemon[brick.pokeIndex].name : "포켓몬";
            // console.log("특별 포켓몬 구출: " + pokemonName);
          }

          this.checkWin();
          return; // 한 프레임에 하나의 벽돌만 처리
        }
      }
    }
  }

  /**
   * MARK: 포켓몬 슬롯에 추가
   */
  addPokemonToSlot(imageSrc) {
    // 중복 방지: 이미 슬롯에 들어가 있는 경우 무시
    for (let i = 0; i < 4; i++) {
      let slot = document.getElementById("slot-" + i);
      let bg = slot.style.backgroundImage;

      if (bg.includes(imageSrc)) {
        return; // 이미 들어있는 포켓몬은 중복 추가 안 함
      }
    }

    // 빈 슬롯 찾아서 추가
    for (let i = 0; i < 4; i++) {
      let slot = document.getElementById("slot-" + i);
      let bg = slot.style.backgroundImage;

      if (!bg || bg === "none") {
        slot.style.backgroundImage = "url(" + imageSrc + ")";
        slot.style.backgroundSize = "cover";
        slot.style.backgroundPosition = "center";
        let indexMatch = imageSrc.match(/(\d+)\.png/);
        if (indexMatch) {
          let index = parseInt(indexMatch[1]);
          let type = window.pokemon && window.pokemon[index] ? window.pokemon[index].type : 0;
          let color = this.typeColorMap[type] || "#eee";
          slot.style.backgroundColor = color;
        }
        return;
      }
    }
  }
  /**
   * MARK: 포켓몬 슬롯 초기화
   */
  clearPokemonSlots() {
    for (let i = 0; i < 4; i++) {
      let slot = document.getElementById("slot-" + i);
      slot.style.backgroundImage = "none";
      slot.style.backgroundColor = "transparent";
    }
  }
  /**
   * MARK: 승리 조건 확인
   */
  checkWin() {
    // 필요한 조합 수를 클리어했다면
    if (this.clearedCombinations >= this.requiredCombinations) {
      this.isGameClear = true;
      this.showMessage("축하합니다! 스테이지를 클리어했습니다!", "success", true);
      this.endGame();
      return true;
    }
    return false;
  }  /**
   * MARK: 공 그리기
   */
  drawBall() {
    // 이미지 객체 생성 및 캐싱
    if (!this.ballImage) {
      this.ballImage = new Image();
      this.ballImage.src = "../assets/images/game/object/ball.png";
    }

    // 이미지가 로드되었는지 확인
    if (this.ballImage.complete) {
      // 이미지를 공 크기(radius * 2)로 그리기, 중심점 기준으로 배치
      let ballSize = this.ball.radius * 2;
      this.ctx.drawImage(
        this.ballImage,
        this.ball.x - this.ball.radius,
        this.ball.y - this.ball.radius,
        ballSize,
        ballSize
      );
    } else {
    // 이미지 로딩 중일 때는 기존 원형으로 대체
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.ball.color;
      this.ctx.fill();
      this.ctx.closePath();
    }
  }
  /**
   * MARK: 패들 그리기
   */
  drawPaddle() {
    // 이미지 객체 생성 및 캐싱을 위한 정적 변수 사용
    if (!this.paddleImage) {
      this.paddleImage = new Image();
      this.paddleImage.src = "../assets/images/game/object/bar.png";
    }

    // 이미지가 로드되었는지 확인
    if (this.paddleImage.complete) {
      // 이미지를 패들과 같은 크기로 그리기
      this.ctx.drawImage(
        this.paddleImage,
        this.paddle.x,
        this.paddle.y,
        this.paddle.width,
        this.paddle.height
      );
    } else {
      // 이미지 로딩 중일 때는 기존 사각형으로 대체
      this.ctx.beginPath();
      this.ctx.rect(
        this.paddle.x,
        this.paddle.y,
        this.paddle.width,
        this.paddle.height
      );
      this.ctx.fillStyle = this.paddle.color;
      this.ctx.fill();
      this.ctx.closePath();
    }
  }
  /**
   * MARK: 동적 벽돌 그리기 메서드 추가
   */
  drawDynamicBricks() {
    for (let i = 0; i < this.combinations.length; i++) {
      let combination = this.combinations[i];
      for (let j = 0; j < combination.bricks.length; j++) {
        let brick = combination.bricks[j];
        if (brick.status === 1) {
          brick.draw(this.ctx);
          // console.log(`그리기: 벽돌 ${j} (${brick.x}, ${brick.y}) - 상태: ${brick.status}`);
        }
      }
    }
  }
  /**
   * MARK: 게임 재시작
   */
  restartGame() {
    this.clearPokemonSlots(); // 슬롯 초기화

    // MARK: 포켓몬 능력 효과 상태 초기화
    this.electricBoostActive = false;
    this.waterBoostActive = false;
    this.iceBoostActive = false;

    super.restartGame(); // 부모 클래스의 재시작 메서드 호출
  }
  /**
   * MARK: 기존 조합과 겹치지 않는 Y 위치 찾기 메서드 - 추가됨: 조합 겹침 방지
   */
  findNonOverlappingY(minY, maxY, patternHeight) {
    let attempts = 0;
    let maxAttempts = 10; // 최대 시도 횟수
    let safeMargin = 20; // 조합 간 안전 여백

    while (attempts < maxAttempts) {
      let candidateY = minY + Math.random() * (maxY - minY);
      let isOverlapping = false;

      // 현재 화면에 있는 조합들과 겹치는지 확인
      for (let i = 0; i < this.combinations.length; i++) {
        let existingCombination = this.combinations[i];
        // 화면 내에 있는 조합만 체크 (화면을 벗어난 조합은 무시)
        if (existingCombination.x < this.canvas.width) {
          let existingPatternHeight = existingCombination.pattern.length * (this.BRICK_HEIGHT + this.BRICK_PADDING);
          let existingTop = existingCombination.y;
          let existingBottom = existingCombination.y + existingPatternHeight;
          let candidateTop = candidateY;
          let candidateBottom = candidateY + patternHeight;

          // Y축 겹침 확인 (안전 여백 포함)
          if (!(candidateBottom + safeMargin < existingTop || candidateTop - safeMargin > existingBottom)) {
            isOverlapping = true;
            break;
          }
        }
      }

      if (!isOverlapping) {
        return candidateY; // 겹치지 않는 위치 발견
      }

      attempts++;
    }

    // 적절한 위치를 찾지 못한 경우 기본 위치 반환
    console.log("조합 배치: 겹치지 않는 위치를 찾지 못해 기본 위치 사용");
    return minY + Math.random() * (maxY - minY);
  }

  /**
   * MARK: 포켓몬 능력 실행 오버라이드 (GameManager에서 상속)
   */
  executePokemonAbility(slotIndex, pokemonIndex, pokemonType) {
    // 타입별 능력 실행
    switch (pokemonType) {
      case 0: // 풀타입
        this.executeGrassAbility();
        break;
      case 1: // 불타입  
        this.executeFireAbility();
        break;
      case 2: // 전기타입
        this.executeElectricAbility();
        break;
      case 3: // 물타입
        this.executeWaterAbility();
        break;
      case 4: // 얼음타입
        this.executeIceAbility();
        break;
      default:
        console.log("알 수 없는 타입의 포켓몬 능력입니다.");
    }
  }

  /**
   * MARK: 풀타입 능력 - 생명력 회복
   */
  executeGrassAbility() {
    const healAmount = 50; // 회복량
    this.lives = Math.min(this.totalLives, this.lives + healAmount);
    this.showMessage(`풀타입 능력: 생명력 ${healAmount} 회복!`, "success");
    console.log(`풀타입 능력 사용: 생명력 ${healAmount} 회복`);
  }

  /**
   * MARK: 불타입 능력 - 공 속도 증가
   */
  executeFireAbility() {
    const speedBoost = 2; // 속도 증가량
    const duration = 5000; // 지속시간 5초

    // 공 속도 증가
    this.ball.speedX *= (1 + speedBoost / this.BALL_SPEED);
    this.ball.speedY *= (1 + speedBoost / this.BALL_SPEED);

    this.showMessage("불타입 능력: 공 속도 증가!", "success");
    console.log("불타입 능력 사용: 공 속도 증가");

    // 일정 시간 후 속도 원상복구
    setTimeout(() => {
      this.ball.speedX /= (1 + speedBoost / this.BALL_SPEED);
      this.ball.speedY /= (1 + speedBoost / this.BALL_SPEED);
      console.log("불타입 능력 효과 종료: 공 속도 원상복구");
    }, duration);
  }

  /**
   * MARK: 전기타입 능력 - 점수 2배 증가 (일정 시간)
   */
  executeElectricAbility() {
    const duration = 8000; // 지속시간 8초

    if (!this.electricBoostActive) {
      this.electricBoostActive = true;
      this.showMessage("전기타입 능력: 점수 2배 획득!", "success");
      console.log("전기타입 능력 사용: 점수 2배 획득");

      // 일정 시간 후 효과 해제
      setTimeout(() => {
        this.electricBoostActive = false;
        console.log("전기타입 능력 효과 종료: 점수 2배 해제");
      }, duration);
    }
  }

  /**
   * MARK: 물타입 능력 - 패들 크기 증가
   */
  executeWaterAbility() {
    const sizeIncrease = 40; // 패들 크기 증가량
    const duration = 7000; // 지속시간 7초

    if (!this.waterBoostActive) {
      this.waterBoostActive = true;
      this.paddle.width += sizeIncrease;

      this.showMessage("물타입 능력: 패들 크기 증가!", "success");
      console.log("물타입 능력 사용: 패들 크기 증가");

      // 일정 시간 후 크기 원상복구
      setTimeout(() => {
        this.paddle.width -= sizeIncrease;
        this.waterBoostActive = false;
        console.log("물타입 능력 효과 종료: 패들 크기 원상복구");
      }, duration);
    }
  }

  /**
   * MARK: 얼음타입 능력 - 조합 이동 속도 감소
   */
  executeIceAbility() {
    const slowFactor = 0.3; // 속도 감소 비율 (70% 감소)
    const duration = 6000; // 지속시간 6초

    if (!this.iceBoostActive) {
      this.iceBoostActive = true;
      this.combinationSpeed *= slowFactor;

      this.showMessage("얼음타입 능력: 조합 이동 속도 감소!", "success");
      console.log("얼음타입 능력 사용: 조합 이동 속도 감소");

      // 일정 시간 후 속도 원상복구
      setTimeout(() => {
        this.combinationSpeed /= slowFactor;
        this.iceBoostActive = false;
        console.log("얼음타입 능력 효과 종료: 조합 이동 속도 원상복구");
      }, duration);
    }
  }
}
