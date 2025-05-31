# 프로젝트 주요 기술 로직 요약

## 블록 및 기본 사항들
- 포켓몬 블럭: 부시면 포켓몬 구출
    - 일반 포켓몬: 그냥 테두리, 10점
    - 전설의 포켓몬: 황금색 테두리, 50점
- 아이템 블럭: 점수 얻진 않음. 대신 슬롯에 현재 선택된 포켓몬한테 바로 아이템 사용됨.
    - 선택된 슬롯에 포켓몬이 없다면, 있는 포켓몬들 중 첫 번째 포켓몬에게 사용됨.

## 1. 게임 공통 로직 (GameManager.js)

*   **게임 상태 관리 (시작, 일시정지, 종료)**
    *   `startGame()`: 게임 루프 시작, `requestAnimationFrame` 호출
    *   `togglePause()`: 게임 일시정지/재개, `animationFrame` 제어
    *   `endGame()`: 게임 루프 중지, `cancelAnimationFrame` 호출, 게임 결과 표시
*   **캔버스 및 렌더링 컨텍스트 초기화**
    *   생성자에서 `canvas` 요소와 2D 렌더링 컨텍스트(`ctx`)를 가져와 멤버 변수에 저장
    *   [캔버스 초기화 코드 예시]
*   **게임 정보 설정 (모드, 난이도, 스테이지)**
    *   `setGameInfo(data)`: `mode`, `difficulty`, `stage` 등의 게임 정보를 객체로 받아 설정
    *   난이도에 따라 게임 내 변수들(예: 공 속도, 보스 체력) 조정 ( `setDifficultyByDifficulty`)
*   **UI 업데이트 (점수, 생명, 메시지)**
    *   `updateUI()`: 점수, 남은 생명 등을 화면에 표시 (DOM 요소 업데이트)
    *   `drawLives()`: 생명 아이콘 표시
    *   `drawScore()`: 현재 점수 표시
    *   `showInGameMessage(text, isNotice)`: 화면 중앙에 메시지(성공, 실패, 알림 등) 표시
*   **키보드 및 마우스 입력 처리**
    *   `keyDownHandler(e)`, `keyUpHandler(e)`: 키보드 입력 상태(눌림/떼임)를 배열(`keysPressed`)에 기록
    *   `mouseMoveHandler(e)`: 마우스 위치를 받아 패들 위치 업데이트 등에 활용
*   **스테이지별 배경 로드 및 표시**
    *   `loadStageBackground(stage)`: 현재 스테이지에 맞는 배경 이미지를 로드하여 `backgroundImage` 멤버 변수에 저장
    *   `drawBackground()`: `ctx.drawImage`를 사용하여 `backgroundImage`를 캔버스에 그림
    *   [스테이지 배경 이미지 예시]
*   **포켓몬 능력 공통 처리 (키 입력, 사용, 체력 소모/회복)**
    *   `handlePokemonAbilityKey(slotIndex)`: 특정 키 입력 시 해당 슬롯의 포켓몬 능력 사용 시도
    *   `usePokemonAbility(slotIndex, pokemonIndex)`: 능력 사용 가능 여부 확인 후 `executePokemonAbility` 호출
    *   `consumePokemonHealth(slotIndex)`: 능력 사용 시 포켓몬 체력 소모
    *   `healPokemonHealth(slotIndex, healAmount)`: 특정 조건 만족 시 포켓몬 체력 회복
    *   `drawPokemonHealthBars()`: 포켓몬 슬롯 하단에 체력 바 표시
    *   [포켓몬 능력 사용 UI 예시]

## 2. 벽돌깨기 게임 로직 (BrickGame.js)

*   **벽돌 관련 로직**
    *   **동적 벽돌 시스템 초기화 및 배치**
        *   `initDynamicBrickSystem()`: 게임 시작 시 목표 포켓몬(`targetPokemonIndexes`)을 기반으로 벽돌(`dynamicBricks`) 생성
        *   벽돌은 `Brick` 클래스 인스턴스로, 각기 다른 포켓몬 이미지, 타입, 체력 등을 가짐
        *   `BRICK_WIDTH`, `BRICK_HEIGHT`, `BRICK_PADDING` 등을 이용해 격자 형태로 배치
        *   [벽돌 배치 초기 화면 사진]
    *   **벽돌과 공의 충돌 감지 (Dynamic Collision Detection)**
        *   `dynamicCollisionDetection()`: 게임 루프마다 모든 `dynamicBricks`와 공(`ball`)의 충돌을 검사
        *   AABB(Axis-Aligned Bounding Box) 충돌 감지 알고리즘 사용
        *   충돌 시 공의 방향을 반전시키고, 벽돌의 체력을 감소시킴
        *   벽돌 체력이 0이 되면 해당 벽돌을 화면에서 제거하고, 포켓몬을 슬롯에 추가 (`addPokemonToSlot`)
        *   [공과 벽돌 충돌 순간 사진]
    *   **벽돌 파괴 및 점수 획득**
        *   벽돌 파괴 시 점수(`this.score`) 증가
        *   특정 포켓몬 벽돌 파괴 시 `showRescueMessage`로 메시지 표시
*   **공 및 패들 로직**
    *   **공 이동 및 벽/패들 충돌 처리**
        *   `ball.x`, `ball.y`를 `ball.dx`, `ball.dy` 만큼 매 프레임 업데이트하여 이동
        *   캔버스 경계와 충돌 시 `ball.dx` 또는 `ball.dy` 방향 반전
        *   패들과 충돌 시 `ball.dy` 방향 반전, 패들의 어느 부분에 맞았는지에 따라 `ball.dx`도 변경하여 다양한 각도로 반사
        *   [공이 패들에 맞아 튕기는 사진]
    *   **패들 이동 처리**
        *   `mouseMoveHandler`에서 전달된 마우스 x좌표를 따라 패들(`paddleX`) 위치 업데이트
        *   패들이 캔버스 밖으로 나가지 않도록 경계 처리
*   **포켓몬 조합 시스템**
    *   **조합 패턴 생성 및 관리**
        *   `getCombinationPatterns()`: 미리 정의된 다양한 모양의 포켓몬 조합 패턴 반환 (예: 2x2, 1x3 등)
        *   [포켓몬 조합 패턴 예시 그림]
    *   **조합 프레임 생성 및 이동**
        *   `createNewCombination()`: `getCombinationPatterns`에서 무작위 패턴을 선택하고, 해당 패턴의 포켓몬들로 구성된 조합 프레임(`combinations`) 생성
        *   조합 프레임은 화면 상단에서 아래로 천천히 이동 (`updateCombinations`)
        *   `findNonOverlappingY`를 통해 새로 생성되는 조합이 기존 조합과 겹치지 않도록 y 위치 조정
        *   [화면에 여러 조합 프레임이 내려오는 사진]
    *   **포켓몬 슬롯 관리 (추가, 초기화)**
        *   `addPokemonToSlot(imageSrc)`: 벽돌 파괴 시 해당 포켓몬 이미지를 하단 포켓몬 슬롯(DOM 요소 `slot-0` ~ `slot-3`)에 표시
        *   `clearPokemonSlots()`: 게임 재시작 또는 스테이지 클리어 시 슬롯 초기화
        *   [포켓몬이 슬롯에 채워진 UI 사진]
*   **포켓몬 능력 실행**
    *   `executePokemonAbility(slotIndex, pokemonIndex, pokemonType)`: `GameManager`로부터 호출받아 실제 능력 실행
    *   **타입별 능력 구현**
        *   `executeGrassAbility()`: 생명력 1 회복 (`this.lives++`)
        *   `executeFireAbility()`: 일정 시간 동안 공 속도 증가 (`ball.speedMultiplier`)
        *   `executeElectricAbility()`: 일정 시간 동안 점수 획득량 2배 증가 (`this.scoreMultiplier`)
        *   `executeWaterAbility()`: 일정 시간 동안 패들 길이 증가 (`this.paddleWidth`)
        *   `executeIceAbility()`: 일정 시간 동안 조합 프레임 이동 속도 감소 (`this.combinationSpeedMultiplier`)
        *   [각 타입별 능력 발동 효과 사진]
*   **게임 승리 조건 확인**
    *   `checkWin()`: `story` 모드에서 현재 점수(`this.score`)가 목표 점수(`this.requiredScores[this.difficulty]`) 이상이면 승리 처리 (`this.isGameClear = true`)
    *   `score` 모드에서는 시간 제한으로 게임이 종료되므로 별도의 승리 조건 없음

## 3. 보스전 게임 로직 (BossGame.js)

*   **플레이어 관련 로직**
    *   **플레이어 이동 (회전 및 가속)**
        *   `updatePlayer()`: `keysPressed` 배열을 확인하여 'W'(가속), 'A'(좌회전), 'D'(우회전) 키에 따라 플레이어의 속도(`player.speed`)와 각도(`player.angle`) 변경
        *   플레이어 위치(`player.x`, `player.y`)는 속도와 각도를 기반으로 업데이트
        *   [플레이어가 회전하며 이동하는 모습]
    *   **플레이어 총알 발사 및 업데이트**
        *   `shootPlayerBullet()`: 스페이스바 입력 시 현재 플레이어 위치와 각도를 기준으로 총알(`playerBullets`) 생성
        *   `updatePlayerBullets()`: 발사된 총알들을 이동시키고 화면 밖으로 나가면 제거
        *   [플레이어가 총알을 발사하는 장면]
*   **보스 관련 로직**
    *   **보스 이동 패턴 (페이즈별)**
        *   `updateBoss()`: 현재 보스 페이즈(`boss.phase`)에 따라 다른 이동 로직 실행
        *   **페이즈 1: 일반 이동** (`updatePhase1`, `startBossMove`, `updateBossMovement`)
            *   보스가 화면 내에서 특정 경로를 따라 천천히 이동
            *   일정 시간마다 새로운 목표 지점 설정 후 해당 지점으로 이동
            *   [보스가 페이즈 1에서 이동하는 모습]
        *   **페이즈 2: 순간이동** (`updatePhase2`, `startBossTeleport`, `updateBossTeleport`)
            *   보스가 화면의 특정 위치들 중 무작위 위치로 순간이동
            *   순간이동 전 예고 이펙트 표시
            *   [보스가 순간이동하는 모습과 예고 이펙트]
    *   **보스 공격 패턴 (페이즈별)**
        *   `updateBoss()`: 현재 페이즈에 따라 다른 공격 로직 실행
        *   **페이즈 1: 전방향 탄막 발사** (`updatePhase1`, `shootBossBullets`)
            *   일정 간격으로 보스 주변 여러 방향으로 탄막(`bossBullets`) 동시 발사
            *   [보스가 페이즈 1에서 전방향 탄막을 발사하는 장면]
        *   **페이즈 2: 플레이어 조준 탄막 발사, 레이저 공격** (`updatePhase2`, `shootTargetedBullets`, `shootLaserAttack`)
            *   `shootTargetedBullets()`: 플레이어 현재 위치를 조준하여 탄막 발사
            *   `shootLaserAttack()`: 페이즈 전환 시 또는 특정 패턴으로 강력한 레이저(`laserBullets`) 발사
            *   [보스가 페이즈 2에서 플레이어를 조준해 공격하는 장면]
            *   [보스가 레이저를 발사하는 장면]
    *   **보스 체력 관리 및 페이즈 전환**
        *   보스 체력(`boss.health`)이 일정 수준 이하로 감소하면 `triggerPhase2()` 호출하여 페이즈 2로 전환
        *   페이즈 전환 시 특별한 공격 패턴(예: 레이저)이나 무적 시간 부여 가능
        *   [보스 체력 바 UI와 페이즈 전환 이펙트]
*   **탄막 시스템**
    *   **보스 탄막 발사 및 업데이트**
        *   `shootBossBullets()`: 다양한 패턴(원형, 직선 등)으로 탄막 생성
        *   `updateBossBullets()`: 생성된 탄막들을 각자의 속도와 방향으로 이동시키고 화면 밖으로 나가면 제거
    *   **레이저 총알 업데이트**
        *   `updateLaserBullets()`: 레이저 총알의 경우 일반 탄막과 다른 이동 방식이나 충돌 판정 가질 수 있음
*   **충돌 감지**
    *   `checkCollisions()`: 게임 루프마다 다음 충돌들을 검사
    *   **플레이어와 보스 탄막 충돌**
        *   플레이어와 `bossBullets` 또는 `laserBullets` 간의 충돌 검사
        *   충돌 시 플레이어 생명 감소 또는 게임 오버 처리
        *   [플레이어가 보스 탄막에 맞는 순간]
    *   **플레이어 총알과 보스 충돌**
        *   `playerBullets`와 보스 간의 충돌 검사
        *   충돌 시 보스 체력 감소, 점수 획득
        *   [플레이어 총알이 보스에게 명중하는 순간]
*   **게임 종료 조건 확인**
    *   `checkGameEnd()`: 플레이어 생명이 0이 되거나 보스 체력이 0이 되면 게임 종료 처리
    *   보스 격파 시 승리, 플레이어 사망 시 패배

## 4. 게임 플레이 관리 로직 (gameplay.js)

*   **게임 모드(스토리/점수) 및 난이도 설정**
    *   `playGame(mode, difficulty, stage, onGameEnd)` 함수를 통해 게임 시작 시 모드, 난이도, 스테이지 정보 전달
    *   사용자 인터페이스(버튼 클릭 등)를 통해 이 값들이 결정됨
*   **게임 인스턴스 생성 (BrickGame 또는 BossGame)**
    *   `switchGameMode(gameType)` 함수 내에서 `gameType`에 따라 `BrickGame` 또는 `BossGame` 인스턴스를 생성하여 `gameInstance` 전역 변수에 할당
    *   `createBrickGame()`, `createBossGame()` 헬퍼 함수 사용 가능 (현재 코드에서는 직접 생성)
*   **게임 시작 및 종료 콜백 처리**
    *   `playGame` 함수에서 `gameInstance.setOnGameEnd(onGameEnd)`를 통해 게임 종료 시 실행될 콜백 함수 등록
    *   게임 결과(승리/패배, 점수 등)를 콜백 함수로 전달하여 다음 스테이지로 넘어가거나 결과 화면을 표시하는 등의 후속 처리 수행
*   **BGM 재생 관리**
    *   `playGame` 함수 내에서 `playBgm(BGM_URL)` 함수를 호출하여 현재 스테이지나 모드에 맞는 배경음악 재생
    *   [BGM이 변경되는 시점의 UI 또는 게임 화면]
*   **키보드 및 마우스 이벤트 핸들러 연결**
    *   `playGame` 함수 내에서 `window.onkeydown`, `window.onkeyup`, `canvas.onmousemove` 이벤트 리스너에 `gameInstance`의 해당 핸들러 함수들(`keyDownHandler`, `keyUpHandler`, `mouseMoveHandler`)을 연결
    *   이를 통해 사용자의 입력이 현재 활성화된 게임 인스턴스로 전달됨
