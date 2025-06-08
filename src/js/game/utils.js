function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** 
 * 공과 paddle의 정확한 충돌 감지 로직 구현
 * 1. 공의 중심에서 가장 가까운 paddle 상의 점 찾기
 * 2. 공의 중심에서 가장 가까운 점까지의 거리 계산
 * 3. 거리가 공의 반지름보다 작거나 같으면 충돌
 * @param {Object} ball - 공 객체, {x: 공의 x좌표, y: 공의 y좌표, radius: 공의 반지름}
 * @param {Object} paddle - paddle 객체, {x: paddle의 x좌표, y: paddle의 y좌표, width: paddle의 너비, height: paddle의 높이}
 * @return {boolean} 충돌 여부
 */
function isHit(ball, paddle) {
  // 1. 공의 중심에서 가장 가까운 paddle 상의 점 찾기
  // x - paddle의 왼쪽 끝~오른쪽 끝 범위 내에서 x와 가장 가까운 점
  // y - paddle의 위쪽 끝~아래쪽 끝 범위 내에서 y와 가장 가까운 점
  let closestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));     // paddle.x ~ paddle.x + paddle.width 범위 내에서 ball.x와 가장 가까운 점
  let closestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));    // paddle.y ~ paddle.y + paddle.height 범위 내에서 ball.y와 가장 가까운 점

  // 2. 공의 중심에서 가장 가까운 점까지의 거리 계산
  let distanceX = ball.x - closestX;
  let distanceY = ball.y - closestY;
  let distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // 3. 거리가 공의 반지름보다 작거나 같으면 충돌
  const hit = distanceSquared <= ball.radius * ball.radius;

  return hit;
}
