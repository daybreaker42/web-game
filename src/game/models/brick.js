/**
 * MARK: 벽돌 클래스
 * 속성: 위치, 크기, 색상, 상태
 * 메서드:
 * - void draw(ctx): 벽돌을 그리는 메서드
 * - bool isHit(ball): 공과의 충돌을 감지하는 메서드
 */
class Brick{
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.status = 1; // 벽돌의 상태 (1: 존재, 0: 부서짐)
    }

    draw(ctx){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    isBrickHit(ball) {
        // 원형 공과 사각형 벽돌의 정확한 충돌 감지 로직 구현
        // 1. 공의 중심에서 가장 가까운 벽돌 상의 점 찾기
        // x - 벽돌의 왼쪽 끝~오른쪽 끝 범위 내에서 x와 가장 가까운 점
        // y - 벽돌의 위쪽 끝~아래쪽 끝 범위 내에서 y와 가장 가까운 점
        let closestX = Math.max(this.x, Math.min(ball.x, this.x + this.width));
        let closestY = Math.max(this.y, Math.min(ball.y, this.y + this.height));
        
        // 2. 공의 중심에서 가장 가까운 점까지의 거리 계산
        let distanceX = ball.x - closestX;
        let distanceY = ball.y - closestY;
        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        
        // 3. 거리가 공의 반지름보다 작거나 같으면 충돌
        const hit = distanceSquared <= (ball.radius * ball.radius);
                
        return hit;
    }
    
}