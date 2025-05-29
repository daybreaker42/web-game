function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function isHit(ball, x, y, width, height) {
  // 원형 공과 사각형 벽돌의 정확한 충돌 감지 로직 구현
  // 1. 공의 중심에서 가장 가까운 벽돌 상의 점 찾기
  // x - 벽돌의 왼쪽 끝~오른쪽 끝 범위 내에서 x와 가장 가까운 점
  // y - 벽돌의 위쪽 끝~아래쪽 끝 범위 내에서 y와 가장 가까운 점
  let closestX = Math.max(x, Math.min(ball.x, x + width));
  let closestY = Math.max(y, Math.min(ball.y, y + height));

  // 2. 공의 중심에서 가장 가까운 점까지의 거리 계산
  let distanceX = ball.x - closestX;
  let distanceY = ball.y - closestY;
  let distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // 3. 거리가 공의 반지름보다 작거나 같으면 충돌
  const hit = distanceSquared <= ball.radius * ball.radius;

  return hit;
}
