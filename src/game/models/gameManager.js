/**
 * GameManager class
 * - 게임 실행/상태 관리를 수행하는 클래스
 * - setGameInfo(data): 게임 정보를 설정하는 메서드
 * 
 */
class GameManager{
    constructor() {
        // MARK: game setting const 변수들
        const FPS = 60;
        const FRAME_DELAY = 1000 / FPS;

        this.gameState = 'waiting'; // waiting, playing, finished
        this.lastTime = 0;

        this.mode = null;
        this.level = null;
        this.stage = null;  // nullable
        this.score = 0;
        this.isGameClear = false;
        this.saved_pokemon = []; // 게임 중 구조한 포켓몬 리스트
    }

    /**
     * 게임 정보를 설정하는 메서드
     * @param {Object|string} data - 게임 정보 객체 또는 JSON 문자열
     * @throws {Error} - 게임 정보가 유효하지 않거나 형식이 잘못된 경우
     * @description
     * - data.mode: 게임 모드 ('story' | 'score')
     * - data.level: 게임 레벨 ('easy' | 'normal' | 'hard')
     * - data.stage: 게임 스테이지 (number, 1 | 2 | 3 등)
     */
    setGameInfo(data) {
        // stage - nullable
        if(!data.mode){
            throw new Error('게임 mode 설정 안됨');
        }
        if (!data.level) {
            throw new Error('게임 level 설정 안됨');
        }

        // data가 string type일 경우 parsing 에러 핸들링
        try {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
        } catch (e) {
            throw new Error('받은 data가 JSON 형식이 아닙니다');
        }

        // 유효한 mode, level, stage인지 확인
        if (typeof data.mode !== 'string' || typeof data.level !== 'string' || typeof data.stage !== 'number') {
            throw new Error('게임 정보의 형식이 유효하지 않습니다');
        }

        this.mode = data.mode;
        this.level = data.level;
        this.stage = data.stage;
    }
    
    /**
     * 게임 시작 시 호출되는 메서드
     * - 게임 상태를 초기화하고 시작 준비를 함
     */
    startGame() {
        
    }
    
    /**
     * 게임 종료 시 호출되는 메서드
     * - 패배 혹은 승리 여부에 따라 게임 정보를 반환
     * @returns {Object} 게임 정보 객체
     */
    endGame() {
        return {
            mode: this.mode,
            level: this.level,
            stage: this.stage,
            score: this.score,
            date: new Date().toISOString(),
            game_over: !this.isGameClear,
            saved_pokemon: this.saved_pokemon || [],
        }
    }
}